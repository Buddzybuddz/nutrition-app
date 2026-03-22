let state = {
    profile: null,
    history: {},
    currentViewDate: new Date().toLocaleDateString('fr-FR'),
    customActivities: [],
    weighIns: []
};

const STORAGE_KEY = 'nutridash_state';

function getActiveLog() {
    if (!state.history) state.history = {};
    if (!state.currentViewDate) state.currentViewDate = new Date().toLocaleDateString('fr-FR');
    if (!state.history[state.currentViewDate]) {
        state.history[state.currentViewDate] = {
            date: state.currentViewDate,
            consumedCals: 0,
            consumedProtein: 0,
            bonusTDEE: 0,
            entries: []
        };
    }
    return state.history[state.currentViewDate];
}

// Load initial state
function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const tempState = JSON.parse(saved);
        if (tempState.todayLog && Object.keys(tempState.history || {}).length === 0) {
            // Migration
            state.profile = tempState.profile;
            state.customActivities = tempState.customActivities || [];
            if (!state.history) state.history = {};
            if (tempState.todayLog) {
                tempState.todayLog.entries.forEach(e => {
                    if (!e.id) e.id = Date.now() + Math.random();
                });
                state.history[tempState.todayLog.date] = tempState.todayLog;
            }
        } else {
            state = tempState;
        }
    }
    
    if (!state.customActivities) state.customActivities = [];
    if (!state.weighIns) state.weighIns = [];
    state.currentViewDate = new Date().toLocaleDateString('fr-FR');
    getActiveLog(); // Ensure it exists
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Sync to cloud if available
    if (typeof syncToCloud === 'function') {
        syncToCloud();
    }
}

// BMR & TDEE Calculations
function calculateAge(birthDateString) {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function calculateMifflinStJeor(gender, weight, height, age) {
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

function getLatestWeight() {
    if (state.weighIns && state.weighIns.length > 0) {
        const sorted = [...state.weighIns].sort((a, b) => {
            const ap = a.date.split('/'), bp = b.date.split('/');
            if (ap.length === 3 && bp.length === 3) {
                return new Date(bp[2], bp[1]-1, bp[0]) - new Date(ap[2], ap[1]-1, ap[0]);
            }
            return b.timestamp - a.timestamp;
        });
        return sorted[0].weight;
    }
    return state.profile ? state.profile.weight : 0;
}

function updateProfileData() {
    if (!state.profile) return;
    const weight = getLatestWeight();
    state.profile.bmr = calculateMifflinStJeor(
        state.profile.gender, 
        weight, 
        state.profile.height, 
        state.profile.age
    );
    state.profile.tdee = state.profile.bmr * state.profile.activity;
    saveState();
}

// UI Elements
const viewProfile = document.getElementById('profile-view');
const viewDashboard = document.getElementById('dashboard-view');
const navBtns = document.querySelectorAll('.nav-btn');

const dpBmr = document.getElementById('display-bmr');
const dpTdee = document.getElementById('display-tdee');
const profileStats = document.getElementById('profile-stats');

const calsRemaining = document.getElementById('cals-remaining');
const calsGoal = document.getElementById('cals-goal');
const calsConsumed = document.getElementById('cals-consumed');
const proteinTotal = document.getElementById('protein-total');
const progressCircle = document.getElementById('calorie-progress');

function renderActivityOptions() {
    const actSelect = document.getElementById('activity-select');
    if (!actSelect) return;
    
    actSelect.innerHTML = '<option value="" disabled selected>Choisissez une activité...</option>';
    
    const defaultActivities = [
        { name: 'Marche (30 min)', cals: 150 },
        { name: 'Course à pied (30 min)', cals: 300 },
        { name: 'Vélo (30 min)', cals: 250 },
        { name: 'Natation (30 min)', cals: 200 },
        { name: 'Musculation (1h)', cals: 400 },
        { name: 'Sports collectifs (1h)', cals: 500 }
    ];

    defaultActivities.forEach(act => {
        const option = document.createElement('option');
        option.value = act.cals;
        option.setAttribute('data-name', act.name);
        option.textContent = `${act.name} - ${act.cals} kcal`;
        actSelect.appendChild(option);
    });

    if (state.customActivities && state.customActivities.length > 0) {
        const group = document.createElement('optgroup');
        group.label = "Mes activités";
        state.customActivities.forEach(act => {
            const option = document.createElement('option');
            option.value = act.cals;
            option.setAttribute('data-name', act.name);
            option.textContent = `${act.name} - ${act.cals} kcal`;
            group.appendChild(option);
        });
        actSelect.appendChild(group);
    }
    
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.setAttribute('data-name', 'Autre');
    customOption.textContent = 'Autre (Créer une activité)...';
    actSelect.appendChild(customOption);
}

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target;
        if (target === 'profile-view') {
            viewDashboard.classList.add('hidden');
            if (document.getElementById('history-view')) document.getElementById('history-view').classList.add('hidden');
            viewProfile.classList.remove('hidden');
            populateProfileForm();
        } else if (target === 'history-view') {
            if (!state.profile) {
                alert("Veuillez d'abord configurer votre profil.");
                btn.classList.remove('active');
                document.querySelector('[data-target="profile-view"]').classList.add('active');
                return;
            }
            viewDashboard.classList.add('hidden');
            viewProfile.classList.add('hidden');
            document.getElementById('history-view').classList.remove('hidden');
            if (window.renderHistoryChart) window.renderHistoryChart();
        } else {
            if (!state.profile) {
                alert("Veuillez d'abord configurer votre profil.");
                btn.classList.remove('active');
                document.querySelector('[data-target="profile-view"]').classList.add('active');
                return;
            }
            viewProfile.classList.add('hidden');
            if (document.getElementById('history-view')) document.getElementById('history-view').classList.add('hidden');
            viewDashboard.classList.remove('hidden');
            updateDashboard();
        }
    });
});

// Profile Form
document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const bd = document.getElementById('birthDate').value;
    state.profile = {
        birthDate: bd,
        age: calculateAge(bd),
        gender: document.getElementById('gender').value,
        weight: parseFloat(document.getElementById('weight').value),
        height: parseInt(document.getElementById('height').value),
        activity: 1.2, // Niveau sédentaire utilisé par défaut
        weighInDay: parseInt(document.getElementById('weighInDay').value)
    };
    updateProfileData();
    populateProfileForm();
    alert('Profil sauvegardé!');
    document.querySelector('[data-target="dashboard-view"]').click();
});

function populateProfileForm() {
    if (state.profile) {
        if (state.profile.birthDate) {
            document.getElementById('birthDate').value = state.profile.birthDate;
        } else if (state.profile.age) {
            const estBirthYear = new Date().getFullYear() - state.profile.age;
            document.getElementById('birthDate').value = `${estBirthYear}-01-01`;
        }
        document.getElementById('gender').value = state.profile.gender;
        document.getElementById('weight').value = state.profile.weight;
        document.getElementById('height').value = state.profile.height;
        document.getElementById('weighInDay').value = state.profile.weighInDay !== undefined ? state.profile.weighInDay : 1;
        
        dpBmr.textContent = Math.round(state.profile.bmr) + " kcal";
        dpTdee.textContent = Math.round(state.profile.tdee) + " kcal";
        profileStats.classList.remove('hidden');
    }
}

// Dashboard Logic
document.getElementById('meal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('meal-type').options[document.getElementById('meal-type').selectedIndex].text;
    const cals = parseInt(document.getElementById('meal-cals').value);
    const prot = parseFloat(document.getElementById('meal-protein').value);

    const editId = e.target.dataset.editingId;
    const actLog = getActiveLog();
    if (editId) {
        const entry = actLog.entries.find(e => e.id == editId);
        if (entry) {
            actLog.consumedCals -= entry.cals;
            actLog.consumedProtein -= entry.prot;
            entry.name = type;
            entry.cals = cals;
            entry.prot = prot;
            actLog.consumedCals += cals;
            actLog.consumedProtein += prot;
        }
        delete e.target.dataset.editingId;
        e.target.querySelector('button[type="submit"]').textContent = 'Ajouter le repas';
    } else {
        actLog.consumedCals += cals;
        actLog.consumedProtein += prot;
        actLog.entries.push({ id: Date.now() + Math.random(), type: 'Repas', name: type, cals, prot });
    }
    
    saveState();
    updateDashboard();
    e.target.reset();
    if(window.closeMealModal) window.closeMealModal();
});

const activitySelect = document.getElementById('activity-select');
const customActivityGroup = document.getElementById('custom-activity-group');
const activityDesc = document.getElementById('activity-desc');
const activityBurn = document.getElementById('activity-burn');

if (activitySelect) {
    activitySelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            customActivityGroup.style.display = 'block';
            activityDesc.required = true;
            activityBurn.value = '';
        } else {
            customActivityGroup.style.display = 'none';
            activityDesc.required = false;
            activityBurn.value = val;
        }
    });
}

document.getElementById('activity-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let desc = '';
    
    if (activitySelect) {
        if (activitySelect.value === 'custom') {
            desc = activityDesc.value || 'Activité';
        } else {
            const selectedOption = activitySelect.options[activitySelect.selectedIndex];
            desc = selectedOption.getAttribute('data-name');
        }
    } else {
        desc = activityDesc.value || 'Activité';
    }
    
    const burn = parseInt(activityBurn.value);
    
    const activitySave = document.getElementById('activity-save');
    if (activitySelect && activitySelect.value === 'custom' && activitySave && activitySave.checked) {
        if (!state.customActivities) state.customActivities = [];
        state.customActivities.push({ name: desc, cals: burn });
        renderActivityOptions();
    }

    const editId = e.target.dataset.editingId;
    const actLog = getActiveLog();
    if (editId) {
        const entry = actLog.entries.find(e => e.id == editId);
        if (entry) {
            actLog.bonusTDEE -= entry.cals;
            entry.name = desc;
            entry.cals = burn;
            actLog.bonusTDEE += burn;
        }
        delete e.target.dataset.editingId;
        e.target.querySelector('button[type="submit"]').textContent = 'Ajouter l\'activité';
    } else {
        actLog.bonusTDEE += burn;
        actLog.entries.push({ id: Date.now() + Math.random(), type: 'Activité', name: desc, cals: burn });
    }
    
    saveState();
    updateDashboard();
    e.target.reset();
    
    if (customActivityGroup) {
        customActivityGroup.style.display = 'none';
        activityDesc.required = false;
        if (activitySave) activitySave.checked = false;
    }
    if(window.closeActivityModal) window.closeActivityModal();
});

window.deleteEntry = function(id) {
    if(!confirm("Supprimer cette entrée ?")) return;
    const actLog = getActiveLog();
    const idx = actLog.entries.findIndex(e => e.id === id);
    if(idx === -1) return;
    const entry = actLog.entries[idx];
    if(entry.type === 'Repas') {
        actLog.consumedCals -= entry.cals;
        actLog.consumedProtein -= entry.prot;
    } else if (entry.type === 'Activité') {
        actLog.bonusTDEE -= entry.cals;
    } else if (entry.type === 'Objectif') {
        state.profile.objective = '';
    }
    actLog.entries.splice(idx, 1);
    saveState();
    updateDashboard();
}

window.editEntry = function(id) {
    const actLog = getActiveLog();
    const idx = actLog.entries.findIndex(e => e.id === id);
    if(idx === -1) return;
    const entry = actLog.entries[idx];
    
    if(entry.type === 'Repas') {
        const typeSelect = document.getElementById('meal-type');
        for(let i=0; i<typeSelect.options.length; i++) {
            if(typeSelect.options[i].text === entry.name) typeSelect.selectedIndex = i;
        }
        document.getElementById('meal-cals').value = entry.cals;
        document.getElementById('meal-protein').value = entry.prot;
        document.getElementById('meal-form').dataset.editingId = id;
        document.getElementById('meal-form').querySelector('button[type="submit"]').textContent = 'Enregistrer la modification';
        if(window.openMealModal) window.openMealModal(true);
    } else if (entry.type === 'Activité') {
        const actSelect = document.getElementById('activity-select');
        actSelect.value = 'custom';
        const customActivityGroup = document.getElementById('custom-activity-group');
        if(customActivityGroup) customActivityGroup.style.display = 'block';
        document.getElementById('activity-desc').required = true;
        document.getElementById('activity-desc').value = entry.name;
        document.getElementById('activity-burn').value = entry.cals;
        document.getElementById('activity-form').dataset.editingId = id;
        document.getElementById('activity-form').querySelector('button[type="submit"]').textContent = 'Enregistrer la modification';
        if(window.openActivityModal) window.openActivityModal(true);
    } else if (entry.type === 'Objectif') {
        document.getElementById('objective-select').value = entry.value;
        if(window.openObjectiveModal) window.openObjectiveModal();
    }
}

window.openMealModal = function(editMode = false) {
    const modal = document.getElementById('meal-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if(!editMode) {
        document.getElementById('meal-form').reset();
        delete document.getElementById('meal-form').dataset.editingId;
        document.getElementById('meal-form').querySelector('button[type="submit"]').textContent = 'Ajouter le repas';
    }
}
window.closeMealModal = function() {
    const modal = document.getElementById('meal-modal');
    if (modal) modal.classList.add('hidden');
}

window.openActivityModal = function(editMode = false) {
    const modal = document.getElementById('activity-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if(!editMode) {
        document.getElementById('activity-form').reset();
        delete document.getElementById('activity-form').dataset.editingId;
        document.getElementById('activity-form').querySelector('button[type="submit"]').textContent = 'Ajouter l\'activité';
        const customActivityGroup = document.getElementById('custom-activity-group');
        if (customActivityGroup) customActivityGroup.style.display = 'none';
        document.getElementById('activity-desc').required = false;
    }
}
window.closeActivityModal = function() {
    const modal = document.getElementById('activity-modal');
    if (modal) modal.classList.add('hidden');
}

window.openObjectiveModal = function() {
    const modal = document.getElementById('objective-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const objSelect = document.getElementById('objective-select');
    if (objSelect && state.profile && state.profile.objective) {
        objSelect.value = state.profile.objective;
    }
}
window.closeObjectiveModal = function() {
    const modal = document.getElementById('objective-modal');
    if (modal) modal.classList.add('hidden');
}

// Fermeture au clic à l'extérieur
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });
});

const objectiveForm = document.getElementById('objective-form');
if (objectiveForm) {
    objectiveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const objSelect = document.getElementById('objective-select');
        if (objSelect && state.profile) {
            state.profile.objective = objSelect.value;
            
            const actLog = getActiveLog();
            actLog.entries = actLog.entries.filter(en => en.type !== 'Objectif');
            
            let nameText = 'Défaut';
            let calsText = '0%';
            if (objSelect.value === 'seche') { nameText = 'Sèche'; calsText = '-10%'; }
            else if (objSelect.value === 'masse') { nameText = 'Prise de masse'; calsText = '+10%'; }
            
            actLog.entries.push({
                id: Date.now() + Math.random(),
                type: 'Objectif',
                name: nameText,
                calsText: calsText,
                value: objSelect.value
            });
            
            saveState();
            updateDashboard();
        }
        if (window.closeObjectiveModal) window.closeObjectiveModal();
    });
}

function updateDashboard() {
    if (!state.profile) return;
    
    const actLog = getActiveLog();
    
    const dateStr = actLog.date;
    const todayStr = new Date().toLocaleDateString('fr-FR');
    let displayDate = dateStr === todayStr ? "Aujourd'hui" : dateStr;
    document.getElementById('current-date').textContent = " - " + displayDate;
    
    // Weigh-in Card Logic
    const weighCard = document.getElementById('weigh-in-card');
    if (weighCard) {
        const parts = dateStr.split('/');
        let d;
        if (parts.length === 3) d = new Date(parts[2], parts[1]-1, parts[0]);
        else d = new Date(dateStr);
        
        if (d.getDay() === state.profile.weighInDay) {
            weighCard.style.display = 'flex';
            const existingWeigh = state.weighIns.find(w => w.date === dateStr);
            if (existingWeigh) {
                weighCard.innerHTML = `
                    <div>
                        <h3 style="border:none; margin:0; font-size:1.5rem; color: var(--accent-success);">✅ Pesée : <strong>${existingWeigh.weight} kg</strong></h3>
                    </div>
                    <button type="button" class="btn" style="width:auto; padding:0.5rem 1rem; font-size:0.9rem;" onclick="window.editWeighIn()">✎ Modifier</button>`;
            } else {
                weighCard.innerHTML = `
                    <div>
                        <h3 style="border:none; margin:0; font-size:1.5rem;">C'est l'heure de votre pesée ! ⚖️</h3>
                    </div>
                    <div style="display:flex; gap:1rem; align-items:center;">
                        <input type="number" id="weigh-input" step="0.1" min="10" max="300" placeholder="Ex: 75.5" style="width: 150px;">
                        <button type="button" class="btn btn-primary" style="width:auto; padding: 0.75rem 1rem;" onclick="window.saveWeighIn()">Valider</button>
                    </div>`;
            }
        } else {
            weighCard.style.display = 'none';
        }
    }
    
    const obj = state.profile.objective || '';
    let multiplier = 1.0;
    if (obj === 'seche') multiplier = 0.9;
    if (obj === 'masse') multiplier = 1.1;

    const baseTdee = state.profile.tdee * multiplier;
    const targetTdee = baseTdee + actLog.bonusTDEE;
    const remaining = targetTdee - actLog.consumedCals;
    
    calsGoal.textContent = Math.round(targetTdee);
    calsConsumed.textContent = Math.round(actLog.consumedCals);
    
    // Protein Logic
    const targetProtein = getLatestWeight() * 2;
    const consumedProtein = actLog.consumedProtein;
    const remainingProtein = targetProtein - consumedProtein;
    
    document.getElementById('protein-goal').textContent = Math.round(targetProtein);
    document.getElementById('protein-consumed').textContent = Math.round(consumedProtein);
    
    const proteinCircle = document.getElementById('protein-progress');
    const proteinRemainingEl = document.getElementById('protein-remaining');
    
    let percProtein = consumedProtein / targetProtein;
    if (percProtein > 1) percProtein = 1;
    let degProtein = percProtein * 360;
    
    if (remainingProtein <= 0) {
        proteinRemainingEl.textContent = "0";
        proteinRemainingEl.nextElementSibling.innerHTML = 'g';
        proteinCircle.style.background = `conic-gradient(var(--accent-primary) 360deg, #ffffff 0deg)`;
    } else {
        proteinRemainingEl.textContent = Math.round(Math.abs(remainingProtein));
        proteinRemainingEl.nextElementSibling.innerHTML = 'g';
        // Use a pink/red accent for protein (var(--accent-primary) is #ff6b6b)
        proteinCircle.style.background = `conic-gradient(var(--accent-primary) ${degProtein}deg, #ffffff ${degProtein}deg)`;
    }

    // Progress circle (0 to 360 deg) for calories
    let percentage = actLog.consumedCals / targetTdee;
    if (percentage > 1) percentage = 1;
    let degrees = percentage * 360;
    
    if (remaining < 0) {
        progressCircle.classList.add('danger');
        calsRemaining.textContent = Math.round(Math.abs(remaining));
        document.querySelector('.remaining-label').innerHTML = 'dépassement<br>kcal';
        progressCircle.style.background = `conic-gradient(var(--accent-danger) 360deg, var(--bg-main) 0deg)`;
    } else {
        progressCircle.classList.remove('danger');
        calsRemaining.textContent = Math.round(remaining);
        document.querySelector('.remaining-label').innerHTML = 'kcal';
        progressCircle.style.background = `conic-gradient(var(--accent-secondary) ${degrees}deg, var(--bg-main) ${degrees}deg)`;
    }

    // Render history
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    if (actLog.entries.length === 0) {
        list.innerHTML = `<li class="empty-state">Aucun repas ou activité saisi pour ${displayDate.toLowerCase()}.</li>`;
    } else {
        // reversed so newest is on top
        [...actLog.entries].reverse().forEach(entry => {
            const li = document.createElement('li');
            li.className = `history-item ${entry.type === 'Activité' ? 'activity' : ''}`;
            
            let details = '';
            if (entry.type === 'Repas') {
                details = `<strong>${entry.cals} kcal</strong> | ${entry.prot}g prot`;
            } else if (entry.type === 'Activité') {
                details = `<strong>+${entry.cals} kcal</strong> brulées`;
            } else if (entry.type === 'Objectif') {
                details = `Ajustement de <strong>${entry.calsText}</strong> du TDEE affiché`;
            }

            li.innerHTML = `
                <div class="history-title-group">
                    <div class="history-title">${entry.name}</div>
                    <div class="history-details">${details}</div>
                </div>
                <div class="history-actions">
                    <button type="button" class="btn-edit" onclick="editEntry(${entry.id})" title="Modifier">✎</button>
                    <button type="button" class="btn-delete" onclick="deleteEntry(${entry.id})" title="Supprimer">✕</button>
                </div>
            `;
            list.appendChild(li);
        });
    }
}

// Init (called by auth.js after authentication)
function init() {
    loadState();
    renderActivityOptions();
    if (!state.profile) {
        // Force profile view initially
        viewDashboard.classList.add('hidden');
        viewProfile.classList.remove('hidden');
        document.querySelector('[data-target="dashboard-view"]').classList.remove('active');
        document.querySelector('[data-target="profile-view"]').classList.add('active');
    } else {
        updateDashboard();
    }
}

window.changeDate = function(offset) {
    const parts = state.currentViewDate.split('/');
    let d;
    if (parts.length === 3) {
        d = new Date(parts[2], parts[1]-1, parts[0]);
    } else {
        d = new Date(state.currentViewDate);
    }
    d.setDate(d.getDate() + offset);
    state.currentViewDate = d.toLocaleDateString('fr-FR');
    updateDashboard();
}

window.saveWeighIn = function() {
    const wInput = document.getElementById('weigh-input');
    if(!wInput || !wInput.value) return;
    const w = parseFloat(wInput.value);
    
    state.profile.weight = w;
    
    const existingIdx = state.weighIns.findIndex(wi => wi.date === state.currentViewDate);
    if (existingIdx !== -1) {
        state.weighIns[existingIdx].weight = w;
        state.weighIns[existingIdx].timestamp = Date.now();
    } else {
        state.weighIns.push({ date: state.currentViewDate, weight: w, timestamp: Date.now() });
    }
    
    updateProfileData();
    updateDashboard();
};

window.editWeighIn = function() {
    const weighCard = document.getElementById('weigh-in-card');
    if (!weighCard) return;
    const existing = state.weighIns.find(w => w.date === state.currentViewDate);
    weighCard.innerHTML = `
        <div>
            <h3 style="border:none; margin:0; font-size:1.5rem;">Modifier votre pesée ⚖️</h3>
        </div>
        <div style="display:flex; gap:1rem; align-items:center;">
            <input type="number" id="weigh-input" step="0.1" min="10" max="300" value="${existing ? existing.weight : ''}" style="width: 150px;">
            <button type="button" class="btn btn-primary" style="width:auto; padding: 0.75rem 1rem;" onclick="window.saveWeighIn()">Valider</button>
        </div>`;
};

let chartInstances = { weight: null, calories: null, protein: null };

function parseDateFR(dateStr) {
    const p = dateStr.split('/');
    if (p.length === 3) return new Date(p[2], p[1]-1, p[0]);
    return new Date(dateStr);
}

function sortDatesFR(dates) {
    return [...dates].sort((a, b) => parseDateFR(a) - parseDateFR(b));
}

// Chart filter buttons
document.querySelectorAll('.chart-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('btn-secondary', 'active'));
        e.target.classList.add('btn-secondary', 'active');
        if (window.renderHistoryChart) {
            window.renderHistoryChart();
        }
    });
});

window.renderHistoryChart = function() {
    // Determine active filter from UI
    let activeFilter = 'week';
    const activeBtn = document.querySelector('.chart-filter-btn.active');
    if (activeBtn) {
        activeFilter = activeBtn.dataset.filter;
    }

    const now = new Date();
    let cutoffDate = new Date(0);
    
    if (activeFilter === 'week') {
        const day = now.getDay() || 7;
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - (day - 1));
        cutoffDate.setHours(0,0,0,0);
    } else if (activeFilter === 'month') {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (activeFilter === 'year') {
        cutoffDate = new Date(now.getFullYear(), 0, 1);
    }

    // --- Weight Chart ---
    const weightCanvas = document.getElementById('weightChart');
    if (weightCanvas) {
        const ctx = weightCanvas.getContext('2d');
        const sorted = [...state.weighIns].sort((a,b) => parseDateFR(a.date) - parseDateFR(b.date));
        
        const filteredWeights = sorted.filter(w => parseDateFR(w.date) >= cutoffDate);
        const labels = filteredWeights.map(w => w.date);
        const data = filteredWeights.map(w => w.weight);
        
        if (chartInstances.weight) chartInstances.weight.destroy();
        chartInstances.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Poids (kg)',
                    data,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    borderWidth: 3, tension: 0.3, fill: true,
                    pointRadius: 6, pointBackgroundColor: '#fff',
                    pointBorderColor: '#ff6b6b', pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: {
                    suggestedMin: data.length ? Math.min(...data) - 2 : 40,
                    suggestedMax: data.length ? Math.max(...data) + 2 : 100
                }}
            }
        });
    }

    // --- Calories & Protein Charts from state.history ---
    let historyDates = sortDatesFR(Object.keys(state.history || {}));
    historyDates = historyDates.filter(dateStr => parseDateFR(dateStr) >= cutoffDate);
    
    const obj = (state.profile && state.profile.objective) || 'maintien';
    let multiplier = 1.0;
    if (obj === 'seche') multiplier = 0.9;
    if (obj === 'masse') multiplier = 1.1;
    const baseTdee = state.profile ? state.profile.tdee * multiplier : 0;
    const targetProtein = getLatestWeight() * 2;

    const calLabels = [];
    const calGoalData = [];
    const calConsumedData = [];
    const protGoalData = [];
    const protConsumedData = [];

    historyDates.forEach(dateKey => {
        const log = state.history[dateKey];
        calLabels.push(dateKey);
        const dayTarget = baseTdee + (log.bonusTDEE || 0);
        calGoalData.push(Math.round(dayTarget));
        calConsumedData.push(Math.round(log.consumedCals || 0));
        protGoalData.push(Math.round(targetProtein));
        protConsumedData.push(parseFloat((log.consumedProtein || 0).toFixed(1)));
    });

    // --- Calories Chart ---
    const calCanvas = document.getElementById('caloriesChart');
    if (calCanvas) {
        const ctx = calCanvas.getContext('2d');
        if (chartInstances.calories) chartInstances.calories.destroy();
        chartInstances.calories = new Chart(ctx, {
            type: 'line',
            data: {
                labels: calLabels,
                datasets: [
                    {
                        label: 'Objectif (kcal)',
                        data: calGoalData,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.15)',
                        borderWidth: 3, tension: 0.3, fill: true,
                        pointRadius: 5, pointBackgroundColor: '#fff',
                        pointBorderColor: '#4ecdc4', pointBorderWidth: 2
                    },
                    {
                        label: 'Réalisé (kcal)',
                        data: calConsumedData,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.15)',
                        borderWidth: 3, tension: 0.3, fill: true,
                        pointRadius: 5, pointBackgroundColor: '#fff',
                        pointBorderColor: '#ff6b6b', pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // --- Protein Chart ---
    const protCanvas = document.getElementById('proteinChart');
    if (protCanvas) {
        const ctx = protCanvas.getContext('2d');
        if (chartInstances.protein) chartInstances.protein.destroy();
        chartInstances.protein = new Chart(ctx, {
            type: 'line',
            data: {
                labels: calLabels,
                datasets: [
                    {
                        label: 'Objectif (g)',
                        data: protGoalData,
                        borderColor: '#9b59b6',
                        backgroundColor: 'rgba(155, 89, 182, 0.15)',
                        borderWidth: 3, tension: 0.3, fill: true,
                        pointRadius: 5, pointBackgroundColor: '#fff',
                        pointBorderColor: '#9b59b6', pointBorderWidth: 2
                    },
                    {
                        label: 'Réalisé (g)',
                        data: protConsumedData,
                        borderColor: '#ffa502',
                        backgroundColor: 'rgba(255, 165, 2, 0.15)',
                        borderWidth: 3, tension: 0.3, fill: true,
                        pointRadius: 5, pointBackgroundColor: '#fff',
                        pointBorderColor: '#ffa502', pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
};

// init() is now called by auth.js after authentication

// Effet de scroll pour le bandeau supérieur sur mobile
function handleMobileScroll() {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const mainContent = document.querySelector('.main-content');
            const scrollTop = window.scrollY || document.documentElement.scrollTop || (mainContent ? mainContent.scrollTop : 0);
            if (scrollTop > 40) {
                sidebar.classList.add('scrolled');
            } else {
                sidebar.classList.remove('scrolled');
            }
        }
    }
}
window.addEventListener('scroll', handleMobileScroll);
const mainContent = document.querySelector('.main-content');
if (mainContent) {
    mainContent.addEventListener('scroll', handleMobileScroll);
}

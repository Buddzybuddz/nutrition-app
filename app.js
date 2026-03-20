// Data Models & State
let state = {
    profile: null,
    todayLog: {
        date: new Date().toLocaleDateString(),
        consumedCals: 0,
        consumedProtein: 0,
        bonusTDEE: 0,
        entries: []
    },
    customActivities: []
};

const STORAGE_KEY = 'nutridash_state';

// Load initial state
function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state = JSON.parse(saved);
        if (!state.customActivities) state.customActivities = [];
        if (state.todayLog && state.todayLog.entries) {
            state.todayLog.entries.forEach(e => {
                if (!e.id) e.id = Date.now() + Math.random();
            });
        }
        // Reset log if a new day starts
        const todayStr = new Date().toLocaleDateString();
        if (state.todayLog.date !== todayStr) {
            state.todayLog = {
                date: todayStr,
                consumedCals: 0,
                consumedProtein: 0,
                bonusTDEE: 0,
                entries: []
            };
            saveState();
        }
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// BMR & TDEE Calculations
function calculateMifflinStJeor(gender, weight, height, age) {
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

function updateProfileData() {
    if (!state.profile) return;
    state.profile.bmr = calculateMifflinStJeor(
        state.profile.gender, 
        state.profile.weight, 
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
            viewProfile.classList.remove('hidden');
            populateProfileForm();
        } else {
            if (!state.profile) {
                alert("Veuillez d'abord configurer votre profil.");
                btn.classList.remove('active');
                document.querySelector('[data-target="profile-view"]').classList.add('active');
                return;
            }
            viewProfile.classList.add('hidden');
            viewDashboard.classList.remove('hidden');
            updateDashboard();
        }
    });
});

// Profile Form
document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.profile = {
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        weight: parseFloat(document.getElementById('weight').value),
        height: parseInt(document.getElementById('height').value),
        activity: parseFloat(document.getElementById('activity').value)
    };
    updateProfileData();
    populateProfileForm();
    alert('Profil sauvegardé!');
    document.querySelector('[data-target="dashboard-view"]').click();
});

function populateProfileForm() {
    if (state.profile) {
        document.getElementById('age').value = state.profile.age;
        document.getElementById('gender').value = state.profile.gender;
        document.getElementById('weight').value = state.profile.weight;
        document.getElementById('height').value = state.profile.height;
        document.getElementById('activity').value = state.profile.activity;
        
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
    if (editId) {
        const entry = state.todayLog.entries.find(e => e.id == editId);
        if (entry) {
            state.todayLog.consumedCals -= entry.cals;
            state.todayLog.consumedProtein -= entry.prot;
            entry.name = type;
            entry.cals = cals;
            entry.prot = prot;
            state.todayLog.consumedCals += cals;
            state.todayLog.consumedProtein += prot;
        }
        delete e.target.dataset.editingId;
        e.target.querySelector('button[type="submit"]').textContent = 'Ajouter le repas';
    } else {
        state.todayLog.consumedCals += cals;
        state.todayLog.consumedProtein += prot;
        state.todayLog.entries.push({ id: Date.now() + Math.random(), type: 'Repas', name: type, cals, prot });
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
    if (editId) {
        const entry = state.todayLog.entries.find(e => e.id == editId);
        if (entry) {
            state.todayLog.bonusTDEE -= entry.cals;
            entry.name = desc;
            entry.cals = burn;
            state.todayLog.bonusTDEE += burn;
        }
        delete e.target.dataset.editingId;
        e.target.querySelector('button[type="submit"]').textContent = 'Ajouter l\'activité';
    } else {
        state.todayLog.bonusTDEE += burn;
        state.todayLog.entries.push({ id: Date.now() + Math.random(), type: 'Activité', name: desc, cals: burn });
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
    const idx = state.todayLog.entries.findIndex(e => e.id === id);
    if(idx === -1) return;
    const entry = state.todayLog.entries[idx];
    if(entry.type === 'Repas') {
        state.todayLog.consumedCals -= entry.cals;
        state.todayLog.consumedProtein -= entry.prot;
    } else {
        state.todayLog.bonusTDEE -= entry.cals;
    }
    state.todayLog.entries.splice(idx, 1);
    saveState();
    updateDashboard();
}

window.editEntry = function(id) {
    const idx = state.todayLog.entries.findIndex(e => e.id === id);
    if(idx === -1) return;
    const entry = state.todayLog.entries[idx];
    
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
    } else {
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

// Fermeture au clic à l'extérieur
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });
});

function updateDashboard() {
    if (!state.profile) return;
    
    document.getElementById('current-date').textContent = " - " + state.todayLog.date;
    
    const targetTdee = state.profile.tdee + state.todayLog.bonusTDEE;
    const remaining = targetTdee - state.todayLog.consumedCals;
    
    calsGoal.textContent = Math.round(targetTdee);
    calsConsumed.textContent = Math.round(state.todayLog.consumedCals);
    
    proteinTotal.textContent = state.todayLog.consumedProtein.toFixed(1);

    // Progress circle (0 to 360 deg)
    let percentage = state.todayLog.consumedCals / targetTdee;
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
    if (state.todayLog.entries.length === 0) {
        list.innerHTML = '<li class="empty-state">Aucun repas ou activité saisi aujourd\'hui.</li>';
    } else {
        // reversed so newest is on top
        [...state.todayLog.entries].reverse().forEach(entry => {
            const li = document.createElement('li');
            li.className = `history-item ${entry.type === 'Activité' ? 'activity' : ''}`;
            
            let details = '';
            if (entry.type === 'Repas') {
                details = `<strong>${entry.cals} kcal</strong> | ${entry.prot}g prot`;
            } else {
                details = `<strong>+${entry.cals} kcal</strong> brulées`;
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

// Init
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

init();

let state = {
    profile: null,
    history: {},
    currentViewDate: "", // Sera initialisé dans init() ou loadState()
    customActivities: [],
    weighIns: [],
    goalHistory: []
};

let STORAGE_KEY = 'nutridash_state_none';

/**
 * Définit l'identifiant utilisateur pour isoler le stockage localStorage.
 */
window.setUserId = function(userId) {
    if (userId) {
        STORAGE_KEY = `nutridash_state_${userId}`;
        console.log(`Clé de stockage mise à jour : ${STORAGE_KEY}`);
    } else {
        STORAGE_KEY = 'nutridash_state_none';
    }
};

/**
 * Réinitialise l'état en mémoire pour éviter les fuites entre sessions.
 */
window.clearLocalData = function() {
    state.profile = null;
    state.history = {};
    state.currentViewDate = formatISOLocal(new Date());
    state.customActivities = [];
    state.weighIns = [];
    state.goalHistory = [];
    console.log("État mémoire réinitialisé.");
};

function getActiveLog() {
    if (!state.history) state.history = {};
    if (!state.currentViewDate) state.currentViewDate = formatISOLocal(new Date());
    if (!state.history[state.currentViewDate]) {
        state.history[state.currentViewDate] = {
            date: state.currentViewDate,
            consumedCals: 0,
            consumedProtein: 0,
            bonusTDEE: 0,
            entries: [],
            // Snapshots des réglages au moment du jour J
            baseTDEE: (state.profile ? state.profile.tdee : 0),
            goal: (state.profile ? state.profile.goal : 'maintenance'),
            goalMultiplier: (state.profile ? (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0)) : 1.0)
        };
    }
    return state.history[state.currentViewDate];
}

// Load initial state
function loadState() {
    if (STORAGE_KEY === 'nutridash_state_none') return;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const tempState = JSON.parse(saved);
            // On fusionne prudemment pour ne pas écraser les objets de base si tempState est corrompu
            if (tempState.profile) state.profile = tempState.profile;
            if (tempState.history) state.history = tempState.history;
            if (tempState.customActivities) state.customActivities = tempState.customActivities;
            if (tempState.weighIns) state.weighIns = tempState.weighIns;
            
            console.log("État chargé depuis le stockage local spécialisé.");
        } catch (e) {
            console.error("Erreur lors du chargement du localStorage", e);
        }
    }
    
    if (!state.customActivities) state.customActivities = [];
    if (!state.weighIns) state.weighIns = [];
    state.currentViewDate = formatISOLocal(new Date());
    getActiveLog(); 
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Sync to cloud if available
    if (typeof syncToCloud === 'function' && currentUser) {
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
    if (gender === 'male' || gender === 'Homme') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

function getLatestWeight() {
    if (state.weighIns && state.weighIns.length > 0) {
        // Tri décroissant sur les chaînes ISO pour avoir le plus récent en premier
        const sorted = [...state.weighIns].sort((a, b) => b.date.localeCompare(a.date));
        return sorted[0].weight;
    }
    return state.profile ? state.profile.weight : 0;
}

function findClosestWeight(targetDate) {
    if (!state.weighIns || state.weighIns.length === 0) return state.profile ? state.profile.weight : 0;
    
    let closestVal = state.profile ? state.profile.weight : 0;
    let minDiff = Infinity;
    const targetMs = (targetDate instanceof Date) ? targetDate.getTime() : new Date(targetDate).getTime();
    
    state.weighIns.forEach(win => {
        const d = parseDateFR(win.date);
        if (!isNaN(d.getTime())) {
            const diff = Math.abs(d.getTime() - targetMs);
            if (diff < minDiff) {
                minDiff = diff;
                closestVal = win.weight;
            }
        }
    });
    return closestVal;
}

function updateProfileData(silent = false) {
    if (!state.profile) return;
    
    // Sécurité : recalculer l'âge si manquant
    if (state.profile.birthDate && (!state.profile.age || isNaN(state.profile.age))) {
        state.profile.age = calculateAge(state.profile.birthDate);
    }
    
    const weight = getLatestWeight();
    state.profile.bmr = calculateMifflinStJeor(
        state.profile.gender, 
        weight, 
        state.profile.height, 
        state.profile.age
    );
    
    // Le TDEE de base est maintenant BMR * 1.2 (sédentaire)
    state.profile.tdee = state.profile.bmr * 1.2;
    
    // Mise à jour du "snapshot" pour la date active visualisée
    // Cela garantit que modifier le profil impacte le jour en cours d'édition
    const activeDateStr = state.currentViewDate || formatISOLocal(new Date());
    if (state.history && state.history[activeDateStr]) {
        const log = state.history[activeDateStr];
        log.baseTDEE = state.profile.tdee;
        log.goal = state.profile.goal;
        log.goalMultiplier = (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0));
    }
    
    if (!silent) saveState();
}

function calculateIdealWeight(height, gender) {
    if (!height) return 0;
    // Utilisation d'un IMC de 22 comme cible "idéale" simplifiée
    const heightM = height / 100;
    return Math.round((22 * heightM * heightM) * 10) / 10;
}

function checkGoalReached(newWeight) {
    if (!state.profile || state.profile.goal !== 'loss' || !state.profile.targetWeight) return false;
    return newWeight <= state.profile.targetWeight;
}

function showGoalReachedMessage() {
    const modal = document.getElementById('goal-reached-modal');
    if (modal) modal.classList.remove('hidden');
}

window.closeGoalReachedModal = function() {
    const modal = document.getElementById('goal-reached-modal');
    if (modal) modal.classList.add('hidden');
};

window.redirectToProfile = function() {
    window.closeGoalReachedModal();
    const profileBtn = document.querySelector('[onclick="switchView(\'profile-view\')"]');
    if (profileBtn) profileBtn.click();
};

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

    if (state.customActivities && state.customActivities.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = "Mes activités";
        state.customActivities.forEach(act => {
            const option = document.createElement('option');
            option.value = act.cals;
            option.setAttribute('data-name', act.name);
            option.textContent = `${act.name} - ${act.cals} kcal`;
            customGroup.appendChild(option);
        });
        actSelect.appendChild(customGroup);
    }
    
    const defaultActivities = [
        { name: 'Marche (30 min)', cals: 150 },
        { name: 'Course à pied (30 min)', cals: 300 },
        { name: 'Vélo (30 min)', cals: 250 },
        { name: 'Natation (30 min)', cals: 200 },
        { name: 'Musculation (1h)', cals: 400 },
        { name: 'Sports collectifs (1h)', cals: 500 }
    ];

    const standardGroup = document.createElement('optgroup');
    standardGroup.label = "Activités standards";
    
    defaultActivities.forEach(act => {
        const option = document.createElement('option');
        option.value = act.cals;
        option.setAttribute('data-name', act.name);
        option.textContent = `${act.name} - ${act.cals} kcal`;
        standardGroup.appendChild(option);
    });
    actSelect.appendChild(standardGroup);
    
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.setAttribute('data-name', 'Autre');
    customOption.textContent = 'Autre (Créer une activité)...';
    actSelect.appendChild(customOption);
}

// --- Routing ---
window.routes = {
    'landingpage': { section: 'landing-page' },
    'login': { section: 'auth-screen' },
    'tableaudebord': { section: 'app', view: 'dashboard-view' },
    'profil': { section: 'app', view: 'profile-view' },
    'historique': { section: 'app', view: 'history-view' },
    'conseils': { section: 'app', view: 'advice-view' }
};

window.navigateTo = function(slug, updateHistory = true) {
    console.log(`Navigation vers: ${slug} (updateHistory: ${updateHistory})`);
    const route = window.routes[slug];
    if (!route) {
        console.warn(`Route non trouvée pour: ${slug}, redirection vers landingpage`);
        return window.navigateTo('landingpage');
    }

    // Validation profil pour les vues de l'app (sauf profil lui-même)
    if (route.section === 'app' && !state.profile && slug !== 'profil') {
        console.log("Accès app refusé: profil manquant. Redirection vers profil.");
        // Désactivation visuelle des autres boutons si le profil est manquant
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target !== 'profile-view') btn.style.opacity = '0.5';
        });
        return window.navigateTo('profil');
    }

    // Réinitialisation de l'opacité si le profil existe
    if (state.profile) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.style.opacity = '1');
    }

    // Mise à jour de l'URL hash
    if (updateHistory && window.location.hash !== `#${slug}`) {
        window.location.hash = slug;
    }

    // Masquage de toutes les sections principales
    const sectionIds = ['landing-page', 'auth-screen', 'app'];
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Affichage de la section cible
    const targetSection = document.getElementById(route.section);
    if (targetSection) targetSection.classList.remove('hidden');

    // Gestion des vues internes si on est dans l'app
    if (route.section === 'app' && route.view) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const targetView = document.getElementById(route.view);
        if (targetView) targetView.classList.remove('hidden');

        // Mise à jour des boutons de navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === route.view);
        });

        // Logique spécifique aux vues
        if (route.view === 'profile-view') {
            if (typeof populateProfileForm === 'function') populateProfileForm();
        } else if (route.view === 'history-view') {
            if (window.renderSuivi) window.renderSuivi();
        } else if (route.view === 'dashboard-view') {
            if (typeof updateDashboard === 'function') updateDashboard();
        } else if (route.view === 'advice-view') {
            if (typeof showRandomTip === 'function') showRandomTip();
        }
    }
};

window.addEventListener('hashchange', () => {
    const slug = window.location.hash.replace('#', '') || 'landingpage';
    console.log(`Hashchange détecté: ${slug}`);
    window.navigateTo(slug, false);
});

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetView = btn.dataset.target;
        // Trouver le slug correspondant à cette vue
        const slug = Object.keys(window.routes).find(s => window.routes[s].view === targetView);
        if (slug) window.navigateTo(slug);
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
        goal: document.getElementById('goal').value,
        targetWeight: document.getElementById('targetWeight').value ? parseFloat(document.getElementById('targetWeight').value) : null,
        activity: 1.2, // Niveau sédentaire utilisé par défaut
        weighInDay: parseInt(document.getElementById('weighInDay').value)
    };
    updateProfileData();
    populateProfileForm();
    
    // Historisation de l'objectif et du poids
    if (currentUser) {
        if (typeof pb_logGoalChange === 'function') {
            pb_logGoalChange(state.profile.goal);
        }
        if (typeof pb_saveWeighIn === 'function') {
            const todayStr = new Date().toISOString().split('T')[0];
            pb_saveWeighIn({ date: todayStr, weight: state.profile.weight });
        }
    }
    
    // Vérification de l'objectif
    if (checkGoalReached(state.profile.weight)) {
        showGoalReachedMessage();
    } else {
        alert('Profil sauvegardé!');
    }
    
    document.querySelector('[data-target="dashboard-view"]').click();
});

const goalSelect = document.getElementById('goal');
if (goalSelect) {
    goalSelect.addEventListener('change', (e) => {
        const targetGroup = document.getElementById('target-weight-group');
        if (e.target.value === 'loss') {
            targetGroup.classList.remove('hidden');
        } else {
            targetGroup.classList.add('hidden');
        }
    });
}

const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const genderSelect = document.getElementById('gender');
const idealWeightSuggestion = document.getElementById('ideal-weight-suggestion');

function updateIdealWeightLabel() {
    const h = parseInt(heightInput.value);
    const g = genderSelect.value;
    if (h && idealWeightSuggestion) {
        const ideal = calculateIdealWeight(h, g);
        idealWeightSuggestion.textContent = `Suggéré : ${ideal} kg`;
        idealWeightSuggestion.dataset.value = ideal;
    }
}

function updateLivePreview() {
    const birthday = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseInt(document.getElementById('height').value);
    
    if (birthday && gender && weight && height) {
        const age = calculateAge(birthday);
        const bmr = calculateMifflinStJeor(gender, weight, height, age);
        const tdee = bmr * 1.2;
        
        dpBmr.textContent = Math.round(bmr) + " kcal";
        dpTdee.textContent = Math.round(tdee) + " kcal";
        profileStats.classList.remove('hidden');
    }
}

if (heightInput) heightInput.addEventListener('input', () => { updateIdealWeightLabel(); updateLivePreview(); });
if (weightInput) weightInput.addEventListener('input', updateLivePreview);
if (genderSelect) genderSelect.addEventListener('change', () => { updateIdealWeightLabel(); updateLivePreview(); });
if (document.getElementById('birthDate')) document.getElementById('birthDate').addEventListener('change', updateLivePreview);
if (idealWeightSuggestion) {
    idealWeightSuggestion.addEventListener('click', () => {
        const targetWInput = document.getElementById('targetWeight');
        if (targetWInput && idealWeightSuggestion.dataset.value) {
            targetWInput.value = idealWeightSuggestion.dataset.value;
        }
    });
}

function populateProfileForm() {
    if (state.profile) {
        if (state.profile.birthDate) {
            // PocketBase renvoie YYYY-MM-DD HH:mm:ss, l'input date veut YYYY-MM-DD
            document.getElementById('birthDate').value = state.profile.birthDate.substring(0, 10);
        } else if (state.profile.age) {
            const estBirthYear = new Date().getFullYear() - state.profile.age;
            document.getElementById('birthDate').value = `${estBirthYear}-01-01`;
        }
        document.getElementById('gender').value = state.profile.gender;
        document.getElementById('weight').value = state.profile.weight;
        document.getElementById('height').value = state.profile.height;
        document.getElementById('weighInDay').value = state.profile.weighInDay !== undefined ? state.profile.weighInDay : 1;
        
        if (state.profile.goal) {
            document.getElementById('goal').value = state.profile.goal;
            if (state.profile.goal === 'loss') {
                document.getElementById('target-weight-group').classList.remove('hidden');
                if (state.profile.targetWeight) {
                    document.getElementById('targetWeight').value = state.profile.targetWeight;
                }
            } else {
                document.getElementById('target-weight-group').classList.add('hidden');
            }
        }
        updateIdealWeightLabel();
        
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
            const mealType = document.getElementById('meal-type').value; // Valeur interne (ex: "Breakfast")
            actLog.consumedCals -= entry.cals;
            actLog.consumedProtein -= entry.prot;
            entry.name = type; // Nom d'affichage
            entry.mealType = mealType;
            entry.cals = cals;
            entry.prot = prot;
            actLog.consumedCals += cals;
            actLog.consumedProtein += prot;
            
            // Sync modification si l'ID est un ID PocketBase (string)
            if (currentUser && typeof editId === 'string' && editId.length > 5) {
                if (typeof pb_saveMeal === 'function') {
                    pb_saveMeal(entry);
                }
            }
        }
        delete e.target.dataset.editingId;
        e.target.querySelector('button[type="submit"]').textContent = 'Ajouter le repas';
    } else {
        const mealType = document.getElementById('meal-type').value;
        const newEntry = { id: Date.now() + Math.random(), type: 'Repas', name: type, mealType, cals, prot };
        actLog.consumedCals += cals;
        actLog.consumedProtein += prot;
        actLog.entries.push(newEntry);
        
        // Sync individuel immédiat si connecté
        if (typeof pb_saveMeal === 'function' && currentUser) {
            pb_saveMeal(newEntry).then(pbRecord => {
                if (pbRecord && pbRecord.id) {
                    newEntry.id = pbRecord.id;
                    saveState(); // Sauvegarde avec le nouvel ID
                }
            });
        }
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

            // Sync modification si l'ID est un ID PocketBase (string)
            if (currentUser && typeof editId === 'string' && editId.length > 5) {
                if (typeof pb_saveActivity === 'function') {
                    pb_saveActivity(entry);
                }
            }
        }
        delete e.target.dataset.editingId;
        e.target.querySelector('button[type="submit"]').textContent = 'Ajouter l\'activité';
    } else {
        const newEntry = { id: Date.now() + Math.random(), type: 'Activité', name: desc, cals: burn };
        actLog.bonusTDEE += burn;
        actLog.entries.push(newEntry);

        // Sync individuel immédiat si connecté
        if (typeof pb_saveActivity === 'function' && typeof currentUser !== 'undefined' && currentUser) {
            pb_saveActivity(newEntry).then(pbRecord => {
                if (pbRecord && pbRecord.id) {
                    newEntry.id = pbRecord.id;
                    saveState(); // Sauvegarde avec le nouvel ID
                }
            });
        }
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
    
    // Sync Suppression
    if (currentUser && typeof pb_deleteEntry === 'function') {
        pb_deleteEntry(id, entry.type);
    }

    if(entry.type === 'Repas') {
        actLog.consumedCals -= entry.cals;
        actLog.consumedProtein -= entry.prot;
    } else if (entry.type === 'Activité') {
        actLog.bonusTDEE -= entry.cals;
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
        if (entry.mealType) {
            typeSelect.value = entry.mealType;
        } else {
            // Compatibilité ascendante : recherche par nom
            for(let i=0; i<typeSelect.options.length; i++) {
                if(typeSelect.options[i].text === entry.name) typeSelect.selectedIndex = i;
            }
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

        // Sélection intelligente du prochain repas
        const actLog = getActiveLog();
        const loggedNames = actLog.entries.filter(e => e.type === 'Repas').map(e => e.name);
        const typeSelect = document.getElementById('meal-type');
        
        if (typeSelect) {
            if (!loggedNames.includes("Petit-déjeuner")) {
                typeSelect.value = "breakfast";
            } else if (!loggedNames.includes("Déjeuner")) {
                typeSelect.value = "lunch";
            } else if (!loggedNames.includes("Dîner")) {
                typeSelect.value = "dinner";
            } else {
                typeSelect.value = "snack";
            }
        }
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


// Tips Logic
const TIPS = [
    "L'eau glacée peut légèrement augmenter votre métabolisme car le corps dépense de l'énergie pour la réchauffer.",
    "La sensation de faim est souvent un signal de déshydratation déguisé. Buvez un verre d'eau avant de grignoter.",
    "Manger dans des assiettes plus petites trompe le cerveau et aide à se sentir rassasié plus vite.",
    "Le manque de sommeil augmente la ghréline, l'hormone qui stimule l'appétit pour les aliments gras et sucrés.",
    "Les fibres (légumes, fruits) ralentissent la digestion et stabilisent votre niveau d'énergie.",
    "Il faut environ 20 minutes à votre cerveau pour recevoir le signal de satiété provenant de votre estomac.",
    "Le piment peut booster temporairement votre métabolisme grâce à la capsaïcine.",
    "Les protéines sont les nutriments les plus rassasiants et demandent le plus d'énergie pour être digérés."
];

function showRandomTip() {
    const container = document.getElementById('random-tip-container');
    if (!container) return;
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    container.innerHTML = `
        <span class="tip-title">💡 Le saviez-vous ?</span>
        <p class="tip-content">${tip}</p>
    `;
}


function updateDashboard() {
    if (!state.profile) return;
    
    // S'assurer que les activités (standards + custom) sont à jour
    renderActivityOptions();

    const actLog = getActiveLog();
    const dateStr = actLog.date;
    const todayStr = formatISOLocal(new Date());
    let displayDate = dateStr === todayStr ? "Aujourd'hui" : formatDateFR(dateStr);
    document.getElementById('current-date').textContent = " - " + displayDate;

    // 1. Common Date Object for today or selected date
    const dVal = parseDateFR(dateStr);

    // Daily Process Progress Logic
    const progressFill = document.getElementById('daily-progress-fill');
    const progressPerc = document.getElementById('daily-progress-percentage');
    const progressStatus = document.getElementById('daily-progress-status');

    if (progressFill && progressPerc && progressStatus) {
        // 1. Determine mandatory items for today
        const mandatorySequence = [];
        const isWeighInDay = state.profile && dVal.getDay() === state.profile.weighInDay;
        
        if (isWeighInDay) mandatorySequence.push("Pesée");
        mandatorySequence.push("Petit-déjeuner", "Déjeuner", "Dîner");

        // 2. Check which items are completed
        const completedItems = [];
        if (isWeighInDay) {
            const hasWeighIn = state.weighIns && state.weighIns.some(w => w.date === dateStr);
            if (hasWeighIn) completedItems.push("Pesée");
        }

        const entries = actLog.entries || [];
        const loggedMeals = entries.filter(e => e.type === 'Repas').map(e => e.name);
        ["Petit-déjeuner", "Déjeuner", "Dîner"].forEach(m => {
            if (loggedMeals.includes(m)) completedItems.push(m);
        });

        // 3. Calculate percentage
        const processPercVal = Math.round((completedItems.length / mandatorySequence.length) * 100);
        progressFill.style.width = processPercVal + '%';
        progressPerc.textContent = processPercVal + '%';

        // 4. Generate dynamic status text
        const nextStep = mandatorySequence.find(s => !completedItems.includes(s));
        
        if (processPercVal === 100) {
            progressStatus.textContent = "Objectif Nutritionnel atteint ! Toutes les étapes sont validées. 🏆";
        } else {
            let status = "";
            if (completedItems.length > 0) {
                const boldCompleted = completedItems.map(item => `<b>${item}</b>`);
                status = boldCompleted.join(", ") + " validé(s). ";
            }
            if (nextStep) {
                status += `Prochaine étape : <b>${nextStep}</b>`;
            }
            progressStatus.innerHTML = status;
        }
    }
    
    // Weigh-in Card Logic
    const weighCard = document.getElementById('weigh-in-card');
    if (weighCard) {
        if (dVal.getDay() === state.profile.weighInDay) {
            weighCard.style.display = 'flex';
            const existingWeigh = state.weighIns.find(w => w.date === dateStr);
            if (existingWeigh) {
                weighCard.innerHTML = `
                    <div class="weigh-in-text">
                        <h3 style="border:none; margin:0; font-size:1.5rem; color: var(--accent-success);">✅ Pesée : <strong>${existingWeigh.weight} kg</strong></h3>
                    </div>
                    <div class="weigh-in-actions">
                        <button type="button" class="btn" onclick="window.editWeighIn()">✎ Modifier</button>
                        <button type="button" class="btn btn-danger" onclick="window.deleteWeighIn()">✕ Effacer</button>
                    </div>`;
            } else {
                weighCard.innerHTML = `
                    <div class="weigh-in-text">
                        <h3 style="border:none; margin:0; font-size:1.5rem;">C'est l'heure de votre pesée ! ⚖️</h3>
                    </div>
                    <div class="weigh-in-actions">
                        <input type="number" id="weigh-input" step="0.1" min="10" max="300" placeholder="Ex: 75.5">
                        <button type="button" class="btn btn-primary" onclick="window.saveWeighIn()">Valider</button>
                    </div>`;
            }
        } else {
            weighCard.style.display = 'none';
        }
    }
    
    // Journée active si elle contient des repas ou du bonus TDEE (activités)
    const isDayActive = (actLog.entries && actLog.entries.length > 0) || (actLog.bonusTDEE && actLog.bonusTDEE !== 0);
    const isToday = (dateStr === formatISOLocal(new Date()));


    // Récupération des réglages : 
    // - Si c'est AUJOURD'HUI : On utilise TOUJOURS les réglages du profil pour rester à jour (pesées, etc.)
    // - Si Jour Inactif : On utilise le profil (initialisation)
    // - Si Jour Actif passé : On garde le Snapshot original pour l'historique
    let baseTdee, goalMultiplier, goalName;

    if (isDayActive && actLog.baseTDEE && !isToday) {
        // Jour PASSE avec historique réel : on garde ce qui a été enregistré pour ce jour J
        baseTdee = actLog.baseTDEE;
        goalMultiplier = actLog.goalMultiplier || 1.0;
        goalName = actLog.goal || 'maintenance';
    } else {
        // AUJOURD'HUI ou Jour sans historique : on utilise les réglages du profil à jour
        const currentTdee = state.profile ? state.profile.tdee : 0;
        const currentGoal = state.profile ? state.profile.goal : 'maintenance';
        const currentMultiplier = state.profile ? (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0)) : 1.0;
        
        // Si les valeurs en mémoire sont différentes du profil (ex: nouvelle pesée aujourd'hui), on synchronise
        // IMPORTANT : On ne force la sauvegarde automatique QUE pour "Aujourd'hui".
        // Pour les jours futurs, on laisse l'affichage dynamique sans polluer la BDD.
        if (isToday && (actLog.baseTDEE !== currentTdee || actLog.goal !== currentGoal)) {
            actLog.baseTDEE = currentTdee;
            actLog.goal = currentGoal;
            actLog.goalMultiplier = currentMultiplier;
            
            // On sauvegarde localement ce qui déclenchera syncToCloud si connecté
            if (typeof saveState === 'function') saveState();
        }


        baseTdee = currentTdee;
        goalName = currentGoal;
        goalMultiplier = currentMultiplier;
    }




    // Mise à jour du rappel d'objectif sur le dashboard
    const reminder = document.getElementById('dashboard-goal-reminder');
    const reminderText = document.getElementById('dashboard-goal-text');
    if (reminder && reminderText) {
        reminder.style.display = 'block';
        let label = "Maintien du poids (0%)";
        if (goalName === 'loss') label = "Perte de poids / Sèche (-10%)";
        if (goalName === 'gain') label = "Prise de masse propre (+10%)";
        reminderText.textContent = label;
    }

    // Formule : (TDEE de base * multiplicateur d'objectif) + activités saisies
    const targetTdee = (baseTdee * goalMultiplier) + actLog.bonusTDEE;
    const remaining = targetTdee - actLog.consumedCals;
    
    if (calsGoal) calsGoal.textContent = Math.round(targetTdee);
    if (calsConsumed) calsConsumed.textContent = Math.round(actLog.consumedCals);
    
    // Protein Logic : 2g par kg de poids de corps actuel
    const currentWeight = getLatestWeight();
    const targetProtein = currentWeight * 2;
    const consumedProtein = actLog.consumedProtein;
    const remainingProtein = targetProtein - consumedProtein;
    
    const pGoalEl = document.getElementById('protein-goal');
    const pConsEl = document.getElementById('protein-consumed');
    if (pGoalEl) pGoalEl.textContent = Math.round(targetProtein);
    if (pConsEl) pConsEl.textContent = Math.round(consumedProtein);
    
    const proteinCircle = document.getElementById('protein-progress');
    const proteinRemainingEl = document.getElementById('protein-remaining');
    
    if (proteinCircle && proteinRemainingEl) {
        let percProtein = consumedProtein / targetProtein;
        if (percProtein > 1) percProtein = 1;
        let degProtein = percProtein * 360;
        
        if (remainingProtein <= 0) {
            proteinRemainingEl.textContent = "0";
            proteinCircle.style.background = `conic-gradient(var(--accent-primary) 360deg, #ffffff 0deg)`;
        } else {
            proteinRemainingEl.textContent = Math.round(Math.abs(remainingProtein));
            proteinCircle.style.background = `conic-gradient(var(--accent-primary) ${degProtein}deg, #ffffff ${degProtein}deg)`;
        }
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
                    <button type="button" class="btn-edit" onclick="editEntry('${entry.id}')" title="Modifier">✎</button>
                    <button type="button" class="btn-delete" onclick="deleteEntry('${entry.id}')" title="Supprimer">✕</button>
                </div>
            `;
            list.appendChild(li);
        });
    }
}

// Init (called by auth.js after authentication)
window.init = function() {
    loadState();
    if (state.profile) {
        // Recalcul forcé silencieux (sans sauvegarder vers le cloud immédiatement)
        updateProfileData(true);
    }
    renderActivityOptions();
    if (!state.profile) {
        // Force profile view initially
        viewDashboard.classList.add('hidden');
        viewProfile.classList.remove('hidden');
        document.querySelector('[data-target="dashboard-view"]').classList.remove('active');
        document.querySelector('[data-target="profile-view"]').classList.add('active');
    } else {
        updateDashboard();
        populateProfileForm();
    }
}

function formatISOLocal(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

window.changeDate = async function(offset) {
    const d = parseDateFR(state.currentViewDate);
    d.setDate(d.getDate() + offset);
    const newDateStr = formatISOLocal(d);
    state.currentViewDate = newDateStr;

    // Charger les données du jour si non présentes
    if (typeof currentUser !== 'undefined' && currentUser && typeof loadDayData === 'function') {
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView) dashboardView.style.opacity = '0.5'; // Feedback visuel de chargement
        await loadDayData(newDateStr);
        if (dashboardView) dashboardView.style.opacity = '1';
    }

    updateDashboard();
}

window.saveWeighIn = function() {
    const wInput = document.getElementById('weigh-input');
    if(!wInput || !wInput.value) return;
    const w = parseFloat(wInput.value);
    
    state.profile.weight = w;
    
    const winObj = { date: state.currentViewDate, weight: w, timestamp: Date.now() };
    const existingIdx = state.weighIns.findIndex(wi => wi.date === state.currentViewDate);
    if (existingIdx !== -1) {
        state.weighIns[existingIdx].weight = w;
        state.weighIns[existingIdx].timestamp = Date.now();
    } else {
        state.weighIns.push(winObj);
    }
    
    if (typeof pb_saveWeighIn === 'function' && currentUser) {
        pb_saveWeighIn(winObj);
    }

    updateProfileData();
    updateDashboard();
    
    if (checkGoalReached(w)) {
        showGoalReachedMessage();
    }
};

window.editWeighIn = function() {
    const weighCard = document.getElementById('weigh-in-card');
    if (!weighCard) return;
    const existing = state.weighIns.find(w => w.date === state.currentViewDate);
    weighCard.innerHTML = `
        <div class="weigh-in-text">
            <h3 style="border:none; margin:0; font-size:1.5rem;">Modifier votre pesée ⚖️</h3>
        </div>
        <div class="weigh-in-actions">
            <input type="number" id="weigh-input" step="0.1" min="10" max="300" value="${existing ? existing.weight : ''}">
            <button type="button" class="btn btn-primary" onclick="window.saveWeighIn()">Valider</button>
        </div>`;
};

window.deleteWeighIn = function() {
    if (!confirm("Voulez-vous vraiment effacer cette pesée ?")) return;
    
    const idx = state.weighIns.findIndex(wi => wi.date === state.currentViewDate);
    if (idx !== -1) {
        state.weighIns.splice(idx, 1);
        saveState();
        updateDashboard();
        alert("Pesée effacée.");
    }
};

// Suivi filter listener
const suiviFilter = document.getElementById('suivi-filter');
if (suiviFilter) {
    suiviFilter.addEventListener('change', () => {
        if (window.renderSuivi) window.renderSuivi();
    });
}

// Helper functions for date handling 
function parseDateFR(dateStr) {
    if (!dateStr) return new Date(0);
    dateStr = dateStr.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    
    // Test format ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00");
    }

    const p = dateStr.split(/[\/\-\.]/);
    if (p.length === 3) {
        if (p[2].length === 4) { // FR: DD/MM/YYYY
            return new Date(p[2], parseInt(p[1], 10)-1, p[0]);
        } else if (p[0].length === 4) { // ISO: YYYY/MM/DD
            return new Date(p[0], parseInt(p[1], 10)-1, p[2]);
        }
    }
    return new Date(dateStr);
}

function sortDatesFR(dates) {
    return [...dates].sort((a, b) => parseDateFR(a) - parseDateFR(b));
}

function formatDateFR(date, short = false) {
    if (!date) return "";
    const d = (date instanceof Date) ? date : new Date(date);
    if (short) {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR');
}

window.renderSuivi = function() {
    const filterEl = document.getElementById('suivi-filter');
    if (!filterEl) return;
    const activeFilter = filterEl.value;
    
    const now = new Date();
    let cutoffDate = new Date(now);
    
    if (activeFilter === 'week') {
        const day = now.getDay() || 7;
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - (day - 1));
        cutoffDate.setHours(0,0,0,0);
    } else {
        const days = parseInt(activeFilter); 
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - days + 1);
        cutoffDate.setHours(0,0,0,0);
    }
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Affichage des dates précises dans l'interface
    const periodDatesEl = document.getElementById('suivi-period-dates');
    if (periodDatesEl) {
        periodDatesEl.textContent = `(du ${formatDateFR(cutoffDate)} au ${formatDateFR(endDate)})`;
    }

    // 1. Weight boundaries (Strict within period - Option B)
    const weightAtStart = findClosestWeight(cutoffDate);
    const weightAtEnd = findClosestWeight(endDate);
    const wDiffVal = weightAtEnd - weightAtStart;

    // UI Update Weight Card (Compact)
    const wStartValEl = document.getElementById('suivi-weight-start-val');
    const wStartDateEl = document.getElementById('suivi-weight-start-date');
    const wEndValEl = document.getElementById('suivi-weight-end-val');
    const wEndDateEl = document.getElementById('suivi-weight-end-date');
    const wDiffEl = document.getElementById('suivi-weight-diff');

    if (wStartValEl) {
        wStartValEl.textContent = weightAtStart + ' kg';
        wStartDateEl.textContent = 'Début période';
        wEndValEl.textContent = weightAtEnd + ' kg';
        wEndDateEl.textContent = 'Fin période';
        
        const sign = wDiffVal > 0 ? '+' : '';
        wDiffEl.textContent = sign + wDiffVal.toFixed(1) + ' kg';
        wDiffEl.style.color = wDiffVal > 0 ? 'var(--accent-warning)' : (wDiffVal < 0 ? 'var(--accent-success)' : 'var(--text-main)');
    }

    // 2. Process Calories & Proteins with Majority Objective
    let historyKeys = Object.keys(state.history || {});
    const goalFreq = {};
    const dailyLogs = [];
    const targetProtein = getLatestWeight() * 2;
    
    let defaultGoalMultiplier = 1.0;
    if (state.profile && state.profile.goal === 'loss') defaultGoalMultiplier = 0.9;
    if (state.profile && state.profile.goal === 'gain') defaultGoalMultiplier = 1.1;

    // Define effective loop start
    let firstEntryDate = null;
    if (state.history) {
        const entryDates = Object.keys(state.history)
            .filter(k => {
                const log = state.history[k];
                return log && (log.consumedCals > 0 || log.consumedProt > 0 || (log.entries && log.entries.length > 0));
            })
            .map(k => parseDateFR(k))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a - b);
        if (entryDates.length > 0) {
            firstEntryDate = entryDates[0];
            firstEntryDate.setHours(0, 0, 0, 0);
        }
    }

    let loopStart = new Date(cutoffDate);
    if (firstEntryDate && firstEntryDate > loopStart) {
        loopStart = new Date(firstEntryDate);
    }
    loopStart.setHours(0,0,0,0);

    const periods = [];
    let currentPeriod = null;
    let loopDate = new Date(loopStart);

    const todayStr = formatISOLocal(new Date());

    while (loopDate <= endDate) {

        const dStr = formatISOLocal(loopDate);
        const log = state.history[dStr];

        const isActive = log && ((log.entries && log.entries.length > 0) || (log.bonusTDEE && log.bonusTDEE !== 0));

        // Priorité : Profil actuel si jour vide, sinon Snapshot (ou historique des objectifs)
        let dayGoal, dayBaseTdee, dayGoalMultiplier;

        if (isActive && log.baseTDEE && dStr !== todayStr) {

            dayBaseTdee = log.baseTDEE;
            dayGoal = log.goal || 'maintenance';
            dayGoalMultiplier = log.goalMultiplier !== undefined ? log.goalMultiplier : (dayGoal === 'loss' ? 0.9 : (dayGoal === 'gain' ? 1.1 : 1.0));
        } else {
            // Jour inactif : On utilise les valeurs ACTUELLES du profil
            dayBaseTdee = state.profile ? state.profile.tdee : 0;
            dayGoal = state.profile ? state.profile.goal : 'maintenance';
            dayGoalMultiplier = state.profile ? (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0)) : 1.0;
        }

        const bonus = (isActive && log.bonusTDEE) ? log.bonusTDEE : 0;
        const staticTarget = Math.round(dayBaseTdee * dayGoalMultiplier);


        goalFreq[dayGoal] = (goalFreq[dayGoal] || 0) + 1;
        dailyLogs.push({
            consumedCals: (log && log.consumedCals) || 0,
            consumedProt: (log && log.consumedProtein) || 0,
            baseTDEE: dayBaseTdee,
            bonus: bonus,
            goal: dayGoal,
            multiplier: dayGoalMultiplier
        });

        const shortDate = formatDateFR(loopDate, true);
        if (!currentPeriod || currentPeriod.goal !== dayGoal || currentPeriod.cals !== staticTarget) {
            if (currentPeriod) periods.push(currentPeriod);
            currentPeriod = { start: shortDate, end: shortDate, goal: dayGoal, cals: staticTarget, prot: targetProtein };
        } else {
            currentPeriod.end = shortDate;
        }
        loopDate.setDate(loopDate.getDate() + 1);
    }
    if (currentPeriod) periods.push(currentPeriod);

    // Identify majority goal
    let majorityGoal = 'maintenance';
    let maxCount = -1;
    for (const g in goalFreq) { if (goalFreq[g] > maxCount) { maxCount = goalFreq[g]; majorityGoal = g; } }
    const majorityMultiplier = majorityGoal === 'loss' ? 0.9 : (majorityGoal === 'gain' ? 1.1 : 1.0);
    const majorityGoalName = majorityGoal === 'loss' ? 'Sèche' : (majorityGoal === 'gain' ? 'Prise de masse' : 'Maintien');

    // Calculate totals using majority multiplier
    let sumCalsConsumed = 0; let sumCalsGoal = 0;
    let sumProtConsumed = 0; let sumProtGoal = 0;
    let activeDaysCount = 0;

    dailyLogs.forEach(day => {
        // On ne comptabilise les objectifs que si l'utilisateur a saisi qqch ce jour-là
        if (day.consumedCals > 0) {
            activeDaysCount++;
            sumCalsConsumed += day.consumedCals;
            sumProtConsumed += day.consumedProt;
            // La cible est calculée selon l'objectif REEL de chaque jour pour correspondre à la saisie, 
            // tout en corrigeant la formule (base * mult) + bonus
            sumCalsGoal += Math.round((day.baseTDEE * day.multiplier) + day.bonus);
            sumProtGoal += targetProtein;
        }
    });

    // 3. UI Update: Consumption Totals
    const cConsEl = document.getElementById('suivi-cals-consumed');
    const cGoalEl = document.getElementById('suivi-cals-goal');
    const cDiffEl = document.getElementById('suivi-cals-diff');
    const pConsEl = document.getElementById('suivi-prot-consumed');
    const pGoalEl = document.getElementById('suivi-prot-goal');
    const pDiffEl = document.getElementById('suivi-prot-diff');

    if (cConsEl) {
        cConsEl.textContent = Math.round(sumCalsConsumed) + ' kcal';
        cGoalEl.textContent = Math.round(sumCalsGoal) + ' kcal';
        const cDiff = Math.round(sumCalsConsumed - sumCalsGoal);
        cDiffEl.textContent = (cDiff > 0 ? '+' : '') + cDiff + ' kcal';
        
        // Calcul de la tolérance dynamique basée sur les JOURS ACTIFS : 10 kcal par jour pour maintenance/gain
        const totalTolerance = activeDaysCount * 10;
        
        let calsMatch = false;
        if (majorityGoal === 'loss') {
            calsMatch = cDiff <= 0;
        } else {
            calsMatch = Math.abs(cDiff) <= totalTolerance;
        }
        
        cDiffEl.style.color = calsMatch ? 'var(--accent-success)' : 'var(--accent-danger)';

        pConsEl.textContent = Math.round(sumProtConsumed) + ' g';
        pGoalEl.textContent = Math.round(sumProtGoal) + ' g';
        const pDiff = Math.round(sumProtConsumed - sumProtGoal);
        pDiffEl.textContent = (pDiff > 0 ? '+' : '') + pDiff + ' g';
        pDiffEl.style.color = pDiff >= -10 ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    // 4. UI Update: Objectifs Details
    const objCard = document.getElementById('card-suivi-objectifs');
    if (objCard) {
        const history = state.goalHistory || [];
        const displayItems = [];
        
        // Trouver l'objectif actif au DEBUT de la période
        // On prend le dernier enregistrement dont la date <= loopStart
        const startMs = loopStart.getTime();
        const initialGoalEntry = [...history].reverse().find(g => new Date(g.date).getTime() <= startMs);
        
        if (initialGoalEntry) {
            displayItems.push({
                label: 'Dès le',
                date: formatDateFR(new Date(initialGoalEntry.date)),
                goal: initialGoalEntry.goal,
                isCurrent: false
            });
        } else if (history.length > 0) {
            // Si aucun avant, on prend le tout premier connu
            displayItems.push({
                label: 'Dès le',
                date: formatDateFR(new Date(history[0].date)),
                goal: history[0].goal,
                isCurrent: false
            });
        } else if (state.profile) {
            // Fallback profil
            displayItems.push({
                label: 'Dès le',
                date: 'Origine',
                goal: state.profile.goal,
                isCurrent: true
            });
        }

        // Trouver les changements DURANT la période
        const endMs = endDate.getTime();
        const changesInPeriod = history.filter(g => {
            const d = new Date(g.date).getTime();
            return d > startMs && d <= endMs;
        });

        changesInPeriod.forEach(g => {
            displayItems.push({
                label: 'Modifié le',
                date: formatDateFR(new Date(g.date)),
                goal: g.goal,
                isCurrent: false
            });
        });

        // Marquer le dernier comme "Toujours en cours" s'il correspond au profil actuel
        if (displayItems.length > 0 && state.profile) {
            const lastItem = displayItems[displayItems.length - 1];
            if (lastItem.goal === state.profile.goal) {
                lastItem.isCurrent = true;
            }
        }

        const goalNames = { 'loss': 'Sèche', 'gain': 'Prise de masse', 'maintenance': 'Maintien' };
        
        document.getElementById('suivi-objectifs-inner').innerHTML = displayItems.map(item => {
            // Estimation des calories/protéines pour cet objectif spécifiquement
            // On utilise les valeurs du profil actuel comme base de calcul simplifiée
            const multiplier = item.goal === 'loss' ? 0.9 : (item.goal === 'gain' ? 1.1 : 1.0);
            const estCals = Math.round((state.profile ? state.profile.bmr * 1.2 : 2000) * multiplier);
            const estProt = Math.round(getLatestWeight() * 2);

            return `
                <div class="obj-period-item">
                    <div class="obj-period-date">
                        ${item.label} ${item.date}
                        ${item.isCurrent ? ' <span style="color:var(--accent-success); font-size:0.75rem; margin-left:5px;">● Toujours en cours</span>' : ''}
                    </div>
                    <div class="obj-period-details">
                        ${goalNames[item.goal] || item.goal} 
                        — ${estCals} kcal | ${estProt}g prot
                    </div>
                </div>
            `;
        }).join('');
        
        objCard.classList.remove('hidden');
    }

    // 5. UI Update: Bilan Card
    const bilanCard = document.getElementById('suivi-bilan-card');
    const bilanInner = document.getElementById('suivi-bilan-inner');
    if (bilanCard && bilanInner) {
        bilanCard.classList.remove('hidden');

        // --- Icônes SVG (Style Lucide) ---
        const ICON_TARGET = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="bilan-stat-icon"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
        const ICON_PROTEIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="bilan-stat-icon"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M9 10c1.5-1 3.5-1 5 0"/><path d="M19 10c-1.5-1-3.5-1-5 0"/><path d="M12 2v6"/><path d="M12 18v4"/><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`;
        const ICON_SCALE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="bilan-footer-icon"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`;
        const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#2b8a3e"><polyline points="20 6 9 17 4 12"/></svg>`;
        const ICON_ALERT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#f59f00"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        const ICON_HANDSHAKE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;margin-right:8px;color:var(--accent-secondary)"><path d="m11 17 2 2 6-6"/><path d="m18 14 1.5 1.5"/><path d="M20 18v2"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M20 11h.01"/><path d="M12 15h.01"/><path d="M16 15h.01"/><path d="M20 15h.01"/><path d="M12 19h.01"/><path d="M16 19h.01"/><path d="M20 19h.01"/><path d="M12 7h.01"/><path d="M16 7h.01"/><path d="M20 7h.01"/><path d="M12 3h.01"/><path d="M16 3h.01"/><path d="M20 3h.01"/><path d="M3 3v18h18"/></svg>`;

        const calsDiff = sumCalsConsumed - sumCalsGoal;
        const protDiff = sumProtConsumed - sumProtGoal;
        
        const totalTolerance = activeDaysCount * 10;
        
        let calsOk = false;
        if (activeDaysCount === 0) {
            calsOk = true; 
        } else if (majorityGoal === 'loss') {
            calsOk = calsDiff <= 0;
        } else {
            calsOk = Math.abs(calsDiff) <= totalTolerance;
        }
        
        const protOk = protDiff >= -10;
        let weightOk = (majorityGoal === 'loss' && wDiffVal < 0) || (majorityGoal === 'gain' && wDiffVal > 0) || (majorityGoal === 'maintenance' && Math.abs(wDiffVal) < 0.3);

        const score = (calsOk ? 1 : 0) + (protOk ? 1 : 0) + (weightOk ? 1 : 0);
        const motivationMsg = score === 3 ? "Parfait, tu es sur la trajectoire idéale !" : 
                               score === 2 ? "Très bien, quelques ajustements et ce sera parfait." :
                               "Continue tes efforts, la constance est ton meilleur allié.";
        
        const daysAnalyzed = dailyLogs.length;
        const periodBadgeLabel = daysAnalyzed <= 1 ? "Aujourd'hui" : `Analyse : ${daysAnalyzed} jours`;

        // Détection intelligente d'un REEL changement d'objectif (pas juste une variation de calories)
        const distinctGoals = new Set(periods.map(p => p.goal));
        const hasRealGoalChange = distinctGoals.size > 1;

        bilanInner.innerHTML = `
            <div class="bilan-period-badge">${periodBadgeLabel}</div>

            ${hasRealGoalChange ? `
                <div class="bilan-warning-bar">
                    ${ICON_ALERT} 
                    <span>Changement d'objectif détecté — Analyse basée sur : <strong>${majorityGoalName}</strong></span>
                </div>` : ''}
            
            <div class="bilan-grid">
                <!-- Carte Calories -->
                <div class="bilan-stat-card calories">
                    <div class="bilan-stat-header">
                        <span>Calories</span>
                        <div class="bilan-stat-icon">${ICON_TARGET}</div>
                    </div>
                    <div class="bilan-stat-body">
                        <div class="bilan-stat-value">
                            ${Math.round(sumCalsConsumed)} <span class="bilan-stat-unit">kcal</span>
                        </div>
                        <div class="bilan-stat-target">
                            ${calsOk ? ICON_CHECK : ICON_ALERT} 
                            Objectif : <strong>${Math.round(sumCalsGoal)}</strong>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                            (${calsDiff <= 0 ? Math.abs(Math.round(calsDiff)) + ' kcal de déficit' : Math.round(calsDiff) + ' kcal de surplus'})
                        </div>
                    </div>
                </div>

                <!-- Carte Protéines -->
                <div class="bilan-stat-card proteins">
                    <div class="bilan-stat-header">
                        <span>Protéines</span>
                        <div class="bilan-stat-icon">${ICON_PROTEIN}</div>
                    </div>
                    <div class="bilan-stat-body">
                        <div class="bilan-stat-value">
                            ${Math.round(sumProtConsumed)} <span class="bilan-stat-unit">g</span>
                        </div>
                        <div class="bilan-stat-target">
                            ${protOk ? ICON_CHECK : ICON_ALERT}
                            Objectif : <strong>${Math.round(sumProtGoal)}g</strong>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                            (${protDiff >= 0 ? Math.abs(Math.round(protDiff)) + 'g bonus' : Math.abs(Math.round(protDiff)) + 'g manquants'})
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pied de page Poids & Score -->
            <div class="bilan-footer-premium">
                <div class="bilan-stat-icon" style="color:var(--accent-primary)">${ICON_SCALE}</div>
                <div style="text-align: left; flex: 1;">
                    <div style="font-size: 0.9rem;">Tendance Poids : <strong>${Math.abs(wDiffVal.toFixed(1))} kg ${wDiffVal >= 0 ? 'pris' : 'perdus'}</strong></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Score final : ${score}/3 — ${motivationMsg}</div>
                </div>
            </div>
        `;
    }
}



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

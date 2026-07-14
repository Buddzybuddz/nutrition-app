let state = {
    profile: null,
    history: {},
    currentViewDate: "",
    customActivities: [],
    weighIns: [],
    goalHistory: []
};

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message, duration) {
    duration = duration || 3000;
    var existing = document.getElementById('nd-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'nd-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--color-text-1);color:#fff;padding:12px 20px;border-radius:10px;font-family:\'Inter\',sans-serif;font-size:14px;font-weight:500;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);opacity:0;transition:opacity 0.2s ease;white-space:nowrap;pointer-events:none;';
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.style.opacity = '1'; });
    setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 220);
    }, duration);
}

let STORAGE_KEY = 'nutridash_state_none';

/**
 * Définit l'identifiant utilisateur pour isoler le stockage localStorage.
 */
window.setUserId = function(userId) {
    if (userId) {
        STORAGE_KEY = `nutridash_state_${userId}`;
        window.PB_CONFIG?.isDev && console.log(`Clé de stockage mise à jour : ${STORAGE_KEY}`);
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
    window.PB_CONFIG?.isDev && console.log("État mémoire réinitialisé.");
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
            
            window.PB_CONFIG?.isDev && console.log("État chargé depuis le stockage local spécialisé.");
        } catch (e) {
            window.PB_CONFIG?.isDev && console.error("Erreur lors du chargement du localStorage", e);
        }
    }
    
    if (!state.customActivities) state.customActivities = [];
    if (!state.weighIns) state.weighIns = [];
    state.currentViewDate = formatISOLocal(new Date());
    getActiveLog(); 
}

function saveState() {
    // Règle de priorité : localStorage = cache en écriture seulement.
    // Au login, loadFromCloud() écrase toujours l'état local avec les données PocketBase (cloud wins).
    // Si syncToCloud() échoue, les données restent dans localStorage mais seront perdues au prochain login.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof syncToCloud === 'function' && currentUser) {
        syncToCloud();
    }
}

// BMR & TDEE Calculations

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

    // Afficher/masquer le lien de gestion selon si des custom existent
    const manageLink = document.getElementById('manage-custom-activities-link');
    if (manageLink) {
        manageLink.style.display = (state.customActivities && state.customActivities.length > 0) ? 'block' : 'none';
    }
}

// --- Gestion des activités personnalisées ---

let _editingCustomActivityIndex = -1;

window.openManageActivitiesModal = function() {
    const modal = document.getElementById('manage-activities-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderManageActivitiesList();
    cancelEditCustomActivity(); // S'assurer que le formulaire d'édition est masqué à l'ouverture
};

window.closeManageActivitiesModal = function() {
    const modal = document.getElementById('manage-activities-modal');
    if (modal) modal.classList.add('hidden');
    _editingCustomActivityIndex = -1;
};

function renderManageActivitiesList() {
    const container = document.getElementById('manage-activities-list');
    if (!container) return;

    if (!state.customActivities || state.customActivities.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem;">Aucune activité personnalisée enregistrée.</p>';
        return;
    }

    container.innerHTML = '';
    state.customActivities.forEach((act, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8f9fa; border: 2px solid var(--border-color); border-radius: var(--radius-sm);';
        item.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(act.name || '?')}</div>
                <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">${Number(act.cals) || 0} kcal</div>
            </div>
            <button type="button" class="btn-edit" onclick="startEditCustomActivity(${index})" title="Modifier" style="flex-shrink:0;">✎</button>
            <button type="button" class="btn-delete" onclick="deleteCustomActivity(${index})" title="Supprimer" style="flex-shrink:0;">✕</button>
        `;
        container.appendChild(item);
    });
}

window.startEditCustomActivity = function(index) {
    _editingCustomActivityIndex = index;
    const act = state.customActivities[index];
    if (!act) return;

    document.getElementById('edit-act-name').value = act.name || '';
    document.getElementById('edit-act-cals').value = act.cals || 0;

    const form = document.getElementById('edit-custom-activity-form');
    if (form) form.classList.remove('hidden');
};

window.cancelEditCustomActivity = function() {
    _editingCustomActivityIndex = -1;
    const form = document.getElementById('edit-custom-activity-form');
    if (form) form.classList.add('hidden');
};

window.saveEditCustomActivity = function() {
    if (_editingCustomActivityIndex < 0) return;
    const newName = document.getElementById('edit-act-name').value.trim();
    const newCals = parseInt(document.getElementById('edit-act-cals').value) || 0;

    if (!newName) {
        showToast('Veuillez saisir un nom pour l\'activité.');
        return;
    }

    state.customActivities[_editingCustomActivityIndex] = { name: newName, cals: newCals };
    saveState();
    // Forcer la sauvegarde directe dans PocketBase (contourne les éventuels blocages de syncToCloud)
    if (typeof window.pb_saveCustomActivities === 'function') window.pb_saveCustomActivities();
    renderActivityOptions();
    renderManageActivitiesList();
    cancelEditCustomActivity();
};

window.deleteCustomActivity = function(index) {
    if (!confirm('Supprimer cette activité de votre liste ?')) return;
    state.customActivities.splice(index, 1);
    saveState();
    // Forcer la sauvegarde directe dans PocketBase
    if (typeof window.pb_saveCustomActivities === 'function') window.pb_saveCustomActivities();
    renderActivityOptions();
    renderManageActivitiesList();
    // Si on était en train d'éditer cet index ou un suivant, annuler l'édition
    if (_editingCustomActivityIndex >= index) cancelEditCustomActivity();
};

// Fermeture du modal gestion au clic extérieur
document.addEventListener('DOMContentLoaded', () => {
    const manageModal = document.getElementById('manage-activities-modal');
    if (manageModal) {
        manageModal.addEventListener('click', (e) => {
            if (e.target === manageModal) window.closeManageActivitiesModal();
        });
    }
});


window.routes = {
    'landingpage': { section: 'landing-page' },
    'login': { section: 'auth-screen' },
    'tableaudebord': { section: 'app', view: 'dashboard-view' },
    'profil': { section: 'app', view: 'profile-view' },
    'historique': { section: 'app', view: 'history-view' },
    'conseils': { section: 'app', view: 'advice-view' }
};

window.navigateTo = function(slug, updateHistory = true) {
    window.PB_CONFIG?.isDev && console.log(`Navigation vers: ${slug} (updateHistory: ${updateHistory})`);
    const route = window.routes[slug];
    if (!route) {
        window.PB_CONFIG?.isDev && console.warn(`Route non trouvée pour: ${slug}, redirection vers landingpage`);
        return window.navigateTo('landingpage');
    }

    // Validation profil pour les vues de l'app (sauf profil lui-même)
    if (route.section === 'app' && !state.profile && slug !== 'profil') {
        window.PB_CONFIG?.isDev && console.log("Accès app refusé: profil manquant. Redirection vers profil.");
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
    window.PB_CONFIG?.isDev && console.log(`Hashchange détecté: ${slug}`);
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
        targetWeight: document.getElementById('targetWeight').value ? parseFloat(document.getElementById('targetWeight').value) : parseFloat(document.getElementById('weight').value),
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
        showToast('Profil sauvegardé ✓');
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
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
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
            typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}
window.closeMealModal = function() {
    const modal = document.getElementById('meal-modal');
    if (modal) modal.classList.add('hidden');
    
    // Réinitialisation du formulaire
    const form = document.getElementById('meal-form');
    if (form) form.reset();
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
            const id = overlay.id;
            if (id === 'meal-modal' && window.closeMealModal) {
                window.closeMealModal();
            } else if (id === 'activity-modal' && window.closeActivityModal) {
                window.closeActivityModal();
            } else if (id === 'weigh-in-modal' && window.closeWeighInModal) {
                window.closeWeighInModal();
            } else {
                overlay.classList.add('hidden');
            }
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
                const boldCompleted = completedItems.map(item => `<b>${escapeHtml(item)}</b>`);
                status = boldCompleted.join(", ") + " validé(s). ";
            }
            if (nextStep) {
                status += `Prochaine étape : <b>${escapeHtml(nextStep)}</b>`;
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
                        <h3 style="border:none; margin:0; font-size:1rem; font-family:'DM Sans',sans-serif; font-weight:600; color:var(--color-text-1);">Pesée enregistrée : <strong style="color:var(--color-primary);">${escapeHtml(existingWeigh.weight)} kg ✓</strong></h3>
                    </div>
                    <div class="weigh-in-actions">
                        <button type="button" onclick="window.editWeighIn()" style="height:40px;padding:0 16px;background:transparent;border:1.5px solid var(--color-primary);color:var(--color-primary);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s;">✎ Modifier</button>
                        <button type="button" onclick="window.deleteWeighIn()" style="height:40px;padding:0 16px;background:transparent;border:1.5px solid #e05555;color:#e05555;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s;">✕ Effacer</button>
                    </div>`;
            } else {
                weighCard.innerHTML = `
                    <div class="weigh-in-text">
                        <h3 style="border:none; margin:0; font-size:1.5rem;">C'est l'heure de votre pesée ! ⚖️</h3>
                    </div>
                    <div class="weigh-in-actions">
                        <input type="number" id="weigh-input" step="0.1" min="10" max="300" placeholder="Ex: 75.5">
                        <button type="button" class="weigh-in-btn" onclick="window.saveWeighIn()">Valider</button>
                    </div>`;
            }
        } else {
            weighCard.style.display = 'none';
        }
    }
    
    // Journée active si elle contient des repas ou du bonus TDEE (activités)
    const isDayActive = (actLog.entries && actLog.entries.length > 0) || (actLog.bonusTDEE && actLog.bonusTDEE !== 0);
    const isToday = (dateStr === formatISOLocal(new Date()));
    const isFuture = (dateStr > formatISOLocal(new Date())); // Jour futur (j+1, j+2, ...)


    // Récupération des réglages : 
    // - Si c'est AUJOURD'HUI : On utilise TOUJOURS les réglages du profil pour rester à jour (pesées, etc.)
    // - Si Jour FUTUR (j+1, j+2) : On utilise aussi le profil actuel (planification, jamais de snapshot figé)
    // - Si Jour Inactif passé : On utilise le profil (initialisation)
    // - Si Jour Actif PASSÉ : On garde le Snapshot original pour l'historique
    let baseTdee, goalMultiplier, goalName;

    if (isDayActive && actLog.baseTDEE && !isToday && !isFuture) {
        // Jour PASSÉ avec historique réel : on garde ce qui a été enregistré pour ce jour J
        baseTdee = actLog.baseTDEE;
        goalMultiplier = actLog.goalMultiplier || 1.0;
        goalName = actLog.goal || 'maintenance';
    } else {
        // AUJOURD'HUI, FUTUR ou Jour sans historique : on utilise les réglages du profil à jour
        const currentTdee = state.profile ? state.profile.tdee : 0;
        const currentGoal = state.profile ? state.profile.goal : 'maintenance';
        const currentMultiplier = state.profile ? (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0)) : 1.0;
        
        // Synchronisation du snapshot uniquement pour "Aujourd'hui" (pas les jours futurs pour ne pas polluer la BDD)
        if (isToday && (actLog.baseTDEE !== currentTdee || actLog.goal !== currentGoal)) {
            actLog.baseTDEE = currentTdee;
            actLog.goal = currentGoal;
            actLog.goalMultiplier = currentMultiplier;
            
            // On sauvegarde localement ce qui déclenchera syncToCloud si connecté
            if (typeof saveState === 'function') saveState();
        }

        // Pour les jours futurs actifs, on met à jour le snapshot en mémoire (sans sync cloud)
        // afin que les calculs internes (ex: suivi) soient cohérents
        if (isFuture && isDayActive && (actLog.baseTDEE !== currentTdee || actLog.goal !== currentGoal)) {
            actLog.baseTDEE = currentTdee;
            actLog.goal = currentGoal;
            actLog.goalMultiplier = currentMultiplier;
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
            proteinCircle.style.background = `conic-gradient(var(--color-primary) 360deg, var(--color-surface) 0deg)`;
        } else {
            proteinRemainingEl.textContent = Math.round(Math.abs(remainingProtein));
            proteinCircle.style.background = `conic-gradient(var(--color-primary) ${degProtein}deg, var(--color-surface) ${degProtein}deg)`;
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
        progressCircle.style.background = `conic-gradient(#C0392B 360deg, var(--color-surface) 0deg)`;
    } else {
        progressCircle.classList.remove('danger');
        calsRemaining.textContent = Math.round(remaining);
        document.querySelector('.remaining-label').innerHTML = 'kcal';
        progressCircle.style.background = `conic-gradient(var(--color-accent) ${degrees}deg, var(--color-surface) ${degrees}deg)`;
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
                details = `<strong>${escapeHtml(entry.cals)} kcal</strong> | ${escapeHtml(entry.prot)}g prot`;
            } else if (entry.type === 'Activité') {
                details = `<strong>+${escapeHtml(entry.cals)} kcal</strong> brulées`;
            } else if (entry.type === 'Objectif') {
                details = `Ajustement de <strong>${escapeHtml(entry.calsText)}</strong> du TDEE affiché`;
            }

            li.innerHTML = `
                <div class="history-title-group">
                    <div class="history-title">${escapeHtml(entry.name)}</div>
                    <div class="history-details">${details}</div>
                </div>
                <div class="history-actions">
                    <button type="button" class="btn-edit" onclick="editEntry('${escapeHtml(entry.id)}')" title="Modifier">✎</button>
                    <button type="button" class="btn-delete" onclick="deleteEntry('${escapeHtml(entry.id)}')" title="Supprimer">✕</button>
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
            <button type="button" class="weigh-in-btn" onclick="window.saveWeighIn()">Valider</button>
        </div>`;
};

window.deleteWeighIn = function() {
    if (!confirm("Voulez-vous vraiment effacer cette pesée ?")) return;
    
    const idx = state.weighIns.findIndex(wi => wi.date === state.currentViewDate);
    if (idx !== -1) {
        state.weighIns.splice(idx, 1);
        saveState();
        updateDashboard();
        showToast("Pesée effacée.");
    }
};

// Suivi period chip listeners
document.querySelectorAll('.history-period-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.history-period-chip').forEach(c => c.classList.remove('history-period-chip--active'));
        chip.classList.add('history-period-chip--active');
        if (window.renderSuivi) window.renderSuivi();
    });
});

window.renderSuivi = function() {
    const activeChip = document.querySelector('.history-period-chip--active');
    if (!activeChip) return;
    const periodDays = parseInt(activeChip.dataset.period) || 7;

    const now = new Date();
    let cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - periodDays + 1);
    cutoffDate.setHours(0, 0, 0, 0);
    
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

    // UI Update Weight Card
    const wStartEl = document.getElementById('history-weight-start');
    const wEndEl = document.getElementById('history-weight-end');
    const wDeltaEl = document.getElementById('history-weight-delta');
    const wBadgeEl = document.getElementById('history-weight-badge');

    if (weightAtStart && weightAtEnd && weightAtStart !== 0 && weightAtEnd !== 0) {
        if (wStartEl) wStartEl.textContent = weightAtStart + ' kg';
        if (wEndEl) wEndEl.textContent = weightAtEnd + ' kg';

        // Sens du poids attendu selon l'objectif du profil
        const weightGoal = state.profile ? state.profile.goal : 'maintenance';
        const MAINTENANCE_TOLERANCE = 0.5; // kg
        let onTrack;
        if (weightGoal === 'loss') {
            onTrack = wDiffVal <= 0;
        } else if (weightGoal === 'gain') {
            onTrack = wDiffVal >= 0;
        } else {
            onTrack = Math.abs(wDiffVal) <= MAINTENANCE_TOLERANCE;
        }

        if (wDeltaEl) {
            const sign = wDiffVal > 0 ? '+' : '';
            wDeltaEl.textContent = sign + wDiffVal.toFixed(1) + ' kg ' + (wDiffVal < 0 ? '↓' : '↑');
            wDeltaEl.style.color = '';
            wDeltaEl.className = 'history-weight-delta ' + (onTrack ? 'history-weight-delta--good' : 'history-weight-delta--warn');
        }
        if (wBadgeEl) {
            wBadgeEl.style.display = 'inline-flex';
            wBadgeEl.className = 'history-badge ' + (onTrack ? 'history-badge--ok' : 'history-badge--warn');
            wBadgeEl.textContent = onTrack ? '✓  Objectif atteint' : (wDiffVal > 0 ? '↑  Poids en hausse' : '↓  Poids en baisse');
        }
    } else {
        if (wStartEl) wStartEl.textContent = '—';
        if (wEndEl) wEndEl.textContent = '—';
        if (wDeltaEl) { wDeltaEl.textContent = 'Pas assez de pesées'; wDeltaEl.style.color = ''; wDeltaEl.className = 'history-weight-delta'; }
        if (wBadgeEl) wBadgeEl.style.display = 'none';
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
    const cConsEl = document.getElementById('history-cals-consumed');
    const cGoalEl = document.getElementById('history-cals-goal');
    const cDiffEl = document.getElementById('history-cals-diff');
    const cBadgeEl = document.getElementById('history-cals-badge');
    const pConsEl = document.getElementById('history-prot-consumed');
    const pGoalEl = document.getElementById('history-prot-goal');
    const pDiffEl = document.getElementById('history-prot-diff');
    const pBadgeEl = document.getElementById('history-prot-badge');

    const totalTolerance = activeDaysCount * 10;
    const cDiff = Math.round(sumCalsConsumed - sumCalsGoal);
    let calsMatch = majorityGoal === 'loss' ? cDiff <= 0 : Math.abs(cDiff) <= totalTolerance;
    const pDiff = Math.round(sumProtConsumed - sumProtGoal);
    const protMatch = pDiff >= -10;

    if (cConsEl) {
        cConsEl.textContent = Math.round(sumCalsConsumed);
        cGoalEl.textContent = Math.round(sumCalsGoal);
        cDiffEl.textContent = 'Écart : ' + (cDiff > 0 ? '+' : '') + cDiff + ' kcal';
        cDiffEl.style.color = calsMatch ? 'var(--color-primary)' : 'var(--color-accent)';
        if (cBadgeEl) { cBadgeEl.textContent = calsMatch ? '✓ Objectif atteint' : 'Continue comme ça !'; cBadgeEl.style.background = calsMatch ? 'var(--color-primary-xlight)' : 'var(--color-surface-2)'; cBadgeEl.style.color = calsMatch ? 'var(--color-primary)' : 'var(--color-text-2)'; }
    }
    if (pConsEl) {
        pConsEl.textContent = Math.round(sumProtConsumed);
        pGoalEl.textContent = Math.round(sumProtGoal);
        pDiffEl.textContent = 'Écart : ' + (pDiff > 0 ? '+' : '') + pDiff + ' g';
        pDiffEl.style.color = protMatch ? 'var(--color-primary)' : 'var(--color-accent)';
        if (pBadgeEl) { pBadgeEl.textContent = protMatch ? '✓ Objectif atteint' : 'Continue comme ça !'; pBadgeEl.style.background = protMatch ? 'var(--color-primary-xlight)' : 'var(--color-surface-2)'; pBadgeEl.style.color = protMatch ? 'var(--color-primary)' : 'var(--color-text-2)'; }
    }

    // 4. UI Update: Objectifs Details
    const objCard = document.getElementById('history-goals-list');
    if (objCard) {
        const history = state.goalHistory || [];
        const displayItems = [];
        
        // Trouver l'objectif actif au DEBUT de la période
        // On prend le dernier enregistrement dont la date <= loopStart
        const startMs = loopStart.getTime();
        const initialGoalEntry = [...history].reverse().find(g => new Date(g.date).getTime() <= startMs);
        
        if (initialGoalEntry) {
            displayItems.push({
                label: 'Depuis le',
                date: formatDateFR(new Date(initialGoalEntry.date)),
                goal: initialGoalEntry.goal,
                isCurrent: false
            });
        } else if (history.length > 0) {
            // Si aucun avant, on prend le tout premier connu
            displayItems.push({
                label: 'Depuis le',
                date: formatDateFR(new Date(history[0].date)),
                goal: history[0].goal,
                isCurrent: false
            });
        } else if (state.profile) {
            // Fallback profil
            displayItems.push({
                label: 'Depuis le',
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

        // --- NOUVEAU : Filtrage des doublons consécutifs ---
        const filteredItems = [];
        displayItems.forEach((item, index) => {
            if (index === 0) {
                // Le tout premier garde "Dès le"
                filteredItems.push(item);
            } else {
                const prev = filteredItems[filteredItems.length - 1];
                // On ne l'ajoute que si l'objectif a CHANGE par rapport au précédent
                if (item.goal !== prev.goal) {
                    filteredItems.push(item);
                }
            }
        });

        // Marquer le dernier comme "Toujours en cours" systématiquement
        if (filteredItems.length > 0) {
            filteredItems[filteredItems.length - 1].isCurrent = true;
        }

        // Si après filtrage il n'y a qu'un seul item et qu'il est actuel, 
        // on s'assure qu'il utilise "Dès le" (parfois déjà le cas, mais sécurité)
        if (filteredItems.length === 1) {
            filteredItems[0].label = 'Depuis le';
        }

        const goalNames = { 'loss': 'Sèche', 'gain': 'Prise de masse', 'maintenance': 'Maintien' };
        const goalColors = { 'loss': 'var(--color-accent)', 'gain': 'var(--color-primary)', 'maintenance': 'var(--color-primary)' };
        const goalIcons = { 'loss': '📉', 'gain': '📈', 'maintenance': '⚖️' };

        objCard.innerHTML = filteredItems.map(item => {
            const multiplier = item.goal === 'loss' ? 0.9 : (item.goal === 'gain' ? 1.1 : 1.0);
            const estCals = Math.round((state.profile ? state.profile.bmr * 1.2 : 2000) * multiplier);
            const estProt = Math.round(getLatestWeight() * 2);
            const accentColor = goalColors[item.goal] || 'var(--color-primary)';

            return `
                <div class="goal-entry">
                    <div class="goal-entry-bar" style="background:${accentColor};"></div>
                    <div class="goal-entry-body">
                        <div class="goal-entry-header">
                            <span class="goal-entry-icon" aria-hidden="true">${goalIcons[item.goal] || '🎯'}</span>
                            <span class="goal-entry-name">${escapeHtml(goalNames[item.goal] || item.goal)}</span>
                            ${item.isCurrent ? `<span class="goal-entry-badge"><span class="goal-entry-dot"></span>En cours</span>` : ''}
                        </div>
                        <div class="goal-entry-meta">
                            <span class="goal-entry-date">${escapeHtml(item.label)} ${escapeHtml(item.date)}</span>
                        </div>
                        <div class="goal-entry-targets">
                            <span class="goal-entry-target-chip">${estCals} kcal</span>
                            <span class="goal-entry-target-chip">${estProt} g prot</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 5. UI Update: Score Card
    {
        const calsDiff2 = sumCalsConsumed - sumCalsGoal;
        const protDiff2 = sumProtConsumed - sumProtGoal;
        const totalTol2 = activeDaysCount * 10;
        let calsOk2 = activeDaysCount === 0 ? true : (majorityGoal === 'loss' ? calsDiff2 <= 0 : Math.abs(calsDiff2) <= totalTol2);
        const protOk2 = protDiff2 >= -10;
        const weightOk2 = (majorityGoal === 'loss' && wDiffVal < 0) || (majorityGoal === 'gain' && wDiffVal > 0) || (majorityGoal === 'maintenance' && Math.abs(wDiffVal) < 0.3);
        const score = (calsOk2 ? 1 : 0) + (protOk2 ? 1 : 0) + (weightOk2 ? 1 : 0);
        const scoreValEl = document.getElementById('history-score-val');
        const scoreMsgEl = document.getElementById('history-score-msg');
        if (scoreValEl) scoreValEl.textContent = score + ' / 3';
        if (scoreMsgEl) scoreMsgEl.textContent = score === 3 ? 'Parfait, tu es sur la trajectoire idéale !' : score === 2 ? 'Très bien, quelques ajustements et ce sera parfait.' : 'Continue tes efforts, la constance est ton meilleur allié.';
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

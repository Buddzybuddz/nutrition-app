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
    'programme': { section: 'app', view: 'programme-view' },
    'ia': { section: 'app', view: 'ia-view' },
    'conseils': { section: 'app', view: 'ia-view' },
    'historique': { section: 'app', view: 'ia-view' },
    'admin': { section: 'app', view: 'admin-view', admin: true }
};

window.navigateTo = function(slug, updateHistory = true) {
    window.PB_CONFIG?.isDev && console.log(`Navigation vers: ${slug} (updateHistory: ${updateHistory})`);
    const route = window.routes[slug];
    if (!route) {
        window.PB_CONFIG?.isDev && console.warn(`Route non trouvée pour: ${slug}, redirection vers landingpage`);
        return window.navigateTo('landingpage');
    }

    // Vue admin : réservée aux comptes is_admin (le serveur revérifie de toute façon)
    if (route.admin && !(typeof pb !== 'undefined' && pb.authStore.model && pb.authStore.model.is_admin)) {
        return window.navigateTo('tableaudebord');
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
        } else if (route.view === 'dashboard-view') {
            if (typeof updateDashboard === 'function') updateDashboard();
        } else if (route.view === 'programme-view') {
            if (window.renderProgramme) window.renderProgramme();
        } else if (route.view === 'ia-view') {
            if (window.renderIA) window.renderIA();
        } else if (route.view === 'admin-view') {
            if (typeof window.renderAdmin === 'function') window.renderAdmin();
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
    const prot = Math.round(parseFloat(document.getElementById('meal-protein').value));

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
            // La description (composition estimée par l'IA) ne vaut que pour les valeurs d'origine
            if (window.__aiMealDesc) entry.desc = window.__aiMealDesc;
            else if (entry.cals !== cals || entry.prot !== prot) entry.desc = '';
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
        const newEntry = { id: Date.now() + Math.random(), type: 'Repas', name: type, mealType, cals, prot, desc: window.__aiMealDesc || '' };
        actLog.consumedCals += cals;
        actLog.consumedProtein += prot;
        actLog.entries.push(newEntry);
        if (window.maybeSaveFavorite) window.maybeSaveFavorite(newEntry);
        
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
        document.getElementById('meal-protein').value = Math.round(Number(entry.prot) || 0);
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


function updateDashboard() {
    if (!state.profile) return;
    
    // S'assurer que les activités (standards + custom) sont à jour
    renderActivityOptions();

    const actLog = getActiveLog();
    const dateStr = actLog.date;
    const todayStr = formatISOLocal(new Date());
    let displayDate = dateStr === todayStr ? "Aujourd'hui" : formatDateFR(dateStr);
    document.getElementById('current-date').textContent = dateStr === todayStr ? "Aujourd'hui" : parseDateFR(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (typeof window.renderWeekStrip === 'function') window.renderWeekStrip();

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
                details = `<strong>${escapeHtml(entry.cals)} kcal</strong> | ${escapeHtml(Math.round(Number(entry.prot) || 0))}g prot`;
            } else if (entry.type === 'Activité') {
                details = `<strong>+${escapeHtml(entry.cals)} kcal</strong> brulées`;
            } else if (entry.type === 'Objectif') {
                details = `Ajustement de <strong>${escapeHtml(entry.calsText)}</strong> du TDEE affiché`;
            }

            li.innerHTML = `
                <div class="history-title-group">
                    <div class="history-title">${escapeHtml(entry.name)}${entry.type === 'Repas' && window.isFavoriteMeal && window.isFavoriteMeal(entry) ? ' <span class="fav-badge" title="Repas favori" aria-label="Repas favori">★</span>' : ''}</div>
                    <div class="history-details">${details}</div>
                    ${entry.desc ? `<div class="history-desc">${escapeHtml(entry.desc)}</div>` : ''}
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

window.deleteWeighIn = function(date) {
    if (!confirm("Voulez-vous vraiment effacer cette pesée ?")) return;
    
    const idx = state.weighIns.findIndex(wi => wi.date === (date || state.currentViewDate));
    if (idx !== -1) {
        state.weighIns.splice(idx, 1);
        saveState();
        updateDashboard();
        showToast("Pesée effacée.");
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

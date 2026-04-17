/* 
    auth-pb.js - Gestion d'authentification et synchronisation relationnelle PocketBase
*/

const pb = new PocketBase(PB_URL);
let currentUser = null;
let lastUserId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            pb.authStore.clear();
            if (typeof window.clearLocalData === 'function') window.clearLocalData();
            window.location.reload();
        };
    }

    pb.authStore.onChange((token, model) => {
        currentUser = model;
        updateUI(model);
    }, true);
}

// Utilitaire pour normaliser les dates au format PocketBase
function toPBDate(dateInput) {
    if (!dateInput) return "";
    let d;
    if (typeof dateInput === 'string') {
        if (dateInput.includes('/')) {
            // Format DD/MM/YYYY
            const p = dateInput.split('/');
            if (p.length === 3) {
                d = new Date(p[2], parseInt(p[1], 10) - 1, parseInt(p[0], 10), 12, 0, 0);
            } else {
                d = new Date(dateInput);
            }
        } else {
            // Format YYYY-MM-DD
            d = new Date(dateInput + 'T12:00:00Z');
        }
    } else {
        d = new Date(dateInput);
    }
    
    if (isNaN(d.getTime())) return "";
    // Format YYYY-MM-DD HH:MM:SS
    return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

// --- Fonctions de Navigation Auth ---

window.showAuthPage = function(isSignup = false) {
    window.navigateTo('login');
    if (isSignup) {
        window.showSignupForm();
    } else {
        window.showLoginForm();
    }
};

window.showSignupForm = function() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('auth-error').classList.add('hidden');
};

window.showLoginForm = function() {
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('auth-error').classList.add('hidden');
};

window.showResetForm = function() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
    document.getElementById('auth-error').classList.add('hidden');
};

window.showLandingPage = function() {
    window.navigateTo('landingpage');
};

window.showApp = function() {
    if (!state.profile) {
        window.navigateTo('profil');
    } else {
        window.navigateTo('tableaudebord');
    }
};

// --- Gestionnaires de formulaires (Forms) ---

window.handleLoginSubmit = async function(e) {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');

    try {
        btn.disabled = true;
        btn.textContent = "Connexion...";
        await signIn(email, password);
    } catch (err) {
        console.error("Erreur Login:", err);
        showAuthError("Email ou mot de passe incorrect.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Se connecter";
    }
};

window.handleSignupSubmit = async function(e) {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const btn = e.target.querySelector('button');

    if (password !== confirm) {
        showAuthError("Les mots de passe ne correspondent pas.");
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = "Création...";
        
        // 1. Créer l'utilisateur
        await pb.collection('users').create({
            email,
            password,
            passwordConfirm: confirm,
            emailVisibility: true,
            is_active: true
        });

        // 2. Connexion automatique
        await signIn(email, password);
        
    } catch (err) {
        console.error("Erreur Signup détaillé:", err.response);
        let errorMsg = "Erreur lors de la création du compte.";
        
        if (err.response?.data) {
            const data = err.response.data;
            if (data.email?.code === 'validation_not_unique' || (typeof data.identity === 'object' && data.identity?.code === 'validation_not_unique')) {
                errorMsg = `Cet email est déjà pris. <a href="#" onclick="event.preventDefault(); window.showLoginForm();" style="color: white; text-decoration: underline; font-weight: 800;">Se connecter ?</a>`;
            } else if (data.password?.code === 'validation_length_out_of_range') {
                errorMsg = "Le mot de passe doit faire au moins 8 caractères.";
            } else if (err.message) {
                errorMsg = err.message;
            }
        }
        
        showAuthError(errorMsg);
    } finally {
        btn.disabled = false;
        btn.textContent = "Créer le compte";
    }
};

window.handleResetSubmit = async function(e) {
    const email = document.getElementById('reset-email').value;
    const btn = e.target.querySelector('button');

    try {
        btn.disabled = true;
        btn.textContent = "Envoi...";
        await pb.collection('users').requestPasswordReset(email);
        alert("Si un compte correspond à cet email, un lien de réinitialisation a été envoyé.");
        window.showLoginForm();
    } catch (err) {
        console.error("Erreur Reset:", err);
        showAuthError("Erreur lors de l'envoi de l'email.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Envoyer le lien";
    }
};

async function signIn(email, password) {
    return await pb.collection('users').authWithPassword(email, password);
}

async function updateUI(user) {
    if (user) {
        if (user.id === lastUserId) return;
        lastUserId = user.id;

        if (user.is_active === false) {
            pb.authStore.clear();
            if (typeof window.clearLocalData === 'function') window.clearLocalData();
            showAuthError("🔒 Compte désactivé.");
            window.navigateTo('login');
            return;
        }

        if (typeof window.setUserId === 'function') window.setUserId(user.id);
        if (typeof window.clearLocalData === 'function') window.clearLocalData();

        const userEmailSpan = document.getElementById('user-email');
        if (userEmailSpan) userEmailSpan.textContent = user.email;

        // ÉTAPE CRUCIALE : Chargement et Migration
        await loadFromCloud(user);

        if (typeof window.showApp === 'function') window.showApp();
    } else {
        if (typeof window.showLandingPage === 'function') window.showLandingPage();
    }
}

// --- MIGRATION LEGACY ---

async function migrateLegacyData(user, cloudState) {
    const userId = user.id;
    console.warn("🚀 Migration des données legacy en cours...");

    const mapType = (name) => {
        const n = name.toLowerCase();
        if (n.includes('petit') || n.includes('breakfast')) return 'breakfast';
        if (n.includes('déjeuner') || n.includes('lunch')) return 'lunch';
        if (n.includes('dîner') || n.includes('dinner') || n.includes('diner')) return 'dinner';
        if (n.includes('collation') || n.includes('snack')) return 'snack';
        return 'snack';
    };

    // 1. Profil
    if (cloudState.profile) {
        const p = cloudState.profile;
        console.log("- Migration Profil...");
        try {
            // Mapping selon vos options exactes (Homme / Femme)
            const genderMap = {
                'male': 'Homme',
                'homme': 'Homme',
                'Homme': 'Homme',
                'female': 'Femme',
                'femme': 'Femme',
                'Femme': 'Femme'
            };

            const profileData = {
                user: userId,
                birthDate: p.birthDate || null,
                gender: genderMap[p.gender] || 'Homme',
                weight: parseFloat(p.weight) || 0,
                height: parseFloat(p.height) || 0,
                goal: p.goal === 'maintain' ? 'maintenance' : (p.goal || 'maintenance'),
                targetWeight: parseFloat(p.targetWeight) || 0,
                weighInDay: parseInt(p.weighInDay) || 1,
                customActivities: (cloudState.customActivities || []).map(a => typeof a === 'object' ? JSON.stringify({ name: a.name, cals: a.cals }) : a)
            };

            const list = await pb.collection('profiles').getList(1, 1, {
                filter: `user = "${userId}"`
            });
            
            if (list.items.length > 0) {
                console.log("  (Mise à jour du profil ID: " + list.items[0].id + ")");
                await pb.collection('profiles').update(list.items[0].id, profileData);
            } else {
                console.log("  (Création d'un nouveau profil)");
                await pb.collection('profiles').create(profileData);
            }
        } catch(e) { 
            console.error("❌ Erreur validation Profil (vérifiez vos Selects):", e.response?.data || e); 
        }
    }

    // 2. Historique
    if (cloudState.history) {
        console.log("- Migration Historique...");
        const dates = Object.keys(cloudState.history);
        for (const dateKey of dates) {
            const log = cloudState.history[dateKey];
            const pbDate = toPBDate(dateKey);
            if (!pbDate) continue;

            try {
                // Daily Stats
                await pb.collection('daily_stats').create({
                    user: userId,
                    date: pbDate,
                    baseTDEE: log.baseTDEE || 0,
                    goalMultiplier: log.goalMultiplier || 1
                });

                // Repas & Activités
                for (const entry of (log.entries || [])) {
                    if (entry.type === 'Repas') {
                        await pb.collection('meals').create({
                            user: userId,
                            date: pbDate,
                            mealType: mapType(entry.name),
                            name: entry.name,
                            calories: entry.cals,
                            protein: entry.prot || 0
                        });
                    } else if (entry.type === 'Activité') {
                        await pb.collection('activities_log').create({
                            user: userId,
                            date: pbDate,
                            name: entry.name,
                            calories: entry.cals
                        });
                    }
                }
            } catch(e) {
                // Silencieusement ignorer les doublons (échec create si index unique)
            }
        }
    }

    // 3. Pesées
    if (cloudState.weighIns) {
        console.log("- Migration Pesées...");
        for (const win of cloudState.weighIns) {
            const pbDate = toPBDate(win.date);
            if (!pbDate) continue;
            try {
                await pb.collection('weigh_ins').create({
                    user: userId,
                    date: pbDate,
                    weight: win.weight
                });
            } catch(e) {}
        }
    }

    console.log("✅ Migration terminée.");
}

// --- CHARGEMENT ---

window.loadFromCloud = async (user) => {
    const userId = user.id;
    console.log("Chargement des données Cloud...");

    // Cas 1 : Migration nécessaire
    if (user.data) {
        try {
            const legacy = typeof user.data === 'string' ? JSON.parse(user.data) : user.data;
            await migrateLegacyData(user, legacy);
        } catch(e) { console.error("Migration échouée:", e); }
    }

    // Cas 2 : Chargement relationnel
    try {
        // 1. Profil
        let profile = await pb.collection('profiles').getFirstListItem(`user="${userId}"`).catch(() => null);
        
        // --- RÉCUPÉRATION AUTOMATIQUE (Cas ID mismatch entre Prod et Dev) ---
        // SÉCURITÉ : Recherche par email si l'ID technique ne correspond pas
        if (!profile && user.email) {
            console.log(`[PocketBase] Profil introuvable par ID (${userId}). Recherche par email (${user.email})...`);
            
            // On cherche un profil qui n'est pas encore lié au bon ID mais qui a le bon email (via la relation user)
            profile = await pb.collection('profiles').getFirstListItem(`user.email="${user.email}"`).catch(() => null);
            
            if (profile) {
                console.log(`[PocketBase] ✓ Profil trouvé via email (${profile.id}). Tentative de rattachement...`);
                try {
                    // On met à jour le profil pour le lier au nouvel ID technique local/prod
                    profile = await pb.collection('profiles').update(profile.id, { user: userId });
                    console.log("[PocketBase] ✓ Profil rattaché avec succès.");
                } catch(e) {
                    console.error("[PocketBase] ❌ Échec du rattachement du profil:", e);
                    // On garde quand même le profil pour l'affichage session, même si l'update DB a échoué
                }
            }
        }

        if (profile) {
            state.profile = {
                id: profile.id,
                birthDate: profile.birthDate,
                age: profile.age,
                gender: profile.gender,
                weight: profile.weight,
                height: profile.height,
                goal: profile.goal,
                targetWeight: profile.targetWeight,
                weighInDay: profile.weighInDay,
                tdee: profile.weight * 30, // Fallback si non calculé
                bmr: 1500
            };
            // Les activités custom sont stockées en JSON strings dans PB (pour préserver name + cals)
            const rawActivities = profile.customActivities || [];
            let needsMigration = false;
            state.customActivities = rawActivities.map(a => {
                if (typeof a === 'string') {
                    needsMigration = true; // L'entrée est une string brute → ancien format
                    try { return JSON.parse(a); } catch(e) { return { name: a, cals: 0 }; }
                }
                return a; // déjà un objet {name, cals}
            });

            // Si l'ancien format détecté : resync immédiate du profil vers PocketBase avec le nouveau format
            if (needsMigration && profile.id) {
                console.log('🔄 Migration du format customActivities dans PocketBase...');
                try {
                    await pb.collection('profiles').update(profile.id, {
                        customActivities: state.customActivities.map(a =>
                            typeof a === 'object' ? JSON.stringify({ name: a.name, cals: a.cals }) : a
                        )
                    });
                    console.log('✅ Format customActivities migré dans PocketBase. Calories à 0 — utilisez "Gérer mes activités" pour les corriger.');
                } catch(e) {
                    console.error('❌ Erreur lors de la migration du format:', e);
                }
            }
        }

        // 2. Pesées (toutes pour le suivi)
        const wins = await pb.collection('weigh_ins').getFullList({ filter: `user="${userId}"` });
        state.weighIns = wins.map(w => ({ date: w.date.slice(0, 10), weight: w.weight, id: w.id }));

        // 3. Recalculer le profil (BMR/TDEE) APRÈS avoir chargé les pesées pour utiliser la plus récente
        updateProfileData(true);



        // 3. Historique des objectifs
        const goals = await pb.collection('goal_history').getFullList({ 
            filter: `user="${userId}"`,
            sort: 'date' 
        });
        state.goalHistory = goals.map(g => ({ date: g.date.slice(0, 10), goal: g.goal, id: g.id }));

        // 4. Données complètes de l'historique (Suivi + Navigation)
        await loadFullHistory();

        console.log("✓ Données relationnelles chargées.");
        if (typeof updateDashboard === 'function') updateDashboard();
    } catch (err) {
        console.error("Erreur de chargement Cloud:", err);
    }
};

async function loadFullHistory() {
    if (!currentUser) return;
    const userId = currentUser.id;
    console.log("Extraction de l'historique (6 derniers mois)...");
    
    try {
        // Limite à 6 mois pour garantir les performances et couvrir tous les filtres du Suivi
        const dateLimit = new Date();
        dateLimit.setMonth(dateLimit.getMonth() - 6);
        const dateLimitStr = dateLimit.toISOString().slice(0, 10);
        const filter = `user="${userId}" && date >= "${dateLimitStr} 00:00:00"`;

        const [allStats, allMeals, allActivities] = await Promise.all([
            pb.collection('daily_stats').getFullList({ filter: filter }),
            pb.collection('meals').getFullList({ filter: filter }),
            pb.collection('activities_log').getFullList({ filter: filter })
        ]);

        if (!state.history) state.history = {};

        // 1. Groupement par date pour reconstruction d'état
        const grouped = {};
        const getISO = (pbDate) => pbDate.slice(0, 10);

        allStats.forEach(s => {
            const iso = getISO(s.date);
            if (!grouped[iso]) grouped[iso] = { meals: [], acts: [], stats: null };
            grouped[iso].stats = s;
        });

        allMeals.forEach(m => {
            const iso = getISO(m.date);
            if (!grouped[iso]) grouped[iso] = { meals: [], acts: [], stats: null };
            grouped[iso].meals.push(m);
        });

        allActivities.forEach(a => {
            const iso = getISO(a.date);
            if (!grouped[iso]) grouped[iso] = { meals: [], acts: [], stats: null };
            grouped[iso].acts.push(a);
        });

        // 2. Injection dans l'état global
        for (const dateStr in grouped) {
            const data = grouped[dateStr];
            state.history[dateStr] = {
                date: dateStr,
                consumedCals: data.meals.reduce((acc, m) => acc + (m.calories || 0), 0),
                consumedProtein: data.meals.reduce((acc, m) => acc + (m.protein || 0), 0),
                bonusTDEE: data.acts.reduce((acc, a) => acc + (a.calories || 0), 0),
                entries: [
                    ...data.meals.map(m => ({ id: m.id, type: 'Repas', name: m.name, cals: m.calories, prot: m.protein, mealType: m.mealType })),
                    ...data.acts.map(a => ({ id: a.id, type: 'Activité', name: a.name, cals: a.calories }))
                ],
                baseTDEE: data.stats ? data.stats.baseTDEE : (state.profile ? (state.profile.weight * 33) : 0),
                goal: data.stats ? (data.stats.goal || 'maintenance') : (state.profile ? state.profile.goal : 'maintenance'),
                goalMultiplier: data.stats ? data.stats.goalMultiplier : (state.profile ? (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0)) : 1.0)
            };
        }
        
    } catch (err) {
        console.error("Erreur lors du chargement de l'historique:", err);
    }
}

async function loadDayData(dateStr) {
    if (!currentUser) return;
    // Si déjà en mémoire (via loadFullHistory), on ne refait pas l'appel SQL
    if (state.history && state.history[dateStr]) return;

    const userId = currentUser.id;
    try {
        const filter = `user="${userId}" && date >= "${dateStr} 00:00:00" && date <= "${dateStr} 23:59:59"`;
        const [stats, meals, activities] = await Promise.all([
            pb.collection('daily_stats').getFirstListItem(filter).catch(() => null),
            pb.collection('meals').getFullList({ filter: filter }),
            pb.collection('activities_log').getFullList({ filter: filter })
        ]);

        if (!state.history) state.history = {};
        
        state.history[dateStr] = {
            date: dateStr,
            consumedCals: meals.reduce((acc, m) => acc + (m.calories || 0), 0),
            consumedProtein: meals.reduce((acc, m) => acc + (m.protein || 0), 0),
            bonusTDEE: activities.reduce((acc, a) => acc + (a.calories || 0), 0),
            entries: [
                ...meals.map(m => ({ id: m.id, type: 'Repas', name: m.name, cals: m.calories, prot: m.protein, mealType: m.mealType })),
                ...activities.map(a => ({ id: a.id, type: 'Activité', name: a.name, cals: a.calories }))
            ],
            baseTDEE: stats ? stats.baseTDEE : (state.profile ? (state.profile.weight * 33) : 0),
            goal: stats ? (stats.goal || 'maintenance') : (state.profile ? state.profile.goal : 'maintenance'),
            goalMultiplier: stats ? stats.goalMultiplier : (state.profile ? (state.profile.goal === 'loss' ? 0.9 : (state.profile.goal === 'gain' ? 1.1 : 1.0)) : 1.0)
        };
    } catch(e) {
        if (!e.isAbort) {
            console.error("Impossible de charger les données du jour:", e);
        }
    }
}

// --- SYNCHRONISATION ATOMIQUE ---
let isSyncing = false;

window.syncToCloud = async () => {
    // Cette fonction est appelée par saveState() dans app.js
    if (isSyncing) return;
    if (!currentUser || !state.profile) return;
    
    isSyncing = true;
    try {
    
    // 1. Sync Profil
    const profileData = {
        user: currentUser.id,
        birthDate: state.profile.birthDate,
        gender: state.profile.gender,
        weight: state.profile.weight,
        height: state.profile.height,
        goal: state.profile.goal,
        targetWeight: state.profile.targetWeight || state.profile.weight,
        weighInDay: state.profile.weighInDay,
        // Sérialisation en JSON strings pour PocketBase (préserve name + cals)
        customActivities: (state.customActivities || []).map(a => typeof a === 'object' ? JSON.stringify({ name: a.name, cals: a.cals }) : a)
    };

    try {
        // Recherche par ID technique
        let existing = await pb.collection('profiles').getFirstListItem(`user="${currentUser.id}"`, { requestKey: null }).catch(() => null);
        
        // Sécurité anti-doublon : Recherche par email si l'ID n'a rien donné
        if (!existing && currentUser.email) {
            existing = await pb.collection('profiles').getFirstListItem(`user.email="${currentUser.email}"`, { requestKey: null }).catch(() => null);
            if (existing) {
                console.log("[PocketBase] Doublon évité : un profil existe déjà pour cet email. Rattachement en cours...");
                await pb.collection('profiles').update(existing.id, { user: currentUser.id }, { requestKey: null });
            }
        }

        if (existing) {
            await pb.collection('profiles').update(existing.id, profileData, { requestKey: null });
        } else {
            console.log("[PocketBase] Création d'un nouveau profil...");
            await pb.collection('profiles').create(profileData, { requestKey: null });
        }
    } catch(e) {
        console.error('❌ Erreur syncToCloud (profil):', e.response?.data || e.message || e);
    }

    // 2. Sync Stats du jour
    const log = state.history[state.currentViewDate];
    if (log) {
        const statsData = {
            user: currentUser.id,
            date: toPBDate(log.date),
            baseTDEE: log.baseTDEE || 0,
            goalMultiplier: log.goalMultiplier || 1
        };
        try {
            const dateFilter = log.date;
            const existing = await pb.collection('daily_stats').getFirstListItem(`user="${currentUser.id}" && date >= "${dateFilter} 00:00:00" && date <= "${dateFilter} 23:59:59"`).catch(() => null);
            if (existing) await pb.collection('daily_stats').update(existing.id, statsData);
            else await pb.collection('daily_stats').create(statsData);
        } catch(e) {
            if (!e.isAbort) {
                console.error("Erreur Sync Stats:", e.response || e);
            }
        }
    } 
} finally {
    isSyncing = false;
}
};

// Fonction de nettoyage des profils en double (Correction unique)
window.pb_cleanupProfiles = async () => {
    if (!currentUser) {
        console.error("Veuillez vous connecter avant de lancer le nettoyage.");
        return;
    }
    
    console.log("Début du nettoyage des profils en double...");
    try {
        const profiles = await pb.collection('profiles').getFullList({ 
            filter: `user="${currentUser.id}"`,
            sort: '-created' // Plus récent en premier
        });

        if (profiles.length <= 1) {
            console.log("✓ Aucun doublon trouvé.");
            return;
        }

        // Garder le premier (plus récent) et supprimer les autres
        const toKeep = profiles[0];
        const toDelete = profiles.slice(1);

        console.log(`Profil à conserver : ${toKeep.id} (créé le ${toKeep.created})`);
        for (const p of toDelete) {
            console.log(`Suppression du doublon : ${p.id} (créé le ${p.created})`);
            await pb.collection('profiles').delete(p.id);
        }
        
        console.log(`✓ Nettoyage terminé : ${toDelete.length} doublons supprimés.`);
    } catch (err) {
        console.error("Erreur durant le nettoyage :", err);
    }
};

// Fonctions granulaires pour app.js
window.pb_saveMeal = async (meal) => {
    if (!currentUser) return;
    const data = {
        user: currentUser.id,
        date: toPBDate(state.currentViewDate),
        mealType: (meal.mealType || 'snack').toLowerCase(),
        name: meal.name,
        calories: meal.cals || 0,
        protein: meal.prot || 0
    };
    
    if (typeof meal.id === 'string' && meal.id.length > 5) {
        return await pb.collection('meals').update(meal.id, data);
    } else {
        const record = await pb.collection('meals').create(data);
        return record;
    }
};

// Migration des types de repas basés sur le nom (Correction unique)
window.pb_migrateMealTypes = async () => {
    if (!currentUser) {
        console.error("Veuillez vous connecter avant de lancer la migration.");
        return;
    }
    
    console.log("Début de la migration des types de repas...");
    try {
        const meals = await pb.collection('meals').getFullList({ filter: `user="${currentUser.id}"` });
        let updatedCount = 0;

        for (const meal of meals) {
            let targetType = meal.mealType;
            const name = (meal.name || "").toLowerCase();

            if (name.includes("petit-déjeuner") || name.includes("breakfast")) targetType = "breakfast";
            else if (name.includes("déjeuner") || name.includes("lunch")) targetType = "lunch";
            else if (name.includes("dîner") || name.includes("dinner") || name.includes("diner")) targetType = "dinner";
            else if (name.includes("collation") || name.includes("snack")) targetType = "snack";

            // Si le type a changé ou s'il était en PascalCase (ex: 'Snack')
            if (targetType !== meal.mealType) {
                console.log(`Mise à jour meal ${meal.id} : "${meal.name}" -> ${targetType}`);
                await pb.collection('meals').update(meal.id, { mealType: targetType });
                updatedCount++;
            }
        }
        console.log(`✓ Migration terminée : ${updatedCount} repas mis à jour.`);
        if (typeof updateDashboard === 'function') updateDashboard();
    } catch (err) {
        console.error("Erreur durant la migration :", err);
    }
};

window.pb_deleteEntry = async (id, type) => {
    if (!currentUser || typeof id !== 'string' || id.length < 5) return;
    try {
        const collection = type === 'Repas' ? 'meals' : 'activities_log';
        await pb.collection(collection).delete(id);
        console.log(`✓ ${type} supprimé du Cloud`);
    } catch(e) {
        console.error("Erreur suppression Cloud:", e);
    }
};

window.pb_saveActivity = async (act) => {
    if (!currentUser) return;
    const data = {
        user: currentUser.id,
        date: toPBDate(state.currentViewDate),
        name: act.name,
        calories: act.cals || act.calories || 0
    };
    
    if (typeof act.id === 'string' && act.id.length > 5) {
        return await pb.collection('activities_log').update(act.id, data);
    } else {
        const record = await pb.collection('activities_log').create(data);
        return record;
    }
};

window.pb_saveWeighIn = async (win) => {
    if (!currentUser) return;
    const data = { 
        user: currentUser.id, 
        date: toPBDate(win.date), 
        weight: win.weight 
    };
    try {
        // 1. Sauvegarde dans la table weigh_ins
        const existing = await pb.collection('weigh_ins').getFirstListItem(`user="${currentUser.id}" && date >= "${win.date} 00:00:00" && date <= "${win.date} 23:59:59"`).catch(() => null);
        if (existing) await pb.collection('weigh_ins').update(existing.id, data);
        else await pb.collection('weigh_ins').create(data);

        // 2. Si la pesée est pour AUJOURD'HUI, on met à jour le profil
        const todayStr = new Date().toISOString().split('T')[0];
        if (win.date === todayStr) {
            const profile = await pb.collection('profiles').getFirstListItem(`user="${currentUser.id}"`).catch(() => null);
            if (profile) {
                await pb.collection('profiles').update(profile.id, { weight: win.weight });
                console.log(`✓ Poids du profil mis à jour : ${win.weight} kg`);
            }
        }
    } catch(e) {
        if (!e.isAbort) {
            console.error("Erreur Sync Poids:", e.response || e);
        }
    }
};

window.pb_logGoalChange = async (goalValue) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const todayStr = new Date().toISOString().split('T')[0];
    
    try {
        // 1. Récupérer le dernier enregistrement pour comparer la valeur
        const lastRecords = await pb.collection('goal_history').getList(1, 1, {
            filter: `user="${userId}"`,
            sort: '-date',
        });
        
        const lastEntry = lastRecords.items[0];
        
        // Si la valeur est la même que le dernier enregistrement connu, on ignore (évite les doublons inutiles)
        if (lastEntry && lastEntry.goal === goalValue) {
            console.log("✓ Objectif inchangé dans l'historique.");
            return;
        }

        // 2. Vérifier s'il y a déjà une entrée pour AUJOURD'HUI
        // Si oui, on la met à jour pour ne garder que le DERNIER choix de la journée
        const filterToday = `user="${userId}" && date >= "${todayStr} 00:00:00" && date <= "${todayStr} 23:59:59"`;
        const todayEntry = await pb.collection('goal_history').getFirstListItem(filterToday).catch(() => null);

        const data = {
            user: userId,
            date: toPBDate(todayStr),
            goal: goalValue
        };

        if (todayEntry) {
            await pb.collection('goal_history').update(todayEntry.id, data);
            console.log(`✓ Objectif du jour mis à jour dans l'historique : ${goalValue}`);
        } else {
            await pb.collection('goal_history').create(data);
            console.log(`✓ Nouvel objectif ajouté à l'historique : ${goalValue}`);
        }
    } catch (err) {
        if (!err.isAbort) {
            console.error("Erreur historisation objectif:", err);
        }
    }
};

// Sauvegarde dédiée des activités custom directement dans PocketBase
// Appelée explicitement depuis app.js lors d'une édition/suppression
window.pb_saveCustomActivities = async () => {
    if (!currentUser) return;
    try {
        const profile = await pb.collection('profiles').getFirstListItem(`user="${currentUser.id}"`, { requestKey: null }).catch(() => null);
        if (!profile) {
            console.warn('⚠️ pb_saveCustomActivities : profil introuvable.');
            return;
        }
        const serialized = (state.customActivities || []).map(a =>
            typeof a === 'object' ? JSON.stringify({ name: a.name, cals: a.cals }) : a
        );
        await pb.collection('profiles').update(profile.id, { customActivities: serialized }, { requestKey: null });
        console.log('✅ customActivities sauvegardées dans PocketBase :', serialized);
    } catch(e) {
        console.error('❌ Erreur pb_saveCustomActivities:', e.response?.data || e.message || e);
    }
};


function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.innerHTML = message; // innerHTML pour permettre les liens
        errorDiv.classList.remove('hidden');
        
        // On augmente le délai pour les erreurs d'inscription (8s)
        const delay = message.includes('connecter') ? 8000 : 5000;
        
        if (window.authErrorTimeout) clearTimeout(window.authErrorTimeout);
        window.authErrorTimeout = setTimeout(() => errorDiv.classList.add('hidden'), delay);
    }
}

// --- FONCTION DE SECOURS (Si le rattachement auto échoue) ---
window.forceProfileLink = async () => {
    const user = pb.authStore.model;
    if (!user) return alert("Veuillez vous connecter.");
    
    const btn = document.getElementById('btn-fix-profile');
    try {
        btn.innerText = "Recherche...";
        // On récupère tous les profils (FullList car il y en a peu)
        const allProfiles = await pb.collection('profiles').getFullList();
        
        // On cherche celui qui contient l'email dans son champ user (même si le lien est technically broken)
        // Ou on cible l'ID spécifique vu dans le screenshot
        const myProfile = allProfiles.find(p => p.user === user.email || p.id === "5rycbyingse1ohu");
        
        if (myProfile) {
            await pb.collection('profiles').update(myProfile.id, { user: user.id });
            alert("✓ Profil rattaché avec succès ! L'application va redémarrer.");
            window.location.reload();
        } else {
            alert("Aucun profil orphelin trouvé pour cet email (" + user.email + ").");
        }
    } catch(e) {
        console.error(e);
        alert("Erreur lors du rattachement : " + e.message);
    } finally {
        btn.innerText = "🚀 Rattacher mon profil";
    }
};

// --- LOGIQUE DE VÉRIFICATION PROFIL VIDE ---
function checkProfileEmpty() {
    setTimeout(() => {
        const btn = document.getElementById('btn-fix-profile');
        const weightInput = document.getElementById('weight');
        // Si on est sur le profil et que le poids est vide après 1.5s, on propose le fix
        if (btn && weightInput && !weightInput.value && window.location.hash === '#profile-view') {
            btn.classList.remove('hidden');
        }
    }, 1500);
}
// Écouter les changements de vue
window.addEventListener('hashchange', checkProfileEmpty);
// Et au chargement initial
if (window.location.hash === '#profile-view') checkProfileEmpty();


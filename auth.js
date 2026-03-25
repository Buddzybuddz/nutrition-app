// Supabase Configuration
const SUPABASE_URL = 'https://qhujcfeownqwvsenmaqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWpjZmVvd25xd3ZzZW5tYXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjEzNjUsImV4cCI6MjA4OTU5NzM2NX0.svgq9ZBjg9JPUPqqDa3-2Npn0_mcIa0SIN1UVmRdRM4';

let supabaseClient = null;
let currentUser = null;
try {
    if (window.supabase) {
        // Initialisation avec options explicites pour éviter les deadlocks de lock
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });
    } else {
        console.warn("L'objet window.supabase est introuvable. Le CDN est probablement bloqué.");
    }
} catch (e) {
    console.error("Erreur lors de l'initialisation de Supabase:", e);
}

// Auth Functions
function checkSupabase() {
    if (!supabaseClient) throw new Error("Erreur système: Supabase n'a pas pu charger (vérifiez votre connexion ou votre bloqueur de publicités).");
}

async function signUp(email, password) {
    checkSupabase();
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

async function signIn(email, password) {
    checkSupabase();
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signOut() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
}

async function resetPassword(email) {
    checkSupabase();
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
}

// Data Sync Functions (accept user object or use current session to avoid blocking getUser calls)
async function syncToCloud(user = currentUser) {
    if (!supabaseClient || !user) return;
    
    const payload = {
        id: user.id,
        state: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
        updated_at: new Date().toISOString()
    };
    
    // On ne veut pas que ça bloque l'UI ou l'auth, donc on ne met pas forcément de await critique ici
    const { error } = await supabaseClient
        .from('user_data')
        .upsert(payload, { onConflict: 'id' });
    
    if (error) console.error('Sync error:', error);
}

async function loadFromCloud(user) {
    if (!supabaseClient || !user) return null;
    
    const { data, error } = await supabaseClient
        .from('user_data')
        .select('state')
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Load error:', error);
        return null;
    }
    
    return data ? data.state : null;
}

// Auth State Management
window.showAuthPage = function(isSignup = false) {
    const lp = document.getElementById('landing-page');
    if(lp) lp.classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    
    if (isSignup && window.showSignupForm) {
        window.showSignupForm();
    } else if (!isSignup && window.showLoginForm) {
        window.showLoginForm();
    }
};

window.showLandingPage = function() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
    const lp = document.getElementById('landing-page');
    if(lp) lp.classList.remove('hidden');
};

function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    const lp = document.getElementById('landing-page');
    if(lp) lp.classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

function showAuthError(message) {
    const errEl = document.getElementById('auth-error');
    errEl.textContent = message;
    errEl.style.color = ''; // Reset to default danger color
    errEl.classList.remove('hidden');
    if (window.authTimeout) clearTimeout(window.authTimeout);
    window.authTimeout = setTimeout(() => errEl.classList.add('hidden'), 8000);
}

function showAuthSuccess(message) {
    const errEl = document.getElementById('auth-error');
    errEl.textContent = message;
    errEl.style.color = 'var(--accent-success)';
    errEl.classList.remove('hidden');
    if (window.authTimeout) clearTimeout(window.authTimeout);
    window.authTimeout = setTimeout(() => {
        errEl.classList.add('hidden');
        errEl.style.color = '';
    }, 5000);
}

// Auth Handlers (Global)
window.showSignupForm = () => {
    const lf = document.getElementById('login-form');
    const sf = document.getElementById('signup-form');
    const rf = document.getElementById('reset-form');
    if (lf) lf.classList.add('hidden');
    if (sf) sf.classList.remove('hidden');
    if (rf) rf.classList.add('hidden');
};

window.showLoginForm = () => {
    const lf = document.getElementById('login-form');
    const sf = document.getElementById('signup-form');
    const rf = document.getElementById('reset-form');
    if (lf) lf.classList.remove('hidden');
    if (sf) sf.classList.add('hidden');
    if (rf) rf.classList.add('hidden');
};

window.showResetForm = () => {
    const lf = document.getElementById('login-form');
    const sf = document.getElementById('signup-form');
    const rf = document.getElementById('reset-form');
    if (lf) lf.classList.add('hidden');
    if (sf) sf.classList.add('hidden');
    if (rf) rf.classList.remove('hidden');
};

window.handleLoginSubmit = async (e) => {
    const btn = document.querySelector('#login-form button[type="submit"]');
    const oldText = btn ? btn.textContent : 'Se connecter';
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    
    if (!emailEl || !passEl) return;
    
    const email = emailEl.value;
    const password = passEl.value;
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Connexion...';
        }
        
        console.log("Tentative de connexion Supabase...");
        // Timeout de sécurité au cas où Supabase freeze (bug connu de lock du navigateur)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT_DEADLOCK')), 10000)
        );
        await Promise.race([signIn(email, password), timeoutPromise]);
        console.log("Connexion réussie !");
        
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
        console.error("Login Error:", err);
        let msg = 'Erreur lors de la connexion.';
        if (err && err.message) {
            if (err.message === 'TIMEOUT_DEADLOCK') {
                // Tentative brute de déblocage : on vide les clés d'auth locales pour forcer un état propre
                try {
                    Object.keys(localStorage).forEach(key => {
                        if (key.includes('sb-') && key.includes('-auth-token')) {
                            localStorage.removeItem(key);
                        }
                    });
                } catch(e) {}
                msg = 'Le système de session semble bloqué par votre navigateur ou plusieurs onglets ouverts. Nous avons tenté de réinitialiser la connexion. Veuillez rafraîchir la page (F5) et réessayer.';
            } else if (err.message.includes('Invalid login credentials')) {
                msg = 'Mail non existant ou mot de passe incorrect.';
            } else if (err.message.includes('Email not confirmed')) {
                msg = 'Veuillez confirmer votre email avant de vous connecter.';
            } else {
                msg = err.message;
            }
        } else if (typeof err === 'string') {
            msg = err;
        }
        alert(msg);
        showAuthError(msg);
    }
};

window.handleSignupSubmit = async (e) => {
    const btn = document.querySelector('#signup-form button[type="submit"]');
    const oldText = btn ? btn.textContent : 'Créer le compte';
    const emailEl = document.getElementById('signup-email');
    const passEl = document.getElementById('signup-password');
    const confEl = document.getElementById('signup-confirm');
    
    if (!emailEl || !passEl || !confEl) return;
    const email = emailEl.value;
    const password = passEl.value;
    const confirm = confEl.value;
    
    if (password !== confirm) {
        showAuthError('Les mots de passe ne correspondent pas.');
        return;
    }
    if (password.length < 6) {
        showAuthError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
    }
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Création...';
        }
        
        console.log("Tentative d'inscription Supabase...");
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT_DEADLOCK')), 10000)
        );
        await Promise.race([signUp(email, password), timeoutPromise]);
        console.log("Inscription réussie !");
        
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
        
        showAuthSuccess('Compte créé ! Vérifiez vos emails pour confirmer votre inscription.');
        const signupForm = document.getElementById('signup-form');
        const loginForm = document.getElementById('login-form');
        if (signupForm && loginForm) {
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
        console.error("Signup Error:", err);
        let msg = err && err.message ? err.message : 'Erreur lors de la création du compte.';
        if (msg === 'TIMEOUT_DEADLOCK') {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.includes('sb-') && key.includes('-auth-token')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch(e) {}
            msg = 'Le système de session semble bloqué. Nous avons tenté de réinitialiser la connexion. Veuillez rafraîchir la page (F5) et réessayer.';
        } else if (msg.includes('User already registered')) {
            msg = 'Cet email est déjà utilisé.';
        }
        showAuthError(msg);
    }
};

window.handleResetSubmit = async (e) => {
    const emailEl = document.getElementById('reset-email');
    if (!emailEl) return;
    try {
        await resetPassword(emailEl.value);
        showAuthSuccess('Un email de réinitialisation a été envoyé.');
    } catch (err) {
        console.error("Reset Error:", err);
        showAuthError(err && err.message ? err.message : 'Erreur');
    }
};

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const resetForm = document.getElementById('reset-form');
    

    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const oldText = logoutBtn.textContent;
            try {
                logoutBtn.textContent = 'Déconnexion...';
                logoutBtn.disabled = true;
                
                console.log("Tentative de déconnexion...");
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_LOGOUT')), 5000));
                await Promise.race([signOut(), timeoutPromise]);
                
                // Forcer l'affichage au cas où onAuthStateChange est lent
                window.showLandingPage();
            } catch (err) {
                console.error("Logout Error:", err);
                alert("Erreur lors de la déconnexion : " + err.message);
                window.showLandingPage();
            } finally {
                logoutBtn.textContent = oldText;
                logoutBtn.disabled = false;
            }
        });
    }

    // Listen for auth state changes (ONLY IF SUPABASE LOADED)
    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session ? session.user : null;
            
            if (session && session.user) {
                // User is logged in
                const user = session.user;
                
                // Mettre à jour l'email dans l'UI immédiatement
                const userEmail = document.getElementById('user-email');
                if (userEmail) userEmail.textContent = user.email;

                // Charger les données de manière non-bloquante pour éviter les deadlocks
                loadFromCloud(user).then(async (cloudState) => {
                    if (cloudState && cloudState.profile) {
                        // Cloud data exists, use it
                        state = cloudState;
                        if (!state.customActivities) state.customActivities = [];
                        if (!state.weighIns) state.weighIns = [];
                        if (!state.history) state.history = {};
                        state.currentViewDate = new Date().toLocaleDateString('fr-FR');
                        if (typeof getActiveLog === 'function') getActiveLog();
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    } else {
                        // No cloud data yet, migrate localStorage to cloud
                        if (typeof loadState === 'function') loadState();
                        await syncToCloud(user);
                    }
                    
                    // Une fois les données chargées, on initialise l'application
                    if (typeof init === 'function') {
                        init();
                    } else if (state.profile) {
                        if (typeof updateDashboard === 'function') updateDashboard();
                    }
                }).catch(err => {
                    console.error("Erreur lors du chargement des données cloud:", err);
                });

                showApp();
                if (typeof renderActivityOptions === 'function') renderActivityOptions();
            } else {
                // User is logged out
                window.showLandingPage();
            }
        });
    } else {
        // Fallback UI if supabase fails
        window.showAuthPage();
    }
}

// Call initAuth safely
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

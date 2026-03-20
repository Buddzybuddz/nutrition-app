// Supabase Configuration
const SUPABASE_URL = 'https://qhujcfeownqwvsenmaqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWpjZmVvd25xd3ZzZW5tYXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjEzNjUsImV4cCI6MjA4OTU5NzM2NX0.svgq9ZBjg9JPUPqqDa3-2Npn0_mcIa0SIN1UVmRdRM4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth Functions
async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
}

// Data Sync Functions
async function syncToCloud() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const payload = {
        id: user.id,
        state: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
        .from('user_data')
        .upsert(payload, { onConflict: 'id' });
    
    if (error) console.error('Sync error:', error);
}

async function loadFromCloud() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
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
function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

function showAuthError(message) {
    const errEl = document.getElementById('auth-error');
    errEl.textContent = message;
    errEl.classList.remove('hidden');
    setTimeout(() => errEl.classList.add('hidden'), 5000);
}

function showAuthSuccess(message) {
    const errEl = document.getElementById('auth-error');
    errEl.textContent = message;
    errEl.style.color = 'var(--accent-success)';
    errEl.classList.remove('hidden');
    setTimeout(() => {
        errEl.classList.add('hidden');
        errEl.style.color = '';
    }, 5000);
}

// Auth UI Handlers
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const resetForm = document.getElementById('reset-form');
    
    const showLogin = document.getElementById('show-login');
    const showSignup = document.getElementById('show-signup');
    const showReset = document.getElementById('show-reset');
    const showLoginFromReset = document.getElementById('show-login-from-reset');
    
    if (showSignup) showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        resetForm.classList.add('hidden');
    });
    
    if (showLogin) showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        resetForm.classList.add('hidden');
    });
    
    if (showReset) showReset.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.add('hidden');
        resetForm.classList.remove('hidden');
    });
    
    if (showLoginFromReset) showLoginFromReset.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
    
    // Login submit
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await signIn(email, password);
        } catch (err) {
            showAuthError(err.message === 'Invalid login credentials' 
                ? 'Email ou mot de passe incorrect.' 
                : err.message);
        }
    });
    
    // Signup submit
    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        
        if (password !== confirm) {
            showAuthError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (password.length < 6) {
            showAuthError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        
        try {
            await signUp(email, password);
            showAuthSuccess('Compte créé ! Vérifiez vos emails pour confirmer votre inscription.');
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } catch (err) {
            showAuthError(err.message);
        }
    });
    
    // Reset submit
    if (resetForm) resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        try {
            await resetPassword(email);
            showAuthSuccess('Un email de réinitialisation a été envoyé.');
        } catch (err) {
            showAuthError(err.message);
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        await signOut();
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            // User is logged in
            const cloudState = await loadFromCloud();
            if (cloudState && cloudState.profile) {
                // Cloud data exists, use it
                state = cloudState;
                if (!state.customActivities) state.customActivities = [];
                if (!state.weighIns) state.weighIns = [];
                if (!state.history) state.history = {};
                state.currentViewDate = new Date().toLocaleDateString('fr-FR');
                getActiveLog();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } else {
                // No cloud data yet, migrate localStorage to cloud
                loadState();
                await syncToCloud();
            }

            const userEmail = document.getElementById('user-email');
            if (userEmail) userEmail.textContent = session.user.email;
            
            showApp();
            renderActivityOptions();
            if (state.profile) {
                updateDashboard();
            } else {
                document.getElementById('dashboard-view').classList.add('hidden');
                document.getElementById('profile-view').classList.remove('hidden');
                document.querySelector('[data-target="dashboard-view"]').classList.remove('active');
                document.querySelector('[data-target="profile-view"]').classList.add('active');
            }
        } else {
            // User is logged out
            showAuthScreen();
        }
    });
});

(function() {
    var TRIAL_DAYS = 7;

    /* Vérifie si l'utilisateur a accès (essai actif OU exempté OU abonnement actif) */
    async function checkAccess() {
        if (typeof pb === 'undefined' || !pb.authStore.isValid) return false;
        var user = pb.authStore.model;

        /* Calcul fin de période d'essai */
        var created  = new Date(user.created);
        var trialEnd = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        if (new Date() <= trialEnd) return true;

        /* Essai expiré → rafraîchir le profil pour avoir les données à jour */
        try {
            var res    = await pb.collection('users').authRefresh();
            var record = res.record;
            if (record.is_exempt) return true;
            var status = record.subscription_status;
            return status === 'active' || status === 'trialing';
        } catch(e) {
            return false;
        }
    }

    function showPaywall() {
        var overlay = document.getElementById('paywall-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    function hidePaywall() {
        var overlay = document.getElementById('paywall-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    function initPaywall() {
        /* Wrap window.showApp pour intercepter l'accès */
        var _orig = window.showApp;
        window._paywallOrig = _orig; // exposé pour le polling post-Stripe
        window.showApp = async function() {
            var hasAccess = await checkAccess();
            if (hasAccess) {
                hidePaywall();
                if (_orig) _orig();
            } else {
                showPaywall();
            }
        };

        /* Bouton S'abonner */
        var subBtn = document.getElementById('paywall-subscribe-btn');
        if (subBtn) {
            subBtn.addEventListener('click', async function() {
                subBtn.disabled    = true;
                subBtn.textContent = 'Redirection…';
                if (typeof window.stripeStartCheckout === 'function') {
                    await window.stripeStartCheckout();
                }
                subBtn.disabled    = false;
                subBtn.textContent = 'S\'abonner — 5,99 €/mois';
            });
        }

        /* Bouton Déconnexion */
        var logoutBtn = document.getElementById('paywall-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (typeof pb !== 'undefined') pb.authStore.clear();
                if (typeof window.clearLocalData === 'function') window.clearLocalData();
                window.location.reload();
            });
        }

        /* Retour de Stripe avec succès → polling jusqu'à activation (max 30s) */
        var params = new URLSearchParams(window.location.search);
        if (params.get('stripe') === 'success') {
            window.history.replaceState({}, '', window.location.pathname);
            var overlay = document.getElementById('paywall-overlay');
            var card    = overlay && overlay.querySelector('.paywall-card');
            if (card) {
                card.innerHTML = '<div class="paywall-logo">Nutri<span>Dash</span></div>'
                    + '<p style="margin:2rem 0;font-size:1.1rem;color:var(--color-text)">Activation de votre abonnement…</p>'
                    + '<p style="color:var(--color-text-muted);font-size:.9rem">Merci de patienter quelques secondes.</p>';
            }
            var attempts = 0;
            var maxAttempts = 15;
            var _origRef = window._paywallOrig;

            async function tryActivate() {
                attempts++;
                var hasAccess = await checkAccess();
                if (hasAccess) {
                    clearInterval(poll);
                    hidePaywall();
                    if (typeof _origRef === 'function') _origRef();
                    if (typeof renderSubscriptionCard === 'function') renderSubscriptionCard();
                } else if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    if (card) {
                        card.innerHTML = '<div class="paywall-logo">Nutri<span>Dash</span></div>'
                            + '<p style="margin:2rem 0;color:var(--color-text)">L\'activation prend plus de temps que prévu.</p>'
                            + '<button id="retry-activation-btn" class="paywall-btn-primary">Réessayer</button>';
                        var retryBtn = document.getElementById('retry-activation-btn');
                        if (retryBtn) retryBtn.addEventListener('click', function() {
                            retryBtn.textContent = 'Vérification…';
                            retryBtn.disabled = true;
                            attempts = 0;
                            poll = setInterval(tryActivate, 2000);
                        });
                    }
                }
            }

            /* Délai initial de 3s pour laisser le webhook arriver */
            var poll = setTimeout(function() {
                tryActivate();
                poll = setInterval(tryActivate, 2000);
            }, 3000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPaywall);
    } else {
        initPaywall();
    }
})();

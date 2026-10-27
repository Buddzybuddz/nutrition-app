(function() {
    /* Libellés et couleurs selon le statut */
    var STATUS_LABELS = {
        'none':       'Aucun abonnement',
        'trialing':   'Période d\'essai',
        'active':     'Actif',
        'past_due':   'Paiement en retard',
        'canceled':   'Résilié',
        'incomplete': 'Incomplet',
    };
    var STATUS_CLASSES = {
        'trialing': 'trialing',
        'active':   'active',
        'past_due': 'past_due',
        'canceled': 'canceled',
    };

    function getToken() {
        return typeof pb !== 'undefined' && pb.authStore && pb.authStore.isValid
            ? pb.authStore.token : null;
    }
    function getPbUrl() {
        return typeof PB_URL !== 'undefined' ? PB_URL : 'https://nutridash-pb.fly.dev';
    }

    var TRIAL_DAYS = 7;

    function getTrialInfo() {
        if (typeof pb === 'undefined' || !pb.authStore.isValid) return null;
        var created  = new Date(pb.authStore.model.created);
        var trialEnd = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        var now      = new Date();
        var msLeft   = trialEnd - now;
        return {
            active:    msLeft > 0,
            daysLeft:  Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
            endDate:   trialEnd,
        };
    }

    /* Rendu de la carte abonnement */
    async function renderSubscriptionCard() {
        var badge   = document.getElementById('pv-sub-badge');
        var desc    = document.getElementById('pv-sub-desc');
        var actions = document.getElementById('pv-sub-actions');
        if (!badge || !desc || !actions) return;

        var token = getToken();
        if (!token) {
            desc.textContent = 'Connectez-vous pour voir votre abonnement.';
            actions.innerHTML = '';
            return;
        }

        var status = 'none';
        var subEnd = null;
        var subCancelAt = null;
        var isExempt = false;
        try {
            var refreshRes = await fetch(getPbUrl() + '/api/collections/users/auth-refresh', {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            var refreshData = await refreshRes.json();
            if (refreshData.record) {
                status      = refreshData.record.subscription_status || 'none';
                subEnd      = refreshData.record.subscription_end || null;
                subCancelAt = refreshData.record.subscription_cancel_at || null;
                isExempt    = !!refreshData.record.is_exempt;
            }
        } catch(e) { /* silencieux */ }

        var trial = getTrialInfo();

        /* Cas exempté */
        if (isExempt) {
            badge.textContent = 'Accès offert';
            badge.className   = 'pv-sub-badge active';
            desc.textContent  = 'Vous bénéficiez d\'un accès gratuit accordé par l\'équipe NutriDash.';
            actions.innerHTML = '';
            return;
        }

        /* Cas essai en cours (pas encore d'abonnement Stripe) */
        if ((status === 'none' || !status) && trial && trial.active) {
            badge.textContent = 'Essai gratuit';
            badge.className   = 'pv-sub-badge trialing';
            var endFmt = trial.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            desc.textContent = trial.daysLeft <= 1
                ? 'Votre essai se termine aujourd\'hui. Abonnez-vous pour continuer.'
                : 'Il vous reste ' + trial.daysLeft + ' jours d\'essai gratuit (jusqu\'au ' + endFmt + '). Puis 5,99 €/mois.';
            actions.innerHTML = '';
            return;
        }

        /* Résiliation programmée (annulée depuis le portail, accès conservé jusqu'à subCancelAt) */
        var willCancel = subCancelAt && (status === 'active' || status === 'trialing');

        /* Badge Stripe */
        if (willCancel) {
            badge.textContent = 'Se termine bientôt';
            badge.className   = 'pv-sub-badge ending';
        } else {
            badge.textContent = STATUS_LABELS[status] || status;
            badge.className   = 'pv-sub-badge ' + (STATUS_CLASSES[status] || '');
        }

        /* Description Stripe */
        var endFmt2 = subEnd ? new Date(subEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
        var cancelFmt = subCancelAt ? new Date(subCancelAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
        if (willCancel) {
            desc.textContent = 'Abonnement annulé — accès maintenu jusqu\'au ' + cancelFmt + ', puis non renouvelé. Vous pouvez réactiver le renouvellement automatique à tout moment.';
        } else if (status === 'none' || !status) {
            desc.textContent = 'Votre essai est terminé. Abonnez-vous pour continuer à utiliser NutriDash.';
        } else if (status === 'trialing') {
            desc.textContent = 'Période d\'essai Stripe' + (endFmt2 ? ' jusqu\'au ' + endFmt2 : '') + '. La facturation démarrera automatiquement à son terme.';
        } else if (status === 'active') {
            desc.textContent = 'Abonnement actif à 5,99 €/mois.' + (endFmt2 ? ' Prochain renouvellement le ' + endFmt2 + '.' : '');
        } else if (status === 'past_due') {
            desc.textContent = 'Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement.';
        } else if (status === 'canceled') {
            desc.textContent = 'Abonnement résilié.' + (endFmt2 ? ' Accès jusqu\'au ' + endFmt2 + '.' : '');
        }

        /* Boutons d'action */
        actions.innerHTML = '';
        if (status === 'none' || status === 'canceled' || !status) {
            var btn = document.createElement('button');
            btn.className = 'pv-sub-btn-primary';
            btn.textContent = 'S\'abonner — 5,99 €/mois';
            btn.addEventListener('click', startCheckout);
            actions.appendChild(btn);
        } else if (status === 'trialing' || status === 'active' || status === 'past_due') {
            var btn2 = document.createElement('button');
            btn2.className = 'pv-sub-btn-secondary';
            btn2.textContent = 'Gérer mon abonnement';
            btn2.addEventListener('click', openPortal);
            actions.appendChild(btn2);
        }
    }

    /* Redirection vers Stripe Checkout */
    window.stripeStartCheckout = async function() { return startCheckout(); };
    async function startCheckout() {
        var token = getToken();
        if (!token) return;
        var btn = document.querySelector('.pv-sub-btn-primary');
        if (btn) { btn.disabled = true; btn.textContent = 'Redirection…'; }
        try {
            var res = await fetch(getPbUrl() + '/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            var data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else if (res.status === 409) {
                alert('Vous avez déjà un abonnement actif. Gérez-le depuis votre profil.');
                if (btn) { btn.disabled = false; btn.textContent = 'S\'abonner — 5,99 €/mois'; }
            } else {
                alert('Erreur : ' + (data.error || 'Réessayez.'));
                if (btn) { btn.disabled = false; btn.textContent = 'S\'abonner — 5,99 €/mois'; }
            }
        } catch(e) {
            alert('Erreur réseau. Réessayez.');
            if (btn) { btn.disabled = false; btn.textContent = '🚀 Commencer l\'essai gratuit'; }
        }
    }

    /* Redirection vers Stripe Customer Portal */
    async function openPortal() {
        var token = getToken();
        if (!token) return;
        var btn = document.querySelector('.pv-sub-btn-secondary');
        if (btn) { btn.disabled = true; btn.textContent = 'Redirection…'; }
        try {
            var res = await fetch(getPbUrl() + '/api/stripe/portal', {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            var data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Erreur lors de l\'ouverture du portail. Réessayez.');
                if (btn) { btn.disabled = false; btn.textContent = 'Gérer mon abonnement'; }
            }
        } catch(e) {
            alert('Erreur réseau. Réessayez.');
            if (btn) { btn.disabled = false; btn.textContent = 'Gérer mon abonnement'; }
        }
    }

    /* Gérer le retour de Stripe (?stripe=success ou ?stripe=cancel) */
    function handleStripeReturn() {
        var params = new URLSearchParams(window.location.search);
        var stripeParam = params.get('stripe');
        if (!stripeParam) return;

        /* Nettoyer l'URL */
        var cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        if (stripeParam === 'success') {
            setTimeout(function() {
                alert('🎉 Abonnement activé ! Bienvenue dans NutriDash.');
                renderSubscriptionCard();
            }, 500);
        } else if (stripeParam === 'cancel') {
            setTimeout(function() {
                alert('Vous avez annulé. Votre période d\'essai reste disponible.');
            }, 300);
        }
    }

    /* Initialisation */
    function renderTrialBanner() {
        var banner = document.getElementById('trial-banner');
        if (!banner) return;
        if (typeof pb === 'undefined' || !pb.authStore.isValid) { banner.style.display = 'none'; return; }
        var trial = getTrialInfo();
        /* N'afficher que pendant l'essai et sans abonnement Stripe actif */
        var status = (pb.authStore.model && pb.authStore.model.subscription_status) || 'none';
        if (!trial || !trial.active || status === 'active' || status === 'trialing') {
            banner.style.display = 'none';
            return;
        }
        var endFmt = trial.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        var msg = trial.daysLeft <= 1
            ? 'Votre essai gratuit se termine aujourd\'hui.'
            : 'Essai gratuit — ' + trial.daysLeft + ' jour' + (trial.daysLeft > 1 ? 's' : '') + ' restant' + (trial.daysLeft > 1 ? 's' : '') + ' (jusqu\'au ' + endFmt + ')';
        banner.style.display = 'block';
        banner.innerHTML = '<div class="trial-banner">'
            + '<span class="trial-banner-text">' + msg + '</span>'
            + '</div>';
    }

    function initStripe() {
        handleStripeReturn();
        /* Bannière essai sur le dashboard */
        renderTrialBanner();
        document.querySelectorAll('[data-target="dashboard-view"]').forEach(function(el) {
            el.addEventListener('click', function() { setTimeout(renderTrialBanner, 100); });
        });
        /* Recharger la carte quand l'onglet Profil est affiché */
        document.querySelectorAll('[data-target="profile-view"], [onclick*="profile-view"]').forEach(function(el) {
            el.addEventListener('click', function() {
                setTimeout(renderSubscriptionCard, 100);
            });
        });
        /* Premier rendu si on est déjà sur le profil */
        if (!document.getElementById('profile-view').classList.contains('hidden')) {
            renderSubscriptionCard();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStripe);
    } else {
        initStripe();
    }
})();

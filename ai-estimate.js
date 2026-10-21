/* ai-estimate.js — estimation IA des repas et activités.
   Appelle /api/ai/estimate (la clé IA reste côté serveur) et pré-remplit
   les champs existants : l'utilisateur vérifie et ajuste avant de valider. */

(function () {
    var CONF = { low: 'faible', medium: 'moyenne', high: 'bonne' };

    function setStatus(el, msg, isError) {
        el.textContent = msg || '';
        el.classList.toggle('is-error', !!isError);
    }

    /* Compteur quotidien (repas / activités) : toujours affiché sous le bouton, bouton bloqué à 0.
       La dernière valeur connue est réaffichée tout de suite à l'ouverture, puis rafraîchie. */
    var lastUsage = {};

    function showUsage(type, usage) {
        var el = document.getElementById(type + '-ai-usage'), btn = document.getElementById(type + '-ai-btn');
        if (!el || !btn || !usage) return;
        lastUsage[type] = usage;
        var exhausted = usage.limit !== null && usage.remaining <= 0;
        btn.dataset.exhausted = exhausted ? '1' : '';
        btn.disabled = exhausted;
        el.classList.toggle('is-empty', exhausted);
        if (usage.limit === null) el.textContent = 'Estimations illimitées (compte admin)';
        else if (exhausted) el.textContent = "Limite atteinte (0 sur " + usage.limit + ") : saisissez à la main, nouvelles estimations demain.";
        else el.textContent = usage.remaining + ' sur ' + usage.limit + (usage.remaining > 1 ? ' estimations restantes' : ' estimation restante') + " aujourd'hui";
    }

    async function refreshUsage() {
        ['meal', 'activity'].forEach(function (t) {
            if (lastUsage[t]) showUsage(t, lastUsage[t]);
            else {
                var el = document.getElementById(t + '-ai-usage');
                if (el) { el.classList.remove('is-empty'); el.textContent = 'Chargement du compteur…'; }
            }
        });
        try {
            var u = await pb.send('/api/ai/usage', { method: 'GET' });
            showUsage('meal', u.meal);
            showUsage('activity', u.activity);
        } catch (_) {
            ['meal', 'activity'].forEach(function (t) {
                var el = document.getElementById(t + '-ai-usage');
                if (el && !lastUsage[t]) el.textContent = 'Compteur indisponible pour le moment';
            });
        }
    }

    /* Minuscules, sans accents ni ponctuation */
    function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, ' ').trim();
    }

    /* "Vélo (30 min)" => { name: 'velo', minutes: 30 } ; "Musculation (1h)" => 60 ; "Yoga 1h30" => 90 */
    function parseActivityName(label) {
        var s = String(label || '').toLowerCase();
        var minutes = null, rest = s;
        var h = s.match(/(\d+(?:[.,]\d+)?)\s*(?:h|heures?)(?![a-z])\s*(\d{1,2})?/);
        var m = s.match(/(\d+)\s*(?:min|minutes?|mn)(?![a-z])/);
        if (h) {
            minutes = Math.round(parseFloat(h[1].replace(',', '.')) * 60) + (h[2] ? parseInt(h[2], 10) : 0);
            rest = rest.replace(h[0], ' ');
        } else if (m) {
            minutes = parseInt(m[1], 10);
        }
        if (m && !(h && h[2])) rest = rest.replace(m[0], ' ');
        else if (m) rest = rest.replace(m[0], ' ');
        rest = norm(rest).replace(/^(de|du|des|d)\s+/, '');
        return { name: rest, minutes: minutes };
    }

    /* Cherche dans la liste (activités standards + personnalisées) une entrée de même nom ET même durée */
    function findListOption(activity, minutes) {
        var wanted = norm(activity), opts = document.querySelectorAll('#activity-select option');
        for (var i = 0; i < opts.length; i++) {
            var o = opts[i];
            if (!o.value || o.value === 'custom') continue;
            var p = parseActivityName(o.getAttribute('data-name'));
            if (p.minutes === minutes && p.name === wanted) return o;
        }
        return null;
    }

    /* Une activité doit préciser le type d'activité ET une durée avant l'analyse */
    var DURATION_RE = /\d+\s*(?:h|heures?|min|minutes?|mn)(?![a-z])|demi heure|une heure|quart d heure|trois quarts d heure/;
    var STOP = ['de', 'du', 'des', 'pendant', 'environ', 'ai', 'fait', 'faire', 'fais', 'une', 'un', 'les', 'pour', 'durant', 'sur', 'avec', 'et', 'dans', 'env', 'heure', 'heures', 'minutes', 'minute', 'demi', 'quart', 'trois', 'quarts', 'mon', 'ma', 'mes'];

    function activityTextError(text) {
        var t = norm(text), d = t.match(DURATION_RE);
        if (!d) return "Précisez la durée de l'activité (ex. : 45 min de vélo).";
        var words = t.replace(d[0], ' ').split(' ').filter(function (w) {
            return w.length >= 3 && /[a-z]/.test(w) && STOP.indexOf(w) < 0;
        });
        return words.length ? '' : "Précisez l'activité pratiquée (ex. : 45 min de vélo).";
    }

    async function estimate(type, textEl, btn, statusEl, apply) {
        var text = textEl.value.trim();
        if (text.length < 3) { setStatus(statusEl, 'Décrivez votre saisie en quelques mots.', true); return; }
        if (type === 'activity') {
            var problem = activityTextError(text);
            if (problem) { setStatus(statusEl, problem, true); return; }
        }
        btn.disabled = true;
        if (type === 'meal') clearRecap();
        setStatus(statusEl, 'Estimation en cours…');
        try {
            var r = await pb.send('/api/ai/estimate', { method: 'POST', body: { type: type, text: text } });
            showUsage(type, r.usage);
            var custom = apply(r);
            setStatus(statusEl, custom || ('≈ ' + apply.summary(r) + ' — confiance ' + (CONF[r.confidence] || 'faible') + '. Vérifiez et ajustez si besoin.'));
        } catch (err) {
            var msg = (err && err.response && err.response.error) || "Estimation impossible pour l'instant.";
            setStatus(statusEl, msg, true);
            if (err && err.response && err.response.usage) showUsage(type, err.response.usage);
        } finally {
            btn.disabled = btn.dataset.exhausted === '1';
        }
    }

    /* Récapitulatif de la saisie : chaque aliment avec sa quantité convertie en g / ml */
    function clearRecap() {
        var box = document.getElementById('meal-ai-recap');
        if (box) box.hidden = true;
    }

    function renderRecap(r) {
        var box = document.getElementById('meal-ai-recap'), list = document.getElementById('meal-ai-recap-list');
        if (!box || !list || !Array.isArray(r.items) || !r.items.length) { clearRecap(); return; }
        list.textContent = '';
        r.items.forEach(function (it) {
            var li = document.createElement('li'), name = document.createElement('span'),
                qty = document.createElement('span'), kc = document.createElement('span');
            var plain = String(it.quantity || '').toLowerCase().replace(/\s+/g, '');
            var std = it.amount + it.unit;
            name.textContent = it.label;
            qty.className = 'ai-recap-qty';
            qty.textContent = (!it.quantity || plain === std) ? it.amount + ' ' + it.unit : it.quantity + ' → ' + it.amount + ' ' + it.unit;
            kc.className = 'ai-recap-kcal';
            kc.textContent = it.kcal + ' kcal';
            li.appendChild(name); li.appendChild(qty); li.appendChild(kc);
            list.appendChild(li);
        });
        document.getElementById('meal-ai-recap-total').textContent =
            'Total : ' + r.calories + ' kcal · ' + r.protein_g + ' g de protéines';
        box.hidden = false;
    }

    function applyMeal(r) {
        document.getElementById('meal-cals').value = r.calories;
        document.getElementById('meal-protein').value = r.protein_g;
        renderRecap(r);
        return 'Estimation terminée (confiance ' + (CONF[r.confidence] || 'faible') + '). Vérifiez et ajustez si besoin.';
    }
    applyMeal.summary = function (r) { return r.summary ? r.summary + ' : ' + r.calories + ' kcal, ' + r.protein_g + ' g de protéines' : r.calories + ' kcal, ' + r.protein_g + ' g de protéines'; };

    /* ── Activité ─────────────────────────────────────────── */

    function activityForm() { return document.getElementById('activity-form'); }

    function exitCompactMode() {
        activityForm().classList.remove('activity-compact');
        document.getElementById('activity-ai-summary').hidden = true;
    }

    function applyActivity(r) {
        var sel = document.getElementById('activity-select');
        exitCompactMode();

        var match = findListOption(r.activity, r.minutes);
        if (match) {
            /* Existe déjà : sélection automatique, les calories de la liste s'appliquent */
            match.selected = true;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            return 'Cette activité existe déjà dans votre liste : « ' + match.getAttribute('data-name') +
                ' » a été sélectionnée (' + match.value + ' kcal).';
        }

        /* Nouvelle activité : on masque la liste, il reste le résumé et la case d'enregistrement */
        sel.value = 'custom';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        document.getElementById('activity-desc').value = r.label;
        document.getElementById('activity-burn').value = r.calories_burned;
        document.getElementById('activity-ai-summary-text').textContent = r.label + ' — ' + r.calories_burned + ' kcal brûlées';
        document.getElementById('activity-ai-summary').hidden = false;
        activityForm().classList.add('activity-compact');
        return "Nouvelle activité (confiance " + (CONF[r.confidence] || 'faible') + ") : cochez « Enregistrer dans ma liste » pour la retrouver plus tard.";
    }
    applyActivity.summary = function (r) { return r.label + ' : ' + r.calories_burned + ' kcal brûlées'; };

    function wire(type, prefix, apply) {
        var btn = document.getElementById(prefix + '-ai-btn');
        var textEl = document.getElementById(prefix + '-ai-text');
        var statusEl = document.getElementById(prefix + '-ai-status');
        if (!btn || !textEl || !statusEl) return;
        btn.addEventListener('click', function () { estimate(type, textEl, btn, statusEl, apply); });
        textEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btn.click(); }
        });
        /* Réinitialise le bloc à la fermeture de la modale, recharge le compteur à l'ouverture */
        var modal = btn.closest('.modal-overlay');
        if (modal) new MutationObserver(function () {
            if (modal.classList.contains('hidden')) {
                textEl.value = ''; setStatus(statusEl, '');
                if (type === 'activity') exitCompactMode(); else clearRecap();
            } else {
                refreshUsage();
            }
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    document.addEventListener('DOMContentLoaded', function () {
        wire('meal', 'meal', applyMeal);
        wire('activity', 'activity', applyActivity);

        var reset = document.getElementById('activity-ai-reset');
        if (reset) reset.addEventListener('click', function () {
            exitCompactMode();
            var sel = document.getElementById('activity-select');
            sel.selectedIndex = 0;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            setStatus(document.getElementById('activity-ai-status'), '');
        });
    });
})();

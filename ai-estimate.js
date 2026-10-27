/* ai-estimate.js — estimation IA des repas et activités.
   Appelle /api/ai/estimate (la clé IA reste côté serveur) et pré-remplit
   les champs existants : l'utilisateur vérifie et ajuste avant de valider. */

(function () {
    var CONF = { low: 'faible', medium: 'moyenne', high: 'bonne' };

    function setStatus(el, msg, isError) {
        el.classList.remove('is-waiting');
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

    /* Étapes affichées pendant l'attente : elles reprennent la saisie de l'utilisateur et suivent ce que fait le serveur
       (repas : décomposition en aliments puis calcul à partir des valeurs pour 100 g ; activité : durée et poids). */
    function waitSteps(type, text, restaurant) {
        var steps = [type === 'meal' ? 'Je lis la description de votre repas…' : 'Je lis votre activité…'];
        if (type === 'meal' && restaurant) {
            steps.push('Je repère les composants du plat…');
            steps.push('J’estime une portion standard de restaurant pour chacun…');
            steps.push('Je calcule calories et protéines à partir des valeurs pour 100 g…');
            steps.push('Je prépare votre récapitulatif…');
        } else if (type === 'meal') {
            var names = text.split(/,|;|\n|\bet\b|\bavec\b|\bplus\b/i).map(function (part) {
                return part.trim().replace(/^[\d.,\s]*(?:kg|g|ml|cl|dl|l|cuill\S*|tranches?|poign\S*)?\s*(?:de |d'|d’|du |des |un |une |le |la |les )?/i, '').trim();
            }).filter(function (n) { return n.length >= 2; });
            if (names.length) {
                var shown = names.slice(0, 3).map(function (n) { return n.length > 22 ? n.slice(0, 21) + '…' : n; });
                steps.push('Je repère ' + names.length + (names.length > 1 ? ' aliments : ' : ' aliment : ') + shown.join(', ') + (names.length > 3 ? '…' : '.'));
            }
            steps.push(/\d/.test(text) ? 'Je convertis vos quantités en grammes et en millilitres…' : 'Je vérifie que les quantités sont précisées…');
            steps.push('Je calcule calories et protéines à partir des valeurs pour 100 g…');
            steps.push('Je prépare votre récapitulatif…');
        } else {
            var dur = norm(text).match(DURATION_RE);
            steps.push(dur ? 'Je retiens la durée : ' + dur[0] + '.' : 'Je cherche la durée de l’activité…');
            var w = typeof state !== 'undefined' && state.profile ? Number(state.profile.weight) : 0;
            steps.push(w >= 30 ? 'Je tiens compte de votre poids (' + String(w).replace('.', ',') + ' kg).' : 'Je pars d’un poids moyen de 70 kg, faute de poids dans votre profil.');
            steps.push('J’estime les calories brûlées au-delà du métabolisme de repos…');
            steps.push('Je prépare votre résultat…');
        }
        return steps;
    }

    /* Points animés + phrase qui change toutes les ~2 s (la dernière reste affichée) ; renvoie la fonction d'arrêt. */
    function startWait(el, type, text, restaurant) {
        var steps = waitSteps(type, text, restaurant), i = 0;
        el.classList.remove('is-error');
        el.classList.add('is-waiting');
        el.innerHTML = '<span class="ia-typing" aria-hidden="true"><span></span><span></span><span></span></span><span class="ia-step"></span>';
        var line = el.querySelector('.ia-step');
        function show() {
            var next = line.cloneNode(false);
            next.textContent = steps[i];
            line.replaceWith(next); /* nouvel élément : l'animation d'entrée se rejoue */
            line = next;
        }
        show();
        var timer = setInterval(function () {
            if (i < steps.length - 1) { i++; show(); } else clearInterval(timer);
        }, 2000);
        return function () { clearInterval(timer); };
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
        var restoEl = type === 'meal' ? document.getElementById('meal-ai-restaurant') : null;
        var restaurant = !!(restoEl && restoEl.checked);
        var stopWait = startWait(statusEl, type, text, restaurant);
        try {
            var r = await pb.send('/api/ai/estimate', { method: 'POST', body: { type: type, text: text, restaurant: restaurant } });
            stopWait();
            showUsage(type, r.usage);
            r.restaurant = restaurant;
            var custom = apply(r);
            setStatus(statusEl, custom || ('≈ ' + apply.summary(r) + ' — confiance ' + (CONF[r.confidence] || 'faible') + '. Vérifiez et ajustez si besoin.'));
        } catch (err) {
            stopWait();
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

    /* Composition du repas estimé par l'IA, enregistrée avec le repas (favoris lisibles).
       Effacée dès que l'utilisateur modifie les chiffres à la main : elle ne correspondrait plus. */
    var aiFilled = null;

    function resetMealDescription() {
        window.__aiMealDesc = '';
        window.__aiMealResto = false;
        aiFilled = null;
    }

    function applyMeal(r) {
        document.getElementById('meal-cals').value = r.calories;
        document.getElementById('meal-protein').value = r.protein_g;
        window.__aiMealDesc = String(r.summary || '').slice(0, 200);
        window.__aiMealResto = !!r.restaurant;
        aiFilled = { cals: String(r.calories), prot: String(r.protein_g) };
        renderRecap(r);
        return 'Estimation terminée (confiance ' + (CONF[r.confidence] || 'faible') + '). Vérifiez et ajustez si besoin.';
    }
    /* Un repas favori remplit le formulaire : l'utilisateur ajuste puis valide (aucun appel IA) */
    window.fillMealFromFavorite = function (fav) {
        var cals = Math.round(Number(fav.calories) || 0), prot = Math.round(Number(fav.protein) || 0);
        document.getElementById('meal-cals').value = cals;
        document.getElementById('meal-protein').value = prot;
        window.__aiMealDesc = String(fav.description || '').slice(0, 200);
        window.__aiMealResto = false;
        aiFilled = { cals: String(cals), prot: String(prot) };
        clearRecap();
        var st = document.getElementById('meal-ai-status');
        if (st) setStatus(st, 'Favori « ' + fav.name + ' » appliqué. Modifiez si besoin, puis validez.');
    };

    applyMeal.summary = function (r) { return r.summary ? r.summary + ' : ' + r.calories + ' kcal, ' + r.protein_g + ' g de protéines' : r.calories + ' kcal, ' + r.protein_g + ' g de protéines'; };

    /* ── Activité ─────────────────────────────────────────── */

    /* L'estimation remplit le formulaire ; l'utilisateur ajuste puis valide */
    function applyActivity(r) {
        document.getElementById('activity-desc').value = r.label;
        document.getElementById('activity-minutes').value = r.minutes || '';
        document.getElementById('activity-burn').value = r.calories_burned;
        if (window.resetActivityFavoriteStar) window.resetActivityFavoriteStar();
        var known = window.isFavoriteActivity && window.isFavoriteActivity({ name: r.label, minutes: r.minutes });
        return known
            ? 'Cette activité est déjà dans vos favoris. Vérifiez et ajustez si besoin.'
            : 'Estimation terminée (confiance ' + (CONF[r.confidence] || 'faible') + '). Vérifiez et ajustez si besoin, ou touchez « Enregistrer en favori ».';
    }
    applyActivity.summary = function (r) { return r.label + ' : ' + r.calories_burned + ' kcal brûlées'; };

    /* Une activité favorite remplit le formulaire (aucun appel IA) */
    window.fillActivityFromFavorite = function (fav) {
        var m = Math.round(Number(fav.minutes) || 0);
        document.getElementById('activity-desc').value = fav.name + (m ? ' (' + m + ' min)' : '');
        document.getElementById('activity-minutes').value = fav.minutes || '';
        document.getElementById('activity-burn').value = Math.round(Number(fav.calories) || 0);
        var st = document.getElementById('activity-ai-status');
        if (st) setStatus(st, 'Favori « ' + fav.name + ' » appliqué. Modifiez si besoin, puis validez.');
    };

    function wire(type, prefix, apply) {
        var btn = document.getElementById(prefix + '-ai-btn');
        var textEl = document.getElementById(prefix + '-ai-text');
        var statusEl = document.getElementById(prefix + '-ai-status');
        if (!btn || !textEl || !statusEl) return;
        btn.addEventListener('click', function () { estimate(type, textEl, btn, statusEl, apply); });
        /* Réinitialise le bloc à la fermeture de la modale, recharge le compteur à l'ouverture */
        var modal = btn.closest('.modal-overlay');
        if (modal) new MutationObserver(function () {
            if (modal.classList.contains('hidden')) {
                textEl.value = ''; setStatus(statusEl, '');
                if (type === 'meal') {
                    clearRecap(); resetMealDescription();
                    var resto = document.getElementById('meal-ai-restaurant');
                    if (resto) resto.checked = false;
                }
            } else {
                if (type === 'meal') resetMealDescription();
                refreshUsage();
            }
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    document.addEventListener('DOMContentLoaded', function () {
        wire('meal', 'meal', applyMeal);
        wire('activity', 'activity', applyActivity);

        ['meal-cals', 'meal-protein'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', function () {
                if (!aiFilled) return;
                var c = document.getElementById('meal-cals').value, p = document.getElementById('meal-protein').value;
                if (c !== aiFilled.cals || p !== aiFilled.prot) resetMealDescription();
            });
        });
    });
})();

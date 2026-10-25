/* programme.js — page « Mon programme » : Objectifs, Poids, Favoris.
   Tout est calculé côté navigateur à partir de l'état déjà chargé (profil, pesées, historique 6 mois). */

(function () {
    var tab = 'objectifs';
    var period = 90;

    var GOAL_LABELS = { loss: 'Perte de poids (-10 %)', maintenance: 'Maintien du poids', gain: 'Prise de masse (+10 %)' };
    var MEAL_TYPES = [['breakfast', 'Petit-déjeuner'], ['lunch', 'Déjeuner'], ['snack', 'Collation'], ['dinner', 'Dîner']];

    function $(id) { return document.getElementById(id); }

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function pad(n) { return String(n).padStart(2, '0'); }
    function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function todayISO() { return isoOf(new Date()); }
    function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoOf(d); }
    function fmtDate(iso) { return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
    function fmtKg(n) { return (Math.round(n * 10) / 10).toLocaleString('fr-FR') + ' kg'; }

    function profile() { return (typeof state !== 'undefined' && state.profile) ? state.profile : null; }

    function emptyState(msg) {
        return '<div class="pg-card pg-card-wide pg-empty"><p>' + esc(msg) + '</p>' +
            '<button type="button" class="ai-link" onclick="navigateTo(\'profil\')">Compléter mon profil</button></div>';
    }

    function card(label, value, sub, extra) {
        return '<div class="pg-card"><span class="pg-label">' + esc(label) + '</span><span class="pg-value">' + esc(value) +
            '</span><span class="pg-sub">' + esc(sub || '') + '</span>' + (extra || '') + '</div>';
    }

    /* ── Objectifs ────────────────────────────────────────── */

    function renderObjectifs() {
        var box = $('pg-panel-objectifs'), p = profile();
        if (!p) { box.innerHTML = emptyState('Complétez votre profil pour voir vos objectifs.'); return; }

        var weight = getLatestWeight(), goal = p.goal || 'maintenance';
        var coef = goal === 'loss' ? 0.9 : (goal === 'gain' ? 1.1 : 1);
        var tdee = p.tdee || (p.bmr ? p.bmr * 1.2 : 0);
        var log = (state.history || {})[todayISO()] || {};
        var burned = Math.round(log.bonusTDEE || 0);
        var calGoal = Math.round(tdee * coef + burned), protGoal = Math.round(weight * 2);
        var calCons = Math.round(log.consumedCals || 0), protCons = Math.round(log.consumedProtein || 0);

        var target = Number(p.targetWeight) || 0, diff = weight - target, gap = '';
        if (target > 0) {
            gap = Math.abs(diff) < 0.1 ? 'Objectif de poids atteint' :
                (diff > 0 ? 'Il reste ' + fmtKg(diff) + ' à perdre' : 'Il reste ' + fmtKg(-diff) + ' à prendre');
        }

        var html = '<div class="pg-cards">' +
            card('Calories du jour', calGoal + ' kcal', 'Consommées : ' + calCons + ' kcal',
                '<span class="pg-note">Métabolisme ' + Math.round(tdee) + ' kcal × ' + String(coef).replace('.', ',') +
                (burned ? ' + ' + burned + ' kcal d\'activités' : '') + '</span>') +
            card('Protéines du jour', protGoal + ' g', 'Consommées : ' + protCons + ' g',
                '<span class="pg-note">2 g par kg de poids (' + fmtKg(weight) + ')</span>') +
            '</div>';

        html += '<div class="pg-duo">';
        html += '<section class="pg-card pg-card-wide"><h3 class="pg-h">Mon objectif</h3>' +
            '<p class="pg-goal">' + esc(GOAL_LABELS[goal] || goal) + '</p>' +
            '<div class="pg-kv"><div><span>Poids actuel</span><strong>' + esc(fmtKg(weight)) + '</strong></div>' +
            '<div><span>Poids cible</span><strong>' + (target > 0 ? esc(fmtKg(target)) : '—') + '</strong></div></div>' +
            (gap ? '<p class="pg-gap">' + esc(gap) + '</p>' : '') +
            '<button type="button" class="ai-link" onclick="navigateTo(\'profil\')">Modifier dans mon profil</button></section>';

        html += renderRegularite(tdee, protGoal) + '</div>';

        var gh = (state.goalHistory || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
        html += '<section class="pg-card pg-card-wide"><h3 class="pg-h">Historique de mes objectifs</h3>' +
            (gh.length ? '<ul class="pg-list">' + gh.slice(0, 8).map(function (g) {
                return '<li><span>' + esc(fmtDate(g.date)) + '</span><strong>' + esc(GOAL_LABELS[g.goal] || g.goal) + '</strong></li>';
            }).join('') + '</ul>' : '<p class="pg-muted">Aucun changement d\'objectif enregistré.</p>') + '</section>';

        box.innerHTML = html;
    }

    /* Régularité : bilan des 7 derniers jours complets (calcul dans utils.js) */
    function renderRegularite(tdee, protGoal) {
        var r = computeWeekBalance(state.history || {}, todayISO(), protGoal, tdee);
        var head = '<section class="pg-card pg-card-wide"><h3 class="pg-h">Ma régularité</h3>';
        if (!r.daysLogged) {
            return head + '<p class="pg-muted">Saisissez vos repas quelques jours pour voir votre bilan des 7 derniers jours.</p></section>';
        }
        var sign = r.surplus > 0 ? '+' : (r.surplus < 0 ? '−' : '');
        var kcal = sign + Math.abs(r.surplus).toLocaleString('fr-FR') + ' kcal';
        var kgAbs = Math.abs(r.kg);
        var impact = kgAbs < 0.05 ? 'Impact estimé sur le poids : négligeable' :
            'Impact estimé sur le poids : environ ' + sign + String(kgAbs.toFixed(2)).replace('.', ',') + ' kg';
        var gap = r.maxGap ? '+' + r.maxGap.kcal + ' kcal le ' + fmtDate(r.maxGap.date) : 'Aucun excédent';
        var pct = Math.round(r.daysOk / r.daysLogged * 100);
        return head + '<p class="pg-value">' + pct + ' %</p>' +
            '<p class="pg-sub">' + r.daysOk + ' jour' + (r.daysOk > 1 ? 's' : '') + ' sur ' + r.daysLogged + ' dans l\'objectif (7 derniers jours complets, aujourd\'hui exclu)</p>' +
            '<div class="pg-kv"><div><span>Bilan calorique</span><strong>' + esc(kcal) + '</strong></div>' +
            '<div><span>Plus gros écart</span><strong>' + esc(gap) + '</strong></div></div>' +
            '<p class="pg-gap">' + esc(impact) + '</p>' +
            '<p class="pg-note">Dans l\'objectif : calories entre 90 et 105 % de la cible du jour et protéines à 90 % au moins. ' +
            'Sur 1 semaine, un petit écart se voit peu : c\'est le cumul qui compte.</p></section>';
    }

    /* ── Poids ────────────────────────────────────────────── */

    function sortedWeighIns() {
        return (state.weighIns || []).filter(function (w) { return w && w.date && w.weight > 0; })
            .slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    }

    function chart(points, target) {
        var W = 600, H = 190, padL = 38, padR = 12, padT = 12, padB = 24;
        var t0 = new Date(points[0].date + 'T12:00:00').getTime();
        var t1 = new Date(points[points.length - 1].date + 'T12:00:00').getTime();
        var span = Math.max(t1 - t0, 86400000);
        var vals = points.map(function (p) { return p.weight; }).concat(target > 0 ? [target] : []);
        var lo = Math.floor(Math.min.apply(null, vals) - 1), hi = Math.ceil(Math.max.apply(null, vals) + 1);
        var x = function (d) { return padL + ((new Date(d + 'T12:00:00').getTime() - t0) / span) * (W - padL - padR); };
        var y = function (v) { return padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB); };

        var line = points.map(function (p, i) { return (i ? 'L' : 'M') + x(p.date).toFixed(1) + ' ' + y(p.weight).toFixed(1); }).join(' ');
        var dots = points.map(function (p) {
            return '<circle cx="' + x(p.date).toFixed(1) + '" cy="' + y(p.weight).toFixed(1) + '" r="3.5" class="pg-dot"><title>' +
                esc(fmtDate(p.date) + ' : ' + fmtKg(p.weight)) + '</title></circle>';
        }).join('');
        var tgt = target > 0 ? '<line x1="' + padL + '" y1="' + y(target).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(target).toFixed(1) + '" class="pg-target"/>' +
            '<text x="' + (W - padR) + '" y="' + (y(target) - 4).toFixed(1) + '" text-anchor="end" class="pg-axis-label">Cible ' + esc(fmtKg(target)) + '</text>' : '';
        return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pg-chart" role="img" aria-label="Évolution du poids">' +
            '<line x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '" class="pg-axis"/>' +
            '<text x="0" y="' + (padT + 8) + '" class="pg-axis-label">' + hi + '</text>' +
            '<text x="0" y="' + (H - padB) + '" class="pg-axis-label">' + lo + '</text>' + tgt +
            '<path d="' + line + '" class="pg-line" fill="none"/>' + dots +
            '<text x="' + padL + '" y="' + (H - 6) + '" class="pg-axis-label">' + esc(fmtDate(points[0].date)) + '</text>' +
            '<text x="' + (W - padR) + '" y="' + (H - 6) + '" text-anchor="end" class="pg-axis-label">' + esc(fmtDate(points[points.length - 1].date)) + '</text></svg>';
    }

    function renderPoids() {
        var box = $('pg-panel-poids'), p = profile();
        if (!p) { box.innerHTML = emptyState('Complétez votre profil pour suivre votre poids.'); return; }

        var all = sortedWeighIns(), cur = getLatestWeight(), target = Number(p.targetWeight) || 0;
        var first = all.length ? all[0].weight : cur;
        var from = addDays(todayISO(), -period);
        var pts = all.filter(function (w) { return w.date >= from; });

        var chips = [30, 90, 180].map(function (n) {
            return '<button type="button" class="pg-chip' + (n === period ? ' is-active' : '') + '" data-period="' + n + '">' + n + ' j</button>';
        }).join('');

        var html = '<div class="pg-cards pg-cards-3">' +
            card('Poids actuel', fmtKg(cur), all.length ? 'Pesée du ' + fmtDate(all[all.length - 1].date) : 'Poids du profil') +
            card('Poids cible', target > 0 ? fmtKg(target) : '—', target > 0 ? (Math.abs(cur - target) < 0.1 ? 'Atteint' : 'Écart ' + fmtKg(Math.abs(cur - target))) : 'Non défini') +
            card('Depuis le début', (cur - first > 0 ? '+' : '') + (Math.round((cur - first) * 10) / 10).toLocaleString('fr-FR') + ' kg', all.length + (all.length > 1 ? ' pesées' : ' pesée')) +
            '</div>';

        html += '<form class="pg-card pg-card-wide pg-weigh" id="pg-weigh-form" novalidate>' +
            '<label for="pg-weigh-input">Ma pesée du jour</label>' +
            '<div class="pg-weigh-row"><input type="number" id="pg-weigh-input" step="0.1" min="10" max="300" inputmode="decimal" placeholder="Ex : 75,5">' +
            '<button type="submit" class="pg-primary">Enregistrer</button></div>' +
            '<p class="pg-error" id="pg-weigh-error" role="alert"></p></form>';

        html += '<section class="pg-card pg-card-wide"><div class="pg-head"><h3 class="pg-h">Évolution</h3><div class="pg-chips">' + chips + '</div></div>' +
            (pts.length >= 2 ? chart(pts, target) : '<p class="pg-muted">Ajoutez au moins deux pesées sur la période pour voir la courbe.</p>') + '</section>';

        var recent = all.slice().reverse().slice(0, 10);
        html += '<section class="pg-card pg-card-wide"><h3 class="pg-h">Mes dernières pesées</h3>' +
            (recent.length ? '<ul class="pg-list">' + recent.map(function (w) {
                return '<li><span>' + esc(fmtDate(w.date)) + '</span><strong>' + esc(fmtKg(w.weight)) + '</strong>' +
                    '<button type="button" class="pg-del" data-date="' + esc(w.date) + '" aria-label="Supprimer la pesée du ' + esc(fmtDate(w.date)) + '">×</button></li>';
            }).join('') + '</ul>' : '<p class="pg-muted">Aucune pesée enregistrée.</p>') + '</section>';

        box.innerHTML = html;
    }

    function saveWeight(w) {
        var d = todayISO();
        state.profile.weight = w;
        var obj = { date: d, weight: w, timestamp: Date.now() };
        var idx = state.weighIns.findIndex(function (x) { return x.date === d; });
        if (idx !== -1) { state.weighIns[idx].weight = w; state.weighIns[idx].timestamp = obj.timestamp; }
        else state.weighIns.push(obj);
        if (typeof pb_saveWeighIn === 'function' && typeof currentUser !== 'undefined' && currentUser) pb_saveWeighIn(obj);
        if (typeof updateProfileData === 'function') updateProfileData();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof checkGoalReached === 'function' && checkGoalReached(w) && typeof showGoalReachedMessage === 'function') showGoalReachedMessage();
    }

    /* ── Favoris ──────────────────────────────────────────── */

    /* Les 3 repas les plus souvent saisis pour chaque type, sur TOUT l'historique des repas (requête légère :
       type, calories, protéines, description, date). Même composition (ou, à défaut de description, mêmes
       calories et protéines) = même repas. À égalité, le plus récent d'abord. */
    function allMeals() {
        if (typeof pb === 'undefined' || !pb.authStore.model) return Promise.reject(new Error('non connecté'));
        return pb.collection('meals').getFullList({
            filter: 'user="' + pb.authStore.model.id + '"',
            fields: 'mealType,calories,protein,description,date',
            sort: '-date',
            batch: 500
        }).then(function (rows) {
            return rows.map(function (r) {
                return { mealType: r.mealType, cals: r.calories, prot: r.protein, desc: r.description, date: String(r.date).slice(0, 10) };
            });
        });
    }

    /* Repli si la requête échoue : l'historique déjà chargé en mémoire (6 mois) */
    function memoryMeals() {
        var out = [], hist = (typeof state !== 'undefined' && state.history) || {};
        Object.keys(hist).forEach(function (date) {
            ((hist[date] && hist[date].entries) || []).forEach(function (e) {
                if (e.type === 'Repas') out.push({ mealType: e.mealType, cals: e.cals, prot: e.prot, desc: e.desc, date: date });
            });
        });
        return out;
    }

    function norm(t) {
        return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    }

    /* « riz cuit 150 g, poulet grillé 100 g » → [{ name: 'riz cuit', qty: 150, unit: 'g' }, ...] */
    function parseFoods(desc) {
        return String(desc || '').split(',').map(function (part) {
            var m = part.trim().match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s*(g|ml)$/i);
            return m ? { name: m[1].trim(), qty: parseFloat(m[2].replace(',', '.')), unit: m[3].toLowerCase() } : { name: part.trim(), qty: 0, unit: '' };
        }).filter(function (f) { return f.name; });
    }

    function median(a) {
        var v = a.slice().sort(function (x, y) { return x - y; }), h = Math.floor(v.length / 2);
        return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2;
    }

    /* Par type de repas : aliments les plus fréquents (jusqu'à 10), déduits de la description des repas */
    function favorites(meals) {
        var out = {};
        MEAL_TYPES.forEach(function (t) { out[t[0]] = { foods: {} }; });
        meals.forEach(function (e) {
            var bucket = out[e.mealType];
            if (!bucket) return;
            var seen = {};   /* un aliment compte une fois par repas */
            parseFoods(String(e.desc || '').trim()).forEach(function (f) {
                var k = norm(f.name);
                if (!k || k === 'eau' || seen[k]) return;
                seen[k] = true;
                var food = bucket.foods[k] || (bucket.foods[k] = { label: f.name, count: 0, qtys: [], unit: f.unit, last: '' });
                food.count++;
                if (f.qty > 0) { food.qtys.push(f.qty); food.unit = f.unit; }
                if (e.date > food.last) food.last = e.date;
            });
        });
        return out;
    }

    function top(obj, n) {
        return Object.keys(obj).map(function (k) { return obj[k]; })
            .sort(function (a, b) { return b.count - a.count || b.last.localeCompare(a.last); }).slice(0, n);
    }

    var favToken = 0, favData = null, favMore = {};

    function foodRow(f) {
        var usual = f.qtys.length ? 'Quantité habituelle : ~' + Math.round(median(f.qtys)) + ' ' + f.unit : 'Quantité variable';
        return '<li><div class="pg-fav-main"><strong>' + esc(f.label.charAt(0).toUpperCase() + f.label.slice(1)) + '</strong><span>' + esc(usual) +
            '</span></div><span class="pg-count">' + f.count + ' fois</span></li>';
    }

    function savedRow(f) {
        var d = f.description && f.name !== f.description ? f.description : '';
        return '<li><div class="pg-fav-main"><strong>' + esc(f.name) + '</strong><span>' + esc(f.calories + ' kcal · ' + Math.round(f.protein || 0) + ' g de protéines') +
            (d ? ' · ' + esc(d) : '') + '</span></div></li>';
    }

    function drawFavoris() {
        var box = $('pg-panel-favoris'), saved = typeof window.favMeals === 'function' ? window.favMeals() : [];
        var html = '<p class="pg-muted pg-intro">Vos repas favoris et vos aliments les plus fréquents pour chaque moment de la journée.</p>';
        MEAL_TYPES.forEach(function (t) {
            var type = t[0], foods = top(favData[type].foods, 10), expanded = !!favMore[type];
            var shown = foods.slice(0, expanded ? 10 : 5);
            var mine = saved.filter(function (f) { return f.mealType === type; });
            html += '<section class="pg-card pg-card-wide"><h3 class="pg-h">' + esc(t[1]) + '</h3>';
            html += '<h4 class="pg-sub-h">Mes repas favoris</h4>' + (mine.length
                ? '<ul class="pg-fav">' + mine.map(savedRow).join('') + '</ul>'
                : '<p class="pg-muted">Aucun repas favori : dans la fenêtre « Ajouter un repas », touchez « ☆ Favori » avant de valider un repas.</p>');
            html += '<h4 class="pg-sub-h">Aliments les plus fréquents</h4>';
            if (foods.length) {
                html += '<ul class="pg-fav">' + shown.map(foodRow).join('') + '</ul>';
                if (foods.length > 5) {
                    html += '<button type="button" class="ai-link pg-more" data-type="' + type + '">' + (expanded ? 'Voir moins' : 'Voir plus (' + (foods.length - 5) + ')') + '</button>';
                }
            } else {
                html += '<p class="pg-muted">Pas encore d\'aliments pour ce moment : ajoutez vos repas avec l\'IA pour les voir ici.</p>';
            }
            html += '</section>';
        });
        box.innerHTML = html;
    }

    function renderFavoris() {
        var box = $('pg-panel-favoris'), token = ++favToken;
        box.innerHTML = window.foodLoader('Chargement de vos repas…');
        var saved = typeof window.loadFavorites === 'function' ? window.loadFavorites(true) : Promise.resolve([]);
        Promise.all([allMeals().catch(function () { return memoryMeals(); }), saved]).then(function (res) {
            if (token !== favToken) return; /* un rendu plus récent a pris le relais */
            favData = favorites(res[0]);
            drawFavoris();
        });
    }

    /* ── Onglets ──────────────────────────────────────────── */

    function renderTab() {
        if (tab === 'poids') renderPoids();
        else if (tab === 'favoris') renderFavoris();
        else renderObjectifs();
    }

    function setTab(name) {
        tab = name;
        document.querySelectorAll('.pg-tab').forEach(function (b) {
            var on = b.dataset.tab === name;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        ['objectifs', 'poids', 'favoris'].forEach(function (n) { $('pg-panel-' + n).hidden = n !== name; });
        renderTab();
    }

    window.renderProgramme = function () { renderTab(); };

    function init() {
        if (!$('programme-view')) return;
        document.querySelectorAll('.pg-tab').forEach(function (b) {
            b.addEventListener('click', function () { setTab(b.dataset.tab); });
        });

        var poids = $('pg-panel-poids');
        poids.addEventListener('click', function (e) {
            var chip = e.target.closest('.pg-chip');
            if (chip) { period = parseInt(chip.dataset.period, 10); renderPoids(); return; }
            var del = e.target.closest('.pg-del');
            if (del && typeof window.deleteWeighIn === 'function') {
                var before = (state.weighIns || []).length;
                window.deleteWeighIn(del.dataset.date);
                if ((state.weighIns || []).length !== before) renderPoids();
            }
        });
        $('pg-panel-favoris').addEventListener('click', function (e) {
            var more = e.target.closest('.pg-more');
            if (!more || !favData) return;
            favMore[more.dataset.type] = !favMore[more.dataset.type];
            drawFavoris();
        });
        poids.addEventListener('submit', function (e) {
            if (e.target.id !== 'pg-weigh-form') return;
            e.preventDefault();
            var w = parseFloat(String($('pg-weigh-input').value).replace(',', '.'));
            var err = $('pg-weigh-error');
            if (!(w >= 10 && w <= 300)) { err.textContent = 'Saisissez un poids entre 10 et 300 kg.'; return; }
            saveWeight(Math.round(w * 10) / 10);
            renderPoids();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

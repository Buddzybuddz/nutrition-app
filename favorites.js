/* favorites.js — repas favoris : enregistrer un repas (composition + calories + protéines) et le réutiliser.
   Dans la fenêtre « Ajouter un repas » : sélecteur « Nouveau repas | Mes favoris », liste de favoris à choisir puis
   « Utiliser ce favori » (remplit le formulaire, l'utilisateur valide), et une étoile « Favori » (dans le
   récapitulatif de l'estimation, ou près des calories en saisie manuelle) pour enregistrer le repas ajouté.
   Aucun appel IA : aucun crédit consommé. Favoris stockés dans PocketBase (favorite_meals, 10 max par moment).
   Le journal de l'accueil et l'onglet Favoris de « Mon programme » ne font que les afficher. */

(function () {
    var TYPE_LABELS = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', snack: 'Collation', dinner: 'Dîner' };
    var items = [];
    var loaded = false;
    var wanted = false;      /* étoile cochée : le repas sera enregistré en favori à l'ajout */
    var mode = 'new';        /* 'new' | 'fav' */
    var selectedId = null;

    function $(id) { return document.getElementById(id); }

    function me() { return (typeof pb !== 'undefined' && pb.authStore.isValid) ? pb.authStore.model : null; }
    function toast(msg) { if (typeof showToast === 'function') showToast(msg); }

    function signature(type, desc, cals, prot) {
        return [type, String(desc || '').trim().toLowerCase(), Math.round(Number(cals) || 0), Math.round(Number(prot) || 0)].join('|');
    }
    function favSig(f) { return signature(f.mealType, f.description, f.calories, f.protein); }
    function entrySig(e) { return signature(e.mealType, e.desc, e.cals, e.prot); }

    window.favMeals = function () { return items; };

    window.isFavoriteMeal = function (entry) {
        var s = entrySig(entry);
        return items.some(function (f) { return favSig(f) === s; });
    };

    window.loadFavorites = async function (force) {
        if (!me()) { items = []; loaded = false; return items; }
        if (loaded && !force) return items;
        try {
            items = await pb.collection('favorite_meals').getFullList({ filter: 'user="' + me().id + '"', sort: '-created' });
            loaded = true;
        } catch (_) { items = []; }
        renderList();
        return items;
    };

    async function addFavorite(entry) {
        var u = me();
        if (!u || !entry || !entry.mealType) return false;
        if (window.isFavoriteMeal(entry)) { toast('Ce repas est déjà dans vos favoris.'); return false; }
        var desc = String(entry.desc || '').trim();
        var cals = Math.round(Number(entry.cals) || 0);
        try {
            var rec = await pb.collection('favorite_meals').create({
                user: u.id,
                mealType: entry.mealType,
                name: (desc || (TYPE_LABELS[entry.mealType] || 'Repas') + ' · ' + cals + ' kcal').slice(0, 120),
                description: desc.slice(0, 200),
                calories: cals,
                protein: Math.round(Number(entry.prot) || 0)
            });
            items.unshift(rec);
            toast('Ajouté à vos repas favoris.');
            renderList();
            return true;
        } catch (err) {
            var msg = err && err.response && err.response.message;
            toast(msg && /Limite/.test(msg) ? msg : "Impossible d'ajouter ce favori pour le moment.");
            return false;
        }
    }

    window.removeFavorite = async function (id) {
        try {
            await pb.collection('favorite_meals').delete(id);
            items = items.filter(function (f) { return f.id !== id; });
            if (selectedId === id) selectedId = null;
            renderList();
            toast('Favori supprimé.');
            return true;
        } catch (_) { toast('Suppression impossible pour le moment.'); return false; }
    };

    /* Appelée par app.js après l'ajout d'un repas : enregistre en favori si l'étoile est cochée */
    window.maybeSaveFavorite = function (entry) {
        if (!wanted) return;
        setWanted(false);
        return addFavorite(entry);
    };

    /* ── Étoile « Favori » ───────────────────────────────── */

    function setWanted(v) {
        wanted = !!v;
        document.querySelectorAll('#meal-modal .fav-star').forEach(function (b) {
            b.setAttribute('aria-pressed', wanted ? 'true' : 'false');
            b.classList.toggle('is-on', wanted);
            b.textContent = (wanted ? '★ ' : '☆ ') + b.dataset.label;
        });
    }

    /* ── Modes « Nouveau repas | Mes favoris » ───────────── */

    function currentType() { var s = $('meal-type'); return s ? s.value : ''; }
    function isEditing() { var f = $('meal-form'); return !!(f && f.dataset.editingId); }

    function setMode(m) {
        mode = m;
        document.querySelectorAll('#meal-modes .meal-mode').forEach(function (b) {
            var on = b.dataset.mode === m;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $('meal-mode-new').hidden = m !== 'new';
        $('meal-mode-fav').hidden = m !== 'fav';
        $('meal-form').classList.toggle('is-fav-mode', m === 'fav');
        if (m === 'fav') renderList();
    }

    /* Affiche ou masque les éléments selon le contexte (modification d'un repas, récapitulatif visible…) */
    function syncVisibility() {
        var editing = isEditing(), recap = $('meal-ai-recap');
        $('meal-modes').hidden = editing;
        if (editing && mode === 'fav') setMode('new');
        $('meal-fav-manual').hidden = editing || (recap && !recap.hidden);
        var rs = $('meal-fav-star-recap'); if (rs) rs.hidden = editing;
    }

    function renderList() {
        var list = $('meal-fav-list');
        if (!list) return;
        var mine = items.filter(function (f) { return f.mealType === currentType(); });
        var count = $('meal-fav-count');
        count.textContent = mine.length;
        count.hidden = !mine.length;
        if (mode !== 'fav') return;
        if (selectedId && !mine.some(function (f) { return f.id === selectedId; })) selectedId = null;
        list.textContent = '';
        if (!mine.length) {
            var empty = document.createElement('p');
            empty.className = 'meal-fav-empty';
            empty.textContent = 'Aucun favori pour ce moment de la journée. Estimez un repas, puis touchez « ☆ Favori » avant de l\'ajouter.';
            list.appendChild(empty);
        }
        mine.forEach(function (f) {
            var row = document.createElement('div');
            row.className = 'meal-fav-row' + (f.id === selectedId ? ' is-selected' : '');

            var pick = document.createElement('button');
            pick.type = 'button';
            pick.className = 'meal-fav-pick';
            pick.setAttribute('role', 'radio');
            pick.setAttribute('aria-checked', f.id === selectedId ? 'true' : 'false');
            var radio = document.createElement('span'); radio.className = 'meal-fav-radio';
            var text = document.createElement('span'); text.className = 'meal-fav-text';
            var strong = document.createElement('strong'); strong.textContent = f.name;
            var sub = document.createElement('span'); sub.textContent = f.calories + ' kcal · ' + Math.round(f.protein || 0) + ' g de protéines';
            text.appendChild(strong); text.appendChild(sub);
            pick.appendChild(radio); pick.appendChild(text);
            pick.addEventListener('click', function () { selectedId = f.id; renderList(); });

            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'meal-fav-remove';
            del.setAttribute('aria-label', 'Supprimer le favori ' + f.name);
            del.title = 'Supprimer ce favori';
            del.textContent = '×';
            del.addEventListener('click', function () {
                if (window.confirm('Supprimer ce repas favori ?')) window.removeFavorite(f.id);
            });

            row.appendChild(pick); row.appendChild(del);
            list.appendChild(row);
        });
        $('meal-fav-use').disabled = !selectedId;
    }

    function useSelected() {
        var fav = items.find(function (f) { return f.id === selectedId; });
        if (!fav) return;
        setWanted(false);
        setMode('new');
        if (window.fillMealFromFavorite) window.fillMealFromFavorite(fav);
    }

    function init() {
        var sel = $('meal-type'), modal = $('meal-modal');
        if (!sel || !modal || !$('meal-modes')) return;

        document.querySelectorAll('#meal-modes .meal-mode').forEach(function (b) {
            b.addEventListener('click', function () { setMode(b.dataset.mode); });
        });
        document.querySelectorAll('#meal-modal .fav-star').forEach(function (b) {
            b.addEventListener('click', function () { setWanted(!wanted); });
        });
        $('meal-fav-use').addEventListener('click', useSelected);
        sel.addEventListener('change', function () { selectedId = null; renderList(); });

        var recap = $('meal-ai-recap');
        if (recap) new MutationObserver(syncVisibility).observe(recap, { attributes: true, attributeFilter: ['hidden'] });

        new MutationObserver(function () {
            if (modal.classList.contains('hidden')) return;
            /* ouverture : état neutre */
            wanted = false; selectedId = null; setWanted(false);
            setMode('new');
            syncVisibility();
            window.loadFavorites().then(renderList);
            renderList();
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });

        if (typeof pb !== 'undefined') {
            pb.authStore.onChange(function () {
                loaded = false; items = [];
                if (me()) window.loadFavorites(true).then(function () {
                    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (_) {}
                });
            }, true);
        }
        setWanted(false);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

/* favorite-activities.js — activités favorites : enregistrer une activité (nom + durée + calories brûlées) et la réutiliser.
   Dans la fenêtre « Ajouter une activité » : sélecteur « Nouvelle activité | Mes favoris », liste de favoris à choisir puis
   « Utiliser ce favori » (remplit le formulaire, l'utilisateur valide), et une étoile « Enregistrer en favori » pour
   garder l'activité ajoutée. Aucun appel IA : aucun crédit consommé. Favoris stockés dans PocketBase
   (favorite_activities, 10 max par utilisateur). Le journal de l'accueil ne fait que les signaler (★). */

(function () {
    var items = [];
    var loaded = false;
    var wanted = false;      /* étoile cochée : l'activité sera enregistrée en favori à l'ajout */
    var mode = 'new';        /* 'new' | 'fav' */
    var selectedId = null;

    function $(id) { return document.getElementById(id); }

    function me() { return (typeof pb !== 'undefined' && pb.authStore.isValid) ? pb.authStore.model : null; }
    function toast(msg) { if (typeof showToast === 'function') showToast(msg); }
    /* « Vélo (45 min) » => « Vélo » : la durée est enregistrée à part et se compare à part */
    var DURATION = /\s*[(\[]?\s*\d+(?:[.,]\d+)?\s*(?:h|heures?|min|minutes?|mn)(?![a-z])\s*(?:\d{1,2})?\s*[)\]]?\s*/i;
    function baseName(s) {
        var raw = String(s || '').trim(), b = raw.replace(DURATION, ' ').replace(/\s+/g, ' ').trim();
        return b || raw;
    }
    function normName(s) { return baseName(s).toLowerCase(); }
    function mins(v) { return Math.round(Number(v) || 0); }

    /* Une activité saisie (nom + durée) ou une ligne du journal (nom + calories, sans durée) */
    window.isFavoriteActivity = function (x) {
        var name = normName(x.name);
        return items.some(function (f) {
            if (normName(f.name) !== name) return false;
            return x.minutes !== undefined ? mins(f.minutes) === mins(x.minutes) : mins(f.calories) === mins(x.cals);
        });
    };

    window.loadFavoriteActivities = async function (force) {
        if (!me()) { items = []; loaded = false; return items; }
        if (loaded && !force) return items;
        try {
            items = await pb.collection('favorite_activities').getFullList({ filter: 'user="' + me().id + '"', sort: '-created' });
            loaded = true;
        } catch (_) { items = []; }
        renderList();
        return items;
    };

    async function addFavorite(entry) {
        var u = me();
        var name = String(entry && entry.name || '').trim();
        if (!u || !name) return false;
        if (window.isFavoriteActivity({ name: name, minutes: entry.minutes })) { toast('Cette activité est déjà dans vos favoris.'); return false; }
        try {
            var rec = await pb.collection('favorite_activities').create({
                user: u.id,
                name: baseName(name).slice(0, 120),
                minutes: mins(entry.minutes),
                calories: mins(entry.cals)
            });
            items.unshift(rec);
            toast('Ajoutée à vos activités favorites.');
            renderList();
            if (typeof updateDashboard === 'function') updateDashboard();
            return true;
        } catch (err) {
            var msg = err && err.response && err.response.message;
            toast(msg && /Limite/.test(msg) ? msg : "Impossible d'ajouter ce favori pour le moment.");
            return false;
        }
    }

    window.removeFavoriteActivity = async function (id) {
        try {
            await pb.collection('favorite_activities').delete(id);
            items = items.filter(function (f) { return f.id !== id; });
            if (selectedId === id) selectedId = null;
            renderList();
            if (typeof updateDashboard === 'function') updateDashboard();
            toast('Favori supprimé.');
            return true;
        } catch (_) { toast('Suppression impossible pour le moment.'); return false; }
    };

    /* Appelée par app.js après l'ajout d'une activité : enregistre en favori si l'étoile est cochée */
    window.maybeSaveFavoriteActivity = function (entry) {
        if (!wanted) return;
        setWanted(false);
        return addFavorite(entry);
    };

    /* ── Étoile « Favori » ───────────────────────────────── */

    function setWanted(v) {
        wanted = !!v;
        var b = $('activity-fav-star');
        if (!b) return;
        b.setAttribute('aria-pressed', wanted ? 'true' : 'false');
        b.classList.toggle('is-on', wanted);
        b.textContent = (wanted ? '★ ' : '☆ ') + b.dataset.label;
    }
    window.resetActivityFavoriteStar = function () { setWanted(false); };

    /* ── Modes « Nouvelle activité | Mes favoris » ───────── */

    function isEditing() { var f = $('activity-form'); return !!(f && f.dataset.editingId); }

    function setMode(m) {
        mode = m;
        document.querySelectorAll('#activity-modes .meal-mode').forEach(function (b) {
            var on = b.dataset.mode === m;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $('activity-mode-new').hidden = m !== 'new';
        $('activity-mode-fav').hidden = m !== 'fav';
        $('activity-form').classList.toggle('is-fav-mode', m === 'fav');
        if (m === 'fav') renderList();
    }

    /* Pas de modes ni d'étoile quand on modifie une activité déjà ajoutée */
    function syncVisibility() {
        var editing = isEditing();
        $('activity-modes').hidden = editing;
        if (editing && mode === 'fav') setMode('new');
        $('activity-fav-manual').hidden = editing;
    }

    function subtitle(f) {
        return (mins(f.minutes) ? mins(f.minutes) + ' min · ' : '') + mins(f.calories) + ' kcal brûlées';
    }

    function renderList() {
        var list = $('activity-fav-list');
        if (!list) return;
        var count = $('activity-fav-count');
        count.textContent = items.length;
        count.hidden = !items.length;
        if (mode !== 'fav') return;
        if (selectedId && !items.some(function (f) { return f.id === selectedId; })) selectedId = null;
        list.textContent = '';
        if (!items.length) {
            var empty = document.createElement('p');
            empty.className = 'meal-fav-empty';
            empty.textContent = 'Aucune activité favorite. Renseignez une activité, puis touchez « ☆ Enregistrer en favori » avant de l\'ajouter.';
            list.appendChild(empty);
        }
        items.forEach(function (f) {
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
            var sub = document.createElement('span'); sub.textContent = subtitle(f);
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
                if (window.confirm('Supprimer cette activité favorite ?')) window.removeFavoriteActivity(f.id);
            });

            row.appendChild(pick); row.appendChild(del);
            list.appendChild(row);
        });
        $('activity-fav-use').disabled = !selectedId;
    }

    function useSelected() {
        var fav = items.find(function (f) { return f.id === selectedId; });
        if (!fav) return;
        setWanted(false);
        setMode('new');
        if (window.fillActivityFromFavorite) window.fillActivityFromFavorite(fav);
    }

    function init() {
        var modal = $('activity-modal');
        if (!modal || !$('activity-modes')) return;

        document.querySelectorAll('#activity-modes .meal-mode').forEach(function (b) {
            b.addEventListener('click', function () { setMode(b.dataset.mode); });
        });
        $('activity-fav-star').addEventListener('click', function () { setWanted(!wanted); });
        $('activity-fav-use').addEventListener('click', useSelected);

        new MutationObserver(function () {
            if (modal.classList.contains('hidden')) return;
            /* ouverture : état neutre */
            wanted = false; selectedId = null; setWanted(false);
            setMode('new');
            syncVisibility();
            window.loadFavoriteActivities().then(renderList);
            renderList();
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });

        if (typeof pb !== 'undefined') {
            pb.authStore.onChange(function () {
                loaded = false; items = [];
                if (me()) window.loadFavoriteActivities(true).then(function () {
                    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (_) {}
                });
            }, true);
        }
        setWanted(false);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

/* admin.js — menu et vue Administration (tableau de bord comptes/abonnements). Lecture seule.
   Visible uniquement si users.is_admin = true ; le serveur revérifie à chaque appel. */

(function () {
    var DAY = 86400000;
    var TRIAL_DAYS = 7;

    var STATUSES = {
        active:        { label: 'Abonné actif',           color: '#2D6A4F' },
        trial:         { label: 'Essai en cours',         color: '#E0A526' },
        cancelling:    { label: 'Résiliation programmée', color: '#E07A5F' },
        past_due:      { label: 'Impayé',                 color: '#D64545' },
        trial_expired: { label: 'Essai expiré',           color: '#A8B5AD' },
        canceled:      { label: 'Résilié',                color: '#7C8A82' },
        exempt:        { label: 'Exempté',                color: '#5B8DEF' }
    };

    var state = { data: null, period: 30, search: '', status: 'all' };

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function parseDate(v) {
        if (!v) return null;
        var d = new Date(String(v).replace(' ', 'T'));
        return isNaN(d.getTime()) ? null : d;
    }

    function fmtDate(v) {
        var d = parseDate(v);
        return d ? d.toLocaleDateString('fr-FR') : '—';
    }

    function ago(v) {
        var d = parseDate(v);
        if (!d) return '—';
        var days = Math.floor((Date.now() - d.getTime()) / DAY);
        if (days < 1) return "aujourd'hui";
        if (days === 1) return 'hier';
        if (days < 30) return 'il y a ' + days + ' j';
        if (days < 365) return 'il y a ' + Math.floor(days / 30) + ' mois';
        return 'il y a ' + Math.floor(days / 365) + ' an(s)';
    }

    function fmtEur(n) {
        return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    }

    function isAdmin() {
        return typeof pb !== 'undefined' && !!(pb.authStore.model && pb.authStore.model.is_admin);
    }

    function syncMenu() {
        var btn = document.getElementById('dashboard-admin-btn');
        if (btn) btn.hidden = !isAdmin();
    }

    /* ── KPIs ─────────────────────────────────────────────── */
    function trend(cur, prev, suffix) {
        var diff = cur - prev;
        if (diff === 0) return '<span class="admin-trend is-flat">= ' + suffix + '</span>';
        return '<span class="admin-trend ' + (diff > 0 ? 'is-up' : 'is-down') + '">' +
            (diff > 0 ? '▲ +' : '▼ ') + diff + ' ' + suffix + '</span>';
    }

    function kpi(label, value, sub) {
        return '<div class="admin-kpi"><span class="admin-kpi-label">' + esc(label) + '</span>' +
            '<span class="admin-kpi-value">' + esc(value) + '</span>' +
            '<span class="admin-kpi-sub">' + (sub || '&nbsp;') + '</span></div>';
    }

    function renderKpis(d) {
        var f = d.funnel;
        return '<div class="admin-kpis">' +
            kpi('Comptes', d.total, '+' + d.signups_7d + ' cette semaine') +
            kpi('Inscrits 30 j', d.signups_30d, trend(d.signups_30d, d.prev_signups_30d, 'vs 30 j préc.')) +
            kpi('Abonnés', f.paying, esc(d.conversion_pct + ' % de conversion')) +
            kpi('MRR', fmtEur(d.mrr), esc(fmtEur(d.price) + ' / abonné')) +
            kpi('Non vérifiés', d.unverified, '&nbsp;') +
            '</div>';
    }

    /* ── Usage de l'estimation IA ─────────────────────────── */
    function split(m, a, c) { return m + ' repas · ' + a + (a > 1 ? ' activités' : ' activité') + ' · ' + c + (c > 1 ? ' messages' : ' message'); }

    function renderAi(d) {
        if (!d.ai) return '';
        var t = d.ai.today, w = d.ai.last7;
        var calls = w.meal + w.activity + w.chat, total = w.meal + w.activity + w.cache_hits;
        var hitPct = total ? Math.round((w.cache_hits / total) * 100) + ' % du cache (7 j)' : 'aucune estimation (7 j)';
        return '<section class="admin-card admin-card-wide"><h3 class="admin-h">Usage IA<span class="admin-h-note">limites par utilisateur et par jour : ' +
            d.ai.limits.meal + ' repas · ' + d.ai.limits.activity + ' activités · ' + d.ai.limits.chat + ' messages</span></h3>' +
            '<div class="admin-kpis">' +
            kpi("Aujourd'hui", t.meal + t.activity + t.chat, esc(split(t.meal, t.activity, t.chat))) +
            kpi('7 derniers jours', calls, esc(split(w.meal, w.activity, w.chat))) +
            kpi('Utilisateurs IA (jour)', t.users, esc(w.users + ' sur 7 j')) +
            kpi('Réponses gratuites', w.cache_hits, esc(hitPct)) +
            '</div></section>';
    }

    /* ── Courbe des inscriptions ──────────────────────────── */
    function renderChart(d) {
        var n = state.period, days = [], max = 1, i;
        var today = new Date();
        for (i = n - 1; i >= 0; i--) {
            var key = new Date(today.getTime() - i * DAY).toISOString().slice(0, 10);
            var c = d.per_day[key] || 0;
            if (c > max) max = c;
            days.push({ key: key, count: c });
        }
        var W = 600, H = 150, padL = 22, padB = 18, plotW = W - padL, plotH = H - padB - 8;
        var slot = plotW / n, bw = Math.max(2, slot * 0.68);
        var bars = days.map(function (day, idx) {
            var h = day.count ? Math.max(3, (day.count / max) * plotH) : 0;
            var x = padL + idx * slot + (slot - bw) / 2;
            return '<rect x="' + x.toFixed(1) + '" y="' + (8 + plotH - h).toFixed(1) + '" width="' + bw.toFixed(1) +
                '" height="' + h.toFixed(1) + '" rx="2" class="admin-bar"><title>' +
                esc(fmtDate(day.key) + ' : ' + day.count + ' inscription(s)') + '</title></rect>';
        }).join('');
        var grid = '<line x1="' + padL + '" y1="' + (8 + plotH) + '" x2="' + W + '" y2="' + (8 + plotH) + '" class="admin-axis"/>' +
            '<line x1="' + padL + '" y1="8" x2="' + W + '" y2="8" class="admin-axis is-dashed"/>' +
            '<text x="0" y="12" class="admin-axis-label">' + max + '</text>' +
            '<text x="0" y="' + (8 + plotH) + '" class="admin-axis-label">0</text>' +
            '<text x="' + padL + '" y="' + (H - 3) + '" class="admin-axis-label">' + esc(fmtDate(days[0].key)) + '</text>' +
            '<text x="' + W + '" y="' + (H - 3) + '" text-anchor="end" class="admin-axis-label">' + esc(fmtDate(days[n - 1].key)) + '</text>';
        var total = days.reduce(function (a, x) { return a + x.count; }, 0);

        var toggle = [7, 30, 90].map(function (p) {
            return '<button type="button" class="admin-chip' + (p === n ? ' is-active' : '') + '" data-period="' + p + '">' + p + ' j</button>';
        }).join('');

        return '<section class="admin-card admin-card-wide"><div class="admin-card-head"><h3 class="admin-h">Inscriptions par jour' +
            '<span class="admin-h-note">' + total + ' sur la période</span></h3><div class="admin-chips">' + toggle + '</div></div>' +
            '<svg viewBox="0 0 ' + W + ' ' + H + '" class="admin-chart" role="img" aria-label="Inscriptions par jour">' + grid + bars +
            (total ? '' : '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" class="admin-axis-label">Aucune inscription sur la période</text>') +
            '</svg></section>';
    }

    /* ── Anneau des statuts ───────────────────────────────── */
    function renderDonut(d) {
        var keys = Object.keys(STATUSES), total = d.total || 1, cum = 0;
        var arcs = keys.map(function (k) {
            var cnt = d.by_status[k] || 0;
            if (!cnt) return '';
            var pct = (cnt / total) * 100;
            var arc = '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="' + STATUSES[k].color +
                '" stroke-width="5.5" stroke-dasharray="' + pct.toFixed(2) + ' ' + (100 - pct).toFixed(2) +
                '" stroke-dashoffset="' + (25 - cum).toFixed(2) + '"><title>' + esc(STATUSES[k].label + ' : ' + cnt) + '</title></circle>';
            cum += pct;
            return arc;
        }).join('');
        var legend = keys.map(function (k) {
            return '<li><span class="admin-dot" style="background:' + STATUSES[k].color + '"></span>' +
                '<span class="admin-legend-label">' + esc(STATUSES[k].label) + '</span>' +
                '<strong>' + (d.by_status[k] || 0) + '</strong></li>';
        }).join('');
        return '<section class="admin-card"><h3 class="admin-h">Statuts</h3><div class="admin-donut-wrap">' +
            '<svg viewBox="0 0 42 42" class="admin-donut" role="img" aria-label="Répartition des statuts">' +
            '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="#EEF2EC" stroke-width="5.5"/>' + arcs +
            '<text x="21" y="22.5" text-anchor="middle" class="admin-donut-total">' + d.total + '</text></svg>' +
            '<ul class="admin-legend">' + legend + '</ul></div></section>';
    }

    /* ── Entonnoir ────────────────────────────────────────── */
    function renderFunnel(d) {
        var f = d.funnel;
        var steps = [
            { label: 'Inscrits',               n: f.signed_up },
            { label: 'Email vérifié',          n: f.verified },
            { label: 'Ont saisi un repas',     n: f.with_meal },
            { label: 'Abonnés payants',        n: f.paying }
        ];
        var base = Math.max(1, steps[0].n);
        var rows = steps.map(function (s, i) {
            var w = Math.max(s.n ? 2 : 0, (s.n / base) * 100);
            var step = i > 0 && steps[i - 1].n > 0 ? Math.round((s.n / steps[i - 1].n) * 100) + ' % de l\'étape précédente' : '&nbsp;';
            return '<div class="admin-funnel-row"><div class="admin-funnel-head"><span>' + esc(s.label) +
                '</span><strong>' + s.n + '</strong></div><div class="admin-funnel-track"><div class="admin-funnel-fill" style="width:' +
                w.toFixed(1) + '%;opacity:' + (1 - i * 0.18) + '"></div></div><span class="admin-funnel-sub">' + step + '</span></div>';
        }).join('');
        return '<section class="admin-card"><h3 class="admin-h">Entonnoir</h3>' + rows + '</section>';
    }

    /* ── Liste des comptes ────────────────────────────────── */
    function trialMeta(u) {
        if (u.status !== 'trial') return '';
        var end = parseDate(u.subscription_end);
        if (!end) return '';
        var left = Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY));
        var pct = Math.min(100, Math.max(0, ((TRIAL_DAYS - left) / TRIAL_DAYS) * 100));
        return '<div class="admin-trial"><div class="admin-trial-bar"><span style="width:' + pct.toFixed(0) + '%"></span></div>' +
            '<small>J-' + left + '</small></div>';
    }

    function renderRows() {
        var q = state.search.trim().toLowerCase();
        var list = state.data.users.filter(function (u) {
            if (state.status !== 'all' && u.status !== state.status) return false;
            return !q || String(u.email || '').toLowerCase().indexOf(q) !== -1;
        });
        if (!list.length) return '<p class="admin-empty">Aucun compte ne correspond.</p>';
        return list.map(function (u) {
            var st = STATUSES[u.status] || { label: u.status, color: '#A8B5AD' };
            return '<div class="admin-row"><span class="admin-dot" style="background:' + st.color + '"></span>' +
                '<div class="admin-row-main"><span class="admin-row-email">' + esc(u.email) + '</span>' +
                '<small>Inscrit ' + esc(ago(u.created)) + ' · ' + u.meals + ' repas' + (u.verified ? '' : ' · non vérifié') + '</small></div>' +
                trialMeta(u) +
                '<span class="admin-pill" style="--pill:' + st.color + '">' + esc(st.label) + '</span></div>';
        }).join('');
    }

    function renderList() {
        var opts = '<option value="all">Tous les statuts</option>' + Object.keys(STATUSES).map(function (k) {
            return '<option value="' + k + '"' + (state.status === k ? ' selected' : '') + '>' + esc(STATUSES[k].label) + '</option>';
        }).join('');
        return '<section class="admin-card admin-card-wide"><div class="admin-card-head"><h3 class="admin-h">Comptes</h3>' +
            '<div class="admin-filters"><input type="search" id="admin-search" class="admin-input" placeholder="Rechercher un email" value="' + esc(state.search) + '">' +
            '<select id="admin-status" class="admin-input">' + opts + '</select></div></div>' +
            '<div id="admin-rows" class="admin-rows">' + renderRows() + '</div></section>';
    }

    function render() {
        var box = document.getElementById('admin-content');
        var d = state.data;
        box.innerHTML = renderKpis(d) +
            '<div class="admin-grid">' + renderChart(d) + renderDonut(d) + renderFunnel(d) + '</div>' +
            renderAi(d) +
            renderList();
    }

    /* Délégation : un seul jeu de listeners, survit aux re-rendus */
    function bind() {
        var box = document.getElementById('admin-content');
        if (!box || box.dataset.bound) return;
        box.dataset.bound = '1';
        box.addEventListener('click', function (e) {
            var chip = e.target.closest('.admin-chip');
            if (chip && state.data) { state.period = parseInt(chip.dataset.period, 10); render(); }
        });
        box.addEventListener('input', function (e) {
            if (e.target.id === 'admin-search') {
                state.search = e.target.value;
                document.getElementById('admin-rows').innerHTML = renderRows();
            }
        });
        box.addEventListener('change', function (e) {
            if (e.target.id === 'admin-status') {
                state.status = e.target.value;
                document.getElementById('admin-rows').innerHTML = renderRows();
            }
        });
    }

    window.renderAdmin = async function () {
        var box = document.getElementById('admin-content');
        if (!box) return;
        if (!isAdmin()) { box.innerHTML = ''; return; }
        bind();
        if (!state.data) box.textContent = 'Chargement…';
        try {
            state.data = await pb.send('/api/admin/stats', { method: 'GET' });
            render();
        } catch (err) {
            box.textContent = 'Impossible de charger les statistiques.';
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof pb === 'undefined') return;
        pb.authStore.onChange(syncMenu, true);
        /* Rechargement sur #admin : la vue est déjà affichée avant la définition de renderAdmin */
        var view = document.getElementById('admin-view');
        if (view && !view.classList.contains('hidden')) window.renderAdmin();
    });
})();

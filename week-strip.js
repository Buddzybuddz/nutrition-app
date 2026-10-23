/* Bandeau de la semaine (accueil) : sélection d'un jour, repère d'objectif par jour,
   calendrier mensuel. Lit state.history (6 mois chargés au login) ; changer de jour passe par
   loadDayData() pour les jours hors historique. */
(function () {
    var DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    var calMonth = null; /* 1er du mois affiché dans le calendrier (Date) */

    function iso(d) { return formatISOLocal(d); }
    function addDays(d, n) { var r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return r; }
    function mondayOf(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    /* 'none' = rien saisi / jour futur, 'ok' = dans l'objectif, 'over' = au-dessus (+5 %) */
    function statusOf(dateStr) {
        if (dateStr > iso(new Date())) return 'none';
        var log = state.history && state.history[dateStr];
        if (!log || !log.consumedCals) return 'none';
        var base = log.baseTDEE || (state.profile && state.profile.tdee) || 0;
        if (!base) return 'none';
        var target = base * (log.goalMultiplier || 1) + (log.bonusTDEE || 0);
        return log.consumedCals <= target * 1.05 ? 'ok' : 'over';
    }

    var STATUS_LABEL = { ok: 'dans l’objectif', over: 'au-dessus de l’objectif', none: 'rien de saisi' };

    window.setViewDate = async function (dateStr) {
        if (!dateStr || dateStr === state.currentViewDate) return;
        state.currentViewDate = dateStr;
        if (typeof currentUser !== 'undefined' && currentUser && typeof loadDayData === 'function') {
            animDashLoading(true);
            try { await loadDayData(dateStr); } finally { animDashLoading(false); }
        }
        updateDashboard();
    };

    function dayButton(d, selectedStr, todayStr, popDate) {
        var s = iso(d), st = statusOf(s);
        var cls = 'wk-day' + (s === selectedStr ? ' is-selected' : '') + (s === popDate ? ' is-pop' : '') + (s === todayStr ? ' is-today' : '') + (s > todayStr ? ' is-future' : '');
        var label = cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) +
            (s === todayStr ? ' (aujourd’hui)' : '') + ' : ' + STATUS_LABEL[st];
        return '<button type="button" class="' + cls + '" data-date="' + s + '" aria-label="' + label + '"' +
            (s === selectedStr ? ' aria-current="date"' : '') + '>' +
            '<span class="wk-dow">' + DAYS[(d.getDay() + 6) % 7] + '</span>' +
            '<span class="wk-num">' + d.getDate() + '</span>' +
            '<span class="wk-dot wk-dot--' + st + '" aria-hidden="true"></span></button>';
    }

    window.renderWeekStrip = function () {
        var box = document.getElementById('week-strip');
        if (!box || !state.currentViewDate) return;
        var sel = parseDateFR(state.currentViewDate), selStr = iso(sel), todayStr = iso(new Date());
        var mon = mondayOf(sel), html = '', monStr = iso(mon);
        /* Jour choisi dans la même semaine : le jour sélectionné « pop » ; autre semaine : la rangée glisse */
        var prevWeek = box.dataset.week, prevSel = box.dataset.sel;
        var popDate = prevSel && prevSel !== selStr && prevWeek === monStr ? selStr : '';
        var slide = prevWeek && prevWeek !== monStr ? (monStr > prevWeek ? 'wk-slide-next' : 'wk-slide-prev') : '';
        box.dataset.week = monStr; box.dataset.sel = selStr;
        for (var i = 0; i < 7; i++) html += dayButton(addDays(mon, i), selStr, todayStr, popDate);
        var days = document.getElementById('week-days');
        if (days) {
            days.classList.remove('wk-slide-next', 'wk-slide-prev');
            days.innerHTML = html;
            if (slide) { void days.offsetWidth; days.classList.add(slide); }
        }
        var label = document.getElementById('week-month');
        if (label) label.firstChild.nodeValue = cap(sel.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
        var today = document.getElementById('week-today');
        if (today) today.hidden = selStr === todayStr;
        var cal = document.getElementById('week-cal');
        if (cal && !cal.hidden) renderCalendar();
    };

    function renderCalendar() {
        var cal = document.getElementById('week-cal-grid');
        if (!cal || !calMonth) return;
        var selStr = state.currentViewDate, todayStr = iso(new Date());
        var title = document.getElementById('week-cal-title');
        if (title) title.textContent = cap(calMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
        var html = DAYS.map(function (d) { return '<span class="wk-cal-dow">' + d + '</span>'; }).join('');
        var start = mondayOf(calMonth);
        for (var i = 0; i < 42; i++) {
            var d = addDays(start, i);
            if (i >= 35 && d.getMonth() !== calMonth.getMonth()) break;
            var s = iso(d), st = statusOf(s);
            var cls = 'wk-cal-day' + (d.getMonth() !== calMonth.getMonth() ? ' is-out' : '') + (s === selStr ? ' is-selected' : '') + (s === todayStr ? ' is-today' : '');
            html += '<button type="button" class="' + cls + '" data-date="' + s + '" aria-label="' +
                cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) + ' : ' + STATUS_LABEL[st] + '">' +
                d.getDate() + '<span class="wk-dot wk-dot--' + st + '" aria-hidden="true"></span></button>';
        }
        cal.innerHTML = html;
    }

    function openCalendar(open) {
        var cal = document.getElementById('week-cal'), btn = document.getElementById('week-month');
        if (!cal) return;
        var sel = parseDateFR(state.currentViewDate);
        if (open) calMonth = new Date(sel.getFullYear(), sel.getMonth(), 1);
        cal.hidden = !open;
        if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) renderCalendar();
    }

    function init() {
        var box = document.getElementById('week-strip');
        if (!box) return;
        box.addEventListener('click', function (ev) {
            var t = ev.target.closest('button');
            if (!t) return;
            if (t.dataset.date) { openCalendar(false); window.setViewDate(t.dataset.date); return; }
            var cur = parseDateFR(state.currentViewDate);
            if (t.id === 'week-prev') window.setViewDate(iso(addDays(cur, -7)));
            else if (t.id === 'week-next') window.setViewDate(iso(addDays(cur, 7)));
            else if (t.id === 'week-month') openCalendar(document.getElementById('week-cal').hidden);
            else if (t.id === 'week-cal-prev') { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); }
            else if (t.id === 'week-cal-next') { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); }
        });
        /* « Aujourd'hui » est dans l'en-tête, hors du bandeau */
        var todayBtn = document.getElementById('week-today');
        if (todayBtn) todayBtn.addEventListener('click', function () { openCalendar(false); window.setViewDate(iso(new Date())); });
        document.addEventListener('keydown', function (ev) {
            var cal = document.getElementById('week-cal');
            if (ev.key === 'Escape' && cal && !cal.hidden) { openCalendar(false); document.getElementById('week-month').focus(); }
        });
        renderWeekStrip();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

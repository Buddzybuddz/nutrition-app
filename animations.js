/* animations.js — animations de l'app : compteurs et anneaux, indicateurs glissants (navigation du bas,
   onglets), apparition progressive des réponses de l'IA, loader « aliments ».
   Chargé avant app.js : les fonctions window.anim* / window.foodLoader sont appelées par les autres scripts.
   Tout est désactivé (valeur finale posée directement) si l'utilisateur demande moins d'animations. */
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    function motionOK() { return !reduce.matches; }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }

    /* ── Compteurs et anneaux ─────────────────────────────── */

    /* Affiche `value` dans `el` en comptant depuis l'ancienne valeur (ou 0 à la première apparition).
       Un petit rebond (.num-bump) signale une valeur qui change alors que l'écran est déjà affiché. */
    window.animNum = function (el, value) {
        if (!el) return;
        var to = Math.round(value);
        var seen = el.dataset.v !== undefined;
        var from = seen ? Number(el.dataset.v) : 0;
        el.dataset.anim = '1';
        el.dataset.v = String(to);
        if (el._raf) cancelAnimationFrame(el._raf);
        if (!motionOK() || el.offsetParent === null || from === to) { el.textContent = to; return; }
        if (seen) { el.classList.remove('num-bump'); void el.offsetWidth; el.classList.add('num-bump'); }
        var t0 = performance.now(), dur = 650;
        (function step(now) {
            var k = Math.min(1, (now - t0) / dur);
            el.textContent = Math.round(from + (to - from) * ease(k));
            if (k < 1) el._raf = requestAnimationFrame(step);
        })(t0);
    };

    /* Remplit l'anneau (conic-gradient) de l'ancien angle jusqu'à `deg`. */
    window.animRing = function (el, deg, color) {
        if (!el) return;
        function paint(d) { el.style.background = 'conic-gradient(' + color + ' ' + d + 'deg, var(--color-surface) ' + d + 'deg)'; }
        var from = el.dataset.deg !== undefined ? Number(el.dataset.deg) : 0;
        el.dataset.anim = '1';
        el.dataset.deg = String(deg);
        if (el._raf) cancelAnimationFrame(el._raf);
        if (!motionOK() || el.offsetParent === null || from === deg) { paint(deg); return; }
        var t0 = performance.now(), dur = 800;
        (function step(now) {
            var k = Math.min(1, (now - t0) / dur);
            paint(from + (deg - from) * ease(k));
            if (k < 1) el._raf = requestAnimationFrame(step);
        })(t0);
    };

    /* Pulsation de réussite, une seule fois quand `reached` passe de faux à vrai pour le même jour. */
    window.animCelebrate = function (el, reached, dayTag) {
        if (!el) return;
        var prev = el.dataset.reached;
        el.dataset.reached = dayTag + '|' + (reached ? '1' : '0');
        if (reached && prev === dayTag + '|0' && motionOK()) {
            el.classList.remove('is-celebrate'); void el.offsetWidth; el.classList.add('is-celebrate');
        }
    };

    /* Au retour sur l'accueil, compteurs et anneaux repartent de zéro. */
    function resetCounters() {
        document.querySelectorAll('#dashboard-view [data-anim]').forEach(function (el) {
            delete el.dataset.v; delete el.dataset.deg;
        });
    }

    /* ── Loader « aliments » ──────────────────────────────── */

    var FOODS = [
        '<path d="M12 3c3 0 5 4 5 8a5 5 0 0 1-10 0c0-4 2-8 5-8z"/><circle cx="12" cy="13.5" r="2"/>',
        '<path d="M12 7c-2-2-6-1-6 4 0 4 2 9 4.5 9 1 0 1.2-.6 1.5-.6s.5.6 1.5.6c2.5 0 4.5-5 4.5-9 0-5-4-6-6-4z"/><path d="M12 7c0-2 1-3.5 2.5-4"/>',
        '<path d="M4.5 19.5C4 16 8 9 13 8l3 3c-1 5-8 9-11.5 8.5z"/><path d="M14.5 9.5L18 4M14.5 9.5l5-1.5"/>',
        '<path d="M12 3c3.5 0 6 5.5 6 10a6 6 0 0 1-12 0c0-4.5 2.5-10 6-10z"/>',
        '<path d="M3 12c0-4 4-7 9-7s9 3 9 7-4 7-9 7-9-3-9-7z"/><path d="M8 12h8M12 9v6"/>',
        '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><circle cx="12" cy="6.5" r="3.2"/><path d="M10 12l-1 9h6l-1-9"/>',
        '<path d="M4 7c1-1 6-1 7 0 0 6 3 9 9 10 1 .2 1 1 0 1.5C11 20 4 16 4 7z"/>'
    ];

    /* HTML d'un loader : un aliment qui change toutes les ~700 ms (CSS seul). N'apparaît qu'après 300 ms d'attente. */
    window.foodLoader = function (text, overlay) {
        var icons = FOODS.map(function (p, i) {
            return '<svg style="--n:' + i + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
        }).join('');
        return '<div class="food-loader' + (overlay ? ' food-loader--overlay' : '') + '" role="status" aria-live="polite">' +
            '<span class="food-loader-icons" aria-hidden="true">' + icons + '</span>' +
            '<span class="food-loader-text">' + text + '</span></div>';
    };

    /* Chargement d'un autre jour sur l'accueil : l'écran s'estompe, le loader flotte au centre. */
    window.animDashLoading = function (on) {
        var view = document.getElementById('dashboard-view');
        if (view) view.classList.toggle('is-loading', on);
        var old = document.getElementById('dash-loader');
        if (old) old.remove();
        if (on) {
            var wrap = document.createElement('div');
            wrap.id = 'dash-loader';
            wrap.innerHTML = window.foodLoader('Chargement de la journée…', true);
            document.body.appendChild(wrap);
        }
    };

    /* ── Réponses de l'IA : le texte apparaît mot à mot ───── */

    window.animReveal = function (box) {
        if (!motionOK()) return;
        var walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), nodes = [], n;
        while ((n = walker.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
        var words = nodes.reduce(function (s, t) { return s + t.nodeValue.split(/\s+/).length; }, 0);
        if (words > 400) return;
        var step = Math.min(35, 1600 / Math.max(words, 1)), i = 0;
        nodes.forEach(function (node) {
            var frag = document.createDocumentFragment();
            node.nodeValue.split(/(\s+)/).forEach(function (part) {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                var s = document.createElement('span');
                s.className = 'ia-word';
                s.style.animationDelay = (i++ * step) + 'ms';
                s.textContent = part;
                frag.appendChild(s);
            });
            node.parentNode.replaceChild(frag, node);
        });
    };

    /* ── Indicateurs glissants ────────────────────────────── */

    function placeNavIndicator() {
        var nav = document.getElementById('bottom-nav');
        var a = nav && nav.querySelector('.bottom-nav-item.active');
        if (!a) return;
        var nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
        if (!r.width) return;
        nav.style.setProperty('--ind-x', (r.left - nr.left + r.width / 2) + 'px');
        if (!nav.classList.contains('has-ind')) nav.classList.add('has-ind');
    }

    function placeTabPill() {
        var box = document.querySelector('.pg-tabs');
        var a = box && box.querySelector('.pg-tab.is-active');
        if (!a || !a.offsetWidth) return;
        box.style.setProperty('--pill-x', a.offsetLeft + 'px');
        box.style.setProperty('--pill-w', a.offsetWidth + 'px');
        if (!box.classList.contains('has-pill')) box.classList.add('has-pill');
    }

    function watch(selector, place) {
        var el = document.querySelector(selector);
        if (!el) return;
        new MutationObserver(place).observe(el, { attributes: true, attributeFilter: ['class'], subtree: true });
        if (window.ResizeObserver) new ResizeObserver(place).observe(el);
        place();
    }

    function init() {
        /* Retour sur l'accueil : les compteurs rejouent leur remplissage */
        var nav = window.navigateTo;
        if (typeof nav === 'function') {
            window.navigateTo = function () {
                var dash = document.getElementById('dashboard-view');
                if (dash && dash.classList.contains('hidden')) resetCounters();
                return nav.apply(this, arguments);
            };
        }
        watch('#bottom-nav', placeNavIndicator);
        watch('.pg-tabs', placeTabPill);
        window.addEventListener('resize', function () { placeNavIndicator(); placeTabPill(); });

        /* Ligne d'abonnement : pulse tant que « Chargement… » n'a pas été remplacé */
        var sub = document.getElementById('pv-sub-desc');
        if (sub) new MutationObserver(function (_, obs) { sub.classList.remove('is-pending'); obs.disconnect(); })
            .observe(sub, { childList: true, characterData: true, subtree: true });
    }

    /* Les scripts defer s'exécutent en 'interactive' : on attend DOMContentLoaded pour que app.js ait défini navigateTo */
    if (document.readyState === 'complete') init(); else document.addEventListener('DOMContentLoaded', init);
})();

/* landing-motion.js — mouvement de la landing : barre de progression, bouton flottant desktop,
   tuiles qui réagissent au curseur, frise « Mon histoire » qui se dessine au défilement, prix qui se compte.
   Tout est coupé si le visiteur demande moins de mouvement. */
(function () {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function $(s, r) { return (r || document).querySelector(s); }
    function clamp(v) { return Math.max(0, Math.min(1, v)); }

    var bar = $('.lx-progress i'), cta = $('.lx-sticky-cta'), hero = $('.lx-hero'), final = $('.lp-cta-final');
    var steps = $('.lx-hist-steps'), items = steps ? steps.querySelectorAll('.lx-hist-item') : [];
    var ticking = false;

    function update() {
        ticking = false;
        var landing = $('#landing-page');
        if (!landing || landing.classList.contains('hidden')) return;
        var h = document.documentElement, max = h.scrollHeight - window.innerHeight;
        if (bar && !still) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(window.scrollY / max) : 0) + ')';
        if (cta) {
            var past = hero && hero.getBoundingClientRect().bottom < 0;
            var atEnd = final && final.getBoundingClientRect().top < window.innerHeight * 0.85;
            cta.classList.toggle('is-visible', !!past && !atEnd);
        }
        if (steps && !still) {
            var r = steps.getBoundingClientRect(), line = window.innerHeight * 0.6;
            steps.style.setProperty('--p', clamp((line - r.top) / r.height).toFixed(3));
            items.forEach(function (it) { it.classList.toggle('is-on', it.getBoundingClientRect().top < line); });
        }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    /* Tuiles : inclinaison légère et reflet qui suivent le curseur (souris uniquement) */
    function tiles() {
        if (still || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        document.querySelectorAll('.lx-bento .lx-tile').forEach(function (t) {
            t.addEventListener('pointerenter', function () { t.classList.add('lx-live'); });
            t.addEventListener('pointermove', function (e) {
                var b = t.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
                t.style.setProperty('--ry', ((x - 0.5) * 6).toFixed(2) + 'deg');
                t.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg');
                t.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                t.style.setProperty('--my', (y * 100).toFixed(1) + '%');
            });
            t.addEventListener('pointerleave', function () {
                t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* Lecture des chiffres, anneaux, courbe et messages quand ils entrent à l'écran */
    function playOnView() {
        var landing = $('#landing-page');
        if (still || !('IntersectionObserver' in window) || !landing) return;
        var targets = Array.prototype.slice.call(document.querySelectorAll('.lx-today, .lx-chat, .lx-big, .lx-hist-big'));
        document.querySelectorAll('.lx-draw').forEach(function (p) { targets.push(p.parentNode); });
        landing.classList.add('lx-motion-on');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('is-play'); io.unobserve(e.target); }
            });
        }, { threshold: 0.3 });
        targets.forEach(function (t) { io.observe(t); });
    }

    /* Prix du tarif : compte de 0,00 à la valeur finale (data-count) quand il entre à l'écran.
       Le texte final reste dans le HTML (sans JS, mouvement réduit, moteurs de recherche) ; la largeur est figée avant de compter. */
    function countPrice() {
        var el = $('.lp-price-amount[data-count]');
        if (still || !el || !('IntersectionObserver' in window)) return;
        var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', DURATION = 1500;
        if (!(target > 0)) return;
        function fmt(v) { return v.toFixed(2).replace('.', ',') + suffix; }
        var io = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            el.style.minWidth = el.getBoundingClientRect().width + 'px';
            var t0 = null;
            el.textContent = fmt(0);
            requestAnimationFrame(function tick(now) {
                if (t0 === null) t0 = now;
                var p = clamp((now - t0) / DURATION), eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); /* ease-out expo */
                el.textContent = fmt(target * eased);
                if (p < 1) requestAnimationFrame(tick);
                else { el.textContent = fmt(target); el.classList.add('is-done'); }
            });
        }, { threshold: 0.8 });
        io.observe(el);
    }

    document.addEventListener('DOMContentLoaded', function () {
        playOnView();
        countPrice();
        tiles();
        if (steps && !still) steps.classList.add('is-live');
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
    });
})();

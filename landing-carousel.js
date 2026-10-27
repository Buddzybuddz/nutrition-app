/* landing-carousel.js — carrousel des 7 jours (section « Votre essai »), piloté par le défilement de la page.
   Le carrousel reste épinglé (position: sticky) pendant que la page défile. La piste suit la position de défilement
   en continu (aucune animation décalée, donc pas de saut) : chaque étape se pose et reste lisible sur 60 % de sa
   tranche, puis glisse vers la suivante sur les 40 % restants. La frise, les flèches et les touches ← → font défiler
   la page jusqu'à l'étape voulue : la position de défilement est l'unique source de vérité. Sans JS, ou avec la
   classe is-pin absente, le carrousel reste un défilement horizontal natif (scroll-snap). */
(function () {
    var root = document.getElementById('lx-car');
    if (!root) return;

    var scroller = root.closest('.lx-car-scroll'), pin = root.closest('.lx-car-pin');
    var track = root.querySelector('.lx-car-track'), slides = Array.prototype.slice.call(root.querySelectorAll('.lx-slide'));
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.lx-car-rail button'));
    var prev = root.querySelector('[data-dir="-1"]'), next = root.querySelector('[data-dir="1"]');
    var count = root.querySelector('.lx-car-count'), rail = root.querySelector('.lx-car-rail');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = -1, ticking = false, near = true, lastKey = '', wide = window.matchMedia('(min-width: 901px)');
    var geo = null; /* mesures de mise en page, recalculées seulement au redimensionnement (pas à chaque image) */

    /* Position de défilement horizontal qui centre la slide i dans la piste */
    function leftFor(i) { var s = slides[i]; return s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2; }

    function setActive(i) {
        if (i === cur) return;
        cur = i;
        slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
        tabs.forEach(function (b, k) {
            b.classList.toggle('is-on', k === i); b.classList.toggle('is-done', k < i);
            b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        });
        count.textContent = (i + 1) + ' / ' + slides.length;
        prev.disabled = i === 0; next.disabled = i === slides.length - 1;
    }

    function measure() {
        track.scrollLeft = 0;
        geo = {
            step: (scroller.offsetHeight - pin.offsetHeight) / slides.length, /* défilement attribué à chaque étape */
            top: parseFloat(getComputedStyle(pin).top) || 0,
            stride: slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0,
            first: leftFor(0)
        };
        track.scrollLeft = geo.first; /* piste calée sur la première slide ; ensuite seuls des transform bougent */
    }
    function stepPx() { return geo.step; }
    function topOffset() { return geo.top; }

    /* Étape correspondant à la position de la page : on est « dans » la zone épinglée quand son haut a atteint le header */
    /* Position fractionnaire dans la liste des slides (0 à n-1) pour un défilement donné, avec une pause sur chaque étape */
    function smooth(t) { return t * t * (3 - 2 * t); }
    function positionFor(scrolled) {
        var n = slides.length, s = Math.max(0, Math.min(n - 1, scrolled / stepPx())), i = Math.floor(s), frac = s - i;
        if (i >= n - 1) return n - 1;
        if (still) return frac < 0.5 ? i : i + 1;
        /* Ordinateur : fondu sur la moitié centrale de la tranche ; mobile : glissement un peu plus resserré */
        var from = wide.matches ? 0.25 : 0.3, len = wide.matches ? 0.5 : 0.4;
        return i + smooth(Math.max(0, Math.min(1, (frac - from) / len)));
    }

    function update(force) {
        ticking = false;
        var pos = positionFor(topOffset() - scroller.getBoundingClientRect().top);
        var key = pos.toFixed(3) + '|' + wide.matches;
        if (key === lastKey && force !== true) return; /* rien n'a bougé : aucune écriture de style */
        lastKey = key;
        var stride = geo.stride;
        if (wide.matches) {
            /* Ordinateur : slides superposées (grille), fondu enchaîné avec un léger décalage vertical */
            slides.forEach(function (s, k) {
                var d = Math.min(1, Math.abs(pos - k));
                s.style.opacity = Math.max(0, 1 - d * 1.8).toFixed(3); /* la sortante est presque effacée quand l'entrante apparaît : pas de textes superposés lisibles */
                s.style.transform = 'translateY(' + ((k - pos) * 36).toFixed(1) + 'px)';
                s.style.pointerEvents = d < 0.5 ? '' : 'none';
            });
        } else {
            /* Mobile : les slides glissent (transform, donc sans recalcul de mise en page), les voisines restent entrevues et estompées */
            slides.forEach(function (s, k) {
                var d = Math.min(1, Math.abs(pos - k));
                s.style.opacity = (1 - d * 0.6).toFixed(3);
                s.style.transform = 'translate3d(' + (-pos * stride).toFixed(1) + 'px,0,0) scale(' + (1 - 0.06 * d).toFixed(3) + ')';
                s.style.pointerEvents = '';
            });
        }
        rail.style.setProperty('--p', (pos / (slides.length - 1)).toFixed(3));
        setActive(Math.round(pos));
    }
    function onScroll() { if (near && !ticking) { ticking = true; requestAnimationFrame(update); } }

    /* Fait défiler la page jusqu'au début de la tranche de l'étape i (là où la slide est posée) */
    function scrollToStep(i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        var top = scroller.getBoundingClientRect().top + window.pageYOffset - topOffset() + stepPx() * i;
        window.scrollTo({ top: top, behavior: still ? 'auto' : 'smooth' });
    }

    tabs.forEach(function (b, k) { b.addEventListener('click', function () { scrollToStep(k); }); });
    prev.addEventListener('click', function () { scrollToStep(cur - 1); });
    next.addEventListener('click', function () { scrollToStep(cur + 1); });
    track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); scrollToStep(cur + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToStep(cur - 1); }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    /* Rotation du téléphone, redimensionnement : on recalcule la position à partir du défilement */
    window.addEventListener('resize', function () { measure(); lastKey = ''; onScroll(); });
    /* Hors de l'écran (avec une marge), le défilement de la page ne coûte rien à ce script */
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) onScroll(); }, { rootMargin: '300px 0px' }).observe(scroller);
    }

    scroller.classList.add('is-pin');
    root.classList.add('is-js');
    measure();
    update(true);
})();

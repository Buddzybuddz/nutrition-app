/* landing-carousel.js — carrousel des 7 jours (section « Votre essai »), piloté par le défilement de la page.
   Le carrousel reste épinglé (position: sticky) pendant que la page défile : chaque tranche de défilement fait
   passer à l'étape suivante (J1 → J7). La frise, les flèches et les touches ← → font défiler la page jusqu'à l'étape
   voulue, donc une seule source de vérité : la position de défilement. Sans JS, ou avec la classe is-pin absente,
   le carrousel reste un simple défilement horizontal natif (scroll-snap). */
(function () {
    var root = document.getElementById('lx-car');
    if (!root) return;

    var scroller = root.closest('.lx-car-scroll'), pin = root.closest('.lx-car-pin');
    var track = root.querySelector('.lx-car-track'), slides = Array.prototype.slice.call(root.querySelectorAll('.lx-slide'));
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.lx-car-rail button'));
    var prev = root.querySelector('[data-dir="-1"]'), next = root.querySelector('[data-dir="1"]');
    var count = root.querySelector('.lx-car-count'), rail = root.querySelector('.lx-car-rail');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = -1, ticking = false;

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
        rail.style.setProperty('--p', (i / (slides.length - 1)).toFixed(3));
        count.textContent = (i + 1) + ' / ' + slides.length;
        prev.disabled = i === 0; next.disabled = i === slides.length - 1;
        track.scrollTo({ left: leftFor(i) });
    }

    /* Hauteur de défilement attribuée à chaque étape (la zone fait n étapes de plus que l'épingle) */
    function stepPx() { return (scroller.offsetHeight - pin.offsetHeight) / slides.length; }
    function topOffset() { return parseFloat(getComputedStyle(pin).top) || 0; }

    /* Étape correspondant à la position de la page : on est « dans » la zone épinglée quand son haut a atteint le header */
    function update() {
        ticking = false;
        var scrolled = topOffset() - scroller.getBoundingClientRect().top;
        var i = Math.max(0, Math.min(slides.length - 1, Math.floor(scrolled / stepPx())));
        setActive(i);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    /* Fait défiler la page jusqu'au milieu de la tranche de l'étape i */
    function scrollToStep(i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        var top = scroller.getBoundingClientRect().top + window.pageYOffset - topOffset() + stepPx() * (i + 0.5);
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
    /* Rotation du téléphone, redimensionnement : on recentre la slide courante sans animation */
    window.addEventListener('resize', function () {
        track.style.scrollBehavior = 'auto';
        track.scrollTo({ left: leftFor(Math.max(cur, 0)) });
        track.style.scrollBehavior = '';
        onScroll();
    });

    scroller.classList.add('is-pin');
    root.classList.add('is-js');
    update();
})();

/* landing-header.js — bandeau du haut et barre « Essayer 7 jours gratuits » de la landing.
   - Le bandeau prend son style « défilé » au-delà de 50 px.
   - Ordinateur : il se cache quand on descend et réapparaît dès qu'on remonte ; il reste visible en haut de page et
     pendant que le carrousel des 7 jours est épinglé (le carrousel est calé juste en dessous).
   - Mobile : bandeau du haut et barre du bas ne bougent plus au défilement (les barres du navigateur se replient en
     même temps : tout mouvement supplémentaire se voit comme un saut).
   Seules des classes (donc des transform, composités) sont changées, et seulement quand l'état change. */
(function() {
    var header = document.getElementById('lp-header');
    if (!header) return;
    var phone = window.matchMedia('(max-width: 900px)');
    var cta = null, scroller = null; /* ces éléments sont plus bas dans la page : ce script se charge avant eux, on les cherche au premier défilement */
    var scrolled = null, hidden = false, away = false, lastY = window.scrollY, acc = 0, ticking = false, idle = 0;

    function setHidden(v) { if (v !== hidden) { hidden = v; header.classList.toggle('lp-header--hidden', v); } }
    function setAway(v) { if (phone.matches) v = false; /* mobile : la barre du bas reste fixe */ if (!cta) cta = document.querySelector('.lx-sticky-cta'); if (cta && v !== away) { away = v; cta.classList.toggle('lx-cta-away', v); } }

    /* Le carrousel épinglé est calé sous le bandeau : on garde alors le bandeau visible */
    function pinned() {
        if (!scroller) scroller = document.querySelector('.lx-car-scroll');
        if (!scroller || !scroller.classList.contains('is-pin')) return false; /* épinglé seulement sur grand écran */
        var r = scroller.getBoundingClientRect();
        return r.top <= 70 && r.bottom > 240;
    }

    function update() {
        ticking = false;
        var y = window.scrollY, dy = y - lastY;
        lastY = y;
        var s = y > 50;
        if (s !== scrolled) { scrolled = s; header.classList.toggle('lp-header--scrolled', s); }
        if (phone.matches) { setHidden(false); setAway(false); return; }
        if (dy === 0) return;
        acc = (dy > 0) === (acc >= 0) ? acc + dy : dy; /* cumul dans le sens courant, remis à zéro quand le sens change */
        if (y <= 80 || acc < -12) { setHidden(false); setAway(false); }
        else if (acc > 24) {
            if (!pinned()) setHidden(true); else setHidden(false);
            setAway(true);
        }
        clearTimeout(idle);
        idle = setTimeout(function () { setAway(false); }, 350); /* la barre du bas revient quand le défilement s'arrête */
    }

    window.addEventListener('scroll', function() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    /* ── Menu des sections ──
       Ordinateur : liens dans le bandeau. Mobile : bouton menu + panneau plein écran.
       La section en cours est marquée aria-current. Le clic défile en douceur (scroll-margin-top côté CSS). */
    var links = Array.prototype.slice.call(document.querySelectorAll('.lp-links a, .lp-drawer-nav a'));
    var burger = document.getElementById('lp-burger'), drawer = document.getElementById('lp-drawer');
    var targets = null; /* sections plus bas dans la page : ce script se charge avant elles, on les cherche au premier défilement */
    var current = null, spyTicking = false;
    var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setDrawer(open) {
        if (!drawer || !burger) return;
        drawer.hidden = !open;
        burger.setAttribute('aria-expanded', String(open));
        document.documentElement.classList.toggle('lp-menu-open', open);
    }

    function spy() {
        spyTicking = false;
        if (!targets) {
            targets = [];
            links.forEach(function (a) {
                var t = document.getElementById(a.getAttribute('href').slice(1));
                if (t && targets.indexOf(t) < 0) targets.push(t);
            });
        }
        var line = window.innerHeight * 0.35, cur = null;
        targets.forEach(function (t) { if (t.getBoundingClientRect().top <= line) cur = t.id; });
        if (cur === current) return;
        current = cur;
        links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
    }

    links.forEach(function (a) {
        a.addEventListener('click', function (e) {
            var t = document.getElementById(a.getAttribute('href').slice(1));
            if (!t) return;
            e.preventDefault();
            setDrawer(false);
            t.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        });
    });
    if (burger) burger.addEventListener('click', function () { setDrawer(drawer.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer && !drawer.hidden) { setDrawer(false); burger.focus(); } });
    phone.addEventListener('change', function () { if (!phone.matches) setDrawer(false); });
    window.addEventListener('scroll', function () { if (!spyTicking) { spyTicking = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener('load', spy);
})();

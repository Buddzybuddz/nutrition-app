/* landing-header.js — bandeau du haut et barre « Essayer 7 jours gratuits » de la landing.
   - Le bandeau prend son style « défilé » au-delà de 50 px.
   - Il se cache quand on descend et réapparaît dès qu'on remonte ; il reste visible en haut de page et pendant que
     le carrousel des 7 jours est épinglé (le carrousel est calé juste en dessous).
   - La barre du bas se cache pendant le défilement vers le bas et revient à l'arrêt ou en remontant.
   Seules des classes (donc des transform, composités) sont changées, et seulement quand l'état change. */
(function() {
    var header = document.getElementById('lp-header');
    if (!header) return;
    var cta = null, scroller = null; /* ces éléments sont plus bas dans la page : ce script se charge avant eux, on les cherche au premier défilement */
    var scrolled = null, hidden = false, away = false, lastY = window.scrollY, acc = 0, ticking = false, idle = 0;

    function setHidden(v) { if (v !== hidden) { hidden = v; header.classList.toggle('lp-header--hidden', v); } }
    function setAway(v) { if (!cta) cta = document.querySelector('.lx-sticky-cta'); if (cta && v !== away) { away = v; cta.classList.toggle('lx-cta-away', v); } }

    /* Le carrousel épinglé est calé sous le bandeau : on garde alors le bandeau visible */
    function pinned() {
        if (!scroller) scroller = document.querySelector('.lx-car-scroll');
        if (!scroller) return false;
        var r = scroller.getBoundingClientRect();
        return r.top <= 70 && r.bottom > 240;
    }

    function update() {
        ticking = false;
        var y = window.scrollY, dy = y - lastY;
        lastY = y;
        var s = y > 50;
        if (s !== scrolled) { scrolled = s; header.classList.toggle('lp-header--scrolled', s); }
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
})();

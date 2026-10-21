/* quick-add.js — bouton « + » central de la barre du bas : ajouter un repas ou une activité. */

(function () {
    function init() {
        var btn = document.getElementById('bottom-nav-add-btn');
        var menu = document.getElementById('bottom-nav-add-menu');
        if (!btn || !menu) return;
        var options = menu.querySelectorAll('.bottom-nav-add-option');

        function setOpen(open) {
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', open ? 'false' : 'true');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            options.forEach(function (o) { o.tabIndex = open ? 0 : -1; });
        }

        /* Sans profil, l'app impose d'abord la page Profil (comme les autres vues) */
        function openModal(fnName) {
            setOpen(false);
            if (typeof state !== 'undefined' && !state.profile && typeof window.navigateTo === 'function') {
                window.navigateTo('profil');
                return;
            }
            if (typeof window[fnName] === 'function') window[fnName]();
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            setOpen(!menu.classList.contains('is-open'));
        });
        document.getElementById('quick-add-meal').addEventListener('click', function () { openModal('openMealModal'); });
        document.getElementById('quick-add-activity').addEventListener('click', function () { openModal('openActivityModal'); });

        /* Fermeture : clic ailleurs, Échap (le focus revient sur le bouton) */
        document.addEventListener('click', function (e) {
            if (menu.classList.contains('is-open') && !e.target.closest('#bottom-nav-add')) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); btn.focus(); }
        });
        /* Un changement d'onglet referme le menu */
        document.addEventListener('click', function (e) {
            if (e.target.closest('.bottom-nav-item')) setOpen(false);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

/* Synchronisation bottom nav — active state uniquement (avant app.js) */
(function() {
    window._syncBottomNav = function(targetId) {
        document.querySelectorAll('.bottom-nav-item').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.target === targetId);
        });
    };
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.bottom-nav-item, .nav-btn');
        if (btn && btn.dataset.target) {
            window._syncBottomNav(btn.dataset.target);
        }
    });
})();

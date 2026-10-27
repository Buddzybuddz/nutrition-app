(function() {
    var header = document.getElementById('lp-header');
    if (header) {
        window.addEventListener('scroll', function() {
            header.classList.toggle('lp-header--scrolled', window.scrollY > 50);
        }, { passive: true });
    }
})();

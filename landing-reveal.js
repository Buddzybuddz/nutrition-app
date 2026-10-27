(function() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.lp-reveal').forEach(function(el) {
            el.classList.add('lp-revealed');
        });
        return;
    }
    var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
            if (e.isIntersecting) {
                e.target.classList.add('lp-revealed');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.10 });
    document.querySelectorAll('.lp-reveal').forEach(function(el) {
        io.observe(el);
    });
})();

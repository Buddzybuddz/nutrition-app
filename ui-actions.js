/* ui-actions.js — remplace les onclick / onsubmit inline (la CSP interdit les scripts inline).
   data-click="fn"     appelle window.fn au clic, avec data-arg (une chaîne) ou data-args (tableau JSON)
   data-pass-this      ajoute l'élément cliqué en dernier argument
   data-prevent        annule l'action par défaut (lien, formulaire)
   data-stop           bloque la propagation du clic au-dessus de cet élément
   data-submit="fn"    appelle window.fn(event) à l'envoi du formulaire (action par défaut annulée) */

(function () {
    var local = {
        scrollTop: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); },
    };

    function argsOf(el) {
        var args = [];
        if (el.dataset.args) { try { args = JSON.parse(el.dataset.args); } catch (_) {} }
        else if (el.dataset.arg !== undefined) args = [el.dataset.arg];
        if (el.hasAttribute('data-pass-this')) args.push(el);
        return args;
    }

    document.addEventListener('click', function (e) {
        /* Remonte comme le faisait la propagation des onclick inline (un parent peut aussi avoir une action) */
        for (var el = e.target; el && el !== document; el = el.parentElement) {
            var name = el.dataset && el.dataset.click;
            if (name) {
                if (el.hasAttribute('data-prevent')) e.preventDefault();
                var fn = local[name] || window[name];
                if (typeof fn === 'function') fn.apply(null, argsOf(el));
            }
            if (el.hasAttribute && el.hasAttribute('data-stop')) break;
        }
    });

    /* Les liens marqués data-stop ne doivent pas déclencher les clics des conteneurs (ex. libellé de case à cocher) */
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-stop]').forEach(function (el) {
            el.addEventListener('click', function (e) { e.stopPropagation(); });
        });
    });

    document.addEventListener('submit', function (e) {
        var name = e.target.dataset && e.target.dataset.submit;
        if (!name) return;
        e.preventDefault();
        if (typeof window[name] === 'function') window[name](e);
    });
})();

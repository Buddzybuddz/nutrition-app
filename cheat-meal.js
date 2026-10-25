/* cheat-meal.js — nature du repas dans la modale d'ajout : normal, cheat meal, cheat meal avec alcool.
   Un cheat meal n'est pas compté : il reçoit un forfait fixe (CHEAT_MEALS, utils.js). */
(function () {
    var nature = '';

    function $(id) { return document.getElementById(id); }
    function fmt(n) { return Number(n).toLocaleString('fr-FR'); }

    window.getMealNature = function () { return nature; };
    window.getMealCheatNote = function () { var n = $('meal-cheat-note'); return n ? n.value.trim().slice(0, 100) : ''; };

    /* Appelée à l'ouverture en modification (nature + précision enregistrées) et à la fermeture de la modale */
    window.setMealNature = function (value, note) {
        nature = CHEAT_MEALS[value] ? value : '';
        var forfait = CHEAT_MEALS[nature], form = $('meal-form');
        document.querySelectorAll('#meal-nature .meal-mode').forEach(function (b) {
            var on = b.dataset.nature === nature;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        $('meal-cheat-panel').hidden = !forfait;
        form.classList.toggle('is-cheat', !!forfait);
        /* Champs masqués : plus obligatoires, sinon la validation du formulaire bloquerait l'envoi */
        ['meal-cals', 'meal-protein'].forEach(function (id) { $(id).required = !forfait; });
        if (forfait) {
            $('meal-cals').value = forfait.cals;
            $('meal-protein').value = forfait.prot;
            $('meal-cheat-info').textContent = 'Pas besoin de compter : un forfait de ' + fmt(forfait.cals) +
                ' kcal et ' + forfait.prot + ' g de protéines est ajouté à votre journée.';
        }
        $('meal-cheat-note').value = forfait ? (note || '') : '';
    };

    document.addEventListener('DOMContentLoaded', function () {
        var box = $('meal-nature'), modal = $('meal-modal');
        if (!box || !modal) return;
        box.addEventListener('click', function (e) {
            var b = e.target.closest('.meal-mode');
            if (b) window.setMealNature(b.dataset.nature, window.getMealCheatNote());
        });
        /* Retour à « Repas normal » quand la modale se ferme */
        new MutationObserver(function () {
            if (modal.classList.contains('hidden')) window.setMealNature('');
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
})();

/* async-css.js — feuilles de style externes chargées sans bloquer l'affichage.
   Une feuille <link ... media="print" data-async-css> se charge en arrière-plan puis passe à media="all" une fois reçue.
   Sans cela, si le serveur de polices est lent ou injoignable (réseau, bloqueur de contenu), Safari retient l'exécution des
   scripts suivants et la page reste en chargement : le texte s'affiche avec la police de secours en attendant. */
(function () {
    Array.prototype.forEach.call(document.querySelectorAll('link[data-async-css]'), function (l) {
        function on() { l.media = 'all'; }
        if (l.sheet) on(); else l.addEventListener('load', on);
    });
})();

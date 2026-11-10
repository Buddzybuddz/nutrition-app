/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* La description d'un repas (composition estimée par l'IA) était limitée à 200 caractères : au-delà d'environ
       10 aliments, la fin de la liste était coupée, et on la retrouvait tronquée en rouvrant le repas pour le
       modifier. La limite passe à 600, comme la zone de saisie « Décrire mon repas ». */
    ["meals", "favorite_meals"].forEach((name) => {
        const col = app.findCollectionByNameOrId(name);
        const f = col.fields.getByName("description");
        if (f) f.max = 600;
        app.save(col);
    });
}, (app) => {
    ["meals", "favorite_meals"].forEach((name) => {
        const col = app.findCollectionByNameOrId(name);
        const f = col.fields.getByName("description");
        if (f) f.max = 200;
        app.save(col);
    });
});

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Repas pris au restaurant : portions estimées par l'IA à partir de l'intitulé du plat.
       Affiche un badge dans le tableau de bord ; faux pour les repas existants. */
    const meals = app.findCollectionByNameOrId("meals");
    meals.fields.add(new BoolField({ name: "restaurant" }));
    return app.save(meals);
}, (app) => {
    const meals = app.findCollectionByNameOrId("meals");
    try { meals.fields.removeByName("restaurant"); } catch (_) {}
    return app.save(meals);
});

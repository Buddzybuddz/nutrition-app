/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Description du repas (composition estimée par l'IA, ex. « riz cuit 150 g, poulet grillé 100 g »).
       Sert à afficher des favoris lisibles ; vide pour les repas saisis à la main ou avant cette évolution. */
    const meals = app.findCollectionByNameOrId("meals");
    meals.fields.add(new TextField({ name: "description", max: 200 }));
    return app.save(meals);
}, (app) => {
    const meals = app.findCollectionByNameOrId("meals");
    try { meals.fields.removeByName("description"); } catch (_) {}
    return app.save(meals);
});

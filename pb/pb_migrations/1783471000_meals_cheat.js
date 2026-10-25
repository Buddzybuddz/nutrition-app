/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Nature du repas : « cheat » (repas hors cadre, impossible à compter) ou « cheat_alcool » (avec alcool).
       Vide pour un repas normal. Les calories et protéines d'un cheat meal sont des forfaits fixés côté client. */
    const meals = app.findCollectionByNameOrId("meals");
    meals.fields.add(new SelectField({ name: "cheat", values: ["cheat", "cheat_alcool"], maxSelect: 1 }));
    return app.save(meals);
}, (app) => {
    const meals = app.findCollectionByNameOrId("meals");
    try { meals.fields.removeByName("cheat"); } catch (_) {}
    return app.save(meals);
});

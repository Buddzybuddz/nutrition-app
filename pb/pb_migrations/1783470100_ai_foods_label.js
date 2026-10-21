/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Libellé d'affichage (avec accents) ; `name` reste la clé normalisée */
    const foods = app.findCollectionByNameOrId("ai_foods");
    foods.fields.add(new TextField({ name: "label" }));
    return app.save(foods);
}, (app) => {
    const foods = app.findCollectionByNameOrId("ai_foods");
    try { foods.fields.removeByName("label"); } catch (_) {}
    return app.save(foods);
});

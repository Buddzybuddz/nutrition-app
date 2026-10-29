/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Ratio de protéines (g/kg) appliqué ce jour-là, figé à l'enregistrement du jour : 1,3 sèche,
       1,6 maintien, 2 prise de masse. Vide (0) pour les jours antérieurs, qui gardent l'ancienne
       règle de 2 g/kg : l'historique ne bouge pas. */
    const stats = app.findCollectionByNameOrId("daily_stats");
    stats.fields.add(new NumberField({ name: "proteinPerKg" }));
    return app.save(stats);
}, (app) => {
    const stats = app.findCollectionByNameOrId("daily_stats");
    try { stats.fields.removeByName("proteinPerKg"); } catch (_) {}
    return app.save(stats);
});

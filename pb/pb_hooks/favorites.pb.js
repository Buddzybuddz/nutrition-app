/// <reference path="../pb_data/types.d.ts" />

/* ─── Repas favoris : 10 au maximum par moment de la journée ───────────────
   (la règle d'accès ne sait pas compter, d'où ce hook ; constantes déclarées dans le handler) */
onRecordCreateRequest((e) => {
    if (e.collection.name !== "favorite_meals") {
        return e.next();
    }

    var MAX_PER_TYPE = 10;
    var TYPES = ["breakfast", "lunch", "snack", "dinner"];

    var type = String(e.record.get("mealType") || "");
    if (TYPES.indexOf(type) < 0) {
        throw new BadRequestError("Moment de la journée invalide.");
    }
    if (e.hasSuperuserAuth()) {
        return e.next();
    }

    var count = $app.countRecords("favorite_meals", $dbx.hashExp({ user: e.auth.id, mealType: type }));
    if (count >= MAX_PER_TYPE) {
        throw new BadRequestError("Limite de " + MAX_PER_TYPE + " repas favoris atteinte pour ce moment de la journée.");
    }
    return e.next();
});

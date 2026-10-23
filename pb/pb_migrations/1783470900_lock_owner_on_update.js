/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Les règles de modification testent « user = @request.auth.id » sur l'enregistrement tel qu'il est AVANT
       la modification : rien n'empêchait d'envoyer un autre « user » dans la requête et de déplacer sa ligne
       dans les données d'un autre compte. On exige que « user », s'il est envoyé, reste l'appelant. */
    const LOCK = " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";
    const names = ["meals", "activities_log", "weigh_ins", "daily_stats", "goal_history", "profiles", "user_data", "favorite_meals", "favorite_activities"];
    names.forEach((name) => {
        let col;
        try { col = app.findCollectionByNameOrId(name); } catch (_) { return; }
        if (!col.fields.getByName("user")) return;
        const rule = String(col.updateRule || "");
        if (!rule || rule.indexOf("@request.body.user") !== -1) return;
        col.updateRule = rule + LOCK;
        app.save(col);
    });
}, (app) => {
    const LOCK = " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";
    const names = ["meals", "activities_log", "weigh_ins", "daily_stats", "goal_history", "profiles", "user_data", "favorite_meals", "favorite_activities"];
    names.forEach((name) => {
        let col;
        try { col = app.findCollectionByNameOrId(name); } catch (_) { return; }
        const rule = String(col.updateRule || "");
        if (rule.endsWith(LOCK)) {
            col.updateRule = rule.slice(0, rule.length - LOCK.length);
            app.save(col);
        }
    });
});

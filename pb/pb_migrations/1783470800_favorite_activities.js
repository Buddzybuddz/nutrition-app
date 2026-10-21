/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Activités favorites (nom, durée, calories brûlées), réutilisables en un geste. Elles remplacent la liste
       « Mes activités » stockée dans profiles.customActivities, reprise ci-dessous (10 au maximum par utilisateur).
       Mêmes règles d'accès que le journal d'activités : propriétaire seulement, avec essai ou abonnement valide. */
    const log = app.findCollectionByNameOrId("activities_log");
    const favorites = new Collection({
        type: "base",
        name: "favorite_activities",
        listRule: log.listRule,
        viewRule: log.viewRule,
        createRule: log.createRule,
        updateRule: log.updateRule,
        deleteRule: log.deleteRule,
        fields: [
            { type: "relation", name: "user", required: true, collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 },
            { type: "text", name: "name", required: true, max: 120 },
            { type: "number", name: "minutes" },
            { type: "number", name: "calories", required: true },
            { type: "autodate", name: "created", onCreate: true },
        ],
        indexes: ["CREATE INDEX idx_favorite_activities_user ON favorite_activities (user)"],
    });
    app.save(favorites);

    /* Reprise de l'ancienne liste : « Yoga (45 min) » devient nom « Yoga » + durée 45 */
    const DURATION = /\s*[(\[]?\s*(\d+(?:[.,]\d+)?)\s*(h|heures?|min|minutes?|mn)(?![a-z])\s*(\d{1,2})?\s*[)\]]?\s*/i;
    const profiles = app.findAllRecords("profiles");
    profiles.forEach((profile) => {
        let list = [];
        try { list = JSON.parse(String(profile.getString("customActivities") || "[]")); } catch (_) { return; }
        if (!Array.isArray(list)) return;
        let kept = 0;
        list.forEach((raw) => {
            if (kept >= 10) return;
            let item = raw;
            if (typeof raw === "string") { try { item = JSON.parse(raw); } catch (_) { return; } }
            if (!item || typeof item !== "object") return;
            let name = String(item.name || "").trim();
            const cals = Math.round(Number(item.cals) || 0);
            if (!name || cals <= 0) return;
            let minutes = 0;
            const m = name.match(DURATION);
            if (m) {
                const n = parseFloat(m[1].replace(",", "."));
                minutes = /^h|heure/i.test(m[2]) ? Math.round(n * 60) + (m[3] ? parseInt(m[3], 10) : 0) : Math.round(n);
                const stripped = name.replace(DURATION, " ").replace(/\s+/g, " ").trim();
                if (stripped) name = stripped;
                else minutes = 0;
            }
            const fav = new Record(favorites);
            fav.set("user", profile.get("user"));
            fav.set("name", name.slice(0, 120));
            fav.set("minutes", minutes);
            fav.set("calories", cals);
            app.save(fav);
            kept++;
        });
    });
}, (app) => {
    try { app.delete(app.findCollectionByNameOrId("favorite_activities")); } catch (_) {}
});

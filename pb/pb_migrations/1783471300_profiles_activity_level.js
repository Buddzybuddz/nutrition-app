/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Niveau d'activité professionnelle (hors sport, saisi à part) : sert au coefficient du métabolisme.
       Vide pour les profils existants, traité comme « sedentary » (x 1,2) : leurs calories ne changent pas. */
    const profiles = app.findCollectionByNameOrId("profiles");
    profiles.fields.add(new SelectField({
        name: "activityLevel",
        maxSelect: 1,
        values: ["sedentary", "light", "active", "very_active", "intense"],
    }));
    return app.save(profiles);
}, (app) => {
    const profiles = app.findCollectionByNameOrId("profiles");
    try { profiles.fields.removeByName("activityLevel"); } catch (_) {}
    return app.save(profiles);
});

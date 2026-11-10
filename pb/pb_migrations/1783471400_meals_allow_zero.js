/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Dans PocketBase, un champ nombre « obligatoire » refuse la valeur 0 (« Cannot be blank »).
       Une collation sans protéines (une pomme : 78 kcal, 0 g) ou un repas à 0 kcal était donc refusé par le
       serveur alors que l'app l'affichait : le repas disparaissait au rechargement. Les valeurs sont toujours
       envoyées par l'app (0 par défaut) : on retire l'obligation pour accepter 0. */
    const targets = { meals: ["calories", "protein"], favorite_meals: ["calories"] };
    Object.keys(targets).forEach((name) => {
        const col = app.findCollectionByNameOrId(name);
        targets[name].forEach((field) => {
            const f = col.fields.getByName(field);
            if (f) f.required = false;
        });
        app.save(col);
    });
}, (app) => {
    const targets = { meals: ["calories", "protein"], favorite_meals: ["calories"] };
    Object.keys(targets).forEach((name) => {
        const col = app.findCollectionByNameOrId(name);
        targets[name].forEach((field) => {
            const f = col.fields.getByName(field);
            if (f) f.required = true;
        });
        app.save(col);
    });
});

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("pbc_3414089001");
    const toRemove = ["stripe_customer_id", "subscription_status", "subscription_end"];
    for (const name of toRemove) {
        try { collection.fields.removeByName(name); } catch(_) {}
    }
    return app.save(collection);
}, (app) => {
    // rollback vide — les champs sont sur users désormais
});

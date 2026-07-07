/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    collection.fields.addAt(999, new DateField({
        name:     "subscription_cancel_at",
        required: false,
    }));

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    try { collection.fields.removeByName("subscription_cancel_at"); } catch(_) {}

    return app.save(collection);
});

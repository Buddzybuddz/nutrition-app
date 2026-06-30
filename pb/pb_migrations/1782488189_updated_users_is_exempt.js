/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    collection.fields.addAt(999, new BoolField({
        name:     "is_exempt",
        required: false,
    }));

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");
    try { collection.fields.removeByName("is_exempt"); } catch(_) {}
    return app.save(collection);
});

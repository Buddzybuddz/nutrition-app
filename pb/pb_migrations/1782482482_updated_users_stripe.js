/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    collection.fields.addAt(999, new TextField({
        name:     "stripe_customer_id",
        required: false,
    }));

    collection.fields.addAt(999, new SelectField({
        name:      "subscription_status",
        required:  false,
        maxSelect: 1,
        values:    ["none", "trialing", "active", "past_due", "canceled", "incomplete"],
    }));

    collection.fields.addAt(999, new DateField({
        name:     "subscription_end",
        required: false,
    }));

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    const toRemove = ["stripe_customer_id", "subscription_status", "subscription_end"];
    for (const name of toRemove) {
        try { collection.fields.removeByName(name); } catch(_) {}
    }

    return app.save(collection);
});

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("pbc_3414089001");

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
    const collection = app.findCollectionByNameOrId("pbc_3414089001");

    collection.fields.removeById("stripe_customer_id");
    collection.fields.removeById("subscription_status");
    collection.fields.removeById("subscription_end");

    return app.save(collection);
});

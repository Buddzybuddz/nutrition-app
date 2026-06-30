/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const PAYWALL = '(@request.auth.is_exempt = true || @request.auth.subscription_status = "active" || @request.auth.subscription_status = "trialing" || @request.auth.subscription_end >= @now)';

    const owned = ["meals", "activities_log", "weigh_ins", "daily_stats", "goal_history", "profiles"];
    for (const name of owned) {
        try {
            const col = app.findCollectionByNameOrId(name);
            const base = "user = @request.auth.id";
            const rule = base + " && " + PAYWALL;
            col.listRule   = rule;
            col.viewRule   = rule;
            col.createRule = rule;
            col.updateRule = rule;
            col.deleteRule = rule;
            app.save(col);
        } catch(_) {}
    }

    try {
        const col = app.findCollectionByNameOrId("user_data");
        const base = "@request.auth.id = user.id";
        const rule = base + " && " + PAYWALL;
        col.listRule   = rule;
        col.viewRule   = rule;
        col.createRule = rule;
        col.updateRule = rule;
        col.deleteRule = rule;
        app.save(col);
    } catch(_) {}
}, (app) => {
    const owned = ["meals", "activities_log", "weigh_ins", "daily_stats", "goal_history", "profiles"];
    for (const name of owned) {
        try {
            const col = app.findCollectionByNameOrId(name);
            const rule = "user = @request.auth.id";
            col.listRule   = rule;
            col.viewRule   = rule;
            col.createRule = rule;
            col.updateRule = rule;
            col.deleteRule = rule;
            app.save(col);
        } catch(_) {}
    }

    try {
        const col = app.findCollectionByNameOrId("user_data");
        col.listRule   = "@request.auth.id = user.id";
        col.viewRule   = "@request.auth.id = user.id";
        col.createRule = '@request.auth.id != ""';
        col.updateRule = "@request.auth.id = user.id";
        col.deleteRule = "@request.auth.id = user.id";
        app.save(col);
    } catch(_) {}
});

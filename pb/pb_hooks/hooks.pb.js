/// <reference path="../pb_data/types.d.ts" />

/* ─── Set subscription_end = now + 7 jours à la création de compte ───── */
onRecordCreateRequest((e) => {
    if (e.collection.name !== "_pb_users_auth_") {
        return e.next();
    }

    var d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    var iso = d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0") + " " +
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0") + ":" +
        String(d.getSeconds()).padStart(2, "0") + ".000Z";

    e.record.set("subscription_end", iso);

    return e.next();
});

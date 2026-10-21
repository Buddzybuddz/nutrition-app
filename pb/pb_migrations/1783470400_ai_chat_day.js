/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Une conversation = les messages d'un même jour (jour Europe/Paris) */
    const chat = app.findCollectionByNameOrId("ai_chat");
    chat.fields.add(new TextField({ name: "day" }));
    chat.indexes = (chat.indexes || []).concat(["CREATE INDEX idx_ai_chat_user_day ON ai_chat (user, day)"]);
    app.save(chat);

    /* Messages existants : on les rattache à leur jour de création */
    function parisDay(ms) {
        const y = new Date(ms).getUTCFullYear();
        function lastSunday(month) {
            const d = new Date(Date.UTC(y, month + 1, 0, 1));
            return Date.UTC(y, month, d.getUTCDate() - d.getUTCDay(), 1);
        }
        const dst = ms >= lastSunday(2) && ms < lastSunday(9);
        return new Date(ms + (dst ? 2 : 1) * 3600000).toISOString().slice(0, 10);
    }
    const rows = app.findAllRecords("ai_chat");
    rows.forEach((r) => {
        const ms = new Date(String(r.get("created")).replace(" ", "T")).getTime();
        if (!isNaN(ms)) {
            r.set("day", parisDay(ms));
            app.save(r);
        }
    });
}, (app) => {
    const chat = app.findCollectionByNameOrId("ai_chat");
    try { chat.fields.removeByName("day"); } catch (_) {}
    chat.indexes = (chat.indexes || []).filter((i) => i.indexOf("idx_ai_chat_user_day") < 0);
    app.save(chat);
});

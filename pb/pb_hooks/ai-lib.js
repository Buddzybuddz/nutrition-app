/* Helpers partagés par pb_hooks/ai-chat.pb.js (chargés avec require() DANS les handlers :
   les fonctions déclarées au niveau d'un fichier .pb.js ne sont pas fiables dans le JSVM).
   Ce fichier n'est pas un hook : il n'est exécuté que lorsqu'un handler le requiert. */

var DAY_MS = 86400000;
var WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/* Jour calendaire en Europe/Paris (heure d'été : dernier dimanche de mars -> dernier dimanche d'octobre, 01h UTC) */
function parisDay(ms) {
    var y = new Date(ms).getUTCFullYear();
    function lastSunday(month) {
        var d = new Date(Date.UTC(y, month + 1, 0, 1));
        return Date.UTC(y, month, d.getUTCDate() - d.getUTCDay(), 1);
    }
    var dst = ms >= lastSunday(2) && ms < lastSunday(9);
    return new Date(ms + (dst ? 2 : 1) * 3600000).toISOString().slice(0, 10);
}

function addDays(isoDay, delta) {
    return new Date(new Date(isoDay + "T00:00:00Z").getTime() + delta * DAY_MS).toISOString().slice(0, 10);
}

/* Accès : exempté, admin, abonné ou essai en cours */
function hasAccess(auth) {
    var endMs = new Date(String(auth.get("subscription_end") || "").replace(" ", "T")).getTime();
    var st = String(auth.get("subscription_status") || "");
    return auth.getBool("is_exempt") || auth.getBool("is_admin") ||
        st === "active" || st === "trialing" || (!isNaN(endMs) && endMs > Date.now());
}

function findOne(collection, filter, params) {
    try { return $app.findFirstRecordByFilter(collection, filter, params); } catch (_) { return null; }
}

/* Renvoie un VRAI tableau JS : la liste renvoyée par PocketBase est un slice Go, dont .reverse() / .slice()
   se comportent mal (l'ordre des éléments est mélangé). */
function findMany(collection, filter, sort, limit, params) {
    var res;
    try { res = $app.findRecordsByFilter(collection, filter, sort, limit, 0, params); } catch (_) { return []; }
    var out = [];
    for (var i = 0; i < res.length; i++) out.push(res[i]);
    return out;
}

/* ── Compteur d'usage (ai_usage) ───────────────────────────── */

function usageRow(userId, day, create) {
    var rec = findOne("ai_usage", "user = {:u} && day = {:d}", { u: userId, d: day });
    if (!rec && create) {
        try {
            rec = new Record($app.findCollectionByNameOrId("ai_usage"));
            rec.set("user", userId);
            rec.set("day", day);
            rec.set("meal", 0);
            rec.set("activity", 0);
            rec.set("chat", 0);
            rec.set("cache_hits", 0);
            $app.save(rec);
        } catch (_) { rec = findOne("ai_usage", "user = {:u} && day = {:d}", { u: userId, d: day }); }
    }
    return rec;
}

function bump(userId, day, field, delta) {
    var r = usageRow(userId, day, true);
    if (!r) return;
    r.set(field, Math.max(0, r.getInt(field) + delta));
    $app.save(r);
}

function usageOf(auth, rec, field, limitValue) {
    var limit = auth.getBool("is_admin") ? null : limitValue;
    var used = rec ? rec.getInt(field) : 0;
    return { limit: limit, used: used, remaining: limit === null ? null : Math.max(0, limit - used) };
}

/* ── Contexte de suivi envoyé à l'IA ───────────────────────── */

function ageFrom(birth, today) {
    var b = new Date(String(birth || "").replace(" ", "T"));
    if (isNaN(b.getTime())) return 0;
    var t = new Date(today + "T12:00:00Z");
    var age = t.getUTCFullYear() - b.getUTCFullYear();
    var m = t.getUTCMonth() - b.getUTCMonth();
    if (m < 0 || (m === 0 && t.getUTCDate() < b.getUTCDate())) age--;
    return age;
}

function bmr(gender, weight, height, age) {
    var base = 10 * weight + 6.25 * height - 5 * age;
    return (gender === "male" || gender === "Homme") ? base + 5 : base - 161;
}

var MEAL_LABELS = { breakfast: "Petit-déjeuner", lunch: "Déjeuner", snack: "Collation", dinner: "Dîner" };

/* Reproduit les formules de l'app : TDEE = BMR x 1,2 ; objectif x 0,9 (perte) / 1 / 1,1 (prise) ;
   cible calories = TDEE x coef + calories des activités ; cible protéines = 2 g x poids. */
function buildContext(userId, today) {
    var prof = findOne("profiles", "user = {:u}", { u: userId });
    if (!prof) return null;

    var from = addDays(today, -13);
    var fromTs = from + " 00:00:00.000Z";

    var weighIns = findMany("weigh_ins", "user = {:u}", "-date", 40, { u: userId }).map(function (r) {
        return { day: String(r.get("date")).slice(0, 10), weight: Number(r.get("weight")) };
    }); /* du plus récent au plus ancien */
    var profWeight = Number(prof.get("weight")) || 0;

    function weightAt(day) {
        for (var i = 0; i < weighIns.length; i++) if (weighIns[i].day <= day) return weighIns[i].weight;
        return weighIns.length ? weighIns[weighIns.length - 1].weight : profWeight;
    }

    var gender = String(prof.get("gender") || "");
    var height = Number(prof.get("height")) || 0;
    var age = ageFrom(prof.get("birthDate"), today);
    var goal = String(prof.get("goal") || "maintenance");
    var coef = goal === "loss" ? 0.9 : (goal === "gain" ? 1.1 : 1);
    var goalLabel = goal === "loss" ? "perte de poids (-10 %)" : (goal === "gain" ? "prise de masse (+10 %)" : "maintien du poids");
    var nowWeight = weightAt(today);
    var tdeeNow = bmr(gender, nowWeight, height, age) * 1.2;

    var meals = findMany("meals", "user = {:u} && date >= {:f}", "date", 600, { u: userId, f: fromTs });
    var acts = findMany("activities_log", "user = {:u} && date >= {:f}", "date", 300, { u: userId, f: fromTs });
    var stats = findMany("daily_stats", "user = {:u} && date >= {:f}", "date", 60, { u: userId, f: fromTs });

    var days = {};
    function dayOf(d) { return days[d] || (days[d] = { meals: [], acts: [], cals: 0, prot: 0, burned: 0 }); }
    meals.forEach(function (m) {
        var d = dayOf(String(m.get("date")).slice(0, 10));
        var e = { type: MEAL_LABELS[m.get("mealType")] || String(m.get("mealType") || "Repas"), name: String(m.get("name") || ""), desc: String(m.get("description") || "").trim(), cals: Number(m.get("calories")) || 0, prot: Number(m.get("protein")) || 0 };
        d.meals.push(e); d.cals += e.cals; d.prot += e.prot;
    });
    acts.forEach(function (a) {
        var d = dayOf(String(a.get("date")).slice(0, 10));
        var e = { name: String(a.get("name") || "Activité"), cals: Number(a.get("calories")) || 0 };
        d.acts.push(e); d.burned += e.cals;
    });
    var statByDay = {};
    stats.forEach(function (s) { statByDay[String(s.get("date")).slice(0, 10)] = s; });

    function goals(day) {
        var s = statByDay[day], d = days[day] || { burned: 0 };
        var base = s && Number(s.get("baseTDEE")) > 0 ? Number(s.get("baseTDEE")) : tdeeNow;
        var c = s && Number(s.get("goalMultiplier")) > 0 ? Number(s.get("goalMultiplier")) : coef;
        return { cal: Math.round(base * c + d.burned), prot: Math.round(weightAt(day) * 2) };
    }

    function dayName(day) { return WEEKDAYS[new Date(day + "T12:00:00Z").getUTCDay()] + " " + day; }
    function mealLine(m) { return "    - " + m.type + " : " + (m.desc ? m.desc + " — " : "") + m.cals + " kcal, " + m.prot + " g de protéines"; }

    /* Goûts de l'utilisateur : repas favoris (même composition saisie au moins 2 fois) et aliments fréquents,
       sur 6 mois. Seuls les repas avec description sont exploitables (les chiffres seuls ne disent rien du goût). */
    function tastes() {
        var rows = findMany("meals", "user = {:u} && date >= {:f}", "-date", 1500, { u: userId, f: addDays(today, -180) + " 00:00:00.000Z" });
        var favs = {}, foods = {};
        rows.forEach(function (m) {
            var desc = String(m.get("description") || "").trim();
            if (!desc) return;
            var type = String(m.get("mealType") || "");
            var key = type + "|" + desc.toLowerCase();
            var g = favs[key] || (favs[key] = { type: type, desc: desc, count: 0, cals: Number(m.get("calories")) || 0, prot: Number(m.get("protein")) || 0 });
            g.count++;
            desc.split(",").forEach(function (part) {
                var name = part.replace(/\s+\d+([.,]\d+)?\s*(g|ml)\s*$/i, "").trim().toLowerCase();
                if (name) foods[name] = (foods[name] || 0) + 1;
            });
        });
        var lines = [];
        Object.keys(MEAL_LABELS).forEach(function (type) {
            var list = Object.keys(favs).map(function (k) { return favs[k]; })
                .filter(function (g) { return g.type === type && g.count >= 2; })
                .sort(function (a, b) { return b.count - a.count; }).slice(0, 3);
            if (list.length) lines.push("  " + MEAL_LABELS[type] + " : " + list.map(function (g) {
                return g.desc + " (" + g.cals + " kcal, " + g.prot + " g de protéines, " + g.count + " fois)";
            }).join(" ; "));
        });
        var saved = findMany("favorite_meals", "user = {:u}", "-created", 40, { u: userId });
        Object.keys(MEAL_LABELS).forEach(function (type) {
            var mine = saved.filter(function (f) { return f.get("mealType") === type; }).slice(0, 5);
            if (mine.length) lines.push("  " + MEAL_LABELS[type] + " (favoris enregistrés par l'utilisateur) : " + mine.map(function (f) {
                return String(f.get("description") || f.get("name")) + " (" + (Number(f.get("calories")) || 0) + " kcal, " + (Number(f.get("protein")) || 0) + " g de protéines)";
            }).join(" ; "));
        });
        var acts = findMany("favorite_activities", "user = {:u}", "-created", 10, { u: userId });
        if (acts.length) lines.push("  Activités favorites enregistrées par l'utilisateur : " + acts.map(function (a) {
            var m = Number(a.get("minutes")) || 0;
            return a.get("name") + " (" + (m ? m + " min, " : "") + (Number(a.get("calories")) || 0) + " kcal brûlées)";
        }).join(" ; "));
        var top = Object.keys(foods).map(function (k) { return [k, foods[k]]; })
            .filter(function (f) { return f[1] >= 2; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
        return { favorites: lines, foods: top.map(function (f) { return f[0] + " (" + f[1] + ")"; }) };
    }

    var t = days[today] || { meals: [], acts: [], cals: 0, prot: 0, burned: 0 };
    var g = goals(today);
    var out = [];
    out.push("DATE DU JOUR : " + dayName(today));
    out.push("PROFIL : " + ((gender === "male" || gender === "Homme") ? "homme" : "femme") + ", " + age + " ans, " + height + " cm, poids actuel " + nowWeight + " kg" +
        (prof.get("targetWeight") ? ", poids cible " + prof.get("targetWeight") + " kg" : "") + ". Objectif : " + goalLabel + ".");
    out.push("RÈGLES DE L'APP : cible calories = métabolisme x 1,2 (" + Math.round(tdeeNow) + " kcal) x " + coef + " + calories des activités ; cible protéines = 2 g par kg (" + Math.round(nowWeight * 2) + " g).");
    out.push("");
    out.push("AUJOURD'HUI : " + t.cals + " kcal et " + t.prot + " g de protéines consommés. Objectif du jour : " + g.cal + " kcal (dont " + t.burned + " kcal d'activités) et " + g.prot + " g de protéines." +
        " Reste : " + (g.cal - t.cals) + " kcal et " + (g.prot - t.prot) + " g de protéines.");
    out.push(t.meals.length ? "  Repas du jour :" : "  Aucun repas saisi aujourd'hui.");
    t.meals.forEach(function (m) { out.push(mealLine(m)); });
    if (t.acts.length) {
        out.push("  Activités du jour :");
        t.acts.forEach(function (a) { out.push("    - " + a.name + " — " + a.cals + " kcal brûlées"); });
    }

    out.push("");
    out.push("13 JOURS PRÉCÉDENTS (consommé / objectif) :");
    for (var i = 1; i <= 13; i++) {
        var day = addDays(today, -i), d = days[day];
        if (!d || (!d.meals.length && !d.acts.length)) { out.push("  " + dayName(day) + " : rien de saisi"); continue; }
        var gd = goals(day);
        out.push("  " + dayName(day) + " : " + d.cals + "/" + gd.cal + " kcal, " + d.prot + "/" + gd.prot + " g de protéines, " + d.burned + " kcal d'activités, " + d.meals.length + " repas");
        if (i <= 7) d.meals.forEach(function (m) { out.push(mealLine(m)); });
    }

    var taste = tastes();
    out.push("");
    if (taste.favorites.length || taste.foods.length) {
        out.push("GOÛTS DE L'UTILISATEUR (déduits de ses repas des 6 derniers mois) :");
        if (taste.favorites.length) { out.push("REPAS FAVORIS (les plus souvent mangés) :"); taste.favorites.forEach(function (l) { out.push(l); }); }
        if (taste.foods.length) out.push("ALIMENTS LES PLUS FRÉQUENTS : " + taste.foods.join(", "));
    } else {
        out.push("GOÛTS DE L'UTILISATEUR : pas encore assez de repas décrits pour en déduire des favoris.");
    }

    out.push("");
    if (weighIns.length) {
        out.push("PESÉES (récentes d'abord) : " + weighIns.slice(0, 10).map(function (w) { return w.day + " : " + w.weight + " kg"; }).join(" ; "));
    } else {
        out.push("PESÉES : aucune pesée enregistrée (poids du profil : " + profWeight + " kg).");
    }
    var gh = findMany("goal_history", "user = {:u}", "-date", 5, { u: userId });
    if (gh.length) out.push("CHANGEMENTS D'OBJECTIF : " + gh.map(function (r) { return String(r.get("date")).slice(0, 10) + " -> " + r.get("goal"); }).join(" ; "));

    return out.join("\n");
}

/* ── Conversations par jour ────────────────────────────────── */

var MAX_DAYS_KEPT = 30;
var MEMORY_DAYS = 7;
var MEMORY_MAX_CHARS = 3500;

function dayLabel(day) {
    var d = new Date(day + "T12:00:00Z");
    var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    return WEEKDAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
}

/* Jours ayant une conversation (du plus récent au plus ancien) : { day, count, first } */
function daysList(userId) {
    var rows = arrayOf(new DynamicModel({ "day": "", "n": 0, "first": "" }));
    try {
        $app.db().newQuery(
            "SELECT c.day AS day, COUNT(*) AS n, COALESCE((SELECT c2.content FROM ai_chat c2 " +
            "WHERE c2.user = c.user AND c2.day = c.day AND c2.role = 'user' ORDER BY c2.created LIMIT 1), '') AS first " +
            "FROM ai_chat c WHERE c.user = {:u} AND c.day != '' GROUP BY c.day ORDER BY c.day DESC LIMIT " + MAX_DAYS_KEPT
        ).bind({ u: userId }).all(rows);
    } catch (_) { return []; }
    var out = [];
    for (var i = 0; i < rows.length; i++) out.push({ day: rows[i].day, count: rows[i].n, first: String(rows[i].first).slice(0, 80) });
    return out;
}

/* Mémoire courte : questions et début des réponses des 7 jours précédents (le plus récent d'abord) */
function buildMemory(userId, today) {
    var rows = findMany("ai_chat", "user = {:u} && day >= {:f} && day < {:t}", "created", 300,
        { u: userId, f: addDays(today, -MEMORY_DAYS), t: today });
    if (!rows.length) return "";
    var byDay = {}, order = [];
    rows.forEach(function (r) {
        var d = String(r.get("day"));
        if (!byDay[d]) { byDay[d] = []; order.push(d); }
        var user = r.get("role") === "user";
        var txt = String(r.get("content")).replace(/\s+/g, " ").trim();
        byDay[d].push((user ? "Utilisateur : " + txt.slice(0, 160) : "Assistant : " + txt.slice(0, 220)));
    });
    order.sort().reverse();
    var out = "", i;
    for (i = 0; i < order.length; i++) {
        var block = "- " + dayLabel(order[i]) + " :\n  " + byDay[order[i]].join("\n  ") + "\n";
        if (out.length + block.length > MEMORY_MAX_CHARS) break;
        out += block;
    }
    return out;
}

/* Supprime les conversations au-delà des 30 jours les plus récents */
function pruneOldDays(userId) {
    var rows = arrayOf(new DynamicModel({ "day": "" }));
    try {
        $app.db().newQuery("SELECT DISTINCT day FROM ai_chat WHERE user = {:u} AND day != '' ORDER BY day DESC LIMIT 200")
            .bind({ u: userId }).all(rows);
    } catch (_) { return; }
    for (var i = MAX_DAYS_KEPT; i < rows.length; i++) {
        findMany("ai_chat", "user = {:u} && day = {:d}", "created", 500, { u: userId, d: rows[i].day })
            .forEach(function (r) { try { $app.delete(r); } catch (_) {} });
    }
}

/* ── Appel Gemini (conversation) ───────────────────────────── */

/* contents : [{ role: "user" | "model", text }] ; renvoie le texte de la réponse ou lève { code, msg } */
function callGemini(system, contents) {
    var key = $os.getenv("GEMINI_API_KEY");
    var model = $os.getenv("GEMINI_CHAT_MODEL") || $os.getenv("GEMINI_MODEL") || "gemini-3.5-flash-lite";
    if (!key) throw { code: 503, msg: "L'assistant IA n'est pas configuré." };

    var res;
    try {
        res = $http.send({
            method: "POST",
            url: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: contents.map(function (c) { return { role: c.role, parts: [{ text: c.text }] }; }),
                generationConfig: { temperature: 0.6, maxOutputTokens: 1500 },
            }),
            timeout: 40,
        });
    } catch (err) {
        throw { code: 502, msg: "Assistant indisponible, réessayez." };
    }
    if (res.statusCode === 429) throw { code: 503, msg: "Quota IA atteint, réessayez plus tard." };
    if (res.statusCode >= 400) {
        console.log("[ai-chat] Gemini HTTP " + res.statusCode + " " + String(res.raw).slice(0, 300));
        throw { code: 502, msg: "Assistant indisponible, réessayez." };
    }
    try {
        var parsed = JSON.parse(res.raw);
        var parts = parsed.candidates[0].content.parts || [];
        var text = parts.filter(function (p) { return !p.thought && typeof p.text === "string"; })
            .map(function (p) { return p.text; }).join("").trim();
        if (!text) throw new Error("vide");
        return text;
    } catch (err) {
        throw { code: 502, msg: "Réponse illisible, réessayez." };
    }
}

module.exports = {
    parisDay: parisDay,
    hasAccess: hasAccess,
    findOne: findOne,
    findMany: findMany,
    usageRow: usageRow,
    bump: bump,
    usageOf: usageOf,
    buildContext: buildContext,
    daysList: daysList,
    buildMemory: buildMemory,
    pruneOldDays: pruneOldDays,
    dayLabel: dayLabel,
    callGemini: callGemini,
};

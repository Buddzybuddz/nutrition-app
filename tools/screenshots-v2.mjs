/* Captures d'écran « V2 » de NutriDash (landing, authentification, app, desktop + mobile).

   Prérequis : le front sert sur http://127.0.0.1:8000 (python3 -m http.server 8000) et PocketBase tourne sur
   http://127.0.0.1:8090 avec toutes les migrations appliquées (dont meals.cheat).

   Usage :
     PB_ADMIN_PASSWORD=... node tools/screenshots-v2.mjs [options]

   Options :
     --ecraser            écrit dans Images/Screenshot app/V2 (par défaut : V2-nouveau, rien n'est écrasé)
     --avec-ia            fait les vraies estimations IA (clé IA requise côté PocketBase, consomme le quota du compte démo) ;
                          par défaut la réponse de l'estimation est simulée (mock) pour les captures « estimation IA »
     --garder             conserve le compte démo et ses données à la fin
     --seulement=a,b      groupes à capturer parmi : landing, auth, dashboard, repas, activite, assistant, suivi, profil

   Les données sont créées sur un compte démo dédié (demo-captures@nutridash-test.com), supprimé à la fin. */

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL || 'http://127.0.0.1:8000';
const PB = process.env.PB_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'baudouinjeremy@gmail.com';
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;
const DEMO = { email: 'demo-captures@nutridash-test.com', password: 'DemoCaptures1234!', name: 'Camille' };

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const only = (args.find((a) => a.startsWith('--seulement=')) || '').split('=')[1]?.split(',').filter(Boolean);
const wants = (group) => !only || only.includes(group);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'Images', 'Screenshot app');
const OUT = path.join(ROOT, flag('ecraser') ? 'V2' : 'V2-nouveau');

const VIEWPORTS = {
    Desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
    Mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

/* ── Données de démonstration ─────────────────────────────── */

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const pbDate = (d) => `${iso(d)} 12:00:00.000Z`;

const TYPE_LABEL = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', snack: 'Collation', dinner: 'Dîner' };
const TDEE = 1973.4; // (10 × 72,7 + 6,25 × 178 − 5 × 40 + 5) × 1,2 pour le profil démo

/* Deux journées types dans la cible (≈ 1 776 kcal, ≥ 131 g de protéines) */
const DAY_A = [
    ['breakfast', 'skyr 200 g, flocons d\'avoine 40 g, banane 120 g, miel 5 g', 400, 32],
    ['lunch', 'poulet grillé 150 g, riz basmati cuit 180 g, brocoli 150 g, huile d\'olive 5 g', 640, 52],
    ['snack', 'whey 30 g, banane 100 g', 260, 26],
    ['dinner', 'saumon 140 g, patate douce 200 g, haricots verts 150 g', 540, 38],
];
const DAY_B = [
    ['breakfast', 'œufs 120 g, pain complet 60 g, beurre 5 g, lait 250 ml', 430, 28],
    ['lunch', 'thon 120 g, pâtes cuites 200 g, tomate 80 g, huile d\'olive 5 g', 600, 45],
    ['snack', 'yaourt grec 150 g, noix 15 g', 210, 16],
    ['dinner', 'blanc de dinde 160 g, quinoa cuit 150 g, courgette 150 g', 520, 48],
];
const withCheat = (day, type, cheat) =>
    day.map((m) => (m[0] === type ? [type, '', cheat === 'cheat' ? 1000 : 1500, 30, cheat] : m));

/* index 1 = hier … index 7 = il y a 7 jours */
const HISTORY = {
    1: DAY_A, 2: DAY_B, 3: withCheat(DAY_A, 'dinner', 'cheat_alcool'), 4: DAY_B,
    5: withCheat(DAY_B, 'lunch', 'cheat'), 6: DAY_A, 7: DAY_B,
};
const TODAY_MEALS = [DAY_A[0], DAY_B[1]];

const FAV_MEALS = [
    ['breakfast', 'skyr 200 g, flocons d\'avoine 40 g, banane 120 g, miel 5 g', 400, 32],
    ['breakfast', 'whey 30 g, flocons d\'avoine 30 g, fromage blanc 0% 100 g, fruits rouges 50 g', 340, 41],
    ['lunch', 'poulet grillé 150 g, riz basmati cuit 180 g, brocoli 150 g', 620, 50],
    ['dinner', 'saumon 140 g, patate douce 200 g, haricots verts 150 g', 540, 38],
];

async function pbFetch(token, route, init = {}) {
    const res = await fetch(`${PB}${route}`, {
        ...init,
        headers: { Authorization: token, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    if (!res.ok) throw new Error(`${init.method || 'GET'} ${route} → ${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
}
const create = (token, col, body) => pbFetch(token, `/api/collections/${col}/records`, { method: 'POST', body: JSON.stringify(body) });

async function adminToken() {
    if (!ADMIN_PASSWORD) throw new Error('Variable PB_ADMIN_PASSWORD manquante (mot de passe superuser PocketBase).');
    const res = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error(`Authentification superuser refusée (${res.status}).`);
    return (await res.json()).token;
}

async function removeDemo(token) {
    const found = await pbFetch(token, `/api/collections/users/records?filter=${encodeURIComponent(`email="${DEMO.email}"`)}`);
    for (const u of found.items) {
        for (const col of ['meals', 'activities_log', 'daily_stats', 'weigh_ins', 'goal_history', 'profiles',
            'favorite_meals', 'favorite_activities', 'ai_chat']) {
            const rows = await pbFetch(token, `/api/collections/${col}/records?perPage=500&filter=${encodeURIComponent(`user="${u.id}"`)}`);
            for (const r of rows.items) await pbFetch(token, `/api/collections/${col}/records/${r.id}`, { method: 'DELETE' });
        }
        await pbFetch(token, `/api/collections/users/records/${u.id}`, { method: 'DELETE' });
    }
}

async function seedDemo(token) {
    await removeDemo(token);
    const now = new Date();
    const end = new Date(now.getTime() + 5 * 864e5).toISOString().replace('T', ' ');
    const user = await create(token, 'users', {
        email: DEMO.email, password: DEMO.password, passwordConfirm: DEMO.password, name: DEMO.name,
        emailVisibility: false, verified: true, is_active: true,
        subscription_status: 'trialing', subscription_end: end, ai_consent_at: now.toISOString().replace('T', ' '),
    });
    const u = user.id;
    await create(token, 'profiles', {
        user: u, birthDate: '1986-03-12 12:00:00.000Z', gender: 'Homme', weight: 75.4, height: 178,
        targetWeight: 70, goal: 'loss', weighInDay: 1,
    });
    await create(token, 'goal_history', { user: u, date: pbDate(daysAgo(70)), goal: 'loss' });

    const weights = [75.4, 75.1, 74.6, 74.3, 73.9, 73.6, 73.2, 72.9, 72.7];
    const lastMonday = daysAgo(((new Date().getDay() + 6) % 7));
    for (let i = 0; i < weights.length; i++) {
        const d = new Date(lastMonday); d.setDate(d.getDate() - 7 * (weights.length - 1 - i));
        await create(token, 'weigh_ins', { user: u, date: pbDate(d), weight: weights[i] });
    }

    const logDay = async (n, meals, activities = []) => {
        const date = pbDate(daysAgo(n));
        await create(token, 'daily_stats', { user: u, date, baseTDEE: TDEE, goalMultiplier: 0.9 });
        for (const [type, desc, calories, protein, cheat] of meals) {
            await create(token, 'meals', {
                user: u, date, mealType: type, name: TYPE_LABEL[type], calories, protein,
                description: desc.slice(0, 200), cheat: cheat || '',
            });
        }
        for (const [name, calories] of activities) await create(token, 'activities_log', { user: u, date, name, calories });
    };
    for (const [n, meals] of Object.entries(HISTORY)) {
        await logDay(Number(n), meals, Number(n) % 2 ? [['Marche rapide', 150]] : []);
    }
    await logDay(0, TODAY_MEALS, [['Salle de sport', 300]]);

    for (const [mealType, description, calories, protein] of FAV_MEALS) {
        await create(token, 'favorite_meals', { user: u, mealType, name: description.slice(0, 120), description, calories, protein });
    }
    await create(token, 'favorite_activities', { user: u, name: 'Salle de sport', minutes: 60, calories: 300 });
    await create(token, 'favorite_activities', { user: u, name: 'Vélo', minutes: 45, calories: 350 });

    const chat = (day, role, content) => create(token, 'ai_chat', { user: u, day: iso(day), role, content });
    await chat(daysAgo(1), 'user', 'Une idée pour ce soir ?');
    await chat(daysAgo(1), 'assistant', 'Il vous reste environ 560 kcal et 40 g de protéines : un pavé de saumon, de la patate douce et des haricots verts feraient très bien l\'affaire.');
    return u;
}

const CHAT_TODAY = [
    ['user', 'Comment s\'est passée ma semaine ?'],
    ['assistant', 'Plutôt bien : 5 jours sur 7 dans votre objectif, avec deux repas libres comptés au forfait. Votre poids a baissé de 0,2 kg depuis lundi dernier.'],
    ['user', 'Et pour demain ?'],
    ['assistant', 'Gardez le petit-déjeuner riche en protéines, il vous aide à tenir jusqu\'au déjeuner. Il vous restera de la marge pour un dîner plus gourmand.'],
];
async function addChat(token, userId, from, to) {
    for (const [role, content] of CHAT_TODAY.slice(from, to)) {
        await create(token, 'ai_chat', { user: userId, day: iso(new Date()), role, content });
    }
}

/* Réponses d'estimation simulées (POST /api/ai/estimate) pour les captures sans clé IA */
const MOCK_MEAL = {
    calories: 612, protein_g: 42, confidence: 'high',
    summary: 'riz cuit 150 g, poulet grillé 100 g, légumes vapeur 150 g',
    items: [
        { label: 'riz cuit', quantity: '150 g', amount: 150, unit: 'g', kcal: 195 },
        { label: 'poulet grillé', quantity: '100 g', amount: 100, unit: 'g', kcal: 165 },
        { label: 'légumes vapeur', quantity: '150 g', amount: 150, unit: 'g', kcal: 52 },
    ],
    usage: { limit: 10, remaining: 9 },
};
const MOCK_ACTIVITY = { label: 'Course à pied', minutes: 30, calories_burned: 310, confidence: 'medium', usage: { limit: 5, remaining: 4 } };

async function mockEstimate(page) {
    await page.route('**/api/ai/estimate', (route) => {
        const type = JSON.parse(route.request().postData() || '{}').type;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(type === 'activity' ? MOCK_ACTIVITY : MOCK_MEAL) });
    });
    await page.route('**/api/ai/usage*', (route) => route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ meal: MOCK_MEAL.usage, activity: MOCK_ACTIVITY.usage, usage: MOCK_MEAL.usage }),
    }));
}

/* ── Captures ─────────────────────────────────────────────── */

const shots = []; const failures = []; const skipped = [];

async function snap(page, folder, name, { full = false } = {}) {
    const dir = path.join(OUT, folder);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.png`);
    try {
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.screenshot({ path: file, fullPage: full });
        shots.push(path.relative(ROOT, file));
    } catch (e) { failures.push(`${name} : ${e.message}`); }
}
const settle = (page, ms = 1200) => page.waitForTimeout(ms);

async function scrollToEl(page, selector, { offset = 72, wait = 3200 } = {}) {
    await page.evaluate(([s, o]) => {
        const el = document.querySelector(s);
        if (el) window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - o);
    }, [selector, offset]);
    await settle(page, wait);
}

async function revealWholePage(page) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(350); }
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
}

async function landing(page, P) {
    const F = 'Landing page';
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await settle(page, 3500);
    await snap(page, F, `${P}-Landing - hero`);
    await scrollToEl(page, '#lx-comment');
    await snap(page, F, `${P}-Landing - comment ca marche`);
    for (const [i, name] of [[2, 'etape 2'], [3, 'etape 3']]) {
        await scrollToEl(page, `.lx-step:nth-child(${i})`, { offset: P === 'Mobile' ? 300 : 200, wait: 1800 });
        await snap(page, F, `${P}-Landing - ${name}`);
    }
    await scrollToEl(page, '.lx-bento');
    await snap(page, F, `${P}-Landing - fonctionnalites`);
    if (P === 'Mobile') {
        await scrollToEl(page, '.lx-bento .lx-tile:nth-child(4)', { offset: 90 });
        await snap(page, F, `${P}-Landing - fonctionnalites suite`);
    }
    await scrollToEl(page, '.lx-days');
    await snap(page, F, `${P}-Landing - 7 jours`);
    await scrollToEl(page, '#lx-histoire', { offset: 60, wait: 2500 });
    await snap(page, F, `${P}-Landing - mon histoire`);
    await scrollToEl(page, '.lx-hist-item:last-child', { offset: P === 'Mobile' ? 160 : 260, wait: 3000 });
    await snap(page, F, `${P}-Landing - mon histoire resultat`);
    await scrollToEl(page, '.lp-pricing');
    await snap(page, F, `${P}-Landing - tarif`);
    await scrollToEl(page, '.lp-cta-final');
    await snap(page, F, `${P}-Landing - appel final`);
    await revealWholePage(page);
    await page.addStyleTag({ content: '.lx-sticky-cta, .lx-progress { display: none !important; }' });
    await snap(page, F, `${P}-Landing - page complete`, { full: true });
}

async function auth(page, P) {
    const F = 'Authentification';
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await settle(page, 2500);
    await page.locator('.lp-header').getByRole('button', { name: 'Connexion' }).click();
    await settle(page, 1200);
    await snap(page, F, `${P}-connexion`);
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await settle(page, 2500);
    await page.locator('.lx-hero-cta .lx-btn').click();
    await settle(page, 1200);
    await snap(page, F, `${P}-creation_compte`);
}

async function login(page) {
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await settle(page, 2500);
    await page.locator('.lp-header').getByRole('button', { name: 'Connexion' }).click();
    await page.getByRole('textbox', { name: 'Adresse email' }).fill(DEMO.email);
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(DEMO.password);
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await page.waitForSelector('#app:not(.hidden)', { timeout: 20000 });
    await settle(page, 3500);
}

async function goTo(page, view, P) {
    const sel = P === 'Mobile' ? `.bottom-nav-item[data-target="${view}"]` : `.sidebar .nav-btn[data-target="${view}"]`;
    await page.locator(sel).click();
    await settle(page, 1800);
}

async function dashboard(page, P) {
    const F = 'Dashboard';
    await goTo(page, 'dashboard-view', P);
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap(page, F, `${P}-Tableau de bord`);
    await snap(page, F, `${P}-Tableau de bord - page complete`, { full: true });
    // Journal avec cheat meal : il y a 3 jours (dîner avec alcool)
    await page.evaluate((d) => window.setViewDate(d), iso(daysAgo(3)));
    await settle(page, 2500);
    await scrollToEl(page, '.history-card', { offset: P === 'Mobile' ? 140 : 200, wait: 800 });
    await snap(page, F, `${P}-Tableau de bord - cheat meal`);
    await page.evaluate(() => window.setViewDate(new Date().toISOString().slice(0, 10)));
    await page.evaluate(() => window.scrollTo(0, 0));
}

async function openMeal(page) {
    await page.evaluate(() => window.openMealModal());
    await settle(page, 900);
}
async function closeModals(page) {
    await page.evaluate(() => { window.closeMealModal && window.closeMealModal(); window.closeActivityModal && window.closeActivityModal(); });
    await settle(page, 500);
}

async function repas(page, P, avecIA) {
    const F = 'Ajout repas';
    await goTo(page, 'dashboard-view', P);
    await openMeal(page);
    await page.locator('#meal-type').selectOption('lunch');
    await page.locator('#meal-cals').fill('620');
    await page.locator('#meal-protein').fill('48');
    await snap(page, F, `${P}-Ajout repas - saisie`);
    await closeModals(page);

    await openMeal(page);
    await page.locator('#meal-modes [data-mode="fav"]').click();
    await settle(page, 700);
    await snap(page, F, `${P}-Ajout repas - favoris`);
    await closeModals(page);

    for (const [value, name] of [['cheat', 'cheat meal'], ['cheat_alcool', 'cheat meal avec alcool']]) {
        await openMeal(page);
        await page.locator('#meal-type').selectOption('dinner');
        await page.locator(`#meal-nature [data-nature="${value}"]`).click();
        await page.locator('#meal-cheat-note').fill(value === 'cheat' ? 'Buffet chez des amis' : 'Anniversaire de Carla');
        await settle(page, 500);
        await snap(page, F, `${P}-Ajout repas - ${name}`);
        await closeModals(page);
    }

    await openMeal(page);
    await page.locator('#meal-ai-text').fill('150 g de riz, 100 g de poulet, légumes vapeur');
    await page.locator('#meal-ai-btn').click();
    await page.waitForFunction(() => !document.querySelector('#meal-ai-btn').disabled, null, { timeout: 60000 });
    await settle(page, 1200);
    await snap(page, F, `${P}-Ajout repas - estimation IA`);
    await closeModals(page);
}

async function activite(page, P, avecIA) {
    const F = 'Ajout activité';
    await goTo(page, 'dashboard-view', P);
    await page.evaluate(() => window.openActivityModal());
    await settle(page, 900);
    await page.locator('#activity-modes [data-mode="fav"]').click();
    await settle(page, 700);
    await snap(page, F, `${P}-Ajout activite - favoris`);
    await closeModals(page);
    await page.evaluate(() => window.openActivityModal());
    await settle(page, 900);
    await page.locator('#activity-ai-text').fill('30 minutes de course à pied');
    await page.locator('#activity-ai-btn').click();
    await page.waitForFunction(() => !document.querySelector('#activity-ai-btn').disabled, null, { timeout: 60000 });
    await settle(page, 1200);
    await snap(page, F, `${P}-Ajout activite - estimation IA`);
    await closeModals(page);
}

async function assistant(page, P, token, userId) {
    const F = 'Assistant IA';
    await goTo(page, 'ia-view', P);
    await settle(page, 1500);
    await snap(page, F, `${P}-Assistant IA - accueil`);
    await addChat(token, userId, 0, 2);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page, 3500);
    await goTo(page, 'ia-view', P);
    await settle(page, 1500);
    await snap(page, F, `${P}-Assistant IA - conversation_01`);
    await addChat(token, userId, 2, 4);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page, 3500);
    await goTo(page, 'ia-view', P);
    await settle(page, 1500);
    await snap(page, F, `${P}-Assistant IA - conversation_02`);
}

async function suivi(page, P) {
    const F = 'Mon suivi';
    await goTo(page, 'programme-view', P);
    for (const [tab, name] of [['objectifs', 'Objectifs'], ['poids', 'Poids'], ['favoris', 'Favoris']]) {
        await page.locator(`.pg-tab[data-tab="${tab}"]`).click();
        await settle(page, 1200);
        await page.evaluate(() => window.scrollTo(0, 0));
        await snap(page, F, `${P}-${name}`);
        if (tab === 'objectifs') {
            await scrollToEl(page, '.pg-duo', { offset: P === 'Mobile' ? 100 : 80, wait: 800 });
            await snap(page, F, `${P}-${name} - regularite`);
            await snap(page, F, `${P}-${name} - page complete`, { full: true });
        }
    }
}

async function profil(page, P) {
    const F = 'Profil - Paramètres';
    await goTo(page, 'profile-view', P);
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap(page, F, `${P}-Profil_01`);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.9));
    await settle(page, 800);
    await snap(page, F, `${P}-Profil_02`);
}

/* ── Orchestration ────────────────────────────────────────── */

async function main() {
    const needsApp = ['dashboard', 'repas', 'activite', 'assistant', 'suivi', 'profil'].some(wants);
    const token = await adminToken();
    let userId = null;
    if (needsApp) { userId = await seedDemo(token); console.log('Compte démo et données créés.'); }

    const browser = await chromium.launch();
    try {
        for (const [P, opts] of Object.entries(VIEWPORTS)) {
            console.log(`\n── ${P} ──`);
            if (wants('landing')) { const c = await browser.newContext(opts); await landing(await c.newPage(), P); await c.close(); }
            if (wants('auth')) { const c = await browser.newContext(opts); await auth(await c.newPage(), P); await c.close(); }
            if (needsApp) {
                const c = await browser.newContext(opts);
                const page = await c.newPage();
                if (!flag('avec-ia')) await mockEstimate(page);
                await login(page);
                const step = async (group, fn) => { if (!wants(group)) return; try { await fn(); } catch (e) { failures.push(`${P} ${group} : ${e.message.split('\n')[0]}`); await closeModals(page).catch(() => {}); } };
                await step('dashboard', () => dashboard(page, P));
                await step('repas', () => repas(page, P, flag('avec-ia')));
                await step('activite', () => activite(page, P, flag('avec-ia')));
                await step('suivi', () => suivi(page, P));
                await step('profil', () => profil(page, P));
                await step('assistant', () => assistant(page, P, token, userId));
                await c.close();
            }
        }
    } finally {
        await browser.close();
        if (userId && !flag('garder')) { await removeDemo(token); console.log('\nCompte démo supprimé.'); }
    }

    console.log(`\n${shots.length} captures dans ${path.relative(process.cwd(), OUT)}/`);
    if (skipped.length) console.log('\nIgnorées :\n  ' + skipped.join('\n  '));
    if (failures.length) { console.log('\nÉchecs :\n  ' + failures.join('\n  ')); process.exitCode = 1; }
}

main().catch((e) => { console.error(e.message); process.exit(1); });

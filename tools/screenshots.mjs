/* Captures d'écran de NutriDash (desktop et/ou mobile).

   Le dossier de captures reflète toujours l'état courant de l'application : pas de versions.
   Chaque lancement capture l'app dans un dossier temporaire, le compare au dossier de captures et classe :
     - à ajouter   : capturées maintenant, absentes du dossier ;
     - à modifier  : présentes mais différentes de l'app actuelle (écart de pixels > SEUIL) ;
     - à supprimer : présentes dans le dossier, mais plus produites par le script (écran supprimé ou renommé).
   S'il y a des écarts, le script ne modifie rien : il génère une page HTML de validation
   (.captures-rapport/index.html, ignoré par git) où l'on voit chaque capture (ancien / nouveau) et où l'on
   coche ce qu'on accepte. Puis --appliquer applique uniquement ce qui a été validé.

   Prérequis : l'application tourne sur APP_URL ; Playwright est installé
   (npm i -D @playwright/test && npx playwright install chromium) ; pour la détection des captures
   périmées : npm i -D pngjs pixelmatch (sans eux, comparaison octet par octet, plus sensible au bruit).

   Usage :
     node tools/screenshots.mjs [options]

   Options :
     (aucune)                          audit : génère le rapport HTML de validation s'il y a des écarts, ne modifie rien
                                       (code de sortie 1 s'il y a un écart)
     --appliquer[=fichier|tout]        applique le dernier rapport : par défaut les captures validées dans la page
                                       (~/Downloads/validation-captures.json), ou le fichier indiqué, ou « tout »
     --direct                          sans validation : ajoute et remplace tout de suite (supprime seulement avec --purger)
     --purger                          avec --direct : supprime aussi les captures en trop
     --appareils=desktop|mobile|both   appareils à capturer (sans option : la question est posée dans le terminal)
     --seulement=a,b                   groupes à traiter (voir GROUPS) ; le reste du dossier n'est pas touché
     --garder                          conserve les données de démo à la fin (si seed/cleanup sont définis)
 */

import { chromium } from '@playwright/test';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

/* Accès : variables du shell d'abord, puis fichiers du projet (le premier qui définit une variable l'emporte) :
   .env.captures (conservé par le skill, ignoré par git), .env.local, .env. Format CLE=valeur. */
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['.env.captures', '.env.local', '.env']) {
    try {
        for (const line of readFileSync(path.join(PROJECT_ROOT, file), 'utf8').split('\n')) {
            const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
            if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
        }
    } catch { /* fichier absent */ }
}

const APP = process.env.APP_URL || 'http://127.0.0.1:8000';
const PB = process.env.PB_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;
const DEMO = { email: 'demo-captures@nutridash-test.com', password: 'DemoCaptures1234!', name: 'Camille' };

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
const only = opt('seulement')?.split(',').filter(Boolean);
const wants = (group) => !only || only.includes(group);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'Images', 'Screenshot app');
/* Écart de pixels (part de l'image) au-delà duquel une capture est jugée périmée. */
const SEUIL = 0.002;
let OUT; // dossier temporaire de capture, créé dans main
let current = null; // groupe en cours : { P, folders }
const touched = []; // groupes terminés sans erreur

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
/* Déjeuner du jour au restaurant (badge « Restaurant » dans le journal) : 6e valeur = restaurant */
const RESTO_LUNCH = ['lunch', 'tartare de bœuf 160 g, frites 200 g, salade verte 50 g, câpres et cornichons 20 g', 780, 45, '', true];
const TODAY_MEALS = [DAY_A[0], RESTO_LUNCH];

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
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Variables PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD manquantes (compte superuser PocketBase).');
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
        for (const [type, desc, calories, protein, cheat, restaurant] of meals) {
            await create(token, 'meals', {
                user: u, date, mealType: type, name: TYPE_LABEL[type], calories, protein,
                description: desc.slice(0, 200), cheat: cheat || '', restaurant: !!restaurant,
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
const MOCK_MEAL_RESTO = {
    calories: 780, protein_g: 45, confidence: 'medium', restaurant: true,
    summary: 'tartare de bœuf 160 g, frites 200 g, salade verte 50 g, câpres et cornichons 20 g',
    items: [
        { label: 'tartare de bœuf', quantity: 'portion restaurant', amount: 160, unit: 'g', kcal: 232 },
        { label: 'frites', quantity: 'portion restaurant', amount: 200, unit: 'g', kcal: 500 },
        { label: 'salade verte', quantity: 'portion restaurant', amount: 50, unit: 'g', kcal: 8 },
        { label: 'câpres et cornichons', quantity: 'portion restaurant', amount: 20, unit: 'g', kcal: 4 },
    ],
    usage: { limit: 10, remaining: 8 },
};
const MOCK_ACTIVITY = { label: 'Course à pied', minutes: 30, calories_burned: 310, confidence: 'medium', usage: { limit: 5, remaining: 4 } };

async function mockEstimate(page) {
    await page.route('**/api/ai/estimate', (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        const out = body.type === 'activity' ? MOCK_ACTIVITY : (body.restaurant ? MOCK_MEAL_RESTO : MOCK_MEAL);
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    });
    await page.route('**/api/ai/usage*', (route) => route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ meal: MOCK_MEAL.usage, activity: MOCK_ACTIVITY.usage, usage: MOCK_MEAL.usage }),
    }));
}

/* ── Captures ─────────────────────────────────────────────── */

const shots = []; const failures = []; const skipped = [];

async function snap(page, folder, name, { full = false } = {}) {
    current?.folders.add(folder);
    const dir = path.join(OUT, folder);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.png`);
    try {
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.screenshot({ path: file, fullPage: full });
        shots.push(path.relative(OUT, file).split(path.sep).join('/'));
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

    // Repas au restaurant : intitulé du plat collé tel quel, sans quantités
    await openMeal(page);
    await page.locator('#meal-type').selectOption('lunch');
    await page.locator('#meal-ai-restaurant').check();
    await page.locator('#meal-ai-text').fill('Tartare de bœuf au couteau assaisonné maison, câpres, cornichons, pétales de parmesan, frites ou caponata et salade');
    await page.locator('#meal-ai-btn').click();
    await page.waitForFunction(() => !document.querySelector('#meal-ai-btn').disabled, null, { timeout: 60000 });
    await settle(page, 1200);
    await snap(page, F, `${P}-Ajout repas - restaurant`);
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
            await page.locator('.pg-details summary').click();
            await scrollToEl(page, '.pg-details', { offset: P === 'Mobile' ? 380 : 260, wait: 500 });
            await snap(page, F, `${P}-${name} - regularite detail`);
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

/* ── Comparaison avec le dossier de captures ──────────────── */

async function listPngs(dir, base = dir) {
    const out = [];
    let entries = [];
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...await listPngs(full, base));
        else if (e.name.endsWith('.png')) out.push(path.relative(base, full).split(path.sep).join('/'));
    }
    return out;
}

const exists = (f) => stat(f).then(() => true, () => false);

/* true si la capture a changé par rapport à celle du dossier. */
async function isOutdated(oldFile, newFile) {
    const [a, b] = await Promise.all([readFile(oldFile), readFile(newFile)]);
    if (createHash('sha1').update(a).digest('hex') === createHash('sha1').update(b).digest('hex')) return false;
    let PNG, pixelmatch;
    try { ({ PNG } = await import('pngjs')); pixelmatch = (await import('pixelmatch')).default; }
    catch { return true; } // pngjs/pixelmatch absents : tout octet différent compte
    const A = PNG.sync.read(a); const B = PNG.sync.read(b);
    if (A.width !== B.width || A.height !== B.height) return true;
    const diff = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1 });
    return diff / (A.width * A.height) > SEUIL;
}

/* Compare le staging (OUT) au dossier ROOT et renvoie { missing, outdated, extra, ok }. */
async function reconcile(devices) {
    const staged = [...new Set(shots)];
    const missing = []; const outdated = []; const ok = [];
    for (const rel of staged) {
        const target = path.join(ROOT, rel);
        if (!(await exists(target))) missing.push(rel);
        else if (await isOutdated(target, path.join(OUT, rel))) outdated.push(rel);
        else ok.push(rel);
    }
    /* En trop : uniquement dans les dossiers de groupes terminés sans erreur, pour les appareils capturés,
       ou dossiers entiers disparus lors d'un passage complet sans échec. */
    const extra = [];
    const existing = await listPngs(ROOT);
    const stagedSet = new Set(staged);
    const checked = new Set();
    for (const g of touched) for (const f of g.folders) checked.add(`${g.P}|${f}`);
    const fullRun = !only && !failures.length && devices.length === Object.keys(VIEWPORTS).length;
    const knownFolders = new Set(touched.flatMap((g) => [...g.folders]));
    for (const rel of existing) {
        if (stagedSet.has(rel)) continue;
        const [folder, ...rest] = rel.split('/');
        const file = rest.join('/');
        const P = file.split('-')[0];
        if (checked.has(`${P}|${folder}`)) extra.push(rel);
        else if (fullRun && !knownFolders.has(folder)) extra.push(rel);
    }
    return { missing, outdated, extra, ok };
}

async function chooseDevices() {
    const v = (opt('appareils') || '').toLowerCase();
    if (['desktop', 'mobile', 'both'].includes(v)) return v === 'both' ? ['Desktop', 'Mobile'] : [v === 'desktop' ? 'Desktop' : 'Mobile'];
    if (!process.stdin.isTTY) return ['Desktop', 'Mobile'];
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const rep = (await rl.question('Captures : [1] desktop  [2] mobile  [3] les deux (défaut) ? ')).trim();
    rl.close();
    return rep === '1' ? ['Desktop'] : rep === '2' ? ['Mobile'] : ['Desktop', 'Mobile'];
}

/* ── Rapport HTML de validation et application ────────────── */

const REPORT = path.join(PROJECT_ROOT, '.captures-rapport'); // ignoré par git
const VALIDATION_FILE = 'validation-captures.json'; // téléchargé par la page HTML

async function copyInto(src, dest) { await mkdir(path.dirname(dest), { recursive: true }); await copyFile(src, dest); }

async function pruneEmptyDirs(dir) {
    for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
        if (!e.isDirectory()) continue;
        const sub = path.join(dir, e.name);
        await pruneEmptyDirs(sub);
        if (!(await readdir(sub)).length) await rm(sub, { recursive: true });
    }
}

/* items : [{ type: 'ajouter'|'modifier'|'supprimer', rel }] ; srcDir : dossier des nouvelles captures. */
async function applyItems(items, srcDir) {
    for (const { type, rel } of items) {
        if (type === 'supprimer') await rm(path.join(ROOT, rel), { force: true });
        else await copyInto(path.join(srcDir, rel), path.join(ROOT, rel));
    }
    await pruneEmptyDirs(ROOT);
}

async function writeReport({ missing, outdated, extra }) {
    await rm(REPORT, { recursive: true, force: true });
    const items = [
        ...missing.map((rel) => ({ type: 'ajouter', rel })),
        ...outdated.map((rel) => ({ type: 'modifier', rel })),
        ...extra.map((rel) => ({ type: 'supprimer', rel })),
    ];
    for (const { type, rel } of items) {
        if (type !== 'ajouter') await copyInto(path.join(ROOT, rel), path.join(REPORT, 'ancien', rel));
        if (type !== 'supprimer') await copyInto(path.join(OUT, rel), path.join(REPORT, 'nouveau', rel));
    }
    const etat = { date: new Date().toISOString(), items };
    await writeFile(path.join(REPORT, 'etat.json'), JSON.stringify(etat, null, 2));
    await writeFile(path.join(REPORT, 'index.html'), reportHtml(etat));
    return path.join(REPORT, 'index.html');
}

function reportHtml(etat) {
    const data = JSON.stringify(etat).replace(/</g, '\\u003c');
    return `<!DOCTYPE html><html lang="fr"><meta charset="utf-8"><title>Validation des captures</title>
<style>
body{font:14px -apple-system,sans-serif;margin:0;background:#f4f5f4;color:#1c2b24}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #ddd;padding:10px 20px;z-index:5;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center}
h1{font-size:16px;margin:0} button{font:inherit;padding:6px 12px;border:1px solid #2d6a4f;background:#2d6a4f;color:#fff;border-radius:6px;cursor:pointer}
button.sec{background:#fff;color:#2d6a4f} #cmd{font:12px ui-monospace,monospace;background:#eef;padding:2px 6px;border-radius:4px}
h2{margin:26px 20px 8px;font-size:18px} .item{margin:0 20px 24px;background:#fff;border:1px solid #ddd;border-radius:10px;padding:12px}
.item.off{opacity:.45} .item h3{margin:0 0 10px;font-size:14px;display:flex;gap:8px;align-items:center}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start} .pair.one{grid-template-columns:1fr}
.pair.mobile{grid-template-columns:repeat(2,minmax(0,360px));justify-content:start} .pair.one.mobile{grid-template-columns:minmax(0,360px)}
figure{margin:0} figcaption{font-weight:600;margin-bottom:4px;font-size:12px;text-transform:uppercase;color:#666}
img{width:100%;border:1px solid #ccc;display:block;cursor:zoom-in} .fit img{max-height:560px;object-fit:contain;object-position:top;background:#eee}
small{color:#666}
</style>
<header><h1>Validation des captures</h1><span id="count"></span>
<button id="dl">Télécharger la validation</button><button class="sec" id="all">Tout cocher</button><button class="sec" id="none">Tout décocher</button>
<label><input type="checkbox" id="fit" checked> limiter la hauteur</label>
<small>Puis : <span id="cmd">node tools/screenshots.mjs --appliquer</span></small></header>
<main id="main" class="fit"></main>
<script>
const etat = ${data};
const TITRES = { ajouter: 'À ajouter (nouvelles captures)', modifier: 'À modifier (ancien / nouveau)', supprimer: 'À supprimer (plus produites par le script)' };
const url = (d, rel) => d + '/' + rel.split('/').map(encodeURIComponent).join('/');
const main = document.getElementById('main'); const boxes = [];
for (const type of ['ajouter', 'modifier', 'supprimer']) {
  const its = etat.items.filter((i) => i.type === type); if (!its.length) continue;
  const h = document.createElement('h2'); h.textContent = TITRES[type] + ' : ' + its.length; main.append(h);
  for (const it of its) {
    const name = it.rel.split('/').pop(); const mob = name.startsWith('Mobile');
    const fig = (cap, d) => '<figure><figcaption>' + cap + '</figcaption><a href="' + url(d, it.rel) + '" target="_blank"><img loading="lazy" src="' + url(d, it.rel) + '"></a></figure>';
    const body = type === 'ajouter' ? fig('Nouveau', 'nouveau') : type === 'supprimer' ? fig('Ancien (sera supprimé)', 'ancien') : fig('Ancien', 'ancien') + fig('Nouveau', 'nouveau');
    const div = document.createElement('div'); div.className = 'item';
    div.innerHTML = '<h3><input type="checkbox" checked> <span></span></h3><div class="pair' + (type === 'modifier' ? '' : ' one') + (mob ? ' mobile' : '') + '">' + body + '</div>';
    div.querySelector('span').textContent = it.rel;
    const cb = div.querySelector('input'); cb.onchange = () => { div.classList.toggle('off', !cb.checked); upd(); };
    boxes.push([it, cb]); main.append(div);
  }
}
function upd() { const n = boxes.filter(([, c]) => c.checked).length; document.getElementById('count').textContent = n + ' / ' + boxes.length + ' validées'; }
const setAll = (v) => { boxes.forEach(([, c]) => { c.checked = v; c.onchange(); }); };
document.getElementById('all').onclick = () => setAll(true); document.getElementById('none').onclick = () => setAll(false);
document.getElementById('fit').onchange = (e) => main.classList.toggle('fit', e.target.checked);
document.getElementById('dl').onclick = () => {
  const accepter = boxes.filter(([, c]) => c.checked).map(([i]) => i.rel);
  const a = document.createElement('a'); a.download = '${VALIDATION_FILE}';
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ date: etat.date, accepter }, null, 2)], { type: 'application/json' })); a.click();
};
upd();
</script></html>`;
}

/* Applique le dernier rapport : seules les captures validées dans la page HTML (ou --appliquer=tout). */
async function appliquer() {
    let etat;
    try { etat = JSON.parse(await readFile(path.join(REPORT, 'etat.json'), 'utf8')); }
    catch { throw new Error('Aucun rapport à appliquer : lancer d\'abord le script sans option pour en générer un.'); }
    let items = etat.items;
    const v = opt('appliquer');
    if (v !== 'tout') {
        const file = v ? path.resolve(v) : path.join(os.homedir(), 'Downloads', VALIDATION_FILE);
        const [fst, rst] = await Promise.all([stat(file).catch(() => null), stat(path.join(REPORT, 'etat.json'))]);
        if (!fst || fst.mtimeMs < rst.mtimeMs)
            throw new Error(`Aucune validation à jour (${file}). Ouvrir le rapport, cliquer « Télécharger la validation », puis relancer ; ou --appliquer=tout pour tout accepter.`);
        const accepter = new Set(JSON.parse(await readFile(file, 'utf8')).accepter);
        items = items.filter((i) => accepter.has(i.rel));
    }
    await applyItems(items, path.join(REPORT, 'nouveau'));
    await rm(REPORT, { recursive: true, force: true });
    const n = (t) => items.filter((i) => i.type === t).length;
    console.log(`Appliqué : ${n('ajouter')} ajoutée(s), ${n('modifier')} modifiée(s), ${n('supprimer')} supprimée(s) ; ${etat.items.length - items.length} refusée(s) (laissée(s) telle(s) quelle(s)).`);
}

/* ── Orchestration ────────────────────────────────────────── */

async function main() {
    if (args.some((a) => a === '--appliquer' || a.startsWith('--appliquer='))) return appliquer();
    const devices = await chooseDevices();
    OUT = await mkdtemp(path.join(os.tmpdir(), 'captures-'));
    const needsApp = ['dashboard', 'repas', 'activite', 'assistant', 'suivi', 'profil'].some(wants);
    const token = needsApp ? await adminToken() : null;
    let userId = null;
    if (needsApp) { userId = await seedDemo(token); console.log('Compte démo et données créés.'); }

    const browser = await chromium.launch();
    try {
        for (const P of devices) {
            const opts = VIEWPORTS[P];
            console.log(`\n── ${P} ──`);
            const step = async (group, page, fn) => {
                if (!wants(group)) return;
                current = { P, folders: new Set() };
                const avant = failures.length;
                try { await fn(); if (failures.length === avant) touched.push(current); }
                catch (e) { failures.push(`${P} ${group} : ${e.message.split('\n')[0]}`); await closeModals(page).catch(() => {}); }
            };
            for (const [group, fn] of [['landing', landing], ['auth', auth]]) {
                if (!wants(group)) continue;
                const c = await browser.newContext(opts); const page = await c.newPage();
                await step(group, page, () => fn(page, P));
                await c.close();
            }
            if (needsApp) {
                const c = await browser.newContext(opts);
                const page = await c.newPage();
                if (!flag('avec-ia')) await mockEstimate(page);
                await login(page);
                await step('dashboard', page, () => dashboard(page, P));
                await step('repas', page, () => repas(page, P, flag('avec-ia')));
                await step('activite', page, () => activite(page, P, flag('avec-ia')));
                await step('suivi', page, () => suivi(page, P));
                await step('profil', page, () => profil(page, P));
                await step('assistant', page, () => assistant(page, P, token, userId));
                await c.close();
            }
        }
    } finally {
        await browser.close();
        if (userId && !flag('garder')) { await removeDemo(token); console.log('\nCompte démo supprimé.'); }
    }

    let drift = false;
    try {
        const r = await reconcile(devices);
        const { missing, outdated, extra, ok } = r;
        drift = !!(missing.length || outdated.length || extra.length);
        console.log(`\n${shots.length} captures faites. À jour : ${ok.length} ; à ajouter : ${missing.length} ; à modifier : ${outdated.length} ; à supprimer : ${extra.length}.`);
        if (!drift) { await rm(REPORT, { recursive: true, force: true }); console.log('Le dossier de captures est à jour.'); }
        else if (flag('direct')) {
            /* Sans validation : ajoute, remplace, et ne supprime que si --purger. */
            await applyItems([...missing.map((rel) => ({ type: 'ajouter', rel })), ...outdated.map((rel) => ({ type: 'modifier', rel })),
                ...(flag('purger') ? extra.map((rel) => ({ type: 'supprimer', rel })) : [])], OUT);
            console.log('Dossier synchronisé (--direct).');
        } else {
            const file = await writeReport(r);
            console.log(`\nRapport de validation : ${file}\nL'ouvrir, cocher ce qui est accepté, « Télécharger la validation », puis : node tools/screenshots.mjs --appliquer`);
        }
    } finally { await rm(OUT, { recursive: true, force: true }); }

    if (failures.length) { console.log('\nÉchecs :\n  ' + failures.join('\n  ')); process.exitCode = 1; }
    else if (drift && !flag('direct')) process.exitCode = 1; // utilisable en CI : 1 = des captures sont à mettre à jour
}

main().catch((e) => { console.error(e.message); process.exit(1); });

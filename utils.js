function calculateAge(birthDateString) {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function calculateMifflinStJeor(gender, weight, height, age) {
    if (gender === 'male' || gender === 'Homme') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

function calculateIdealWeight(height, gender) {
    if (!height) return 0;
    // Utilisation d'un IMC de 22 comme cible "idéale" simplifiée
    const heightM = height / 100;
    return Math.round((22 * heightM * heightM) * 10) / 10;
}

function formatISOLocal(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateFR(dateStr) {
    if (!dateStr) return new Date(0);
    dateStr = dateStr.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    
    // Test format ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00");
    }

    const p = dateStr.split(/[\/\-\.]/);
    if (p.length === 3) {
        if (p[2].length === 4) { // FR: DD/MM/YYYY
            return new Date(p[2], parseInt(p[1], 10)-1, p[0]);
        } else if (p[0].length === 4) { // ISO: YYYY/MM/DD
            return new Date(p[0], parseInt(p[1], 10)-1, p[2]);
        }
    }
    return new Date(dateStr);
}

function sortDatesFR(dates) {
    return [...dates].sort((a, b) => parseDateFR(a) - parseDateFR(b));
}

function formatDateFR(date, short = false) {
    if (!date) return "";
    const d = (date instanceof Date) ? date : new Date(date);
    if (short) {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR');
}

/* Cheat meals : repas impossibles à compter (buffet, soirée, mariage…). Forfaits fixes en kcal et protéines,
   identiques en protéines avec ou sans alcool. */
const CHEAT_MEALS = {
    cheat: { label: 'Cheat meal', cals: 1000, prot: 30 },
    cheat_alcool: { label: 'Cheat meal + alcool', cals: 1500, prot: 30 }
};

/* Cible de protéines (g par kg de poids) selon l'objectif. Les jours enregistrés avant cette règle
   n'ont pas de ratio figé : ils gardent l'ancien 2 g/kg (LEGACY_PROTEIN_PER_KG) pour que l'historique ne bouge pas. */
const PROTEIN_PER_KG = { loss: 1.8, maintenance: 1.6, gain: 2 };
const LEGACY_PROTEIN_PER_KG = 2;
function proteinPerKg(goal) {
    return PROTEIN_PER_KG[goal] || PROTEIN_PER_KG.maintenance;
}
/* Poids pris en compte pour les protéines : plafonné au poids d'un IMC de 27 pour la taille, car la graisse
   n'augmente pas les besoins. Sans taille connue, le poids réel est gardé. */
const PROTEIN_MAX_BMI = 27;
function proteinWeight(weight, heightCm) {
    if (!(weight > 0) || !(heightCm > 0)) return weight || 0;
    const cap = PROTEIN_MAX_BMI * Math.pow(heightCm / 100, 2);
    return Math.min(weight, cap);
}
/* Niveau d'activité professionnelle (hors sport, saisi à part) : coefficient appliqué au métabolisme de base.
   Un profil sans niveau (comptes existants) reste sédentaire, soit l'ancien x 1,2. */
const ACTIVITY_LEVELS = {
    sedentary:   { factor: 1.2,  label: 'Sédentaire',        hint: 'bureau, télétravail, chauffeur, étudiant' },
    light:       { factor: 1.3,  label: 'Peu actif',         hint: 'enseignant, vendeur, commercial' },
    active:      { factor: 1.45, label: 'Actif',             hint: 'infirmier, serveur, coiffeur, aide à domicile' },
    very_active: { factor: 1.6,  label: 'Très actif',        hint: 'maçon, ouvrier, agriculteur, déménageur' },
    intense:     { factor: 1.75, label: 'Physique intense',  hint: 'chantier lourd, forestier' }
};
function activityFactor(level) {
    return (ACTIVITY_LEVELS[level] || ACTIVITY_LEVELS.sedentary).factor;
}
function fmtPerKg(ratio) {
    return String(ratio).replace('.', ',');
}

/* Régularité sur les 7 derniers jours complets (hier et les 6 précédents, aujourd'hui exclu car en cours).
   Un jour compte s'il a des calories saisies. « Dans l'objectif » : kcal entre 90 et 105 % de la cible du jour
   et protéines à 90 % au moins de la cible. proteinTarget est la cible à 2 g/kg : elle est ramenée au ratio
   figé de chaque jour (log.proteinPerKg, 2 g/kg si absent). 7 700 kcal ≈ 1 kg de masse grasse (approximation). */
function computeWeekBalance(history, todayStr, proteinTarget, fallbackTdee) {
    const res = { daysLogged: 0, daysOk: 0, surplus: 0, kg: 0, maxGap: null, cheats: 0, cheatsAlcool: 0, days: [] };
    const [y, m, d] = todayStr.split('-').map(Number);
    for (let i = 1; i <= 7; i++) {
        const date = formatISOLocal(new Date(y, m - 1, d - i));
        const log = history && history[date];
        res.days.unshift({ date, state: 'none' }); // du plus ancien au plus récent
        if (!log || !log.consumedCals) continue;
        const target = (log.baseTDEE || fallbackTdee || 0) * (log.goalMultiplier || 1) + (log.bonusTDEE || 0);
        if (!target) continue;
        const cals = log.consumedCals, gap = cals - target;
        res.daysLogged++;
        res.surplus += gap;
        const kcalOk = cals >= target * 0.9 && cals <= target * 1.05;
        const dayProtTarget = proteinTarget * ((log.proteinPerKg || LEGACY_PROTEIN_PER_KG) / LEGACY_PROTEIN_PER_KG);
        const protOk = !(proteinTarget > 0) || (log.consumedProtein || 0) >= dayProtTarget * 0.9;
        if (kcalOk && protOk) res.daysOk++;
        res.days[0].state = kcalOk && protOk ? 'ok' : 'off';
        if (gap > 0 && (!res.maxGap || gap > res.maxGap.kcal)) res.maxGap = { date, kcal: Math.round(gap) };
    }
    // Les cheat meals sont des événements ponctuels : comptés sur 7 jours, aujourd'hui inclus
    for (let i = 0; i <= 6; i++) {
        const log = history && history[formatISOLocal(new Date(y, m - 1, d - i))];
        ((log && log.entries) || []).forEach(e => {
            if (e.cheat === 'cheat') res.cheats++;
            else if (e.cheat === 'cheat_alcool') res.cheatsAlcool++;
        });
    }
    res.surplus = Math.round(res.surplus);
    res.kg = Math.round((res.surplus / 7700) * 100) / 100;
    return res;
}

// Export pour l'environnement de test Node/Vitest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAge,
        calculateMifflinStJeor,
        calculateIdealWeight,
        formatISOLocal,
        parseDateFR,
        sortDatesFR,
        formatDateFR,
        computeWeekBalance,
        proteinPerKg,
        proteinWeight,
        PROTEIN_MAX_BMI,
        ACTIVITY_LEVELS,
        activityFactor,
        fmtPerKg,
        PROTEIN_PER_KG,
        LEGACY_PROTEIN_PER_KG,
        CHEAT_MEALS
    };
}

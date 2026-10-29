import { describe, it, expect } from 'vitest';
import { 
    calculateAge, 
    calculateMifflinStJeor, 
    calculateIdealWeight,
    formatISOLocal,
    parseDateFR,
    sortDatesFR,
    formatDateFR,
    computeWeekBalance,
    proteinPerKg,
    ACTIVITY_LEVELS,
    activityFactor,
    fmtPerKg,
    LEGACY_PROTEIN_PER_KG,
    CHEAT_MEALS
} from './utils.js';

describe('Utils Functions', () => {

    describe('calculateAge', () => {
        it('should return 0 if no birthDateString is provided', () => {
            expect(calculateAge()).toBe(0);
        });

        it('should correctly calculate age based on past date', () => {
            const today = new Date();
            const pastYear = today.getFullYear() - 30;
            const pastDate = new Date(pastYear, today.getMonth(), today.getDate() - 1);
            expect(calculateAge(pastDate.toISOString())).toBe(30);
            
            const futureMonth = new Date(pastYear, today.getMonth() + 1, today.getDate());
            expect(calculateAge(futureMonth.toISOString())).toBe(29);
        });
    });

    describe('calculateMifflinStJeor', () => {
        it('should correctly calculate for a male', () => {
            // Male, 80kg, 180cm, 30yo
            // (10 * 80) + (6.25 * 180) - (5 * 30) + 5 = 800 + 1125 - 150 + 5 = 1780
            expect(calculateMifflinStJeor('male', 80, 180, 30)).toBe(1780);
            expect(calculateMifflinStJeor('Homme', 80, 180, 30)).toBe(1780);
        });

        it('should correctly calculate for a female', () => {
            // Female, 65kg, 165cm, 25yo
            // (10 * 65) + (6.25 * 165) - (5 * 25) - 161 = 650 + 1031.25 - 125 - 161 = 1395.25
            expect(calculateMifflinStJeor('female', 65, 165, 25)).toBe(1395.25);
        });
    });

    describe('calculateIdealWeight', () => {
        it('should return 0 if no height is provided', () => {
            expect(calculateIdealWeight(0)).toBe(0);
        });

        it('should calculate ideal weight based on BMI 22', () => {
            // 180cm -> 1.8m. 22 * 1.8^2 = 71.28 ~ 71.3
            expect(calculateIdealWeight(180)).toBe(71.3);
            
            // 165cm -> 1.65m. 22 * 1.65^2 = 59.895 ~ 59.9
            expect(calculateIdealWeight(165)).toBe(59.9);
        });
    });

    describe('formatISOLocal', () => {
        it('should format date to YYYY-MM-DD local format', () => {
            const date = new Date(2023, 0, 15); // Jan 15 2023
            expect(formatISOLocal(date)).toBe('2023-01-15');
            
            const date2 = new Date(2024, 11, 5); // Dec 5 2024
            expect(formatISOLocal(date2)).toBe('2024-12-05');
        });
    });

    describe('parseDateFR', () => {
        it('should return epoch if no date string provided', () => {
            expect(parseDateFR('').getTime()).toBe(new Date(0).getTime());
        });

        it('should parse ISO date YYYY-MM-DD', () => {
            const parsed = parseDateFR('2023-05-12');
            expect(parsed.getFullYear()).toBe(2023);
            expect(parsed.getMonth()).toBe(4); // May is 4
            expect(parsed.getDate()).toBe(12);
        });

        it('should parse FR date DD/MM/YYYY', () => {
            const parsed = parseDateFR('12/05/2023');
            expect(parsed.getFullYear()).toBe(2023);
            expect(parsed.getMonth()).toBe(4);
            expect(parsed.getDate()).toBe(12);
        });
        
        it('should parse ISO with slashes YYYY/MM/DD', () => {
            const parsed = parseDateFR('2023/05/12');
            expect(parsed.getFullYear()).toBe(2023);
            expect(parsed.getMonth()).toBe(4);
            expect(parsed.getDate()).toBe(12);
        });
    });

    describe('sortDatesFR', () => {
        it('should sort mixed format dates in chronological order', () => {
            const dates = ['15/05/2023', '2023-05-10', '01/01/2024'];
            const sorted = sortDatesFR(dates);
            expect(sorted).toEqual(['2023-05-10', '15/05/2023', '01/01/2024']);
        });
    });

    describe('formatDateFR', () => {
        it('should return empty string if no date provided', () => {
            expect(formatDateFR('')).toBe('');
        });

        it('should format full date', () => {
            const date = new Date(2023, 4, 15); // May 15, 2023
            expect(formatDateFR(date)).toBe('15/05/2023');
        });

        it('should format short date', () => {
            const date = new Date(2023, 4, 15);
            expect(formatDateFR(date, true)).toBe('15/05');
        });
    });


    describe('computeWeekBalance', () => {
        const day = (cals, prot, extra = {}) => ({ consumedCals: cals, consumedProtein: prot, baseTDEE: 2000, goalMultiplier: 1, bonusTDEE: 0, ...extra });

        it('renvoie un bilan vide sans historique', () => {
            expect(computeWeekBalance({}, '2026-10-25', 130, 2000))
                .toMatchObject({ daysLogged: 0, daysOk: 0, surplus: 0, kg: 0, maxGap: null, cheats: 0, cheatsAlcool: 0 });
        });

        it('détaille les 7 derniers jours, du plus ancien au plus récent', () => {
            const h = { '2026-10-24': day(2000, 130), '2026-10-23': day(3000, 130) };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.days).toHaveLength(7);
            expect(r.days[0]).toEqual({ date: '2026-10-18', state: 'none' });
            expect(r.days[5]).toEqual({ date: '2026-10-23', state: 'off' });
            expect(r.days[6]).toEqual({ date: '2026-10-24', state: 'ok' });
        });

        it('exclut aujourd\'hui et les jours au-delà de 7 jours', () => {
            const h = { '2026-10-25': day(3000, 130), '2026-10-17': day(3000, 130), '2026-10-24': day(2000, 130), '2026-10-18': day(2000, 130) };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.surplus).toBe(0);
        });

        it('valide un jour entre 90 et 105 % des kcal avec 90 % des protéines', () => {
            const h = { '2026-10-24': day(1800, 117), '2026-10-23': day(2100, 130), '2026-10-22': day(1799, 130), '2026-10-21': day(2101, 130), '2026-10-20': day(2000, 116) };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.daysLogged).toBe(5);
            expect(r.daysOk).toBe(2);
        });

        it('cumule l\'écart, retient le plus gros excédent et estime l\'impact en kg', () => {
            const h = { '2026-10-24': day(2650, 130), '2026-10-23': day(1500, 130), '2026-10-22': day(2500, 130) };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.surplus).toBe(650);
            expect(r.maxGap).toEqual({ date: '2026-10-24', kcal: 650 });
            expect(r.kg).toBe(0.08);
        });

        it('inclut les activités dans la cible et utilise le TDEE de repli', () => {
            const h = { '2026-10-24': { consumedCals: 2300, consumedProtein: 130, bonusTDEE: 300 } };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.surplus).toBe(0);
            expect(r.daysOk).toBe(1);
        });
    
        it('compte les cheat meals de la période, avec ou sans alcool', () => {
            const h = {
                '2026-10-24': day(2900, 130, { entries: [{ type: 'Repas', cheat: 'cheat' }, { type: 'Repas', cheat: '' }] }),
                '2026-10-23': day(3400, 130, { entries: [{ type: 'Repas', cheat: 'cheat_alcool' }] }),
                '2026-10-25': day(2500, 60, { entries: [{ type: 'Repas', cheat: 'cheat' }] }),
                '2026-10-18': day(3400, 130, { entries: [{ type: 'Repas', cheat: 'cheat' }] }),
                '2026-10-19': day(3400, 130, { entries: [{ type: 'Repas', cheat: 'cheat_alcool' }] })
            };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.cheats).toBe(2);
            expect(r.cheatsAlcool).toBe(2);
        });
    });

    describe('CHEAT_MEALS', () => {
        it('définit des forfaits plus élevés avec alcool et les mêmes protéines', () => {
            expect(CHEAT_MEALS.cheat).toMatchObject({ cals: 1000, prot: 30 });
            expect(CHEAT_MEALS.cheat_alcool).toMatchObject({ cals: 1500, prot: 30 });
        });
    });
    describe('proteinPerKg', () => {
        it('donne 1,3 en sèche, 1,6 en maintien et 2 en prise de masse', () => {
            expect(proteinPerKg('loss')).toBe(1.3);
            expect(proteinPerKg('maintenance')).toBe(1.6);
            expect(proteinPerKg('gain')).toBe(2);
        });

        it('retombe sur le maintien pour un objectif inconnu ou absent', () => {
            expect(proteinPerKg(undefined)).toBe(1.6);
            expect(proteinPerKg('autre')).toBe(1.6);
        });

        it('conserve 2 g/kg comme ratio des jours antérieurs à la règle', () => {
            expect(LEGACY_PROTEIN_PER_KG).toBe(2);
        });

        it('formate le ratio avec une virgule', () => {
            expect(fmtPerKg(1.3)).toBe('1,3');
            expect(fmtPerKg(2)).toBe('2');
        });
    });

    describe('computeWeekBalance : ratio de protéines figé par jour', () => {
        const day = (prot, extra = {}) => ({ consumedCals: 2000, consumedProtein: prot, baseTDEE: 2000, goalMultiplier: 1, bonusTDEE: 0, ...extra });

        it('un jour sans ratio figé garde la cible historique à 2 g/kg', () => {
            // cible 2 g/kg = 130 g ; 100 g < 90 % de 130 (117 g)
            const r = computeWeekBalance({ '2026-10-24': day(100) }, '2026-10-25', 130, 2000);
            expect(r.days[6].state).toBe('off');
        });

        it('un jour enregistré en sèche (1,3 g/kg) est jugé sur 1,3 g/kg', () => {
            // cible 1,3 g/kg = 84,5 g ; 100 g la dépasse
            const r = computeWeekBalance({ '2026-10-24': day(100, { proteinPerKg: 1.3 }) }, '2026-10-25', 130, 2000);
            expect(r.days[6].state).toBe('ok');
        });

        it('mélange les ratios selon les jours', () => {
            const h = { '2026-10-24': day(100, { proteinPerKg: 1.3 }), '2026-10-23': day(100) };
            const r = computeWeekBalance(h, '2026-10-25', 130, 2000);
            expect(r.days[6].state).toBe('ok');
            expect(r.days[5].state).toBe('off');
        });
    });
    describe('activityFactor', () => {
        it('donne le coefficient de chacun des 5 niveaux', () => {
            expect(activityFactor('sedentary')).toBe(1.2);
            expect(activityFactor('light')).toBe(1.3);
            expect(activityFactor('active')).toBe(1.45);
            expect(activityFactor('very_active')).toBe(1.6);
            expect(activityFactor('intense')).toBe(1.75);
        });

        it('reste sédentaire (x 1,2) sans niveau ou avec un niveau inconnu : les comptes existants ne changent pas', () => {
            expect(activityFactor(undefined)).toBe(1.2);
            expect(activityFactor('')).toBe(1.2);
            expect(activityFactor('inconnu')).toBe(1.2);
        });

        it('propose 5 niveaux croissants', () => {
            const factors = Object.values(ACTIVITY_LEVELS).map(l => l.factor);
            expect(factors).toHaveLength(5);
            expect([...factors].sort((a, b) => a - b)).toEqual(factors);
        });
    });
});

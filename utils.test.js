import { describe, it, expect } from 'vitest';
import { 
    calculateAge, 
    calculateMifflinStJeor, 
    calculateIdealWeight,
    formatISOLocal,
    parseDateFR,
    sortDatesFR,
    formatDateFR
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

});

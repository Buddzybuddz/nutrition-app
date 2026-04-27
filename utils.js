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

// Export pour l'environnement de test Node/Vitest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAge,
        calculateMifflinStJeor,
        calculateIdealWeight,
        formatISOLocal,
        parseDateFR,
        sortDatesFR,
        formatDateFR
    };
}

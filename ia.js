/* ia.js — page « Assistant IA » : conversation sur le suivi de l'utilisateur.
   Le serveur construit le contexte (profil, objectifs, 14 jours de journal) et appelle l'IA ;
   cette page gère l'accord préalable, l'affichage, les suggestions et le compteur du jour. */

(function () {
    var busy = false;
    var usage = null;
    var today = null;     /* jour courant (heure de Paris), fourni par le serveur */
    var viewDay = null;   /* jour affiché ; null = aujourd'hui */
    var days = [];        /* conversations passées : { day, count, first } */

    function $(id) { return document.getElementById(id); }

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* Mise en forme minimale et sûre : échappement d'abord, puis **gras** et listes « - » */
    function rich(text) {
        var html = '', inList = false;
        esc(text).split(/\r?\n/).forEach(function (line) {
            var li = line.match(/^\s*[-•*]\s+(.*)$/);
            var inline = function (t) { return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); };
            if (li) {
                if (!inList) { html += '<ul>'; inList = true; }
                html += '<li>' + inline(li[1]) + '</li>';
            } else {
                if (inList) { html += '</ul>'; inList = false; }
                if (line.trim()) html += '<p>' + inline(line) + '</p>';
            }
        });
        return html + (inList ? '</ul>' : '');
    }

    function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

    function longDate(day) {
        return new Date(day + 'T12:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    }

    /* « Aujourd'hui », « Hier » ou « Lundi 19 octobre » */
    function dayName(day) {
        if (!today || day === today) return "Aujourd'hui";
        var diff = Math.round((new Date(today + 'T00:00:00Z') - new Date(day + 'T00:00:00Z')) / 86400000);
        return diff === 1 ? 'Hier' : cap(longDate(day));
    }

    function isAuthed() { return typeof pb !== 'undefined' && pb.authStore.isValid; }

    /* ── Affichage ────────────────────────────────────────── */

    function showConsent(show) {
        $('ia-consent').hidden = !show;
        $('ia-chat').hidden = show;
    }

    function scrollDown() {
        var box = $('ia-messages');
        box.scrollTop = box.scrollHeight;
    }

    function addBubble(role, text) {
        var div = document.createElement('div');
        div.className = 'ia-msg ia-msg--' + (role === 'user' ? 'user' : role === 'error' ? 'error' : 'model');
        if (role === 'user') div.textContent = text;
        else if (role === 'error') div.textContent = text;
        else div.innerHTML = rich(text);
        $('ia-messages').appendChild(div);
        scrollDown();
        return div;
    }

    /* Conversation passée : lecture seule, saisie et suggestions masquées */
    function applyViewMode() {
        var past = !!viewDay && viewDay !== today;
        $('ia-chat').classList.toggle('is-readonly', past);
        $('ia-banner').hidden = !past;
        if (past) $('ia-banner-text').textContent = (dayName(viewDay) === 'Hier' ? "Conversation d'hier" : 'Conversation du ' + longDate(viewDay)) + ' (lecture seule)';
        var shown = past ? viewDay : today;
        $('ia-day-label').textContent = dayName(shown) + (shown === today ? ' · ' + longDate(today) : '');
        $('ia-clear').textContent = past ? 'Supprimer cette conversation' : 'Effacer la conversation';
    }

    function renderDays() {
        var ul = $('ia-history-list');
        ul.textContent = '';
        var list = days.slice();
        if (!list.some(function (d) { return d.day === today; })) list.unshift({ day: today, count: 0, first: '' });
        list.forEach(function (d) {
            var li = document.createElement('li');
            li.className = 'ia-history-item' + ((viewDay || today) === d.day ? ' is-current' : '');

            var open = document.createElement('button');
            open.type = 'button';
            open.className = 'ia-history-open';
            var title = document.createElement('strong');
            title.textContent = dayName(d.day);
            var sub = document.createElement('span');
            sub.textContent = d.count ? (d.first || 'Conversation') + ' · ' + d.count + (d.count > 1 ? ' messages' : ' message') : 'Aucun message pour le moment';
            open.appendChild(title); open.appendChild(sub);
            open.addEventListener('click', function () { $('ia-history').hidden = true; $('ia-history-btn').setAttribute('aria-expanded', 'false'); load(d.day === today ? null : d.day); });
            li.appendChild(open);

            if (d.count) {
                var del = document.createElement('button');
                del.type = 'button';
                del.className = 'ia-history-del';
                del.setAttribute('aria-label', 'Supprimer la conversation : ' + dayName(d.day));
                del.textContent = '×';
                del.addEventListener('click', function () { removeDay(d.day); });
                li.appendChild(del);
            }
            ul.appendChild(li);
        });
    }

    async function removeDay(day) {
        if (!window.confirm('Supprimer la conversation de ' + (dayName(day) === "Aujourd'hui" ? "aujourd'hui" : dayName(day) === 'Hier' ? 'hier' : 'ce ' + longDate(day)) + ' ?')) return;
        try {
            var r = await pb.send('/api/ai/chat?day=' + encodeURIComponent(day), { method: 'DELETE' });
            days = r.days || [];
            if ((viewDay || today) === day) load(null); else renderDays();
        } catch (_) {}
    }

    function setUsage(u) {
        usage = u;
        var el = $('ia-usage'), send = $('ia-send');
        var exhausted = u && u.limit !== null && u.remaining <= 0;
        el.classList.toggle('is-empty', !!exhausted);
        if (!u) el.textContent = '';
        else if (u.limit === null) el.textContent = 'Messages illimités (compte admin)';
        else if (exhausted) el.textContent = "Limite atteinte pour aujourd'hui : revenez demain pour de nouveaux messages.";
        else el.textContent = u.remaining + ' sur ' + u.limit + (u.remaining > 1 ? ' messages restants' : ' message restant') + " aujourd'hui";
        send.disabled = busy || !!exhausted;
    }

    /* Suggestions de demandes préremplies, adaptées à l'heure */
    function suggestions() {
        var h = new Date().getHours();
        var meal = h < 10 ? "Idée de petit-déjeuner pour mes protéines"
            : h < 15 ? "Idée de déjeuner pour tenir mes objectifs"
            : h < 18 ? "Idée de collation riche en protéines"
            : "Que manger ce soir pour finir mes protéines ?";
        return ["Où j'en suis aujourd'hui ?", meal, "Analyse mon dernier repas", "Fais le bilan de ma semaine",
            "Comment évolue mon poids ?", "Un conseil pour ma journée"];
    }

    function renderSuggestions() {
        var box = $('ia-suggestions');
        box.textContent = '';
        suggestions().forEach(function (text) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'ia-chip';
            b.textContent = text;
            b.addEventListener('click', function () { send(text); });
            box.appendChild(b);
        });
    }

    function renderHistory(messages) {
        var box = $('ia-messages');
        box.textContent = '';
        if (!messages.length && viewDay) {
            addBubble('model', 'Cette conversation est vide.');
        } else if (!messages.length) {
            addBubble('model', "Bonjour ! Je peux analyser votre journée, faire le bilan de votre semaine ou vous proposer des idées de repas pour tenir vos objectifs de calories et de protéines. Que souhaitez-vous savoir ?");
        } else {
            messages.forEach(function (m) { addBubble(m.role === 'user' ? 'user' : 'model', m.content); });
        }
        scrollDown();
    }

    /* ── Échanges avec le serveur ─────────────────────────── */

    async function load(day) {
        $('ia-consent-error').textContent = '';
        try {
            var r = await pb.send('/api/ai/chat' + (day ? '?day=' + encodeURIComponent(day) : ''), { method: 'GET' });
            if (!r.consent) { showConsent(true); return; }
            showConsent(false);
            today = r.today;
            days = r.days || [];
            viewDay = day && r.day !== r.today ? r.day : null;
            applyViewMode();
            renderHistory(r.messages || []);
            renderDays();
            setUsage(r.usage);
        } catch (err) {
            showConsent(false);
            $('ia-messages').textContent = '';
            addBubble('error', "Impossible de charger l'assistant pour le moment.");
        }
    }

    /* ── Étapes affichées pendant la réflexion ────────────────
       Chaque phrase correspond à une donnée que le serveur envoie réellement à l'assistant (buildContext) :
       la journée, les 13 jours précédents, les goûts, les pesées. Les chiffres viennent de l'état local. */

    function localToday() { return today || formatISOLocal(new Date()); }

    function recentDaysLogged() {
        var n = 0, d = new Date();
        for (var i = 1; i <= 13; i++) {
            d.setDate(d.getDate() - 1);
            var log = (state.history || {})[formatISOLocal(d)];
            if (log && log.consumedCals > 0) n++;
        }
        return n;
    }

    function thinkingSteps(question) {
        var q = String(question).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        var p = typeof state !== 'undefined' ? state.profile : null;
        var steps = ['Je lis votre question…'];
        var wantsWeek = /semaine|bilan|hier|jours|tendance|evolu/.test(q);
        var wantsMeal = /manger|repas|recette|idee|soir|midi|dejeuner|diner|petit|collation|menu|cuisin/.test(q);
        var wantsWeight = /poids|pesee|kg|maigr|perdre|grossir|objectif/.test(q);

        if (p) {
            var log = (state.history || {})[localToday()] || {};
            var coef = p.goal === 'loss' ? 0.9 : (p.goal === 'gain' ? 1.1 : 1);
            var weight = getLatestWeight();
            var cals = Math.round(log.consumedCals || 0), prot = Math.round(log.consumedProtein || 0);
            var calGoal = Math.round((p.tdee || 0) * coef + (log.bonusTDEE || 0)), protGoal = Math.round(proteinWeight(weight, p.height) * proteinPerKg(p.goal));
            if (calGoal) {
                steps.push('Je regarde votre journée : ' + cals + ' kcal sur ' + calGoal + ', ' + prot + ' g de protéines sur ' + protGoal + '.');
                if (wantsMeal) {
                    var left = calGoal - cals;
                    steps.push(left > 0 ? 'Il vous reste ' + left + ' kcal et ' + Math.max(0, protGoal - prot) + ' g de protéines à répartir.' : 'Votre objectif de calories du jour est déjà atteint.');
                }
            }
            if (wantsWeight && weight) {
                var target = Number(p.targetWeight);
                steps.push('Je regarde vos pesées : ' + String(weight).replace('.', ',') + ' kg' + (target ? ', cible ' + String(target).replace('.', ',') + ' kg' : '') + '.');
            }
        }
        if (wantsMeal) steps.push('Je repense à vos repas favoris et aux aliments que vous mangez le plus.');
        if (wantsWeek || steps.length < 3) {
            var n = recentDaysLogged();
            steps.push(n ? 'Je compare avec vos 13 derniers jours (' + n + ' avec des repas saisis).' : 'Je regarde vos 13 derniers jours (aucun repas saisi pour l’instant).');
        }
        steps.push('Je prépare ma réponse…');
        return steps.length > 5 ? steps.slice(0, 4).concat(steps[steps.length - 1]) : steps;
    }

    /* Remplit la bulle d'attente (points + phrase qui change toutes les ~2 s) ; renvoie la fonction d'arrêt. */
    function startThinking(bubble, question) {
        var steps = thinkingSteps(question), i = 0;
        bubble.classList.add('ia-thinking');
        bubble.innerHTML = '<span class="ia-typing" aria-hidden="true"><span></span><span></span><span></span></span><span class="ia-step"></span>';
        var line = bubble.querySelector('.ia-step');
        function show() {
            var el = line.cloneNode(false);
            el.textContent = steps[i];
            line.replaceWith(el); /* nouvel élément : l'animation d'entrée se rejoue */
            line = el;
            scrollDown();
        }
        show();
        var timer = setInterval(function () {
            if (i < steps.length - 1) { i++; show(); } else clearInterval(timer);
        }, 2000);
        return function () { clearInterval(timer); };
    }

    async function send(text) {
        text = String(text || '').trim();
        if (!text || busy) return;
        if (usage && usage.limit !== null && usage.remaining <= 0) return;
        busy = true;
        $('ia-send').disabled = true;
        $('ia-input').value = '';
        addBubble('user', text);
        var typing = addBubble('model', '');
        var stopThinking = startThinking(typing, text);
        try {
            var r = await pb.send('/api/ai/chat', { method: 'POST', body: { message: text } });
            stopThinking();
            typing.remove();
            window.animReveal(addBubble('model', r.reply));
            busy = false;
            setUsage(r.usage);
            if (!days.some(function (d) { return d.day === today; })) { days.unshift({ day: today, count: 2, first: text.slice(0, 80) }); renderDays(); }
        } catch (err) {
            stopThinking();
            typing.remove();
            var resp = (err && err.response) || {};
            busy = false;
            if (resp.code === 'consent_required') { showConsent(true); return; }
            addBubble('error', resp.error || "L'assistant est indisponible pour le moment.");
            if (resp.usage) setUsage(resp.usage); else setUsage(usage);
        }
    }

    window.renderIA = function () {
        if (!isAuthed()) return;
        renderSuggestions();
        viewDay = null;
        $('ia-history').hidden = true;
        load(null);
    };

    function init() {
        if (!$('ia-view')) return;

        /* Rechargement de la page alors que la vue IA est déjà affichée : app.js a navigué avant que ce
           script (chargé après lui) définisse renderIA, il faut donc la lancer ici. */
        if (!$('ia-view').classList.contains('hidden')) window.renderIA();

        $('ia-consent-box').addEventListener('change', function () {
            $('ia-consent-btn').disabled = !this.checked;
        });
        $('ia-consent-btn').addEventListener('click', async function () {
            var btn = this;
            btn.disabled = true;
            try {
                await pb.send('/api/ai/chat/consent', { method: 'POST', body: { consent: true } });
                $('ia-consent-box').checked = false;
                load(null);
            } catch (err) {
                $('ia-consent-error').textContent = "Impossible d'enregistrer votre accord, réessayez.";
                btn.disabled = !$('ia-consent-box').checked;
            }
        });

        $('ia-form').addEventListener('submit', function (e) {
            e.preventDefault();
            send($('ia-input').value);
        });
        $('ia-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(this.value); }
        });

        $('ia-clear').addEventListener('click', function () { removeDay(viewDay || today); });
        $('ia-back-today').addEventListener('click', function () { load(null); });
        $('ia-history-btn').addEventListener('click', function () {
            var box = $('ia-history');
            box.hidden = !box.hidden;
            this.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
        });
        $('ia-revoke').addEventListener('click', async function () {
            if (!window.confirm("Retirer votre accord ? L'assistant ne sera plus utilisable et tout l'historique sera effacé.")) return;
            try {
                await pb.send('/api/ai/chat/consent', { method: 'POST', body: { consent: false } });
                $('ia-messages').textContent = '';
                showConsent(true);
            } catch (_) {}
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

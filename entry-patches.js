/* ============================================================
   PATCH 1 — deleteEntry / editEntry
   Fixes :
   - Coercion d'ID (number local vs string PocketBase)
   - Rafraîchissement du dashboard après remplacement async de l'ID
     par PocketBase (pb_saveActivity/.then remplace newEntry.id)
   - Suppression sans confirm() (bloqué sur iOS PWA)
============================================================ */
(function() {
    function waitForApp(cb) {
        if (typeof window.deleteEntry === 'function' && typeof window.editEntry === 'function') {
            cb();
        } else {
            setTimeout(function() { waitForApp(cb); }, 50);
        }
    }

    waitForApp(function() {
        var _origEdit = window.editEntry;

        /* deleteEntry : sans confirm(), résolution d'ID par String() */
        window.deleteEntry = function(id) {
            if (typeof getActiveLog !== 'function') return;
            var actLog = getActiveLog();
            var idx = actLog.entries.findIndex(function(e) {
                return String(e.id) === String(id);
            });
            if (idx === -1) return;
            var entry = actLog.entries[idx];
            if (entry.type === 'Repas') {
                actLog.consumedCals -= entry.cals;
                actLog.consumedProtein -= entry.prot;
            } else if (entry.type === 'Activité') {
                actLog.bonusTDEE -= entry.cals;
            }
            actLog.entries.splice(idx, 1);
            if (typeof currentUser !== 'undefined' && currentUser &&
                typeof pb_deleteEntry === 'function' &&
                typeof entry.id === 'string' && entry.id.length > 5) {
                pb_deleteEntry(entry.id, entry.type);
            }
            if (typeof saveState === 'function') saveState();
            if (typeof updateDashboard === 'function') updateDashboard();
        };

        /* editEntry : résolution d'ID par String() */
        window.editEntry = function(id) {
            if (typeof getActiveLog === 'function') {
                var actLog = getActiveLog();
                var entry = actLog.entries.find(function(e) {
                    return String(e.id) === String(id);
                });
                if (entry) { _origEdit(entry.id); return; }
            }
            _origEdit(id);
        };
    });

    /* Patch pb_saveActivity + pb_saveMeal : après sauvegarde PB,
       re-render le dashboard pour que les boutons onclick portent
       le nouvel ID PocketBase (remplacé de façon async dans app.js) */
    function patchPbSaves() {
        var ready = typeof window.pb_saveActivity === 'function'
                 && typeof window.pb_saveMeal === 'function';
        if (!ready) { setTimeout(patchPbSaves, 100); return; }

        function wrapWithRefresh(fn) {
            return function() {
                var result = fn.apply(this, arguments);
                if (result && typeof result.then === 'function') {
                    result.then(function() {
                        setTimeout(function() {
                            if (typeof updateDashboard === 'function') updateDashboard();
                        }, 100);
                    });
                }
                return result;
            };
        }

        window.pb_saveActivity = wrapWithRefresh(window.pb_saveActivity);
        window.pb_saveMeal     = wrapWithRefresh(window.pb_saveMeal);
    }
    patchPbSaves();
})();

/* ============================================================
   Navigation bottom nav — couvre TOUS les .bottom-nav-item
   app.js écoute seulement .nav-btn ; ce listener comble le manque
   en résolvant le slug via window.routes (même logique qu'app.js)
============================================================ */
(function() {
    document.addEventListener('click', function(e) {
        /* Navigation bottom nav générique */
        var bottomBtn = e.target.closest('.bottom-nav-item');
        if (bottomBtn && bottomBtn.dataset.target) {
            var targetView = bottomBtn.dataset.target;
            if (typeof window.routes === 'object' && typeof navigateTo === 'function') {
                var slug = Object.keys(window.routes).find(function(s) {
                    return window.routes[s].view === targetView;
                });
                if (slug) {
                    navigateTo(slug);
                }
            }
            return;
        }
    });
})();

/* ============================================================
   PATCH 2 — Custom select dropdown (remplace le picker natif mobile)
   Transforme les <select> dans .select-wrapper en dropdown CSS/JS
   identique visuellement sur desktop et mobile.
============================================================ */
(function() {
    function buildCustomSelect(wrapper) {
        var select = wrapper.querySelector('select');
        if (!select || wrapper.querySelector('.cs-trigger')) return;

        /* Cacher le select natif tout en gardant sa valeur accessible */
        select.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;';

        /* Bouton déclencheur */
        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cs-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        var triggerText = document.createElement('span');
        triggerText.className = 'cs-trigger-text';

        var triggerArrow = document.createElement('span');
        triggerArrow.className = 'cs-trigger-arrow';
        triggerArrow.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="#2D6A4F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        trigger.appendChild(triggerText);
        trigger.appendChild(triggerArrow);
        wrapper.appendChild(trigger);

        /* Liste dropdown */
        var dropdown = document.createElement('ul');
        dropdown.className = 'cs-dropdown';
        dropdown.setAttribute('role', 'listbox');
        wrapper.appendChild(dropdown);

        function syncLabel() {
            var opt = select.options[select.selectedIndex];
            triggerText.textContent = (opt && opt.value !== '') ? opt.text : (select.options[0] ? select.options[0].text : '');
        }

        function buildOptions() {
            dropdown.innerHTML = '';
            /* Parcourt les enfants directs du select : optgroup ou option */
            Array.from(select.children).forEach(function(child) {
                if (child.tagName === 'OPTGROUP') {
                    /* Label de groupe */
                    var groupLabel = document.createElement('li');
                    groupLabel.className = 'cs-optgroup-label';
                    groupLabel.textContent = child.label;
                    dropdown.appendChild(groupLabel);
                    /* Options du groupe */
                    Array.from(child.children).forEach(function(opt) {
                        if (opt.disabled) return;
                        dropdown.appendChild(makeOption(opt));
                    });
                } else if (child.tagName === 'OPTION') {
                    if (!child.disabled) dropdown.appendChild(makeOption(child));
                }
            });
        }

        function makeOption(opt) {
            var li = document.createElement('li');
            li.className = 'cs-option' + (opt.value === select.value ? ' cs-selected' : '');
            li.setAttribute('role', 'option');
            li.setAttribute('data-value', opt.value);
            li.textContent = opt.text;
            li.addEventListener('click', function() {
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                closeDropdown();
                syncLabel();
                buildOptions();
            });
            return li;
        }

        function openDropdown() {
            /* Ferme tous les autres dropdowns ouverts */
            document.querySelectorAll('.cs-trigger[aria-expanded="true"]').forEach(function(t) {
                if (t !== trigger) t.click();
            });
            /* Détecte si on ouvre vers le haut ou le bas */
            if (!wrapper.hasAttribute('data-force-down')) {
                var rect = wrapper.getBoundingClientRect();
                var spaceBelow = window.innerHeight - rect.bottom;
                var dropdownH = Math.min(220, dropdown.scrollHeight || 220);
                if (spaceBelow < dropdownH + 8) {
                    wrapper.classList.add('cs-dropup');
                } else {
                    wrapper.classList.remove('cs-dropup');
                }
            } else {
                wrapper.classList.remove('cs-dropup');
            }
            wrapper.classList.add('cs-open');
            trigger.setAttribute('aria-expanded', 'true');
            buildOptions();
        }

        function closeDropdown() {
            wrapper.classList.remove('cs-open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            wrapper.classList.contains('cs-open') ? closeDropdown() : openDropdown();
        });

        /* Ferme si clic hors du dropdown */
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) closeDropdown();
        });

        /* Observe les mutations du select (renderActivityOptions recharge les options) */
        var mo = new MutationObserver(function() {
            syncLabel();
            if (wrapper.classList.contains('cs-open')) buildOptions();
        });
        mo.observe(select, { childList: true, subtree: true });

        /* Sync quand le select change depuis le JS (editEntry pré-sélectionne) */
        select.addEventListener('change', syncLabel);

        syncLabel();
    }

    function initCustomSelects() {
        document.querySelectorAll('.select-wrapper').forEach(buildCustomSelect);
    }

    /* Lance après chargement DOM + scripts */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomSelects);
    } else {
        initCustomSelects();
    }

    /* Re-init quand une modale s'ouvre (au cas où les options ont changé) */
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[onclick*="openMealModal"], [onclick*="openActivityModal"]');
        if (btn) setTimeout(initCustomSelects, 50);
    });
})();

/* ============================================================
   E-07 — RGPD : Export JSON, Export CSV, Suppression de compte
============================================================ */
(function() {
    function downloadBlob(content, filename, type) {
        var blob = new Blob([content], { type: type });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    function exportJSON() {
        if (typeof state === 'undefined') { alert('Données non disponibles.'); return; }
        var data = JSON.stringify(state, null, 2);
        var now = new Date().toISOString().slice(0,10);
        downloadBlob(data, 'nutridash-export-' + now + '.json', 'application/json');
    }

    function exportCSV() {
        if (typeof state === 'undefined') { alert('Données non disponibles.'); return; }
        var rows = [['Date','Type','Nom','Calories','Protéines']];
        (state.logs || []).forEach(function(log) {
            (log.entries || []).forEach(function(entry) {
                rows.push([
                    log.date || '',
                    entry.type || '',
                    (entry.name || entry.food || '').replace(/"/g, '""'),
                    entry.cals || 0,
                    entry.prot || 0
                ]);
            });
        });
        var csv = rows.map(function(r) {
            return r.map(function(c) { return '"' + c + '"'; }).join(',');
        }).join('\r\n');
        var now = new Date().toISOString().slice(0,10);
        downloadBlob(csv, 'nutridash-export-' + now + '.csv', 'text/csv');
    }

    function openDeleteModal() {
        var modal = document.getElementById('modal-delete-account');
        var input = document.getElementById('delete-confirm-input');
        if (modal) {
            input.value = '';
            document.getElementById('btn-delete-confirm').disabled = true;
            modal.classList.remove('hidden');
        }
    }

    function closeDeleteModal() {
        var modal = document.getElementById('modal-delete-account');
        if (modal) modal.classList.add('hidden');
    }

    async function deleteAccount() {
        if (typeof pb !== 'undefined' && pb.authStore && pb.authStore.isValid) {
            /* Annuler l'abonnement Stripe AVANT de supprimer le compte —
               une fois le compte PocketBase supprimé, l'utilisateur ne
               peut plus se connecter pour l'annuler lui-même et
               continuerait à être facturé indéfiniment. */
            var token = getToken();
            if (token) {
                try {
                    var cancelRes = await fetch(getPbUrl() + '/api/stripe/cancel-subscription', {
                        method: 'POST',
                        headers: { 'Authorization': token }
                    });
                    var cancelData = await cancelRes.json();
                    if (!cancelRes.ok || cancelData.ok === false) {
                        var proceed = confirm('Nous n\'avons pas pu annuler automatiquement votre abonnement Stripe. Continuer la suppression du compte quand même ? Vous devrez alors annuler l\'abonnement vous-même depuis Stripe ou nous contacter.');
                        if (!proceed) return;
                    }
                } catch(e) {
                    var proceedErr = confirm('Nous n\'avons pas pu contacter Stripe pour annuler votre abonnement. Continuer la suppression du compte quand même ?');
                    if (!proceedErr) return;
                }
            }
        }

        /* Efface localStorage */
        var STORAGE_KEY = 'nutridash_state';
        try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
        if (typeof pb !== 'undefined' && pb.authStore && pb.authStore.isValid) {
            try {
                var userId = pb.authStore.model.id;
                /* Supprimer toutes les données utilisateur (RGPD — droit à l'effacement) */
                var collections = ['profiles', 'meals', 'favorite_meals', 'favorite_activities', 'daily_stats', 'activities_log', 'weigh_ins', 'goal_history', 'user_data'];
                for (var i = 0; i < collections.length; i++) {
                    try {
                        var items = await pb.collection(collections[i]).getFullList({ filter: 'user="' + userId + '"' });
                        for (var j = 0; j < items.length; j++) {
                            await pb.collection(collections[i]).delete(items[j].id);
                        }
                    } catch(e) { /* collection inexistante ou déjà vide */ }
                }
                /* Supprimer le compte utilisateur */
                await pb.collection('users').delete(userId);
            } catch(e) { console.warn('Erreur suppression PB:', e); }
            pb.authStore.clear();
        }
        /* Redirige vers landing */
        closeDeleteModal();
        if (typeof navigateTo === 'function') navigateTo('landingpage');
    }

    function initRGPD() {
        var btnJSON = document.getElementById('btn-export-json');
        var btnCSV = document.getElementById('btn-export-csv');
        var btnDelete = document.getElementById('btn-delete-account');
        var btnCancel = document.getElementById('btn-delete-cancel');
        var btnConfirm = document.getElementById('btn-delete-confirm');
        var confirmInput = document.getElementById('delete-confirm-input');
        var overlay = document.getElementById('modal-delete-account');

        if (btnJSON) btnJSON.addEventListener('click', exportJSON);
        if (btnCSV) btnCSV.addEventListener('click', exportCSV);
        if (btnDelete) btnDelete.addEventListener('click', openDeleteModal);
        if (btnCancel) btnCancel.addEventListener('click', closeDeleteModal);

        if (overlay) overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeDeleteModal();
        });

        if (confirmInput) confirmInput.addEventListener('input', function() {
            if (btnConfirm) btnConfirm.disabled = (confirmInput.value.trim() !== 'SUPPRIMER');
        });

        if (btnConfirm) btnConfirm.addEventListener('click', function() {
            if (confirmInput && confirmInput.value.trim() === 'SUPPRIMER') deleteAccount();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRGPD);
    } else {
        initRGPD();
    }
})();

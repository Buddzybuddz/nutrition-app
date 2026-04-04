"""
Patch script for the weight + objectives cards restructuring.
"""
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_weight_card = '''                    <!-- Carte Poids -->
                    <div class="card progress-card" id="card-suivi-weight" style="grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px dashed var(--border-color); padding-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">⚖️</span>
                            <h3 style="margin: 0; border: none; padding: 0;">Évolution du Poids</h3>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem;">
                            <!-- Top Row: Dates -->
                            <div style="display: flex; justify-content: space-around; width: 100%;">
                                <div style="text-align: center;">
                                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;" id="suivi-weight-start-date">Début période</div>
                                    <div id="suivi-weight-start-val" style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-top: 0.25rem;">--</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;" id="suivi-weight-end-date">Dernière pesée</div>
                                    <div id="suivi-weight-end-val" style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-top: 0.25rem;">--</div>
                                </div>
                            </div>
                            
                            <!-- Bottom Row: Bilan -->
                            <div style="display: flex; justify-content: center; width: 100%;">
                                <div style="text-align: center; padding: 0.75rem 2.5rem; background: #f8f9fa; border-radius: 20px; border: 2px solid var(--border-color);">
                                    <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Bilan Période</div>
                                    <div id="suivi-weight-diff" style="font-size: 1.8rem; font-weight: 800; margin-top: 0.25rem; color: var(--text-main);">--</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>'''

new_weight_and_obj_cards = '''                    <!-- Carte Poids (réduite) -->
                    <div class="card progress-card" id="card-suivi-weight">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px dashed var(--border-color); padding-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">⚖️</span>
                            <h3 style="margin: 0; border: none; padding: 0;">Poids</h3>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <div style="text-align: center; flex:1;">
                                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;" id="suivi-weight-start-date">Début</div>
                                <div id="suivi-weight-start-val" style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-top: 0.2rem;">--</div>
                            </div>
                            <div style="font-size: 1.5rem; color: var(--text-muted);">→</div>
                            <div style="text-align: center; flex:1;">
                                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;" id="suivi-weight-end-date">Fin</div>
                                <div id="suivi-weight-end-val" style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-top: 0.2rem;">--</div>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; text-align: center; padding: 0.6rem; background: #f8f9fa; border-radius: var(--radius-sm); border: 2px solid var(--border-color);">
                            <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Bilan</div>
                            <div id="suivi-weight-diff" style="font-size: 1.5rem; font-weight: 800; margin-top: 0.15rem; color: var(--text-main);">--</div>
                        </div>
                    </div>

                    <!-- Carte Objectifs -->
                    <div class="card progress-card" id="card-suivi-objectifs">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px dashed var(--border-color); padding-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">🎯</span>
                            <h3 style="margin: 0; border: none; padding: 0;">Objectifs</h3>
                        </div>
                        <div id="suivi-objectifs-inner" style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <span style="color: var(--text-muted); font-size: 0.9rem;">Chargement…</span>
                        </div>
                    </div>
                </div>'''

count = content.count(old_weight_card)
print(f'Occurrences: {count}')
if count == 1:
    new_content = content.replace(old_weight_card, new_weight_and_obj_cards, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Success!')
else:
    print('NOT FOUND - checking partial match...')
    # Try finding key fragment
    idx = content.find('grid-column: 1 / -1')
    print(f'grid-column 1/-1 at idx: {idx}')
    if idx > 0:
        print(repr(content[idx-200:idx+200]))

// [2026-01-17 20:05:00] ui_view_inv.js - Enhanced Backpack UI Visibility

Object.assign(UI, {

    // [v0.7.0] VIEW STATE
    charTab: 'status', 

    // --- INVENTAR ---
    renderInventory: function() {
        const list = document.getElementById('inventory-list');
        const countDisplay = document.getElementById('inv-count');
        const capsDisplay = document.getElementById('inv-caps');
        
        if(!list) return;
        
        list.innerHTML = '';
        if(capsDisplay) capsDisplay.textContent = Game.state.caps;
        
        const usedSlots = Game.getUsedSlots();
        const maxSlots = Game.getMaxSlots();
        
        // [UPDATE] Rucksack-Anzeige noch deutlicher
        if(countDisplay) {
            let backpackName = "";
            let backpackId = null;
            if (Game.state.equip && Game.state.equip.back) {
                const bp = Game.state.equip.back;
                backpackName = bp.props && bp.props.name ? bp.props.name : bp.name;
                backpackId = bp.id || null;
            }

            // Layout Update: Zwei Zeilen, Rucksack grün hervorgehoben.
            // Das Symbol ist das Bild des Rucksacks, nicht das Emoji - sonst
            // waere der angelegte Rucksack die einzige Stelle im Inventar
            // ohne Bild.
            countDisplay.innerHTML = `
                <div class="flex flex-col items-end leading-tight">
                    <span class="text-sm">${usedSlots} / ${maxSlots}</span>
                    ${backpackName
                        ? `<span class="flex items-center gap-1 text-[10px] text-[#39ff14] font-bold tracking-wider border-t border-green-900 mt-0.5 pt-0.5">${UI.itemSymbol(backpackId, 'back', 'klein')} ${backpackName}</span>`
                        : '<span class="text-[9px] text-gray-600 border-t border-gray-800 mt-0.5 pt-0.5">KEIN RUCKSACK</span>'}
                </div>
            `;
            
            // Pulsieren bei Überladung
            countDisplay.className = usedSlots >= maxSlots ? "text-red-500 font-bold animate-pulse" : "text-[#39ff14] font-mono";
        }
        
        // Symbol und Emoji-Rueckfall stehen zentral in ui_item_symbol.js,
        // damit dasselbe Item im Inventar, im Shop und im Lager gleich
        // aussieht. Hier bleibt nur der Aufruf.
        //
        // Die ID kommt aus dem Inventareintrag, nicht aus der Katalogdefinition:
        // Game.items ist nach Schluessel organisiert, die Definitionen selbst
        // tragen kein id-Feld. Mit itemDef.id kam hier undefined an, itemSymbol
        // fand kein Bild und zeigte das Typ-Emoji - deshalb stand im Rucksack
        // trotz 126 vorhandener Bilder nur 💉.
        const bildId = (itemDef, entry) => (entry && entry.id) || (itemDef && itemDef.id) || null;
        const itemBild = (itemDef, entry) => UI.itemSymbol(bildId(itemDef, entry), itemDef && itemDef.type, 'gross');

        // Zellhoehe. Vorher 64 px bei 32 px Symbol - das Bild war der kleinste
        // Teil der Kachel. Jetzt 96 px hoch und 48 px Symbol; das Motiv ist
        // damit fast doppelt so gross (v14.0.12).
        const ZELLE_HOEHE = 'h-24';

        const createBtn = (itemDef, entry, isEquipped, label, onClick) => {
            const btn = document.createElement('div');
            let cssClass = `relative border border-green-500 bg-green-900/30 w-full ${ZELLE_HOEHE} flex flex-col items-center justify-center transition-colors group`;

            // Kein hover:bg-green-500 mehr: seit die Item-Bilder transparent
            // sind, waeren sie auf gruenem Grund unsichtbar. Stattdessen
            // leuchtet der Rahmen und die Zelle hellt leicht auf - der
            // Pip-Boy-Effekt bleibt, das Motiv auch.
            if(onClick) cssClass += " cursor-pointer hover:border-[#39ff14] hover:bg-green-900/60 hover:shadow-[0_0_10px_rgba(57,255,20,0.5)]";
            else cssClass += " cursor-default opacity-80";
            
            if (entry && entry.isNew && !isEquipped) {
                cssClass += " new-item-glow";
            }

            btn.className = cssClass;
            
            let displayName = entry.props && entry.props.name ? entry.props.name : itemDef.name;
            let extraClass = entry.props && entry.props.color ? entry.props.color : "";

            const countDisplay = (entry.count > 1 || itemDef.type === 'ammo') ?
                `<div class="absolute top-0 right-0 bg-green-900 text-[#39ff14] text-[11px] px-1 font-mono border-l border-b border-green-700">${entry.count}</div>` : '';

            btn.innerHTML = `
                <div class="flex items-center justify-center">${itemBild(itemDef, entry)}</div>
                <div class="text-[11px] leading-tight truncate max-w-full px-1 font-bold text-green-300 ${extraClass}">${displayName}</div>
                ${countDisplay}
            `;

            if(isEquipped) {
                const overlay = document.createElement('div');
                overlay.className = "absolute inset-0 bg-black/60 border-2 border-green-500 flex items-center justify-center text-green-500 font-bold tracking-widest text-[10px] pointer-events-none";
                overlay.textContent = label || "AUSGERÜSTET";
                btn.appendChild(overlay);
                btn.style.borderColor = "#39ff14"; 
            }
            
            const markAsRead = () => {
                if(entry && entry.isNew) {
                    entry.isNew = false;
                    btn.classList.remove('new-item-glow');
                }
            };

            btn.onmouseenter = markAsRead;
            btn.onclick = (e) => {
                e.stopPropagation(); 
                markAsRead();
                if(onClick) onClick();
            };

            return btn;
        };

        const cats = {
            equip: { label: "AUSRÜSTUNG", items: [] },
            aid:   { label: "HILFSMITTEL", items: [] },
            misc:  { label: "MATERIAL", items: [] }
        };

        const equippedList = [];

        Game.state.inventory.forEach((entry, index) => {
            if(entry.count <= 0) return;
            const item = Game.items[entry.id];
            if(!item) return;

            if(entry.id === 'camp_kit' && Game.state.camp) {
                 const btn = createBtn(item, entry, true, "AUFGESTELLT", null);
                 equippedList.push(btn); 
                 return;
            }

            const onClick = () => UI.showItemConfirm(index);
            const btn = createBtn(item, entry, false, null, onClick);

            if(['weapon', 'head', 'body', 'arms', 'legs', 'feet', 'back', 'tool'].includes(item.type)) {
                cats.equip.items.push(btn);
            } else if (item.type === 'consumable') {
                cats.aid.items.push(btn);
            } else {
                cats.misc.items.push(btn);
            }
        });

        let hasItems = false;
        ['equip', 'aid', 'misc'].forEach(key => {
            if(cats[key].items.length > 0) {
                hasItems = true;
                const header = document.createElement('div');
                header.className = "col-span-full bg-green-900/40 text-green-300 text-xs font-bold px-2 py-1 mt-2 border-b border-green-700 tracking-wider flex items-center gap-2";
                header.innerHTML = cats[key].label;
                list.appendChild(header);
                cats[key].items.forEach(btn => list.appendChild(btn));
            }
        });

        const slots = ['weapon', 'head', 'body', 'arms', 'legs', 'feet', 'back'];
        slots.forEach(slot => {
            const equippedItem = Game.state.equip[slot];
            if(!equippedItem) return;

            let baseDef = Game.items[equippedItem.id];
            if(!baseDef) {
                const key = Object.keys(Game.items).find(k => Game.items[k].name === equippedItem.name);
                if(key) baseDef = Game.items[key];
            }
            if(!baseDef) baseDef = equippedItem;

            const onClick = () => UI.showEquippedDialog(slot);

            const fakeEntry = { 
                id: equippedItem.id, 
                count: 1, 
                props: equippedItem.props,
                isNew: false 
            };

            const btn = createBtn(baseDef, fakeEntry, true, "AUSGERÜSTET", onClick);
            equippedList.push(btn);
        });

        if(equippedList.length > 0) {
            const sep = document.createElement('div');
            sep.className = "col-span-full flex items-center justify-center text-[10px] text-green-900 font-bold tracking-widest my-2 opacity-80 mt-6";
            sep.innerHTML = "<span class='bg-black px-2 border-b border-green-900 w-full text-center'>--- AKTIV AUSGERÜSTET ---</span>";
            list.appendChild(sep);
            equippedList.forEach(b => list.appendChild(b));
        }

        if(!hasItems && equippedList.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center text-gray-500 italic mt-10">Leerer Rucksack...</div>';
        }
    }
});

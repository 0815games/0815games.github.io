// Pip-Boy 3003 - Item-Symbole an einer Stelle
//
// Das Inventar hatte Emoji und Bild inline, jede andere Ansicht brachte ihr
// eigenes Emoji mit. Bei 126 Items mit eigenem Bild ist das die falsche
// Richtung: ein Item soll ueberall gleich aussehen.
//
// Hier stehen zwei Bausteine, die alle Ansichten benutzen:
//   UI.itemSymbol(id, type, groesse)  -> HTML, Bild oder Emoji als Rueckfall
//   UI.itemReihe(item)                -> Innenleben der Shop- und Lagerzeilen
//
// Der Rueckfall bleibt bewusst: ein fehlendes Bild darf kein leeres Feld
// erzeugen, und wenn eine Datei fehlt, faellt das <img> per onerror aufs
// Emoji zurueck.
window.UI = window.UI || {};

window.UI.itemTypEmoji = function(type) {
    switch(type) {
        case 'weapon': return '🔫'; case 'body': return '🛡️'; case 'head': return '🪖';
        case 'legs': return '👖'; case 'feet': return '🥾'; case 'arms': return '🦾';
        case 'back': return '🎒'; case 'consumable': return '💉'; case 'junk': return '⚙️';
        case 'component': return '🔩'; case 'ammo': return '🧨'; case 'blueprint': return '📜';
        case 'tool': return '⛺'; default: return '📦';
    }
};

// Groessen, die im Spiel vorkommen. Bewusst wenige: das Symbol soll in jeder
// Liste gleich gross sein, sonst wirken die Zeilen unruhig.
//
// Die Werte sind in v14.0.12 gewachsen. Vorher: 20/24/32 px. Bei 32 px war
// von einer Linienzeichnung mit 2-3 px Strich (bei 128 px) nichts mehr zu
// erkennen - die Haelfte des Sets besteht aus genau solchen Motiven.
//
// Ab 48 px aufwaerts traegt die Zeichnung. Die Groessen sind deshalb so
// gewaehlt, dass jede Stufe ueber dieser Schwelle liegt, wo es der Platz
// zulaesst:
const ITEM_SYMBOL_KLASSEN = {
    klein: 'w-6 h-6',      // 24 px - enge Listen (Lager, Wiki-Zeilen)
    mittel: 'w-8 h-8',     // 32 px - Shop, Crafting, Charakterseite
    gross: 'w-12 h-12',    // 48 px - Inventargitter
    gross2: 'w-14 h-14',   // 56 px - Detaildialog, wo das Bild die Hauptsache ist
    voll: 'w-32 h-32'      // 128 px - Detaildialog gross (Originalgroesse)
};

window.UI.itemSymbol = function(id, type, groesse) {
    const emoji = this.itemTypEmoji(type);
    const klasse = ITEM_SYMBOL_KLASSEN[groesse] || ITEM_SYMBOL_KLASSEN.mittel;

    const pfad = (typeof Game !== 'undefined' && typeof Game.itemBildPfad === 'function')
        ? Game.itemBildPfad(id) : null;
    if(!pfad) return `<span class="${klasse} inline-flex items-center justify-center">${emoji}</span>`;

    // onerror faellt auf das Emoji zurueck: ein kaputtes Bild waere schlimmer
    // als ein Emoji. Das Emoji steht als Textknoten im Ersatz, nicht als HTML.
    return `<img src="${pfad}" alt="" class="${klasse} object-contain inline-block align-middle"
                 onerror="this.replaceWith(document.createTextNode(${JSON.stringify(emoji)}))">`;
};

// Innenleben einer Zeile in Shop, Verkauf und Lager: Symbol, Name, Anzahl.
// Der Name kommt aus den Props, wenn das Item umbenannt wurde (z.B. "Verstärkt").
window.UI.itemReihe = function(item, def, farbe, groesse) {
    const d = def || (Game.items && Game.items[item.id]) || {};
    const name = (item.props && item.props.name) ? item.props.name : (d.name || item.id);
    const typ = item.props && item.props.type ? item.props.type : d.type;
    const ton = farbe || 'text-green-300';
    const anzahl = item.count > 1 ? `<span class="text-xs opacity-60 font-normal ml-1">(${item.count}x)</span>` : '';
    return `
        <div class="flex items-center gap-2 overflow-hidden">
            ${this.itemSymbol(item.id, typ, groesse || 'mittel')}
            <span class="font-bold ${ton} truncate">${name}${anzahl}</span>
        </div>`;
};

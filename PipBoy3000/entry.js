// Einstiegspunkt des Bündels.
//
// Die Reihenfolge ist bedeutungstragend: jede Datei erweitert oder überschreibt
// die Objekte der vorherigen. Deshalb sind es hier bewusst *nur* Seiteneffekt-
// Importe und keine benannten Exporte. Der Prüfstand in build.mjs erzwingt,
// dass diese Liste mit ORDER in entries.mjs übereinstimmt.
import './src/data/data_core.js';
import './src/data/data_items.js';
import './src/data/data_recipes.js';
import './src/data/data_monsters.js';
import './src/data/data_minigames.js';
import './src/network.js';
import './src/ui/ui_core.js';
import './src/game/game_core.js';
import './src/game/game_map.js';
import './src/game/game_render.js';
import './src/game/game_world_gen.js';
import './src/game/game_inv_logic.js';
import './src/game/game_world_logic.js';
import './src/game/game_char_logic.js';
import './src/game/game_combat.js';
import './src/ui/ui_combat.js';
import './src/ui/ui_input.js';
import './src/ui/ui_view_inv.js';
import './src/ui/ui_view_world.js';
import './src/ui/ui_view_town.js';
import './src/ui/ui_view_journal.js';
import './src/ui/ui_view_camp.js';
import './src/ui/ui_render_core.js';
import './src/ui/ui_render_views.js';
import './src/ui/ui_render_minigames.js';
import './src/ui/ui_render_overlays.js';

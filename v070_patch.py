from pathlib import Path
import re

paths={
 'html':Path('rpg/index.html'),
 'version':Path('rpg/js/core/version.js'),
 'sw':Path('rpg/sw.js'),
 'log':Path('change.log'),
}
texts={k:p.read_text(encoding='utf-8') for k,p in paths.items()}

assert texts['version'].count("export const VERSION_LABEL='v0.6.12';")==1, (
 'Erwartet v0.6.12; keine Dateien geändert.'
)

# 1. Alle Asset-Cache-Parameter in index.html auf v0.7.0 setzen
texts['html'],css_count=re.subn(
 r'(\.css)\?v=[^"\']+',
 r'\g<1>?v=0.7.0',
 texts['html']
)
texts['html'],js_count=re.subn(
 r'(\.js)\?v=[^"\']+',
 r'\g<1>?v=0.7.0',
 texts['html']
)
assert css_count>=2, f'CSS-Cache-Parameter unerwartet: {css_count}'
assert js_count>=2, f'JS-Cache-Parameter unerwartet: {js_count}'

# 2. Build-Metadatum, Titel und Badges
def replace_once(key,old,new,label):
 assert texts[key].count(old)==1, f'{label}: {texts[key].count(old)} Treffer'
 texts[key]=texts[key].replace(old,new,1)

replace_once('html','data-rpg-build="0.6.12"','data-rpg-build="0.7.0"','Build-Metadatum')
replace_once('html','Chroniken der Schattengruft – v0.6.12','Chroniken der Schattengruft – v0.7.0','Titel')
texts['html'],badge_count=re.subn(
 r'(<button type="button" class="version-badge" data-version>)v0\.6\.12(</button>)',
 r'\g<1>v0.7.0\g<2>',
 texts['html']
)
assert badge_count==3, f'Versions-Badges unerwartet: {badge_count}'

# 3. Alle Modul-Cache-Parameter in version.js auf v0.7.0 setzen
texts['version'],import_count=re.subn(
 r'(\.js)\?v=[^\';]+',
 r'\g<1>?v=0.7.0',
 texts['version']
)
assert import_count>=25, f'Modul-Importe unerwartet: {import_count}'
replace_once('version',"export const VERSION_LABEL='v0.6.12';","export const VERSION_LABEL='v0.7.0';",'Versionslabel')

# 4. Service-Worker-Cache
replace_once('sw',"const CACHE='schattengruft-v0.6.12';","const CACHE='schattengruft-v0.7.0';",'SW-Cache')

# 5. Changelog
heading='## 2026-10-26 – v0.7.0 – Einheitliche Versions- und Cache-Basis'
assert heading not in texts['log']
texts['log']=texts['log'].rstrip()+f"""

{heading}
- Versionsprung auf v0.7.0 als saubere Basis nach den v0.6.x-Bereinigungen.
- VERSION_LABEL, HTML-Titel, alle Versions-Badges und data-rpg-build auf v0.7.0 gesetzt.
- Alle CSS- und JS-Cache-Parameter in index.html auf v0.7.0 vereinheitlicht.
- Alle Modul-Cache-Parameter in version.js auf v0.7.0 vereinheitlicht.
- Service-Worker-Cache auf schattengruft-v0.7.0 erhöht; alte Caches werden beim Aktivieren entfernt.
- Keine Änderung an Spiellogik, Effekten, Loot, Kampfwerten oder Speicherablauf.
- Künftig wird bei jedem Patch die Versionsnummer an allen genannten Stellen gemeinsam erhöht.
- Browser-Test nach Service-Worker-Reset erforderlich.
"""

for key,path in paths.items():
 path.write_text(texts[key],encoding='utf-8')

print(f'v0.7.0 vorbereitet: {css_count} CSS- und {js_count} JS-Cache-Parameter, {import_count} Modul-Importe vereinheitlicht.')

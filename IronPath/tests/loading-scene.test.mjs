import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {germanMoreStatic} from '../localization-more-static-de.mjs';

// Reported: after skipping the intro, the game dropped the player on a bare
// bright \"Connecting…\" card while Firebase resolved. The connecting scene is
// the FIRST screen a returning player sees, so it wears the transmission look
// of the intro and its copy follows the phases the connection really has.

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../interface-redesign.css',import.meta.url),'utf8');
const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
const language=readFileSync(new URL('../language.mjs',import.meta.url),'utf8');

test('the connecting scene is a field transmission with the two real phases',()=>{
  const scene=html.slice(html.indexOf('<div id="loading"'),html.indexOf('</div>',html.indexOf('id="loadingSlow"')));
  assert.match(scene,/<div id="loading" class="transmission" role="status">/,'dark transmission panel, announced as status');
  assert.ok(scene.includes('data-i18n-text="FIELD TRANSMISSION"'),'the intro topline brand');
  assert.ok(scene.includes('class="transmission-emblem"'),'the chevron signal');
  assert.equal((scene.match(/<i><\/i>/g)||[]).length,3,'three signal chevrons');
  assert.ok(scene.includes('id="loadingTitle"')&&scene.includes('Establishing field connection…'),'phase 1: the field link');
  assert.ok(scene.includes('id="loadingStep"')&&scene.includes('The valley is waiting.'),'a hint that is not a lie');
  assert.ok(scene.includes('id="loadingSlow"')&&scene.includes('hidden'),'the slow hint starts hidden');
  // The build stamp stays inside the loading scene (see build-stamp.test).
  assert.ok(html.indexOf('class="build-stamp"',html.indexOf('id="loading"'))<html.indexOf('id="connectionView"'),'stamp after the loading copy');
  // The error view wears the same plate: a failed load changes text, not world.
  assert.match(html,/<div id="connectionView" class="transmission" hidden>/);
});

test('the old dotted loading keys are gone - the scene translates its own strings',()=>{
  assert.equal(language.includes('loading.title'),false,'no leftover key in the inline dictionary');
  assert.equal(html.includes('data-i18n="loading.'),false,'no dotted data-i18n left in the markup');
  for(const de of ['Establishing field connection…','The valley is waiting.','Preparing your soldier.','Record, gear and skills are on their way.','This is taking longer than usual. Check your connection.'])
    assert.ok(germanMoreStatic[de],`German for: ${de}`);
  assert.equal(germanMoreStatic['Establishing field connection…'],'Feldverbindung wird hergestellt…');
});

test('the scene is styled: dark plate, pulsing chevrons, motion-safe',()=>{
  assert.match(css,/\.entry:has\(#loading:not\(\[hidden\]\)\)[^{]*\{[^}]*background:#14241e/,'the paper personnel record is replaced by the iron plate');
  assert.match(css,/\.transmission\{[^}]*justify-items:center/);
  assert.match(css,/\.transmission-emblem i\{[^}]*clip-path:polygon\([^)]*50% 0/,'the signal bars are chevrons');
  assert.match(css,/transmission-pulse/,'they pulse');
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{[^}]*\.transmission-emblem i\{animation:none/,'reduced motion keeps them static');
  assert.match(css,/\.transmission button\{[^}]*background:#e4ca89/,'retry buttons in stencil gold');
});

test('account.js drives the phases and the slow hint',()=>{
  assert.match(account,/const LOADING_STEPS=\{\s*link:\{title:'Establishing field connection…',hint:'The valley is waiting\.'\},\s*soldier:\{title:'Preparing your soldier\.',hint:'Record, gear and skills are on their way\.'\},\s*\};/s,'both phases named');
  assert.match(account,/display\('loading'\);setLoadingStep\('soldier'\);loadProfile\(currentUser,version\);/,'auth resolved: the soldier phase begins');
  assert.match(account,/loadingStep='soldier';display\('loading'\);/,'a retry goes straight to the soldier phase');
  assert.match(account,/slow\.hidden=false;\},6000\);/,'the slow hint shows after six seconds');
  assert.match(account,/if\(view==='loading'\)beginLoadingScene\(\);else endLoadingScene\(\);/,'showing the scene starts it, leaving stops it');
  assert.match(account,/function endLoadingScene\(\)\{\s*if\(loadingSlowTimer\)\{clearTimeout\(loadingSlowTimer\)/s,'leaving clears the timer');
});

test('the icon set is the transmission mark: gold star over two chevrons',()=>{
  const svg=readFileSync(new URL('../assets/favicon.svg',import.meta.url),'utf8');
  assert.match(svg,/viewBox="0 0 64 64"/);
  assert.match(svg,/fill="#e4ca89"/,'stencil gold like the rank insignia');
  assert.equal((svg.match(/fill="#e4ca89"/g)||[]).length,3,'one star and two chevrons');
  assert.ok(svg.includes('#14241e'),'the dark plate of the loading scene');
  // The PNGs are real and the sizes are the ones platforms expect.
  const png=readFileSync(new URL('../assets/apple-touch-icon.png',import.meta.url));
  assert.equal(png.readUInt32BE(16),180,'apple-touch-icon is 180 wide');
  assert.equal(png.readUInt32BE(20),180,'and 180 tall');
  for(const icon of ['icon-192.png','icon-512.png','icon-master.png'])
    assert.ok(readFileSync(new URL(`../assets/${icon}`,import.meta.url)).length>1000,`${icon} exists`);
  // favicon.ico carries 16/32/48 PNG entries.
  const ico=readFileSync(new URL('../assets/favicon.ico',import.meta.url));
  assert.equal(ico.readUInt16LE(4),3,'three sizes');
  const sizes=[ico[6],ico[22],ico[38]].sort((a,b)=>a-b);
  assert.deepEqual(sizes,[16,32,48]);
  // Every icon link and the manifest are cache-busted with this wave.
  for(const ref of ['favicon.svg?v=','favicon.ico?v=','apple-touch-icon.png?v=','manifest.webmanifest?v='])
    assert.ok(html.includes(`assets/${ref}20261031-loading1`),`busted: ${ref}`);
  const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.short_name,'Iron Path');
  assert.deepEqual(manifest.icons.map(i=>i.sizes),['192x192','512x512']);
  assert.equal(manifest.theme_color,'#14241e');
});

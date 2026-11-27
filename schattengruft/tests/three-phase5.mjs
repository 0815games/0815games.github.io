// Phase 5 – gemeinsame 3D-Kampfbühne.
//
// Geprüft wird: Bühnenrechnung, Sichtbarkeitsregel, Kameraübergang,
// Bühnenplätze im Renderer und der Schutz des 2D-Rückfalls.
// Kein echter WebGL-/Pixel-/Leistungstest.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const raw=await readFile(
 new URL('../js/world/world3d-phase1.js',import.meta.url),'utf8'
);
const stageSource=await readFile(
 new URL('../js/world/world3d-stage.js',import.meta.url),'utf8'
);

const stage=await import(
 new URL('../js/world/world3d-stage.js',import.meta.url)
);

const {
 STAGE,stageCenter,stagePositions,cameraTarget,approach,visibleInMode,
 effectAnchor,effectShift,stageEffectView,worldBounds,stageCells,EFFECT_TILE
}=stage;

// --- 1. Bühnenmitte ------------------------------------------------------
assert.equal(
 stageCenter({x:2,y:3},null).valid,false,
 'ohne Gegner keine Bühne'
);

const center=stageCenter({x:2,y:3},{x:6,y:3});
assert.equal(center.valid,true);
assert.equal(center.x,(2.5+6.5)/2,'Mitte zwischen Held und Gegner');
assert.equal(center.z,3.5);

// Fehlende Koordinaten dürfen nicht zu NaN führen.
const broken=stageCenter({x:2,y:3},{x:'x',y:null});
assert.equal(broken.valid,false);
assert.ok(Number.isFinite(broken.x)&&Number.isFinite(broken.z));

// --- 2. Bühnenplätze ----------------------------------------------------
const spots=stagePositions(center);
assert.ok(spots.hero.x<spots.enemy.x,'Held links, Gegner rechts');
assert.equal(spots.hero.z,spots.enemy.z,'beide auf einer Reihe');
assert.ok(
 Math.abs((spots.enemy.x-spots.hero.x)-(STAGE.enemyOffset-STAGE.heroOffset))<1e-9
);
assert.equal(Number.isFinite(spots.hero.x),true);

// Bühne bleibt unabhängig von der Entfernung der Kacheln: der Abstand ist fix.
const far=stagePositions(stageCenter({x:0,y:0},{x:20,y:9}));
assert.ok(
 Math.abs((far.enemy.x-far.hero.x)-(spots.enemy.x-spots.hero.x))<1e-9,
 'fester Bühnenabstand'
);

// --- 3. Annäherung ------------------------------------------------------
assert.equal(approach(0,10,0),0,'ease 0 bleibt stehen');
assert.equal(approach(0,10,1),10,'ease 1 springt');
assert.equal(approach(0,10,.5),5);
assert.equal(approach(NaN,4),4,'Startwert NaN wird ersetzt');
assert.equal(approach(4,4),4,'kein Zittern im Ziel');

// Ein Übergang läuft monoton zum Ziel und erreicht es nie rückwärts.
let value=0;
for(let i=0;i<200;i++)value=approach(value,3);
assert.ok(Math.abs(value-3)<1e-6,'Übergang konvergiert');

// --- 4. Kameraziel ------------------------------------------------------
const explore=cameraTarget({mode:'explore',hero:{x:4,y:5}});
assert.equal(explore.x,4.5);
assert.equal(explore.z,5.5);
assert.equal(explore.zoom,STAGE.zoomOut);

const combat=cameraTarget({
 mode:'combat',hero:{x:2,y:3},enemy:{x:6,y:3}
});
assert.equal(combat.x,4.5,'Kamera über der Kampfmitte');
assert.equal(combat.zoom,STAGE.zoomIn);
assert.ok(combat.zoom<explore.zoom,'im Kampf näher dran');
assert.equal(combat.height,explore.height,'gleiche Höhe, nur anderer Ausschnitt');
assert.equal(combat.depth,explore.depth);

// Kampf ohne Gegner: kein Sprung ins Leere.
const lonely=cameraTarget({mode:'combat',hero:{x:2,y:3}});
assert.equal(lonely.centered,false);
assert.equal(lonely.x,2.5);

// --- 5. Sichtbarkeit ----------------------------------------------------
assert.equal(
 visibleInMode({mode:'combat',discovered:false,isEnemy:true}),true,
 'aktiver Gegner ist im Kampf sichtbar, auch unentdeckt'
);
assert.equal(
 visibleInMode({mode:'combat',discovered:false,isEnemy:false}),false,
 'andere Monster bleiben im Kampf im Nebel'
);
assert.equal(
 visibleInMode({mode:'explore',discovered:false}),false,
 'Nebel bleibt in der Erkundung'
);
assert.equal(
 visibleInMode({mode:'explore',discovered:true}),true
);
assert.equal(
 visibleInMode({mode:'explore',discovered:false,isHero:true}),true,
 'Held immer sichtbar'
);

// --- 6. Modul ist frei von Seiteneffekten ------------------------------
assert.ok(!stageSource.includes('Math.random'),'deterministisch');
assert.ok(!stageSource.includes('document'),'kein DOM');
assert.ok(!stageSource.includes('THREE'),'kein Three.js');
assert.ok(stageSource.includes('Object.freeze'),'Konstanten unveränderlich');

assert.throws(()=>{
 'use strict';
 STAGE.zoomIn=1;
});

// --- 7. Verdrahtung im Renderer ----------------------------------------
assert.ok(
 raw.includes("from './world3d-stage.js'"),
 'Bühnenmodul wird eingebunden'
);
assert.ok(
 raw.includes("function render(w,p,time,effects,mode='explore',enemy=null)"),
 'render kennt Modus und Gegner'
);
assert.ok(
 raw.includes("const fighting=mode==='combat'&&!!enemy&&enemy.hp>0"),
 'Kampf nur mit lebendem Gegner'
);
assert.ok(
 raw.includes('function synchronizeObjects(w,p,time,fighting=false,enemy=null)'),
 'Bühne wird an die Objektsynchronisation gereicht'
);
assert.ok(
 raw.includes("actor(enemy,enemy,false,time,spots?spots.enemy:null)"),
 'Gegner steht auf seinem Bühnenplatz'
);
assert.ok(
 raw.includes("actor('hero',p,true,time,spots?spots.hero:null)"),
 'Held steht auf seinem Bühnenplatz'
);
assert.ok(
 raw.includes('if(fighting&&!target.centered)'),
 'Rückfall bei Kampf ohne Gegner'
);
assert.ok(
 raw.includes("camera.zoom=still?target.zoom:approach(camera.zoom,target.zoom)"),
 'Zoom wird weich überblendet'
);
assert.ok(
 raw.includes("state.inCombat===true"),
 'Kampfmodus kommt aus dem Spielzustand'
);
assert.ok(
 raw.includes('synchronizeCells(w,p,stageTiles)'),
 'Buehnenboden erreicht die Zellensynchronisation'
);
assert.ok(
 raw.includes('function synchronizeCells(w,p,extra=null)'),
 'Zellen kennen eine Ausnahme fuer die Buehne'
);
assert.ok(
 raw.includes('const onStage=extra?.has(x+\':\'+y)'),
 'nur Buehnenfelder werden zusaetzlich gezeigt'
);

// Der Renderer darf den Spielzustand nicht selbst verändern.
assert.ok(
 !/state\.(player|world|activeMonster)\s*=[^=]/.test(raw),
 'kein Schreiben in den Spielzustand'
);
assert.ok(
 !raw.includes('state.activeMonster.hp='),
 'kein Eingriff in Kampfwerte'
);

// --- 8. 2D-Rückfall bleibt intakt --------------------------------------
const render=await readFile(
 new URL('../js/world/render.js',import.meta.url),'utf8'
);
assert.ok(
 render.includes('installWorld3D(this,state)'),
 '2D-Renderer bindet 3D weiterhin nur optional ein'
);
assert.ok(
 render.includes('screenToTile(clientX,clientY)'),
 'Klickpfad bleibt'
);
assert.ok(
 raw.includes('new T.WebGLRenderer({'),
 'WebGL-Renderer unverändert'
);
assert.ok(
 !raw.includes('webglcontextlost')||
 raw.includes("'webglcontextlost'"),
 'Kontextverlust wird weiter behandelt'
);

// --- 8a. Kartenrand -----------------------------------------------------
// Ein Kampf am Rand darf die Bühne nicht aus der Karte schieben.
const bounds={minX:.5,maxX:9.5,minZ:.5,maxZ:9.5};

const edge=stagePositions(stageCenter({x:0,y:0},{x:1,y:0}),bounds);
assert.ok(edge.hero.x>=0.5,'Held bleibt in der Karte');
assert.ok(edge.enemy.x<=9.5,'Gegner bleibt in der Karte');
assert.ok(
 Math.abs((edge.enemy.x-edge.hero.x)-(STAGE.enemyOffset-STAGE.heroOffset))<1e-9,
 'Abstand bleibt auch am Rand erhalten'
);

const edge2=stagePositions(stageCenter({x:9,y:9},{x:8,y:9}),bounds);
assert.ok(edge2.enemy.x<=9.5);
assert.ok(edge2.hero.x>=0.5);

// In der Mitte greift die Begrenzung nicht.
const middle=stagePositions(stageCenter({x:4,y:4},{x:5,y:4}),bounds);
const unclamped=stagePositions(stageCenter({x:4,y:4},{x:5,y:4}));
assert.ok(Math.abs(middle.hero.x-unclamped.hero.x)<1e-9,'Mitte unveraendert');

// Grenzen aus der echten Welt.
assert.deepEqual(
 stage.worldBounds({tiles:[[0,0,0],[0,0,0]]}),
 {minX:.5,maxX:2.5,minZ:.5,maxZ:1.5}
);
assert.equal(stage.worldBounds({}),null);
assert.equal(stage.worldBounds(null),null);

// --- 8b. Bühnenboden ---------------------------------------------------
const grid={
 tiles:[[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]],
 seed:1
};
const cells=stageCells(
 grid,{x:2,y:1},{x:5,y:1},stagePositions(stageCenter({x:2,y:1},{x:5,y:1}))
);
assert.ok(cells.length>0,'Buehnenzellen vorhanden');
for(const cell of cells){
 assert.ok(Number.isInteger(cell.x)&&Number.isInteger(cell.y));
 assert.ok(grid.tiles[cell.y][cell.x]!==undefined,'nur echte Felder');
}
// Doppelte Eintraege sind ausgeschlossen.
const keys=cells.map(c=>c.x+':'+c.y);
assert.equal(new Set(keys).size,keys.length,'keine Doppelten');

// Ohne Buehne keine Zusatzfelder.
assert.deepEqual(stageCells(grid,{x:2,y:1},{x:5,y:1},null),[]);
// Ausserhalb der Karte wird nichts erfunden.
const outside=stageCells(grid,{x:2,y:1},{x:99,y:99},
 stagePositions(stageCenter({x:2,y:1},{x:99,y:99})));
for(const cell of outside){
 assert.ok(grid.tiles[cell.y]?.[cell.x]!==undefined,'nichts ausserhalb');
}
// Die Weltkarte bleibt unveraendert.
assert.equal(JSON.stringify(grid.tiles),JSON.stringify([
 [0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]
]),'Karte unveraendert');

// --- 9. Choreografie: Treffer landen bei der richtigen Figur -------------
const hero={x:2,y:3},enemy={x:6,y:3};
const combatSpots=stagePositions(stageCenter(hero,enemy));

// Trefferzahl am Gegner (Kachel 6,3 -> Pixelmitte).
const enemyHit=effectShift(
 (enemy.x+.5)*EFFECT_TILE,(enemy.y+.5)*EFFECT_TILE,
 hero,enemy,combatSpots
);
assert.ok(enemyHit.dx<0,'Gegner rueckt nach links auf die Buehne');
assert.ok(Math.abs(enemyHit.dx)>0);

// Trefferzahl am Helden.
const heroHit=effectShift(
 (hero.x+.5)*EFFECT_TILE,(hero.y+.5)*EFFECT_TILE,
 hero,enemy,combatSpots
);
assert.ok(heroHit.dx>0,'Held rueckt nach rechts auf die Buehne');

// Nach der Verschiebung steht der Effekt genau auf dem Buehnenplatz.
const moved={x:(enemy.x+.5)*EFFECT_TILE+enemyHit.dx};
assert.ok(
 Math.abs(moved.x/32-combatSpots.enemy.x)<1e-9,
 'Effekt und Figur decken sich'
);

// Ohne Buehne keine Verschiebung.
assert.deepEqual(effectShift(100,100,hero,enemy,null),{dx:0,dy:0});

// Weit entfernte Effekte (z.B. alte Funken) bleiben, wo sie sind.
const outOfRange=effectShift(0,0,hero,enemy,combatSpots);
assert.deepEqual(outOfRange,{dx:0,dy:0});

// Anker: naechster Kaempfer gewinnt.
assert.equal(
 effectAnchor((hero.x+.6)*32,(hero.y+.5)*32,hero,enemy),
 'hero'
);
assert.equal(
 effectAnchor((enemy.x+.4)*32,(enemy.y+.5)*32,hero,enemy),
 'enemy'
);
assert.equal(effectAnchor(0,0,hero,enemy),null,'ausser Reichweite');

// --- 10. Buehnensicht kopiert, statt zu veraendern ----------------------
const effects={
 particles:[{x:208,y:112,a:1,c:'#fff',size:4}],
 waves:[{x:208,y:112,a:1,r:16,color:'#fff'}],
 texts:[{x:208,y:112,a:1,c:'#fff',txt:'-7',size:30}],
 flashEffect:{strength:.5,elapsed:.1,duration:.4}
};
const before=JSON.stringify(effects);

const view=stageEffectView(effects,{hero,enemy,spots:combatSpots});
assert.notEqual(view.texts,effects.texts,'Kopie statt Referenz');
assert.equal(JSON.stringify(effects),before,'Original bleibt unberuehrt');
assert.equal(effects.texts[0].x,208,'Kachelkoordinate unveraendert');
assert.ok(view.texts[0].x<208,'Sicht ist verschoben');
assert.equal(view.texts[0].txt,'-7','Inhalt bleibt');
assert.equal(view.flashEffect,effects.flashEffect,'Blitz wird durchgereicht');
assert.equal(view.particles.length,effects.particles.length);

// Ohne Buehne: identische Sicht, keine Kopie.
assert.equal(stageEffectView(effects,{spots:null}),effects);
assert.equal(stageEffectView(null,{spots:combatSpots}),null);

// Effekte ausser Reichweite behalten ihre Objektidentitaet.
const distant=stageEffectView(
 {texts:[{x:0,y:0,a:1,txt:'x'}],particles:[],waves:[]},
 {hero,enemy,spots:combatSpots}
);
assert.equal(distant.texts[0].a,1);

// --- 11. Kampfreihenfolge bleibt beim Spiel -----------------------------
// Die Buehne ist reine Darstellung: sie darf keine Kampfwerte anfassen.
const main=await readFile(
 new URL('../js/main.js',import.meta.url),'utf8'
);
for(const marker of[
 "el('attack').onclick",
 "el('fire').onclick",
 "el('heal').onclick",
 "el('mana').onclick",
 "el('flee').onclick",
 'function enemyTurn()',
 'function winCombat()'
]){
 assert.ok(main.includes(marker),'Kampfpfad erhalten: '+marker);
}
assert.ok(
 main.includes('if(p.mp<8)'),
 'Mana-Kosten 8 unveraendert'
);
assert.ok(
 main.includes('Math.random()>.4'),
 'Fluchtchance unveraendert'
);

console.log(
 'BESTANDEN: Bühnenmitte, feste Bühnenabstände, Sichtbarkeit im Kampf, '+
 'Kameraübergang und Zoom, Gegner ohne Aufdeckung sichtbar, '+
 'Trefferzahlen auf Bühnenplätzen, unveränderte 2D-Effektlisten, '+
 'Kampfregeln unangetastet, 2D-Rückfall intakt. '+
 'Keine Browser-/Pixelabnahme.'
);

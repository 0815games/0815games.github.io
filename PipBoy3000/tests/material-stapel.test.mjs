import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {loadBundle} from './helpers/load-bundle.mjs';

function setup() {
  const {window:w, dom} = loadBundle(fileURLToPath(new URL('../app.js', import.meta.url)));
  const g = w.Game;
  g.state = {inventory:[], equip:{}, perks:{}, stats:{STR:5}, lvl:10, caps:1000, view:'crafting',
    shop:{stock:{}, merchantCaps:0}, camp:{level:1, storage:[]}, activeQuests:[], completedQuests:[]};
  w.UI.log = () => {}; w.UI.update = () => {}; w.UI.error = () => {};
  w.UI.renderCrafting = () => {}; g.saveGame = () => {}; g.updateQuestProgress = () => {};
  g.getMaxSlots = () => 30;
  return {g, w, dom};
}
const simple = data => JSON.parse(JSON.stringify(data));

test('alle Schrott- und Upgrade-Materialien stapeln, Ausrüstung bleibt einzeln', () => {
  const {g,dom} = setup();
  const materials = Object.entries(g.items).filter(([, def]) => ['component','junk','rare'].includes(def.type)).map(([id])=>id);
  assert.ok(materials.includes('acid') && materials.includes('bone') && materials.includes('legendary_part'));
  for (const id of materials) {
    g.state.inventory = [];
    assert.equal(g.getStackLimit(id), 20, id);
    g.addToInventory(id, 1); g.addToInventory(id, 1);
    assert.deepEqual(simple(g.state.inventory.map(i => [i.id,i.count])), [[id,2]], id);
  }
  for (const id of ['pipe_pistol','leather_armor','backpack_leather']) {
    g.state.inventory = []; g.addToInventory(id,1); g.addToInventory(id,1);
    assert.equal(g.state.inventory.length,2,id);
  }
  dom.window.close();
});

test('ab 20 entsteht neuer Materialstapel, ohne Verlust', () => {
  const {g,dom} = setup();
  g.addToInventory('acid', 19); g.addToInventory('acid', 4);
  assert.deepEqual(simple(g.state.inventory.map(i=>i.count)), [20,3]);
  dom.window.close();
});

test('alte einfache Stapel zusammenführen, aber Sonderdaten und Ausrüstung bewahren', () => {
  const {g,dom} = setup();
  g.state.inventory = [
    {id:'bone',count:12,isNew:false},{id:'bone',count:11,isNew:true},
    {id:'bone',count:1,uid:'besonders'},{id:'acid',count:1,props:{rarity:'custom'}},
    {id:'acid',count:2,serial:'custom'},{id:'acid',count:3},{id:'acid',count:4},
    {id:'pipe_pistol',count:1},{id:'pipe_pistol',count:1}
  ];
  assert.equal(g.ordneInventarStapel(),true);
  assert.deepEqual(simple(g.state.inventory.map(i=>[i.id,i.count])), [
    ['bone',20],['bone',3],['bone',1],['acid',1],['acid',2],['acid',7],['pipe_pistol',1],['pipe_pistol',1]]);
  assert.equal(g.state.inventory[0].isNew,true);
  assert.equal(g.state.inventory[2].uid,'besonders');
  assert.equal(g.state.inventory[3].props.rarity,'custom');
  assert.equal(g.state.inventory[4].serial,'custom');
  assert.equal(g.ordneInventarStapel(),false);
  dom.window.close();
});

test('neue einfache Materialien werden nicht mit besonderen Einträgen vermischt', () => {
  const {g,dom} = setup();
  g.state.inventory = [{id:'acid',count:1,serial:'special'}];
  g.addToInventory('acid', 1);
  assert.deepEqual(simple(g.state.inventory), [{id:'acid',count:1,serial:'special'},{id:'acid',count:1,isNew:true}]);
  g.addToInventory({id:'bone',count:1,serial:'gift'});
  assert.equal(g.state.inventory[2].serial,'gift');
  dom.window.close();
});

test('Werkbank verbraucht mehrere Stapel ohne weitere Stapel zu löschen', () => {
  const {g,dom} = setup();
  g.state.inventory = [{id:'junk_metal',count:1},{id:'junk_metal',count:1},{id:'junk_metal',count:4}];
  g.craftItem('craft_ammo');
  assert.deepEqual(simple(g.state.inventory.map(i=>[i.id,i.count])), [['junk_metal',4],['ammo',10]]);
  dom.window.close();
});

test('Lager fasst Materialien zusammen, aber nicht einfache Waffen', () => {
  const {g,dom} = setup();
  g.state.inventory = [{id:'bone',count:2},{id:'bone',count:3},{id:'pipe_pistol',count:1},{id:'pipe_pistol',count:1}];
  while(g.state.inventory.length) assert.equal(g.storeInCamp(0),true);
  assert.deepEqual(simple(g.state.camp.storage.map(i=>[i.id,i.count])), [['bone',5],['pipe_pistol',1],['pipe_pistol',1]]);
  g.takeFromCamp(0); assert.equal(g.state.inventory[0].count,5);
  dom.window.close();
});

test('Zerlegen eines Stapels verbraucht genau ein Stück und stoppt bei Platzmangel', () => {
  const {g,w,dom} = setup();
  w.Math.random = () => 0.99;
  g.state.inventory = [{id:'tin_can',count:5}];
  g.getMaxSlots = () => 1;
  g.scrapItem(0);
  assert.deepEqual(simple(g.state.inventory), [{id:'tin_can',count:5}]);
  g.getMaxSlots = () => 2;
  g.scrapItem(0);
  assert.deepEqual(simple(g.state.inventory.map(i=>[i.id,i.count])), [['tin_can',4],['junk_metal',1]]);
  dom.window.close();
});

test('Einkauf ohne ausreichend Platz zieht kein Geld und keinen Händlerbestand ab', () => {
  const {g,dom} = setup();
  g.state.inventory = [{id:'acid',count:19}];
  g.state.shop.stock.acid = 10; g.getMaxSlots = () => 1;
  g.buyItem('acid', 2);
  assert.equal(g.state.inventory[0].count,19);
  assert.equal(g.state.caps,1000);
  assert.equal(g.state.shop.stock.acid,10);
  dom.window.close();
});

test('beim Laden eines bestehenden Spielstands werden einfache Materialien zusammengelegt', () => {
  const {g,w,dom} = setup();
  const state = g.state;
  state.inventory = [{id:'bone',count:2},{id:'bone',count:3},{id:'acid',count:1},{id:'acid',count:4}];
  Object.assign(state, {worldSeed:123, sector:{x:4,y:4}, explored:{}, quests:[], knownRecipes:[], hp:50, maxHp:100, rads:0});
  g.initCache=()=>{}; g.loadSector=()=>{}; g.checkNewQuests=()=>{}; g.recalcStats=()=>{};
  w.UI.switchView=()=>Promise.resolve();
  g.init(state, null, 0);
  assert.deepEqual(simple(g.state.inventory.map(i=>[i.id,i.count])), [['bone',5],['acid',5]]);
  assert.equal(g.isDirty,true);
  dom.window.close();
});

test('Handwerksanzeige zählt Zutaten aus allen Stapeln zusammen', () => {
  const {g,w,dom} = setup();
  const view = w.document.createElement('div'); view.id='view-container'; w.document.body.appendChild(view);
  g.state.inventory = [{id:'junk_metal',count:1},{id:'junk_metal',count:1}];
  g.state.knownRecipes = ['craft_ammo'];
  // setup ersetzt renderCrafting; die echte Darstellung aus dem Bündel laden.
  const code = readFileSync(new URL('../src/ui/ui_view_town.js', import.meta.url), 'utf8');
  w.eval(code);
  w.UI.renderCrafting('create');
  assert.match(view.textContent, /Schrottmetall:\s*2\/2/);
  dom.window.close();
});

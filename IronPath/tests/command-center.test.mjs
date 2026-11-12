import {test} from 'node:test';import {strict as assert} from 'node:assert';import {readFileSync} from 'node:fs';import {createCommandCenter} from '../command-center.mjs';
function fixture(){const nodes=new Map(),events=[];function el(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,dataset:{},textContent:'',value:0,max:0,src:'',onclick:null});return nodes.get(id);}let party=false,summary=null,profile={name:'Alex',gender:'female',xp:350,storyProgress:2,armory:{scrap:25,owned:1,equipped:1}};const game={setMenuOpen:v=>events.push(['pause',v]),getRunSummary:()=>summary,chooseStory:()=>events.push(['story']),chooseEndless:async()=>{events.push(['endless']);return true;},showTutorial:()=>events.push(['tutorial'])};el('armoryOpen').onclick=()=>events.push(['armory']);el('skillOpen').onclick=()=>events.push(['skills']);const ui=createCommandCenter({document:{getElementById:el},getProfile:()=>profile,getGame:()=>game,isPartyActive:()=>party,openParty:()=>events.push(['party']),signOut:()=>events.push(['signout'])});return {ui,el,events,setParty:v=>party=v,setSummary:v=>summary=v,setProfile:v=>profile=v};}
test('profile dossier reflects progression, inventory and updates without altering the account',()=>{const f=fixture();f.ui.showMenu();assert.equal(f.el('menuName').textContent,'Alex');assert.equal(f.el('menuLevel').textContent,'LEVEL 2');assert.equal(f.el('menuXp').textContent,'50 / 450 XP');assert.equal(f.el('menuXpBar').value,50);assert.equal(f.el('menuCampaignProgress').textContent,'2 / 50 missions completed');assert.match(f.el('menuPortrait').src,/female/);assert.equal(f.el('menuResume').hidden,true);f.setProfile({name:'Bob',gender:'male',xp:0,storyProgress:23,storyCampaign:2});f.ui.render();assert.match(f.el('menuPortrait').src,/soldier-male/);assert.equal(f.el('menuCampaignProgress').textContent,'30 / 50 missions completed','a format-2 completion remaps to the last-transmission boundary');f.setProfile({name:'Cleo',gender:'female',xp:0,storyProgress:50,storyCampaign:5});f.ui.render();assert.equal(f.el('menuCampaignProgress').textContent,'Story complete · replay missions');});
test('mode navigation pauses and resumes solo, and refuses to hide an active multiplayer party',async()=>{const f=fixture();f.ui.showMenu();assert.equal(f.el('gameWorkspace').hidden,true);f.el('menuCampaign').onclick();assert.equal(f.el('commandCenter').hidden,true);assert.deepEqual(f.events.slice(-2),[['pause',false],['story']]);f.setSummary('ENDLESS');f.el('backToCommand').onclick();assert.equal(f.el('menuResume').hidden,false);assert.match(f.el('menuResumeLabel').textContent,/ENDLESS/);f.el('menuResume').onclick();assert.deepEqual(f.events.at(-1),['pause',false]);f.el('backToCommand').onclick();await f.el('menuEndless').onclick();assert.ok(f.events.some(e=>e[0]==='endless'));assert.equal(f.el('gameWorkspace').dataset.screen,'endless');f.el('backToCommand').onclick();f.el('menuMultiplayer').onclick();assert.deepEqual(f.events.at(-1),['party']);f.setParty(true);assert.equal(f.ui.showMenu(),false);assert.equal(f.el('commandCenter').hidden,true);assert.match(f.el('saveStatus').textContent,/Leave your multiplayer party/);});
test('utility actions use existing game and account controls',()=>{const f=fixture();f.ui.showMenu();for(const id of ['menuTutorial','menuArmory','menuSkills','menuLogout'])f.el(id).onclick();assert.deepEqual(f.events.slice(-4),[['tutorial'],['armory'],['skills'],['signout']]);});

test('lobby, online match and cancelled mode changes remain separate and preserve the paused run',async()=>{
 const nodes=new Map();function el(id){if(!nodes.has(id))nodes.set(id,{dataset:{},hidden:false,onclick:null,textContent:''});return nodes.get(id);}
 let online=false,party=false,solo='campaign',load=false,paused=false,opens=0,closes=0;
 const game={setMenuOpen:v=>paused=v,getRunSummary:()=>solo==='campaign'?'Mission':'ENDLESS',getSoloMode:()=>solo,isOnlineMatch:()=>online,chooseEndless:async()=>load,chooseStory(){}};
 const ui=createCommandCenter({document:{getElementById:el},getProfile:()=>null,getGame:()=>game,isPartyActive:()=>party,openParty:()=>opens++,closeParty:()=>closes++,signOut(){}});
 ui.showMenu();await el('menuEndless').onclick();assert.equal(el('commandCenter').hidden,false,'cancel returns to command center');assert.equal(paused,true);assert.equal(solo,'campaign');
 load=true;await el('menuEndless').onclick();assert.equal(el('gameWorkspace').dataset.screen,'endless');assert.equal(paused,false);
 ui.showMenu();el('menuMultiplayer').onclick();assert.equal(el('gameWorkspace').dataset.screen,'lobby');assert.equal(paused,true);assert.equal(opens,1);
 party=true;online=true;ui.showBattle();assert.equal(el('gameWorkspace').dataset.screen,'online');ui.showLobby();assert.equal(el('gameWorkspace').dataset.online,'true');el('returnOnline').onclick();assert.equal(el('gameWorkspace').dataset.screen,'online');assert.ok(closes>0);assert.equal(ui.showMenu(),false);
 online=false;ui.showLobby();assert.equal(el('gameWorkspace').dataset.online,'false');party=false;assert.equal(ui.showMenu(),true);
});

test('returning after ending a match keeps the party available and guards solo modes',async()=>{
 const f=fixture();f.ui.showBattle();f.setParty(true);assert.equal(f.ui.showMenu(),false);assert.equal(f.ui.showAfterEnd(),true);assert.equal(f.el('gameWorkspace').hidden,true);assert.equal(f.el('commandCenter').hidden,false);assert.equal(f.el('menuResume').hidden,false);await f.el('menuEndless').onclick();assert.equal(f.el('commandCenter').hidden,false);assert.match(f.el('saveStatus').textContent,/Leave your multiplayer party/);
});

// The soldier is the FIRST menu point now, extra highlighted above the game
// modes (requested: "aendern wir das in nen anderen Menue Punkt mit Soldat?
// Extra hervorgehoben ueber den Spiel Modi?").
test('the highlighted SOLDIER card sits above the game modes and owns the quick actions',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const card=html.indexOf('id="menuSoldier" class="command-soldier"');
  const actions=html.indexOf('class="command-soldier-actions"');
  const head=html.indexOf('class="command-nav-head"');
  const modes=html.indexOf('class="mode-grid"');
  assert.ok(card>0,'the SOLDAT card exists');
  assert.ok(card<actions&&actions<head&&head<modes,'card, then quick actions, then the deployment head, then the game modes');
  assert.ok(!html.includes('soldier-dossier'),'the old dossier column is gone');
  assert.ok(!html.includes('id="menuEquipment"')&&!html.includes('id="menuScrap"')&&!html.includes('id="menuPoints"'),'scrap/equipment/points live in their dialogs, not the menu');
  for(const id of ['menuPortrait','menuName','menuLevel','menuXp','menuXpBar','menuArmory','menuSkills','menuSkillBadge','menuFriends','menuFriendBadge','menuLeaderboard'])
    assert.ok(html.includes(`id="${id}"`),'kept id: '+id);
  // The dog tag is OFF the menu card (reported: "die dog Tag passt nicht auf
  // den hauptbildschirm und sieht auch sonst scheisse aus" - removed).
  assert.ok(!html.includes('menuDogTag'),'no dog tag on the main screen');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  const cardCss=css.match(/\.command-soldier\{[^}]*\}/)?.[0]||'';
  assert.match(cardCss,/border:1px solid #e0c682/,'gold frame: extra highlighted');
  assert.match(css,/\.command-home-layout\{[^}]*grid-template-columns:minmax\(0,1fr\)/,'single column - no side dossier');
  assert.match(css,/\.command-soldier-actions\{[^}]*grid-template-columns:repeat\(4/,'four quick actions');
  assert.doesNotMatch(css,/\.soldier-dossier\{|\.soldier-details\{|\.soldier-actions\{/,'the dossier column styles are gone');
  const source=readFileSync(new URL('../command-center.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/menuEquipment|menuScrap|menuPoints/,'render() no longer feeds removed nodes');
});

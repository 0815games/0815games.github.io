import {strict as assert} from 'node:assert';
import {drawCartoonBattle,drawGroundDetails} from '../core/cartoon-art.mjs';
import {getMap} from '../core/maps.mjs';
import {createPlayer} from '../core/match.mjs';
import {createMatch,PATH,PADS,getTowerRange} from '../core/simulation.mjs';
import {makeEnemy,bossForWave} from '../core/combat.mjs';
const p=createPlayer('a',{name:'Alice',gender:'female'}),q=createPlayer('b',{name:'Bob',gender:'male'});
const state=createMatch([p,q]);state.wave=1;state.hp=20;state.plating=3;state.selectedPad=0;
state.towers=[0,1,2,3].map((type,pad)=>({type,pad,level:1,ownerId:'a'}));
state.enemies=['infantry','runner','tank','plane'].map((kind,i)=>({kind,x:20+i*40,y:130,hp:10,maxHp:20}));state.shots=[{x:105,y:210,tx:50,ty:130,color:'red'}];
const before=structuredClone(state),calls=[];const ctx=new Proxy({}, {get(target,key){if(key in target)return target[key];return (...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`${String(key)} has non-finite coordinates`);calls.push([key,...args]);};},set(target,key,value){target[key]=value;return true;}});
const opts={path:PATH,pads:PADS,types:[{color:'#a'},{color:'#b'},{color:'#c'},{color:'#d'}],me:'a',getTowerRange};
const effects=['assault','engineer','logistics','medic','recon'].map(kind=>({kind,x:200,y:200,targets:[{x:60,y:130}],progress:.5}));
drawCartoonBattle(ctx,state,{...opts,effects});
assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='S'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='T'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='A'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='OVERDRIVE'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='SUPPRESSION'));
const count=calls.length;drawCartoonBattle(ctx,state,{...opts,effects,reducedMotion:true});assert.ok(calls.length-count<count,'reduced motion avoids animated effects');
assert.deepEqual(state,before,'the drawing must not mutate game state');assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='BUNKER'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='Alice'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='Bob'));
console.log('Cartoon drawing covers towers, enemies, players and bunker without changing state.');

const big=getMap('four-front'),bigState=createMatch([p,q],big.id),bigBefore=structuredClone(bigState);calls.length=0;drawCartoonBattle(ctx,bigState,{...opts,path:big.path,paths:big.paths,pads:big.pads,width:big.width,height:big.height,bunkerPosition:big.bunker});assert.ok(calls.some(([name,x,y,w,h])=>name==='fillRect'&&x===0&&y===0&&w===1440&&h===720));assert.equal(calls.filter(([name,text])=>name==='fillText'&&text==='ENEMY ENTRY').length,2);assert.ok(calls.some(([name,x,y])=>name==='translate'&&x===big.bunker.x&&y===big.bunker.y),'the bunker art is translated to the map bunker, not to a fixed offset');assert.ok(calls.some(([name,x,y])=>name==='moveTo'&&x===0&&y===580));assert.deepEqual(bigState,bigBefore);
// Prestige remains legible with reduced motion and does not mutate simulation state.
const prestige=createMatch([p]);prestige.towers=[{id:1,type:0,pad:0,level:13,branch:0,ownerId:'a'}];const prestigeBefore=structuredClone(prestige);calls.length=0;drawCartoonBattle(ctx,prestige,{...opts,reducedMotion:true});assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='★2'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='1'));assert.deepEqual(prestige,prestigeBefore);

// The hero exists before the first wave. He used to be drawn only while
// `state.wave>0`, which made the very first movement order invisible: the tap was
// accepted, the simulation walked him there, and the field showed nothing moving.
{
  const field = createMatch([p]);
  assert.equal(field.wave, 0, 'the match starts before wave one');
  calls.length = 0;
  drawCartoonBattle(ctx, field, { ...opts, soldierPoses: {} });
  assert.ok(calls.some(([name, text]) => name === 'fillText' && text === 'YOU'),
    'the soldier is on the field before the first wave, so a movement order is visible');
  // And after the wave starts he is still there, exactly once.
  field.wave = 1;
  calls.length = 0;
  drawCartoonBattle(ctx, field, { ...opts, soldierPoses: {} });
  assert.equal(calls.filter(([name, text]) => name === 'fillText' && text === 'YOU').length, 1,
    'one hero, not two, once the wave started');
  console.log('The hero is drawn before the first wave, not from wave one.');
}

// V2 ground variety (reported: "wirklich jede Karte immer andere Details"):
// the per-map scatter is derived from the map seed alone - deterministic per
// seed, different between seeds, on every theme.
{
  const record=()=>{const calls=[];const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...a)=>{calls.push([k,...a.map(v=>typeof v==='number'?Math.round(v*100)/100:v)]);};},set(t,k,v){t[k]=v;return true;}});return {calls,ctx};};
  for(const theme of ['forest','urban','arctic','marsh','scrub','road','junction']){
    const a=record(),b=record(),c=record();
    drawGroundDetails(a.ctx,theme,960,540,12345);
    drawGroundDetails(b.ctx,theme,960,540,54321);
    drawGroundDetails(c.ctx,theme,960,540,12345);
    assert.ok(a.calls.length>50,`${theme} scatters ground details (${a.calls.length})`);
    assert.notEqual(JSON.stringify(a.calls),JSON.stringify(b.calls),`${theme}: different seeds scatter different details`);
    assert.equal(JSON.stringify(a.calls),JSON.stringify(c.calls),`${theme}: the same seed is deterministic`);
  }
}
console.log('Ground variety: per-seed details are deterministic and distinct.');

// Block 5: all 12 specialist ability variant FX and all 6 class-path tower tiers draw cleanly.
{
  const classState=createMatch([p]);
  const classes=['assault','engineer','logistics','medic','recon','airDefense'];
  classState.towers=classes.map((classPath,i)=>({id:i+1,type:i%4,pad:i%PADS.length,level:3,ownerId:'a',classPath,classTier:i%2===0?1:2}));
  const variantEffects=classes.flatMap(kind=>[1,2].map(variant=>({kind,variant,x:240,y:210,hx:240,hy:210,targets:[{x:80,y:140,air:kind==='airDefense'}],progress:.45})));
  calls.length=0;
  const classBefore=structuredClone(classState);
  drawCartoonBattle(ctx,classState,{...opts,effects:variantEffects});
  assert.deepEqual(classState,classBefore,'variant FX and class-path towers do not mutate state');
  for(const label of ['SUPPRESSIVE BOMBARDMENT','PRECISION STRIKE','SUSTAINED OVERDRIVE','SURGE OVERDRIVE','+45','+20 · +6','HEAVY REPAIR','TRIAGE +12','EXTENDED SUPPRESSION','TARGETED DISRUPTION','SPOTTER BARRAGE','FLAK CURTAIN']){
    assert.ok(calls.some(([name,text])=>name==='fillText'&&text===label),`specialist variant renders ${label}`);
  }
  console.log('Block 5 specialist VFX (all 12 variants) and class-path tower markers passed.');
}

// Selection rings (re-landing of the #336 pad rings, without its hover
// preview): the empty-pad ring and the selected tower's range ring are
// thicker than the old 2.5/1.5 dashes and breathe via globalAlpha, driven
// by storyTime. Reduced motion pins both alphas to 1. Without a selection
// neither ring exists - this drawing path has no hover state at all.
{
  const events=[];
  const recordCtx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...a)=>{events.push(['call',k,...a]);};},set(t,k,v){events.push(['set',k,v]);t[k]=v;return true;}});
  const drawRing=(ringState,extra={})=>{events.length=0;drawCartoonBattle(recordCtx,ringState,{...opts,...extra});};
  const ringSets=(shape,...shapeArgs)=>{
    const at=events.findIndex(e=>e[0]==='call'&&e[1]===shape&&shapeArgs.every((v,i)=>e[2+i]===v));
    assert.ok(at>=0,`${shape} des Auswahlrings wird gezeichnet`);
    let from=at;while(from>0&&!(events[from][0]==='call'&&events[from][1]==='save'))from--;
    let to=at;while(to<events.length&&!(events[to][0]==='call'&&events[to][1]==='restore'))to++;
    const sets={};for(let i=from;i<=to;i++)if(events[i][0]==='set')sets[events[i][1]]=events[i][2];
    return sets;
  };

  // Empty pad selected: ellipse 34x24, lineWidth 3.2, alpha pulses with time.
  const empty=createMatch([p]);empty.selectedPad=1;
  drawRing(empty,{storyTime:0});
  let sets=ringSets('ellipse',PADS[1].x,PADS[1].y,34,24);
  assert.equal(sets.strokeStyle,'#d4eee0');assert.equal(sets.lineWidth,3.2);
  assert.equal(sets.globalAlpha,.85,'bei storyTime 0 steht der Puls auf dem unteren Wert');
  drawRing(empty,{storyTime:Math.PI*.15});
  const pulsed=ringSets('ellipse',PADS[1].x,PADS[1].y,34,24).globalAlpha;
  assert.ok(pulsed>.85&&pulsed<=1,`der Ring atmet mit der Zeit (${pulsed})`);
  drawRing(empty,{storyTime:Math.PI*.15,reducedMotion:true});
  assert.equal(ringSets('ellipse',PADS[1].x,PADS[1].y,34,24).globalAlpha,1,
    'bei reduzierter Bewegung bleibt der Pad-Ring ruhig');

  // Tower on the selected pad: the range ring pulses the same way.
  const manned=createMatch([p]);manned.towers=[{type:0,pad:2,level:1,ownerId:'a'}];manned.selectedPad=2;
  drawRing(manned,{storyTime:0});
  sets=ringSets('arc',PADS[2].x,PADS[2].y,getTowerRange(manned.towers[0]));
  assert.equal(sets.strokeStyle,'#c2dfd2');assert.equal(sets.lineWidth,2.2);
  assert.equal(sets.globalAlpha,.88,'bei storyTime 0 steht der Reichweiten-Puls unten');
  drawRing(manned,{storyTime:Math.PI*.21});
  assert.ok(ringSets('arc',PADS[2].x,PADS[2].y,getTowerRange(manned.towers[0])).globalAlpha>.88,
    'der Reichweiten-Ring atmet mit der Zeit');
  drawRing(manned,{storyTime:Math.PI*.21,reducedMotion:true});
  assert.equal(ringSets('arc',PADS[2].x,PADS[2].y,getTowerRange(manned.towers[0])).globalAlpha,1,
    'bei reduzierter Bewegung bleibt der Reichweiten-Ring ruhig');

  // No selection: no ring of either kind, at any time.
  const idle=createMatch([p]);idle.towers=[{type:0,pad:2,level:1,ownerId:'a'}];idle.selectedPad=null;
  drawRing(idle,{storyTime:Math.PI*.15});
  assert.ok(!events.some(e=>e[0]==='call'&&e[1]==='ellipse'&&e[4]===34&&e[5]===24),
    'ohne Auswahl kein Pad-Ring');
  assert.ok(!events.some(e=>e[0]==='call'&&e[1]==='arc'&&e[4]===getTowerRange(idle.towers[0])),
    'ohne Auswahl kein Reichweiten-Ring');
  console.log('Selection rings: thicker, pulsing with storyTime, still under reduced motion.');
}

// A real boss through the real painter (the #338 lesson, kept): the reverted
// boss work called a label function the painter did not import, and only a
// stub boss ever reached the test - with makeEnemy(bossForWave(5)) the
// painter threw and froze the field. This block uses the real catalog boss,
// at full and at reduced motion, so the boss drawing path cannot silently
// break again behind a fake.
{
  const bossState=createMatch([p]);
  const realBoss={...makeEnemy(bossForWave(5).kind,5),x:300,y:130,segment:2};
  assert.ok(realBoss.boss,'die Fixture trägt einen echten Boss aus dem Katalog');
  bossState.enemies=[realBoss];
  const bossBefore=structuredClone(bossState);
  calls.length=0;
  drawCartoonBattle(ctx,bossState,{...opts});
  assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='BOSS'),
    'der echte Boss wird gezeichnet (Fallback-Plakette oder Artwork)');
  calls.length=0;
  drawCartoonBattle(ctx,bossState,{...opts,reducedMotion:true});
  assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='BOSS'),
    'der echte Boss wird auch bei reduzierter Bewegung gezeichnet');
  assert.deepEqual(bossState,bossBefore,'der Boss verändert beim Zeichnen keinen Spielzustand');
  console.log('Real catalog boss: drawn at full and reduced motion, state untouched.');
}

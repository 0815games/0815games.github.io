import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync} from 'node:fs';
import {drawStoryTerrain,drawStoryObjective,prepareStoryArt} from '../story-map-art.mjs?asset-test';
import {drawCartoonBattle} from '../cartoon-art.mjs';
import {CAMPAIGN} from '../campaign.mjs';
import {getMap} from '../maps.mjs';
import {createMatch,getTowerRange} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';

function context(calls=[]){return new Proxy({}, {get(o,k){if(k in o)return o[k];return (...args)=>calls.push([k,...args]);},set(o,k,v){o[k]=v;return true;}});}
test('landmark sprites map to every story feature and protected objective',()=>{
 const images=[],doc={createElement(tag){assert.equal(tag,'img');const image={naturalWidth:256,naturalHeight:160};images.push(image);return image;}};
 let art=prepareStoryArt(doc);assert.equal(images.length,8);assert.equal(art.get('bridge'),null);
 for(const image of images){assert.ok(existsSync(new URL('../'+image.src,import.meta.url)),image.src);image.onload();}
 art=prepareStoryArt(doc);assert.equal(art.version,8);
 for(const mission of CAMPAIGN){const map=getMap(mission.mapId),calls=[],before=structuredClone(mission);drawStoryTerrain(context(calls),mission,map.path,map.pads,960,540,{},art);assert.ok(calls.filter(([op,img])=>op==='drawImage'&&images.includes(img)).length>=1,mission.id);assert.deepEqual(mission,before);for(const stage of mission.stages.filter(s=>s.type==='protect')){const c=[];drawStoryObjective(context(c),mission,stage,0,true,art);assert.ok(c.some(([op,img])=>op==='drawImage'&&images.includes(img)),stage.asset);}}
});
test('art readiness invalidates cached story terrain once without growing cache on every frame',()=>{
 const mission=CAMPAIGN[0],map=getMap(mission.mapId),canvases=[],images=[],main=context();
 const doc={createElement(tag){if(tag==='img'){const image={naturalWidth:256,naturalHeight:160};images.push(image);return image;}const calls=[],ctx=context(calls),canvas={getContext:()=>ctx,calls};canvases.push(canvas);return canvas;}};main.canvas={ownerDocument:doc};
 const state=createMatch([createPlayer('local',{name:'Test',gender:'female'})],map.id),before=structuredClone(state),opts={path:map.path,pads:map.pads,theme:map.theme,types:[{color:'#a'},{color:'#b'},{color:'#c'},{color:'#d'}],me:'local',getTowerRange,storyMission:mission};
 drawCartoonBattle(main,state,opts);assert.equal(canvases.length,1);
 // The story fights on painted terrain now: mission one is a scrubland field,
 // so the cached ground texture is its theme sheet, not the legacy road image.
 const ground=images.find(i=>i.src?.includes('terrain2-desert'));assert.ok(ground);ground.onload();drawCartoonBattle(main,state,opts);assert.equal(canvases.length,2);
 const landmark=images.find(i=>i.src?.includes('landmark2-wreck'));assert.ok(landmark);landmark.onload();drawCartoonBattle(main,state,opts);assert.equal(canvases.length,3,'story cache refreshes when a landmark arrives');assert.ok(canvases[2].calls.some(([op,img])=>op==='drawImage'&&img===landmark));
 drawCartoonBattle(main,state,opts);assert.equal(canvases.length,3,'stable assets reuse terrain');assert.deepEqual(state,before);
});

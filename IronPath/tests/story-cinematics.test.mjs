import {readFile} from 'node:fs/promises';
import {test} from 'node:test';import {strict as assert} from 'node:assert';import {CAMPAIGN,actOf,actEndIndex} from '../campaign.mjs';import {cinematicFrames,cinematicScene,relicHandover} from '../story-cinematics.mjs';
test('every mission has authored briefing and debrief scenes with complete readable dialogue',()=>{for(const mission of CAMPAIGN){for(const kind of ['intro','ending']){const frames=cinematicFrames(mission,kind);assert.ok(frames.length>=3,`${mission.id} ${kind}`);for(const frame of frames){assert.ok(frame.speaker);assert.ok(frame.text.length>5);assert.doesNotMatch(frame.text,/^(VOSS|ADA|IVO|SERA|NIA|ROOK):/);}}assert.equal(cinematicFrames(mission,'intro')[0].text,mission.briefing);}assert.match(cinematicFrames(CAMPAIGN.at(-1),'ending').at(-1).text,/signing off/);assert.deepEqual(cinematicFrames(null,'intro'),[]);});

const POOL=['signal','pinewood','outpost','marsh','ice','city','tower','valley'];
const MOTIFS=['dawn-road','pinewood-trail','relay-line','outpost-fire','market-ruins','marsh-hospital','ice-road','night-heath','main-relay','forest-convoy'];
const ACT2=['flood-village','hospital-row','night-count','white-passage','frozen-junction'];
test('all scenes have authored, valid locations for both briefings and debriefs',()=>{const introArts=new Set();for(const mission of CAMPAIGN){for(const kind of ['intro','ending']){const scene=cinematicScene(mission,kind);assert.ok(scene?.place);assert.ok(POOL.concat(MOTIFS,ACT2).includes(scene.art),`${mission.id} ${kind} art ${scene.art}`);assert.ok(['rain','snow','mist','embers'].includes(scene.weather));if(kind==='intro')introArts.add(scene.art);}}
 // Every Act I and Act II briefing carries its own painted motif; the acts
 // beyond keep the shared pool until their regions ship.
 assert.deepEqual([...introArts].filter(a=>MOTIFS.includes(a)).sort(),[...MOTIFS].sort());
 assert.deepEqual([...introArts].filter(a=>ACT2.includes(a)).sort(),[...ACT2].sort());
 assert.equal(cinematicScene(null,'intro'),null);assert.equal(cinematicScene(CAMPAIGN[0],'invalid'),null);});

test('each scene illustration is present and wired into the cinematic stylesheet',async()=>{const css=await readFile(new URL('../style.css',import.meta.url),'utf8');for(const art of [...POOL,...MOTIFS,...ACT2,'act1-dawn','act1-relic']){const file=await readFile(new URL(`../assets/story-${art}.jpg`,import.meta.url));assert.ok(file.length>1000,art);assert.ok(css.includes(`assets/story-${art}.jpg`),art);}});

test('the speaker portrait set is painted and wired for every planned voice',async()=>{const css=await readFile(new URL('../style.css',import.meta.url),'utf8');for(const speaker of ['voss','ada','ivo','sera','nia','rook','elias','wren']){const file=await readFile(new URL(`../assets/story-${speaker}.jpg`,import.meta.url));assert.ok(file.length>1000,speaker);assert.ok(css.includes(`data-speaker="${speaker}"`),speaker);}});

test('every shipped act finale hands over its relic as an illustrated epilogue',()=>{for(const mission of CAMPAIGN){const act=actOf(mission),finale=CAMPAIGN[actEndIndex(act)]===mission,frames=relicHandover(mission);
 if(finale&&act.relic){assert.equal(frames.length,4,mission.id);for(const frame of frames){assert.ok(frame.art,`${mission.id} frame art`);assert.ok(frame.place);assert.ok(frame.speaker);assert.ok(frame.text.length>20);}}
 else assert.deepEqual(frames,[],`${mission.id} has no handover`);
 // The pure debrief stays the authored coda: the handover is a display tail
 // appended by the game, so debrief replays keep a stable ending.
 assert.doesNotMatch(cinematicFrames(mission,'ending').at(-1).text,/relic/i,mission.id);}
 assert.deepEqual(relicHandover(null),[]);});

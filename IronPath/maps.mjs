// Curated, deterministic maps shared by the host, guest and solo simulation.
// All maps end at the same bunker and use ten stable tower pad IDs.
export const MAPS=Object.freeze({
  road:{id:'road',name:'The Last Road',theme:'road',path:[{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}],pads:[{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}]},
  forest:{id:'forest',name:'Pinewood Crossing',theme:'forest',path:[{x:0,y:130},{x:150,y:130},{x:150,y:350},{x:350,y:350},{x:350,y:160},{x:560,y:160},{x:560,y:370},{x:745,y:370},{x:745,y:400},{x:900,y:400}],pads:[{x:75,y:210},{x:225,y:220},{x:115,y:440},{x:260,y:425},{x:270,y:285},{x:430,y:240},{x:465,y:75},{x:640,y:240},{x:650,y:440},{x:810,y:320}]},
  outpost:{id:'outpost',name:'Broken Outpost',theme:'outpost',path:[{x:0,y:130},{x:300,y:130},{x:300,y:285},{x:110,y:285},{x:110,y:420},{x:470,y:420},{x:470,y:210},{x:680,y:210},{x:680,y:400},{x:900,y:400}],pads:[{x:105,y:55},{x:205,y:200},{x:375,y:185},{x:225,y:350},{x:45,y:350},{x:340,y:345},{x:410,y:300},{x:560,y:130},{x:580,y:295},{x:780,y:320}]}
});
export const DEFAULT_MAP='road';
export function isMapId(id){return typeof id==='string'&&Object.hasOwn(MAPS,id);}
export function getMap(id){return MAPS[isMapId(id)?id:DEFAULT_MAP];}

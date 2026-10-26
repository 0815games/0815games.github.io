
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'arcade/dashboard.js'),'utf8');
const fn=source.match(/^function portalOffset[^\n]+/m);
assert.ok(fn,'portalOffset vorhanden');
const context={};vm.createContext(context);vm.runInContext(fn[0]+';this.offset=portalOffset;',context);
for(let active=0;active<5;active++){
 const offsets=Array.from({length:5},(_,i)=>context.offset(i,active,5));
 assert.equal(offsets[active],0);
 assert.deepEqual([...offsets].sort((a,b)=>a-b),[-2,-1,0,1,2]);
 assert.equal(context.offset((active+1)%5,active,5),1);
 assert.equal(context.offset((active+4)%5,active,5),-1);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('data-dashboard-version="2.0.1"'));
assert.ok(!/<iframe\b/i.test(html));
assert.ok(!source.includes('createElement(\'iframe\')'));
const embedded=html.match(/<script type="application\/json" id="portal-data">([\s\S]*?)<\/script>/);
assert.ok(embedded);
const games=JSON.parse(embedded[1]);
assert.equal(games.length,5);
assert.deepEqual(games,JSON.parse(fs.readFileSync(path.join(root,'arcade/games.json'),'utf8')));
for(const game of games){assert.ok(fs.existsSync(path.join(root,game.path)));assert.ok(fs.existsSync(path.join(root,'arcade/art',game.id+'.svg')));}
for(const asset of ['theme.js','dashboard.css','dashboard.js'])assert.ok(html.includes('arcade/'+asset+'?v=2.0.1'));
console.log('Portal-Tests bestanden: zyklische Positionen, Spiele, Assets, eingebettete Daten und Version.');

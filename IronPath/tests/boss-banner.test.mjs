import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createBossBanner} from '../ui/boss-banner.mjs';

// The boss, announced in the middle of the field.
//
// The banner is a headline, not a control: it shows once per boss, holds,
// fades and leaves on its own clock. The clock is injected, so this test
// holds it. The rules under test: one boss one announcement (the caller
// offers every frame), a new boss is a new headline, the card leaves by
// itself in two steps, a reset forgets the boss, and a document without the
// banner nodes loses nothing but the decoration.

function stubDocument(ids=['bossBanner','bossBannerEyebrow','bossBannerName','bossBannerText']){
  const nodes=new Map();
  for(const id of ids){
    nodes.set(id,{id,textContent:'',hidden:id==='bossBanner',classes:new Set(),
      classList:{add(name){nodes.get(id).classes.add(name);},remove(name){nodes.get(id).classes.delete(name);}}});
  }
  return {getElementById:id=>nodes.get(id)??null,node:id=>nodes.get(id)};
}
function clock(){
  const jobs=new Map();let serial=0,now=0;
  return {
    setTimer(fn,ms){const id=++serial;jobs.set(id,{fn,at:now+ms});return id;},
    clearTimer(id){jobs.delete(id);},
    tick(ms){now+=ms;for(const [id,job] of [...jobs])if(job.at<=now){jobs.delete(id);job.fn();}},
    pending(){return jobs.size;},
  };
}
function setup(document=stubDocument()){
  const time=clock(),changes=[];
  const banner=createBossBanner(document,{holdMs:4000,fadeMs:600,
    setTimer:time.setTimer,clearTimer:time.clearTimer,onChange:change=>changes.push(change)});
  return {banner,document,time,changes};
}

test('a boss is announced once, in the middle, with his name and intel',()=>{
  const {banner,document,changes}=setup();
  assert.equal(banner.announce('5:bossIronclad',{eyebrow:'BOSS IM ANMARSCH',name:'Ironclad',text:'Armored.'}),true);
  assert.equal(document.node('bossBanner').hidden,false);
  assert.equal(document.node('bossBannerName').textContent,'Ironclad');
  assert.equal(document.node('bossBannerEyebrow').textContent,'BOSS IM ANMARSCH');
  assert.equal(document.node('bossBannerText').textContent,'Armored.');
  assert.equal(banner.showing(),true);
  assert.deepEqual(changes,[{showing:true,key:'5:bossIronclad'}]);
});

test('offering the same boss every frame is not a new headline',()=>{
  const {banner,document,time}=setup();
  banner.announce('5:bossIronclad',{name:'Ironclad'});
  time.tick(2000);
  assert.equal(banner.announce('5:bossIronclad',{name:'Ironclad'}),false,
    'dieselbe Welle, derselbe Boss: keine zweite Ankündigung');
  time.tick(2000);
  assert.equal(document.node('bossBanner').classes.has('is-leaving'),true,
    'die Haltezeit läuft ab der ersten Ankündigung, nicht ab dem letzten Angebot');
});

test('the banner fades and leaves on its own clock',()=>{
  const {banner,document,time}=setup();
  banner.announce('10:bossBomber',{name:'Dread Bomber'});
  time.tick(4000);
  assert.equal(document.node('bossBanner').classes.has('is-leaving'),true,'nach der Haltezeit blendet es aus');
  assert.equal(banner.showing(),true,'während des Ausblendens ist es noch da');
  time.tick(600);
  assert.equal(banner.showing(),false);
  assert.equal(document.node('bossBanner').hidden,true);
  assert.equal(time.pending(),0,'kein Timer bleibt zurück');
});

test('a new boss is a new headline, a reset forgets the old one',()=>{
  const {banner,time}=setup();
  banner.announce('5:bossIronclad',{name:'Ironclad'});
  assert.equal(banner.announce('10:bossBomber',{name:'Dread Bomber'}),true);
  time.tick(4000);time.tick(600);
  assert.equal(banner.showing(),false);
  assert.equal(banner.announce('10:bossBomber',{name:'Dread Bomber'}),false,
    'auch nach dem Verschwinden bleibt dieser Boss angekündigt');
  banner.reset();
  assert.equal(banner.announcedFor(),null);
  assert.equal(banner.announce('10:bossBomber',{name:'Dread Bomber'}),true,
    'ein neues Gefecht darf denselben Boss wieder ankündigen');
});

test('hide takes the banner away but keeps the announcement made',()=>{
  const {banner}=setup();
  banner.announce('5:bossIronclad',{name:'Ironclad'});
  banner.hide();
  assert.equal(banner.showing(),false);
  assert.equal(banner.announce('5:bossIronclad',{name:'Ironclad'}),false);
});

test('a document without the banner nodes loses only the decoration',()=>{
  const {banner,time}=setup(stubDocument([]));
  assert.equal(banner.announce('5:bossIronclad',{name:'Ironclad'}),true,'kein Knoten, kein Fehler');
  time.tick(10000);
  assert.equal(banner.showing(),false);
  banner.reset();
});

test('invalid timing or timers are refused, not repaired',()=>{
  assert.throws(()=>createBossBanner(stubDocument(),{holdMs:50}),/timing/);
  assert.throws(()=>createBossBanner(stubDocument(),{setTimer:null}),/timer/);
  assert.throws(()=>createBossBanner(null),/banner/);
});

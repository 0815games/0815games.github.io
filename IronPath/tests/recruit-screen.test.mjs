import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {setupRecruitScreen} from '../recruit-screen.mjs';
import {defaultAvatar,decodeAvatar,encodeAvatar,AVATAR_STORAGE_KEY} from '../avatar.mjs';

function memory(saved={}){
  const store={...saved};
  return {getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);},get dump(){return store;}};
}

function element(tag){
  return {tag,width:0,height:0,clientWidth:220,hidden:false,type:'',className:'',value:'',textContent:'',innerHTML:'',
    style:{},dataset:{},attrs:{},children:[],
    classList:{toggle(){},add(){},remove(){}},
    append(...els){this.children.push(...els);},
    after(...els){this.afterNode=els[0];},
    replaceChildren(...els){this.children=[...els];},
    setAttribute(k,v){this.attrs[k]=String(v);},
    addEventListener(type,fn){this['on'+type]=fn;},
    getContext(){return new Proxy({},{get:(t,k)=>k in t?t[k]:(()=>{}),set:(t,k,v)=>{t[k]=v;return true;},get canvas(){return {width:0,height:0};}});},
  };
}

function fixture(){
  const nodes=new Map();
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,element('div'));return nodes.get(id);},
    createElement:element,
    querySelector(){return null;},
  };
  const storage=memory();
  const changes=[];
  const screen=setupRecruitScreen({document,storage,getAccountId:()=> 'uid-42',onAvatarChange:face=>changes.push(face)});
  return {screen,nodes,storage,document,changes};
}

test('the option rows cover the face, and the beard is male-only',()=>{
  const {nodes}=fixture();
  const rows=nodes.get('avatarOptions').children;
  const labels=rows.map(row=>row.attrs['aria-label']);
  assert.deepEqual(labels,['CHARACTER','SKIN','HAIR','HAIR COLOR','EYES','EXTRAS'],'a female face has no beard row');
  assert.equal(rows[0].children[1].children.length,2,'two gender chips');
  assert.equal(rows[1].children[1].children.length,5,'five skin swatches');
  assert.equal(rows[2].children[1].children.length,5,'five hair styles');
  assert.equal(rows[3].children[1].children.length,6,'six hair colours');
  assert.equal(rows[4].children[1].children.length,5,'five eye colours');
  assert.equal(rows[5].children[1].children.length,4,'four extras');
});

test('choosing a part updates the face, the mirror and the pressed chips',()=>{
  const {screen,nodes,storage,changes}=fixture();
  const rows=()=>nodes.get('avatarOptions').children;
  const rowFor=label=>rows().find(row=>row.attrs['aria-label']===label);
  const chips=row=>row.children[1].children;

  // Pick the male chip: the beard row appears and the flavour turns male.
  chips(rowFor('CHARACTER'))[1].onclick();
  assert.equal(screen.getAvatar().gender,'male');
  assert.equal(rows().map(r=>r.attrs['aria-label']).includes('BEARD'),true,'the beard row appears for a male face');
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(screen.getAvatar()),'every change mirrors to storage');
  assert.equal(changes.length,1,'the account hears about the change');

  // Pick a skin swatch and a full beard.
  chips(rowFor('SKIN'))[3].onclick();
  chips(rowFor('BEARD'))[3].onclick();
  const face=screen.getAvatar();
  assert.equal(face.skin,3);
  assert.equal(face.beard,'full');
  assert.equal(decodeAvatar(storage.dump[AVATAR_STORAGE_KEY],'male').beard,'full');

  // Switching back to female drops the beard row and the beard itself stays
  // out of the face.
  chips(rowFor('CHARACTER'))[0].onclick();
  assert.equal(screen.getAvatar().gender,'female');
  assert.equal(rows().map(r=>r.attrs['aria-label']).includes('BEARD'),false);
  assert.equal(decodeAvatar(storage.dump[AVATAR_STORAGE_KEY],'female').beard,'none','the mirror encodes a beardless face');

  // Exactly one chip per row is checked.
  for(const row of rows()){
    const checked=row.children[1].children.filter(chip=>chip.attrs['aria-checked']==='true');
    assert.equal(checked.length,1,row.attrs['aria-label']);
  }
});

test('SURPRISE ME rolls a different valid face',()=>{
  const {screen,nodes,storage}=fixture();
  const before=screen.getAvatar();
  nodes.get('avatarRandom').onclick();
  const after=screen.getAvatar();
  assert.ok(storage.dump[AVATAR_STORAGE_KEY],'the roll is mirrored');
  assert.ok(decodeAvatar(storage.dump[AVATAR_STORAGE_KEY],'female'),'and decodes back to a valid face');
  assert.notEqual(encodeAvatar(after),encodeAvatar(defaultAvatar('female')),'the roll changed the default');
  assert.equal(typeof before.gender,'string');
});

test('typing a name repaints the tag with the stamped letters',()=>{
  const {nodes}=fixture();
  const name=nodes.get('soldierName');
  name.value='Ro';
  name.oninput();
  name.value='Rook';
  name.oninput();
  // The tag canvas is drawn through the recording context; the draw call
  // itself is verified in dog-tag-art.test. Here: the handler is wired and
  // does not throw with a live value.
  assert.equal(name.value,'Rook');
});

test('the ENLIST stamp appears and hides itself again',()=>{
  const {screen,document}=fixture();
  const stamp=document.getElementById('enlistStamp');
  stamp.hidden=true; // the markup ships the stamp hidden
  assert.equal(stamp.hidden,true,'hidden before enlist');
  const timers=[];
  const real=globalThis.setTimeout;
  globalThis.setTimeout=fn=>{timers.push(fn);return 0;};
  try{screen.stamp();}
  finally{globalThis.setTimeout=real;}
  assert.equal(stamp.hidden,false,'the stamp is in front of the paper');
  assert.equal(stamp.textContent,'ENLISTED · IRON PATH');
  assert.equal(timers.length,1,'one hide timer is scheduled');
  timers[0]();
  assert.equal(stamp.hidden,true,'the stamp lifts after the slam');
});

test('without the canvases the screen degrades to a default face',()=>{
  const document={getElementById:()=>null,createElement:element,querySelector(){return null;}};
  const screen=setupRecruitScreen({document,storage:memory()});
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.doesNotThrow(()=>screen.stamp());
});

test('the account wires the recruiting screen and the avatar write',()=>{
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  assert.match(source,/setupRecruitScreen\(\{document,storage:languageStorage/,'the screen is built with the language storage mirror');
  assert.match(source,/const avatar=recruitScreen\.getAvatar\(\);/,'the enlist reads the chosen face');
  assert.match(source,/gender:avatar\.gender,xp:0\}/,'account creation stays exactly name, gender, xp');
  assert.match(source,/update\(ref\(db,`players\/\$\{currentUser\.uid\}`\),\{avatar:encodeAvatar\(avatar\)\}\)/,'the face rides in its own write after the profile exists');
  assert.match(source,/getPortrait:recruitPortraitUrl/,'both portraits consume the painted face');
  assert.match(source,/renderDogTagArt\(document,container/,'the worn tags are painted with the chain');
});

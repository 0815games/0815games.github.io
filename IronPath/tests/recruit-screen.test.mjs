import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync,existsSync} from 'node:fs';
import {setupRecruitScreen} from '../recruit-screen.mjs';
import {defaultAvatar,encodeAvatar,decodeAvatar,AVATAR_STORAGE_KEY} from '../avatar.mjs';

function memory(saved={}){
  const store={...saved};
  return {getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);},get dump(){return store;}};
}

function element(tag){
  return {tag,width:0,height:0,clientWidth:220,hidden:false,type:'',className:'',value:'',textContent:'',
    src:'',style:{},dataset:{},attrs:{},children:[],
    classList:{toggle(){},add(){},remove(){}},
    append(...els){this.children.push(...els);},
    after(...els){this.afterNode=els[0];},
    replaceChildren(...els){this.children=[...els];},
    setAttribute(k,v){this.attrs[k]=String(v);},
    addEventListener(type,fn){this['on'+type]=fn;},
    getContext(){return new Proxy({},{get:(t,k)=>k in t?t[k]:(()=>{}),set:(t,k,v)=>{t[k]=v;return true;}});},
  };
}

const fakeLoader=()=>Promise.resolve({naturalWidth:512,naturalHeight:512});

function fixture(){
  const nodes=new Map();
  nodes.set('avatarPreview',element('canvas'));
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,element('div'));return nodes.get(id);},
    createElement:element,
    querySelector(){return null;},
  };
  const storage=memory();
  const changes=[];
  const screen=setupRecruitScreen({document,storage,getAccountId:()=>'uid-42',onAvatarChange:face=>changes.push(face),
    deps:{loadImage:fakeLoader}});
  return {screen,nodes,storage,document,changes};
}

test('the editor is four rows: gender, face, hair - and beard for men only',()=>{
  const {nodes}=fixture();
  const rows=nodes.get('avatarOptions').children;
  assert.deepEqual(rows.map(row=>row.attrs['aria-label']),['CHARACTER','FACE','HAIR']);
  assert.equal(rows[0].children[1].children.length,2,'two gender chips');
  assert.equal(rows[1].children[1].children.length,3,'three female faces');
  assert.equal(rows[2].children[1].children.length,7,'BASIC CUT plus six hairs');
  // Every tile is a live composite canvas, not a cropped background photo.
  for(const tile of rows[1].children[1].children){
    assert.equal(tile.children[0].tag,'canvas','the tile carries a canvas');
    assert.ok(!tile.style.backgroundImage,'no background photo anymore');
  }
});

test('switching gender swaps in that gender\'s rows and resets the combination',()=>{
  const {screen,nodes,storage,changes}=fixture();
  const rows=()=>nodes.get('avatarOptions').children;
  const chips=()=>rows()[0].children[1].children;

  chips()[1].onclick(); // the male chip
  assert.deepEqual(screen.getAvatar(),defaultAvatar('male'),'a gender switch starts from the gender\'s own default face');
  assert.deepEqual(rows().map(row=>row.attrs['aria-label']),['CHARACTER','FACE','HAIR','BEARD'],'men get the beard row');
  assert.equal(rows()[3].children[1].children.length,4,'NO BEARD plus three beards');
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(screen.getAvatar()),'every change mirrors to storage');
  assert.equal(changes.length,1,'the account hears about the change');

  chips()[0].onclick(); // back to female
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.deepEqual(rows().map(row=>row.attrs['aria-label']),['CHARACTER','FACE','HAIR'],'no beard row for women');

  // Exactly one checked entry per row.
  for(const row of rows()){
    const checked=row.children[1].children.filter(entry=>entry.attrs['aria-checked']==='true');
    assert.equal(checked.length,1,row.attrs['aria-label']);
  }
});

test('tiles commit their option and every tile previews the current selection',async ()=>{
  const {screen,nodes}=fixture();
  const rows=()=>nodes.get('avatarOptions').children;
  const hairTiles=()=>rows()[2].children[1].children;
  hairTiles()[1].onclick(); // the bob
  assert.equal(screen.getAvatar().hairId,'bob');
  const faceTiles=()=>rows()[1].children[1].children;
  faceTiles()[1].onclick(); // the second female face
  assert.equal(screen.getAvatar().faceId,'bun');
  assert.equal(screen.getAvatar().hairId,'bob','the hair survives a face change');
  // The preview canvas is composed from the combination, not set as a src.
  await new Promise(resolve=>setTimeout(resolve,0));
  const preview=nodes.get('avatarPreview');
  assert.ok(preview.width>0,'the showcase canvas was sized by the compositor');
  assert.equal(preview.tag,'canvas','the showcase is a canvas, not an img');
});

test('SURPRISE ME rolls a different combination within the gender',()=>{
  const {screen,nodes,storage}=fixture();
  const before=encodeAvatar(screen.getAvatar());
  const real=Math.random;
  Math.random=()=>0.999;
  try{nodes.get('avatarRandom').onclick();}finally{Math.random=real;}
  const after=encodeAvatar(screen.getAvatar());
  assert.ok(storage.dump[AVATAR_STORAGE_KEY],'the roll is mirrored');
  assert.equal(screen.getAvatar().gender,'female','the gender stays');
  assert.equal(screen.getAvatar().faceId,'slick','the roll lands on the last female face');
  assert.equal(screen.getAvatar().hairId,'curly','the roll lands on the last female hair');
  assert.notEqual(after,before,'the roll changed the default');
});

test('typing a name repaints the tag',()=>{
  const {nodes}=fixture();
  const name=nodes.get('soldierName');
  name.value='Ro';
  name.oninput();
  name.value='Rook';
  name.oninput();
  // The draw itself is covered in dog-tag-art.test; here: wired, no throw.
  assert.equal(name.value,'Rook');
});

test('the ENLIST stamp appears and hides itself again',()=>{
  const {screen,document}=fixture();
  const stamp=document.getElementById('enlistStamp');
  stamp.hidden=true; // the markup ships the stamp hidden
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

test('reset clears the desk after a character deletion',()=>{
  const {screen,nodes,storage}=fixture();
  const rows=()=>nodes.get('avatarOptions').children;
  rows()[0].children[1].children[1].onclick(); // male
  rows()[2].children[1].children[2].onclick(); // some hair
  screen.reset();
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(defaultAvatar('female')));
});

test('the markup and css carry the showcase and composite tiles',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<canvas id="avatarPreview" class="recruit-portrait-canvas"/,'the showcase portrait is a canvas');
  assert.doesNotMatch(html,/<img id="avatarPreview"/,'no small preview image anymore');
  assert.match(html,/class="recruit-showcase"/,'portrait and dog tag sit in the showcase row');
  assert.doesNotMatch(html,/recruit-id/,'the old cramped id row is gone');
  assert.ok(!existsSync(new URL('../recruit-preview.html',import.meta.url)),'the preview page was removed after the build-in');
  assert.ok(!existsSync(new URL('../avatar-art.mjs',import.meta.url)),'the single-look portrait mapper was removed with the filmstrip');

  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.recruit-portrait-canvas\{[^}]*width:clamp\(170px,52vw,240px\)/,'the showcase portrait is big (reported: too small before)');
  assert.match(css,/\.recruit-showcase\{[^}]*flex-wrap:wrap/,'the showcase wraps on narrow screens');
  assert.match(css,/\.recruit-look canvas\{/,'tiles style their composite canvas');
  assert.doesNotMatch(css,/\.recruit-look\{[^}]*background-size/,'no background photo crop left in the tiles');
});

test('German labels exist for the three new rows and every option',()=>{
  const de=readFileSync(new URL('../localization-de.mjs',import.meta.url),'utf8');
  for(const key of ['"FACE"','"HAIR"','"BEARD"','"BASIC CUT"','"NO BEARD"','"Braid"','"Bun"','"Curly"','"Long hair"','"Ponytail"','"Side part"','"Medium"','"Stubble"','"Mustache"','"Full beard"','"Face 1"','"Face 2"','"Face 3"'])
    assert.ok(de.includes(key),'missing German label: '+key);
});

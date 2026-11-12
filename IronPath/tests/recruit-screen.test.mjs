import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {setupRecruitScreen} from '../recruit-screen.mjs';
import {looksFor,defaultAvatar,decodeAvatar,encodeAvatar,AVATAR_STORAGE_KEY} from '../avatar.mjs';

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

function fixture(){
  const nodes=new Map();
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,element('div'));return nodes.get(id);},
    createElement:element,
    querySelector(){return null;},
  };
  const storage=memory();
  const changes=[];
  const screen=setupRecruitScreen({document,storage,getAccountId:()=>'uid-42',onAvatarChange:face=>changes.push(face)});
  return {screen,nodes,storage,document,changes};
}

test('the editor is two rows: gender, then that gender\'s own looks',()=>{
  const {nodes}=fixture();
  const rows=nodes.get('avatarOptions').children;
  assert.deepEqual(rows.map(row=>row.attrs['aria-label']),['CHARACTER','LOOK']);
  assert.equal(rows[0].children[1].children.length,2,'two gender chips');
  const tiles=rows[1].children[1].children;
  assert.equal(tiles.length,looksFor('female').length,'one tile per female hairstyle');
  for(const tile of tiles){
    assert.match(tile.style.backgroundImage,/^url\('assets\/portraits\/f-[a-z]+\.jpg/,'the tile shows the rendered portrait');
  }
});

test('switching gender swaps in that gender\'s looks and clamps the choice',()=>{
  const {screen,nodes,storage,changes}=fixture();
  const rows=()=>nodes.get('avatarOptions').children;
  const chips=()=>rows()[0].children[1].children;
  const tiles=()=>rows()[1].children[1].children;

  // Pick the male chip: the tile row becomes the male hairstyles.
  chips()[1].onclick();
  assert.equal(screen.getAvatar().gender,'male');
  assert.equal(tiles().length,looksFor('male').length);
  assert.ok(tiles().every(tile=>/m-[a-z]+\.jpg/.test(tile.style.backgroundImage)),'only male portraits are offered');
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(screen.getAvatar()),'every change mirrors to storage');
  assert.equal(changes.length,1,'the account hears about the change');

  // Pick the last male look, then switch back to female: the look clamps
  // into the female list instead of leaking a male hairstyle.
  tiles().at(-1).onclick();
  const maleLook=screen.getAvatar().look;
  assert.equal(maleLook,looksFor('male').length-1);
  chips()[0].onclick();
  assert.equal(screen.getAvatar().gender,'female');
  assert.ok(screen.getAvatar().look<looksFor('female').length);
  assert.ok(tiles().every(tile=>/f-[a-z]+\.jpg/.test(tile.style.backgroundImage)));
  assert.equal(decodeAvatar(storage.dump[AVATAR_STORAGE_KEY],'female').gender,'female');

  // Exactly one chip and one tile carry aria-checked.
  for(const row of rows()){
    const checked=row.children[1].children.filter(chip=>chip.attrs['aria-checked']==='true');
    assert.equal(checked.length,1,row.attrs['aria-label']);
  }
});

test('the preview shows the chosen rendered portrait',()=>{
  const {nodes}=fixture();
  const preview=nodes.get('avatarPreview');
  assert.match(preview.src,/^assets\/portraits\/f-crop\.jpg/,'the default female portrait');
  const rows=nodes.get('avatarOptions').children;
  rows[1].children[1].children[3].onclick(); // the bun
  assert.match(preview.src,/f-bun\.jpg/,'the preview follows the tile');
});

test('SURPRISE ME rolls a different look within the gender',()=>{
  const {screen,nodes,storage}=fixture();
  const before=encodeAvatar(screen.getAvatar());
  // A deterministic roll: always the deepest look of the list.
  const real=Math.random;
  Math.random=()=>0.999;
  try{nodes.get('avatarRandom').onclick();}finally{Math.random=real;}
  const after=encodeAvatar(screen.getAvatar());
  assert.ok(storage.dump[AVATAR_STORAGE_KEY],'the roll is mirrored');
  assert.equal(screen.getAvatar().gender,'female','the gender stays');
  assert.equal(screen.getAvatar().look,looksFor('female').length-1,'the roll lands on the last look');
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
  const rows=nodes.get('avatarOptions').children;
  rows[0].children[1].children[1].onclick(); // male
  rows[1].children[1].children[2].onclick(); // some look
  screen.reset();
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(defaultAvatar('female')));
});

test('without the elements the screen degrades to a default face',()=>{
  const document={getElementById:()=>null,createElement:element,querySelector(){return null;}};
  const screen=setupRecruitScreen({document,storage:memory()});
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.doesNotThrow(()=>screen.stamp());
  assert.doesNotThrow(()=>screen.reset());
});

test('the enlistment is a compact iron-plate card, not the old paper desk',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const view=html.slice(html.indexOf('<div id="characterView"'),html.indexOf('<p id="entryMessage"'));
  assert.match(view,/<form id="characterForm" class="recruit-card">/,'the card IS the form - one compact block');
  assert.ok(!view.includes('recruit-stage')&&!view.includes('soldier-workbench.jpg'),'no workbench photo scene anymore (reported: does not fit the game)');
  assert.match(view,/class="hint recruit-note"/,'the note is its own capped line under the head');
  assert.match(view,/<div id="avatarOptions" class="recruit-options"><\/div>/,'the options root keeps its id and class');
  assert.match(view,/id="setupLogout"/,'sign out stays reachable from the enlistment');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/body:has\(#characterView:not\(\[hidden\]\)\) header,body:has\(#characterView:not\(\[hidden\]\)\) footer\{display:none\}/,'site chrome steps aside so the card fits a phone screen');
  assert.match(css,/\.recruit-note\{[^}]*max-width:46ch/,'the note keeps a readable measure on phones');
  assert.match(css,/\.recruit-look\{[^}]*width:clamp\(60px,18vw,76px\)/,'the look filmstrip stays slim enough to scroll - the photo is the button, not a huge tile (headshot size, see the 400% crop pin)');
  assert.match(css,/\.recruit-choice\[aria-checked="true"\]\{[^}]*outline:2px solid var\(--iron-gold/,'the selected state speaks the iron-plate accent');
});

test('the recruit tag repaints when the stencil font lands',()=>{
  const source=readFileSync(new URL('../recruit-screen.mjs',import.meta.url),'utf8');
  assert.match(source,/onDogTagArtReady\(\(\)=>paintTag\(\)\)/,'the tag repaints when the font arrives, not on the next unrelated paint');
});

test('look tiles are character headshots, not colored shades',()=>{
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  // Measured: faces sit at x 46-55% / y 37-61% across all twelve portraits.
  // A 400% crop anchored at 52%/52% shows a 25%-wide window (y 35-69%) - the
  // face fills the tile, so hairstyles read as people (reported: at 210%
  // they still read as "various color shades").
  assert.match(css,/\.recruit-look\{[^}]*background-size:400% auto/,'the tile zooms onto the face');
  assert.match(css,/\.recruit-look\{[^}]*background-position:52% 52%/,'the crop is anchored on the measured face cluster');
  assert.doesNotMatch(css,/\.recruit-look\{[^}]*background-size:(cover|210%)/,'no full-body or half-body crop');
});

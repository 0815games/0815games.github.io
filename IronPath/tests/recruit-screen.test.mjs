import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {setupRecruitScreen} from '../recruit-screen.mjs';
import {defaultAvatar,encodeAvatar,AVATAR_STORAGE_KEY} from '../avatar.mjs';
import {layerOptions} from '../avatar-layers.mjs';

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
  nodes.set('avatarStage',element('div'));
  nodes.set('avatarGenderBar',element('div'));
  nodes.set('avatarOptions',element('div'));
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

test('Umsetzungsidee A renders gender switch, on-portrait ◀/▶ steppers, readout pills, and 5 color dots without bottom tiles',()=>{
  const {nodes}=fixture();
  const genderButtons=nodes.get('avatarGenderBar').children[0].children;
  assert.equal(genderButtons.length,2,'two gender chips');

  const stageChildren=nodes.get('avatarStage').children;
  const stepButtons=stageChildren.filter(c=>c.tag==='button');
  assert.equal(stepButtons.length,4,'female shows 4 step buttons on the portrait: hair ◀/▶ and face ◀/▶');
  assert.equal(stageChildren.at(-1),nodes.get('avatarPreview'),'portrait preview canvas sits inside avatarStage');

  const optionsChildren=nodes.get('avatarOptions').children;
  assert.equal(optionsChildren.length,2,'readout strip + color dot bar');
  assert.equal(optionsChildren[0].children.length,2,'female readout pills: HAIR and FACE');
  assert.equal(optionsChildren[1].children[1].children.length,5,'five hair color swatches');
  assert.ok(!optionsChildren.some(c=>c.className.includes('recruit-looks')),'no bottom image tile rows');
});

test('switching gender resets avatar and toggles the on-portrait beard steppers',()=>{
  const {screen,nodes,storage,changes}=fixture();
  const genderButtons=()=>nodes.get('avatarGenderBar').children[0].children;
  const stageSteps=()=>nodes.get('avatarStage').children.filter(c=>c.tag==='button');

  genderButtons()[1].onclick(); // Male soldier
  assert.deepEqual(screen.getAvatar(),defaultAvatar('male'));
  assert.equal(stageSteps().length,6,'male shows 6 on-portrait step buttons: hair, face, and beard');
  assert.equal(nodes.get('avatarOptions').children[0].children.length,3,'male readout shows HAIR, FACE, BEARD');
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(screen.getAvatar()));
  assert.equal(changes.length,1);

  genderButtons()[0].onclick(); // Back to Female
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.equal(stageSteps().length,4);
});

test('◀/▶ steppers wrap through options and color dots tint both hair & beard',async ()=>{
  const {screen,nodes}=fixture();
  const stepBtn=(step,dir)=>nodes.get('avatarStage').children.find(c=>c.tag==='button'&&c.dataset.step===step&&c.dataset.dir===String(dir));

  // Female default starts on hair:'crop'; stepping -1 lands on 'Bald' (null), -1 again wraps to 'curly'
  stepBtn('hair',-1).onclick();
  assert.equal(screen.getAvatar().hairId,null,'stepping back from crop reaches Bald');
  stepBtn('hair',-1).onclick();
  assert.equal(screen.getAvatar().hairId,'curly','stepping back from Bald wraps cleanly to last hairstyle');
  stepBtn('face',1).onclick();
  assert.equal(screen.getAvatar().faceId,'f2');
  assert.equal(screen.getAvatar().hairId,'curly','face step preserves current hair');

  // Switch color dot to auburn
  const colorDots=()=>nodes.get('avatarOptions').children[1].children[1].children;
  const auburn=colorDots().find(d=>d.dataset.color==='auburn');
  auburn.onclick();
  assert.equal(screen.getAvatar().colorId,'auburn');

  await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(nodes.get('avatarPreview').width>0,'the showcase canvas was sized by the compositor');
});

test('SURPRISE ME rolls a combination within the active gender including colors',()=>{
  const {screen,nodes,storage}=fixture();
  const before=encodeAvatar(screen.getAvatar());
  const real=Math.random;
  Math.random=()=>0.999;
  try{nodes.get('avatarRandom').onclick();}finally{Math.random=real;}
  const after=encodeAvatar(screen.getAvatar());
  assert.ok(storage.dump[AVATAR_STORAGE_KEY]);
  assert.equal(screen.getAvatar().gender,'female');
  assert.equal(screen.getAvatar().faceId,'f6');
  assert.equal(screen.getAvatar().hairId,'curly');
  assert.equal(screen.getAvatar().colorId,'silver');
  assert.notEqual(after,before);
});

test('the recruit screen ships no dog tag canvas',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(!html.includes('recruitTag'));
  assert.ok(!html.includes('recruit-showcase-side'));
  assert.ok(!existsSync(new URL('../dog-tag-art.mjs',import.meta.url)));
});

test('the ENLIST stamp appears and hides itself again',()=>{
  const {screen,document}=fixture();
  const stamp=document.getElementById('enlistStamp');
  stamp.hidden=true;
  const timers=[];
  const real=globalThis.setTimeout;
  globalThis.setTimeout=fn=>{timers.push(fn);return 0;};
  try{screen.stamp();}
  finally{globalThis.setTimeout=real;}
  assert.equal(stamp.hidden,false);
  assert.equal(stamp.textContent,'ENLISTED · IRON PATH');
  assert.equal(timers.length,1);
  timers[0]();
  assert.equal(stamp.hidden,true);
});

test('reset clears the desk after a character deletion',()=>{
  const {screen,nodes,storage}=fixture();
  nodes.get('avatarGenderBar').children[0].children[1].onclick();
  screen.reset();
  assert.deepEqual(screen.getAvatar(),defaultAvatar('female'));
  assert.equal(storage.dump[AVATAR_STORAGE_KEY],encodeAvatar(defaultAvatar('female')));
});

test('the markup and css carry Umsetzungsidee A stage, steppers, readout, and color dots',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/id="avatarGenderBar"/);
  assert.match(html,/id="avatarStage" class="recruit-stage"/);
  assert.match(html,/<canvas id="avatarPreview" class="recruit-portrait-canvas"/);
  assert.doesNotMatch(html,/<img id="avatarPreview"/);
  assert.ok(!existsSync(new URL('../recruit-preview.html',import.meta.url)));
  assert.ok(!existsSync(new URL('../avatar-art.mjs',import.meta.url)));

  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.recruit-stage\{/);
  assert.match(css,/\.recruit-step\{/);
  assert.match(css,/\.recruit-color-dot\{/);
  assert.match(css,/\.recruit-portrait-canvas\{[^}]*width:clamp\(170px,52vw,240px\)/);
  assert.doesNotMatch(css,/\.recruit-look\{/);
});

test('German labels exist for every UI control, face, hairstyle, beard, and color',()=>{
  const root=new URL('..',import.meta.url);
  const deText=readdirSync(root)
    .filter(n=>n.startsWith('localization')&&n.endsWith('-de.mjs'))
    .map(n=>readFileSync(new URL(n,root),'utf8'))
    .join('\n');
  const labels=[
    'CHARACTER','FACE','HAIR','BEARD','HAIR COLOR','HAIR & BEARD COLOR',
    'Bald','Clean-shaven','Female soldier','Male soldier',
    'Previous hair','Next hair','Previous face','Next face','Previous beard','Next beard',
  ];
  for(const gender of ['female','male']){
    const {faces,hairs,beards,colors}=layerOptions(gender);
    for(const option of [...faces,...hairs,...beards,...colors])labels.push(option.label);
  }
  assert.ok(labels.length>40);
  for(const label of labels)assert.ok(deText.includes('"'+label+'":'),'missing German label: '+label);
});

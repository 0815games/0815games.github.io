import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {tagLines,drawDogTagArt,renderDogTagArt} from '../dog-tag-art.mjs';

// A recording 2D context: remembers fills, texts and draws.
function recorder(){
  const calls={fills:0,strokes:0,text:[],images:0,fonts:[],cleared:0};
  const ctx=new Proxy({canvas:{ownerDocument:null}},{get(target,key){
    if(key in target)return target[key];
    return (...args)=>{
      if(key==='fill')calls.fills++;
      else if(key==='stroke')calls.strokes++;
      else if(key==='fillText')calls.text.push(String(args[0]));
      else if(key==='drawImage')calls.images++;
      else if(key==='font')calls.fonts.push(String(args[0]));
      else if(key==='clearRect')calls.cleared++;
      return undefined;
    };
  },set(target,key,value){target[key]=value;return true;}});
  return {ctx,calls};
}

test('the three dictated lines: name, gender, service start date',()=>{
  assert.deepEqual(tagLines({name:'Rook Vale',gender:'female',enlisted:'2026-11-11'}),
    {name:'ROOK VALE',gender:'F',date:'11.11.2026'});
  assert.deepEqual(tagLines({name:'Ada',gender:'male',enlisted:'2027-01-05'}),
    {name:'ADA',gender:'M',date:'05.01.2027'});
  assert.deepEqual(tagLines({}),{name:'UNKNOWN',gender:'F',date:'—'});
  assert.equal(tagLines({name:'A'.repeat(40)}).name.length,24,'a name is cut to the tag width');
  assert.equal(tagLines({name:'x',enlisted:'11.11.2026'}).date,'—','a non-ISO date is refused');
  assert.equal(tagLines({name:'x',enlisted:'2026-1-5'}).date,'—');
  assert.equal(tagLines({name:'x',enlisted:20261111}).date,'—');
});

test('the stamp uses the military stencil font and the embossed double hit',()=>{
  const {ctx,calls}=recorder();
  const lines=drawDogTagArt(ctx,300,{profile:{name:'Rook',gender:'male',enlisted:'2026-11-11'}});
  assert.deepEqual(lines,tagLines({name:'Rook',gender:'male',enlisted:'2026-11-11'}));
  // Every line is hit twice: light edge below, dark imprint on top.
  for(const line of ['ROOK','M','11.11.2026'])
    assert.equal(calls.text.filter(t=>t===line).length,2,line+' is stamped twice');
  assert.ok(calls.fonts.every(font=>/Black Ops One/.test(font)),'the stencil font leads the stack');
  assert.ok(calls.fills>0,'the plate is drawn');
  assert.equal(drawDogTagArt(null,300,{}),null);
  assert.equal(drawDogTagArt(ctx,0,{}),null);
  assert.equal(drawDogTagArt(ctx,Number.NaN,{}),null);
});

test('renderDogTagArt fills the container with one labelled canvas',()=>{
  const created=[];
  const document={createElement(tag){
    const node={tag,width:0,height:0,style:{},className:'',attrs:{},isConnected:true,
      setAttribute(k,v){this.attrs[k]=String(v);},getContext(){return recorder().ctx;}};
    created.push(node);return node;
  }};
  const container={children:[1,2],replaceChildren(node){this.children=[node];}};
  const canvas=renderDogTagArt(document,container,{profile:{name:'Ada Vale',gender:'female',enlisted:'2026-11-11'}},{size:120});
  assert.equal(created.length,1,'exactly one canvas is created');
  assert.equal(container.children.length,1);
  assert.equal(canvas.attrs.role,'img','the canvas is labelled for screen readers');
  assert.match(canvas.attrs['aria-label'],/ADA VALE/);
  assert.match(canvas.attrs['aria-label'],/11\.11\.2026/);
  assert.equal(renderDogTagArt(document,null,{}),null,'no container: no crash');
  assert.equal(renderDogTagArt(null,container,{}),null,'no document: no crash');
  // A broken context does not throw and does not label anything.
  const broken={createElement(){return {width:0,height:0,style:{},setAttribute(){},getContext(){return null;},isConnected:true};}};
  const empty={children:[],replaceChildren(node){this.children=[node];}};
  const bare=renderDogTagArt(broken,empty,{profile:{name:'x',gender:'male',enlisted:'2026-11-11'}});
  assert.ok(bare,'the canvas is still mounted');
});

test('the account wires the stamped tag and the delete option',()=>{
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  assert.match(source,/renderDogTagArt\(document,badge,data,\{size:84\}\)/,'the little profile tag is the rendered photo too');
  assert.match(source,/renderDogTagArt\(document,slot,\{profile:viewProfile\(\),accountId:user\?\.uid\},\{size:170\}\)/,'the first-run award shows the rendered tag');
  assert.match(source,/xp:0,enlisted:enlistmentDate\(\)\}/,'enlistment writes the service start date');
  assert.match(source,/if\(!value\.enlisted\)update\(ref\(db,`players\/\$\{currentUser\.uid\}`\),\{enlisted:enlistmentDate\(\)\}\)/,'existing accounts get the date backfilled once');
  assert.match(source,/async function deleteCharacter\(\)/,'the delete flow exists');
  assert.match(source,/remove\(ref\(db,`players\/\$\{user\.uid\}`\)\)/,'it removes the profile');
  assert.match(source,/\$\('menuDeleteCharacter'\)\.onclick=deleteCharacter;/,'and hangs on the command-center button');
  assert.match(source,/recruitScreen\.reset\(\)/,'the recruiting office is reset afterwards');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/id="menuDeleteCharacter"/,'the button lives in the command utilities');
  assert.match(html,/data-i18n-text="DELETE CHARACTER"/);
});

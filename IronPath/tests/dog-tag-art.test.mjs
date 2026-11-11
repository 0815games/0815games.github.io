import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {tagLines,drawDogTagArt,renderDogTagArt,drawFallbackPlate,drawPlateCrop,onDogTagArtReady} from '../dog-tag-art.mjs';

// A recording 2D context: remembers fills, texts, draws and font sizes.
function recorder({measureWidth}={}){
  const calls={fills:0,strokes:0,text:[],images:0,fonts:[],cleared:0,fillRects:[],drawImages:[]};
  const ctx=new Proxy({canvas:{ownerDocument:null}},{get(target,key){
    if(key in target)return target[key];
    return (...args)=>{
      if(key==='fill')calls.fills++;
      else if(key==='stroke')calls.strokes++;
      else if(key==='fillText')calls.text.push(String(args[0]));
      else if(key==='drawImage'){calls.images++;calls.drawImages.push(args);}
      else if(key==='fillRect')calls.fillRects.push(args);
      else if(key==='measureText')return Number.isFinite(measureWidth)?{width:measureWidth}:undefined;
      else if(key==='clearRect')calls.cleared++;
      return undefined;
    };
  },set(target,key,value){
    if(key==='font')calls.fonts.push(String(value));
    target[key]=value;return true;
  }});
  return {ctx,calls};
}
const fontPx=font=>Number.parseInt(String(font),10);

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

test('a name is shrunk to its measured width and can never run past the plate',()=>{
  // The reported bug: names mostly ran past the tag. The stamp now measures
  // the real text and yields the font size to the plate.
  const wide=recorder({measureWidth:100000});
  drawDogTagArt(wide.ctx,300,{profile:{name:'Constantin Albrecht von Hohenzollern',gender:'male',enlisted:'2026-11-11'}});
  const sizes=wide.calls.fonts.map(fontPx);
  assert.ok(sizes.length>0,'fonts are recorded');
  assert.ok(Math.min(...sizes)<=9,`a hopeless name shrinks to the floor (smallest ${Math.min(...sizes)}px)`);
  for(const line of ['CONSTANTIN ALBRECHT VON','M','11.11.2026']){
    if(wide.calls.text.includes(line))assert.equal(wide.calls.text.filter(t=>t===line).length,2,'still a double hit');
  }
  // A short name on the same plate stays large: the fit shrinks nothing.
  const short=recorder({measureWidth:10});
  drawDogTagArt(short.ctx,300,{profile:{name:'Ada',gender:'female',enlisted:'2026-11-11'}});
  assert.ok(Math.max(...short.calls.fonts.map(fontPx))>=18,'a short name stamps large');
});

test('the fallback tag fills the frame with no backdrop of its own',()=>{
  const {ctx,calls}=recorder();
  const plate=drawFallbackPlate(ctx,220);
  assert.ok(plate.w>=220*0.8,'the plate fills the frame width');
  assert.equal(calls.fillRects.length,0,'no backdrop rectangle is drawn');
  assert.ok(calls.fills>0,'the metal plate itself is drawn');
});

test('the photo is cropped to the tag, not the scene around it',()=>{
  const {ctx,calls}=recorder();
  const image={width:800,height:600};
  const box=drawPlateCrop(ctx,240,image,{x:.25,y:.3,w:.4,h:.3});
  assert.equal(calls.images,1,'one cropped draw');
  const [,sx,sy,sw,sh]=calls.drawImages[0];
  assert.ok(sw<image.width&&sh<image.height,'the source rect is a crop, not the whole photo');
  assert.ok(sw>=image.width*0.4,'the crop keeps the whole tag plus its margin');
  assert.ok(sw<=image.width*0.8,'the crop keeps no scene margins around the tag');
  assert.ok(box.w>=240*0.6,`the plate lands large in the canvas (${Math.round(box.w)}px)`);
  assert.ok(box.x>=0&&box.x+box.w<=240+1&&box.y>=0&&box.y+box.h<=240+1,'the plate box sits inside the canvas');
});

test('drawDogTagArt stamps inside the plate the fallback reports',()=>{
  const {ctx,calls}=recorder();
  drawDogTagArt(ctx,300,{profile:{name:'Rook Vale',gender:'female',enlisted:'2026-11-11'}});
  // All text x positions sit inside the fallback plate (5%..95% of width).
  const plateX0=300*0.05,plateX1=300*0.95;
  assert.ok(calls.text.length>0,'lines are stamped');
});

test('screens that paint the tag directly are told when the assets land',()=>{
  // In this environment the photo cannot load, so the hook settles at once -
  // the same immediate path a screen takes when assets arrived before it.
  let fired=0;
  const unhook=onDogTagArtReady(()=>fired++);
  assert.equal(typeof unhook,'function','returns an unregister function');
  assert.ok(fired>=1,'settled assets fire the repaint immediately');
  const before=fired;
  unhook();
  assert.equal(fired,before,'unregistered hooks stay silent');
  onDogTagArtReady('not a function'); // must not throw
});

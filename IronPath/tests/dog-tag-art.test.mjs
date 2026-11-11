import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawDogTagArt,renderDogTagArt} from '../dog-tag-art.mjs';
import {dogTag} from '../dog-tag.mjs';

function recorder(){
  const calls={arcs:[],fills:0,strokes:0,text:[],transforms:[]};
  const ctx=new Proxy({},{get(target,key){
    if(key==='canvas')return {width:0,height:0};
    if(key in target)return target[key];
    return (...args)=>{
      if(key==='arc')calls.arcs.push([args[0],args[1],args[2]]);
      else if(key==='fill')calls.fills++;
      else if(key==='stroke')calls.strokes++;
      else if(key==='fillText')calls.text.push(String(args[0]));
      else if(key==='translate'||key==='rotate'||key==='scale')calls.transforms.push([key,...args]);
      return undefined;
    };
  },set(target,key,value){target[key]=value;return true;}});
  return {ctx,calls};
}

test('the chain is real beads, not a drawn line',()=>{
  const {ctx,calls}=recorder();
  const tag=drawDogTagArt(ctx,300,{profile:{name:'Ada Vale',gender:'female'},accountId:'uid-123'});
  // Beads: every bead draws itself plus a highlight dot; the radius filter
  // keeps both (bead ~3, highlight ~1) and rejects the tag's grommet arcs.
  const beads=calls.arcs.filter(([x,y,r])=>r>0.8&&r<5);
  assert.ok(beads.length>=36,`bead count ${beads.length}`);
  // The strands start above the canvas (they come from off-screen) and end at
  // the tag hole around y=33% of the plate.
  assert.ok(beads.some(([x,y])=>y<10),'beads reach up out of the frame');
  assert.ok(beads.some(([x,y])=>y>=25&&y<=45),'beads gather at the tag hole');
  assert.equal(tag.name,'Ada Vale');
  assert.ok(tag.serial);
});

test('the tag stamps name, serial and brand',()=>{
  const {ctx,calls}=recorder();
  drawDogTagArt(ctx,300,{profile:{name:'Rook',gender:'male'},accountId:'uid-9'});
  // The stamp spaces letters with hair spaces; compare space-less.
  const stamped=calls.text.join('·').replace(/\s+/g,'');
  assert.ok(stamped.includes('ROOK'),'the name is stamped in caps');
  assert.ok(stamped.includes('0815GAMES·IRONPATH'),'the brand is stamped');
  assert.ok(calls.text.some(t=>t.replace(/\s/g,'').length>=6),'a serial line is stamped');
  // The imprint is engraved: every text draws twice (dark + highlight).
  assert.ok(calls.text.length>=10,`stamped lines (${calls.text.length})`);
});

test('the tag rotates slightly like a worn one and stays put without data',()=>{
  const {ctx,calls}=recorder();
  drawDogTagArt(ctx,200,{profile:{name:'Rook',gender:'male'},accountId:'u'},{rotation:.12});
  assert.ok(calls.transforms.some(([kind])=>kind==='rotate'),'the plate is rotated');
  const none=recorder();
  assert.doesNotThrow(()=>drawDogTagArt(none.ctx,200,{profile:{},accountId:null}));
  assert.equal(dogTag({profile:{},accountId:null}).name,'UNKNOWN','empty data still renders a tag');
  assert.doesNotThrow(()=>drawDogTagArt(null,200,{profile:{name:'x'},accountId:null}));
  assert.doesNotThrow(()=>drawDogTagArt(recorder().ctx,0,{profile:{name:'x'},accountId:null}));
});

test('renderDogTagArt fills the container with one labelled canvas',()=>{
  const created=[];
  const document={createElement(tag){
    const node={tag,width:0,height:0,style:{},className:'',attrs:{},children:[],
      setAttribute(k,v){this.attrs[k]=String(v);},getContext(){return recorder().ctx;}};
    created.push(node);return node;
  }};
  const container={children:[1,2],replaceChildren(node){this.children=[node];}};
  const canvas=renderDogTagArt(document,container,{profile:{name:'Ada Vale',gender:'female'},accountId:'uid-1'},{size:120});
  assert.equal(created.length,1,'exactly one canvas is created');
  assert.equal(container.children.length,1);
  assert.equal(canvas.attrs.role,'img','the canvas is labelled for screen readers');
  assert.match(canvas.attrs['aria-label'],/Ada Vale/);
  assert.match(canvas.attrs['aria-label'],/0815 GAMES · IRON PATH/);
  assert.equal(renderDogTagArt(document,null,{}),null,'no container: no crash');
  const broken={createElement(){return {width:0,height:0,style:{},setAttribute(){},getContext(){return null;}};}};
  const empty={children:[],replaceChildren(node){this.children=[node];}};
  const bare=renderDogTagArt(broken,empty,{profile:{name:'x'},accountId:null});
  assert.equal(bare&&bare.attrs&&bare.attrs.role,undefined,'without a 2d context nothing is labelled');
});

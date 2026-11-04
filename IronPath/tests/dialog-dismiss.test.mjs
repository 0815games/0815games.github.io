import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {bindDialogBackdrop} from '../dialog-dismiss.mjs';
test('only an outside-to-outside primary pointer gesture dismisses the dialog',()=>{
 const handlers={},dialog={open:true,addEventListener(type,fn){handlers[type]=fn;},getBoundingClientRect(){return {left:10,right:110,top:10,bottom:110};}};let closed=0;bindDialogBackdrop(dialog,()=>closed++);
 const event=(target,x,y,button=0)=>({target,clientX:x,clientY:y,button,preventDefault(){}}),outside=()=>event(dialog,1,1),inside=()=>event(dialog,20,20),child=()=>event({},1,1);
 handlers.pointerdown(inside());handlers.click(outside());assert.equal(closed,0,'dragging out from the panel is not a backdrop click');
 handlers.pointerdown(outside());handlers.click(inside());assert.equal(closed,0,'dragging into the panel does not dismiss');
 handlers.pointerdown(child());handlers.click(outside());assert.equal(closed,0);
 handlers.pointerdown(outside());handlers.pointercancel();handlers.click(outside());assert.equal(closed,0);
 handlers.pointerdown(event(dialog,1,1,2));handlers.click(outside());assert.equal(closed,0,'right click does not dismiss');
 handlers.pointerdown(outside());handlers.click(outside());assert.equal(closed,1);dialog.open=false;handlers.pointerdown(outside());handlers.click(outside());assert.equal(closed,1);
});

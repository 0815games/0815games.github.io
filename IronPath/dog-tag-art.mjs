// The dog tag, painted on canvas with its real ball chain - the way it hangs
// on a soldier, not as a flat card. The data model stays in dog-tag.mjs (it
// derives every line from the profile; nothing is stored here); this module is
// the brush: two beaded strands that meet at the tag's hole, brushed metal,
// stamped lines. Hi-DPI aware via the same ratio pattern the map uses.
import {dogTag,DOG_TAG_BRAND} from './dog-tag.mjs?v=20261112-avatar1';

// One beaded strand from (x1,y1) to (x2,y2): a slight sag, then the beads.
function drawBallChain(ctx,x1,y1,x2,y2,bead=3.4,sag=4){
  const steps=Math.max(4,Math.round(Math.hypot(x2-x1,y2-y1)/(bead*1.4)));
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const x=x1+(x2-x1)*t;
    const y=y1+(y2-y1)*t+Math.sin(t*Math.PI)*sag;
    const light=.45+.3*Math.sin(t*9); // alternating bead sheen
    ctx.beginPath();ctx.arc(x,y,bead,0,Math.PI*2);
    ctx.fillStyle=`rgba(${Math.round(196+light*30)},${Math.round(186+light*28)},${Math.round(150+light*26)},1)`;
    ctx.fill();
    ctx.beginPath();ctx.arc(x-bead*.3,y-bead*.3,bead*.34,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,250,225,${.28+light*.3})`;ctx.fill();
  }
  // The connecting wire the beads ride on, visible in the gaps.
  ctx.strokeStyle='rgba(96,88,64,.55)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,(y1+y2)/2+sag,x2,y2);ctx.stroke();
}

// Stamp a line of engraved text: dark imprint plus a bottom highlight, the way
// pressed metal reads.
function stampText(ctx,text,x,y,size,spacing=1.4){
  ctx.save();
  ctx.font=`700 ${size}px Georgia,serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(28,26,20,.88)';
  ctx.fillText(spaced(text,spacing),x,y+size*.06);
  ctx.fillStyle='rgba(233,225,190,.30)';
  ctx.fillText(spaced(text,spacing),x,y+size*.06+1);
  ctx.restore();
}
function spaced(text,spacing){
  if(!text)return text;
  return String(text).split('').join('\u2009'.repeat(Math.max(0,Math.round(spacing))));
}

// Draw the worn tag. `size` is the canvas edge; the tag occupies the lower
// two thirds, the chain hangs from the top edge into the hole.
export function drawDogTagArt(ctx,size,data,{rotation=-.06}={}){
  if(!ctx||!Number.isFinite(size)||size<=0)return;
  const tag=dogTag(data);
  const s=size/100;
  ctx.save();
  ctx.scale(s,s);
  // Chain: both strands drop in from the top corners and meet at the tag hole.
  const hole={x:50,y:33};
  drawBallChain(ctx,26,-6,hole.x,hole.y,3.1,5);
  drawBallChain(ctx,74,-6,hole.x,hole.y,3.1,5);
  // A short loop through the hole itself.
  ctx.strokeStyle='rgba(120,110,80,.8)';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(hole.x,hole.y-1.5,2.6,Math.PI*.1,Math.PI*.9);ctx.stroke();

  ctx.translate(50,64);ctx.rotate(rotation);ctx.translate(-50,-64);
  // Tag plate: rounded rectangle with a corner cut at the hole.
  const plate='#b7a86f';
  ctx.beginPath();
  ctx.moveTo(hole.x,30);
  ctx.lineTo(72,37);ctx.lineTo(75,44);
  ctx.lineTo(75,86);ctx.quadraticCurveTo(75,92,69,92);
  ctx.lineTo(31,92);ctx.quadraticCurveTo(25,92,25,86);
  ctx.lineTo(25,44);ctx.lineTo(28,37);ctx.closePath();
  ctx.fillStyle='rgba(30,26,16,.35)';ctx.save();ctx.translate(1.6,2);ctx.fill();ctx.restore(); // drop shadow
  ctx.fillStyle=plate;ctx.fill();
  // Brushed metal: one broad light band and a darker rim.
  ctx.save();ctx.clip();
  ctx.fillStyle='rgba(255,248,214,.34)';ctx.beginPath();ctx.ellipse(38,58,26,34,-.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(70,60,34,.22)';ctx.beginPath();ctx.ellipse(70,80,16,26,-.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.strokeStyle='rgba(84,74,44,.9)';ctx.lineWidth=1.4;ctx.stroke();
  // The hole gets its own grommet.
  ctx.beginPath();ctx.arc(hole.x,hole.y,3.4,0,Math.PI*2);
  ctx.fillStyle='#8f8352';ctx.fill();ctx.strokeStyle='rgba(60,52,30,.9)';ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.arc(hole.x,hole.y,1.7,0,Math.PI*2);ctx.fillStyle='#1c1912';ctx.fill();

  // Stamped lines: brand, NAME, serial, blood type row.
  stampText(ctx,tag.brand,50,50,4.6,.6);
  stampText(ctx,(tag.name||'UNKNOWN').toUpperCase(),50,60,9.5,1.2);
  stampText(ctx,tag.serial,50,70,5.4,1.6);
  const bottom=[tag.gender==='male'?'M':tag.gender==='female'?'F':null,tag.bloodType].filter(Boolean).join(' · ');
  if(bottom)stampText(ctx,bottom,50,79,4.6,.6);
  // Issue date, small, bottom edge.
  stampText(ctx,tag.issued.text,50,86.5,3.8,.4);
  ctx.restore();
  return tag;
}

// Replace a container's contents with the painted tag. Keeps the same contract
// as dog-tag.mjs renderDogTag: returns the element, stores nothing, and the
// canvas carries the aria-label so screen readers keep the full tag text.
export function renderDogTagArt(document,container,data,{size=180,rotation=-.06,ratio}={}){
  if(!container)return null;
  const scale=Number.isFinite(ratio)?ratio:Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(size*scale);canvas.height=Math.round(size*scale*0.98);
  canvas.className='dog-tag-art';
  const ctx=canvas.getContext&&canvas.getContext('2d');
  let tag=null;
  if(ctx){
    tag=drawDogTagArt(ctx,canvas.width,data,{rotation});
    canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label',`${tag.name} · ${DOG_TAG_BRAND} · ${tag.serial}`);
    canvas.style.width='100%';canvas.style.maxWidth=`${size}px`;canvas.style.height='auto';
  }
  container.replaceChildren(canvas);
  return canvas;
}

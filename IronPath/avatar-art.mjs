// Procedural face painting for the avatar, in the game's painted style: warm
// base tones, one soft top-left light, no outlines. Pure vector shapes on a
// canvas so it stays crisp at every size and needs no new art files - and it
// cannot grow a violet edge, because nothing here was ever cut out of a photo.
//
// The face is drawn into a square (0..size). Everything is derived from the
// avatar options; unknown values are coerced by avatar.mjs before we get here.
import {SKIN_TONES,HAIR_COLORS,EYE_COLORS} from './avatar.mjs?v=20261112-avatar1';

function oval(ctx,x,y,rx,ry,fill,stroke=null,lw=1){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
}

function shade(hex,amount){
  const value=Number.parseInt(hex.slice(1),16);
  const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
  return `rgb(${clamp(((value>>16)&255)+amount)},${clamp(((value>>8)&255)+amount)},${clamp((value&255)+amount)})`;
}

// Draw the painted face. `size` is the edge length in canvas pixels; the caller
// handles devicePixelRatio by passing a scaled size (same pattern as the map).
export function drawAvatarFace(ctx,size,avatar){
  if(!ctx||!Number.isFinite(size)||size<=0||!avatar)return;
  const skin=SKIN_TONES[avatar.skin]??SKIN_TONES[1];
  const hairColor=HAIR_COLORS[avatar.hairColor]??HAIR_COLORS[0];
  const eyeColor=EYE_COLORS[avatar.eyes]??EYE_COLORS[2];
  const male=avatar.gender==='male';
  const s=size/100; // design grid is 100x100
  const face=ctx;
  face.save();
  face.scale(s,s);

  // Backdrop plate: the dossier portrait frame behind the face.
  oval(face,50,50,49,49,'#3a4a36');
  oval(face,50,50,45,45,'#d9c69a');

  // Neck and shoulders, so the head belongs to a uniform.
  face.fillStyle=shade(skin,-38);
  face.beginPath();face.moveTo(38,88);face.lineTo(62,88);face.lineTo(66,100);face.lineTo(34,100);face.closePath();face.fill();
  face.fillStyle='#4d5c40';
  face.beginPath();face.moveTo(24,100);face.quadraticCurveTo(50,74,76,100);face.closePath();face.fill();
  face.fillStyle='#5b6b4b';
  face.beginPath();face.moveTo(31,100);face.quadraticCurveTo(50,80,69,100);face.closePath();face.fill();

  // Ears sit behind the face shape.
  oval(face,26,50,4.5,male?6:5.5,shade(skin,-12));
  oval(face,74,50,4.5,male?6:5.5,shade(skin,-12));

  // Head: a softer jaw for the female face, a squarer one for the male.
  face.fillStyle=skin;
  face.beginPath();
  if(male){face.moveTo(30,42);face.quadraticCurveTo(30,20,50,19);face.quadraticCurveTo(70,20,70,42);face.quadraticCurveTo(70,64,60,72);face.quadraticCurveTo(50,79,40,72);face.quadraticCurveTo(30,64,30,42);}
  else{face.moveTo(31,42);face.quadraticCurveTo(31,19,50,18);face.quadraticCurveTo(69,19,69,42);face.quadraticCurveTo(69,66,59,74);face.quadraticCurveTo(50,80,41,74);face.quadraticCurveTo(31,66,31,42);}
  face.closePath();face.fill();
  // One soft light from the top-left, like every other painted asset.
  face.save();face.globalAlpha=.16;face.fillStyle='#fff7df';
  face.beginPath();face.ellipse(41,34,15,12,-.5,0,Math.PI*2);face.fill();face.restore();
  // Cheek warmth and a brow shadow keep the face from reading flat.
  face.save();face.globalAlpha=male?.10:.14;face.fillStyle='#c96';
  oval(face,36,52,6,4.2,null);oval(face,64,52,6,4.2,null);face.restore();

  // Brows: heavier on the male face.
  face.strokeStyle=shade(hairColor,-14);face.lineWidth=male?3.4:2.6;face.lineCap='round';
  face.beginPath();face.moveTo(34,41.5);face.quadraticCurveTo(40,male?38.4:39.2,46,41);face.stroke();
  face.beginPath();face.moveTo(54,41);face.quadraticCurveTo(60,male?38.4:39.2,66,41.5);face.stroke();

  // Eyes: whites, iris in the chosen colour, lid line, small highlight.
  for(const ex of [40,60]){
    oval(face,ex,49,6.4,4.4,'#f6efdd');
    face.save();face.beginPath();face.ellipse(ex,49,6.4,4.4,0,0,Math.PI*2);face.clip();
    oval(face,ex,49.4,3.6,3.6,eyeColor);
    oval(face,ex,49.4,1.7,1.7,'#1d1a14');
    face.restore();
    face.strokeStyle='#4a382a';face.lineWidth=1.4;
    face.beginPath();face.ellipse(ex,49,6.4,4.4,0,Math.PI*.98,Math.PI*2.02);face.stroke();
    oval(face,ex-1.8,47.4,.9,.9,'#fffbef');
  }

  // Nose: a shadow and a base dot, no outline - painted, not vector-inked.
  face.save();face.globalAlpha=.22;face.fillStyle=shade(skin,-52);
  face.beginPath();face.ellipse(50.8,55.5,2.4,3.4,.2,0,Math.PI*2);face.fill();face.restore();
  face.fillStyle=shade(skin,-38);
  oval(face,49,59,1.9,1.4,shade(skin,-30));

  // Mouth: a calm line with a lower-lip light.
  face.strokeStyle='#7a4a3a';face.lineWidth=2.4;face.lineCap='round';
  face.beginPath();face.moveTo(44,66.5);face.quadraticCurveTo(50,male?68:69.4,56,66.5);face.stroke();
  face.save();face.globalAlpha=.35;oval(face,50,70.5,4.4,1.6,'#c98d76');face.restore();

  drawBeard(face,avatar.beard,skin);
  drawHair(face,avatar.hair,hairColor,male);
  drawExtra(face,avatar.extra,skin);

  face.restore();
}

function drawBeard(face,beard,skin){
  if(!beard||beard==='none')return;
  const tone='rgba(38,30,22,.62)';
  face.save();
  if(beard==='stubble'){
    face.globalAlpha=.16;face.fillStyle='#241b12';
    // A shaded jaw band, dabbed rather than outlined.
    face.beginPath();face.moveTo(33,52);face.quadraticCurveTo(34,74,50,78);face.quadraticCurveTo(66,74,67,52);face.quadraticCurveTo(64,70,50,73);face.quadraticCurveTo(36,70,33,52);face.closePath();face.fill();
    face.globalAlpha=1;
  }else if(beard==='mustache'){
    face.fillStyle=tone;
    face.beginPath();face.moveTo(42,62.5);face.quadraticCurveTo(50,59.5,58,62.5);face.quadraticCurveTo(50,65,42,62.5);face.closePath();face.fill();
  }else if(beard==='full'){
    face.fillStyle='rgba(38,30,22,.8)';
    face.beginPath();face.moveTo(33,50);face.quadraticCurveTo(33,76,50,80);face.quadraticCurveTo(67,76,67,50);face.quadraticCurveTo(66,72,50,75);face.quadraticCurveTo(34,72,33,50);face.closePath();face.fill();
    face.fillStyle=tone;
    face.beginPath();face.moveTo(42,62.5);face.quadraticCurveTo(50,59.5,58,62.5);face.quadraticCurveTo(50,65,42,62.5);face.closePath();face.fill();
    face.save();face.globalAlpha=.2;face.fillStyle='#000';oval(face,50,72,10,4,null);face.restore();
  }
  face.restore();
}

function drawHair(face,style,color,male){
  const dark=shade(color,-26),light=shade(color,30);
  face.save();
  if(style==='buzz'){
    face.fillStyle=shade(color,-8);
    face.beginPath();face.moveTo(29,42);face.quadraticCurveTo(29,17,50,16);face.quadraticCurveTo(71,17,71,42);face.quadraticCurveTo(66,29,50,28);face.quadraticCurveTo(34,29,29,42);face.closePath();face.fill();
  }else if(style==='short'){
    face.fillStyle=color;
    face.beginPath();face.moveTo(28,43);face.quadraticCurveTo(27,15,50,14);face.quadraticCurveTo(73,15,72,43);face.quadraticCurveTo(70,26,52,25);face.quadraticCurveTo(36,26,33,38);face.quadraticCurveTo(31,41,28,43);face.closePath();face.fill();
    face.save();face.globalAlpha=.5;face.fillStyle=light;oval(face,42,22,10,4.5,null);face.restore();
  }else if(style==='side'){
    face.fillStyle=color;
    face.beginPath();face.moveTo(28,44);face.quadraticCurveTo(26,14,50,14);face.quadraticCurveTo(74,14,72,44);face.quadraticCurveTo(72,24,54,23);face.quadraticCurveTo(38,23,34,40);face.quadraticCurveTo(30,44,28,44);face.closePath();face.fill();
    // The parting sweeps from the left brow across.
    face.fillStyle=color;
    face.beginPath();face.moveTo(30,38);face.quadraticCurveTo(44,20,62,26);face.quadraticCurveTo(50,30,44,36);face.quadraticCurveTo(38,42,30,38);face.closePath();face.fill();
    face.save();face.globalAlpha=.35;face.fillStyle=light;oval(face,44,22,9,3.6,null);face.restore();
  }else if(style==='long'){
    face.fillStyle=dark;
    face.beginPath();face.moveTo(26,46);face.quadraticCurveTo(24,14,50,13);face.quadraticCurveTo(76,14,74,46);face.quadraticCurveTo(74,30,50,29);face.quadraticCurveTo(26,30,26,46);face.closePath();face.fill();
    // Long strands fall past the ears onto the shoulders.
    face.fillStyle=color;
    face.beginPath();face.moveTo(26,40);face.quadraticCurveTo(24,70,28,88);face.lineTo(36,88);face.quadraticCurveTo(31,64,33,42);face.closePath();face.fill();
    face.beginPath();face.moveTo(74,40);face.quadraticCurveTo(76,70,72,88);face.lineTo(64,88);face.quadraticCurveTo(69,64,67,42);face.closePath();face.fill();
    face.fillStyle=color;
    face.beginPath();face.moveTo(29,40);face.quadraticCurveTo(30,17,50,15);face.quadraticCurveTo(70,17,71,40);face.quadraticCurveTo(68,25,50,24);face.quadraticCurveTo(32,25,29,40);face.closePath();face.fill();
    face.save();face.globalAlpha=.4;face.fillStyle=light;oval(face,43,20,10,4,null);face.restore();
  }else if(style==='bun'){
    face.fillStyle=color;
    oval(face,50,12,11,8,color);
    face.beginPath();face.moveTo(28,44);face.quadraticCurveTo(27,15,50,15);face.quadraticCurveTo(73,15,72,44);face.quadraticCurveTo(70,26,50,25);face.quadraticCurveTo(30,26,28,44);face.closePath();face.fill();
    face.fillStyle=dark;
    face.beginPath();face.ellipse(50,13.5,9,5.5,0,0,Math.PI*2);face.stroke();
    face.strokeStyle=dark;face.lineWidth=1.6;face.beginPath();face.arc(50,12,10.5,Math.PI*1.05,Math.PI*1.95);face.stroke();
    face.save();face.globalAlpha=.45;face.fillStyle=light;oval(face,44,19,8,3.4,null);face.restore();
  }
  face.restore();
}

function drawExtra(face,extra,skin){
  if(!extra||extra==='none')return;
  face.save();
  if(extra==='scar'){
    face.strokeStyle='rgba(140,84,64,.85)';face.lineWidth=1.6;face.lineCap='round';
    face.beginPath();face.moveTo(62,33);face.lineTo(66,40);face.moveTo(63.6,34.6);face.lineTo(61.2,37.2);face.moveTo(65.6,38.2);face.lineTo(68,40.6);face.stroke();
  }else if(extra==='earring'){
    face.strokeStyle='#e8c56a';face.lineWidth=1.8;
    face.beginPath();face.arc(74,57,2.6,0,Math.PI*2);face.stroke();
    face.fillStyle='#f4da8d';face.beginPath();face.arc(74,54.4,1,0,Math.PI*2);face.fill();
  }else if(extra==='glasses'){
    face.strokeStyle='#3d3428';face.lineWidth=2;
    face.beginPath();face.ellipse(40,49,9,7.4,0,0,Math.PI*2);face.stroke();
    face.beginPath();face.ellipse(60,49,9,7.4,0,0,Math.PI*2);face.stroke();
    face.beginPath();face.moveTo(49,49);face.lineTo(51,49);face.moveTo(31,47.5);face.lineTo(26,46);face.moveTo(69,47.5);face.lineTo(74,46);face.stroke();
    face.save();face.globalAlpha=.14;face.fillStyle='#cfe4df';face.beginPath();face.ellipse(40,47.5,7,5,0,0,Math.PI*2);face.fill();face.beginPath();face.ellipse(60,47.5,7,5,0,0,Math.PI*2);face.fill();face.restore();
  }
  face.restore();
}

// For <img> consumers (the dossier portrait, the soldier screen): render into an
// offscreen canvas and hand back a data URL. Falls back to a plain canvas when
// toDataURL is unavailable (tainted or headless), so callers can still draw.
export function avatarPortrait(avatar,size=192){
  if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
  const canvas=document.createElement('canvas');
  const ratio=Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
  canvas.width=Math.round(size*ratio);canvas.height=Math.round(size*ratio);
  canvas.style.width=size+'px';canvas.style.height=size+'px';
  const ctx=canvas.getContext&&canvas.getContext('2d');
  if(!ctx)return null;
  drawAvatarFace(ctx,canvas.width,avatar);
  try{return canvas.toDataURL('image/png');}catch{return null;}
}

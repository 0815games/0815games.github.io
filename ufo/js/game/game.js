(function(){var c=document.getElementById('game'),x=c.getContext('2d'),box=document.getElementById('message'),L=document.getElementById('level'),S=document.getElementById('score'),T=document.getElementById('targets'),U=document.getElementById('ufoShot'),J=document.getElementById('jetShot'),SL=document.getElementById('slow'),SB=document.getElementById('slowBox'),LU=document.getElementById('levelUp'),W,H,stars=[],meteors=[],objects=[],sparks=[],raiders=[],raidSpawn=0,stolen={},high=[],paused=0,lost=0,jetDown=0,playerName='Spieler',recorded=0,slowUntil=0,moonReady=0,run=0,score=0,level=1,hits=0,spawn=0,last=0,renderGate=0;function resize(){W=innerWidth;H=innerHeight;var settingsProfile=window.UFOGame&&window.UFOGame.settings?window.UFOGame.settings.getGraphicsProfile():null,renderDpr=Math.min(devicePixelRatio||1,settingsProfile?settingsProfile.maxDpr:2);c.width=Math.round(W*renderDpr);c.height=Math.round(H*renderDpr);x.setTransform(renderDpr,0,0,renderDpr,0,0);stars=[];var starCount=settingsProfile?settingsProfile.stars:220;for(var i=0;i<starCount;i++)stars.push({x:Math.random()*W,y:Math.random()*H*.63,r:Math.random()*1.5+.25,a:Math.random(),p:Math.random()*6.28});meteors=[];var meteorCount=settingsProfile?settingsProfile.meteors:5;for(var m=0;m<meteorCount;m++)meteors.push({x:Math.random()*W,y:Math.random()*H*.42,p:Math.random()*24000});if(window.UFOGame&&window.UFOGame.landscapeCache&&typeof window.UFOGame.landscapeCache.rebuild==="function"){window.UFOGame.landscapeCache.rebuild({width:W,height:H,dpr:renderDpr,quality:settingsProfile?settingsProfile.id:"mid"});}}addEventListener('resize',resize);addEventListener('ufo:graphics-change',function(){resize()});resize();try{high=JSON.parse(localStorage.getItem('ufoScores')||'[]').map(function(v){return typeof v==='object'?v:{name:'Spieler',score:v}})}catch(e){high=[]}function cheer(){LU.className='';void LU.offsetWidth;LU.className='celebrate';sound('ufo')}function ui(){L.textContent=level;S.textContent=score;T.textContent=hits+'/'+(7+level);U.textContent=hits;J.textContent=jetDown+'/5'}function slowUi(t){var left=Math.max(0,slowUntil-t),cool=Math.max(0,moonReady-t);SL.textContent=left?Math.ceil(left/1000)+'s':cool?'bereit in '+Math.ceil(cool/1000)+'s':'bereit';SB.style.display='inline'}function sound(kind){
try{
if(
window.UFOGame&&
window.UFOGame.audio&&
typeof window.UFOGame.audio.playSfx==='function'
){
window.UFOGame.audio.playSfx(kind);
return;
}
}catch(error){
console.warn('Audio Manager Fehler:',error);
}
}function chooseFlightType(){

var pool=['straight'];

if(level>=1){
pool.push('wave');
}

if(level>=2){
pool.push('climb');
}

if(level>=3){
pool.push('dive');
}

if(level>=4){
pool.push('zigzag');
}

if(level>=5){
pool.push('hover');
}

/*
 * Straight bleibt bewusst häufiger vertreten,
 * damit das Flugbild nicht vollständig chaotisch wird.
 */

if(Math.random()<.28){
return 'straight';
}

return pool[
Math.floor(
Math.random()*pool.length
)
];

}

function getSizeClass(z){

if(z<.42){
return 'small';
}

if(z<.64){
return 'medium';
}

return 'large';

}

function getSizeSpeedFactor(sizeClass){

if(sizeClass==='small'){
return 1.22;
}

if(sizeClass==='large'){
return .80;
}

return 1;

}

function updateFlight(d,t,dt){

/*
 * Jets verwenden weiterhin ihre bisherige,
 * gut lesbare lineare Flugbahn.
 */

if(d.jet){

d.x+=d.v*dt;

return;

}

if(!d.flightType){
d.flightType='straight';
}

if(!d.sizeClass){
d.sizeClass=getSizeClass(d.z);
}

if(
typeof d.baseY!=='number'
){
d.baseY=d.y;
}

var age=
Math.max(
0,
(t-d.born)/1000
);

var mobile=
matchMedia(
'(pointer:coarse)'
).matches;

var amplitude=
mobile
?Math.min(18,H*.035)
:Math.min(36,H*.055);

var verticalRange=
mobile
?Math.min(H*.13,82)
:Math.min(H*.22,165);

var speedFactor=
getSizeSpeedFactor(
d.sizeClass
);

var horizontalFactor=1;

if(d.flightType==='hover'){

/*
 * Hover-UFOs bremsen kurz ab und setzen
 * anschließend ihren Flug fort.
 */

var hoverCycle=
age%4.8;

horizontalFactor=
hoverCycle<1.35
?.16
:1;

}

d.x+=
d.v*
speedFactor*
horizontalFactor*
dt;

if(d.flightType==='straight'){

d.y=d.baseY;

}

else if(d.flightType==='wave'){

d.y=
d.baseY+
Math.sin(
age*2.35+d.p
)*
amplitude;

}

else if(d.flightType==='dive'){

var diveProgress=
Math.min(
1,
age/4.2
);

d.y=
d.baseY+
Math.sin(
diveProgress*Math.PI*.72
)*
verticalRange;

}

else if(d.flightType==='climb'){

var climbProgress=
Math.min(
1,
age/4.5
);

d.y=
d.baseY-
Math.sin(
climbProgress*Math.PI*.72
)*
verticalRange*.72;

}

else if(d.flightType==='zigzag'){

var zigzag=
Math.asin(
Math.sin(
age*3.25+d.p
)
)/
(Math.PI/2);

d.y=
d.baseY+
zigzag*
amplitude*.92;

}

else if(d.flightType==='hover'){

var hoverCycle=
age%4.8;

var hoverPulse=
hoverCycle<1.35
?Math.sin(
hoverCycle/1.35*Math.PI
)*amplitude*.45
:Math.sin(
age*1.7+d.p
)*amplitude*.18;

d.y=
d.baseY+
hoverPulse;

}

/*
 * UFOs bleiben innerhalb des sichtbaren
 * Luftkorridors und geraten nicht ins HUD
 * oder tief in die Landschaft.
 */

var minimumY=
mobile
?72
:62;

var maximumY=
Math.max(
minimumY+30,
H*.57
);

d.y=
Math.max(
minimumY,
Math.min(
maximumY,
d.y
)
);

}function add(){var used={},free=[];for(var i=0;i<objects.length;i++)if(objects[i].steal&&objects[i].target!==null)used[objects[i].target]=1;for(var n=0;n<10;n++)if(!stolen[n]&&!used[n])free.push(n);var mobile=matchMedia('(pointer:coarse)').matches,jet=Math.random()<(mobile?.12:.19),steal=!jet&&free.length>0&&Math.random()<(mobile?.68:.42),z=.26+Math.random()*.54,s=64*z;objects.push({x:Math.random()>.5?-s:W+s,y:70+Math.random()*H*.42,z:z,v:(105+Math.random()*105+(level-1)*24)*(1+(score<20000?Math.floor(score/5000):4+Math.floor((score-20000)/100000))*.3)*(Math.random()>.5?1:-1),jet:jet,steal:steal,target:steal?free[Math.floor(Math.random()*free.length)]:null,born:performance.now(),beamAt:performance.now()+1800,p:Math.random()*7});

var spawnedObject=
objects[
objects.length-1
];

spawnedObject.baseY=
spawnedObject.y;

spawnedObject.flightType=
spawnedObject.jet
?'straight'
:chooseFlightType();

spawnedObject.sizeClass=
getSizeClass(
spawnedObject.z
);

spawnedObject.baseV=
spawnedObject.v;

}function ellipse(a,b,rx,ry,fill){x.fillStyle=fill;x.beginPath();x.ellipse(a,b,rx,ry,0,0,Math.PI*2);x.fill()}function jet(d,t){var s=64*d.z,dir=d.v>0?1:-1;x.save();x.translate(d.x,d.y+Math.sin(t/390+d.p)*s*.035);x.scale(dir,1);x.rotate(-.035);x.shadowColor='#6bcffa';x.shadowBlur=s*.18;var m=x.createLinearGradient(0,-s*.85,0,s*.5);m.addColorStop(0,'#e7f4f4');m.addColorStop(.25,'#91aab6');m.addColorStop(.65,'#425d6d');m.addColorStop(1,'#1b2c39');x.fillStyle=m;x.beginPath();x.moveTo(-s*1.75,0);x.lineTo(s*1.6,0);x.lineTo(s*.68,-s*.16);x.lineTo(s*.32,-s*.8);x.lineTo(-s*.12,-s*.76);x.lineTo(-s*.4,-s*.15);x.lineTo(-s*1.12,-s*.6);x.lineTo(-s*.92,-s*.08);x.closePath();x.fill();x.fillStyle='#263f50';x.beginPath();x.moveTo(-s*.36,-s*.68);x.quadraticCurveTo(s*.13,-s*.84,s*.42,-s*.17);x.lineTo(-s*.25,-s*.18);x.closePath();x.fill();x.fillStyle='#0c263b';x.beginPath();x.moveTo(-s*.84,-s*.13);x.lineTo(-s*.08,-s*.14);x.lineTo(-s*.52,s*.48);x.lineTo(-s*1.08,s*.15);x.closePath();x.fill();x.strokeStyle='#e6ffff88';x.lineWidth=Math.max(1,s*.025);x.beginPath();x.moveTo(-s*1.54,-s*.02);x.lineTo(s*1.43,-s*.02);x.stroke();x.fillStyle='#ff4f48';ellipse(-s*1.35,0,s*.1,s*.1,'#ff514b');x.fillStyle='#8fffff';ellipse(s*.27,-s*.35,s*.065,s*.065,'#8fffff');x.restore()}function ufo(d,t){var s=48*d.z,y=d.y+Math.sin(t/460+d.p)*s*.07;x.save();x.translate(d.x,y);if(d.steal&&d.target!==null&&t>d.beamAt){stolen[d.target]=1;var remaining=10-Object.keys(stolen).length;if(remaining<=0&&!lost){lost=1;run=0;box.style.display='flex';box.innerHTML='<div class="card"><div class="alien" aria-label="tanzendes Alien">👽</div><h1>MISSION VERLOREN</h1><p>Loser! Die UFOs waren schneller.</p><button id="start">NOCH EINMAL</button><div class="scores"><b>HIGHSCORES</b><ol id="scores"></ol></div></div>';document.getElementById('start').onclick=reset;saveScore();showScores()}var places=[[.07,.755],[.11,.73],[.18,.745],[.25,.765],[.33,.75],[.43,.735],[.53,.765],[.64,.755],[.72,.735],[.76,.77],[.82,.755],[.88,.72],[.95,.75]],p0=places[d.target],ground=H*p0[1]-y,lift=Math.min(1,(t-d.beamAt)/(3500/(1+(score<20000?Math.floor(score/5000):4+Math.floor((score-20000)/100000))*.3)));if(lift>=1){var left=10-Object.keys(stolen).length;if(left<=0&&!lost){lost=1;run=0;box.style.display='flex';box.innerHTML='<div class="card"><div class="alien" aria-label="tanzendes Alien">👽</div><h1>MISSION VERLOREN</h1><p>Loser! Die UFOs waren schneller.</p><button id="start">NOCH EINMAL</button><div class="scores"><b>HIGHSCORES</b><ol id="scores"></ol></div></div>';document.getElementById('start').onclick=reset;saveScore();showScores()}}var ax=(W*p0[0]-d.x)*(1-lift),ay=ground*(1-lift)+s*.42*lift,red=x.createLinearGradient(0,s*.18,ax,ay);red.addColorStop(0,'rgba(255,244,210,.9)');red.addColorStop(.28,'rgba(255,75,55,.78)');red.addColorStop(1,'rgba(255,35,25,.06)');x.fillStyle=red;x.beginPath();x.moveTo(-s*.32,s*.2);x.lineTo(ax+s*.28,ay);x.lineTo(ax-s*.28,ay);x.lineTo(s*.32,s*.2);x.closePath();x.fill();x.strokeStyle='rgba(255,125,92,.95)';x.lineWidth=1;x.beginPath();x.moveTo(0,s*.16);x.lineTo(ax,ay);x.stroke();x.save();x.translate(ax,ay);x.globalAlpha=.92;x.shadowColor='#ff4538';x.shadowBlur=10;var cow=true;if(cow){ellipse(-s*.04,0,s*.48,s*.22,'#eee7d7');ellipse(s*.38,-s*.12,s*.15,s*.14,'#eee7d7');ellipse(-s*.14,0,s*.12,s*.08,'#573d2d');ellipse(s*.18,s*.06,s*.1,s*.065,'#573d2d')}else{ellipse(0,0,s*.4,s*.22,'#f3f0df');ellipse(s*.31,-s*.06,s*.13,s*.12,'#5c5549')}x.strokeStyle='#ded4bc';x.lineWidth=Math.max(1,s*.035);x.beginPath();x.moveTo(-s*.18,s*.1);x.lineTo(-s*.14,s*.34);x.moveTo(s*.1,s*.1);x.lineTo(s*.14,s*.34);x.stroke();x.restore();x.save();x.globalAlpha=.25+.12*Math.sin(t/130+d.p);x.strokeStyle='#c9ffff';x.lineWidth=Math.max(1,s*.018);x.beginPath();x.ellipse(0,s*.02,s*1.58,s*.44,0,0,7);x.stroke();x.restore()}var beam=x.createRadialGradient(0,s*.32,s*.05,0,s*.32,s*2.25);beam.addColorStop(0,'rgba(202,255,255,.8)');beam.addColorStop(.22,'rgba(67,221,255,.3)');beam.addColorStop(1,'rgba(42,130,255,0)');x.fillStyle=beam;x.beginPath();x.ellipse(0,s*.32,s*2.15,s*.94,0,0,7);x.fill();x.shadowColor='#55eaff';x.shadowBlur=s*.72;var hull=x.createLinearGradient(0,-s*.58,0,s*.54);hull.addColorStop(0,'#c5d6dd');hull.addColorStop(.14,'#718795');hull.addColorStop(.5,'#1b2934');hull.addColorStop(1,'#060d14');x.fillStyle=hull;x.beginPath();x.ellipse(0,0,s*1.68,s*.5,0,0,7);x.fill();x.save();x.globalAlpha=.22;x.fillStyle='#eaffff';for(var pl=-1;pl<=1;pl++){x.beginPath();x.ellipse(pl*s*.55,-s*.12,s*.24,s*.05,0,0,7);x.fill()}x.restore();x.fillStyle='#071019';x.beginPath();x.ellipse(0,-s*.07,s*1.4,s*.31,0,0,7);x.fill();var dome=x.createRadialGradient(-s*.2,-s*.5,s*.04,0,-s*.34,s*.75);dome.addColorStop(0,'#f0ffff');dome.addColorStop(.16,'#91eff5');dome.addColorStop(.56,'#236880');dome.addColorStop(1,'#092233');x.fillStyle=dome;x.beginPath();x.ellipse(0,-s*.34,s*.59,s*.36,0,Math.PI,0,true);x.fill();x.strokeStyle='#d7fbff88';x.lineWidth=Math.max(1,s*.028);x.beginPath();x.ellipse(0,0,s*1.55,s*.4,0,0,7);x.stroke();for(var i=-2;i<=2;i++){ellipse(i*s*.5,s*.22,s*.09,s*.075,i===0?'#ebff87':'#77edff')}x.restore()}function animals(t){var taken={};for(var n=0;n<objects.length;n++)if(objects[n].steal&&t>objects[n].beamAt)taken[objects[n].target]=1;var herd=[[W*.07,H*.755,.3,'cow'],[W*.11,H*.73,.48,'cow'],[W*.18,H*.745,.28,'cow'],[W*.25,H*.765,.34,'cow'],[W*.33,H*.75,.25,'cow'],[W*.43,H*.735,.42,'cow'],[W*.53,H*.765,.27,'cow'],[W*.64,H*.755,.32,'cow'],[W*.72,H*.735,.29,'cow'],[W*.76,H*.77,.25,'cow'],[W*.82,H*.755,.27,'sheep'],[W*.88,H*.72,.5,'cow'],[W*.95,H*.75,.27,'sheep'],[W*.04,H*.79,.22,'sheep'],[W*.15,H*.785,.21,'sheep'],[W*.22,H*.78,.24,'cow'],[W*.30,H*.79,.2,'sheep'],[W*.38,H*.775,.23,'cow'],[W*.48,H*.79,.2,'sheep'],[W*.57,H*.78,.24,'cow'],[W*.69,H*.79,.21,'sheep'],[W*.79,H*.79,.22,'cow'],[W*.91,H*.785,.2,'sheep']].slice(0,10);for(var i=0;i<herd.length;i++){if(taken[i]||stolen[i])continue;var a=herd[i],xx=a[0],yy=a[1],s=a[2]*38,bob=Math.sin(t/700+i)*s*.025;x.save();x.translate(xx,yy+bob);x.globalAlpha=.93;if(a[3]==='cow'){var fur=x.createLinearGradient(0,-s,0,s);fur.addColorStop(0,'#f3eee1');fur.addColorStop(1,'#cfc4ae');x.fillStyle=fur;x.beginPath();x.ellipse(-s*.12,0,s*1.12,s*.48,0,0,7);x.fill();x.fillStyle='#f4efe1';x.beginPath();x.ellipse(s*.88,-s*.2,s*.36,s*.34,0,0,7);x.fill();x.fillStyle='#503a2c';x.beginPath();x.ellipse(-s*.34,-s*.04,s*.28,s*.19,0,0,7);x.ellipse(s*.18,s*.13,s*.25,s*.15,0,0,7);x.ellipse(s*.84,-s*.18,s*.1,s*.09,0,0,7);x.fill();x.fillStyle='#35251d';x.beginPath();x.arc(s*.98,-s*.29,Math.max(1,s*.045),0,7);x.fill();x.strokeStyle='#594235';x.lineWidth=Math.max(1,s*.065);for(var q=-.62;q<.75;q+=.42){x.beginPath();x.moveTo(q*s,s*.27);x.lineTo(q*s,s*.75);x.stroke()}x.strokeStyle='#c9b290';x.lineWidth=Math.max(1,s*.045);x.beginPath();x.moveTo(s*1.03,-s*.42);x.lineTo(s*1.18,-s*.58);x.moveTo(s*.8,-s*.43);x.lineTo(s*.7,-s*.58);x.stroke()}else{var wool=x.createRadialGradient(-s*.2,-s*.2,s*.04,0,0,s*1.1);wool.addColorStop(0,'#fffdf0');wool.addColorStop(.68,'#e7e4d6');wool.addColorStop(1,'#b9b7aa');x.fillStyle=wool;for(var z=-.45;z<=.45;z+=.23){x.beginPath();x.arc(z*s,-s*.03,s*.34,0,7);x.fill()}x.fillStyle='#5a5a50';x.beginPath();x.ellipse(s*.78,-s*.07,s*.28,s*.25,0,0,7);x.fill();x.fillStyle='#1b1d1a';x.beginPath();x.arc(s*.88,-s*.14,Math.max(1,s*.035),0,7);x.fill();x.strokeStyle='#494a40';x.lineWidth=Math.max(1,s*.06);for(var r=-.35;r<.6;r+=.38){x.beginPath();x.moveTo(r*s,s*.25);x.lineTo(r*s,s*.65);x.stroke()}}x.restore()}}function pets(t){var phase=Math.floor(t/12000)%3;if(phase!==1)return;var p=(t%12000)/12000,xx=W*(.12+p*.72),yy=H*.775+Math.sin(p*18)*3;x.save();x.translate(xx,yy);x.globalAlpha=.94;var dog=p<.55,s=13;if(dog){x.fillStyle='#a97948';x.beginPath();x.ellipse(0,0,s*1.05,s*.45,0,0,7);x.fill();x.beginPath();x.ellipse(s*.88,-s*.25,s*.34,s*.3,0,0,7);x.fill();x.fillStyle='#4b3020';x.beginPath();x.moveTo(s*.8,-s*.43);x.lineTo(s*.95,-s*.7);x.lineTo(s*1.04,-s*.38);x.fill();x.strokeStyle='#563823';x.lineWidth=2;x.beginPath();x.moveTo(-s*.45,s*.25);x.lineTo(-s*.45,s*.65);x.moveTo(s*.3,s*.25);x.lineTo(s*.3,s*.65);x.stroke()}else{x.fillStyle='#9a9da5';x.beginPath();x.ellipse(0,0,s*.86,s*.4,0,0,7);x.fill();x.beginPath();x.ellipse(s*.72,-s*.2,s*.29,s*.26,0,0,7);x.fill();x.beginPath();x.moveTo(s*.55,-s*.35);x.lineTo(s*.62,-s*.66);x.lineTo(s*.78,-s*.36);x.lineTo(s*.9,-s*.66);x.lineTo(s*1.02,-s*.3);x.fill();x.strokeStyle='#747780';x.lineWidth=2;x.beginPath();x.moveTo(-s*.4,s*.2);x.lineTo(-s*.4,s*.57);x.moveTo(s*.28,s*.2);x.lineTo(s*.28,s*.57);x.stroke()}x.restore()}function walkers(t,dt){raidSpawn+=dt;if(raidSpawn>10+Math.random()*5&&raiders.length<1){var free=[];for(var n=0;n<10;n++)if(!stolen[n])free.push(n);if(free.length){var target=free[Math.floor(Math.random()*free.length)],side=Math.random()<.5?-1:1;raiders.push({x:side<0?-28:W+28,y:H*.78,target:target,dir:side<0?1:-1,speed:58+level*4,p:Math.random()*7,carry:false});raidSpawn=0}}for(var i=raiders.length-1;i>=0;i--){var a=raiders[i],tx=a.carry?(a.dir>0?W+42:-42):W*([.07,.11,.18,.25,.33,.43,.53,.64,.72,.76][a.target]);a.x+=Math.sign(tx-a.x)*a.speed*dt;if(!a.carry&&Math.abs(tx-a.x)<8){a.carry=true;stolen[a.target]=1;sound("ufo")}if(a.carry&&(a.x<-35||a.x>W+35)){raiders.splice(i,1);continue}x.save();x.translate(a.x,a.y+Math.sin(t*.018+a.p)*2);x.scale(a.dir,1);x.shadowColor="#74ff9a";x.shadowBlur=10;x.fillStyle="#75d95a";x.beginPath();x.ellipse(0,-13,8,10,0,0,7);x.fill();x.fillStyle="#142b24";x.beginPath();x.ellipse(-3,-14,2,3,0,0,7);x.ellipse(3,-14,2,3,0,0,7);x.fill();x.strokeStyle="#75d95a";x.lineWidth=3;x.lineCap="round";var k=Math.sin(t*.03+a.p)*5;x.beginPath();x.moveTo(0,-4);x.lineTo(0,7);x.moveTo(0,0);x.lineTo(k,-1);x.moveTo(0,0);x.lineTo(-k,-1);x.moveTo(0,7);x.lineTo(k,15);x.moveTo(0,7);x.lineTo(-k,15);x.stroke();if(a.carry){x.fillStyle="#eee7d7";x.beginPath();x.ellipse(13,-1,10,5,0,0,7);x.fill();x.fillStyle="#573d2d";x.beginPath();x.ellipse(17,-2,2.5,2,0,0,7);x.fill();x.strokeStyle="#ded4bc";x.lineWidth=1.5;x.beginPath();x.moveTo(7,2);x.lineTo(7,7);x.moveTo(15,2);x.lineTo(15,7);x.stroke()}x.restore()}}function etHit(px,py){var t=performance.now(),cycle=Math.floor(t/17000)%3;if(cycle!==0)return false;var p=(t%17000)/17000,ex=-70+p*(W+140),ey=H*.26+Math.sin(p*Math.PI)*34;if(Math.abs(px-ex)<28&&Math.abs(py-ey)<38&&!lost){lost=1;run=0;box.style.display='flex';box.innerHTML='<div class="card"><div class="alien">👽</div><h1>MISSION VERLOREN</h1><p>Du hast E.T. getroffen.</p><button id="start">NOCH EINMAL</button><div class="scores"><b>HIGHSCORES</b><ol id="scores"></ol></div></div>';document.getElementById('start').onclick=reset;saveScore();showScores();return true}return false}function cyclist(t){var cycle=Math.floor(t/17000)%3;if(cycle!==0)return;var p=(t%17000)/17000,xx=-70+p*(W+140),yy=H*.26+Math.sin(p*Math.PI)*34,ss=.5;x.save();x.translate(xx,yy);x.scale(ss,ss);x.globalAlpha=.82;x.strokeStyle='#16150d';x.lineWidth=3;x.beginPath();x.arc(-14,13,11,0,7);x.arc(15,13,11,0,7);x.moveTo(-14,13);x.lineTo(-1,-3);x.lineTo(15,13);x.lineTo(-8,13);x.lineTo(5,3);x.lineTo(-1,-3);x.lineTo(11,-3);x.stroke();x.fillStyle='#866c4e';x.beginPath();x.ellipse(-2,-24,12,16,0,0,7);x.fill();x.fillStyle='#b89b74';x.beginPath();x.ellipse(8,-43,9,8,0,0,7);x.fill();x.strokeStyle='#b89b74';x.lineWidth=4;x.beginPath();x.moveTo(4,-16);x.lineTo(13,-3);x.stroke();x.restore()}function landscape(t){
var settingsObject=
window.UFOGame&&
window.UFOGame.settings
?window.UFOGame.settings
:null;

var quality=
settingsObject&&
typeof settingsObject.getGraphics==='function'
?settingsObject.getGraphics()
:'mid';

var profile=
settingsObject&&
typeof settingsObject.getGraphicsProfile==='function'
?settingsObject.getGraphicsProfile()
:null;

var cache=
window.UFOGame&&
window.UFOGame.landscapeCache
?window.UFOGame.landscapeCache
:null;

var currentDpr=
Math.min(
devicePixelRatio||1,
profile&&profile.maxDpr
?profile.maxDpr
:2
);

if(
cache&&
typeof cache.draw==='function'&&
typeof cache.rebuild==='function'
){

var cacheStats=
typeof cache.getStats==='function'
?cache.getStats()
:null;

if(
!cacheStats||
!cacheStats.valid||
cacheStats.width!==W||
cacheStats.height!==H||
Math.abs(cacheStats.dpr-currentDpr)>.01||
cacheStats.quality!==quality
){

cache.rebuild({
width:W,
height:H,
dpr:currentDpr,
quality:quality
});

}

cache.draw(
x,
W,
H
);

}else{

var fallbackSky=
x.createLinearGradient(
0,
0,
0,
H
);

fallbackSky.addColorStop(
0,
'#01020c'
);

fallbackSky.addColorStop(
.48,
'#0a1c43'
);

fallbackSky.addColorStop(
.68,
'#29436a'
);

fallbackSky.addColorStop(
1,
'#020904'
);

x.fillStyle=
fallbackSky;

x.fillRect(
0,
0,
W,
H
);

}


/*
 * B: Animierte Umgebung.
 */

var aurora=
x.createLinearGradient(
0,
H*.12,
W,
H*.48
);

aurora.addColorStop(
0,
'rgba(36,255,186,0)'
);

aurora.addColorStop(
.35,
quality==='low'
?'rgba(48,224,190,.07)'
:'rgba(48,224,190,.16)'
);

aurora.addColorStop(
.62,
quality==='low'
?'rgba(95,107,255,.06)'
:'rgba(95,107,255,.14)'
);

aurora.addColorStop(
1,
'rgba(40,135,255,0)'
);

x.fillStyle=
aurora;

x.beginPath();

x.moveTo(
0,
H*.18
);

x.bezierCurveTo(
W*.24,
H*.1,
W*.34,
H*.43,
W*.58,
H*.23
);

x.bezierCurveTo(
W*.75,
H*.05,
W*.87,
H*.32,
W,
H*.14
);

x.lineTo(
W,
H*.48
);

x.bezierCurveTo(
W*.78,
H*.38,
W*.67,
H*.6,
W*.45,
H*.4
);

x.bezierCurveTo(
W*.2,
H*.53,
W*.14,
H*.25,
0,
H*.43
);

x.closePath();
x.fill();


var cloudCount=
quality==='low'
?2
:quality==='mid'
?4
:6;

var cloudGradient=
x.createLinearGradient(
0,
H*.28,
0,
H*.48
);

cloudGradient.addColorStop(
0,
'rgba(35,63,103,0)'
);

cloudGradient.addColorStop(
.5,
quality==='low'
?'rgba(95,142,184,.055)'
:'rgba(95,142,184,.13)'
);

cloudGradient.addColorStop(
1,
'rgba(35,63,103,0)'
);

x.fillStyle=
cloudGradient;

for(
var cloudIndex=0;
cloudIndex<cloudCount;
cloudIndex++
){

x.beginPath();

x.ellipse(
(
cloudIndex*W*.23+
t*.006*
(cloudIndex%2?1:-1)
)%W,
H*
(
.31+
(cloudIndex%3)*.06
),
W*.19,
H*.035,
0,
0,
Math.PI*2
);

x.fill();

}


/*
 * Sterne bleiben live, weil sie funkeln.
 */

for(
var starIndex=0;
starIndex<stars.length;
starIndex++
){

var star=
stars[starIndex];

var alpha=
.35+
.55*
Math.abs(
Math.sin(
t/1200+
star.p
)
);

x.fillStyle=
'rgba(230,246,255,'+
alpha+
')';

x.fillRect(
star.x,
star.y,
star.r,
star.r
);

}


/*
 * Meteore bleiben live.
 */

for(
var meteorIndex=0;
meteorIndex<meteors.length;
meteorIndex++
){

var meteor=
meteors[meteorIndex];

var meteorTime=
(
t+
meteor.p
)%24000;

if(
meteorTime<850
){

var progress=
meteorTime/850;

var meteorX=
(
meteor.x+
progress*W*.28
)%W;

var meteorY=
meteor.y+
progress*H*.14;

x.save();

x.globalAlpha=
1-progress;

x.strokeStyle=
'#b9efff';

x.shadowColor=
'#68dfff';

x.shadowBlur=
quality==='high'
?12
:quality==='mid'
?6
:0;

x.lineWidth=2;

x.beginPath();

x.moveTo(
meteorX-W*.055,
meteorY-H*.028
);

x.lineTo(
meteorX,
meteorY
);

x.stroke();
x.restore();

}

}


/*
 * Dynamische Glühwürmchen.
 */

var fireflyCount=
quality==='low'
?6
:quality==='mid'
?12
:24;

for(
var firefly=0;
firefly<fireflyCount;
firefly++
){

var fireflyX=
(
firefly*151+
t*.012*
(firefly%3+1)
)%W;

var fireflyY=
H*.71+
(
firefly*31
)%Math.max(
1,
H*.18
);

x.fillStyle=
'rgba(185,255,115,'+
(
.16+
.16*
Math.sin(
t/500+
firefly
)
)+
')';

x.shadowColor=
'#baff73';

x.shadowBlur=
quality==='high'
?6
:quality==='mid'
?3
:0;

x.beginPath();

x.arc(
fireflyX,
fireflyY,
1.2,
0,
Math.PI*2
);

x.fill();

}

x.shadowBlur=0;


/*
 * Dynamischer Staub.
 */

var dustCount=
quality==='low'
?10
:quality==='mid'
?25
:40;

for(
var dust=0;
dust<dustCount;
dust++
){

var dustX=
(
dust*193+
t*.004*
(dust%4+1)
)%W;

var dustY=
H*.73+
(
dust*37
)%Math.max(
1,
H*.24
);

x.fillStyle=
'rgba(155,201,125,'+
(
.03+
(dust%5)*.012
)+
')';

x.beginPath();

x.arc(
dustX,
dustY,
1+
(dust%3)*.5,
0,
Math.PI*2
);

x.fill();

}


/*
 * C: Gameplay-nahe Umgebungsobjekte bleiben vollständig live.
 */

animals(t);
pets(t);
cyclist(t);

}function qualitySparkCount(base){var sparkProfile=window.UFOGame&&window.UFOGame.settings?window.UFOGame.settings.getGraphicsProfile():null,sparkScale=sparkProfile?sparkProfile.sparkScale:.85;return Math.max(4,Math.round(base*sparkScale))}function particles(){var particleProfile=window.UFOGame&&window.UFOGame.settings?window.UFOGame.settings.getGraphicsProfile():null,particleShadowScale=particleProfile?particleProfile.shadowScale:.85;for(var i=sparks.length-1;i>=0;i--){var p=sparks[i];p.life-=.025;if(p.life<=0){sparks.splice(i,1);continue}x.save();x.globalAlpha=p.life;x.fillStyle=p.col;x.shadowColor=p.col;x.shadowBlur=14*particleShadowScale;x.beginPath();x.arc(p.x+p.dx*(1-p.life)*40,p.y+p.dy*(1-p.life)*40,8*p.life,0,7);x.fill();x.restore()}}function frame(t){var targetFrameFps=window.UFOGame&&window.UFOGame.settings&&typeof window.UFOGame.settings.getTargetFps==='function'?window.UFOGame.settings.getTargetFps():60,minimumFrameInterval=1000/targetFrameFps-1;if(t-renderGate<minimumFrameInterval){requestAnimationFrame(frame);return}renderGate=t;var dt=Math.min(.05,(t-last)/1000||0);if(slowUntil>t)dt*=.25;slowUi(t);if(paused){requestAnimationFrame(frame);return}last=t;landscape(t);if(run)walkers(t,dt);if(run&&!paused){spawn+=dt;var need=7+level;if(spawn>Math.max(.18,(.82-level*.04)*(1/(1+(score<20000?Math.floor(score/5000):4+Math.floor((score-20000)/100000))*.22)))&&hits<need){add();if(Math.random()<(matchMedia('(pointer:coarse)').matches?.68:.42))add();spawn=0}objects.forEach(function(d){updateFlight(d,t,dt)});for(var i=objects.length-1;i>=0;i--)if(objects[i].x<-170||objects[i].x>W+170)objects.splice(i,1);if(hits>=need&&objects.length===0){level++;hits=0;jetDown=0;cheer();ui()}}objects.sort(function(a,b){return a.z-b.z}).forEach(function(d){d.jet?jet(d,t):ufo(d,t)});particles();requestAnimationFrame(frame)}function renderScores(list){
var q=document.getElementById('scores');
if(!q)return;

q.replaceChildren();

if(!list||!list.length){
var empty=document.createElement('li');
empty.textContent='Noch kein Eintrag';
q.appendChild(empty);
return;
}

list.forEach(function(v,index){
var li=document.createElement('li');

var medal=
index===0?'🥇 ':
index===1?'🥈 ':
index===2?'🥉 ':'';

var points=Number(v.score||0).toLocaleString('de-DE');

li.textContent=
medal+
String(v.name||'Spieler')+
' — '+
points+
' Punkte';

if(
v.uid &&
window.ufoFirebase &&
window.ufoFirebase.user &&
v.uid===window.ufoFirebase.user.uid
){
li.style.color='#ffffff';
li.style.textShadow='0 0 10px #5deaff';
}

q.appendChild(li);
});
}

function showScores(){

if(
window.UfoHighscores &&
typeof window.UfoHighscores.load==='function'
){

window.UfoHighscores
.load()
.catch(function(error){

console.warn(
'Globaler Highscore aktuell nicht erreichbar:',
error
);

/*
 * Nur im Offline-Fall zeigen wir den alten
 * lokalen Cache als Fallback.
 */
var q=document.getElementById('scores');

if(q){
q.replaceChildren();

if(!high.length){

var empty=document.createElement('li');
empty.textContent='Globaler Highscore offline';
q.appendChild(empty);

}else{

high.forEach(function(v){

var li=document.createElement('li');

li.textContent=
String(v.name||'Spieler')+
' — '+
Number(v.score||0).toLocaleString('de-DE')+
' Punkte';

q.appendChild(li);

});

}

}

});

return;
}

}function saveScore(){

if(score<=0||recorded)return;

recorded=1;

var cleanName=
String(playerName||'Spieler')
.trim()
.replace(/\s+/g,' ')
.slice(0,18);

if(!cleanName){
cleanName='Spieler';
}

var cleanScore=
Math.floor(Number(score));

if(
!Number.isFinite(cleanScore)||
cleanScore<=0||
cleanScore>10000000
){
console.warn(
'Ungültiger Highscore:',
cleanScore
);
return;
}


/*
 * Lokaler Cache ist ab jetzt NUR ein
 * Offline-Fallback.
 */

high.push({
name:cleanName,
score:cleanScore
});

high.sort(function(a,b){
return b.score-a.score;
});

high=high.slice(0,10);

try{
localStorage.setItem(
'ufoScores',
JSON.stringify(high)
);
}catch(e){}


/*
 * Primärer Speicherort ist Firebase.
 *
 * Der Service wartet automatisch auf
 * Anonymous Authentication.
 */

if(
window.UfoHighscores &&
typeof window.UfoHighscores.submit==='function'
){

window.UfoHighscores
.submit(
cleanName,
cleanScore
)

.then(function(){

showScores();

})

.catch(function(error){

console.error(
'Globaler Highscore konnte nicht gespeichert werden:',
error
);

showScores();

});

}else{

console.error(
'Globaler Highscore-Service ist nicht verfügbar.'
);

}

}function reset(){

var playerValidation=
window.UFOGame&&
window.UFOGame.playerValidation;

if(
playerValidation&&
typeof playerValidation.validate==='function'
){

var playerResult=
playerValidation.validate();

if(!playerResult.valid){
return;
}

playerName=
playerResult.name;

}else{

var requiredPlayerInput=
document.getElementById('player');

var requiredPlayerName=
requiredPlayerInput
?requiredPlayerInput.value.trim()
:'';

if(!requiredPlayerName){
return;
}

playerName=
requiredPlayerName.slice(0,18);

}if(matchMedia('(pointer:coarse)').matches&&!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(function(){});var pi=document.getElementById('player');if(pi&&pi.value.trim())playerName=pi.value.trim();saveScore();recorded=0;sound('hit');lost=0;paused=0;document.getElementById('pause').textContent='PAUSE';objects=[];sparks=[];raiders=[];raidSpawn=0;stolen={};slowUntil=0;moonReady=0;score=0;level=1;hits=0;jetDown=0;spawn=0;run=1;box.style.display='none';c.focus();showScores();ui()}c.addEventListener('pointerdown',function(e){c.focus();if(!run)return;var r=c.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,tap=e.pointerType==='touch'?1.65:1;for(var w=raiders.length-1;w>=0;w--){var a=raiders[w];if(Math.abs(px-a.x)<16*tap&&Math.abs(py-a.y)<28*tap){score+=350;if(a.carry)delete stolen[a.target];raiders.splice(w,1);for(var z=0;z<qualitySparkCount(28);z++)sparks.push({x:a.x,y:a.y,dx:Math.random()*2-1,dy:Math.random()*2-1,life:1,col:'#75ff8b'});sound('hit');ui();return}}for(var i=objects.length-1;i>=0;i--){var d=objects[i],s=(d.jet?64:48)*d.z;if(Math.abs(px-d.x)<s*1.75*tap&&Math.abs(py-d.y)<s*tap){if(d.jet){score-=150;jetDown++;sound('jet');if(jetDown>=5&&!lost){lost=1;run=0;box.style.display='flex';box.innerHTML='<div class="card"><div class="alien" aria-label="tanzendes Alien">👽</div><h1>MISSION VERLOREN</h1><p>Du hast in diesem Level 5 Flugzeuge abgeschossen.</p><button id="start">NOCH EINMAL</button><div class="scores"><b>HIGHSCORES</b><ol id="scores"></ol></div></div>';document.getElementById('start').onclick=reset;saveScore();showScores()}}else{sound(d.steal?'ufo':'hit');if(d.steal)delete stolen[d.target];var reward=d.steal?500:Math.round((1.3-d.z)*500)*level;score+=reward;hits++}for(var q=0;q<qualitySparkCount(44);q++)sparks.push({x:d.x,y:d.y,dx:Math.random()*2-1,dy:Math.random()*2-1,life:1,col:d.jet?'#ff674d':'#8efbff'});objects.splice(i,1);ui();break}}if(run){if(Math.abs(px-W*.8)<48*tap&&Math.abs(py-H*.15)<48*tap&&performance.now()>=moonReady){slowUntil=performance.now()+5000;moonReady=slowUntil+5000;sound('ufo')}else etHit(px,py)}});function showSheet(){document.getElementById('sheet').className='show'}function hideSheet(){document.getElementById('sheet').className='';if(paused){paused=0;last=performance.now();document.getElementById('pause').textContent='PAUSE'}}document.getElementById('start').onclick=reset;showScores();document.getElementById('closeSheet').onclick=hideSheet;function toggleSheet(){if(!run)return;if(!paused){paused=1;document.getElementById('pause').textContent='WEITER';showSheet()}else hideSheet()}function handleKey(e){var k=(e.key||'').toLowerCase();if((k==='a'||k==='p'||e.code==='KeyA'||e.code==='KeyP')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){var a=document.activeElement;if(a&&/^(input|textarea|select)$/i.test(a.tagName))return;e.preventDefault();e.stopPropagation();toggleSheet()}}document.addEventListener('keydown',handleKey,true);document.getElementById('pause').onclick=function(){if(!run)return;paused=!paused;last=performance.now();this.textContent=paused?'WEITER':'PAUSE'};document.getElementById('quit').onclick=function(){if(!run)return;run=0;paused=0;objects=[];box.style.display='flex';box.innerHTML='<div class="card"><h1>SPIEL BEENDET</h1><p>Deine Mission wurde beendet.</p><button id="start">NEUE MISSION</button><button id="menu" style="margin-left:10px">ZUM STARTMENÜ</button></div>';document.getElementById('start').onclick=reset;document.getElementById('menu').onclick=function(){box.innerHTML='<div class="card"><h1>UFO-JAGD</h1><div class="intro"><b>Einsatzbriefing</b><br>Verteidige die 10 Kühe gegen UFOs. Triff UFOs, rette Kühe aus roten Strahlen und meide die Jets. Der Mond löst Zeitlupe aus.</div><input id="player" class="name" maxlength="18" placeholder="Dein Name" autocomplete="nickname"><button id="start">MISSION STARTEN</button><div class="scores"><b>HIGHSCORES</b><ol id="scores"></ol></div></div>';document.getElementById('start').onclick=reset;showScores()}};ui();requestAnimationFrame(frame)})();

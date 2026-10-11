(function(){
const S=window.SITE,I=window.ILL,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement,home=!!$('#book'),base=document.body.dataset.base||'';
let saved=null;try{saved=localStorage.getItem('theme')}catch(e){}
root.dataset.theme=saved||'light';
function setTheme(t){root.dataset.theme=t;try{localStorage.setItem('theme',t)}catch(e){}const l=$('.lamp');if(l){l.setAttribute('aria-checked',t==='dark');l.setAttribute('aria-label',t==='dark'?'Licht einschalten (Hell-Modus)':'Licht ausschalten (Dark-Modus)')}const m=$('meta[name=theme-color]');if(m)m.content=t==='dark'?'#0b1220':'#2563eb'}
const links=[['index.html#kurse','Kurse'],['termine.html','Termine'],['leistungen.html','Leistungen'],['links.html','Downloads'],['kontakt.html','Kontakt']];
const hdr=document.createElement('header');hdr.className='top';
hdr.innerHTML=`<div class="wrap"><a class="brand" href="${base}index.html" aria-label="@-learning Startseite"><img src="${base}assets/logo.svg" alt=""><div><div><span>@</span>-learning</div><small>Weiterbildung</small></div></a><button class="burger" aria-label="Menü" aria-expanded="false">☰</button><nav><ul>${links.map(l=>`<li><a href="${base}${l[0]}">${l[1]}</a></li>`).join('')}</ul></nav></div>`;
document.body.prepend(hdr);
const lamp=document.createElement('div');lamp.className='lamp';lamp.tabIndex=0;lamp.setAttribute('role','switch');
lamp.innerHTML=`<div class="cone"></div><svg viewBox="0 0 64 120" aria-hidden="true"><line x1="32" y1="0" x2="32" y2="12" stroke="var(--mut)" stroke-width="2"/><path class="shade" d="M12 38L22 12H42L52 38Z"/><circle class="bulb" cx="32" cy="42" r="8"/><g class="cord"><line x1="32" y1="50" x2="32" y2="84" stroke="var(--mut)" stroke-width="2" stroke-dasharray="1.5 2"/><circle cx="32" cy="90" r="6" fill="var(--blue)" stroke="var(--ink)" stroke-width="1.5"/></g></svg><div class="lamp-hint">zieh mich →</div>`;
document.body.prepend(lamp);
const prog=document.createElement('div');prog.className='progress';document.body.prepend(prog);
setTheme(root.dataset.theme);
const cord=$('.cord',lamp);let sy=null,pulled=0;
function toggle(){cord.style.transform='translateY(12px)';setTimeout(()=>cord.style.transform='',140);setTheme(root.dataset.theme==='dark'?'light':'dark');$('.lamp-hint',lamp).style.opacity=0}
lamp.addEventListener('pointerdown',e=>{sy=e.clientY;pulled=0;cord.classList.add('drag');lamp.setPointerCapture(e.pointerId)});
lamp.addEventListener('pointermove',e=>{if(sy===null)return;pulled=Math.max(0,Math.min(26,e.clientY-sy));cord.style.transform=`translateY(${pulled}px)`});
lamp.addEventListener('pointerup',()=>{if(sy===null)return;cord.classList.remove('drag');const tap=pulled<4;sy=null;if(pulled>12||tap)toggle();else cord.style.transform=''});
lamp.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
const nav=$('nav',hdr),bur=$('.burger',hdr);
bur.onclick=()=>{const o=nav.classList.toggle('open');bur.setAttribute('aria-expanded',o);bur.textContent=o?'✕':'☰'};
$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');bur.textContent='☰'}));
const cur0=location.pathname.split('/').pop()||'index.html';
$$('a',nav).forEach(a=>{if(a.getAttribute('href')===cur0)a.classList.add('on')});
const ft=$('#footer');
if(ft){const d=document.createElement('a');d.className='door';d.href=base+'admin.html';d.title='Verwaltung';d.setAttribute('aria-label','Verwaltung (Login)');d.innerHTML='<svg viewBox="0 0 32 40" width="22" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M4 38V4h24v34"/><path d="M2 38h28"/><path class="panel" d="M7 36V7h18v29z" fill="currentColor" fill-opacity=".15"/><circle class="knob" cx="21" cy="22" r="1.6" fill="currentColor"/></svg>';ft.querySelector('.wrap').append(d)}addEventListener('scroll',()=>{prog.style.width=scrollY/Math.max(1,root.scrollHeight-innerHeight)*100+'%'},{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
window.observeRv=()=>$$('.rv:not(.in)').forEach(e=>io.observe(e));
$$('[data-phone]').forEach(e=>{e.textContent=S.contact.phone;e.href='tel:'+S.contact.phoneHref});
$$('[data-mail]').forEach(e=>{e.textContent=S.contact.email;e.href='mailto:'+S.contact.email});
if(!home){observeRv();return}
$('#facts').innerHTML=[['2006','Seit 2006 am Start, zertifiziert nach DIN EN ISO 9001:2015'],['75 %','der Kosten trägt im Regelfall der Staat (Meister-BAföG & KfW)'],['16–20','Teilnehmer pro Kurs, individuelle Betreuung'],['40','erfahrene, praxisorientierte Dozenten']].map(f=>`<div class="fact rv"><div class="n">${f[0]}</div><p>${f[1]}</p></div>`).join('');
$('#steps').innerHTML=S.steps.map(s=>`<div class="step rv"><h3>${s.t}</h3><p>${s.d}</p></div>`).join('');
$('#pillars').innerHTML=S.pillars.map(p=>`<div class="pillar rv"><h3>${p[0]}</h3><p>${p[1]}</p></div>`).join('');
$('#faqlist').innerHTML=S.faq.map(f=>`<details class="rv"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');
const sel=$('#fcourse');Object.values(S.courses).forEach(k=>sel.insertAdjacentHTML('beforeend',`<option>${k.name}</option>`));sel.insertAdjacentHTML('beforeend','<option>Allgemeine Beratung</option>');
const book=$('#book'),n=S.categories.length;
const list=c=>`<ul class="clist">${c.courses.map(id=>{const k=S.courses[id];return `<li><span class="ab">${k.ab}</span><b><a href="${base}kurs.html?k=${id}">${k.name}</a></b><span>${k.short}</span></li>`}).join('')}</ul>`;
const textPage=(c,i)=>`<div class="ill-inline">${I[c.ill]}</div><div class="kicker">${c.kicker}</div><h3>${c.title}</h3><p>${c.intro}</p>${list(c)}<span class="pg">${i*2+1}</span>`;
const illPage=(key,i,cap)=>`<div class="ill">${I[key]}</div><div class="kicker" style="text-align:center">${cap}</div><span class="pg">${i*2}</span>`;
const cl=S.closing;
const leaves=[{f:`<div class="at">@</div><h3>learning</h3><small>Blättere durch unsere Kurse ↓</small>`,fc:'cover',b:illPage(S.categories[0].ill,1,S.categories[0].title)}];
S.categories.forEach((c,i)=>leaves.push({f:textPage(c,i+1),fc:'lines',b:i+1<n?illPage(S.categories[i+1].ill,i+2,S.categories[i+1].title):illPage(cl.ill,i+2,cl.kicker)}));
leaves.push({f:`<div class="ill-inline">${I[cl.ill]}</div><div class="kicker">${cl.kicker}</div><h3>${cl.title}</h3><p>${cl.text}</p><a class="btn" style="margin-top:auto;justify-content:center" href="${base}kontakt.html">Beratung vereinbaren</a>`,fc:'lines',b:''});
book.innerHTML=`<div class="base-l"></div><div class="base-r"></div>`+leaves.map(l=>`<div class="leaf"><div class="face front ${l.fc}">${l.f}</div><div class="face back lines">${l.b}</div></div>`).join('');
const L=$$('.leaf',book),F=leaves.length-1,wrap=$('#bookwrap'),bl=$('.base-l',book);
wrap.style.height=(F+1)*90+'vh';
const dots=$('#dots');dots.innerHTML=Array.from({length:F+1},(_,k)=>`<button aria-label="Seite ${k+1}"></button>`).join('');
const mq=matchMedia('(max-width:760px)'),sm=t=>t*t*t*(t*(6*t-15)+10);
const target=()=>Math.min(Math.max(0,(scrollY-wrap.offsetTop)/(wrap.offsetHeight-innerHeight)),1)*F;
let cur=target(),run=false;
function render(p){const m=mq.matches;
 L.forEach((el,i)=>{const t=Math.min(1,Math.max(0,p-i));
  el.style.transform=`rotateY(${-180*sm(t)}deg)`;el.style.zIndex=t<.5?L.length-i:i+1;el.style.setProperty('--s',Math.sin(Math.PI*t).toFixed(3));
  el.style.opacity=m?Math.min(1,Math.max(0,(.62-t)/.22)):1;el.style.visibility=m&&t>=.84?'hidden':'visible';el.style.pointerEvents=(t>=1||(m&&t>.5))?'none':'auto'});
 const e=sm(Math.min(p,1));if(!m)book.style.transform=`translateX(${25*(1-e)}%)`;bl.style.opacity=e;
 const k=Math.round(p);$$('button',dots).forEach((b,j)=>b.classList.toggle('on',j===k))}
function loop(){const t=target(),d=t-cur;cur+=d*.085;if(Math.abs(d)<.0008){cur=t;run=false}render(cur);if(run)requestAnimationFrame(loop)}
const kick=()=>{if(!run){run=true;requestAnimationFrame(loop)}};
$$('button',dots).forEach((b,k)=>b.onclick=()=>scrollTo({top:wrap.offsetTop+(k/F)*(wrap.offsetHeight-innerHeight)+2,behavior:'smooth'}));
addEventListener('scroll',kick,{passive:true});addEventListener('resize',()=>{cur=target();render(cur)});render(cur);
observeRv();
$('#cform').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target);const body=`Name: ${d.get('name')}\nTelefon: ${d.get('tel')||'-'}\nInteresse: ${d.get('course')}\n\n${d.get('msg')}`;location.href=`mailto:${S.contact.email}?subject=${encodeURIComponent('Anfrage Weiterbildung: '+d.get('course'))}&body=${encodeURIComponent(body)}`});
})();

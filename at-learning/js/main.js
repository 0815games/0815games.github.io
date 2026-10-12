(function(){
let prevOn=false;
try{if(localStorage.getItem('sitePreview')==='1'){const d=JSON.parse(localStorage.getItem('siteDraft')||'null');if(d){window.SITE=Object.assign({},window.SITE,d);prevOn=true}}}catch(e){}
const S=window.SITE,I=window.ILL,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const AT='M41.00222717149221 50.13363028953229Q41.00222717149221 55.61247216035635 43.34075723830735 58.775055679287306Q45.67928730512249 61.937639198218264 49.68819599109131 61.937639198218264Q53.652561247216035 61.937639198218264 56.01336302895323 58.75278396436526Q58.374164810690424 55.56792873051225 58.374164810690424 50.13363028953229Q58.374164810690424 44.74387527839643 55.99109131403118 41.60356347438753Q53.60801781737194 38.46325167037862 49.59910913140312 38.46325167037862Q45.67928730512249 38.46325167037862 43.34075723830735 41.60356347438753Q41.00222717149221 44.74387527839643 41.00222717149221 50.13363028953229ZM59.26503340757238 63.54120267260579Q57.928730512249444 66.70378619153675 54.96659242761693 68.46325167037861Q52.00445434298441 70.22271714922049 48.04008908685969 70.22271714922049Q40.37861915367483 70.22271714922049 35.5902004454343 64.67706013363028Q30.801781737193764 59.13140311804008 30.801781737193764 50.222717149220486Q30.801781737193764 41.31403118040089 35.61247216035635 35.74610244988864Q40.42316258351893 30.17817371937639 48.04008908685969 30.17817371937639Q52.00445434298441 30.17817371937639 54.96659242761693 31.95991091314031Q57.928730512249444 33.74164810690423 59.26503340757238 36.90423162583519V31.069042316258347H68.57461024498886V61.937639198218264Q74.09799554565703 61.0913140311804 77.26057906458799 56.614699331848556Q80.42316258351894 52.1380846325167 80.42316258351894 45.14476614699332Q80.42316258351894 40.690423162583514 79.1314031180401 36.792873051224944Q77.83964365256125 32.89532293986637 75.21158129175947 29.643652561247215Q70.97995545657017 24.209354120267257 64.6325167037862 21.26948775055679Q58.28507795100223 18.329621380846326 50.89086859688196 18.329621380846326Q45.72383073496659 18.329621380846326 41.00222717149221 19.688195991091312Q36.28062360801782 21.0467706013363 32.271714922049 23.674832962138083Q25.679287305122493 28.040089086859687 22.00445434298441 34.96659242761692Q18.329621380846326 41.89309576837416 18.329621380846326 49.9554565701559Q18.329621380846326 56.5924276169265 20.71269487750557 62.40534521158129Q23.095768374164813 68.21826280623608 27.59465478841871 72.67260579064587Q32.04899777282851 77.03786191536749 37.817371937639194 79.33184855233853Q43.58574610244989 81.62583518930957 50.13363028953229 81.62583518930957Q55.74610244988864 81.62583518930957 61.358574610244986 79.53229398663697Q66.97104677060133 77.43875278396436 70.93541202672606 73.87527839643653L75.70155902004456 81.0913140311804Q70.1336302895323 85.4120267260579 63.56347438752785 87.70601336302894Q56.99331848552338 90.0 50.22271714922049 90.0Q41.98218262806236 90.0 34.67706013363029 87.08240534521158Q27.37193763919822 84.16481069042317 21.670378619153674 78.59688195991092Q15.968819599109132 73.02895322939867 12.984409799554566 65.70155902004454Q10.0 58.37416481069042 10.0 49.9554565701559Q10.0 41.84855233853006 13.028953229398663 34.498886414253896Q16.057906458797326 27.14922048997773 21.670378619153674 21.58129175946548Q27.28285077951002 16.057906458797326 34.74387527839644 13.028953229398663Q42.204899777282854 10.0 50.22271714922049 10.0Q60.20044543429844 10.0 68.35189309576838 13.808463251670378Q76.5033407572383 17.616926503340757 81.98218262806236 24.788418708240535Q85.32293986636972 29.15367483296214 87.03786191536749 34.25389755011136Q88.75278396436525 39.354120267260576 88.75278396436525 44.96659242761692Q88.75278396436525 57.03786191536748 81.49220489977728 63.71937639198218Q74.2316258351893 70.40089086859687 61.0022271714922 70.40089086859687H59.26503340757238Z';
const atSvg=cls=>`<svg class="${cls}" viewBox="8 8 84 84" aria-hidden="true"><path fill="currentColor" d="${AT}"/></svg>`;
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
if(ft){const c=S.contact;ft.innerHTML=`<footer><div class="wrap"><div><b>@-learning</b><br>${c.street}, ${c.city}<br><a href="tel:${c.phoneHref}">${c.phone}</a> · <a href="mailto:${c.email}">${c.email}</a><br>© ${new Date().getFullYear()} @Learning</div><nav>${[['termine.html','Start neuer Kurse'],['leistungen.html','Leistungen'],['dozentensuche.html','Dozentensuche'],['zulassung.html','Zulassung'],['buchtipps.html','Buchtipps'],['aktionen.html','Sonderaktionen'],['links.html','Downloads & Links'],['kontakt.html','Kontakt'],['impressum.html','Impressum'],['datenschutz.html','Datenschutz']].map(l=>`<a href="${base}${l[0]}">${l[1]}</a>`).join('')}</nav></div></footer>`}
if(ft&&ft.querySelector('.wrap')){const d=document.createElement('a');d.className='door';d.href=base+'admin.html';d.title='Verwaltung';d.setAttribute('aria-label','Verwaltung (Login)');d.innerHTML='<svg viewBox="0 0 32 40" width="22" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M4 38V4h24v34"/><path d="M2 38h28"/><path class="dpanel" d="M7 36V7h18v29z" fill="currentColor" fill-opacity=".15"/><circle class="knob" cx="21" cy="22" r="1.6" fill="currentColor"/></svg>';ft.querySelector('.wrap').append(d)}
if(prevOn&&!document.body.classList.contains('adm')){const b=document.createElement('div');b.setAttribute('style','position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:200;background:#f59e0b;color:#000;padding:8px 14px;border-radius:99px;font:600 13px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.3);display:flex;gap:10px;align-items:center;max-width:92vw');b.innerHTML='Vorschau-Modus: Entwurf, nur in diesem Browser <button style="border:0;background:#000;color:#fff;border-radius:99px;padding:4px 10px;cursor:pointer;font:inherit">Beenden</button>';b.querySelector('button').onclick=()=>{localStorage.removeItem('sitePreview');location.reload()};document.body.append(b)}
addEventListener('scroll',()=>{prog.style.width=scrollY/Math.max(1,root.scrollHeight-innerHeight)*100+'%'},{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
window.observeRv=()=>$$('.rv:not(.in)').forEach(e=>io.observe(e));
$$('[data-phone]').forEach(e=>{e.textContent=S.contact.phone;e.href='tel:'+S.contact.phoneHref});
$$('[data-mail]').forEach(e=>{e.textContent=S.contact.email;e.href='mailto:'+S.contact.email});
if(!home){observeRv();return}
const lk=document.createElement('link');lk.rel='stylesheet';lk.href=base+'css/book.css';document.head.append(lk);
const ba=$('.bigat');if(ba)ba.innerHTML=atSvg('atbig');
$('#facts').innerHTML=[['2006','Seit 2006 am Start, zertifiziert nach DIN EN ISO 9001:2015'],['75 %','der Kosten trägt im Regelfall der Staat (Meister-BAföG & KfW)'],['16–20','Teilnehmer pro Kurs, individuelle Betreuung'],['40','erfahrene, praxisorientierte Dozenten']].map(f=>`<div class="fact rv"><div class="n">${f[0]}</div><p>${f[1]}</p></div>`).join('');
$('#steps').innerHTML=S.steps.map(s=>`<div class="step rv"><h3>${s.t}</h3><p>${s.d}</p></div>`).join('');
$('#pillars').innerHTML=S.pillars.map(p=>`<div class="pillar rv"><h3>${p[0]}</h3><p>${p[1]}</p></div>`).join('');
$('#faqlist').innerHTML=S.faq.map(f=>`<details class="rv"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');
const sel=$('#fcourse');Object.values(S.courses).forEach(k=>sel.insertAdjacentHTML('beforeend',`<option>${k.name}</option>`));sel.insertAdjacentHTML('beforeend','<option>Allgemeine Beratung</option>');
const book=$('#book'),n=S.categories.length;
const list=c=>`<ul class="clist">${c.courses.filter(id=>S.courses[id]).map(id=>{const k=S.courses[id];return `<li><span class="ab">${k.ab}</span><b><a href="${base}kurs.html?k=${id}">${k.name}</a></b><span>${k.short||''}</span></li>`}).join('')}</ul>`;
const textPage=(c,i)=>`<div class="ill-inline">${I[c.ill]||''}</div><div class="kicker">${c.kicker}</div><h3>${c.title}</h3><p>${c.intro}</p>${list(c)}<span class="pg">${i*2+1}</span>`;
const illPage=(key,i,cap)=>`<div class="ill">${I[key]||''}</div><div class="kicker" style="text-align:center">${cap}</div><span class="pg">${i*2}</span>`;
const cl=S.closing;
const leaves=[{f:`${atSvg('atlogo')}<h3>learning</h3><small>Blättere durch unsere Kurse ↓</small>`,fc:'cover',b:illPage(S.categories[0].ill,1,S.categories[0].title)}];
S.categories.forEach((c,i)=>leaves.push({f:textPage(c,i+1),fc:'lines',b:i+1<n?illPage(S.categories[i+1].ill,i+2,S.categories[i+1].title):illPage(cl.ill,i+2,cl.kicker)}));
leaves.push({f:`<div class="ill-inline">${I[cl.ill]||''}</div><div class="kicker">${cl.kicker}</div><h3>${cl.title}</h3><p>${cl.text}</p><a class="btn" style="margin-top:auto;justify-content:center" href="${base}kontakt.html">Beratung vereinbaren</a>`,fc:'lines',b:''});
book.innerHTML=`<div class="base-l"></div><div class="base-r"></div>`+leaves.map(l=>`<div class="leaf"><div class="face front ${l.fc}">${l.f}</div><div class="face back lines">${l.b}</div></div>`).join('')+`<div class="rings">${Array.from({length:8},(_,i)=>`<span style="top:${(i+.5)*12.5}%"></span>`).join('')}</div>`;
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

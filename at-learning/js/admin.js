(function(){
const HASH="03afe87fb114c93fc612b89212053e44121a8802591a373e6c0f0568368eb253",SALT="atl|";
const $=(s,r=document)=>r.querySelector(s);
function h(tag,a,kids){const e=document.createElement(tag);for(const k in(a||{})){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e[k]=a[k];else if(a[k]!==undefined&&a[k]!==false)e.setAttribute(k,a[k]===true?'':a[k])}(kids||[]).concat().forEach(c=>e.append(c&&c.nodeType?c:document.createTextNode(c==null?'':c)));return e}
async function sha(s){if(!(crypto&&crypto.subtle))throw new Error('Kein sicherer Kontext: bitte über https oder localhost öffnen.');const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const curHash=()=>localStorage.getItem('admHash')||HASH;
/* ---------- Login ---------- */
let fails=0,lock=0;
$('#lf').onsubmit=async e=>{e.preventDefault();const m=$('#lmsg');if(Date.now()<lock){m.textContent='Bitte kurz warten ('+Math.ceil((lock-Date.now())/1000)+' s).';return}
 try{const hh=await sha(SALT+$('#lu').value.trim()+'|'+$('#lp').value);if(hh===curHash()){sessionStorage.setItem('adm','1');start()}else{fails++;m.textContent='Benutzername oder Passwort falsch.';if(fails>=3)lock=Date.now()+Math.min(60,fails*5)*1000}}catch(err){m.textContent=err.message}};
$('#lo').onclick=()=>{sessionStorage.removeItem('adm');location.reload()};
if(sessionStorage.getItem('adm')==='1')start();
function start(){$('#login').hidden=true;$('#app').hidden=false;init()}

/* ---------- Daten ---------- */
const DEF_LEGAL={"impressum": "<h2>@Learning</h2><p>Inhaber: Dipl. Ing. (FH) Frank Neugebauer<br>Robert-Bosch-Strasse 7-9<br>73207 Plochingen</p><p>Telefon: 07153/6191-220/221<br>E-Mail: info@at-learning.de oder at-learning@gmx.de</p><h2>Haftung für Inhalte</h2><p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität übernehmen wir jedoch keine Gewähr. Eine Haftung ist erst ab Kenntnis einer konkreten Rechtsverletzung möglich; bei Bekanntwerden entfernen wir diese Inhalte umgehend.</p><h2>Haftung für Links</h2><p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Verantwortlich ist stets der jeweilige Anbieter.</p><h2>Urheberrecht</h2><p>Die durch die Seitenbetreiber erstellten Inhalte unterliegen dem deutschen Urheberrecht. Downloads und Kopien sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>", "datenschutz": "<p>Der Schutz persönlicher Daten hat bei uns hohe Priorität. Wir halten uns an BDSG und DSGVO.</p><h2>Verantwortlicher</h2><p>@Learning, Tim Ohnmeiss MSc, Robert-Bosch-Strasse 7-9, 73207 Plochingen<br>Telefon: 07153/6191-220/221, E-Mail: info@at-learning.de</p><h2>Server-Logfiles</h2><p>Bei der informatorischen Nutzung werden nur Daten verarbeitet, die dein Browser übermittelt (Seite, Zeitpunkt, Datenmenge, Referrer, Browser, Betriebssystem, IP-Adresse). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p><h2>Kontaktaufnahme</h2><p>Das Kontaktformular öffnet dein E-Mail-Programm; Daten werden erst mit dem Versand deiner E-Mail übermittelt.</p><h2>Cookies und lokale Speicherung</h2><p>Wir verwenden keine Cookies und kein Tracking. Die Dark-Mode-Wahl wird lokal im Browser gespeichert.</p><h2>Deine Rechte</h2><ul><li>Widerruf einer Einwilligung</li><li>Auskunft, Berichtigung, Löschung</li><li>Einschränkung der Verarbeitung, Datenübertragbarkeit</li><li>Beschwerde bei einer Aufsichtsbehörde</li></ul>"};
let D,state={tab:'termine',cid:null};
function init(){let dr=null;try{dr=JSON.parse(localStorage.getItem('siteDraft')||'null')}catch(e){}
 D=dr||JSON.parse(JSON.stringify(window.SITE));D.legal=D.legal||JSON.parse(JSON.stringify(DEF_LEGAL));D.termine=D.termine||[];state.cid=Object.keys(D.courses)[0];
 if(dr)$('#dirty').hidden=false;
 const T=[['termine','Termine'],['kurse','Kurse & Lerninhalte'],['kapitel','Buch-Kapitel'],['texte','Texte & Kontakt'],['recht','Impressum & Datenschutz'],['pub','Veröffentlichen'],['json','Experte']];
 const tb=$('#tabs');tb.innerHTML='';T.forEach(t=>tb.append(h('button',{'data-t':t[0],onclick:()=>{state.tab=t[0];render()}},[t[1]])));render()}
let st;function save(){clearTimeout(st);st=setTimeout(()=>{localStorage.setItem('siteDraft',JSON.stringify(D));$('#dirty').hidden=false},250)}
function render(){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===state.tab));const p=$('#panel');p.innerHTML='';p.append(TABS[state.tab]())}
/* ---------- Eingabe-Helfer ---------- */
function F(label,o,k,opt){opt=opt||{};let i;
 if(opt.area){i=h('textarea',{rows:opt.rows||4})}else if(opt.sel){i=h('select',{},opt.sel.map(v=>h('option',{value:v},[v])))}else i=h('input',{type:opt.type||'text'});
 i.value=o[k]==null?'':o[k];i.oninput=()=>{o[k]=opt.type==='number'?(i.value===''?undefined:+i.value):i.value;if(opt.type==='number'&&o[k]===undefined)delete o[k];save()};
 return h('label',{class:'f'},[label,i])}
function LA(label,get,set,rows,hint){const t=h('textarea',{rows:rows||5});t.value=get();t.oninput=()=>{set(t.value.split('\n').map(x=>x.trim()).filter(Boolean));save()};return h('label',{class:'f'},[label+(hint?'  ('+hint+')':''),t])}
const J=a=>(a||[]).join('\n'),P=a=>(a||[]).map(r=>r.join(' | ')).join('\n'),UP=ls=>ls.map(l=>l.split('|').map(x=>x.trim()));
const card=(t,kids)=>h('div',{class:'card'},[h('h3',{},[t])].concat(kids));
const btn=(t,fn,c)=>h('button',{class:'btn sm '+(c||''),type:'button',onclick:fn},[t]);
const msg=(t,c)=>h('div',{class:'msg '+(c||'')},[t]);
const wrapG=kids=>h('div',{class:'g'},kids);
/* ---------- Tabs ---------- */
const TABS={};
TABS.termine=()=>{const r=h('div');r.append(msg('Diese Termine erscheinen auf „Start neuer Kurse“ und den Kursseiten. Beendete Kurse (Ende in der Vergangenheit) werden automatisch ausgeblendet.'));
 const ids=Object.keys(D.courses);
 D.termine.forEach((t,i)=>{r.append(card((t.label||'Neuer Termin')+' · '+(t.nr||''),[wrapG([F('Kurs',t,'c',{sel:ids}),F('Bezeichnung',t,'label'),F('Kurs-Nr.',t,'nr'),F('Beginn',t,'start',{type:'date'}),F('Ende',t,'end',{type:'date'}),F('UE',t,'ue',{type:'number'}),F('Beratung Tel.-Endung',t,'tel',{sel:['220','221']})]),btn('Löschen',()=>{if(confirm('Termin löschen?')){D.termine.splice(i,1);save();render()}},'red')]))});
 r.append(btn('+ Neuer Termin',()=>{D.termine.push({c:ids[0],label:'',nr:'',start:'',end:'',ue:850,tel:'221'});save();render()}));return r};
TABS.kurse=()=>{const r=h('div'),ids=Object.keys(D.courses);if(!D.courses[state.cid])state.cid=ids[0];const c=D.courses[state.cid];
 const sel=h('select',{onchange:e=>{state.cid=e.target.value;render()}},ids.map(i=>h('option',{value:i,selected:i===state.cid},[i+' – '+D.courses[i].name])));
 r.append(h('div',{class:'row'},[h('div',{style:'min-width:260px;flex:1'},[sel]),btn('+ Neuer Kurs',()=>{const id=(prompt('Kurz-ID (a-z, ohne Leerzeichen):')||'').toLowerCase().replace(/[^a-z0-9]/g,'');if(!id||D.courses[id])return alert('ID leer oder schon vorhanden');D.courses[id]={ab:id.toUpperCase(),name:'Neuer Kurs',short:'',intro:'',tel:'220',parts:[]};state.cid=id;save();render()}),btn('Kurs löschen',()=>{if(confirm('Kurs "'+c.name+'" löschen?')){delete D.courses[state.cid];D.categories.forEach(k=>k.courses=k.courses.filter(x=>x!==state.cid));D.termine=D.termine.filter(t=>t.c!==state.cid);state.cid=null;save();render()}},'red')]));
 r.append(card('Grunddaten',[wrapG([F('Kürzel',c,'ab'),F('Name',c,'name'),F('Kurzbeschreibung (Buch)',c,'short'),F('DQR-Niveau',c,'dqr'),F('Englische IHK-Bezeichnung',c,'en'),F('Tel.-Endung',c,'tel',{sel:['220','221']}),F('UE gesamt',c,'ue',{type:'number'}),F('IHK-Empfehlung UE',c,'ueIhk',{type:'number'})]),F('Einleitung',c,'intro',{area:1,rows:5}),F('Hinweis',c,'note',{area:1,rows:3}),h('label',{class:'f'},[h('span',{},['']),h('span',{},[(()=>{const cb=h('input',{type:'checkbox'});cb.checked=!!c.pending;cb.onchange=()=>{c.pending=cb.checked;if(!c.pending)delete c.pending;save()};return cb})(),' Lerninhalte noch nicht vorhanden („im Beratungsgespräch“ anzeigen)'])])]));
 if(c.steps)r.append(card('Ablauf-Schritte',[LA('Ein Schritt pro Zeile',()=>J(c.steps),a=>c.steps=a,6)]));
 const pc=h('div');(c.parts||[]).forEach((p,i)=>pc.append(card('Teil '+(i+1)+': '+(p.t||''),[wrapG([F('Titel',p,'t'),F('UE',p,'ue',{type:'number'})]),LA('Lerninhalte, eine Zeile pro Punkt',()=>J(p.items),a=>p.items=a,6),btn('Teil löschen',()=>{c.parts.splice(i,1);save();render()},'red')])));
 r.append(h('h2',{},['Lerninhalte']),pc,btn('+ Teil hinzufügen',()=>{(c.parts=c.parts||[]).push({t:'Neuer Teil',ue:0,items:[]});save();render()}));return r};
TABS.kapitel=()=>{const r=h('div');r.append(msg('So ist das Buch auf der Startseite aufgebaut. Kurs-IDs kommagetrennt, Reihenfolge = Anzeige. Verfügbare IDs: '+Object.keys(D.courses).join(', ')));
 D.categories.forEach((k,i)=>{const t=h('input');t.value=k.courses.join(', ');t.oninput=()=>{k.courses=t.value.split(',').map(x=>x.trim()).filter(x=>D.courses[x]);save()};
  r.append(card('Kapitel '+(i+1),[wrapG([F('Überschrift Kapitel-Label',k,'kicker'),F('Titel',k,'title'),F('Grafik',k,'ill',{sel:['gear','chart','cert','coins']})]),F('Einleitung',k,'intro',{area:1,rows:2}),h('label',{class:'f'},['Kurs-IDs',t]),btn('Kapitel löschen',()=>{if(confirm('Kapitel löschen?')){D.categories.splice(i,1);save();render()}},'red')]))});
 r.append(btn('+ Kapitel',()=>{D.categories.push({id:'neu'+Date.now(),kicker:'Kapitel '+(D.categories.length+1),title:'Neu',ill:'book',intro:'',courses:[]});D.categories[D.categories.length-1].ill='gear';save();render()}));
 r.append(card('Letzte Buchseite',[wrapG([F('Label',D.closing,'kicker'),F('Titel',D.closing,'title')]),F('Text',D.closing,'text',{area:1,rows:2})]));return r};
TABS.texte=()=>{const r=h('div'),c=D.contact;
 r.append(card('Kontakt & Adresse',[wrapG([F('Name',c,'name'),F('Straße',c,'street'),F('PLZ Ort',c,'city'),F('Telefon 1 (Anzeige)',c,'phone'),F('Telefon 1 (+49…)',c,'phoneHref'),F('Telefon 2 (Anzeige)',c,'phone2'),F('Telefon 2 (+49…)',c,'phone2Href'),F('E-Mail',c,'email'),F('E-Mail 2',c,'email2')]),LA('Bürozeiten',()=>P(c.hours),a=>c.hours=UP(a),4,'Tag | Zeit')]));
 r.append(card('Unterrichtszeiten',[LA('Zeilen',()=>P(D.schedule.lines),a=>D.schedule.lines=UP(a),4,'Tag | Zeit | UE'),F('Hinweis',D.schedule,'note')]));
 r.append(card('Startseite',[F('Ziel-Satz (Kursseiten)',D,'goal',{area:1,rows:2}),LA('Ablauf-Schritte',()=>P(D.steps.map(s=>[s.t,s.d])),a=>D.steps=UP(a).map(x=>({t:x[0],d:x[1]||''})),5,'Titel | Beschreibung'),LA('Vorteile (4 Karten)',()=>P(D.pillars),a=>D.pillars=UP(a),5,'Titel | Text')]));
 r.append(card('FAQ',[LA('Eine Frage pro Zeile',()=>P(D.faq.map(f=>[f.q,f.a])),a=>D.faq=UP(a).map(x=>({q:x[0],a:x.slice(1).join(' | ')})),10,'Frage | Antwort')]));
 r.append(card('Anmeldung & Leistungen',[LA('Anmeldeunterlagen',()=>J(D.docs),a=>D.docs=a,5),LA('Leistungen: Wissensvermittlung',()=>J(D.leistungen.wissen),a=>D.leistungen.wissen=a,8),LA('Leistungen: Beratung',()=>J(D.leistungen.beratung),a=>D.leistungen.beratung=a,4)]));
 r.append(card('Dozentensuche',[LA('Gesuchte Fächer',()=>J(D.dozent.fach),a=>D.dozent.fach=a,6),LA('Anforderungen',()=>J(D.dozent.fordern),a=>D.dozent.fordern=a,6),LA('Wir bieten',()=>J(D.dozent.bieten),a=>D.dozent.bieten=a,5)]));
 r.append(card('Buchtipps',[F('Taschenrechner',D.buch,'rechner',{area:1,rows:2}),LA('Recht',()=>P(D.buch.recht),a=>D.buch.recht=UP(a),3,'Kurs | Bücher'),LA('ISBN',()=>P(D.buch.isbn),a=>D.buch.isbn=UP(a),5,'Titel | ISBN'),F('Hinweis',D.buch,'note',{area:1,rows:3})]));
 const ak=h('div');D.aktionen.forEach((a,i)=>ak.append(card(a.t||'Aktion',[wrapG([F('Datum',a,'d'),F('Titel',a,'t')]),F('Text',a,'x',{area:1,rows:3}),btn('Löschen',()=>{D.aktionen.splice(i,1);save();render()},'red')])));
 r.append(h('h2',{},['Sonderaktionen']),ak,btn('+ Aktion',()=>{D.aktionen.unshift({d:'',t:'Neue Aktion',x:''});save();render()}));
 const lk=h('div');D.links.groups.forEach((g,i)=>lk.append(card(g.t,[F('Gruppe',g,'t'),LA('Einträge, ein Eintrag pro Zeile; Link optional, z. B. downloads/datei.pdf',()=>(g.items||[]).map(x=>typeof x==='string'?x:(x.href?x.t+' | '+x.href:x.t)).join('\n'),a=>g.items=a.map(l=>{const p=l.split('|').map(x=>x.trim());return p[1]?{t:p[0],href:p[1]}:p[0]}),8,'Titel | Link'),btn('Gruppe löschen',()=>{D.links.groups.splice(i,1);save();render()},'red')])));
 r.append(h('h2',{},['Downloads & Links']),lk,btn('+ Gruppe',()=>{D.links.groups.push({t:'Neue Gruppe',items:[]});save();render()}),F('YouTube-Text',D.links,'video',{area:1,rows:3}));return r};
TABS.recht=()=>{const r=h('div');r.append(msg('HTML ist erlaubt (<h2>, <p>, <ul><li>, <br>, <a>). Die Seiten erscheinen nach dem Veröffentlichen unter impressum.html und datenschutz.html. Lass die Texte rechtlich prüfen.'));
 r.append(card('Impressum',[F('HTML',D.legal,'impressum',{area:1,rows:18})]),card('Datenschutzerklärung',[F('HTML',D.legal,'datenschutz',{area:1,rows:22})]));return r};
const out=()=>'/* Erzeugt von der Verwaltung am '+new Date().toLocaleString('de-DE')+' */\nwindow.SITE='+JSON.stringify(D,null,1)+';\n';
TABS.pub=()=>{const r=h('div'),g=JSON.parse(localStorage.getItem('ghCfg')||'{"owner":"","repo":"","branch":"main","path":"js/data.js","token":""}'),status=h('div');
 const sv=()=>localStorage.setItem('ghCfg',JSON.stringify(g));
 r.append(msg('Wichtig: Änderungen liegen zuerst nur als Entwurf in diesem Browser. Öffentlich sichtbar werden sie erst, wenn die Datei js/data.js ersetzt wird: entweder per Download und Upload oder direkt per GitHub.'));
 r.append(card('1) Datei herunterladen',[h('p',{style:'color:var(--mut);margin-bottom:10px'},['Ersetze danach js/data.js auf deinem Webspace.']),btn('data.js herunterladen',()=>{const a=h('a',{href:URL.createObjectURL(new Blob([out()],{type:'text/javascript'})),download:'data.js'});document.body.append(a);a.click();a.remove()})]));
 const gi=(l,k,t)=>{const i=h('input',{type:t||'text',autocomplete:'off'});i.value=g[k];i.oninput=()=>{g[k]=i.value.trim();sv()};return h('label',{class:'f'},[l,i])};
 r.append(card('2) Direkt zu GitHub veröffentlichen',[wrapG([gi('Besitzer (User/Org)','owner'),gi('Repository','repo'),gi('Branch','branch'),gi('Pfad','path'),gi('Personal Access Token (Contents: Read & Write)','token','password')]),h('p',{class:'note',style:'color:var(--mut)'},['Das Token wird nur in diesem Browser gespeichert. Nutze ein „fine-grained“ Token nur für dieses Repo. Dieses Token schützt in Wahrheit die Seite: ohne Token kann niemand etwas veröffentlichen.']),btn('Jetzt veröffentlichen',async()=>{status.innerHTML='';if(!g.owner||!g.repo||!g.token)return status.append(msg('Bitte Besitzer, Repository und Token ausfüllen.','err'));
  try{const u=`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${g.path}`,hd={Authorization:'Bearer '+g.token,Accept:'application/vnd.github+json'};
   const gr=await fetch(u+'?ref='+encodeURIComponent(g.branch),{headers:hd});let sha;if(gr.ok)sha=(await gr.json()).sha;else if(gr.status!==404)throw new Error('Lesen fehlgeschlagen ('+gr.status+')');
   const b64=btoa(unescape(encodeURIComponent(out())));
   const pr=await fetch(u,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},hd),body:JSON.stringify({message:'Inhalte aktualisiert (Verwaltung)',content:b64,sha,branch:g.branch})});
   if(!pr.ok)throw new Error('Schreiben fehlgeschlagen ('+pr.status+'): '+(await pr.text()).slice(0,200));
   localStorage.removeItem('siteDraft');$('#dirty').hidden=true;status.append(msg('Veröffentlicht. GitHub Pages braucht ein bis zwei Minuten bis die Änderung sichtbar ist.','ok'))}catch(e){status.append(msg(e.message,'err'))}}),status]));
 r.append(card('Entwurf',[h('div',{class:'row'},[btn('Entwurf verwerfen (zurück zur Live-Version)',()=>{if(confirm('Alle ungespeicherten Änderungen verwerfen?')){localStorage.removeItem('siteDraft');location.reload()}},'red')])]));
 const pw=h('input',{type:'password',placeholder:'Neues Passwort (mind. 8 Zeichen)'}),un=h('input',{placeholder:'Benutzername',value:'admin'}),ps=h('div');
 r.append(card('Zugangsdaten ändern',[h('p',{style:'color:var(--mut);margin-bottom:10px'},['Gilt nur für diesen Browser. Damit es für alle Browser gilt, steht unten der Hash, den du in js/admin.js bei HASH einträgst.']),wrapG([un,pw]),h('div',{class:'row'},[btn('Speichern',async()=>{if(pw.value.length<8)return ps.replaceChildren(msg('Mindestens 8 Zeichen.','err'));const hh=await sha(SALT+un.value.trim()+'|'+pw.value);localStorage.setItem('admHash',hh);ps.replaceChildren(msg('Gespeichert. Hash: '+hh,'ok'))})]),ps]));return r};
TABS.json=()=>{const r=h('div'),t=h('textarea',{rows:28,style:'font-family:monospace;font-size:12px'}),s=h('div');t.value=JSON.stringify(D,null,1);
 r.append(msg('Gesamte Seitendaten als JSON. Nur für Fortgeschrittene, auch zum Sichern und Wiederherstellen.'),t,h('div',{class:'row'},[btn('Übernehmen',()=>{try{D=JSON.parse(t.value);save();s.replaceChildren(msg('Übernommen.','ok'))}catch(e){s.replaceChildren(msg('Ungültiges JSON: '+e.message,'err'))}})]),s);return r};
})();

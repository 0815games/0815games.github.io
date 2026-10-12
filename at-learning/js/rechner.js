(function(){
const F=window.FOERDER,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app');if(!app||!F)return;
const eur=n=>(Math.round(n*100)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:2});
const ul=a=>`<ul class="tick">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
const keys=Object.keys(F.pruefung);
app.innerHTML=`
<div class="phead"><div class="wrap"><div class="crumb"><a href="index.html">Start</a> / Förderrechner</div><h1>Förderrechner</h1><p class="lead">Was kostet dich dein Abschluss wirklich? Rechne dein Aufstiegs-BAföG (Meister-BAföG) für die IHK Region Stuttgart durch, mit KfW-Darlehen und Erlass.</p></div></div>
<div class="wrap"><section class="calc"><div class="calc-grid">
<form class="panel" id="rf" onsubmit="return false">
<h3>Deine Angaben</h3>
<label class="f">Weiterbildung<select id="kurs">${keys.map(k=>`<option value="${k}">${F.pruefung[k].t}</option>`).join('')}</select></label>
<label class="f">Lehrgangsgebühr gesamt<div class="inp"><input type="number" id="lehr" min="0" step="50" value="4000" inputmode="decimal"><span>€</span></div><small id="lehrhint">Beispielwert. Trage hier die Gebühr aus deinem Angebot ein. Lehrmittel und Arbeitsmaterial sind nicht förderfähig.</small></label>
<label class="f">IHK-Prüfungsgebühren gesamt<div class="inp"><input type="number" id="pruef" min="0" step="10" inputmode="decimal"><span>€</span></div><small id="pruefhint"></small></label>
<div class="f" style="margin-bottom:8px">Art der Maßnahme</div>
<div class="seg"><label><input type="radio" name="art" value="teil" checked>Teilzeit (Wochenende)</label><label><input type="radio" name="art" value="voll">Vollzeit</label></div>
<div class="opts">
<label class="opt"><input type="checkbox" id="loan" checked><span><b>KfW-Darlehen für den Rest nutzen</b><small>Damit bekommst du den Erlass bei bestandener Prüfung.</small></span></label>
<label class="opt"><input type="checkbox" id="gr"><span><b>Ich gründe oder übernehme ein Unternehmen</b><small>Innerhalb von drei Jahren nach dem Lehrgang. Dann wird das Darlehen komplett erlassen.</small></span></label>
</div>
</form>
<aside class="panel res" id="res" aria-live="polite"></aside></div></section>
<section id="vollzeit" hidden><div class="panel"><h3>Zusätzlich bei Vollzeit: Unterhaltsbeitrag</h3><p style="color:var(--mut)">Bei Vollzeitmaßnahmen gibt es einen Beitrag zum Lebensunterhalt als Vollzuschuss, abhängig von Einkommen und Vermögen. Für Alleinstehende beträgt der Höchstbetrag ${eur(F.unterhalt.single)} pro Monat, dazu ${eur(F.unterhalt.partner)} für Verheiratete bzw. Verpartnerte und ${eur(F.unterhalt.kind)} je Kind. Alleinerziehende erhalten außerdem ${eur(F.unterhalt.betreuung)} pro Kind unter 14 als Kinderbetreuungszuschlag (auch in Teilzeit). Ob und wie viel du bekommst, entscheidet das Amt für Ausbildungsförderung.</p></div></section>
<section><h2>Weitere Fördermöglichkeiten</h2><div class="cards3" style="margin-top:20px">
<div class="panel"><span class="tag">Baden-Württemberg</span><h3>Bildungszeit: ${F.bildungszeit.tage} Tage bezahlt frei</h3><p>Als Beschäftigter in Baden-Württemberg kannst du dich pro Kalenderjahr bis zu ${F.bildungszeit.tage} Arbeitstage bei Lohnfortzahlung freistellen lassen. Voraussetzung ist, dass dein Arbeitsverhältnis seit mindestens ${F.bildungszeit.monate} Monaten besteht und der Bildungsträger nach dem Bildungszeitgesetz anerkannt ist.</p><p>Beantragung schriftlich beim Arbeitgeber spätestens ${F.bildungszeit.wochen} Wochen vor Beginn. Er muss innerhalb von vier Wochen entscheiden, sonst gilt sie als bewilligt.</p></div>
<div class="panel"><span class="tag">Unter 25</span><h3>Weiterbildungsstipendium</h3><p>Für junge Berufstätige, die zu Beginn noch nicht 25 sind (mit Anrechnungszeiten bis zu drei Jahre später). Bis zu ${eur(F.stipendium.gesamt)} über drei Jahre, das sind ${eur(F.stipendium.jahr)} pro Jahr, bei ${F.stipendium.eigen} % Eigenanteil je Maßnahme.</p><p>Ob und wie sich das Stipendium mit dem Aufstiegs-BAföG kombinieren lässt, klärst du vorab mit der IHK Region Stuttgart (Weiterbildungsberatung 0711 2005-1132).</p></div>
<div class="panel"><span class="tag no">Nicht für IHK</span><h3>Meisterprämie Baden-Württemberg</h3><p>Die Prämie von 1.500 € des Landes gilt laut Handwerkskammer für Meisterinnen und Meister im Handwerk und wird über die Handwerkskammern beantragt. Für IHK-Abschlüsse wie den Industriemeister ist sie nach diesen Angaben nicht vorgesehen. Im Zweifel fragst du beim Wirtschaftsministerium nach.</p></div>
</div></section>
<section><h2>Prüfungsgebühren und Termine</h2><p class="lead" style="margin:6px 0 18px">${F.gebuehrenStand}. Änderungen vorbehalten.</p>
<div class="tscroll"><table class="tt"><thead><tr><th>Prüfung</th><th>Gebühren gesamt</th><th>Zusammensetzung</th></tr></thead><tbody>${keys.filter(k=>F.pruefung[k].g).map(k=>`<tr><td>${F.pruefung[k].t}</td><td>${eur(F.pruefung[k].g)}</td><td>${F.pruefung[k].d}</td></tr>`).join('')}</tbody></table></div>
<h3 style="margin:30px 0 12px">Prüfungsperioden 2027, IHK Region Stuttgart</h3>
<div class="tscroll"><table class="tt"><thead><tr><th>Prüfung</th><th>Frühjahr</th><th>Herbst</th><th>Anmeldeschluss</th></tr></thead><tbody>${F.termine.map(t=>`<tr><td>${t.k}</td><td>${t.f}</td><td>${t.h}</td><td>${t.as}</td></tr>`).join('')}</tbody></table></div></section>
<section><h2>So beantragst du es</h2><div class="steps" style="margin-top:24px">
<div class="step"><h3>Kurs wählen</h3><p>Lehrgangsgebühr und Termin klären, am besten im Beratungsgespräch bei uns.</p></div>
<div class="step"><h3>Antrag stellen</h3><p>Online über AFBG digital beim zuständigen Amt für Ausbildungsförderung, möglichst vor Kursbeginn.</p></div>
<div class="step"><h3>Bescheid und KfW</h3><p>Du bekommst den Bescheid und ein Darlehensangebot der KfW. Das Darlehen ist freiwillig und kann ganz oder teilweise angenommen werden.</p></div>
<div class="step"><h3>Prüfung und Erlass</h3><p>Nach der bestandenen Prüfung beantragst du den 50-%-Erlass auf das Darlehen für Lehrgangs- und Prüfungsgebühren.</p></div></div></section>
<section><div class="panel"><h3>Gut zu wissen</h3>${ul(['Die Förderung der Lehrgangs- und Prüfungsgebühren ist einkommens- und vermögensunabhängig.','Das KfW-Darlehen ist während der Fortbildung und einer anschließenden Karenzzeit zins- und tilgungsfrei, insgesamt höchstens sechs Jahre.','Gefördert werden die tatsächlichen Gebühren bis maximal '+eur(F.max)+'. Alles darüber zahlst du selbst.','Zusätzlich gibt es für die Materialkosten eines Meisterprüfungsprojekts bis zu 2.000 € Förderung (je zur Hälfte Zuschuss und Darlehen).','Das ist eine unverbindliche Überschlagsrechnung. Verbindlich ist nur dein Bescheid vom Amt für Ausbildungsförderung.'])}</div></section>
<section><h2>Quellen und Links</h2><ul class="srcs" style="margin-top:14px">${F.links.map(l=>`<li><a href="${l.u}" target="_blank" rel="noopener">${l.t} →</a></li>`).join('')}</ul><p class="note2">Stand der Parameter: ${F.stand}. Die Bundesförderung und die IHK-Gebühren ändern sich gelegentlich, bitte vor dem Antrag auf den verlinkten Seiten gegenprüfen.</p></section>
</div>`;
const el={kurs:$('#kurs'),lehr:$('#lehr'),pruef:$('#pruef'),loan:$('#loan'),gr:$('#gr'),res:$('#res'),hint:$('#pruefhint'),lh:$('#lehrhint')};
let touched=false,pTouched=false;
function setPruef(){const p=F.pruefung[el.kurs.value];if(!pTouched){el.pruef.value=p.g==null?'':p.g}el.hint.textContent=p.g==null?p.d:'IHK Region Stuttgart: '+p.d+'. Du kannst den Wert ändern.'}
function calc(){
 const lehr=+el.lehr.value||0,pr=+el.pruef.value||0,kosten=lehr+pr,loan=el.loan.checked,gr=el.gr.checked;
 const foerd=Math.min(kosten,F.max),zus=foerd*F.zuschuss,dar=foerd-zus;
 let erl=0;if(loan)erl=gr?dar:dar*F.erlassBestanden;
 const rueck=loan?dar-erl:0,ueber=kosten-foerd,keinDar=loan?0:dar;
 const eigen=kosten-zus-erl,staat=kosten-eigen,pct=kosten>0?Math.round(staat/kosten*100):0;
 const w=v=>kosten>0?(v/kosten*100).toFixed(2):0;
 el.res.innerHTML=`<div class="lbl">Dein Eigenanteil am Ende</div><div><span class="big">${eur(eigen)}</span><span class="pct">${pct} % trägt der Staat</span></div>
 ${touched?'':'<div class="ex">Beispielrechnung mit 4.000 € Lehrgangsgebühr. Trage deine eigene Gebühr links ein.</div>'}
 <div class="sbar" role="img" aria-label="Verteilung der Kosten"><i class="c1" style="width:${w(zus)}%"></i><i class="c2" style="width:${w(erl)}%"></i><i class="c3" style="width:${w(rueck+keinDar)}%"></i><i class="c4" style="width:${w(ueber)}%"></i></div>
 <ul class="rl"><li><span>Gesamtkosten (Lehrgang + Prüfung)</span><em>${eur(kosten)}</em></li>
 <li><span><i class="dot c1"></i>Zuschuss (${Math.round(F.zuschuss*100)} %), geschenkt</span><em>${eur(zus)}</em></li>
 <li><span><i class="dot c2"></i>Erlass auf das KfW-Darlehen</span><em>${eur(erl)}</em></li>
 <li><span><i class="dot c3"></i>${loan?'KfW-Darlehen, das du zurückzahlst':'Rest, den du selbst zahlst (ohne Darlehen)'}</span><em>${eur(loan?rueck:keinDar)}</em></li>
 ${ueber>0?`<li><span><i class="dot c4"></i>Über dem Förderdeckel von ${eur(F.max)}</span><em>${eur(ueber)}</em></li>`:''}
 <li class="sum"><span>Du zahlst insgesamt</span><em>${eur(eigen)}</em></li></ul>
 ${loan?'':'<p class="note2">Ohne Darlehen entfällt der Erlass. Mit Darlehen sparst du bei bestandener Prüfung '+eur(dar*F.erlassBestanden)+' mehr.</p>'}
 ${gr?'<p class="note2">Der volle Erlass gilt bei Unternehmensgründung oder -übernahme innerhalb von drei Jahren nach dem Lehrgang. Voraussetzungen prüfst du im Bundesportal.</p>':''}
 <p class="note2">Unverbindliche Überschlagsrechnung nach dem Aufstiegsfortbildungsförderungsgesetz (AFBG). Stand ${F.stand}.</p>`;
 $('#vollzeit').hidden=$('input[name=art]:checked').value!=='voll';
}
el.kurs.addEventListener('change',()=>{pTouched=false;setPruef();calc()});
el.lehr.addEventListener('input',()=>{touched=true;calc()});
el.pruef.addEventListener('input',()=>{pTouched=true;calc()});
['loan','gr'].forEach(i=>el[i].addEventListener('change',()=>{touched=true;calc()}));
$$('input[name=art]').forEach(r=>r.addEventListener('change',calc));
setPruef();calc();
if(window.observeRv)observeRv();
})();

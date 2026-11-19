export const names=['Waffen','Munition','Alkohol','Dollar'];
export const rooms={office:['Chefbüro','Verkürzt die Bauzeit neuer Räume.',[100,150,0,0],180],arms:['Waffenkammer','Produziert Waffen für Ausbau und Rekrutierung.',[75,150,0,0],120],ammo:['Munitionskammer','Versorgt dein Quartier mit Munition.',[90,120,0,0],120],brew:['Brauerei','Erhöht die Alkoholproduktion.',[80,90,0,0],120],pub:['Kneipe','Verkauft Alkohol gegen Dollar. Benötigt Brauerei 1.',[100,180,0,0],180],camp:['Trainingslager','Hier rekrutierst du deine Mannschaft.',[120,180,0,0],180]};
export const units={thug:['Schläger','Einfache mobile Einheit.',[200,1000,0,0],1400],porter:['Möbelpacker','Transportiert bis zu 10.000 Rohstoffe.',[300,100,0,1000],3600],crew:['Besetzungstruppe','Für die Übernahme weiterer Gebäude vorgesehen.',[20000,10000,0,20000],344000]};
export function init(now){return {v:1,t:now,cash:[750,500,250,0],lvl:Object.fromEntries(Object.keys(rooms).map(k=>[k,0])),men:{thug:0,porter:0,crew:0},build:null,queue:[],news:[]}}
export const rate=s=>[10+50*s.lvl.arms,10+80*s.lvl.ammo,10+60*s.lvl.brew-10*s.lvl.pub,5*s.lvl.pub];
export function quote(s,k){let lv=s.lvl[k],x=rooms[k];return {cost:x[2].map(v=>Math.ceil(v*1.55**lv)),sec:Math.ceil(x[3]*(1.4**lv)/(1+.1*s.lvl.office))}}
export function cap(s){return [10000,10000,10000,10000]}
export const affordable=(s,c)=>c.every((v,i)=>s.cash[i]>=v);
function pay(s,c){s.cash=s.cash.map((v,i)=>v-c[i])}
function news(s,msg){s.news.unshift(msg);s.news=s.news.slice(0,12)}
export function advance(s,end){if(end<=s.t)return;while(s.t<end){let stop=Math.min(end,s.build?.at??Infinity,s.queue[0]?.at??Infinity),h=(stop-s.t)/3600000,r=rate(s);let available=s.cash[2]+(10+60*s.lvl.brew)*h, sold=Math.min(10*s.lvl.pub*h,available);s.cash=s.cash.map((v,i)=>Math.min(cap(s)[i],i===2?available-sold:i===3?v+sold*.5:v+r[i]*h));s.t=stop;if(s.build?.at===stop){let k=s.build.k;s.lvl[k]++;news(s,rooms[k][0]+' auf Stufe '+s.lvl[k]+' ausgebaut.');s.build=null}if(s.queue[0]?.at===stop){let j=s.queue.shift();s.men[j.k]+=j.n;news(s,j.n+' × '+units[j.k][0]+' eingetroffen.')}}}
export function build(s,k){if(!rooms[k]||s.build)return false;if(k==='pub'&&!s.lvl.brew)return false;let {cost,sec}=quote(s,k);if(!affordable(s,cost))return false;pay(s,cost);s.build={k,at:s.t+sec*1000};return true}
export function recruit(s,k,n){if(!units[k]||!s.lvl.camp||!Number.isInteger(n)||n<1||n>100||s.queue.length>=8)return false;let c=units[k][2].map(x=>x*n);if(!affordable(s,c))return false;pay(s,c);s.queue.push({k,n,at:(s.queue.at(-1)?.at??s.t)+units[k][3]*n*1000});return true}

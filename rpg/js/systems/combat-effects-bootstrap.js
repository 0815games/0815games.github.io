let started=false;
function start(){
 if(started||!window.__rpg?.renderer)return;
 if(!['attack','fire','heal','flee'].every(id=>typeof document.getElementById(id)?.onclick==='function'))return;
 started=true;
 import('./combat-effects.js?v=0.5.14&rev=finish-standard1').catch(error=>console.warn('Kampfeffekte konnten nicht geladen werden:',error));
}
const schedule=()=>setTimeout(start,0);
window.addEventListener('DOMContentLoaded',schedule,{once:true});
window.addEventListener('load',schedule,{once:true});
if(document.readyState!=='loading')schedule();

function setup(){
 const style=document.createElement('style');style.textContent=`
#slot-screen{display:block;overflow:hidden;padding:0}
#slot-screen .slot-card{position:absolute;inset:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));width:auto;max-width:760px;height:auto;max-height:none;margin:0 auto;padding:clamp(10px,2.5vw,20px);overflow:hidden;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:clamp(5px,1.2vw,10px)}
#slot-screen .slot-card>h2{margin:0;font-size:clamp(15px,4vw,22px);letter-spacing:.08em;padding-right:82px;overflow-wrap:anywhere}
#slot-screen .slot-card>p{margin:0;font-size:clamp(12px,2.5vw,14px);line-height:1.5}
#slot-screen #slots-grid{min-height:0;min-width:0;margin:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;align-content:start;padding:4px;scroll-padding:8px;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))}
#slot-screen .slot-box{min-width:0;overflow-wrap:anywhere}
#slot-screen .slot-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;padding-top:8px;border-top:1px solid #3b4258}
#slot-screen .slot-footer .version-badge{margin:0}
@media(max-width:600px){#slot-screen #slots-grid{grid-template-columns:minmax(0,1fr)}}
`;document.head.append(style);
 const grid=document.getElementById('slots-grid');grid.tabIndex=0;grid.setAttribute('aria-label','Reckenliste: Pfeiltasten zum Auswählen, Enter zum Bestätigen');
 grid.addEventListener('focusin',e=>{if(e.target!==grid)e.target.scrollIntoView({block:'nearest',inline:'nearest'});});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();

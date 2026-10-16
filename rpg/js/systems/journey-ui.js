function setup(){
 const el=id=>document.getElementById(id),creator=el('class-screen');
 const style=document.createElement('style');style.textContent=`
:root{--play-top:max(12px,env(safe-area-inset-top));--play-right:max(12px,env(safe-area-inset-right));--play-bottom:max(12px,env(safe-area-inset-bottom));--play-left:max(12px,env(safe-area-inset-left))}
#game{position:fixed;inset:var(--play-top) var(--play-right) var(--play-bottom) var(--play-left);width:auto;height:auto!important;min-height:0!important;max-width:none;margin:0;padding:0!important;border:2px solid #c99c42;border-radius:16px;background:#111420;box-shadow:0 0 35px #000,0 0 20px #c99c4233;overflow:hidden}
#game header{flex-shrink:0;padding-top:8px}
#game #layout{min-height:0;overflow:hidden}
#game #mapbox{min-height:0}
#game aside{min-height:0;max-height:100%;overflow-y:auto;padding-bottom:12px}
#hint{display:none!important}
#combat{inset:var(--play-top) var(--play-right) var(--play-bottom) var(--play-left);height:auto!important;border:2px solid #c99c42!important;border-radius:16px;overflow-y:auto!important;padding-top:12px;padding-bottom:12px}
#floor-overlay,#levelup-overlay,body .tutorial-modal,body .levelup-choice{inset:var(--play-top) var(--play-right) var(--play-bottom) var(--play-left);border-radius:16px}
`;document.head.append(style);
 let creatorOpen=false;
 function fillName(){el('random-name')?.click();}
 function watchCreator(){const open=!creator.classList.contains('hidden');if(open&&!creatorOpen)fillName();creatorOpen=open;}
 new MutationObserver(watchCreator).observe(creator,{attributes:true,attributeFilter:['class']});watchCreator();
 el('start-run').addEventListener('click',()=>{if(!el('run-name').value.trim())fillName();},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();

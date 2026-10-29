function install(){
 const id='preparation-shop-layout-v0510';if(document.getElementById(id))return;
 const style=document.createElement('style');style.id=id;style.textContent=`
#preparation-shop[role="dialog"]{box-sizing:border-box;inset:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));max-width:1100px;margin:auto;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:14px;padding:14px;overflow:hidden;overscroll-behavior:contain;touch-action:pan-y;border:1px solid #b99450;border-radius:18px;color:#eee8db;background:radial-gradient(ellipse at top left,#55432a33,transparent 60%),linear-gradient(145deg,#1b1b20,#0c0d12);box-shadow:0 0 0 100vmax #050609d9,0 18px 70px #000b;font:14px/1.5 system-ui,sans-serif}
#preparation-shop[role="dialog"] *{box-sizing:border-box;min-width:0}
#preparation-shop[role="dialog"][hidden],#preparation-shop[role="dialog"] [hidden]{display:none!important}
#preparation-shop[role="dialog"] header{display:grid;align-content:start;gap:10px;margin:0;padding:0 0 12px;border:0;border-bottom:1px solid #75613b;border-radius:0;background:transparent;max-height:42vh;overflow:auto}
#preparation-shop[role="dialog"] h2{margin:0;color:#f0d797;font:700 clamp(17px,4.5vw,25px)/1.25 Georgia,serif;letter-spacing:.045em;overflow-wrap:anywhere}
#preparation-shop[role="dialog"] .shop-info{margin:0;padding:10px 12px;white-space:pre-line;font-size:13px;line-height:1.6;color:#ded7c8;border:1px solid #71604470;border-radius:10px;background:#ffffff04;overflow-wrap:anywhere}
#preparation-shop[role="dialog"] .shop-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#preparation-shop[role="dialog"] button{min-height:48px;margin:0;padding:10px 12px;border:1px solid #786747;border-radius:9px;color:#eee8db;background:#252329;font:600 14px/1.3 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;touch-action:manipulation;cursor:pointer}
#preparation-shop[role="dialog"] button:disabled{opacity:.65;cursor:not-allowed;background:#26252a;color:#c2beb7}
#preparation-shop[role="dialog"] button:focus-visible{outline:3px solid #ffe082;outline-offset:2px}
#preparation-shop[role="dialog"] .shop-tabs button[aria-pressed="true"]{color:#17130c;background:linear-gradient(#e2c586,#bc934c);border-color:#e7cc90;box-shadow:inset 0 1px #fff5}
#preparation-shop[role="dialog"] .shop-list{display:grid;grid-template-columns:minmax(0,1fr);align-content:start;gap:12px;min-height:0;margin:0;padding:4px 4px 12px;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;scroll-padding:12px;scrollbar-color:#8b744b #141419}
#preparation-shop[role="dialog"] article{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:10px;align-items:start;margin:0;padding:16px;border:1px solid #796747;border-radius:12px;background:linear-gradient(135deg,#29272b,#18181e);box-shadow:inset 0 1px #ffffff08,0 4px 12px #0003;overflow-wrap:anywhere}
#preparation-shop[role="dialog"] h3{grid-column:1/-1;margin:0;color:#f1dfb5;font:700 17px/1.35 Georgia,serif}
#preparation-shop[role="dialog"] article p{margin:0;color:#ccc6b9;line-height:1.6;white-space:normal}
#preparation-shop[role="dialog"] article button{align-self:end;color:#f1dfb5;border-color:#b28b4c;background:#332a1e}
#preparation-shop[role="dialog"] footer{display:grid;gap:10px;max-height:40vh;overflow:auto;margin:0;padding:12px;border:1px solid #796747;border-radius:12px;background:linear-gradient(#232025,#16161c);scroll-padding:10px}
#preparation-shop[role="dialog"] footer p{margin:0;font-size:13px;line-height:1.5;color:#d6cebc;overflow-wrap:anywhere}
#preparation-shop[role="dialog"] footer button{width:100%}
#preparation-shop[role="dialog"] [data-start],#preparation-shop[role="dialog"] [data-confirm]{min-height:52px;color:#19130a;background:linear-gradient(#e6cb8e,#bc934b);border-color:#e7cc90;font-weight:700}
@media(max-width:359px){#preparation-shop[role="dialog"]{padding:10px;gap:10px}#preparation-shop[role="dialog"] article{grid-template-columns:minmax(0,1fr);padding:12px}#preparation-shop[role="dialog"] article button{width:100%}}
@media(min-width:640px){#preparation-shop[role="dialog"] .shop-list{grid-template-columns:repeat(2,minmax(0,1fr))}#preparation-shop[role="dialog"] article{grid-template-columns:minmax(0,1fr)}#preparation-shop[role="dialog"] article button{width:100%}}
@media(min-width:960px){#preparation-shop[role="dialog"]{grid-template-columns:280px minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;padding:20px;gap:20px}#preparation-shop[role="dialog"] header{grid-column:1;grid-row:1;max-height:none;overflow:auto;padding:0 18px 0 0;border-bottom:0;border-right:1px solid #75613b}#preparation-shop[role="dialog"] .shop-list{grid-column:2;grid-row:1}#preparation-shop[role="dialog"] footer{grid-column:1/-1;grid-row:2;grid-template-columns:repeat(2,minmax(0,1fr))}#preparation-shop[role="dialog"] footer p,#preparation-shop[role="dialog"] [data-start]{grid-column:1/-1}}
@media(max-height:640px){#preparation-shop[role="dialog"]{display:block;overflow:auto}#preparation-shop[role="dialog"] header{max-height:none;overflow:visible;border-right:0;border-bottom:1px solid #75613b;padding:0 0 12px;margin-bottom:12px}#preparation-shop[role="dialog"] .shop-list{overflow:visible;min-height:0;margin-bottom:12px}#preparation-shop[role="dialog"] footer{max-height:none;overflow:visible}}
@media(hover:hover){#preparation-shop[role="dialog"] button:not(:disabled):hover{border-color:#ffe1a4;filter:brightness(1.1)}}
`;document.head.append(style);
 const panel=document.getElementById('preparation-shop');if(!panel)return;
 const tabs=panel.querySelector('.shop-tabs'),buttons=[...panel.querySelectorAll('[data-category]')],start=panel.querySelector('[data-start]');
 if(tabs){tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Angebotskategorie');}
 function select(selected){for(const button of buttons){const value=String(button===selected);if(button.getAttribute('aria-pressed')!==value)button.setAttribute('aria-pressed',value);}}
 select(buttons.find(button=>button.dataset.category==='weapon'));
 for(const button of buttons)button.addEventListener('click',()=>{if(start?.disabled)return;select(button);});
 if(start)start.textContent='Nächste Expedition starten';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

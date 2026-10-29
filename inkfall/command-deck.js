(() => {
"use strict";
function canDock(width,height,deckHeight){return Number.isFinite(width)&&Number.isFinite(height)&&Number.isFinite(deckHeight)&&width>=1000&&height-deckHeight>=320;}
if(typeof module==='object'&&module.exports){module.exports={canDock};return;}
function setup(){
  if(window.inkfallCommandDeck)return;
  const frame=document.getElementById("inkfall-window"),battle=document.getElementById("if-battle"),stage=document.getElementById("if-stage"),deck=document.getElementById("if-bottom-hud"),sidebar=document.getElementById("if-menu-scroll");
  const badge=deck?.querySelector(".if-hero-badge"),ability=document.getElementById("abilityBtn");
  const skillsButton=deck?[...deck.querySelectorAll("button")].find(b=>/openTree/.test(b.getAttribute("onclick")||"")||/skilltree|skills/i.test(b.textContent)):null;
  if(!frame||!battle||!stage||!deck||!sidebar||!badge||!ability||!skillsButton){console.error("Kommandodeck: Erforderliche Layout- oder Bedienelemente fehlen.");return;}
  const paths={build:'<path d="M4 21V10h16v11M3 10l3-6h12l3 6M8 4V2m8 2V2M9 21v-6h6v6"/>',skills:'<path d="M12 3v6m0 6v6M3 12h6m6 0h6"/><circle cx="12" cy="12" r="3"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'};
  function icon(type){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");svg.innerHTML=paths[type];return svg;}
  function actionButton(id,type,text){const b=document.createElement("button"),label=document.createElement("span");b.id=id;b.type="button";b.className="if-deck-action";label.textContent=text;b.append(icon(type),label);return b;}
  const buildButton=actionButton("if-deck-build","build","Bauen");buildButton.setAttribute("aria-controls","if-menu-scroll");
  skillsButton.id="if-deck-skills";skillsButton.classList.add("if-deck-action");
  const skillsLabel=document.createElement("span"),pointsBadge=document.createElement("span");skillsLabel.textContent="Skills";pointsBadge.className="if-deck-points";pointsBadge.hidden=true;skillsButton.replaceChildren(icon("skills"),skillsLabel,pointsBadge);
  const extraButtons=[...deck.querySelectorAll("button")].filter(b=>b!==ability&&b!==skillsButton);
  if(extraButtons.length){const extras=document.createElement("div");extras.className="if-deck-extra-actions";extras.append(...extraButtons);document.getElementById("ui")?.append(extras);}
  badge.id="if-deck-hero";badge.setAttribute("role","button");badge.setAttribute("tabindex","0");badge.setAttribute("aria-label","Heldenübersicht öffnen");badge.setAttribute("aria-controls","if-deck-hero-panel");badge.setAttribute("aria-expanded","false");
  ability.classList.add("if-deck-ability");deck.replaceChildren(badge,ability,buildButton,skillsButton);deck.classList.add("if-command-deck");
  // Bottom controls occupy their own full-width row, outside the map column.
  battle.append(deck);
  const sheetHeader=document.createElement("div"),sheetTitle=document.createElement("strong");sheetHeader.id="if-command-sheet-header";sheetTitle.textContent="Bauen & Verteidigung";
  const sheetClose=actionButton("if-command-sheet-close","close","Schließen");sheetClose.setAttribute("aria-label","Baumenü schließen");sheetHeader.append(sheetTitle,sheetClose);sidebar.prepend(sheetHeader);sidebar.setAttribute("aria-label","Bauen und Verteidigung");
  const heroPanel=document.createElement("section");heroPanel.id="if-deck-hero-panel";heroPanel.hidden=true;heroPanel.setAttribute("aria-label","Heldenübersicht");
  const heroHeading=document.createElement("strong"),heroAbility=document.createElement("p"),heroCooldown=document.createElement("p"),heroNote=document.createElement("p"),heroClose=actionButton("if-command-hero-close","close","Schließen");
  heroNote.textContent="Die aktive Fähigkeit wird direkt über das Kommandodeck ausgelöst.";heroPanel.append(heroHeading,heroAbility,heroCooldown,heroNote,heroClose);stage.append(heroPanel);
  const style=document.createElement("style");style.id="if-responsive-build-layout";
  style.textContent=`
    #inkfall-window #if-battle { display:grid; grid-template-columns:minmax(0,1fr); grid-template-rows:minmax(0,1fr) auto; min-height:0; min-width:0; position:relative; }
    #inkfall-window #if-battle > #if-stage { display:block; position:relative; grid-row:1; grid-column:1; min-width:0; min-height:0; overflow:hidden; }
    #inkfall-window #if-battle > #if-bottom-hud { grid-column:1 / -1; grid-row:2; position:relative; inset:auto; width:auto; min-width:0; z-index:20; }
    #inkfall-window #if-stage > #game { height:100% !important; }
    #inkfall-window #if-stage > #if-deck-hero-panel { bottom:10px; }
    #inkfall-window.if-build-docked #if-battle { grid-template-columns:minmax(0,1fr) 260px; }
    #inkfall-window.if-build-docked #if-battle > #if-menu-scroll {
      display:block !important; position:relative; grid-column:2; grid-row:1;
      inset:auto; width:auto; height:auto; max-height:none; min-height:0;
      overflow-y:auto; border:0; border-left:3px solid #493344; border-radius:0; box-shadow:none; z-index:10;
    }
    #inkfall-window.if-build-docked #if-bottom-hud.if-command-deck { grid-template-columns:minmax(90px,1.1fr) minmax(100px,1.5fr) minmax(70px,.9fr); }
    #inkfall-window.if-build-docked #if-deck-build,
    #inkfall-window.if-build-docked #if-command-sheet-close,
    #inkfall-window #if-deck-build[hidden] { display:none !important; }
    #inkfall-window.if-build-overlay #if-battle { grid-template-columns:minmax(0,1fr); }
    #inkfall-window.if-build-overlay #if-battle > #if-menu-scroll {
      display:none; position:absolute; top:0; bottom:var(--if-deck-height,80px); left:auto; right:0;
      width:min(320px,90%); height:auto; max-height:none; min-height:0; box-sizing:border-box;
      overflow-y:auto; border:3px solid #493344; border-top:0; border-bottom:0;
      border-radius:0; box-shadow:-7px 0 22px #17291e55; z-index:15;
    }
    #inkfall-window.if-build-overlay.if-tools-open #if-battle > #if-menu-scroll { display:block; }
  `;
  document.head.append(style);
  let docked=null,overlayOpen=false,layoutPending=false;
  function toggleClass(name,value){if(frame.classList.contains(name)!==value)frame.classList.toggle(name,value);}
  function closeHero(){heroPanel.hidden=true;badge.setAttribute("aria-expanded","false");badge.classList.remove("is-active");}
  function applyBuild(){
    const open=Boolean(docked||overlayOpen);
    toggleClass("if-tools-open",open);toggleClass("if-tools-closed",!open);
    buildButton.hidden=Boolean(docked);sheetClose.hidden=Boolean(docked);
    sidebar.setAttribute("aria-hidden",String(!open));buildButton.setAttribute("aria-expanded",String(open));buildButton.classList.toggle("is-active",open);
  }
  function setBuild(open){if(!docked)overlayOpen=Boolean(open);applyBuild();if(open)closeHero();}
  function layout(){
    layoutPending=false;
    const rect=frame.getBoundingClientRect(),height=Math.ceil(deck.getBoundingClientRect().height);
    frame.style.setProperty("--if-deck-height",height+"px");
    const next=canDock(rect.width,battle.getBoundingClientRect().height,height);
    if(next!==docked){
      const focusWasInSidebar=sidebar.contains(document.activeElement);
      const focusWasOnBuild=document.activeElement===buildButton;
      const focusWasOnClose=document.activeElement===sheetClose;
      docked=next;overlayOpen=false;
      toggleClass("if-build-docked",docked);toggleClass("if-build-overlay",!docked);
      applyBuild();
      if(!docked&&focusWasInSidebar)buildButton.focus({preventScroll:true});
      else if(docked&&(focusWasOnBuild||focusWasOnClose))badge.focus({preventScroll:true});
    }else applyBuild();
  }
  function scheduleLayout(){if(layoutPending)return;layoutPending=true;requestAnimationFrame(layout);}
  buildButton.onclick=()=>setBuild(!overlayOpen);
  sheetClose.onclick=()=>{setBuild(false);if(!docked)buildButton.focus();};
  function updateHeroInfo(){const d=HERO[hero.cls];heroHeading.textContent=d.name;heroAbility.textContent="Fähigkeit: "+d.ability;heroCooldown.textContent="Basis-Abklingzeit: "+d.cd+" Sekunden";}
  function toggleHero(){const open=heroPanel.hidden;if(open){setBuild(false);updateHeroInfo();}heroPanel.hidden=!open;badge.setAttribute("aria-expanded",String(open));badge.classList.toggle("is-active",open);}
  badge.addEventListener("click",toggleHero);badge.addEventListener("keydown",e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleHero();}});
  heroClose.onclick=()=>{closeHero();badge.focus();};
  skillsButton.addEventListener("click",()=>{closeHero();setBuild(false);},true);
  const placement=document.createElement("div"),placementText=document.createElement("span"),cancelBuild=document.createElement("button");placement.id="if-placement-status";placement.hidden=true;cancelBuild.type="button";cancelBuild.textContent="Abbrechen";cancelBuild.onclick=()=>{buildType=null;placement.hidden=true;};placement.append(placementText,cancelBuild);document.getElementById("game").append(placement);
  document.getElementById("if-build-grid")?.addEventListener("click",e=>{if(e.target.closest("button")&&buildType&&!docked)setBuild(false);});
  document.getElementById("start")?.addEventListener("click",()=>{if(active&&!docked)setBuild(false);});
  const view=document.getElementById("if-map-view");let pointerStart=null,pointerCount=0,gestureMoved=false;
  view?.addEventListener("pointerdown",e=>{pointerCount++;if(pointerCount===1){pointerStart={x:e.clientX,y:e.clientY};gestureMoved=false;}else gestureMoved=true;});
  view?.addEventListener("pointermove",e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>8)gestureMoved=true;});
  view?.addEventListener("pointerup",e=>{const tapped=pointerStart&&!gestureMoved&&pointerCount===1&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<=8;pointerCount=Math.max(0,pointerCount-1);if(tapped&&sel&&!buildType){closeHero();setBuild(true);}if(!pointerCount)pointerStart=null;});
  function resetPointer(){pointerCount=0;pointerStart=null;gestureMoved=true;}
  view?.addEventListener("pointercancel",resetPointer);window.addEventListener("blur",resetPointer);
  document.addEventListener("keydown",e=>{if(e.key!=='Escape')return;if(buildType)buildType=null;else if(!heroPanel.hidden)closeHero();else if(!docked&&overlayOpen)setBuild(false);});
  function sync(){
    const points=typeof skillPoints==='number'?skillPoints:0,text=String(points);
    if(pointsBadge.textContent!==text)pointsBadge.textContent=text;pointsBadge.hidden=points<=0;
    skillsButton.setAttribute("aria-label","Skilltree öffnen, "+points+" freie Skillpunkte");
    ability.classList.toggle("is-cooling",hero.cd>0);ability.setAttribute("aria-label",HERO[hero.cls].ability+(hero.cd>0?", bereit in "+Math.ceil(hero.cd)+" Sekunden":", bereit"));
    if(!heroPanel.hidden)updateHeroInfo();
    placement.hidden=!buildType;if(buildType){const text=(T[buildType]?.n||buildType)+" platzieren";if(placementText.textContent!==text)placementText.textContent=text;}
    applyBuild();
  }
  const observer=new ResizeObserver(scheduleLayout);observer.observe(frame);observer.observe(deck);observer.observe(battle);
  new MutationObserver(scheduleLayout).observe(frame,{attributes:true,attributeFilter:["class"]});
  window.addEventListener("resize",scheduleLayout);
  layout();sync();setInterval(sync,150);
  window.inkfallCommandDeck={openBuild:()=>setBuild(true),closeBuild:()=>setBuild(false)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

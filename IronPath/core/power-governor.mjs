// IPL-0134 Power-Governor: hält das Gerät kühl, ohne die Simulation anzufassen.
//
// Warum: die Render-Schleife malte bisher bei JEDEM rAF-Frame (60-120 Hz) das
// ganze Feld - auf dem Telefon heißt das Dauerlast, warmes Gerät, leerer
// Akku. Der Governor reguliert nur die drei teuren Stellschrauben der
// DARSTELLUNG: Frame-Lücke (fps), Backing-Store-DPR und die Effekt-Flags.
// Die Simulation läuft weiterhin bei jedem rAF mit ihrem eigenen Takt.
//
// Signale (rein lokal, kein Sim-State, kein Wire-Format):
//   * rAF-Lücken-EMA: >26 ms über 4 s = das Gerät kommt nicht hinterher ->
//     Stufe runter (5 s Mindestabstand zwischen Stufen); <18 ms über 20 s ->
//     Stufe hoch. Ein einzelner Sprung (Tab-Resume) zählt nicht.
//   * Akku (navigator.getBattery, wo vorhanden): ohne Netz <=30% -> mindestens
//     eco, <=15% -> max; am Netz frei. Fehlt die API, gilt nur das Frame-Signal.
//
// Stufen: full = unverändertes Verhalten; eco ~30 fps + DPR max 2;
// max ~20 fps + DPR max 1.5 + Wetter-/Tracer-Effekte aus. Alles optisch:
// die Einstellungen des Spielers (Grafik-Schalter, Wetter, Tracer) werden nie
// aufgeweicht, nur gedrosselt (UND-Logik), und jede Stufe kehrt von selbst
// zurück, wenn das Gerät wieder Luft hat.
export const POWER_POLICIES=Object.freeze([
  Object.freeze({id:'full',drawGapMs:0,dprCap:3,weather:true,tracers:true}),
  Object.freeze({id:'eco',drawGapMs:30,dprCap:2,weather:true,tracers:true}),
  Object.freeze({id:'max',drawGapMs:40,dprCap:1.5,weather:false,tracers:false}),
]);

const SLOW_MS=26;
const FAST_MS=18;
const SLOW_HOLD_MS=4000;
const FAST_HOLD_MS=20000;
const STEP_COOLDOWN_MS=5000;

export function createPowerGovernor({now=()=>Date.now(),onTierChange=()=>{}}={}){
  let tier=0,floor=0,ema=null,slowSince=null,fastSince=null,lastStepAt=-Infinity;
  const policy=()=>POWER_POLICIES[Math.min(POWER_POLICIES.length-1,Math.max(tier,floor))];
  function step(next){
    if(next===tier)return;
    tier=next;
    lastStepAt=now();
    try{onTierChange(policy().id);}catch{/* a listener must never break the frame loop */}
  }
  // Called once per rAF with the raw gap since the previous frame - the gap
  // the browser itself achieved, so our own draw-skipping cannot fake health.
  function sample(gapMs){
    if(!Number.isFinite(gapMs)||gapMs<=0)return policy();
    ema=ema===null?gapMs:ema*.9+gapMs*.1;
    const t=now();
    if(ema>SLOW_MS){
      fastSince=null;
      if(slowSince===null)slowSince=t;
      else if(t-slowSince>=SLOW_HOLD_MS&&tier<POWER_POLICIES.length-1&&t-lastStepAt>=STEP_COOLDOWN_MS){
        step(tier+1);
        slowSince=null;
      }
    }else if(ema<FAST_MS){
      slowSince=null;
      if(fastSince===null)fastSince=t;
      else if(t-fastSince>=FAST_HOLD_MS&&tier>0&&t-lastStepAt>=STEP_COOLDOWN_MS){
        step(tier-1);
        fastSince=null;
      }
    }else{
      slowSince=null;
      fastSince=null;
    }
    return policy();
  }
  // The battery only ever raises the floor (worse economy while unplugged);
  // charging or a full battery releases it and the frame signal takes over.
  function attachBattery(battery){
    if(!battery||typeof battery.addEventListener!=='function')return;
    const evaluate=()=>{
      const next=!battery.charging&&battery.level<=.15?2:!battery.charging&&battery.level<=.3?1:0;
      if(next===floor)return;
      floor=next;
      try{onTierChange(policy().id);}catch{/* ditto */}
    };
    battery.addEventListener('chargingchange',evaluate);
    battery.addEventListener('levelchange',evaluate);
    evaluate();
  }
  return {sample,attachBattery,policy};
}

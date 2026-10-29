import {sound} from './audio.js';
async function cue(open){try{const ctx=sound.ctx;if(!ctx||ctx.state==='closed'||sound.sfxVolume<=0)return false;if(ctx.state!=='running')await ctx.resume();if(ctx.state!=='running'||sound.sfxVolume<=0)return false;const tones=open?[[659.25,.16,.10,0],[880,.18,.10,.09]]:[[330,.23,.15,0],[247,.25,.16,.11],[165,.28,.17,.22],[82,.38,.12,.32]];for(const[f,d,v,delay]of tones)sound.tone(f,d,'triangle',v,sound.sfxGain,delay);return true;}catch(error){console.warn('Optionaler Treppensound:',error);return false;}}
sound.stairs=()=>cue(false);
function setup(){const dialog=document.getElementById('stair-confirm');if(!dialog)return;let wasOpen=dialog.open;new MutationObserver(()=>{const open=dialog.open;if(open&&!wasOpen)cue(true);wasOpen=open;}).observe(dialog,{attributes:true,attributeFilter:['open']});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();

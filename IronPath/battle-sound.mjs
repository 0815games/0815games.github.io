// Optional short cues; audio is only created following an explicit user gesture.
export function createBattleSound(AudioContextClass){
 let context=null,enabled=false,lastPlayed=new Map();
 // Volume is a real gain, not a second mute switch: `setVolume(0)` stays audible
 // (silence has to be spelled as `setEnabled(false)`), so a slider at zero cannot
 // take the sound away without the player noticing why. 0..1, clamped.
 let volume=1;
 const clamp=value=>Number.isFinite(value)?Math.max(.05,Math.min(1,value)):1;
 return {
  async setEnabled(value){
   if(!value){enabled=false;lastPlayed.clear();return false;}
   if(!AudioContextClass)return false;
   try{context??=new AudioContextClass();await context.resume();enabled=context.state==='running';}catch{enabled=false;}
   return enabled;
  },
  getVolume(){return volume;},
  setVolume(value){volume=clamp(value);return volume;},
  play(kind){
   if(!enabled||!context||context.state!=='running')return;
   const frequencies={boss:[180,130],clear:[420,560],ice:[230,160],defeat:[240,120],impact:[170,95],wave:[300,420],request:[380,480],build:[320,440],upgrade:[440,620],ability:[330,520],combo:[510,760],warning:[270,210],reconnect:[360,540]};const notes=frequencies[kind];if(!notes)return;
   const now=context.currentTime;if(now-(lastPlayed.get(kind)??-Infinity)<.3)return;lastPlayed.set(kind,now);
   try{notes.forEach((frequency,i)=>{const osc=context.createOscillator(),gain=context.createGain(),start=now+i*.12;osc.type='triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045*volume,start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+.14);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+.15);});}catch{/* Sound must never interrupt the game. */}
  }
 };
}

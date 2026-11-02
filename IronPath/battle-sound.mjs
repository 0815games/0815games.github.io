// Optional short cues; audio is only created following an explicit user gesture.
export function createBattleSound(AudioContextClass){
 let context=null,enabled=false;
 return {
  async setEnabled(value){
   if(!value){enabled=false;return false;}
   if(!AudioContextClass)return false;
   try{context??=new AudioContextClass();await context.resume();enabled=context.state==='running';}catch{enabled=false;}
   return enabled;
  },
  play(kind){
   if(!enabled||!context||context.state!=='running')return;
   const frequencies={boss:[180,130],clear:[420,560],ice:[230,160],defeat:[240,120],impact:[170,95]};const notes=frequencies[kind];if(!notes)return;
   try{const now=context.currentTime;notes.forEach((frequency,i)=>{const osc=context.createOscillator(),gain=context.createGain(),start=now+i*.12;osc.type='triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045,start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+.14);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+.15);});}catch{/* Sound must never interrupt the game. */}
  }
 };
}

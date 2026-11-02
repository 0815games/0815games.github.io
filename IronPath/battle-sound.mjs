// Optional short cues; audio is only created following an explicit user gesture.
export function createBattleSound(AudioContextClass){
 let context=null,enabled=false,lastPlayed=new Map();
 return {
  async setEnabled(value){
   if(!value){enabled=false;lastPlayed.clear();return false;}
   if(!AudioContextClass)return false;
   try{context??=new AudioContextClass();await context.resume();enabled=context.state==='running';}catch{enabled=false;}
   return enabled;
  },
  play(kind){
   if(!enabled||!context||context.state!=='running')return;
   const frequencies={boss:[180,130],clear:[420,560],ice:[230,160],defeat:[240,120],impact:[170,95],wave:[300,420],request:[380,480],build:[320,440],upgrade:[440,620],ability:[330,520],reconnect:[360,540]};const notes=frequencies[kind];if(!notes)return;
   const now=context.currentTime;if(now-(lastPlayed.get(kind)??-Infinity)<.3)return;lastPlayed.set(kind,now);
   try{notes.forEach((frequency,i)=>{const osc=context.createOscillator(),gain=context.createGain(),start=now+i*.12;osc.type='triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045,start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+.14);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+.15);});}catch{/* Sound must never interrupt the game. */}
  }
 };
}

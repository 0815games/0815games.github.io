// Catch up modest timer jitter without simulating a long background/offline gap.
export function createFixedStepClock({step,advance,now=()=>performance.now(),maxElapsed=.25}){
  let last=now(),accumulated=0;
  return {
    reset(){last=now();accumulated=0;},
    tick(){const current=now(),elapsed=Math.max(0,Math.min(maxElapsed,(current-last)/1000));last=current;accumulated+=elapsed;
      let count=0;while(accumulated+1e-9>=step){accumulated-=step;if(advance()===null){accumulated=0;break;}count++;}return count;}
  };
}

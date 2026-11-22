// Presentation of story status only. Never modifies mission or simulation data.
export function translateStoryDetail(text,tr){
 if(typeof text!=='string')return '';
 let time='',main=text;const timer=main.match(/ Mission time: (\d+)s \(runs during waves\)\.$/);if(timer){time=tr(' Mission time: {seconds}s (runs during waves).',{seconds:timer[1]});main=main.slice(0,-timer[0].length);}
 const patterns=[
  [/^(\d+)s remaining\. Protect the bunker\.$/,'{seconds}s remaining. Protect the bunker.',['seconds']],
  [/^(.+) health: (\d+)%\. Protect it for (\d+)s; nearby enemies damage it\.$/,'{asset} health: {health}%. Protect it for {seconds}s; nearby enemies damage it.',['asset','health','seconds']],
  [/^Escort the survivors to the marker\. Health: (\d+)%\.$/,'Escort the survivors to the marker. Health: {health}%.',['health']],
  [/^Defeat (\d+) more enemy units to break the escort\.$/,'Defeat {count} more enemy units to break the escort.',['count']],
  [/^Hold the marked position for (\d+)s\. Nearby enemies contest it\.$/,'Hold the marked position for {seconds}s. Nearby enemies contest it.',['seconds']],
  [/^Move to the marked location and hold for (\d+)s\.$/,'Move to the marked location and hold for {seconds}s.',['seconds']],
  [/^(.+) destroyed\. The mission has failed\.$/,'{asset} destroyed. The mission has failed.',['asset']]
 ];
 for(const [pattern,key,names] of patterns){const match=main.match(pattern);if(!match)continue;const values=Object.fromEntries(names.map((name,i)=>[name,name==='asset'?tr(match[i+1]):match[i+1]]));return tr(key,values)+time;}
 return tr(main)+time;
}

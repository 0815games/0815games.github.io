import {translateText as tr} from './language.mjs?v=20261107-skillui1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {createLeaderboardService} from './leaderboards.mjs?v=20261104-leaderboards1';
export function setupLeaderboard({document,db,auth,sdk}){
 const $=id=>document.getElementById(id),dialog=$('leaderboardDialog');let mode='solo',filter='all',generation=0;
 function reset(){generation++;if(dialog.open)dialog.close();$('leaderboardRows').replaceChildren();$('leaderboardStatus').textContent='';}
 async function render(){const current=++generation;$('leaderboardStatus').textContent=tr('Loading scores…');$('leaderboardRows').replaceChildren();$('leaderboardBest').textContent=tr('Your best: —');for(const m of ['solo','coop'])$(`leaderboard${m==='solo'?'Solo':'Coop'}`).setAttribute('aria-pressed',String(mode===m));for(const f of ['all','friends'])$(`leaderboard${f==='all'?'All':'Friends'}`).setAttribute('aria-pressed',String(filter===f));
  try{const data=await createLeaderboardService({db,auth,sdk}).scores(mode,filter);if(current!==generation)return;$('leaderboardBest').textContent=tr('Your best: {value}',{value:data.own?.wave?tr('wave {wave}',{wave:data.own.wave}):tr('no score yet')});for(const [i,entry] of data.entries.entries()){const row=document.createElement('li'),rank=document.createElement('span'),name=document.createElement('strong'),wave=document.createElement('span');rank.textContent=`#${i+1}`;name.textContent=entry.id===data.uid?tr('{name} · YOU',{name:entry.name}):`${entry.name} · ${entry.id.slice(0,8)}`;wave.textContent=tr('WAVE {wave}',{wave:entry.wave});row.append(rank,name,wave);$('leaderboardRows').append(row);}$('leaderboardStatus').textContent=tr(data.entries.length?(filter==='all'?'Top 50 scores · all time':'Friends and you · all time'):'No scores yet. Complete a wave to appear here.');
  }catch{if(current===generation)$('leaderboardStatus').textContent=tr('Could not load scores. Check your connection and leaderboard rules.');}
 }
 $('menuLeaderboard').onclick=()=>{if(!auth.currentUser)return;dialog.showModal();void render();};$('leaderboardClose').onclick=reset;dialog.addEventListener('cancel',reset);bindDialogBackdrop(dialog,reset);
 $('leaderboardSolo').onclick=()=>{mode='solo';void render();};$('leaderboardCoop').onclick=()=>{mode='coop';void render();};$('leaderboardAll').onclick=()=>{filter='all';void render();};$('leaderboardFriends').onclick=()=>{filter='friends';void render();};return {reset};
}

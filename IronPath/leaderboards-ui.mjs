import {translateText as tr,onLanguageChange} from './language.mjs?v=20261031-loading1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
import {createLeaderboardService} from './leaderboards.mjs?v=20261031-socialcleanup1';
export function setupLeaderboard({document,db,auth,sdk}){
 const $=id=>document.getElementById(id),dialog=$('leaderboardDialog');let mode='solo',filter='all',generation=0,data=null,status='';
 function reset(){generation++;data=null;status='';if(dialog.open)dialog.close();$('leaderboardRows').replaceChildren();$('leaderboardStatus').textContent='';}
 function paint(){
  $('leaderboardStatus').textContent=tr(status);$('leaderboardRows').replaceChildren();$('leaderboardBest').textContent=tr('Your best: {value}',{value:data?.own?.wave?tr('wave {wave}',{wave:data.own.wave}):data?tr('no score yet'):'—'});
  for(const m of ['solo','coop'])$(`leaderboard${m==='solo'?'Solo':'Coop'}`).setAttribute('aria-pressed',String(mode===m));for(const f of ['all','friends'])$(`leaderboard${f==='all'?'All':'Friends'}`).setAttribute('aria-pressed',String(filter===f));
  if(!data)return;
  for(const [i,entry] of data.entries.entries()){const row=document.createElement('li'),rank=document.createElement('span'),name=document.createElement('strong'),wave=document.createElement('span');rank.textContent=`#${i+1}`;name.textContent=entry.id===data.uid?tr('{name} · YOU',{name:entry.name}):`${entry.name} · ${entry.id.slice(0,8)}`;wave.textContent=tr('WAVE {wave}',{wave:entry.wave});row.append(rank,name,wave);$('leaderboardRows').append(row);}
 }
 async function render(){const current=++generation;data=null;status='Loading scores…';paint();try{const result=await createLeaderboardService({db,auth,sdk}).scores(mode,filter);if(current!==generation)return;data=result;status=data.entries.length?(filter==='all'?'Top 50 scores · all time':'Friends and you · all time'):'No scores yet. Complete a wave to appear here.';paint();}catch{if(current===generation){status='Could not load scores. Check your connection and leaderboard rules.';paint();}}}
 onLanguageChange(()=>{if(dialog.open)paint();});
 $('menuLeaderboard').onclick=()=>{if(!auth.currentUser)return;dialog.showModal();void render();};$('leaderboardClose').onclick=reset;dialog.addEventListener('cancel',reset);bindDialogBackdrop(dialog,reset);
 $('leaderboardSolo').onclick=()=>{mode='solo';void render();};$('leaderboardCoop').onclick=()=>{mode='coop';void render();};$('leaderboardAll').onclick=()=>{filter='all';void render();};$('leaderboardFriends').onclick=()=>{filter='friends';void render();};return {reset};
}

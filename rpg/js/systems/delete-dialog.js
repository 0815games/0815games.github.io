import { cloud } from './firebase.js';
import { ModalManager } from '../ui/modalManager.js';
let slots=[];
const load=cloud.loadAllSlots;
cloud.loadAllSlots=async function(...args){const result=await load.apply(this,args);slots=result;return result;};
function setup(){
 const modal=new ModalManager(),grid=document.getElementById('slots-grid');
 grid.addEventListener('click',e=>{
  const button=e.target.closest('.btn-slot-del');if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();
  const box=button.closest('.slot-box'),index=Array.from(grid.children).indexOf(box),p=slots[index]?.player;
  if(index<0||!p){modal.showNotice('Recke nicht gefunden','Bitte die Recken-Auswahl erneut öffnen.');return;}
  const uid=cloud.auth?.currentUser?.uid;
  modal.showConfirm('Recken endgültig löschen?',`„${p.name}“ — Slot ${index+1}\nDieser Recke und sein gespeicherter Fortschritt werden dauerhaft gelöscht.`,async()=>{
   if(!uid||cloud.auth?.currentUser?.uid!==uid)throw new Error('Sitzung geändert. Bitte erneut anmelden.');
   if(!await cloud.deleteSlot(index))return false;
   slots[index]=null;
   box.remove();
   try{await document.getElementById('cancel-create').onclick();}catch{const status=document.createElement('p');status.textContent='Recke gelöscht. Auswahl bitte erneut öffnen.';grid.append(status);}
   return true;
  },'🗑️');
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();

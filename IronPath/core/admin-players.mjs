// Konto & Charakter: the operator edits another player's account from the
// Betriebssteuerung. The page is public; only Firebase Rules authorize the
// read and the writes (ADMIN-ACCOUNT-RULES-TO-PUBLISH.json - the same admin
// UID that already guards the maintenance switch). No credentials live here.
//
// Two edits, deliberately small:
//   * XP festlegen - one transaction on players/<uid>, the progression value
//     the account itself cannot lower (the player rules stay monotone);
//   * Charaktername - the name moves with its reservation: the new key is
//     checked first, then players/<uid>/name and characterNames/<key> change
//     in one multi-location update, and the old reservation is released only
//     when it still belongs to that player. The friend search index is not
//     rewritten here: friends.mjs republishes the listing on the next account
//     load (the same healing path character-rename.mjs documents).
import {validateCharacterName,characterNameKey} from './character-name.mjs?v=20261121-adminacc1';
import {characterProgress} from './progression.mjs?v=20261105-prestige1';

const XP_MAX=10_000_000;
const uidPattern=/^[A-Za-z0-9_-]{8,128}$/;

export function createAdminPlayers({document,window,auth,db,sdk}={}){
 const $=id=>document.getElementById(id);
 const required=['adminPlayerLookup','adminPlayerLoad','adminPlayerCard','adminPlayerName','adminPlayerUid','adminPlayerMeta','adminXpInput','adminXpApply','adminNameInput','adminNameApply','adminPlayerMessage','adminPlayerConfirm','adminPlayerConfirmTitle','adminPlayerConfirmDetail','adminPlayerConfirmAction','adminPlayerConfirmCancel'];
 const methods=['onAuthStateChanged','ref','get','runTransaction','update'];
 if(!auth||!db||!required.every(id=>$(id))||!methods.every(name=>typeof sdk?.[name]==='function'))throw Error('Invalid administration player tools');
 const ref=path=>sdk.ref(db,path);
 let session=null,generation=0,target=null,operation=false,confirmKind=null,pendingXp=0,pendingName='',renameMove=null;

 const isCurrent=own=>generation===own&&session===auth.currentUser;
 function message(text){$('adminPlayerMessage').textContent=text||'';}
 function render(){
  const signedIn=!!session;
  $('adminPlayerLoad').disabled=!signedIn||operation;
  $('adminXpApply').disabled=!signedIn||operation||!target;
  $('adminNameApply').disabled=!signedIn||operation||!target;
  $('adminPlayerCard').hidden=!target;
  if(target){
   $('adminPlayerName').textContent=target.data.name||'—';
   $('adminPlayerUid').textContent=target.uid;
   const xp=Number(target.data.xp)||0,progress=characterProgress(xp);
   const bits=[`${xp} XP`, `LEVEL ${progress.level}`, `${progress.current} / ${progress.required} XP bis Level ${progress.level+1}`];
   if(target.data.gender)bits.push(String(target.data.gender).toUpperCase());
   if(target.data.enlisted)bits.push(`DIENSTSEIT ${target.data.enlisted}`);
   $('adminPlayerMeta').textContent=bits.join(' · ');
   if(document.activeElement!==$('adminXpInput'))$('adminXpInput').value=String(xp);
   if(document.activeElement!==$('adminNameInput'))$('adminNameInput').value=target.data.name||'';
  }
 }
 function setTarget(uid,data){target={uid,data:data||{}};render();}
 function clearTarget(){target=null;render();}

 async function load(){
  if(!session||operation)return;
  const typed=$('adminPlayerLookup').value.trim();
  if(!typed){message('Charaktername oder UID eingeben.');return;}
  operation=true;message('Spieler wird gesucht …');render();
  try{
   let uid=null;
   if(uidPattern.test(typed)&&!typed.includes(' '))uid=typed;
   else{
    const key=characterNameKey(typed);
    const snap=await sdk.get(ref(`characterNames/${key}`));
    const claim=snap?.val?.();
    if(!isCurrent(generation))return;
    if(!claim?.uid){message('Kein Charakter unter diesem Namen gefunden. Reservierungen existieren nur für Namen seit der Veröffentlichung des Index - sonst die UID verwenden.');clearTarget();return;}
    uid=claim.uid;
   }
   const snap=await sdk.get(ref(`players/${uid}`));
   if(!isCurrent(generation))return;
   if(!snap?.exists?.()){message('Kein Spielerkonto unter dieser UID gefunden.');clearTarget();return;}
   setTarget(uid,snap.val());
   message(`Geladen: ${snap.val()?.name||uid}.`);
  }catch(error){
   if(!isCurrent(generation))return;
   clearTarget();
   const code=String(error?.code||error?.message||'');
   message(/permission[_ -]?denied/i.test(code)
    ?'Zugriff verweigert. Prüfe Admin-UID und die veröffentlichten Account-Rules (ADMIN-ACCOUNT-RULES-TO-PUBLISH.json).'
    :'Spieler konnte nicht geladen werden. Bitte erneut versuchen.');
  }finally{
   if(isCurrent(generation)){operation=false;render();}
  }
 }

 function confirm(kind,title,detail,action){
  if(!target||operation)return;
  confirmKind=kind;
  $('adminPlayerConfirmTitle').textContent=title;
  $('adminPlayerConfirmDetail').textContent=detail;
  $('adminPlayerConfirmAction').textContent=action;
  $('adminPlayerConfirmAction').className=kind==='xp'?'danger':'primary';
  $('adminPlayerConfirm').showModal();
  $('adminPlayerConfirmCancel').focus();
 }
 function closeConfirm(){$('adminPlayerConfirm').close();confirmKind=null;}
 $('adminPlayerConfirmCancel').onclick=closeConfirm;
 $('adminPlayerConfirm').addEventListener('cancel',()=>{confirmKind=null;});

 $('adminPlayerLoad').onclick=()=>void load();
 $('adminPlayerLookup').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();void load();}});

 $('adminXpApply').onclick=()=>{
  if(!target||operation)return;
  const raw=$('adminXpInput').value.trim(),xp=Number(raw);
  if(!raw||!Number.isInteger(xp)||xp<0||xp>XP_MAX){message(`XP muss eine ganze Zahl zwischen0 und ${XP_MAX} sein.`);return;}
  confirm('xp','XP dieses Kontos festlegen?',
   `${target.data.name} (${target.uid}) erhält ${xp} XP - aktuell ${Number(target.data.xp)||0}. Der Wert kann beim Spieler nicht sinken; hier ist er beliebig setzbar.`,
   'XP ANWENDEN');
  pendingXp=xp;
 };
 $('adminNameApply').onclick=()=>{
  if(!target||operation)return;
  const check=validateCharacterName($('adminNameInput').value);
  if(!check.ok){message(check.reason==='length'?'Der Name muss2–24 Zeichen haben.':'Dieser Name kann nicht verwendet werden.');return;}
  if(check.name===(target.data.name||'')){message('Das ist der aktuelle Name.');return;}
  void (async()=>{
   try{
    const key=characterNameKey(check.name);
    const snap=await sdk.get(ref(`characterNames/${key}`));
    const claim=snap?.val?.();
    if(!isCurrent(generation))return;
    if(claim?.uid&&claim.uid!==target.uid){message('Dieser Name ist bereits von einem anderen Konto belegt.');return;}
    let oldKey=null;
    try{oldKey=characterNameKey(target.data.name||'');}catch{oldKey=null;}
    let oldOwned=false;
    if(oldKey&&oldKey!==key){
     const oldSnap=await sdk.get(ref(`characterNames/${oldKey}`));
     oldOwned=oldSnap?.val?.()?.uid===target.uid;
    }
    if(!isCurrent(generation))return;
    pendingName=check.name;
    confirm('name','Charaktername ändern?',
     `${target.data.name||'—'} wird zu ${check.name}${oldOwned?', die alte Reservierung wird freigegeben':''}. Die Freunde-Liste stellt sich beim nächsten Konto-Laden selbst um.`,
     'NAME ÄNDERN');
    // Stash for the confirm action.
    renameMove={uid:target.uid,key,oldKey:oldOwned?oldKey:null};
   }catch(error){
    if(!isCurrent(generation))return;
    const code=String(error?.code||error?.message||'');
    message(/permission[_ -]?denied/i.test(code)
     ?'Zugriff verweigert. Prüfe die Account-Rules - characterNames ist Admin-only.'
     :'Name konnte nicht geprüft werden. Nichts wurde geändert.');
   }
  })();
 };

 $('adminPlayerConfirmAction').onclick=async()=>{
  const kind=confirmKind;
  if(!kind||!target||operation)return;
  if(kind==='xp'){
   const xp=pendingXp,uid=target.uid,own=generation;
   closeConfirm();operation=true;message('XP werden geschrieben …');render();
   try{
    const result=await sdk.runTransaction(ref(`players/${uid}`),current=>{
     if(!current)return;
     return {...current,xp};
    },{applyLocally:false});
    if(!isCurrent(own))return;
    if(!result?.committed){message('XP wurden nicht bestätigt. Nichts wurde geändert.');return;}
    const snap=await sdk.get(ref(`players/${uid}`));
    if(!isCurrent(own))return;
    if(snap?.exists())setTarget(uid,snap.val());
    message(`XP gesetzt: ${xp}.`);
   }catch(error){
    if(!isCurrent(own))return;
    const code=String(error?.code||error?.message||'');
    message(/permission[_ -]?denied/i.test(code)
     ?'Zugriff verweigert. Prüfe Admin-UID und die veröffentlichten Account-Rules.'
     :'XP konnten nicht geschrieben werden. Bitte erneut versuchen.');
   }finally{
    if(isCurrent(own)){operation=false;render();}
   }
   return;
  }
  if(kind==='name'){
   const move=renameMove;
   if(!move||!move.key){closeConfirm();return;}
   const own=generation,uid=move.uid;
   closeConfirm();operation=true;message('Name wird geschrieben …');render();
   try{
    const update={[`players/${uid}/name`]:pendingName,[`characterNames/${move.key}`]:{uid}};
    if(move.oldKey)update[`characterNames/${move.oldKey}`]=null;
    await sdk.update(ref('/'),update);
    if(!isCurrent(own))return;
    const snap=await sdk.get(ref(`players/${uid}`));
    if(!isCurrent(own))return;
    if(snap?.exists())setTarget(uid,snap.val());
    message(`Name geändert: ${pendingName}.`);
   }catch(error){
    if(!isCurrent(own))return;
    const code=String(error?.code||error?.message||'');
    message(/permission[_ -]?denied/i.test(code)
     ?'Zugriff verweigert. Prüfe die Account-Rules - name und characterNames sind Admin-only.'
     :'Name konnte nicht geschrieben werden. Nichts wurde bestätigt - bitte erneut prüfen.');
   }finally{
    renameMove=null;
    if(isCurrent(own)){operation=false;render();}
   }
   return;
  }
  closeConfirm();
 };

 const offAuth=sdk.onAuthStateChanged(auth,user=>{
  generation++;
  const own=generation;
  session=user||null;
  operation=false;confirmKind=null;renameMove=null;
  if($('adminPlayerConfirm').open)$('adminPlayerConfirm').close();
  if(!session)clearTarget();
  render();
  if(!session)message('');
 });
 render();
 return Object.freeze({stop(){generation++;offAuth?.();if($('adminPlayerConfirm').open)$('adminPlayerConfirm').close();}});
}

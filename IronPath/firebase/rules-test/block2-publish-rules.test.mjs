// Integration tests against the exact BLOCK2-RULES-TO-PUBLISH.json artifact
// (rebased on BLOCK9D-RULES-TO-PUBLISH.json) inside the Firebase RTDB emulator.
import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,remove,update,runTransaction,query,orderByKey,limitToFirst} from 'firebase/database';
import {webcrypto} from 'node:crypto';
import {MAINTENANCE_PATH} from '../../core/maintenance-check.mjs';
import {characterNameKey} from '../../core/character-name.mjs';
import {createCharacterNameClaim} from '../../core/character-name-claim.mjs';
import {createCharacterNameConflictHandler} from '../../core/character-name-conflict.mjs';
import {createCharacterDeletion} from '../../core/character-deletion.mjs';
import {createActiveSessionManager} from '../../core/active-session.mjs';
import {encodeBuild,parseBuild,SKILL_PATHS} from '../../core/skills.mjs';

let env,alice,bob,charlie,anon;
const sdk={ref,set,get,remove,update,runTransaction,query,orderByKey,limitToFirst};
const now=Math.floor(Date.now()/1000);
const claims=(offset=30)=>({iat:now,auth_time:now-offset,firebase:{sign_in_provider:'password',identities:{}}});

function createConflictDialogDom(){
  const el=()=>({textContent:'',value:'',disabled:false,listeners:{},onclick:null,open:false,
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},
    showModal(){this.open=true;},
    close(){this.open=false;},
    focus(){},
  });
  const elements={
    nameConflictDialog:el(),
    nameConflictForm:el(),
    nameConflictCurrentName:el(),
    nameConflictInput:el(),
    nameConflictStatus:el(),
    nameConflictSubmit:el(),
    nameConflictLogout:el(),
  };
  return {elements,document:{getElementById:id=>elements[id]??null}};
}

before(async()=>{
  env=await initializeTestEnvironment({
    projectId:'demo-ironpath',
    database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../BLOCK2-RULES-TO-PUBLISH.json',import.meta.url),'utf8')}
  });
  alice=env.authenticatedContext('alice',claims()).database();
  bob=env.authenticatedContext('bob',claims()).database();
  charlie=env.authenticatedContext('charlie',claims()).database();
  anon=env.unauthenticatedContext().database();
  // Wait for RTDB emulator rules warm-up before running tests.
  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),MAINTENANCE_PATH),{format:1,mode:'open',authAfterMs:0}));
  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'players/alice/name'),'Alex'));
  for(let attempt=1;attempt<=30;attempt++){
    try{await get(ref(alice,'players/alice/name'));break;}
    catch{await new Promise(r=>setTimeout(r,200));}
  }
});

beforeEach(async()=>{
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.database();
    const bobKey=characterNameKey('Alex');
    const codeB='b'.repeat(32);
    await set(ref(db),{
      [MAINTENANCE_PATH]:{format:1,mode:'open',authAfterMs:0},
      players:{
        alice:{name:'Alex',gender:'female',xp:100,skills:'v2;none',avatar:'g:f|face:crop'},
        bob:{name:'Alex',gender:'male',xp:4200,storyProgress:1,armory:'1;2',skills:encodeBuild(parseBuild('v2;assault;2;1;10000000000110',10)),avatar:'g:m|look:beard'},
        charlie:{name:'Charlie',gender:'male',xp:250,skills:'v2;none'},
      },
      friendships:{bob:{alice:{status:'accepted',senderName:'Alex',receiverName:'Alex',code:codeB}}},
      friendPrivate:{bob:{code:codeB,searchKey:bobKey}},
      friendCodes:{[codeB]:{uid:'bob',name:'Alex'}},
      friendNames:{[bobKey]:{bob:{name:'Alex',code:codeB}}},
    });
  });
});

after(async()=>env?.cleanup());

test('BLOCK2-RULES-TO-PUBLISH enforces strict Unicode casefolding across claims and blocks unauthenticated/closed-maintenance access',async()=>{
  const claimA=createCharacterNameClaim({db:alice,auth:{currentUser:{uid:'alice'}},sdk});
  const claimB=createCharacterNameClaim({db:bob,auth:{currentUser:{uid:'bob'}},sdk});

  assert.equal((await claimA.claim('Straße')).status,'claimed');
  assert.equal((await claimB.claim('STRASSE')).status,'taken');
  assert.equal((await claimB.claim('STRAẞE')).status,'taken');

  assert.equal((await claimA.claim('ﬁn')).status,'claimed');
  assert.equal((await claimB.claim('FIN')).status,'taken');

  assert.equal((await claimA.claim('ΜΑΡΚΟΣ')).status,'claimed');
  assert.equal((await claimB.claim('μαρκοσ')).status,'taken');

  await assertFails(get(ref(anon,`characterNames/${characterNameKey('Straße')}`)));
  await assertFails(get(ref(alice,'characterNames')));

  // Maintenance closed blocks characterNames reads and writes.
  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),MAINTENANCE_PATH),{format:1,mode:'closed',authAfterMs:Date.now()}));
  await assertFails(get(ref(alice,`characterNames/${characterNameKey('Straße')}`)));
  await assertFails(set(ref(bob,`characterNames/${characterNameKey('FreeName')}`),{uid:'bob',name:'FreeName',at:Date.now()}));
});

test('BLOCK2-RULES-TO-PUBLISH runs silent login backfill, resolves legacy duplicates via #nameConflictDialog without progress loss, and releases cross-session names on deletion',async()=>{
  // 1. Alice signs in first with duplicate name "Alex": silent backfill reserves it.
  const domA=createConflictDialogDom();
  const aliceHandler=createCharacterNameConflictHandler({
    document:domA.document,db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto:webcrypto,
  });
  const aliceRes=await aliceHandler.reconcile('Alex');
  assert.equal(aliceRes.status,'claimed');
  assert.equal(domA.elements.nameConflictDialog.open,false);

  // 2. Bob signs in second with legacy duplicate "Alex": conflict modal opens.
  const domB=createConflictDialogDom();
  let renamedName=null;
  const bobHandler=createCharacterNameConflictHandler({
    document:domB.document,db:bob,auth:{currentUser:{uid:'bob'}},sdk,crypto:webcrypto,
    onRenamed:name=>{renamedName=name;},
  });
  const bobRes=await bobHandler.reconcile('Alex');
  assert.equal(bobRes.status,'taken');
  assert.equal(domB.elements.nameConflictDialog.open,true);
  assert.equal(domB.elements.nameConflictCurrentName.textContent,'Alex');

  // 3. Bob submits unique new name "AlexTwo" through the handler against real RTDB rules.
  domB.elements.nameConflictInput.value='AlexTwo';
  for(const fn of domB.elements.nameConflictForm.listeners.submit||[])await fn({preventDefault(){}});
  assert.equal(renamedName,'AlexTwo');
  assert.equal(domB.elements.nameConflictDialog.open,false);

  const bobAfter=(await assertSucceeds(get(ref(bob,'players/bob')))).val();
  assert.equal(bobAfter.name,'AlexTwo');
  assert.equal(bobAfter.xp,4200);
  assert.equal(bobAfter.armory,'1;2');
  assert.equal(bobAfter.storyProgress,1);
  assert.match(bobAfter.skills,/^v2;assault;/);

  const oldKey=characterNameKey('Alex'),newKey=characterNameKey('AlexTwo');
  assert.equal((await get(ref(alice,`characterNames/${oldKey}`))).val().uid,'alice','alice keeps the legacy name');
  assert.equal((await get(ref(bob,`characterNames/${newKey}`))).val().uid,'bob','bob holds the new name');
  assert.equal((await get(ref(bob,`friendPrivate/bob/searchKey`))).val(),newKey);
  assert.equal((await get(ref(bob,`friendNames/${oldKey}/bob`))).val(),null);
  assert.equal((await get(ref(bob,`friendNames/${newKey}/bob`))).val().name,'AlexTwo');
  assert.equal((await get(ref(bob,`friendCodes/${'b'.repeat(32)}/name`))).val(),'AlexTwo');

  // 4. Preserves Block 9D activeSessions, Block 5 skills, and Block 4 friend portraits.
  const {onValue,onDisconnect,serverTimestamp}=await import('firebase/database');
  const lease=createActiveSessionManager({db:bob,sdk:{...sdk,onValue,onDisconnect,serverTimestamp},uid:'bob',clientId:'a'.repeat(32)});
  try{
    assert.equal((await lease.acquire()).status,'claimed');
    assert.equal((await assertSucceeds(get(ref(alice,'players/bob/avatar')))).val(),'g:m|look:beard');
    for(const path of SKILL_PATHS){
      await assertSucceeds(set(ref(bob,'players/bob/skills'),encodeBuild(parseBuild(`v2;${path.id};1;0;00000000000000`,5))));
    }
  }finally{
    await lease.release();
  }

  // 5. Charlie backfills name, then deletes character across sessions: index entry must be freed atomically.
  const claimA=createCharacterNameClaim({db:alice,auth:{currentUser:{uid:'alice'}},sdk});
  const claimC=createCharacterNameClaim({db:charlie,auth:{currentUser:{uid:'charlie'}},sdk});
  assert.equal((await claimC.claim('Charlie')).status,'claimed');
  const charlieKey=characterNameKey('Charlie');
  const del=createCharacterDeletion({db:charlie,auth:{currentUser:{uid:'charlie'}},sdk,releaseNameKey:charlieKey});
  await assertSucceeds(del.remove('Charlie'));
  assert.equal((await get(ref(alice,`characterNames/${charlieKey}`))).val(),null,'deleted character frees its reservation');
  assert.equal((await claimA.claim('Charlie')).status,'claimed');
});

test('BLOCK2-RULES-TO-PUBLISH pre-wires Block 6 per-character tutorial persistence, monotonic reward lock, and deletion reset',async()=>{
  // Owner records dossier offer, permanent decline, and settings restart.
  await assertSucceeds(set(ref(alice,'players/alice/tutorial'),{
    edition:3,
    status:'offered',
    rewarded:false,
    phase:'dossier',
    step:0,
  }));
  await assertSucceeds(update(ref(alice,'players/alice/tutorial'),{status:'declined',phase:'dossier'}));
  assert.equal((await get(ref(alice,'players/alice/tutorial/status'))).val(),'declined');
  await assertSucceeds(update(ref(alice,'players/alice/tutorial'),{status:'accepted',phase:'mission',step:2}));

  // Reward & mission completion lock irreversibly onto the character.
  await assertSucceeds(runTransaction(ref(alice,'players/alice'),current=>{
    if(!current)return current;
    return {
      ...current,
      xp:current.xp+150,
      tutorial:{...current.tutorial,status:'completed',missionCompleted:true,rewarded:true,phase:'done',step:6},
    };
  }));
  // Replaying from settings works, but rewarded/missionCompleted/edition may never regress.
  await assertSucceeds(update(ref(alice,'players/alice/tutorial'),{status:'accepted',phase:'mission',step:0}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{rewarded:false}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{missionCompleted:false}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{edition:2}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{status:'bogus'}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{phase:'bogus'}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{step:1001}));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{extraFlag:true}));
  // Dropping only `tutorial` while keeping the character must fail; other users & anon are blocked.
  await assertFails(remove(ref(alice,'players/alice/tutorial')));
  await assertFails(get(ref(bob,'players/alice/tutorial')));
  await assertFails(set(ref(bob,'players/alice/tutorial'),{edition:3,status:'declined',rewarded:false}));
  await assertFails(get(ref(anon,'players/alice/tutorial')));

  // Full character deletion clears `tutorial` atomically so a new soldier on the same UID starts fresh.
  const claimC=createCharacterNameClaim({db:charlie,auth:{currentUser:{uid:'charlie'}},sdk});
  assert.equal((await claimC.claim('Charlie')).status,'claimed');
  await assertSucceeds(set(ref(charlie,'players/charlie/tutorial'),{
    edition:3,
    status:'completed',
    missionCompleted:true,
    rewarded:true,
    phase:'done',
    step:8,
  }));
  const del=createCharacterDeletion({db:charlie,auth:{currentUser:{uid:'charlie'}},sdk,releaseNameKey:characterNameKey('Charlie')});
  await assertSucceeds(del.remove('Charlie'));
  assert.equal((await get(ref(charlie,'players/charlie'))).val(),null);
  await assertSucceeds(set(ref(charlie,'players/charlie'),{
    name:'CharlieNew',
    gender:'female',
    xp:0,
    tutorial:{edition:3,status:'offered',rewarded:false,phase:'dossier',step:0},
  }));

  // Maintenance mode locks players/$uid/tutorial along with players/$uid.
  await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),MAINTENANCE_PATH),{format:1,mode:'maintenance',authAfterMs:0}));
  await assertFails(get(ref(alice,'players/alice/tutorial')));
  await assertFails(update(ref(alice,'players/alice/tutorial'),{status:'declined'}));
});

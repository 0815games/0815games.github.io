import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {initializeWireWorkshop,applyWireWorkshopCommand} from '../workshop-wire.mjs';
import {makeWorkshopOffer,lockWorkshopRoster,verifyWorkshopRoster,decodeMatchLoadout} from '../workshop-multiplayer.mjs';
import {workshopEffects} from '../workshop-effects.mjs';
const matchId='0123456789abcdef0123456789abcdef';
function profile(item){return initializeWireWorkshop({name:'A',armory:{scrap:100,owned:1<<(item-1),equipped:item}});}
function fixture(mode='coop',ids=['alice','bob']){const profiles=Object.fromEntries(ids.map((id,i)=>[id,profile(i?3:1)]));return {profiles,args:{matchId,mode,playerIds:ids,offers:Object.fromEntries(ids.map(id=>[id,makeWorkshopOffer(profiles[id],mode)]))}};}
test('locks each account loadout and does not track subsequent account changes',()=>{
 const {profiles,args}=fixture(),lock=lockWorkshopRoster(args);assert.ok(lock);assert.equal(lock.players.length,2);
 const a=decodeMatchLoadout(lock.players[0].loadout,'coop'),b=decodeMatchLoadout(lock.players[1].loadout,'coop');assert.equal(workshopEffects(a,1).damage,3);assert.equal(workshopEffects(b,1).movement,20);
 profiles.alice=applyWireWorkshopCommand(profiles.alice,{type:'equip',slot:'gadget',item:'none'});assert.equal(workshopEffects(a,1).damage,3);assert.equal(verifyWorkshopRoster(lock,args),true);
 assert.equal(verifyWorkshopRoster(lock,{...args,offers:{...args.offers,alice:makeWorkshopOffer(profiles.alice,'coop')}}),false);
});
test('rejects missing, old, malformed and mode-mismatched clients',()=>{
 const {args}=fixture(),good=args.offers.alice;
 for(const bad of [undefined,{protocol:0,loadout:good.loadout},{protocol:1,loadout:'bad'},{protocol:1,loadout:good.loadout,extra:true},makeWorkshopOffer(profile(1),'versus')])assert.equal(lockWorkshopRoster({...args,offers:{alice:good,bob:bad}}),null);
 assert.equal(lockWorkshopRoster({...args,playerIds:['alice','alice']}),null);assert.equal(lockWorkshopRoster({...args,playerIds:['alice']}),null);assert.equal(lockWorkshopRoster({...args,matchId:'invalid'}),null);
 assert.equal(decodeMatchLoadout('[1,"coop",[["standard",null],["none",null],["legacy-1","evil"]]]','coop'),null);
});
test('restore compares exact roster, mode, party and original loadouts',()=>{
 const {args}=fixture(),lock=lockWorkshopRoster(args);assert.ok(verifyWorkshopRoster(JSON.parse(JSON.stringify(lock)),args));assert.ok(verifyWorkshopRoster({players:lock.players.map(p=>({loadout:p.loadout,id:p.id})),mode:lock.mode,matchId:lock.matchId,protocol:lock.protocol},args));
 assert.equal(verifyWorkshopRoster(lock,{...args,playerIds:['bob','alice']}),false);assert.equal(verifyWorkshopRoster(lock,{...args,matchId:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}),false);
 assert.equal(verifyWorkshopRoster({...lock,players:[...lock.players].reverse()},args),false);assert.equal(verifyWorkshopRoster({...lock,unexpected:true},args),false);
});
test('competitive loadouts preserve appearance while effects are normalized',()=>{
 for(const [mode,ids] of [['versus',['alice','bob']],['two-vs-two',['a','b','c','d']]]){
  const {args}=fixture(mode,ids),lock=lockWorkshopRoster(args);assert.ok(lock);
  for(const entry of lock.players){const snap=decodeMatchLoadout(entry.loadout,mode);assert.ok(snap.items.some(item=>item.id.startsWith('legacy-')));assert.equal(workshopEffects(snap,10).damage,0);assert.equal(workshopEffects(snap,10).movement,0);}
 }
});

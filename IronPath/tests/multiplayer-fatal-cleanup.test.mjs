import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFirebaseRecoverableGame} from '../firebase-recoverable-game.mjs';
const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5));}throw Error('Timed out');};
test('recoverable guest removes presence and listeners after an invalid packet',async()=>{
 const party='a'.repeat(32),owner='b'.repeat(32),values=new Map([['.info/connected',true],['.info/serverTimeOffset',0],[`fourParties/${party}/recovery/lease`,{generation:1,owner}]]),listeners=new Map(),states=[];
 function read(path){if(values.has(path))return values.get(path);const result={};for(const [key,value] of values)if(key.startsWith(path+'/')){const sub=key.slice(path.length+1);if(!sub.includes('/'))result[sub]=value;}return Object.keys(result).length?result:null;}
 function notify(path){for(const [key,callbacks] of listeners)if(key===path||path.startsWith(key+'/'))for(const cb of callbacks)cb({val:()=>read(key)});}
 const sdk={ref:(_db,path)=>path,onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);cb({val:()=>read(path)});return()=>listeners.get(path).delete(cb);},onDisconnect(){return {async remove(){}};},serverTimestamp:()=>Date.now(),async set(path,value){values.set(path,value);notify(path);},async remove(path){values.delete(path);notify(path);}};
 const game=createFirebaseRecoverableGame({db:{},auth:{currentUser:{uid:'bob'}},sdk,partyId:party,manifest:{hostId:'alice',playerIds:['alice','bob'],mode:'coop'},crypto:{getRandomValues(a){a.fill(5);}},onState:value=>states.push(value)});
 try{game.start();const presence=`fourParties/${party}/presence/bob/`;await wait(()=>[...values.keys()].some(k=>k.startsWith(presence)));await sdk.set(`fourParties/${party}/recovery/sessions/${owner}/views/bob`,'not-json');await wait(()=>states.includes('error')&&![...values.keys()].some(k=>k.startsWith(presence)));assert.equal([...listeners.values()].reduce((n,set)=>n+set.size,0),0);assert.equal((await game.command({type:'startWave'})).ok,false);await game.stop();await game.stop();}finally{await game.stop();}
});

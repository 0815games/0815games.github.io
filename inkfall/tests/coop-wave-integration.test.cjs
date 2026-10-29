'use strict';
const assert=require('node:assert/strict');
const {createWaveHost}=require('../game/js/coop-wave-host.js');

const config={
  ground:[[0,0],[940,0]],
  air:[[0,10],[940,10]],
  enemies:{
    crawler:{hp:60,s:1,dmg:5,route:'ground'},
    runner:{hp:30,s:2,dmg:5,route:'ground'},
    flyer:{hp:40,s:2,dmg:5,route:'air'}
  },
  waves:[[['crawler',2]],[['runner',1],['flyer',1]]]
};

const session={
  schemaVersion:1,
  id:'session-1',
  hostUid:'host',
  players:{
    host:{uid:'host'},
    guest:{uid:'guest'}
  },
  phase:'running'
};

function fakeRoom(initialWaves){
  let room={
    session,
    host:{uid:'host',online:true},
    guest:{uid:'guest',online:true},
    movement:{paused:false},
    waveStart:null,
    waves:initialWaves||null
  };

  const wavesReference={
    transaction(update){
      const next=update(room.waves);
      if(next===undefined){
        return Promise.resolve({committed:false});
      }
      room={...room,waves:next};
      return Promise.resolve({
        committed:true,
        snapshot:{val:()=>next}
      });
    }
  };

  return {
    get:async()=>({val:()=>room}),
    child(path){
      if(path==='waves')return wavesReference;
      if(path==='waveStart'){
        return {
          remove:async()=>{room={...room,waveStart:null};}
        };
      }
      throw new Error('Unerwarteter Pfad: '+path);
    },
    room:()=>room,
    setWaves(value){room={...room,waves:value};},
    setStart(value){room={...room,waveStart:value};}
  };
}

function makeHost(room,writerId='writer-1'){
  return createWaveHost(room,session,'host',{
    writerId,
    now:()=>1000,
    config
  });
}

let passed=0,failed=0;
const tests=[];

function test(name,fn){
  tests.push({name,fn});
}

test('Erster Tick erzeugt einen gemeinsamen Vorbereitungszustand',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  const result=await host.tick(0);
  assert.equal(result.committed,true);
  assert.equal(result.state.phase,'preparation');
  assert.equal(result.state.wave,0);
  assert.equal(result.state.lease.writerId,'writer-1');
});

test('Host-Startanforderung startet Welle 1 und wird verbraucht',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  await host.tick(0);
  room.setStart({id:'start-1',expectedWave:1,requestedBy:'host'});
  const result=await host.tick(0);
  assert.equal(result.committed,true);
  assert.equal(result.reason,'started');
  assert.equal(result.state.phase,'running');
  assert.equal(result.state.wave,1);
  assert.equal(room.room().waveStart,null);
  assert.equal(Object.keys(result.state.pending).length,2);
});

test('Wellenstart während einer laufenden Welle wird abgewiesen',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  await host.tick(0);
  room.setStart({id:'start-1',expectedWave:1,requestedBy:'host'});
  await host.tick(0);
  room.setStart({id:'start-2',expectedWave:2,requestedBy:'host'});
  const result=await host.tick(0);
  assert.equal(result.committed,false);
  assert.equal(result.reason,'start-rejected');
  assert.equal(room.room().waveStart,null);
  assert.equal(room.room().waves.wave,1);
});

test('Tick spawnt und bewegt Gegner im gemeinsamen Zustand',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  await host.tick(0);
  room.setStart({id:'start-1',expectedWave:1,requestedBy:'host'});
  await host.tick(0);
  const result=await host.tick(0.1);
  assert.equal(result.reason,'tick');
  assert.equal(Object.keys(result.state.enemies).length,1);

  let later=result.state;
  for(let i=0;i<8;i++){
    later=(await host.tick(0.1)).state;
  }
  assert.equal(Object.keys(later.enemies).length,2);
});

test('Pause stoppt die Welle, Fortsetzung setzt sie fort',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  await host.tick(0);
  room.setStart({id:'start-1',expectedWave:1,requestedBy:'host'});
  await host.tick(0);
  const paused=await host.pause();
  assert.equal(paused.committed,true);
  assert.equal(paused.state.phase,'paused');
  const unchanged=await host.tick(0.1);
  assert.equal(unchanged.committed,false);
  const resumed=await host.resume();
  assert.equal(resumed.committed,true);
  assert.equal(resumed.state.phase,'running');
});

test('Fremde Lease blockiert den zweiten Host-Tab',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  await host.tick(0);
  const other=makeHost(room,'writer-2');
  const result=await other.tick(0.1);
  assert.equal(result.committed,false);
  assert.equal(result.reason,'lease-owned');
});

test('Abgelaufene Lease wird pausiert übernommen',async()=>{
  const room=fakeRoom(),host=makeHost(room);
  await host.tick(0);
  room.setStart({id:'start-1',expectedWave:1,requestedBy:'host'});
  await host.tick(0);
  room.setWaves({...room.room().waves,lease:{
    ...room.room().waves.lease,
    until:999
  }});
  const late=makeHost(room,'writer-2');
  const result=await late.tick(0.1);
  assert.equal(result.committed,true);
  assert.equal(result.reason,'takeover-paused');
  assert.equal(result.state.phase,'paused');
  assert.equal(result.state.lease.writerId,'writer-2');
});

test('Gast kann keinen Wellenzustand berechnen',()=>{
  const room=fakeRoom();
  assert.throws(()=>createWaveHost(
    room,session,'guest',
    {writerId:'writer-1',now:()=>1000,config}
  ),/Host/);
});

test('Fehlende Wellenkonfiguration wird abgewiesen',()=>{
  const room=fakeRoom();
  assert.throws(()=>createWaveHost(
    room,session,'host',
    {writerId:'writer-1',now:()=>1000}
  ),/Wellenkonfiguration/);
});

(async()=>{
  for(const {name,fn} of tests){
    try{
      await fn();
      passed++;
      console.log('OK   '+name);
    }catch(e){
      failed++;
      console.error('FAIL '+name);
      console.error(e.stack||e);
    }
  }

  console.log('\nErgebnis C2a.2: '+passed+' bestanden, '+failed+' fehlgeschlagen.');
  process.exitCode=failed?1:0;
})();

(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./coop-waves.js'));
  }else{
    root.InkfallCoopWaveHost=factory(root.InkfallCoopWaves);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(wavesApi){
  'use strict';

  const LEASE_MS=4000;
  const RENEW_MS=1500;

  function requireValue(condition,message){
    if(!condition)throw new Error(message);
  }

  function createWaveHost(roomReference,session,uid,options={}){
    requireValue(
      wavesApi&&typeof wavesApi.createEngine==='function',
      'Wellenkern fehlt.'
    );

    requireValue(
      session&&session.schemaVersion===1&&
      typeof session.id==='string'&&
      typeof session.hostUid==='string'&&
      uid===session.hostUid,
      'Nur der Host darf Wellen steuern.'
    );

    requireValue(
      roomReference&&
      typeof roomReference.get==='function'&&
      typeof roomReference.child==='function',
      'Ungültige Raumreferenz.'
    );

    requireValue(
      typeof options.writerId==='string'&&
      /^[A-Za-z0-9_-]{1,80}$/.test(options.writerId),
      'Eindeutige Writer-ID fehlt.'
    );

    const config=options.config||
      (typeof root!=='undefined'?root.inkfallCoopWaveConfig:null);

    requireValue(config,'Wellenkonfiguration fehlt.');

    const engine=wavesApi.createEngine(config);
    const reference=roomReference.child('waves');
    const writerId=options.writerId;
    const now=options.now||(()=>Date.now());

    requireValue(typeof now==='function','Ungültige Uhr.');
    requireValue(
      reference&&typeof reference.transaction==='function',
      'Wellen-Transaktion fehlt.'
    );

    let inFlight=false;
    let stopped=false;

    async function process(operation,dt){
      if(stopped)return {committed:false,reason:'stopped'};
      if(inFlight)return {committed:false,reason:'busy'};

      requireValue(
        Number.isFinite(dt)&&dt>=0&&dt<=0.1,
        'Ungültiger Zeitschritt.'
      );

      inFlight=true;

      try{
        const snapshot=await roomReference.get();
        const room=snapshot.val();

        if(stopped)return {committed:false,reason:'stopped'};

        requireValue(
          room?.session?.id===session.id&&
          room.session.hostUid===uid&&
          room.session.players?.host?.uid===uid,
          'Sitzung oder Raumbelegung hat sich geändert.'
        );

        requireValue(
          ['preparation','running'].includes(room.session.phase),
          'Sitzung ist nicht für Wellen freigegeben.'
        );

        const startRequest=room.waveStart||null;
        let reason='unchanged';

        const result=await reference.transaction(current=>{
          if(stopped){
            reason='stopped';
            return;
          }

          const timestamp=now();

          requireValue(
            Number.isSafeInteger(timestamp)&&timestamp>=0,
            'Ungültiger Zeitpunkt.'
          );

          if(!current){
            if(operation!=='tick'){
              reason='wait-init';
              return;
            }

            const created=engine.create({
              schemaVersion:1,
              id:session.id,
              hostUid:uid
            });

            reason='initialized';

            return {
              ...created,
              lease:{
                writerId,
                until:timestamp+LEASE_MS
              }
            };
          }

          requireValue(
            current.sessionId===session.id&&
            current.hostUid===uid,
            'Wellenzustand gehört zu einer anderen Sitzung.'
          );

          const lease=current.lease;

          if(lease){
            requireValue(
              typeof lease.writerId==='string'&&
              Number.isSafeInteger(lease.until)&&
              lease.until>=0,
              'Ungültige Wellen-Lease.'
            );
          }

          if(
            lease&&
            lease.writerId!==writerId&&
            lease.until>timestamp
          ){
            reason='lease-owned';
            return;
          }

          const takeover=
            !lease||
            lease.writerId!==writerId||
            lease.until<=timestamp;

          let next=current;

          if(takeover){
            if(current.phase==='running'){
              next=engine.pause(current,uid);
            }
            reason='takeover-paused';
          }else if(operation==='pause'){
            if(current.phase==='running'){
              next=engine.pause(current,uid);
              reason='pause';
            }
          }else if(operation==='resume'){
            if(current.phase==='paused'){
              next=engine.resume(current,uid);
              reason='resume';
            }
          }else if(current.phase==='running'){
            if(startRequest){
              reason='start-rejected';
            }else{
              next=engine.step(current,dt);
              reason=next===current?'unchanged':'tick';
            }
          }else if(
            current.phase==='preparation'&&
            startRequest
          ){
            next=engine.startWave(current,uid,startRequest);
            reason='started';
          }

          if(
            next===current&&
            lease&&
            lease.until-timestamp>RENEW_MS
          ){
            return;
          }

          return {
            ...next,
            lease:{
              writerId,
              until:timestamp+LEASE_MS
            }
          };
        },undefined,false);

        requireValue(
          result&&typeof result.committed==='boolean',
          'Wellen-Update wurde nicht bestätigt.'
        );

        if(!result.committed){
          if(reason==='start-rejected'){
            await roomReference.child('waveStart').remove();
          }
          return {committed:false,reason};
        }

        if(reason==='started'){
          await roomReference.child('waveStart').remove();
        }

        const state=result.snapshot?.val();

        requireValue(
          state&&
          state.sessionId===session.id&&
          state.lease?.writerId===writerId,
          'Bestätigter Wellenzustand ist ungültig.'
        );

        return {committed:true,reason,state};
      }finally{
        inFlight=false;
      }
    }

    return Object.freeze({
      tick:dt=>process('tick',dt),
      pause:()=>process('pause',0),
      resume:()=>process('resume',0),
      stop:()=>{stopped=true;}
    });
  }

  return Object.freeze({LEASE_MS,createWaveHost});
});

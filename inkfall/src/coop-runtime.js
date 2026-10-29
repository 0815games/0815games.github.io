(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports){
    module.exports=factory(
      require('./coop-commands.js'),
      require('./coop-host.js'),
      require('./coop-wave-host.js')
    );
  }else{
    root.InkfallCoopRuntime=factory(
      root.InkfallCoopCommands,
      root.InkfallCoopHost,
      root.InkfallCoopWaveHost
    );
    root.InkfallCoopRuntime.mount(root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(commandsApi,hostApi,waveHostApi){
  'use strict';

  let active=null;

  function project(session,movement){
    const next=typeof structuredClone==='function'
      ?structuredClone(session)
      :JSON.parse(JSON.stringify(session));
    if(!movement)return next;

    if(movement.sessionId!==session.id){
      throw new Error('Bewegung gehört zu einer anderen Sitzung.');
    }

    for(const slot of ['host','guest']){
      const p=movement.players?.[slot];
      if(
        !p || p.uid!==session.players?.[slot]?.uid ||
        !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
        p.x<0 || p.x>940 || p.y<0 || p.y>600
      ){
        throw new Error('Ungültige Bewegungsdaten.');
      }
      next.players[slot].x=p.x;
      next.players[slot].y=p.y;
    }

    return next;
  }

  function createRuntime(reference,session,uid,options={}){
    const sender=commandsApi.createSender(reference,session,uid);
    const isHost=uid===session.hostUid;

    const host=isHost?hostApi.createHost(reference,session,uid,{
      writerId:options.writerId,
      now:options.now
    }):null;

    const waveHost=isHost?waveHostApi.createWaveHost(reference,session,uid,{
      writerId:options.writerId,
      now:options.now,
      config:options.waveConfig||globalThis.inkfallCoopWaveConfig
    }):null;

    const every=options.setInterval||setInterval;
    const cancel=options.clearInterval||clearInterval;

    let room=null;
    let connected=false;
    let needsPause=false;
    let stopped=false;
    let started=false;
    let pumping=false;
    let error='';
    let timer=null;

    function validUser(){
      return !options.getUid || options.getUid()===uid;
    }

    function status(){
      const timestamp=options.now?options.now():Date.now();

      return {
        isHost,
        connected,
        paused:room?.movement?.paused===true,
        error,
        owner:room?.movement?.lease?.writerId===options.writerId,
        canSend:
          !stopped && validUser() && connected &&
          !needsPause && !error &&
          Boolean(room?.movement) &&
          room.movement.paused===false &&
          room.movement.lease?.until>timestamp &&
          room.host?.online===true &&
          room.guest?.online===true
      };
    }

    function emit(){
      options.onStatus?.(status());
    }

    function report(e){
      error=e.message||String(e);
      emit();
      options.onError?.(e);
    }

    function stop(){
      if(stopped)return;
      stopped=true;
      if(timer!==null)cancel(timer);
      if(started)reference.off('value',onRoom);
      host?.stop();
      waveHost?.stop();
      room=null;
      emit();
    }

    function onRoom(snapshot){
      if(stopped)return;
      const next=snapshot.val();

      if(
        !validUser() ||
        !next?.session ||
        next.session.id!==session.id ||
        next.host?.uid!==session.players.host.uid ||
        next.guest?.uid!==session.players.guest.uid ||
        !['preparation','running'].includes(next.session.phase)
      ){
        stop();
        return;
      }

      room=next;

      if(
        isHost &&
        (next.host.online!==true || next.guest.online!==true)
      ){
        needsPause=true;
      }

      emit();
    }

    async function pump(dt=0.1){
      if(stopped || !validUser()){
        stop();
        return {reason:'stopped'};
      }

      if(
        !host || !connected || !room ||
        room.host?.online!==true ||
        error || pumping
      ){
        return {reason:'inactive'};
      }

      pumping=true;

      try{
        let result;

        if(needsPause){
          if(room.movement?.paused===true){
            needsPause=false;
            result=await host.tick(dt);
          }else{
            if(!room.movement)await host.tick(0);
            result=await host.pause();
            if(result.committed)needsPause=false;
          }
        }else{
          result=await host.tick(dt);
        }

        if(!result?.committed){
          return result;
        }

        if(waveHost&&room.session.phase==='running'){
          const waveState=room.waves;
          const movementPaused=
            needsPause||room.movement?.paused===true;

          if(waveState?.phase==='paused'&&!movementPaused){
            await waveHost.resume();
          }else if(movementPaused){
            await waveHost.pause();
          }else{
            await waveHost.tick(dt);
          }
        }

        return result;
      }catch(e){
        report(e);
        throw e;
      }finally{
        pumping=false;
        emit();
      }
    }

    function start(){
      if(stopped)throw new Error('Runtime wurde beendet.');
      if(started)return;

      started=true;
      reference.on('value',onRoom,e=>{
        report(e);
        stop();
      });

      if(!stopped){
        timer=every(()=>{pump().catch(()=>{});},100);
      }
    }

    function setConnected(value){
      if(stopped)return;
      if(isHost && connected && !value)needsPause=true;
      connected=value===true;
      emit();
    }

    async function sendTarget(x,y){
      if(!status().canSend){
        throw new Error(
          'Bewegung ist noch nicht bereit, pausiert oder offline.'
        );
      }
      return sender.sendTarget(x,y);
    }

    async function resume(){
      if(!host || !validUser() || !connected || stopped){
        throw new Error('Nur der verbundene Host darf fortsetzen.');
      }
      if(pumping){
        throw new Error(
          'Host-Update läuft. Bitte kurz erneut versuchen.'
        );
      }

      pumping=true;

      try{
        const result=await host.resume();

        if(!result.committed && result.reason==='lease-owned'){
          throw new Error(
            'Ein anderer Host-Tab besitzt die Schreib-Lease.'
          );
        }

        if(result.committed)needsPause=false;
        return result;
      }catch(e){
        report(e);
        throw e;
      }finally{
        pumping=false;
        emit();
      }
    }

    async function startWave(){
      if(!isHost){
        throw new Error('Nur der Host startet die Welle.');
      }
      if(stopped||!connected||!room||error){
        throw new Error('Welle kann jetzt nicht gestartet werden.');
      }
      if(room.session.phase!=='running'){
        throw new Error('Die Sitzung ist noch nicht lauffähig.');
      }

      const generateId=options.generateId||
        (()=>root.crypto.randomUUID());
      const expected=(room.waves?.wave||0)+1;
      const timestamp=options.now?options.now():Date.now();

      const result=await reference.child('waveStart').transaction(current=>{
        if(
          current &&
          Number.isSafeInteger(current.expectedWave) &&
          current.expectedWave >= expected
        ){
          return;
        }

        return {
          id:generateId(),
          expectedWave:expected,
          requestedBy:uid,
          at:timestamp
        };
      }, undefined, false);

      if(!result?.committed){
        throw new Error('Wellenstart konnte nicht bestätigt werden.');
      }

      return pump(0);
    }

    async function retry(){
      if(stopped){
        throw new Error('Bitte die Sitzung neu öffnen.');
      }
      error='';
      emit();
      return pump(0);
    }

    return Object.freeze({
      start,stop,setConnected,sendTarget,startWave,
      resume,retry,status,pump
    });
  }

  function mount(root){
    let offset=0;
    let connected=false;

    const currentUid=()=>typeof auth!=='undefined'
      ?auth.currentUser?.uid:null;

    function stop(){
      active?.stop();
      active=null;
      root.dispatchEvent(
        new Event('inkfall:coop-movement-status')
      );
    }

    function open(session){
      if(active?.sessionId===session.id)return;
      stop();

      const uid=currentUid();
      if(!uid)return;

      try{
        const instance=createRuntime(
          db.ref('rooms/'+session.roomCode),
          session,
          uid,
          {
            writerId:root.crypto.randomUUID(),
            now:()=>Math.round(Date.now()+offset),
            getUid:currentUid,
            onStatus:()=>root.dispatchEvent(
              new Event('inkfall:coop-movement-status')
            ),
            onError:e=>root.inkfallNotify?.(
              'Coop-Bewegung: '+e.message,'error'
            )
          }
        );

        active={...instance,sessionId:session.id};
        instance.setConnected(connected);
        instance.start();
      }catch(e){
        stop();
        root.inkfallNotify?.(e.message,'error');
      }
    }

    db.ref('.info/serverTimeOffset').on('value',snapshot=>{
      if(Number.isFinite(snapshot.val()))offset=snapshot.val();
    });

    db.ref('.info/connected').on('value',snapshot=>{
      connected=snapshot.val()===true;
      active?.setConnected(connected);
    });

    root.addEventListener(
      'inkfall:coop-session',
      event=>open(event.detail)
    );
    root.addEventListener('inkfall:coop-session-cleared',stop);

    auth.onAuthStateChanged(user=>{
      if(!user)stop();
    });

    if(root.inkfallActiveCoopSession){
      open(root.inkfallActiveCoopSession);
    }
  }

  return Object.freeze({
    project,createRuntime,mount,getActive:()=>active
  });
});

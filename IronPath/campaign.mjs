import {threatFor,campaignWaves} from './campaign-pressure.mjs?v=20261101-campaign1';
import {getMap} from './maps.mjs?v=20261108-squadmaps1';

// Story progress is account-saved and client-reported, not cheat-proof.
// The retired wave-goal campaign remains only as legacy account data.
//
// Every mission now plays on a generated sector-1 field (g3): the story uses
// the same painted terrain, zones, torches and roadside look as free play.
// Because a generated map's road, pads and bunker move with its seed, stages
// cannot ship fixed coordinates. They carry semantic anchors instead, which
// resolveStages() turns into concrete points against the real map at load
// time - deterministically, so every client agrees without any wiring:
//   at:'bunker'        the mission's destination (escorts, deliveries)
//   at:'entry'         where the enemy road enters the field
//   at:<fraction>      that fraction along the road (junctions, convoys)
//   at:'field'         the next free field spot away from road, pads, bunker
const MISSIONS=[
  {id:'lost-signal',act:'ACT I · THE SILENCE',title:'The Silent Signal',mapId:'g3-0a195a333',threat:'standard',
   briefing:'At dawn, every radio on the valley road goes silent—except for one broken distress call. Captain Mara Voss sends you to find the courier carrying the relay key. The bunker is the last place still answering.',
   stages:[{type:'hold',at:.62,seconds:4,label:'Find the downed courier',dialogue:'VOSS: Courier Ada Vale went down near the road. Find her before the enemy does.'},{type:'hold',at:.3,seconds:5,label:'Restore the field relay',dialogue:'ADA: I hid the key in my coat. The voice on that recording was my brother. Please bring the relay back.'},{type:'hold',at:'bunker',seconds:2,label:'Return the signal to command',dialogue:'ADA: The coordinates are coming through. Get them to Voss; I will keep this line open.'}],
   success:'VOSS: The signal points to Pinewood. Ada’s brother served with the patrol there. If anyone is alive, we bring them home.'},
  {id:'pinewood-rescue',act:'ACT I · THE SILENCE',title:'The Missing Patrol',mapId:'g3-0538453d7',threat:'standard',
   briefing:'Pinewood’s crossing is under attack. The distress signal came from an engineer named Ivo Chen and a handful of soldiers. Ada insists her brother is with them; Voss cannot promise what you will find.',
   stages:[{type:'hold',at:'field',seconds:5,label:'Find the missing patrol',dialogue:'VOSS: Search the shelter beyond the crossing. Ivo was carrying a component we cannot replace.'},{type:'escort',at:'bunker',seconds:2,label:'Escort the patrol to the bunker',dialogue:'IVO: We are all that is left. Ada’s brother stayed behind to get us out. Please tell her he saved us.'}],
   success:'ADA: He was supposed to come home. IVO: He gave me the oscillator so we could warn you. The enemy transmitter is turning our own relay network against us.'},
  {id:'ghost-frequency',act:'ACT I · THE SILENCE',title:'Ghost Frequency',mapId:'g3-0b3f01a77',threat:'standard',
   briefing:'Ada traces the jamming signal to an old relay chain through the Talwald. As she brings each mast online, a looped callsign answers her - one that has been dead for a year.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the first mast',dialogue:'ADA: The relay line runs through the forest. Start at the first mast; I will listen as you go.'},{type:'protect',at:'field',asset:'Relay',seconds:20,label:'Protect the relay mast',dialogue:'ADA: It is here. My brother’s old callsign, looping on our frequency. Keep them off the mast while I record it.'},{type:'hold',at:'bunker',seconds:2,label:'Return the recording',dialogue:'ADA: Voss, listen. That is Elias. He is alive, and someone is using his voice to bait us.'}],
   success:'VOSS: If Elias Vale is alive, he is being moved. ADA: Then we follow the signal - all of it.'},
  {id:'blackout',act:'ACT I · THE SILENCE',title:'Blackout at the Outpost',mapId:'g3-02e2ac0ea',threat:'hardened',
   briefing:'Ivo identifies the old outpost transmitter as the source of the jamming. Destroying it may reopen the road, but it will also tell the enemy exactly where the resistance is hiding.',
   stages:[{type:'hold',at:.3,seconds:3,label:'Plant the first charge',dialogue:'IVO: Two charges. One at the junction and one on the feed. Neither is worth your life.'},{type:'hold',at:.72,seconds:3,label:'Plant the second charge',dialogue:'ADA: First charge is answering. Ivo, are you sure the second will not bring down our relay too?'},{type:'defend',seconds:40,label:'Defend until detonation',dialogue:'IVO: I am sure enough. Charges armed—hold the bunker until they fire.'}],
   success:'VOSS: The jammer is down. ADA: Wait. A second signal just woke up. Someone wanted us to destroy that transmitter.'},
  {id:'ash-market',act:'ACT I · THE SILENCE',title:'The Ash Market',mapId:'g3-0c5d2e19b',threat:'hardened',
   briefing:'The relay chain needs parts the resistance cannot make. In the ruined industrial quarter, a black market trades in salvaged components - and Rook’s quartermasters bid for the same crates.',
   stages:[{type:'eliminate',count:6,label:'Break the quartermaster’s escort',dialogue:'VOSS: Rook’s buyers are already there. Break their escort before the auction closes.'},{type:'hold',at:.3,seconds:4,label:'Win the auction crates',dialogue:'IVO: Two masts’ worth of components. Bid fast - the market moves when the shelling starts.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the parts hauler',dialogue:'IVO: The hauler is loaded. Walk it home; the market does not give refunds.'}],
   success:'IVO: Enough components for three masts. ADA: And a manifest from the buyer’s tent - the payments are signed with a prison camp code.'},
  {id:'the-list',act:'ACT I · THE SILENCE',title:'The List',mapId:'g3-0d7a4b35c',threat:'hardened',
   briefing:'The camp code points to a marsh field hospital run by Medic Sera Malik. Enemy reprisal squads are combing the delta for her wounded. Her list of names begins here.',
   stages:[{type:'secure',at:'field',seconds:10,label:'Secure the dressing station',dialogue:'SERA: I operate as long as the ground outside is ours. Clear it and keep it clear.'},{type:'protect',at:'field',asset:'Field hospital',seconds:20,label:'Protect the field hospital',dialogue:'SERA: Reprisal squads in the reeds. Do not let them reach the tents - every name on my list is still breathing.'},{type:'escort',at:'bunker',seconds:3,label:'Evacuate the wounded',dialogue:'SERA: Litters are moving. Walk them out ahead of the next sweep.'}],
   success:'SERA: Everyone on the list is out. One of my wounded was a courier - he spoke of a manifest with a prisoner called VALE.'},
  {id:'brothers-keeper',act:'ACT I · THE SILENCE',title:'Brother’s Keeper',mapId:'g3-0e9c6f21d',threat:'hardened',
   briefing:'A captured dispatch rider was moved across the ice road before the pass closed. His satchel is said to hold a prisoner manifest - and Ada has stopped pretending she is not listening.',
   stages:[{type:'eliminate',count:8,label:'Break the dispatch escort',dialogue:'VOSS: The rider is with that escort. Take them down before they reach the far shore.'},{type:'hold',at:.3,seconds:4,label:'Recover the dispatch satchel',dialogue:'ADA: The satchel is at the relay post. Bring it to me unopened. Please.'},{type:'hold',at:'bunker',seconds:2,label:'Read the manifest',dialogue:'ADA: Line forty-one. VALE, ELIAS. Transfer pending. He is alive, Voss - and he is being moved north.'}],
   success:'ADA: A year of silence, and he is a name on a transfer list. VOSS: Then we go north - after the road is ours.'},
  {id:'quiet-road',act:'ACT I · THE SILENCE',title:'The Quiet Road',mapId:'g3-0f1a8b44e',threat:'hardened',
   briefing:'The night heath carries convoy traffic on a strict timetable. Ivo wants a full count: if Elias rides one of those trucks, the timetable itself will tell them which one.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the counting post',dialogue:'IVO: The observation post overlooks the convoy lane. Hold it and start counting.'},{type:'secure',at:'field',seconds:10,label:'Secure the timetable handoff',dialogue:'IVO: A courier passes the night’s schedule at the waypoint. Take it intact - every minute matters to them.'},{type:'hold',at:'bunker',seconds:2,label:'Deliver the timetable',dialogue:'IVO: Cross-referenced: the northbound transport runs the night after the next. One night to reach the relay.'}],
   success:'IVO: The road runs on schedule because it must. ADA: Then for once, the timetable is on our side.'},
  {id:'signal-home',act:'ACT I · THE SILENCE',title:'Signal Home',mapId:'g3-002000003',threat:'elite',
   briefing:'The main relay stands in the deep Talwald. Ada will broadcast the valley’s first free transmission from it tonight - and wait for an answer on a knock code only her brother knows.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the main relay',dialogue:'ADA: The main relay is old but honest. Get me to it and I will do the rest.'},{type:'protect',at:'field',asset:'Main relay',seconds:30,label:'Protect the main relay',dialogue:'ADA: Broadcasting. If Elias can hear me, he will answer with the knock code. Keep the mast standing while I listen.'},{type:'defend',seconds:45,label:'Hold until the answer comes',dialogue:'VOSS: They know what she is doing. Hold the bunker until the transmission ends.'}],
   success:'ADA: Three knocks, then two. That is our childhood code. VOSS: Then we have a brother to bring home - and a convoy to catch.'},
  {id:'supply-line',act:'ACT I · THE SILENCE',title:'The Relief Convoy',mapId:'g3-0e6d5c492',threat:'elite',boss:'riegel',
   briefing:'The blackout exposed a relief convoy trapped in the forest. Medic Sera Malik is with them. Voss orders the supplies recovered, but Sera refuses to leave anyone behind.',
   stages:[{type:'hold',at:'field',seconds:4,label:'Recover the medical supplies',dialogue:'SERA: The northern crate has antibiotics. Without it, the wounded will not survive the night.'},{type:'hold',at:.55,seconds:4,label:'Find the convoy survivors',dialogue:'SERA: Thank you. The drivers are sheltering on the southern road; we leave together.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the convoy survivors',dialogue:'SURVIVORS: We can walk. Keep the enemy away and we will follow you.'}],
   success:'SERA: Everyone made it. One of the drivers found sealed orders in an enemy truck: TIDELOCK. Ivo, tell me that is not the dam.'},
  {id:'intercept',act:'ACT II · THE FLOOD',title:'Orders in the Ashes',mapId:'g3-0f1bbcd88',threat:'elite',
   briefing:'The orders are incomplete. An enemy dispatch unit is moving through the ruined outpost with the rest. Break its escort, recover the case, and learn what Tidelock means before the next transmission.',
   stages:[{type:'eliminate',count:8,label:'Break the dispatch escort',dialogue:'VOSS: Clear the escort. We need the case intact, not another crater.'},{type:'hold',at:.3,seconds:4,label:'Recover the dispatch case',dialogue:'ADA: Escort is broken. I see the case at the junction—move in.'},{type:'hold',at:'bunker',seconds:2,label:'Deliver the orders',dialogue:'IVO: The seal is marked TIDELOCK. Bring it back; I can break the cipher.'}],
   success:'IVO: Tidelock opens the floodgates and drowns the valley road. The order is signed by Commander Rook. The evacuation has to move now.'},
  {id:'bridge',act:'ACT II · THE FLOOD',title:'Hold the Bridge',mapId:'g3-0f519f70a',threat:'elite',
   briefing:'The evacuation is crossing the only bridge out of the valley. Rook’s advance guard is closing in. Secure the approach long enough for Sera’s convoy to cross; enemies near the position will contest it.',
   stages:[{type:'secure',at:.3,seconds:12,label:'Secure the bridge approach',dialogue:'VOSS: Hold the approach. If the enemy reaches your position, clear it before the convoy moves.'},{type:'defend',seconds:30,label:'Cover the evacuation',dialogue:'SERA: First truck is across. There are children in the second—give us a little longer.'},{type:'hold',at:'bunker',seconds:2,label:'Confirm the evacuation',dialogue:'SERA: Last truck is clear. Return to command and confirm the count.'}],
   success:'SERA: Everyone on my list is across. ADA: I intercepted Rook: “The bridge was never the target.” Ivo, what else feeds the dam?'},
  {id:'dead-air',act:'ACT II · THE FLOOD',title:'Dead Air',mapId:'g3-0afd9d5ab',threat:'elite',
   briefing:'Ivo traces the second signal into the flooded marsh. Ada offers to operate a portable receiver from the field, knowing Rook can hear her. Protect the receiver while she locates the dam’s control frequency.',
   stages:[{type:'hold',at:'field',seconds:4,label:'Set up the receiver',dialogue:'ADA: This receiver will draw attention. I need a clean position and enough time to listen.'},{type:'protect',at:'field',asset:'Receiver',seconds:22,label:'Protect Ada’s receiver',dialogue:'ADA: I have a carrier signal. Do not let them reach the receiver while I isolate it.'},{type:'hold',at:'bunker',seconds:2,label:'Return the frequency',dialogue:'ADA: Found it. The control channel comes from the northern ice station.'}],
   success:'ROOK: You can stop the gate or save your people. You cannot do both. VOSS: He is trying to split us. We go north together.'},
  {id:'white-noise',act:'ACT II · THE FLOOD',title:'White Noise',mapId:'g3-006bc5304',threat:'elite',timeLimit:125,
   briefing:'The northern ice station transmits a short authorization window. Reach its equipment before it closes and bring Ivo the key. The clock runs only while a wave is active; do not waste the opening.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the ice station',dialogue:'IVO: The station cycles its authorization key. We have one window before it changes.'},{type:'secure',at:'field',seconds:8,label:'Secure the transmitter',dialogue:'ADA: I can read the key, but enemies near the transmitter are corrupting the signal.'},{type:'hold',at:'bunker',seconds:2,label:'Return with the key',dialogue:'IVO: That is the key. Get it back before the window closes.'}],
   success:'IVO: The key works, but there are two locks. One is at the power substation. The other is in a city Rook has already occupied.'},
  {id:'long-switch',act:'ACT II · THE FLOOD',title:'The Long Switch',mapId:'g3-0935170bb',threat:'veteran',
   briefing:'The dam’s first lock depends on a remote substation in the scorched scrubland. Ivo must reroute power without cutting the hospital’s supply. Secure the junctions and defend the transformer while he works.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Open the power junction',dialogue:'IVO: The hospital and the dam share this line. Pull the wrong switch and Sera loses her patients.'},{type:'secure',at:'field',seconds:10,label:'Secure the switching yard',dialogue:'SERA: I have the lights for now. Clear the yard so Ivo can reroute the line.'},{type:'protect',at:'field',asset:'Transformer',seconds:25,label:'Protect the transformer',dialogue:'IVO: Reroute in progress. If they destroy the transformer, the hospital goes dark.'}],
   success:'SERA: The lights stayed on. IVO: First lock is isolated. The second key belongs to the city’s captured controller, Nia Reyes.'},
  {id:'city-of-glass',act:'ACT III · THE LAST LIGHT',title:'A City Under Glass',mapId:'g3-0d891921a',threat:'veteran',
   briefing:'The occupied industrial city is full of broken sightlines and patrols. Find Nia Reyes before Rook moves her. She designed the second lock; she also knows why he believes flooding the valley is necessary.',
   stages:[{type:'eliminate',count:10,label:'Break the prison escort',dialogue:'VOSS: Clear the escort, then reach the holding site. Nia is our only way into the second lock.'},{type:'hold',at:'field',seconds:5,label:'Free Nia Reyes',dialogue:'NIA: Rook says the dam will fail unless he opens it. He is wrong—but the gate is already damaged.'},{type:'escort',at:'bunker',seconds:3,label:'Escort Nia to command',dialogue:'NIA: Keep them off me. I can prove the gate can be stabilized without flooding the valley.'}],
   success:'NIA: Rook was ordered to abandon the valley. He chose to flood it instead of risking his own people. The gate can still be stopped, but someone must hold the control line.'},
  {id:'tidelock',act:'ACT III · THE LAST LIGHT',title:'Tidelock',mapId:'g3-04e114f5c',threat:'legendary',
   briefing:'Nia knows a way into the dam network through a marsh control line. Ada will broadcast the evidence to Rook’s troops while you isolate the gate. The receiver must survive long enough to send it.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Connect the control line',dialogue:'NIA: The gate is under strain. If we cut power too quickly, it will open by itself.'},{type:'protect',at:'field',asset:'Broadcast relay',seconds:30,label:'Protect the broadcast relay',dialogue:'ADA: This is Ada Vale. The valley is still occupied by civilians. Rook’s orders will drown them. Please listen.'},{type:'secure',at:'field',seconds:10,label:'Isolate the gate control',dialogue:'NIA: Some of his units are standing down. Clear the control position; I can isolate the gate.'}],
   success:'ROOK: My orders were to save my troops. VOSS: Then help us save everyone. ROOK: The final override is at the industrial tower. I cannot stop it from here.'},
  {id:'last-transmission',act:'ACT III · THE LAST LIGHT',title:'The Last Transmission',mapId:'g3-06be302d5',threat:'legendary',
   briefing:'The automatic override is counting down. With Sera’s evacuation clear and Nia at the gate, you must reach the industrial tower and break the last connection. Rook’s remaining loyalists are still advancing.',
   stages:[{type:'hold',at:'entry',seconds:5,label:'Access the tower circuit',dialogue:'NIA: I can stabilize the gate only if you open the tower circuit. Ada will talk you through it.'},{type:'hold',at:'field',seconds:5,label:'Disable the override',dialogue:'ADA: Follow the blue cable. For my brother, and everyone still down there—pull it.'},{type:'defend',seconds:50,label:'Hold until the gate stabilizes',dialogue:'NIA: Override disconnected. The gate needs time to settle. Hold the bunker; do not give them the line back.'},{type:'hold',at:'bunker',seconds:2,label:'Confirm the road is open',dialogue:'SERA: The water is falling. Come home; we will count everyone together.'}],
   success:'VOSS: The gate is secure. The valley is still standing. ADA: My brother never heard the signal return, but the people he saved did. SERA: The road is open. This time, everyone gets a chance to go home.'}
];
// ---------------------------------------------------------------------------
// Anchor resolution. All geometry helpers are pure; the same seed always
// resolves to the same points, so host and client never need to sync stages.
function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function pointAlong(path,t){let total=0;for(let i=1;i<path.length;i++)total+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);let left=total*Math.max(0,Math.min(1,t));for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],seg=Math.hypot(b.x-a.x,b.y-a.y);if(left<=seg)return {x:a.x+(b.x-a.x)*(left/seg),y:a.y+(b.y-a.y)*(left/seg)};left-=seg;}return {...path[path.length-1]};}
// The first point between two road fractions that stays clear of every pad:
// objective markers must never sit on top of a buildable pad.
function padClearPoint(path,pads,from,to){for(let i=0;i<=24;i++){const p=pointAlong(path,from+(to-from)*i/24);if(pads.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>56))return {x:Math.round(p.x),y:Math.round(p.y)};}return null;}
// Free field spots: the same jittered grid the story map art anchors its
// landmarks to, so scenery and objectives share one visual language.
function fieldSpots(path,pads,bunker,stages){const spots=[];for(let row=0;row<=6;row++)for(let col=0;col<=12;col++){const x=55+col*70+((col*13+row*7)%19)-9,y=52+row*70+((col*5+row*11)%19)-9,p={x,y};if(path.slice(1).some((b,i)=>distanceToSegment(p,path[i],b)<58))continue;if(pads.some(q=>Math.hypot(q.x-x,q.y-y)<60))continue;if(Math.hypot(bunker.x-x,bunker.y-y)<80)continue;if(stages.some(q=>Number.isFinite(q.x)&&Math.hypot(q.x-x,q.y-y)<65))continue;spots.push(p);}return spots;}
function resolveStages(mission){
  const map=getMap(mission.mapId),path=map.path,pads=map.pads,bunker=map.bunker||{x:900,y:400};
  const stages=mission.stages.map(s=>({...s}));
  for(const stage of stages){
    if(stage.at==='bunker')Object.assign(stage,{x:bunker.x,y:bunker.y});
    else if(stage.at==='entry'){
      // Generated roads lead in from outside the field: the entry objective is
      // the first stretch of road that is actually on the map and pad-free.
      let p=null;
      for(let i=0;i<=30&&!p;i++){const c=pointAlong(path,.15*i/30);
        if(c.x>=40&&c.x<=map.width-40&&c.y>=40&&c.y<=map.height-40&&pads.every(q=>Math.hypot(q.x-c.x,q.y-c.y)>56))p=c;}
      p=p||pointAlong(path,.1);
      Object.assign(stage,{x:Math.round(Math.max(40,Math.min(map.width-40,p.x))),y:Math.round(Math.max(40,Math.min(map.height-40,p.y)))});
    }
    else if(typeof stage.at==='number'){const t=stage.at,p=padClearPoint(path,pads,Math.max(0,t-.15),Math.min(1,t+.15))||pointAlong(path,t);Object.assign(stage,{x:Math.round(p.x),y:Math.round(p.y)});}
  }
  // Field spots are shuffled per mission and spread apart, so two protected
  // assets never share one corner of the map.
  const spots=fieldSpots(path,pads,bunker,stages);
  const hash=[...mission.id].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
  const order=spots.map((p,i)=>({p,k:(hash+Math.imul(i+1,2654435761))>>>0})).sort((a,b)=>a.k-b.k).map(e=>e.p);
  // Contested objectives must sit where the road can actually reach them: a
  // protected asset 250px from every enemy is a free stage, and a secure
  // position beyond the contest radius is never contested. Those stages pick
  // a spot inside a contested band (passing enemies can reach, the player can
  // still clear them); other field anchors keep the plain spread rules.
  const roadDistance=p=>{let m=1e9;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;m=Math.min(m,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}return m;};
  let fallback=0;
  for(const stage of stages)if(stage.at==='field'){
    const band=stage.type==='protect'?[80,95]:stage.type==='secure'?[58,105]:null;
    const inBand=q=>{if(!band)return true;const d=roadDistance(q);return d>=band[0]&&d<=band[1];};
    const spread=q=>stages.every(s=>!Number.isFinite(s.x)||Math.hypot(s.x-q.x,s.y-q.y)>=180);
    // Third try: a widened band before giving up on the road entirely. Some
    // generated fields have no free spot at all inside the strict ring (the
    // 15px-wide protect band can be empty on a marsh map); a slightly wider
    // ring keeps the stage contestable instead of dropping it 500px from the
    // nearest enemy. Protect stays under the 100px enemy reach, secure under
    // the 110px contest radius the balance suite asserts. The widened ring also
    // accepts the balance suite's own 90px marker floor instead of the full
    // 180px spread - on a small marsh field the only contestable spot can sit
    // near the bunker the escort stage walks to.
    const relaxed=q=>{if(!band)return true;const d=roadDistance(q);return d>=band[0]-15&&d<=(stage.type==='protect'?99:110);};
    const nearSpread=q=>stages.every(s=>!Number.isFinite(s.x)||Math.hypot(s.x-q.x,s.y-q.y)>=90);
    const p=order.find(q=>spread(q)&&inBand(q))||(band?order.find(inBand):null)||(band?order.find(q=>nearSpread(q)&&relaxed(q)):null)||order.find(spread)||order[fallback++%Math.max(1,order.length)]||{x:Math.round(path[0].x),y:Math.round(path[0].y)};
    Object.assign(stage,{x:p.x,y:p.y});
  }
  for(const stage of stages)delete stage.at;
  return stages.map(s=>Object.freeze(s));
}
export const CAMPAIGN=Object.freeze(MISSIONS.map(m=>Object.freeze({...m,stages:Object.freeze(resolveStages(m))})));
// The five-act structure. Acts IV and V ship their missions in later builds;
// an act without missions has no finale index yet and can neither be completed
// nor earn its relic. Region keys map to the campaign-exclusive battlefields.
export const ACTS=Object.freeze([
  {n:1,key:'silence', title:'ACT I · THE SILENCE',     character:'Ada Vale',  region:'talwald',  regionLabel:'Valley Forest', relic:'relic-open-line'},
  {n:2,key:'flood',   title:'ACT II · THE FLOOD',      character:'Sera Malik',region:'marsch',   regionLabel:'Flooded Marsh', relic:'relic-the-list'},
  {n:3,key:'light',   title:'ACT III · THE LAST LIGHT',character:'Ivo Chen', region:'stadt',    regionLabel:'Occupied City', relic:'relic-timetable'},
  {n:4,key:'winter',  title:'ACT IV · THE LONG WINTER',character:'Nia Reyes',region:'pass',     regionLabel:'The Pass',      relic:'relic-blueprint'},
  {n:5,key:'iron',    title:'ACT V · THE IRON PATH',   character:'Rook',     region:'knoten',   regionLabel:'The Junction',  relic:'relic-iron-path'},
].map(a=>Object.freeze(a)));
export function actOf(mission){return ACTS.find(a=>mission?.act===a.title)||null;}
// Index of the act's final mission in CAMPAIGN order, or -1 while the act has
// no missions yet. Completing past this index completes the act.
export function actEndIndex(act){const n=typeof act==='number'?act:act?.n;let end=-1;CAMPAIGN.forEach((m,i)=>{if(actOf(m)?.n===n)end=i;});return end;}
export function actComplete(profile,act){const end=actEndIndex(act);return end>=0&&campaignProgress(profile)>end;}
// A mission's threat decides its difficulty (see campaign-pressure.mjs): tougher
// units, wider surge waves, a smaller bunker and a fixed wave contract, so the
// last three missions expect prestige gear rather than standard kit.
export function campaignThreat(mission){return mission?.threat??'standard';}
export function campaignDifficulty(mission){return threatFor(mission?.threat);}
export function campaignWaveContract(mission){return campaignWaves(mission?.threat);}
// Story progress formats. Inserting act missions renumbers the story, so a
// bare storyProgress number is ambiguous between formats. Every write stamps
// the format (storyCampaign, allowed by the published rules); reads remap
// older formats forward, old mission boundary by old mission boundary, so an
// account never loses an earned act or relic when the story grows. The table
// below maps the twelve-mission story onto the five-act order.
export const STORY_FORMAT=1;
const LEGACY_STORY_PROGRESS=[0,1,2,4,10,11,12,13,14,15,16,17,18];
export function campaignProgress(profile){
  const raw=profile?.storyProgress;
  if(!Number.isInteger(raw)||raw<0)return 0;
  if(Number.isInteger(profile?.storyCampaign)&&profile.storyCampaign>=STORY_FORMAT)return raw>CAMPAIGN.length?0:raw;
  if(raw>12)return 0;
  return LEGACY_STORY_PROGRESS[raw];
}
export function campaignMission(id){return CAMPAIGN.find(m=>m.id===id)||null;}
export function campaignAvailable(profile,id){const index=CAMPAIGN.findIndex(m=>m.id===id);return index>=0&&index<=campaignProgress(profile);}
export function completeStory(profile,id){const index=CAMPAIGN.findIndex(m=>m.id===id),progress=campaignProgress(profile);if(!profile||index<0||index>progress)return null;return {...profile,storyProgress:Math.max(progress,index+1),storyCampaign:STORY_FORMAT};}
// Compatibility with old account values and old rules tests; not playable missions.
const LEGACY=[['last-road',5],['pinewood',10],['outpost',15]];
export function completeCampaign(profile,id,wave){const index=LEGACY.findIndex(m=>m[0]===id),progress=Number.isInteger(profile?.campaign)&&profile.campaign>=0&&profile.campaign<=3?profile.campaign:0;if(!profile||index<0||!Number.isSafeInteger(wave)||wave<LEGACY[index][1]||index>progress)return null;return {...profile,campaign:Math.max(progress,index+1)};}

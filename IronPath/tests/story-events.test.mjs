import {test} from 'node:test';import {strict as assert} from 'node:assert';import {CAMPAIGN} from '../campaign.mjs';import {createStoryMission,storyStatus,stepStory,resolveStoryDecision,drainStoryNotifications} from '../story-mission.mjs';import {MISSION_DECISIONS,MISSION_EVENTS,STAGE_CAPTIONS,EVENT_TEMPLATES} from '../story-events.mjs';
const battle=()=>({wave:0,running:false,ended:false,players:{local:{x:0,y:0}},enemies:[],money:100,spawnLeft:0});
const find=id=>CAMPAIGN.find(m=>m.id===id);
const drainTypes=story=>drainStoryNotifications(story).map(entry=>entry.type);

test('every authored decision and event names a real mission, stage and choice',()=>{
  for(const [id,decision] of Object.entries(MISSION_DECISIONS)){
    const mission=find(id);assert.ok(mission,`decision for unknown mission ${id}`);
    assert.ok(Number.isInteger(decision.at)&&decision.at>=0&&decision.at<mission.stages.length,`${id}: decision stage out of range`);
    assert.equal(decision.choices.length,2,`${id}: exactly two choices`);
    for(const choice of decision.choices){assert.ok(choice.label&&choice.detail&&choice.confirm,`${id}/${choice.id}: label, detail and confirm are authored`);}
  }
  for(const [id,events] of Object.entries(MISSION_EVENTS)){
    const mission=find(id);assert.ok(mission,`events for unknown mission ${id}`);
    for(const event of events){
      const at=event.at??event.activate?.stage;
      assert.ok(Number.isInteger(at)&&at>=0&&at<mission.stages.length,`${id}/${event.id}: stage out of range`);
      if(event.kind==='setpiece')assert.ok(event.damage>0&&event.delay>=0&&event.text,`${id}/${event.id}: set piece needs damage, delay and a line`);
      if(event.kind==='reinforce')assert.ok(event.count>0,`${id}/${event.id}: reinforcement needs a count`);
      if(event.kind==='side')assert.ok(event.side?.label&&event.side?.reward>0&&Number.isInteger(event.activate?.stage),`${id}/${event.id}: side event needs a stage, a label and a reward`);
    }
  }
  // The accompaniment starts with Act II (campaign plan decision): Act I keeps
  // its lean briefing, and the stage captions serve every mission alike.
  for(const mission of CAMPAIGN.slice(0,10))assert.ok(!MISSION_DECISIONS[mission.id]&&!MISSION_EVENTS[mission.id],`${mission.id} is Act I: no decisions or events yet`);
  for(const mission of CAMPAIGN)for(const stage of mission.stages)assert.ok(STAGE_CAPTIONS[stage.type],`${mission.id}: no caption for stage type ${stage.type}`);
});

test('a decision is offered once when its stage activates and never blocks the field',()=>{
  const s=createStoryMission(find('white-noise')),b=battle();
  assert.equal(stepStory(s,b,1/30),null,'the field idles before the first wave, decision or not');
  let offered=drainTypes(s).filter(t=>t==='decision').length;assert.equal(offered,1,'the decision is offered on the first tick');
  const entry=drainStoryNotifications(s);assert.deepEqual(entry,[],'draining empties the notifications');
  stepStory(s,b,1/30);assert.equal(drainTypes(s).filter(t=>t==='decision').length,0,'never offered twice');
  assert.equal(resolveStoryDecision(s,b,'nonsense'),null,'an unknown choice changes nothing');
  assert.equal(s.decision.pending,true,'the decision still waits');
});

test('choosing applies run-local effects only: supplies now, reinforcement through the spawner',()=>{
  const s=createStoryMission(find('intercept')),b=battle();
  stepStory(s,b,1/30);drainStoryNotifications(s);
  const choice=resolveStoryDecision(s,b,'ambush');
  assert.equal(choice.id,'ambush');assert.equal(b.money,135,'supplies land immediately');
  assert.equal(s.decision.pending,false);
  b.running=true;b.spawnLeft=2;
  stepStory(s,b,1/30);
  assert.equal(b.spawnLeft,2+4,'the chosen reinforcement joins through the regular spawner');
  assert.ok(drainTypes(s).includes('reinforce'));
  stepStory(s,b,1/30);assert.equal(b.spawnLeft,6,'applied exactly once');
});

test('a kills side objective pays out at its count, and a deadline that passed is a miss',()=>{
  const s=createStoryMission(find('intercept')),b=battle();
  stepStory(s,b,1/30);drainStoryNotifications(s);
  resolveStoryDecision(s,b,'shadow');
  let status=storyStatus(s,b);assert.equal(status.bonus.label,'Shadow the courier: break 8 units before delivery');
  b.lootKills=5;stepStory(s,b,1/30);assert.equal(storyStatus(s,b).bonus.progress,5);
  b.lootKills=8;stepStory(s,b,1/30);
  const sides=drainStoryNotifications(s).filter(e=>e.type==='side');
  assert.equal(sides.length,1);assert.equal(sides[0].outcome,'complete');assert.equal(sides[0].reward,75);
  assert.equal(b.money,175,'the reward is paid once');
  // A kills side whose deadline stage began without its count has missed.
  const late=createStoryMission(find('lost-signal')),lateBattle=battle();
  late.sides.push({def:{id:'test-late',label:'Too late',kind:'kills',count:5,until:{stage:0},reward:10},baseline:0,done:false,failed:false});
  lateBattle.wave=1;lateBattle.running=true;lateBattle.players.local={x:late.mission.stages[0].x,y:late.mission.stages[0].y};
  stepStory(late,lateBattle,late.mission.stages[0].seconds);
  const missed=drainStoryNotifications(late).filter(e=>e.type==='side');
  assert.equal(missed.length,1);assert.equal(missed[0].outcome,'missed');
});

test('an asset side settles when its protect stage completes, above or below the threshold',()=>{
  const run=health=>{
    const s=createStoryMission(find('dead-air')),b=battle();
    b.wave=1;b.running=true;
    // Stage 0: set up the receiver.
    b.players.local={x:s.mission.stages[0].x,y:s.mission.stages[0].y};
    stepStory(s,b,s.mission.stages[0].seconds);drainStoryNotifications(s);
    assert.equal(s.stage,1);
    stepStory(s,b,1/30);drainStoryNotifications(s); // decision offered at stage 1
    resolveStoryDecision(s,b,'listen');
    // Stage 1 protects the receiver; its health when the stage completes is
    // what the side asks about.
    s.assetHealth=health;
    stepStory(s,b,s.mission.stages[1].seconds);
    return drainStoryNotifications(s).filter(e=>e.type==='side')[0];
  };
  assert.equal(run(80)?.outcome,'complete','75% threshold met at 80%');
  assert.equal(run(74)?.outcome,'missed','75% threshold missed at 74%');
});

test('a time side settles against the running time of its stage',()=>{
  const run=seconds=>{
    const s=createStoryMission(find('bridge')),b=battle();
    stepStory(s,b,1/30);drainStoryNotifications(s);
    resolveStoryDecision(s,b,'farbank');
    b.wave=1;b.running=true;b.players.local={x:s.mission.stages[0].x,y:s.mission.stages[0].y};
    stepStory(s,b,seconds);
    return drainStoryNotifications(s).filter(e=>e.type==='side')[0];
  };
  // The secure approach takes its authored clean seconds; the side allows
  // seventy-five, so any honest clear completes it.
  assert.equal(run(find('bridge').stages[0].seconds)?.outcome,'complete');
  // A side tighter than the stage itself can only miss: thirty seconds of
  // running field against a five-second ask.
  const tight=createStoryMission(find('bridge')),tightBattle=battle();
  stepStory(tight,tightBattle,1/30);drainStoryNotifications(tight);
  tight.sides.push({def:{id:'test-tight',label:'Too tight',kind:'time',stage:0,seconds:5,reward:10},done:false,failed:false});
  tightBattle.wave=1;tightBattle.running=true;tightBattle.players.local={x:tight.mission.stages[0].x,y:tight.mission.stages[0].y};
  stepStory(tight,tightBattle,find('bridge').stages[0].seconds);
  assert.equal(drainStoryNotifications(tight).filter(e=>e.type==='side')[0]?.outcome,'missed');
});

test('a clock side settles the moment its stage begins',()=>{
  const s=createStoryMission(find('white-noise')),b=battle();
  stepStory(s,b,1/30);drainStoryNotifications(s);
  resolveStoryDecision(s,b,'mirror');
  b.wave=1;b.running=true;b.players.local={x:s.mission.stages[0].x,y:s.mission.stages[0].y};
  stepStory(s,b,s.mission.stages[0].seconds);
  // Stage 1 begins with most of the 125s window left: above the 60s ask.
  assert.equal(s.stage,1);
  const settled=drainStoryNotifications(s).filter(e=>e.type==='side')[0];
  assert.equal(settled?.outcome,'complete');
  // The same moment with the window nearly spent is a miss, not a payout.
  const spent=createStoryMission(find('white-noise')),spentBattle=battle();
  stepStory(spent,spentBattle,1/30);drainStoryNotifications(spent);
  resolveStoryDecision(spent,spentBattle,'mirror');
  spentBattle.wave=1;spentBattle.running=true;spentBattle.players.local={x:spent.mission.stages[0].x,y:spent.mission.stages[0].y};
  spent.timeRemaining=30;
  stepStory(spent,spentBattle,spent.mission.stages[0].seconds);
  assert.equal(drainStoryNotifications(spent).filter(e=>e.type==='side')[0]?.outcome,'missed');
});

test('a set piece strikes once, mid-stage, and only living enemies',()=>{
  const s=createStoryMission(find('bridge')),b=battle();
  b.wave=1;b.running=true;b.players.local={x:s.mission.stages[0].x,y:s.mission.stages[0].y};
  stepStory(s,b,s.mission.stages[0].seconds);drainStoryNotifications(s);
  assert.equal(s.stage,1);
  b.enemies=[{x:100,y:100,hp:50},{x:200,y:100,hp:10},{x:300,y:100,hp:0}];
  stepStory(s,b,9);
  const strikes=drainStoryNotifications(s).filter(e=>e.type==='setpiece');
  assert.equal(strikes.length,1);assert.equal(strikes[0].hits,2,'only living enemies are hit');
  assert.equal(b.enemies[0].hp,5);assert.equal(b.enemies[1].hp,-35);assert.equal(b.enemies[2].hp,0);
  stepStory(s,b,5);assert.equal(drainStoryNotifications(s).filter(e=>e.type==='setpiece').length,0,'never twice');
});

test('standalone reinforcements and side events activate on their authored stage',()=>{
  const s=createStoryMission(find('white-noise')),b=battle();
  b.wave=1;b.running=true;b.players.local={x:s.mission.stages[0].x,y:s.mission.stages[0].y};
  stepStory(s,b,1/30);
  assert.equal(s.sides.length,1,'the side event registered with its stage');
  assert.equal(s.sides[0].def.id,'white-noise-grounds');
  const intercept=createStoryMission(find('intercept')),ib=battle();
  ib.wave=1;ib.running=true;ib.spawnLeft=1;
  stepStory(intercept,ib,21);
  assert.equal(ib.spawnLeft,4,'the authored reserve joined once');
  assert.ok(drainStoryNotifications(intercept).some(e=>e.type==='reinforce'));
});

test('an unanswered decision never applies its effects, and open sides close silently on victory',()=>{
  const s=createStoryMission(find('dead-air')),b=battle();
  b.wave=1;b.running=true;
  let ticks=0;
  while(!b.ended&&ticks++<5000){
    const stage=s.mission.stages[s.stage];
    if(stage.type!=='defend')b.players.local={x:stage.x,y:stage.y};
    stepStory(s,b,stage.type==='eliminate'?0:Math.max(1,stage.seconds||1));
    drainStoryNotifications(s);
  }
  assert.equal(b.endReason,'campaign-victory');
  assert.equal(b.money,100,'nothing was granted without a choice');
  for(const side of s.sides)assert.equal(side.failed,true);
  assert.deepEqual(drainStoryNotifications(s).filter(e=>e.type==='side'),[],'no bonus radio after the debrief starts');
});


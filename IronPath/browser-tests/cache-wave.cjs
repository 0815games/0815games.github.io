// Verify a new build with a real browser HTTP cache full of *synthetic* old
// module responses. No production site, Firebase, accounts or Rules are used.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
// URLs from the published update3 tree and the preceding *local* patch1 wave.
// Synthetic stale modules export only a marker: any accidental old import
// fails visibly, rather than pretending mixed builds are compatible.
const oldUrls=[
 'account-entry.mjs?v=20261119-block9g','account.js?v=20261119-block9g','character-name.mjs?v=20261119-block9g','character-name-claim.mjs?v=20261119-block9g',
 'game.js?v=20261119-block9g','friends-ui.mjs?v=20261119-block9g','friends.mjs?v=20261119-block9g','language.mjs?v=20261119-block9g','patch-notes.mjs?v=20261119-block9g','localization-account-de.mjs?v=20261119-block9g',
 'account-entry.mjs?v=20261119-block9c','account.js?v=20261119-block9c','active-session.mjs?v=20261119-block9c',
 'game.js?v=20261119-block9c','settings.mjs?v=20261119-block9c','cartoon-art.mjs?v=20261119-block9c',
 'endless-launcher.mjs?v=20261119-block9c','recruit-screen.mjs?v=20261119-block9c','language.mjs?v=20261119-block9c','patch-notes.mjs?v=20261119-block9c',
 'localization-more-static-de.mjs?v=20261119-block9c','localization-account-de.mjs?v=20261119-block9c',
 'account-entry.mjs?v=20261119-block9b','account.js?v=20261119-block9b',
 'game.js?v=20261119-block9b','settings.mjs?v=20261119-block9b','cartoon-art.mjs?v=20261119-block9b',
 'endless-launcher.mjs?v=20261119-block9b','language.mjs?v=20261119-block9b','patch-notes.mjs?v=20261119-block9b',
 'localization-settings-de.mjs?v=20261119-block9b','localization-static-de.mjs?v=20261220-actintros',
 'localization-more-static-de.mjs?v=20261119-block9b','localization-de.mjs?v=20261119-block9b',
 'account-entry.mjs?v=20261119-block9','account.js?v=20261119-block9',
 'game.js?v=20261119-block9','endless-launcher.mjs?v=20261119-block9','language.mjs?v=20261119-block9','patch-notes.mjs?v=20261119-block9',
 'localization-campaign-de.mjs?v=20261119-block9','localization-more-static-de.mjs?v=20261119-block9',
 'account-entry.mjs?v=20261118-block5','account.js?v=20261118-block5',
 'game.js?v=20261118-block5','field-menu.mjs?v=20261118-block5','language.mjs?v=20261118-block5','patch-notes.mjs?v=20261118-block5',
 'endless-launcher.mjs?v=20261118-block5','localization-account-de.mjs?v=20261118-block5',
 'simulation.mjs?v=20261118-block5','match.mjs?v=20261118-block5','combat.mjs?v=20261118-block5','tower-specialization.mjs?v=20261118-block5','tower-upgrade-cue.mjs?v=20261118-block5',
 'account-entry.mjs?v=20261031-patch8','account.js?v=20261031-patch8',
 'game.js?v=20261031-patch8','field-menu.mjs?v=20261031-patch8','language.mjs?v=20261031-patch8','patch-notes.mjs?v=20261031-patch8',
 'simulation.mjs?v=20261031-patch8','match.mjs?v=20261031-patch8','combat.mjs?v=20261031-patch8','tower-specialization.mjs?v=20261031-patch8','tower-upgrade-cue.mjs?v=20261031-patch8',
 'account-entry.mjs?v=20261031-patch1','account.js?v=20261031-patch1',
 'account-entry.mjs?v=20261031-patch4','account.js?v=20261031-patch4',
 'account-entry.mjs?v=20261031-patch5','account.js?v=20261031-patch5',
 'account-entry.mjs?v=20261031-patch7','account.js?v=20261031-patch7',
 'game.js?v=20261031-patch7','field-menu.mjs?v=20261031-patch7','language.mjs?v=20261031-patch7','patch-notes.mjs?v=20261031-patch7',
 'simulation.mjs?v=20261031-patch7','match.mjs?v=20261031-patch7','maps.mjs?v=20261031-patch7','cartoon-art.mjs?v=20261031-patch7',
 'combat.mjs?v=20261031-finale1','tower-specialization.mjs?v=20261112-kits1','tower-upgrade-cue.mjs?v=20261117-shimmer1',
 'account-entry.mjs?v=20261031-patch6','account.js?v=20261031-patch6',
 'game.js?v=20261031-patch6','field-menu.mjs?v=20261031-patch6','language.mjs?v=20261031-patch6','patch-notes.mjs?v=20261031-patch6',
 'maps.mjs?v=20261031-finale1','localization-results-de.mjs?v=20261117-rank1','battle-viewport.mjs?v=20261117-ability1','battle-viewport-controller.mjs?v=20261117-ability1',
 'game.js?v=20261031-patch5','language.mjs?v=20261031-patch5','patch-notes.mjs?v=20261031-patch5','recruit-screen.mjs?v=20261031-patch5',
 'game.js?v=20261031-patch4','friends-ui.mjs?v=20261031-patch4','friend-portrait.mjs?v=20261031-patch4',
 'language.mjs?v=20261031-patch4','recruit-screen.mjs?v=20261031-patch4',
 'match.mjs?v=20261031-patch4','simulation.mjs?v=20261031-patch4','party-host.mjs?v=20261031-patch4','protocol.mjs?v=20261031-patch4',
 'game.js?v=20261031-patch1','friends-ui.mjs?v=20261031-patch1',
 'firebase-four-panel.mjs?v=20261031-patch1','social-notifications.mjs?v=20261031-patch1',
 'language.mjs?v=20261031-patch1','localization-battle-de.mjs?v=20261031-patch1',
 'account-entry.mjs?v=20261031-update3','account.js?v=20261031-update3',
 'auth-form.mjs?v=20261031-loading1','cartoon-art.mjs?v=20261031-loading1','command-center.mjs?v=20261031-loading1',
 'confirmation.mjs?v=20261111-completede1','localization-account-de.mjs?v=20261110-storyde1',
 'coop-input.mjs?v=20261031-coopui1','coop-invites.mjs?v=20261104-invites1','coop-rewards.mjs?v=20261031-update3','endless-launcher.mjs?v=20261031-loading1',
 'field-menu.mjs?v=20261118-settings1','firebase-durable-host-session.mjs?v=20261104-hostpause1',
 'firebase-durable-client-session.mjs?v=20261031-mpview1','firebase-four-digit-panel.mjs?v=20261031-socialcleanup1',
 'firebase-four-panel.mjs?v=20261031-update3','firebase-party-game.mjs?v=20261031-mpview1',
 'firebase-party-session.mjs?v=20261031-mpview1','firebase-recoverable-game.mjs?v=20261031-mpview1',
 'firebase-recovery-store.mjs?v=20261031-mpview1','first-run-coach.mjs?v=20261031-loading1',
 'first-run-ending.mjs?v=20261031-update3','first-run-guide.mjs?v=20261031-loading1',
 'four-game-view.mjs?v=20261103-online1','four-modes.mjs?v=20261112-tagless1','friends-ui.mjs?v=20261031-update3',
 'friends.mjs?v=20261031-socialcleanup1',
 'game.js?v=20261031-update3','intro.mjs?v=20261031-loading1','language.mjs?v=20261031-loading1',
 'leaderboards-ui.mjs?v=20261031-update3','leaderboards.mjs?v=20261031-update3',
 'localization-battle-de.mjs?v=20261217-stormgate','localization-game-errors-de.mjs?v=20261127-tutlock1',
 'localization-more-static-de.mjs?v=20261031-socialcleanup1','match.mjs?v=20261112-tagless1','multiplayer-speed.mjs?v=20261104-speedvote1',
 'party-host.mjs?v=20261031-mpview1','protocol.mjs?v=20261031-mpview1','rank-insignia.mjs?v=20261031-loading1',
 'recruit-screen.mjs?v=20261031-loading1','simulation.mjs?v=20261112-tagless1',
 'social-notifications.mjs?v=20261031-loading1','soldier-screen.mjs?v=20261031-loading1',
 'solo-deployment.mjs?v=20261112-tagless1','story-map-art.mjs?v=20261031-loading1','tutorial.mjs?v=20261031-loading1',
 'version-check.mjs?v=20261031-update3','version-ui.mjs?v=20261031-update3','versus.mjs?v=20261031-mpview1',
 'workshop-multiplayer-game.mjs?v=20261031-mpview1','workshop-solo.mjs?v=20261112-tagless1'
];
(async()=>{
 const stale=new Set(oldUrls),requests=[];
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://test.invalid');
  if(url.pathname==='/fixture'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'}).end('<!doctype html><html><body><select id="languageSelect"><option value="de">Deutsch</option><option value="en">English</option></select></body></html>');return;}
  // Root runtime modules plus the real layer manifest needed by avatar and
  // friend portraits. No arbitrary nested paths or external fetches are served.
  if(!/^\/IronPath\/(?:[\w.-]+|assets\/layers\/manifest)\.(?:mjs|js)$/.test(url.pathname)){res.writeHead(404).end();return;}
  const key=url.pathname.slice('/IronPath/'.length)+url.search;requests.push(key);
  try{
   const body=stale.has(key)?'export const syntheticOldCache=true;':await readFile(path.join(root,url.pathname.slice('/IronPath/'.length)));
   res.writeHead(200,{'content-type':'text/javascript','cache-control':'public, max-age=3600, immutable'}).end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`,build=JSON.parse(await readFile(path.join(root,'release-version.json'),'utf8')).build;
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),external=[],errors=[];
  page.on('request',request=>{if(new URL(request.url()).origin!==origin)external.push(request.url());});
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(`${origin}/fixture?prime=1`);
  const primed=await page.evaluate(async paths=>Promise.all(paths.map(async p=>(await import(`/IronPath/${p}`)).syntheticOldCache)),oldUrls);
  assert.ok(primed.every(Boolean),'old module URLs really contain synthetic stale responses');
  const oldMatch='match.mjs?v=20261112-tagless1',hits=requests.filter(key=>key===oldMatch).length;
  await page.goto(`${origin}/fixture?next-document=1`);
  assert.equal(await page.evaluate(async p=>(await import(`/IronPath/${p}`)).syntheticOldCache,oldMatch),true);
  assert.equal(requests.filter(key=>key===oldMatch).length,hits,'the second document really used the HTTP cache');
  const result=await page.evaluate(async build=>{
   const [{createPartyHost},{createMatch},{createPlayer},language]=await Promise.all([
    import(`/IronPath/party-host.mjs?v=${build}`),import(`/IronPath/simulation.mjs?v=${build}`),
    import(`/IronPath/match.mjs?v=${build}`),import(`/IronPath/language.mjs?v=${build}`),
    import(`/IronPath/game.js?v=${build}`),import(`/IronPath/firebase-party-game.mjs?v=${build}`),
    import(`/IronPath/firebase-recoverable-game.mjs?v=${build}`),import(`/IronPath/friends-ui.mjs?v=${build}`),
    import(`/IronPath/multiplayer-prompts.mjs?v=${build}`),import(`/IronPath/field-menu.mjs?v=${build}`),
    import(`/IronPath/combat.mjs?v=${build}`),import(`/IronPath/tower-specialization.mjs?v=${build}`),
    import(`/IronPath/settings.mjs?v=${build}`),import(`/IronPath/password-change.mjs?v=${build}`),
    import(`/IronPath/endless-launcher.mjs?v=${build}`),import(`/IronPath/patch-notes.mjs?v=${build}`)
   ]);
   language.setupLanguage({document,storage:{getItem:()=> 'de',setItem(){}}});
   const text=language.translateText('{name} requests wave {wave}. {count} approval still needed.',{name:'Bob',wave:1,count:1});
   const ids=['alice','bob'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
   const host=createPartyHost(createMatch(players),{hostId:'alice'});for(const id of ids)host.setPresence(id,true);
   const snap=host.snapshotFor('bob'),queued=host.receive('bob',{version:1,seq:snap.nextSeq,rosterGeneration:snap.rosterGeneration,command:{type:'startWave'}});
   const applied=host.advance().commands[0].result;
   return {text,queued,applied,request:host.snapshotFor('alice').match.waveRequest};
  },build);
  assert.equal(result.queued.status,'queued');assert.equal(result.applied.ok,true);assert.equal(result.request.requester,'bob');
  assert.match(result.text,/Bob fragt Welle 1 an\. 1 Zustimmung/);
  for(const name of ['game.js','field-menu.mjs','settings.mjs','password-change.mjs','endless-launcher.mjs','patch-notes.mjs','localization-settings-de.mjs','localization-account-de.mjs','coop-input.mjs','coop-invites.mjs','friends-ui.mjs','friends.mjs','friend-portrait.mjs','social-notifications.mjs','multiplayer-prompts.mjs','language.mjs','party-host.mjs','protocol.mjs','simulation.mjs','match.mjs','combat.mjs','tower-specialization.mjs','tower-upgrade-cue.mjs','multiplayer-speed.mjs','wave-consensus.mjs','firebase-party-game.mjs','firebase-recoverable-game.mjs','firebase-durable-host-session.mjs'])
   assert.ok(requests.includes(`${name}?v=${build}`),`${name} is fetched with the new cache key`);
  assert.ok(requests.includes('avatar.mjs?v=20261119-avatar3'),'the portrait reuses the existing avatar decoder');
  assert.ok(requests.includes('avatar-layers.mjs?v=20261119-avatar3'),'the portrait reuses the existing renderer');
  assert.ok(requests.includes('assets/layers/manifest.mjs?v=20261119-avatar3'),'the real layer manifest is available');
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  console.log('New game, social prompts, invitations, language and online/recovery paths bypassed a populated synthetic stale HTTP cache; guest wave request passed.');
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});

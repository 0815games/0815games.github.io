// Real Chromium layout and DOM, with a synthetic in-memory social adapter.
// No Firebase connection or real account is used. Serve /IronPath/ on 8765.
const {chromium}=require(process.env.PW_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='127.0.0.1')return route.abort();
   if(url.pathname==='/IronPath/'){
    const response=await route.fetch(),html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
    return route.fulfill({response,body:html});
   }
   return route.continue();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:8765/IronPath/');
  await page.evaluate(async()=>{
   for(const id of ['languageGate','introOverlay','loading','authView','entry'])document.getElementById(id)?.setAttribute('hidden','');
   document.getElementById('gameView').hidden=false;
   const {setupFriends}=await import('./friends-ui.mjs');
   const listeners=new Map(),values=new Map(),uid='alice',auth={currentUser:{uid}};let rejectFriendFor=null;
   const snapshot=value=>({val:()=>value??null,forEach(callback){for(const [key,child] of Object.entries(value||{}))if(callback({key,val:()=>child}))break;}});
   const sdk={ref:(_db,path)=>path,onValue(path,cb,onError){const list=listeners.get(path)||[];const entry={cb,onError};list.push(entry);listeners.set(path,list);queueMicrotask(()=>{if(list.includes(entry))cb(snapshot(values.get(path)));});return()=>{const at=list.indexOf(entry);if(at>=0)list.splice(at,1);};},
    async get(path){return snapshot(values.get(path));},async set(path,value){if(rejectFriendFor&&path===`friendships/${rejectFriendFor}/${uid}`){rejectFriendFor=null;values.set(path,{...value,status:'accepted'});throw Error('permission denied');}values.set(path,value);},async remove(path){values.delete(path);},serverTimestamp:()=>Date.now(),
    query:path=>path,orderByKey:()=>null,startAfter:()=>null,limitToFirst:()=>null};
   window.__emit=(path,value)=>{values.set(path,value);for(const entry of listeners.get(path)||[])entry.cb(snapshot(value));};
   window.__fail=path=>{for(const entry of listeners.get(path)||[])entry.onError?.(Error('offline'));};
   window.__rejectFriendFor=id=>{rejectFriendFor=id;};
   window.__friends=setupFriends({document,db:{},auth,sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(7);}}});
   window.__friends.start();window.__friends.open();
  });
  await page.locator('#friendsDialog').waitFor({state:'visible'});
  for(const id of ['friendInvitesSection','friendRequestsSection','friendSentSection'])assert.equal(await page.locator('#'+id).isHidden(),true,id);
  assert.equal(await page.locator('#friendListSection').isVisible(),true);
  assert.equal(await page.locator('#friendInput').isVisible(),true);
  await page.evaluate(()=>{
   window.__emit('coopInvites/alice',{eve:{name:'Eve',code:'0123',partyId:'a'.repeat(32),createdAt:Date.now()}});
   window.__emit('friendships/alice',{bob:{status:'pending',senderName:'Bob'}});
   window.__emit('friendOutgoing/alice',{cara:{name:'Cara',code:'b'.repeat(32)}});
  });
  for(const id of ['friendInvitesSection','friendRequestsSection','friendSentSection'])assert.equal(await page.locator('#'+id).isVisible(),true,id);
  await page.evaluate(()=>{window.__emit('coopInvites/alice',{});window.__emit('friendships/alice',{});window.__emit('friendOutgoing/alice',{});window.__fail('coopInvites/alice');window.__fail('friendOutgoing/alice');});
  for(const id of ['friendInvitesSection','friendRequestsSection','friendSentSection'])assert.equal(await page.locator('#'+id).isHidden(),true,id);
  assert.equal(await page.locator('#friendInvitesError').isVisible(),true);assert.equal(await page.locator('#friendListError').isVisible(),true);
  await page.setViewportSize({width:844,height:390});
  assert.equal(await page.locator('#friendInput').isVisible(),true);assert.equal(await page.locator('#friendListError').isVisible(),true);
  const bounds=await page.locator('#friendsDialog').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert.ok(bounds.scroll<=bounds.client+1,`no horizontal overflow: ${JSON.stringify(bounds)}`);
  // A rejected request write, even if another tab's edge is visible, must not
  // turn into the success message. This uses a synthetic SDK in a real UI.
  await page.evaluate(async()=>{
   const build=document.querySelector('meta[name="ironpath-build"]').content;
   const {friendNameKey}=await import(`./friends.mjs?v=${build}`),code='f'.repeat(32);
   window.__emit(`friendNames/${friendNameKey('Cara')}`,{cara:{name:'Cara',code}});
   window.__emit(`friendCodes/${code}`,{uid:'cara',name:'Cara'});window.__rejectFriendFor('cara');
  });
  await page.locator('#friendInput').fill('Cara');await page.locator('#friendSearch').click();
  await page.locator('#friendResults li').filter({hasText:'Cara'}).getByRole('button',{name:'ADD'}).click();
  await page.waitForFunction(()=>document.getElementById('friendStatus').textContent.includes('could not be confirmed'));
  assert.match(await page.locator('#friendStatus').innerText(),/Check your sent list before retrying/);
  assert.doesNotMatch(await page.locator('#friendStatus').innerText(),/Request sent to/);
  // A friend's profile has no access to this browser's local avatar mirror.
  // The list and dossier must use the very same composed server value, keep
  // updating together, and use a neutral placeholder if access is lost.
  await page.evaluate(()=>{
   window.__emit('players/bob/gender','male');window.__emit('players/bob/avatar','g:m|face:buzz|hair:side|beard:full');
   window.__emit('players/bob/xp',750);window.__emit('players/bob/skills','v2;assault;2;0;00000000000000');window.__emit('players/bob/armory',null);
   window.__emit('friendships/alice',{bob:{status:'accepted',senderName:'Bob'}});
  });
  await page.waitForFunction(()=>document.querySelector('#friendList .friend-portrait')?.getAttribute('src')?.startsWith('data:image/png;base64,'),null,{timeout:15000});
  await page.locator('#friendList li').filter({hasText:'Bob'}).getByRole('button',{name:'STATS'}).click();
  await page.locator('#friendStatsContent').waitFor({state:'visible'});
  const src=await page.locator('#friendList .friend-portrait').getAttribute('src');
  assert.equal(await page.locator('#friendStatsPortrait').getAttribute('src'),src,'list and dossier show the same rendered image');
  await page.evaluate(()=>window.__emit('players/bob/avatar','g:m|face:buzz|hair:medium|beard:full'));
  await page.waitForFunction(old=>{const list=document.querySelector('#friendList .friend-portrait')?.getAttribute('src'),stats=document.getElementById('friendStatsPortrait').getAttribute('src');return list?.startsWith('data:image/png;base64,')&&list!==old&&list===stats;},src,{timeout:15000});
  await page.evaluate(()=>window.__emit('players/bob/avatar',null));
  await page.waitForFunction(()=>document.querySelector('#friendList .friend-portrait')?.getAttribute('src')?.includes('friend-placeholder.svg')&&document.getElementById('friendStatsPortrait').getAttribute('src')?.includes('friend-placeholder.svg'));
  // Renderer fallbacks must not silently present unknown saved choices as the
  // friend's real face. This also applies while their dossier is already open.
  await page.evaluate(()=>window.__emit('players/bob/avatar','g:m|face:unknown'));
  await page.waitForTimeout(100);
  assert.match(await page.locator('#friendList .friend-portrait').getAttribute('src'),/friend-placeholder\.svg/);
  assert.match(await page.locator('#friendStatsPortrait').getAttribute('src'),/friend-placeholder\.svg/);
  await page.evaluate(()=>window.__emit('players/bob/avatar','g:m|look:beard'));
  await page.waitForFunction(()=>document.querySelector('#friendList .friend-portrait')?.getAttribute('src')?.startsWith('data:image/png;base64,'),null,{timeout:15000});
  await page.evaluate(()=>window.__fail('players/bob/avatar'));
  await page.waitForFunction(()=>document.querySelector('#friendList .friend-portrait')?.getAttribute('src')?.includes('friend-placeholder.svg')&&document.getElementById('friendStatsPortrait').getAttribute('src')?.includes('friend-placeholder.svg'));
  for(const size of [{width:320,height:240},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);
   for(const selector of ['#friendsDialog','#friendStatsDialog']){
    const b=await page.locator(selector).evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert.ok(b.scroll<=b.client+1,`${selector} ${size.width}×${size.height}: ${JSON.stringify(b)}`);
   }
  }
  await page.evaluate(()=>window.__emit('friendships/alice',{}));
  await page.waitForFunction(()=>!document.getElementById('friendStatsDialog').open&&document.querySelectorAll('#friendList li').length===0);
  await page.evaluate(()=>window.__friends.signOut());assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close();}
 console.log('Friends sections and error messages: Chromium portrait and landscape passed with an in-memory adapter.');
})().catch(error=>{console.error(error);process.exit(1);});

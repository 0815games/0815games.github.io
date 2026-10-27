const app = firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let currentProfile = null;

function logFb(t){
  const l=document.getElementById('log');
  if(l) l.innerHTML='<div><b>Firebase:</b> '+t+'</div>'+l.innerHTML;
}

function ensureAuthUI(){
  if(document.getElementById('authBox')) return;
  const box=document.createElement('div');
  box.id='authBox';
  box.style.cssText='position:fixed;top:10px;right:10px;background:#26221d;border:2px solid #22201c;padding:12px;border-radius:6px;width:270px;font-family:Georgia,serif;color:#f4ead8;z-index:9999';
  box.innerHTML=`
    <b style="color:#b8860b">INKFALL Account</b>
    <div id="authLoggedOut">
      <input id="mail" placeholder="E-Mail" style="width:100%;margin:4px 0;padding:6px">
      <input id="pass" type="password" placeholder="Passwort" style="width:100%;margin:4px 0;padding:6px">
      <input id="pname" placeholder="Spielername (3-20)" style="width:100%;margin:4px 0;padding:6px">
      <button onclick="register()" style="width:100%;margin:3px 0">Registrieren</button>
      <button onclick="login()" style="width:100%;margin:3px 0">Anmelden</button>
    </div>
    <div id="authLoggedIn" style="display:none">
      <div id="userInfo" style="font-size:13px;margin:6px 0"></div>
      <button onclick="saveGame()" style="width:100%;margin:3px 0">Spiel speichern</button>
      <button onclick="logout()" style="width:100%;margin:3px 0">Abmelden</button>
    </div>
    <div id="authMsg" style="font-size:12px;color:#ff9c9c;margin-top:6px"></div>
  `;
  document.body.appendChild(box);
}

function authMsg(t){document.getElementById('authMsg').textContent=t}

async function register(){
  const mail=mail.value.trim(),pass=pass.value,pname=pname.value.trim();
  if(pname.length<3||pname.length>20){authMsg('Spielername muss 3-20 Zeichen haben.');return}
  try{
    const cred=await auth.createUserWithEmailAndPassword(mail,pass);
    await db.ref('users/'+cred.user.uid+'/profile').set({
      displayName:pname,level:1,createdAt:Date.now()
    });
    await db.ref('users/'+cred.user.uid+'/save').set({
      gold:150,lives:100,wave:0,skillPoints:0,skills:{},heroClass:'knight'
    });
    authMsg('');
    logFb('Account erstellt.');
  }catch(e){authMsg(e.message)}
}

async function login(){
  try{
    await auth.signInWithEmailAndPassword(mail.value.trim(),pass.value);
    authMsg('');
  }catch(e){authMsg(e.message)}
}

async function logout(){
  await auth.signOut();
  logFb('Abgemeldet.');
}

async function loadGame(){
  if(!currentUser)return;
  const snap=await db.ref('users/'+currentUser.uid).get();
  if(!snap.exists())return;
  const data=snap.val();
  currentProfile=data;
  if(data.save){
    if(typeof gold!=='undefined')gold=data.save.gold??gold;
    if(typeof lives!=='undefined')lives=data.save.lives??lives;
    if(typeof skillPoints!=='undefined')skillPoints=data.save.skillPoints??skillPoints;
    if(typeof skills!=='undefined')skills=data.save.skills??{};
    if(typeof hero!=='undefined'&&data.save.heroClass)hero.cls=data.save.heroClass;
    if(typeof ui==='function')ui();
  }
  document.getElementById('userInfo').textContent=
    'Name: '+(data.profile?.displayName??'?')+' | Level: '+(data.profile?.level??1);
  document.getElementById('authLoggedOut').style.display='none';
  document.getElementById('authLoggedIn').style.display='block';
  logFb('Spielstand geladen.');
}

async function saveGame(){
  if(!currentUser)return;
  const level=Math.max(1,Math.floor(wave/2)+1);
  await db.ref('users/'+currentUser.uid+'/profile/level').set(level);
  await db.ref('users/'+currentUser.uid+'/save').set({
    gold:gold,lives:lives,wave:wave,skillPoints:skillPoints,
    skills:skills,heroClass:hero.cls,updatedAt:Date.now()
  });
  logFb('Spiel gespeichert.');
}

auth.onAuthStateChanged(user=>{
  ensureAuthUI();
  if(user){
    currentUser=user;
    logFb('Angemeldet: '+user.email);
    loadGame();
    setInterval(()=>{if(active===false)saveGame()},15000);
  }else{
    currentUser=null;
    document.getElementById('authLoggedOut').style.display='block';
    document.getElementById('authLoggedIn').style.display='none';
    logFb('Nicht angemeldet.');
  }
});

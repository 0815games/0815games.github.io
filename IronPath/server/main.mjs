import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { createPlayer } from '../match.mjs';
import { characterProgress } from '../progression.mjs';
import { createMatchService } from './service.mjs';

// These are deployment configuration, not credentials. Service account credentials
// come only from Application Default Credentials and must never be committed.
const uids=(process.env.IRONPATH_PLAYER_UIDS||'').split(',').map(s=>s.trim()).filter(Boolean);
const origins=(process.env.IRONPATH_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(uids.length!==2||new Set(uids).size!==2||!origins.length)throw new Error('Configure two distinct IRONPATH_PLAYER_UIDS and IRONPATH_ALLOWED_ORIGINS');
for(const origin of origins){const url=new URL(origin);if(url.origin!==origin||!['https:','http:'].includes(url.protocol))throw new Error('Invalid allowed origin');}
const app=initializeApp({credential:applicationDefault(),projectId:'iron-path-dc727',databaseURL:'https://iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app'});
const db=getDatabase(app),auth=getAuth(app);
const players=await Promise.all(uids.map(async(uid,index)=>{
  const value=(await db.ref(`players/${uid}`).get()).val();
  if(!value||typeof value.name!=='string'||value.name.length<2||value.name.length>24||!['male','female'].includes(value.gender)||!Number.isSafeInteger(value.xp)||value.xp<0||value.xp>10000000)throw new Error(`Invalid soldier profile for roster entry ${index+1}`);
  return createPlayer(uid,{name:value.name,gender:value.gender,level:characterProgress(value.xp).level},index?800:850,450);
}));
const server=createMatchService({players,allowedOrigins:origins,verifyToken:token=>auth.verifyIdToken(token,true)});
const port=Number(process.env.PORT||8080);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
server.listen(port,'0.0.0.0',()=>console.log(`Iron Path experimental match service listening on ${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.shutdown());

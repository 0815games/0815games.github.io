import {characterProgress} from './progression.mjs?v=20261102-terrain4';
import {ITEMS,readArmory} from './armory.mjs?v=20261102-longterm1';
import {SKILL_PATHS,WEB_NODES,parseBuild,pointsLeft,abilityName} from './skills.mjs?v=20261104-doctrines1';
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
// Individual child reads intentionally do not grant access to the full profile.
export async function loadFriendStats({db,auth,sdk,id}){
 const uid=auth.currentUser?.uid;if(!validId(uid)||!validId(id)||uid===id)throw Error('Invalid friend');
 const values=await Promise.all(['xp','skills','armory'].map(key=>sdk.get(sdk.ref(db,`players/${id}/${key}`))));
 if(auth.currentUser?.uid!==uid)throw Error('Account changed');
 const [xp,skills,armory]=values.map(s=>s.val());if(!Number.isInteger(xp)||xp<0||xp>10000000)throw Error('Invalid profile');
 const level=characterProgress(xp).level,build=parseBuild(skills,level),gear=readArmory(armory);
 return {level,ability:abilityName(build),points:pointsLeft(build,level),ranks:SKILL_PATHS.map(path=>({name:path.name,rank:build[path.id]})),specialists:SKILL_PATHS.flatMap((path,i)=>path.branches.filter((_,j)=>build.extra[i*2+j]).map(x=>x.ability)),masteries:WEB_NODES.filter(node=>build.web[node.id]).map(node=>node.name),equipped:gear.equipped?ITEMS[gear.equipped-1].name:null,owned:ITEMS.filter((_,i)=>gear.owned&(1<<i)).map(item=>item.name),bunker:{fortify:gear.fortify,plating:gear.plating,repair:gear.repair,gun:gear.gun,supply:gear.supply,safeguard:gear.safeguard}};
}

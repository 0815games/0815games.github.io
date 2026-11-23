import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {ITEMS,readArmory} from './armory.mjs?v=20261112-tagless1';
import {SKILL_PATHS,SKILL_PATH_MAP,classNodes,parseBuild,pointsLeft,abilityName} from './skills.mjs?v=20261123-aim2';
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
// Individual child reads intentionally do not grant access to the full profile.
export async function loadFriendStats({db,auth,sdk,id}){
  const uid=auth.currentUser?.uid;if(!validId(uid)||!validId(id)||uid===id)throw Error('Invalid friend');
  const values=await Promise.all(['xp','skills','armory'].map(key=>sdk.get(sdk.ref(db,`players/${id}/${key}`))));
  if(auth.currentUser?.uid!==uid)throw Error('Account changed');
  const [xp,skills,armory]=values.map(s=>s.val());if(!Number.isInteger(xp)||xp<0||xp>10000000)throw Error('Invalid profile');
  const level=characterProgress(xp).level,build=parseBuild(skills,level),gear=readArmory(armory);
  const chosenClass=build.classId?SKILL_PATH_MAP[build.classId]:null;
  const nodes=build.classId?classNodes(build.classId):[];
  const specialists=nodes.filter(n=>n.kind==='specialist'&&build.extra?.[n.slot]).map(n=>n.ability);
  const masteries=nodes.filter(n=>n.kind!=='specialist'&&build.extra?.[n.slot]).map(n=>n.name);
  const ranks=chosenClass?[{name:chosenClass.name,rank:build.rank}]:SKILL_PATHS.map(path=>({name:path.name,rank:0}));
  return {
    level,
    className:chosenClass?chosenClass.name:'Unchosen',
    ability:abilityName(build),
    points:pointsLeft(build,level),
    ranks,
    specialists,
    masteries,
    equipped:gear.equipped?ITEMS[gear.equipped-1].name:null,
    owned:ITEMS.filter((_,i)=>gear.owned&(1<<i)).map(item=>item.name),
    bunker:{fortify:gear.fortify,plating:gear.plating,repair:gear.repair,gun:gear.gun,supply:gear.supply,safeguard:gear.safeguard}
  };
}

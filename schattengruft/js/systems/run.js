// [2026-10-12 14:31] - v0.0.9: Roguelite-Runregeln und permanente Ordenserinnerung.
import {state,CLASS_PROFILES,INITIAL_PLAYER,INITIAL_TRADER} from '../core/state.js';
import {ITEM_DATABASE} from '../data/items.js';
import {eventBus} from '../core/eventBus.js';
const META_KEY='shadow_crypt_meta_v009';
export class RunSystem{
 constructor(storage){this.storage=storage;this.meta=this.loadMeta();}
 loadMeta(){try{return JSON.parse(localStorage.getItem(META_KEY))||{gold:0,bestDepth:1,unlockedClasses:['warrior','mage','rogue'],runs:0};}catch{return{gold:0,bestDepth:1,unlockedClasses:['warrior','mage','rogue'],runs:0};}}
 saveMeta(){localStorage.setItem(META_KEY,JSON.stringify(this.meta));}
 newRun(classId,name){const profile=CLASS_PROFILES[classId]||CLASS_PROFILES.warrior;state.player=structuredClone(INITIAL_PLAYER);state.player.name=name||'Schattenjäger';state.player.classId=classId;state.player.className=profile.className;for(const key of ['hp','maxHp','mp','maxMp','baseAtk','baseDef'])state.player[key]=profile[key];state.player.bestDepth=this.meta.bestDepth;state.player.inventory=profile.startItems.map(x=>({...x}));state.player.equipped.weapon=profile.startWeapon?ITEM_DATABASE[profile.startWeapon]:null;state.player.equipped.armor=profile.startArmor?ITEM_DATABASE[profile.startArmor]:null;state.trader=structuredClone(INITIAL_TRADER);state.quests={active:[],completed:[]};state.world.depth=1;state.world.stairs=null;state.world.chests=[];state.world.monsters=[];state.world.discovered=[];this.meta.runs++;state.isInputLocked=false;this.saveMeta();eventBus.emit('run:started');}
 finishRun(){this.meta.gold+=Math.max(0,state.player.caps);this.meta.bestDepth=Math.max(this.meta.bestDepth,state.world.depth||1);this.saveMeta();state.player.permanentGold=this.meta.gold;state.player.bestDepth=this.meta.bestDepth;eventBus.emit('run:ended',this.meta);}
}

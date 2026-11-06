import {germanWorkshop} from './localization-workshop-de.mjs?v=20261112-firstrun5';
// The Settings dialog is where a player switches the language in the first place, so
// its copy cannot fall back to English. Own file, asked first, for the same reason as
// the first-run dictionary below.
import {germanSettings} from './localization-settings-de.mjs?v=20261118-settings1';
// The first run was the last translated part of the game and the first one a new
// soldier sees: seven coach cards on the field, four cards after the match, four class
// explanations. Kept in its own file so the next new card cannot ship untranslated
// without tests/first-run-german.test.mjs noticing.
import {germanFirstRun} from './localization-firstrun-de.mjs?v=20261116-firstrunde1';
import {germanFinal} from './localization-final-de.mjs?v=20261105-soldier1';
import {germanMoreStatic} from './localization-more-static-de.mjs?v=20261110-storyde1';
import {germanGameErrors} from './localization-game-errors-de.mjs?v=20261110-storyde1';
import {germanAccount} from './localization-account-de.mjs?v=20261110-storyde1';
import {germanTowers} from './localization-towers-de.mjs?v=20261110-storyde1';
import {germanStatic} from './localization-static-de.mjs?v=20261110-storyde1';
import {germanBattle} from './localization-battle-de.mjs?v=20261110-storyde1';
import {germanResults} from './localization-results-de.mjs?v=20261105-debrief1';
import {germanAdvancedSkills} from './localization-advanced-skills-de.mjs?v=20261110-storyde1';
import {germanCampaign} from './localization-campaign-de.mjs?v=20261110-storyde1';
import {germanCinematics} from './localization-cinematics-de.mjs?v=20261110-storyde1';
import {germanSkills} from './localization-skills-de.mjs?v=20261109-flaglang1';
import {germanArmory} from './localization-armory-de.mjs?v=20261107-skillui1';
import {germanText} from './localization-de.mjs?v=20261104-fieldcommand1';
// Localization is presentation only. Player names, IDs, party codes and game
// state are never translated or written to the account. This is a preview: the
// complete story, gameplay and account flows still need translated strings.
const messages={
  'language.label':{en:'Language',de:'Sprache'},
  'loading.title':{en:'Connecting…',de:'Verbindung wird hergestellt…'},
  'loading.subtitle':{en:'Preparing your soldier.',de:'Dein Soldat wird vorbereitet.'},
  'auth.heading':{en:'IDENTITY CHECK',de:'IDENTITÄTSPRÜFUNG'},
  'auth.copy':{en:'Sign in to access your soldier and saved progress.',de:'Melde dich an, um auf deinen Soldaten und deinen gespeicherten Fortschritt zuzugreifen.'},
  'auth.email':{en:'EMAIL ADDRESS',de:'E-MAIL-ADRESSE'},
  'auth.password':{en:'PASSWORD',de:'PASSWORT'},
  'auth.signin':{en:'SIGN IN',de:'ANMELDEN'},
  'auth.register':{en:'CREATE ACCOUNT',de:'KONTO ERSTELLEN'},
  'auth.forgot':{en:'Forgot your password?',de:'Passwort vergessen?'},
  'command.title':{en:'Command Center',de:'Kommandozentrale'},
  'command.subtitle':{en:'The valley is waiting. Choose your next operation.',de:'Das Tal wartet. Wähle deinen nächsten Einsatz.'},
  'command.soldier':{en:'YOUR SOLDIER',de:'DEIN SOLDAT'},
  'command.experience':{en:'EXPERIENCE',de:'ERFAHRUNG'},
  'command.equipment':{en:'EQUIPMENT',de:'AUSRÜSTUNG'},
  'command.scrap':{en:'SCRAP',de:'SCHROTT'},
  'command.skillpoints':{en:'SKILL POINTS',de:'FÄHIGKEITSPUNKTE'},
  'command.armory':{en:'ARMORY',de:'WAFFENKAMMER'},
  'command.skills':{en:'SKILLS',de:'FÄHIGKEITEN'},
  'command.friends':{en:'FRIENDS',de:'FREUNDE'},
  'command.scores':{en:'HIGH SCORES',de:'BESTENLISTE'},
  'command.choose':{en:'Choose an operation',de:'Wähle einen Einsatz'},
  'command.campaign':{en:'Campaign',de:'Kampagne'},
  'command.endless':{en:'Endless',de:'Endlos'},
  'command.endless.desc':{en:'Survive wave after wave',de:'Überlebe Welle um Welle'},
  'command.multiplayer':{en:'Multiplayer',de:'Mehrspieler'},
  'command.multiplayer.desc':{en:'One code. Your squad.',de:'Ein Code. Dein Trupp.'},
  'command.none':{en:'None equipped',de:'Nichts ausgerüstet'},
  'command.level':{en:'LEVEL {level}',de:'STUFE {level}'},
  'command.storyDone':{en:'Story complete · replay missions',de:'Geschichte abgeschlossen · Missionen erneut spielen'},
  'command.missions':{en:'{done} / {total} missions completed',de:'{done} / {total} Missionen abgeschlossen'},
  'command.returnOnline':{en:'RETURN TO MULTIPLAYER',de:'ZURÜCK ZUM MEHRSPIELER'},
  'command.resume':{en:'RESUME {operation}',de:'{operation} FORTSETZEN'},
  'command.resumeDefault':{en:'RESUME OPERATION',de:'EINSATZ FORTSETZEN'},
  'workspace.back':{en:'← COMMAND CENTER',de:'← KOMMANDOZENTRALE'},
  'workspace.return':{en:'← RETURN TO MATCH',de:'← ZURÜCK ZUM SPIEL'},
  'workspace.armory':{en:'ARMORY',de:'WAFFENKAMMER'},
  'workspace.skills':{en:'SKILLS',de:'FÄHIGKEITEN'},
  'workspace.logout':{en:'SIGN OUT',de:'ABMELDEN'},
  'friends.title':{en:'Friends',de:'Freunde'},
  'friends.searchLabel':{en:'SEARCH EXACT SOLDIER NAME',de:'GENAUEN SOLDATENNAMEN SUCHEN'},
  'friends.search':{en:'SEARCH',de:'SUCHEN'},
  'friends.invites':{en:'Party invitations',de:'Gruppeneinladungen'},
  'friends.requests':{en:'Requests',de:'Anfragen'},
  'friends.list':{en:'Friends',de:'Freunde'},
  'friends.sent':{en:'Sent requests',de:'Gesendete Anfragen'},
  'scores.title':{en:'High scores',de:'Bestenliste'},
  'skills.title':{en:'Skills',de:'Fähigkeiten'},
  'skills.save':{en:'SAVE BUILD',de:'AUSWAHL SPEICHERN'},
  'skills.reset':{en:'RESET POINTS',de:'PUNKTE ZURÜCKSETZEN'},
  'armory.title':{en:'Armory & bunker',de:'Waffenkammer & Bunker'},
  'armory.equipment':{en:'EQUIPMENT',de:'AUSRÜSTUNG'},
  'armory.bunker':{en:'BUNKER',de:'BUNKER'},
  'armory.record':{en:'SERVICE RECORD',de:'DIENSTAKTE'},
};
export const SUPPORTED_LANGUAGES=['en','de'];
let active='en';
export const getLanguage=()=>active;
const listeners=new Set();
export function onLanguageChange(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
export function translateText(text,values={}){
  if(typeof text!=='string')return String(text??'');
  const localized=active==='de'?(germanSettings[text]??germanFirstRun[text]??germanWorkshop[text]??germanText[text]??germanArmory[text]??germanSkills[text]??germanAdvancedSkills[text]??germanResults[text]??germanBattle[text]??germanStatic[text]??germanMoreStatic[text]??germanTowers[text]??germanAccount[text]??germanGameErrors[text]??germanFinal[text]??germanCampaign[text]??germanCinematics[text]??text):text;
  return localized.replace(/\{([A-Za-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
}
export function translate(key,values={}){
  const text=messages[key]?.[active]??messages[key]?.en??key;
  return text.replace(/\{([A-Za-z]+)\}/g,(_,name)=>String(values[name]??''));
}
export function setupLanguage({document,storage,onChange=()=>{}}){
  const selector=document.getElementById('languageSelect');let lang='en';
  try{const saved=storage?.getItem('ironpath:language');if(SUPPORTED_LANGUAGES.includes(saved))lang=saved;}catch{}
  function render(){active=lang;document.documentElement.lang=lang;selector.value=lang;document.getElementById('languagePreviewNote').hidden=lang!=='de';
    for(const element of document.querySelectorAll('[data-i18n]')){const key=element.getAttribute('data-i18n');if(Object.hasOwn(messages,key))element.textContent=translate(key);}
    for(const element of document.querySelectorAll('[data-i18n-text]'))element.textContent=translateText(element.getAttribute('data-i18n-text'));
    for(const attr of ['placeholder','aria-label','title'])for(const element of document.querySelectorAll(`[data-i18n-${attr}]`))element.setAttribute(attr,translateText(element.getAttribute(`data-i18n-${attr}`)));
    onChange(lang);for(const listener of listeners)listener(lang);
  }
  selector.addEventListener('change',()=>{if(!SUPPORTED_LANGUAGES.includes(selector.value)){selector.value=lang;return;}lang=selector.value;try{storage?.setItem('ironpath:language',lang);}catch{}render();});
  render();return {getLanguage:()=>lang,translate};
}

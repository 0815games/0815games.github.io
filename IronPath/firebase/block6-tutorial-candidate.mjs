// OFFLINE candidate only. No credentials, network calls or deployment.
//
// Block 6 per-character tutorial persistence RTDB rules:
// Adds `players/$uid/tutorial` (and preserves it against accidental full-node
// profile rewrites while keeping atomic character deletion intact so a newly
// enlisted character on the same account starts fresh).
//
// Why this is shipped ahead of Block 6 UI:
//   `players/$uid` enforces `$other: { ".validate": false }`. Adding this
//   schema alongside Block 2 lets the operator publish RTDB rules ONCE for all
//   remaining roadmap blocks (Block 1–3, Block 6 tutorial, Block 7 combat HP).
//
// Additive & guarded: fails loudly if `players/$uid` differs from expectation,
// keeps all existing fields, ownership boundaries, and MAINTENANCE_GATE intact.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';

export const BLOCK6_TUTORIAL_GUARD='(!data.child(\'tutorial\').exists() || newData.child(\'tutorial\').exists())';

export const BLOCK6_TUTORIAL_RULE=Object.freeze({
 '.validate':'newData.hasChildren([\'edition\',\'status\',\'rewarded\'])',
 edition:{
  '.validate':'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 1 && newData.val() <= 100 && (!data.exists() || newData.val() >= data.val())',
 },
 status:{
  '.validate':'newData.isString() && (newData.val() === \'offered\' || newData.val() === \'accepted\' || newData.val() === \'declined\' || newData.val() === \'completed\')',
 },
 rewarded:{
  '.validate':'newData.isBoolean() && (!data.exists() || data.val() !== true || newData.val() === true)',
 },
 missionCompleted:{
  '.validate':'newData.isBoolean() && (!data.exists() || data.val() !== true || newData.val() === true)',
 },
 phase:{
  '.validate':'newData.isString() && (newData.val() === \'dossier\' || newData.val() === \'mission\' || newData.val() === \'menu\' || newData.val() === \'done\')',
 },
 step:{
  '.validate':'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 1000',
 },
 $other:{
  '.validate':false,
 },
});

export function unwrapRules(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Rules must be a JSON object');
 const inner=value.rules;
 return inner&&typeof inner==='object'&&!Array.isArray(inner)?inner:value;
}

export function applyBlock6TutorialRules(rules){
 const player=rules?.players?.$uid;
 const validate=player?.['.validate'];
 if(typeof validate!=='string'||!validate.includes('newData.hasChildren(['))throw Error('Player validation reference changed; re-audit before adding Block 6 tutorial rules');
 const expected=JSON.parse(JSON.stringify(BLOCK6_TUTORIAL_RULE));
 if(player.tutorial!==undefined&&JSON.stringify(player.tutorial)!==JSON.stringify(expected)){
  throw Error('players/$uid/tutorial already exists with a different schema; re-audit before overwriting');
 }
 if(!validate.includes(BLOCK6_TUTORIAL_GUARD)){
  player['.validate']=`${validate} && ${BLOCK6_TUTORIAL_GUARD}`;
 }
 player.tutorial=expected;
 return rules;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [baseFile,outputFile]=process.argv.slice(2);
 try{
  const file=baseFile??new URL('./BLOCK9D-RULES-TO-PUBLISH.json',import.meta.url);
  const raw=JSON.parse(await readFile(file,'utf8'));
  const rules=JSON.parse(JSON.stringify(unwrapRules(raw)));
  applyBlock6TutorialRules(rules);
  const text=JSON.stringify({rules},null,2)+'\n';
  if(outputFile)await writeFile(outputFile,text);
  else process.stdout.write(text);
 }catch(error){
  console.error(error.message);
  process.exitCode=1;
 }
}

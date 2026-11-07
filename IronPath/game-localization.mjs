import {SKILL_PATHS} from './skills.mjs?v=20261107-balance1';
// These patterns are restricted to known engine-generated messages and names.
// Unknown messages and all player-supplied text pass through untouched.
export function localizeGameMessage(text,tr){
 if(typeof text!=='string')return tr(text);
 let m=text.match(/^Not enough supplies\. This tower costs (\d+)\.$/);if(m)return tr('Not enough supplies. This tower costs {cost}.',{cost:m[1]});
 m=text.match(/^Not enough supplies\. You need (\d+)\.$/);if(m)return tr('Not enough supplies. You need {cost}.',{cost:m[1]});
 m=text.match(/^(.+) is recharging\.$/);if(m&&SKILL_PATHS.some(p=>p.ability===m[1]||p.branches.some(b=>b.ability===m[1])))return tr('{ability} is recharging.',{ability:tr(m[1])});
 return tr(text);
}

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../js/systems/combat-layout.js',import.meta.url),'utf8');
const css=source.split('style.textContent=`')[1].split('`;document.head.append(style);')[0];
let checks=0;const check=fn=>{fn();checks++;};
check(()=>assert.ok(css.includes('grid-template-rows:repeat(5,auto)')));
check(()=>assert.ok(!css.includes('minmax(40px,72px)')));
check(()=>assert.ok(!css.includes('min-height:2.6em')));
check(()=>assert.ok(!css.includes('align-content:center')));
check(()=>assert.ok(css.includes('background:transparent;overflow:visible')));
check(()=>assert.ok(css.includes('grid-area:log;order:2;min-height:0;max-height:none;overflow:visible')));
check(()=>assert.ok(!css.includes('max-height:64px')));
check(()=>assert.ok(css.includes('height:auto;max-height:calc(100vh')));
check(()=>assert.ok(css.includes('max-height:calc(100dvh')));
check(()=>assert.ok(css.includes('env(safe-area-inset-left)')&&css.includes('env(safe-area-inset-right)')&&css.includes('env(safe-area-inset-bottom)')));
check(()=>assert.ok(css.includes('overflow-x:hidden!important;overflow-y:auto!important')));
check(()=>assert.ok(css.includes('@media(max-width:420px)')));
check(()=>assert.ok(css.includes('@media(max-width:300px)')));
check(()=>assert.ok(css.includes('@media(max-height:600px)')));
check(()=>assert.ok(css.includes('height:auto;aspect-ratio:1;max-width:100%')));
check(()=>assert.ok(css.includes('min-height:48px')&&css.includes('min-height:52px')));
check(()=>assert.ok(css.includes('button:focus-visible')));
class Element{
 constructor(){this.attrs={};this.textContent='';this.id='';}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}
 querySelector(s){return s==='h2'?heading:s==='.combat-buttons'?actions:null;}
 insertBefore(a,b){a.nextElementSibling=b;}
}
const heading=new Element(),actions=new Element(),combat=new Element(),bar=new Element(),display=new Element(),log=new Element();
bar.parentElement=combat;
const nodes={combat,'combat-display':display,'combat-log':log,'ability-bar':bar};
const styles=[],observers=[];
const state={world:{theme:'frostgruft'},activeMonster:{id:'boss'}};
const before=JSON.stringify(state);
const document={readyState:'complete',getElementById:id=>nodes[id]||styles.find(n=>n.id===id)||null,createElement:()=>new Element(),head:{append:n=>styles.push(n)}};
vm.runInNewContext(source.replace(/^import .*;\n/gm,''),{document,state,setTimeout:fn=>fn(),MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}}});
check(()=>assert.equal(styles.length,1));
check(()=>assert.equal(combat.attrs['data-battle-theme'],'frostgruft'));
check(()=>assert.equal(combat.attrs['data-battle-boss'],'true'));
check(()=>assert.equal(heading.textContent,'Bossbegegnung'));
check(()=>assert.equal(display.attrs['aria-label'],'Held und Gegner'));
check(()=>assert.equal(log.attrs['aria-live'],'polite'));
check(()=>assert.equal(bar.attrs['aria-label'],'Klassenfähigkeiten'));
check(()=>assert.equal(bar.nextElementSibling,actions));
check(()=>assert.equal(JSON.stringify(state),before));
state.world.theme='not-known';state.activeMonster.id='rat';observers[0]();
check(()=>assert.equal(combat.attrs['data-battle-theme'],'katakomben'));
check(()=>assert.equal(heading.textContent,'Begegnung'));
check(()=>assert.equal(combat.attrs['data-battle-boss'],'false'));
console.log(JSON.stringify({checks,passed:checks,scope:'CSS source contracts and combat-layout installation with DOM doubles; no rendered layout/browser/Firebase'}));

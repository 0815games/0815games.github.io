import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {setupFieldMenu} from '../field-menu.mjs';

function extractDetailsElement(html, idAttr) {
 const start = html.indexOf(idAttr);
 if (start < 0) return '';
 const openTagStart = html.lastIndexOf('<details', start);
 let depth = 0;
 for (const match of html.slice(openTagStart).matchAll(/<\/?details\b/g)) {
  depth += match[0] === '</details' ? -1 : 1;
  if (depth === 0) return html.slice(openTagStart, openTagStart + match.index + '</details>'.length);
 }
 return html.slice(openTagStart);
}

test('the live field has a visible sign-out action using the shared account flow',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const field=extractDetailsElement(html,'id="fieldOps"');
 assert.match(field,/<button\b[^>]*id="fieldLogout"[^>]*data-i18n-text="SIGN OUT"/,'the battlefield menu must expose a translatable sign-out control');
 assert.match(field,/id="fieldSettings"[\s\S]*id="fieldLogout"/,'settings and sign-out sit cleanly together in the field menu footer');
 assert.doesNotMatch(field,/id="fieldBack"|id="fieldCoachReplay"/,'unused Command Center and Replay Coaching entries are removed from #fieldOps');
 const listeners={},menu={open:true,contains:()=>false},fieldButton={addEventListener:(type,fn)=>{listeners[type]=fn;}},calls=[];
 const target={click:()=>calls.push('signout')};
 const nodes={fieldOps:menu,fieldLogout:fieldButton,menuLogout:target};
 const document={getElementById:id=>nodes[id]??null,addEventListener(){}};
 setupFieldMenu({document});assert.equal(typeof listeners.click,'function');listeners.click();
 assert.deepEqual(calls,['signout']);assert.equal(menu.open,false,'the field menu closes before the shared confirmation opens');
});

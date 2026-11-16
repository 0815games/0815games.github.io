import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {setupFieldMenu} from '../field-menu.mjs';

test('the live field has a visible sign-out action using the shared account flow',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const field=html.slice(html.indexOf('id="fieldOps"'),html.indexOf('</details>',html.indexOf('id="fieldOps"')));
 assert.match(field,/<button\b[^>]*id="fieldLogout"[^>]*data-i18n-text="SIGN OUT"/,'the battlefield menu must expose a translatable sign-out control');
 const listeners={},menu={open:true,contains:()=>false},fieldButton={addEventListener:(type,fn)=>{listeners[type]=fn;}},calls=[];
 const target={click:()=>calls.push('signout')};
 const nodes={fieldOps:menu,fieldLogout:fieldButton,menuLogout:target};
 const document={getElementById:id=>nodes[id]??null,addEventListener(){}};
 setupFieldMenu({document});assert.equal(typeof listeners.click,'function');listeners.click();
 assert.deepEqual(calls,['signout']);assert.equal(menu.open,false,'the field menu closes before the shared confirmation opens');
});

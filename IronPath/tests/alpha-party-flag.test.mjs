import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
const account=await readFile(new URL('../account.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(account,/clipboard:navigator\.clipboard,enabled:true/,'Firebase party UI must be enabled for the live alpha test');
assert.match(html,/PRIVATE PARTY · ALPHA TEST/);
assert.match(html,/Co-op does not award XP/);
assert.match(html,/account\.js\?v=20261101-fourparty1/);
console.log('Live alpha party entry point checks passed.');

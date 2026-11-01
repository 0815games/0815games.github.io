import {strict as assert} from 'node:assert';
import {randomFillSync} from 'node:crypto';
import {createPartyCode,parsePartyCode} from '../party-code.mjs';
const crypto={getRandomValues:randomFillSync},seen=new Set();
for(let i=0;i<100;i++){
  const {partyId,inviteCode}=createPartyCode(crypto);
  assert.match(inviteCode,/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
  assert.match(partyId,/^[a-f0-9]{32}$/);assert.equal(parsePartyCode(inviteCode),partyId);
  assert.equal(parsePartyCode(inviteCode.toLowerCase().replaceAll('-',' ')),partyId);
  assert.ok(!seen.has(partyId));seen.add(partyId);
}
assert.equal(parsePartyCode('OOOO OOOO OOOO OOOO'),'0'.repeat(32));
assert.equal(parsePartyCode('IIII IIII IIII IIII'),parsePartyCode('1111-1111-1111-1111'));
const legacy='0123456789abcdef0123456789abcdef';assert.equal(parsePartyCode(legacy),legacy);
for(const invalid of ['', 'not a valid code', '../bad', 'abc', 'Z'.repeat(17)])assert.throws(()=>parsePartyCode(invalid),/Invalid/);
console.log('Short party codes, formatting and legacy compatibility tests passed.');

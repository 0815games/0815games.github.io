// An invite carries 80 random bits in 16 easy-to-type base32 characters.
// The Firebase key stays 32 lowercase hex digits for existing deployed rules.
const ALPHABET='0123456789abcdefghjkmnpqrstvwxyz';
const INVITE=/^[0-9abcdefghjkmnpqrstvwxyz]{16}$/;
const LEGACY=/^[a-f0-9]{32}$/;
export function createPartyCode(crypto){
  const bytes=new Uint8Array(10);crypto.getRandomValues(bytes);
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  let value=BigInt('0x'+hex),code='';
  for(let i=0;i<16;i++){code=ALPHABET[Number(value&31n)]+code;value>>=5n;}
  return {partyId:hex+'000000000000',inviteCode:formatPartyCode(code)};
}
export function formatPartyCode(code){return code.toUpperCase().match(/.{1,4}/g).join('-');}
export function parsePartyCode(text){
  if(typeof text!=='string')throw new Error('Invalid party code');
  let code=text.toLowerCase().replace(/[\s-]/g,'');
  // Old 32-character party IDs remain usable until existing parties close.
  if(LEGACY.test(code))return code;
  code=code.replace(/o/g,'0').replace(/[il]/g,'1');
  if(!INVITE.test(code))throw new Error('Invalid party code');
  let value=0n;for(const c of code)value=(value<<5n)|BigInt(ALPHABET.indexOf(c));
  return value.toString(16).padStart(20,'0')+'000000000000';
}

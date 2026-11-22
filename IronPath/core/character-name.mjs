// Soldier names: ONE rule, in ONE place.
//
// The operator asked that two accounts must not be able to create the same
// character name (A1). The hard part is not the check - it is agreeing how two
// names are compared, because the answer decides whether `Alex` and `alex`
// collide, and whether `Straße` and `STRASSE` do.
//
// Rules this module keeps:
//
//   * the DISPLAY name is stored exactly as typed (trimmed); only the
//     comparison key is normalized. Nobody's spelling is rewritten;
//   * the same function must run in the game client, in the friend search
//     index and in the offline audit script, or the three of them quietly
//     disagree about which names are duplicates. The shared cases live in
//     `firebase/name-policy-fixtures.json` and are asserted by both engines;
//   * the policy is versioned. `CHARACTER_NAME_POLICY` changes only when the
//     comparison changes, so a stored key can always be traced to a rule.
//
// What this module deliberately does NOT claim: Firebase Rules cannot perform
// Unicode normalization, so the server cannot independently verify that a key
// matches the name. Uniqueness therefore rests on the shared client code plus
// the index rules - see firebase/CHARACTER-NAME-AUDIT.md for the boundary and
// operator rollout decisions.

// Compared after: ECMAScript trim, NFC, Unicode Default Case Folding, NFC again
// (`NFC + Unicode Default Case Folding`, aligned with `audit-character-names.py`).
// This makes `Straße`/`STRASSE`, `ẞ`/`ss`, `ΜΑΡΚΟΣ`/`μαρκοσ`, and ligatures like
// `ﬁ`/`fi` share the exact same key across enlistment, rename, and friend search.
export const CHARACTER_NAME_POLICY='NFC_CASEFOLD_V2';
export const CHARACTER_NAME_MIN=2;
export const CHARACTER_NAME_MAX=24;
// How long a reservation is protected before an ABANDONED one may be taken
// over. The window exists for one reason only: the profile is written after
// the reservation, so for a few seconds a perfectly live enlistment looks
// exactly like a crashed one (no profile yet). Without the window, a second
// account could snatch the name out from under that enlistment - and end up
// sharing it, which is the thing this whole index is supposed to prevent.
//
// Six hours is defined here once and inlined into the Rules by
// firebase/character-name-candidate.mjs, so the number in the deployed rules
// can always be traced back to this line. The client does NOT keep its own
// copy: it attempts the takeover and lets the server refuse.
export const CHARACTER_NAME_RESERVATION_GRACE_MS=6*60*60*1000;
// Firebase Realtime Database keys must not contain `.#$[]/` or control bytes, and
// the friend search index already allows at most 96 UTF-8 bytes.
const KEY_MAX_BYTES=96;
// ECMAScript TrimString whitespace and line terminators. Deliberately narrower
// than a generic Unicode space class: the audit script uses the same set.
const TRIM_PATTERN=new RegExp('^[\\u0009\\u000a\\u000b\\u000c\\u000d\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+|[\\u0009\\u000a\\u000b\\u000c\\u000d\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+$','gu');

// Unicode Default Case Folding delta table on top of JS `toLowerCase()` after NFC:
// covers every Unicode 15.1 code point outside Cherokee where `String.casefold()`
// differs from `String.toLowerCase()` (sharp s/ẞ -> ss, micro -> mu, long s -> s,
// final sigma -> sigma, symbol letters, Armenian ligature, Cyrillic/Greek extensions,
// Latin ligatures ff..st, and Greek ypogegrammeni/prosgegrammeni expansions).
const CASEFOLD_OVERRIDES=Object.freeze({
  '\u00b5':'\u03bc',
  '\u00df':'ss',
  '\u0149':'\u02bcn',
  '\u017f':'s',
  '\u0345':'\u03b9',
  '\u03c2':'\u03c3',
  '\u03d0':'\u03b2',
  '\u03d1':'\u03b8',
  '\u03d5':'\u03c6',
  '\u03d6':'\u03c0',
  '\u03f0':'\u03ba',
  '\u03f1':'\u03c1',
  '\u03f5':'\u03b5',
  '\u0587':'\u0565\u0582',
  '\u1c80':'\u0432',
  '\u1c81':'\u0434',
  '\u1c82':'\u043e',
  '\u1c83':'\u0441',
  '\u1c84':'\u0442',
  '\u1c85':'\u0442',
  '\u1c86':'\u044a',
  '\u1c87':'\u0463',
  '\u1c88':'\ua64b',
  '\u1e9a':'a\u02be',
  '\u1e9b':'\u1e61',
  '\u1e9e':'ss',
  '\u1f80':'\u1f00\u03b9',
  '\u1f81':'\u1f01\u03b9',
  '\u1f82':'\u1f02\u03b9',
  '\u1f83':'\u1f03\u03b9',
  '\u1f84':'\u1f04\u03b9',
  '\u1f85':'\u1f05\u03b9',
  '\u1f86':'\u1f06\u03b9',
  '\u1f87':'\u1f07\u03b9',
  '\u1f88':'\u1f00\u03b9',
  '\u1f89':'\u1f01\u03b9',
  '\u1f8a':'\u1f02\u03b9',
  '\u1f8b':'\u1f03\u03b9',
  '\u1f8c':'\u1f04\u03b9',
  '\u1f8d':'\u1f05\u03b9',
  '\u1f8e':'\u1f06\u03b9',
  '\u1f8f':'\u1f07\u03b9',
  '\u1f90':'\u1f20\u03b9',
  '\u1f91':'\u1f21\u03b9',
  '\u1f92':'\u1f22\u03b9',
  '\u1f93':'\u1f23\u03b9',
  '\u1f94':'\u1f24\u03b9',
  '\u1f95':'\u1f25\u03b9',
  '\u1f96':'\u1f26\u03b9',
  '\u1f97':'\u1f27\u03b9',
  '\u1f98':'\u1f20\u03b9',
  '\u1f99':'\u1f21\u03b9',
  '\u1f9a':'\u1f22\u03b9',
  '\u1f9b':'\u1f23\u03b9',
  '\u1f9c':'\u1f24\u03b9',
  '\u1f9d':'\u1f25\u03b9',
  '\u1f9e':'\u1f26\u03b9',
  '\u1f9f':'\u1f27\u03b9',
  '\u1fa0':'\u1f60\u03b9',
  '\u1fa1':'\u1f61\u03b9',
  '\u1fa2':'\u1f62\u03b9',
  '\u1fa3':'\u1f63\u03b9',
  '\u1fa4':'\u1f64\u03b9',
  '\u1fa5':'\u1f65\u03b9',
  '\u1fa6':'\u1f66\u03b9',
  '\u1fa7':'\u1f67\u03b9',
  '\u1fa8':'\u1f60\u03b9',
  '\u1fa9':'\u1f61\u03b9',
  '\u1faa':'\u1f62\u03b9',
  '\u1fab':'\u1f63\u03b9',
  '\u1fac':'\u1f64\u03b9',
  '\u1fad':'\u1f65\u03b9',
  '\u1fae':'\u1f66\u03b9',
  '\u1faf':'\u1f67\u03b9',
  '\u1fb2':'\u1f70\u03b9',
  '\u1fb3':'\u03b1\u03b9',
  '\u1fb4':'\u03ac\u03b9',
  '\u1fb7':'\u1fb6\u03b9',
  '\u1fbc':'\u03b1\u03b9',
  '\u1fc2':'\u1f74\u03b9',
  '\u1fc3':'\u03b7\u03b9',
  '\u1fc4':'\u03ae\u03b9',
  '\u1fc7':'\u1fc6\u03b9',
  '\u1fcc':'\u03b7\u03b9',
  '\u1ff2':'\u1f7c\u03b9',
  '\u1ff3':'\u03c9\u03b9',
  '\u1ff4':'\u03ce\u03b9',
  '\u1ff7':'\u1ff6\u03b9',
  '\u1ffc':'\u03c9\u03b9',
  '\ufb00':'ff',
  '\ufb01':'fi',
  '\ufb02':'fl',
  '\ufb03':'ffi',
  '\ufb04':'ffl',
  '\ufb05':'st',
  '\ufb06':'st',
  '\ufb13':'\u0574\u0576',
  '\ufb14':'\u0574\u0565',
  '\ufb15':'\u0574\u056b',
  '\ufb16':'\u057e\u0576',
  '\ufb17':'\u0574\u056d',
});

function casefoldCodePoint(ch){
  const cp=ch.codePointAt(0);
  // Cherokee case folding folds uppercase/small syllables to the uppercase block.
  if(cp>=0x13a0&&cp<=0x13f5)return ch;
  if(cp>=0x13f8&&cp<=0x13fd)return String.fromCodePoint(cp-8);
  if(cp>=0xab70&&cp<=0xabbf)return String.fromCodePoint(cp-0x97d0);
  if(Object.hasOwn(CASEFOLD_OVERRIDES,ch))return CASEFOLD_OVERRIDES[ch];
  return ch.toLowerCase();
}

export function trimCharacterName(value){
  return String(value??'').replace(TRIM_PATTERN,'');
}

// The comparison form. Never shown to the player and never stored as the name.
export function normalizeCharacterName(value){
  let firstPass='';
  for(const ch of trimCharacterName(value).normalize('NFC')){
    firstPass+=casefoldCodePoint(ch);
  }
  let secondPass='';
  for(const ch of firstPass.normalize('NFC')){
    secondPass+=Object.hasOwn(CASEFOLD_OVERRIDES,ch)?CASEFOLD_OVERRIDES[ch]:ch;
  }
  return secondPass.normalize('NFC');
}

// Unpaired surrogates would encode lossily into a key, so they are rejected
// instead of silently producing a name that can never be found again.
function utf8Bytes(value){
  // Lone surrogates would be replaced by U+FFFD and could then collide with a
  // name that really contains that character, so they are refused outright -
  // the same decision the offline audit makes.
  if(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value))return null;
  try{return new TextEncoder().encode(value);}
  catch{return null;}
}

// Length is counted in UTF-16 code units, matching the published Rules
// validation (`name` between 2 and 24) and the audit script; the normalized
// comparison key is separately bounded to 96 UTF-8 bytes so expanding casefolds
// (e.g. `ß` -> `ss` at 24 characters) never break a valid display name.
export function validateCharacterName(value){
  if(typeof value!=='string')return {ok:false,reason:'invalid'};
  const trimmed=trimCharacterName(value);
  if(utf8Bytes(value)===null)return {ok:false,reason:'invalid'};
  if(trimmed.length<CHARACTER_NAME_MIN||trimmed.length>CHARACTER_NAME_MAX)return {ok:false,reason:'length'};
  const normalized=normalizeCharacterName(trimmed);
  if(!normalized)return {ok:false,reason:'empty'};
  const normalizedBytes=utf8Bytes(normalized);
  if(normalizedBytes===null||normalizedBytes.length>KEY_MAX_BYTES)return {ok:false,reason:'length'};
  return {ok:true,name:trimmed};
}

// The path-safe key: hex of the UTF-8 bytes of the COMPARISON form, so
// `Alex`, `alex`, `Straße` and `STRASSE` land in the right shared buckets
// and no Unicode can break a path.
export function characterNameKey(value){
  const trimmed=trimCharacterName(value);
  if(utf8Bytes(value)===null)throw Error('Invalid soldier name');
  if(trimmed.length<CHARACTER_NAME_MIN||trimmed.length>CHARACTER_NAME_MAX)throw Error('Enter the full soldier name (2–24 characters).');
  const normalized=normalizeCharacterName(trimmed);
  const bytes=utf8Bytes(normalized);
  if(bytes===null)throw Error('Invalid soldier name');
  if(!bytes.length)throw Error('Enter the full soldier name (2–24 characters).');
  if(bytes.length>KEY_MAX_BYTES)throw Error('Name is too long.');
  return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}

export const CHARACTER_NAME_KEY_PATTERN=/^(?:[a-f0-9]{2}){1,96}$/;

// True when two stored names are the same name under the registration policy.
// Used by the friend search to reject a listing whose stored name does not
// actually belong to the bucket it was published under.
export function sameCharacterName(a,b){
  if(typeof a!=='string'||typeof b!=='string')return false;
  if(utf8Bytes(a)===null||utf8Bytes(b)===null)return false;
  try{return normalizeCharacterName(a)===normalizeCharacterName(b);}
  catch{return false;}
}

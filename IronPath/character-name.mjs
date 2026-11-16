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
// the index rules - see firebase/CHARACTER-NAME-AUDIT.md for the limits and
// the still-open legacy-duplicate question.

// Compared after: ECMAScript trim, NFC, lowercase, NFC again (`NFC + Kleinschreibung`).
// The offline audit script is stricter (Unicode default case folding), which makes
// `Straße`/`STRASSE` a reported conflict there and two distinct names here. That
// difference is intentional, documented in the audit note and pinned by the shared
// fixtures - it is not something to "fix" silently in one engine alone.
export const CHARACTER_NAME_POLICY='NFC_LOWERCASE_V1';
export const CHARACTER_NAME_MIN=2;
export const CHARACTER_NAME_MAX=24;
// Firebase Realtime Database keys must not contain `.#$[]/` or control bytes, and
// the friend search index already allows at most 96 UTF-8 bytes.
const KEY_MAX_BYTES=96;
// ECMAScript TrimString whitespace and line terminators. Deliberately narrower
// than a generic Unicode space class: the audit script uses the same set.
const TRIM_PATTERN=new RegExp('^[\\u0009\\u000a\\u000b\\u000c\\u000d\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+|[\\u0009\\u000a\\u000b\\u000c\\u000d\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+$','gu');

export function trimCharacterName(value){
  return String(value??'').replace(TRIM_PATTERN,'');
}

// The comparison form. Never shown to the player and never stored as the name.
export function normalizeCharacterName(value){
  return trimCharacterName(value).normalize('NFC').toLowerCase().normalize('NFC');
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

// Length is counted in UTF-16 code units, exactly like the published Rules
// validation (`name` between 2 and 24) and like the audit script.
export function validateCharacterName(value){
  if(typeof value!=='string')return {ok:false,reason:'invalid'};
  const trimmed=trimCharacterName(value);
  if(utf8Bytes(value)===null)return {ok:false,reason:'invalid'};
  if(trimmed.length<CHARACTER_NAME_MIN||trimmed.length>CHARACTER_NAME_MAX)return {ok:false,reason:'length'};
  if(!normalizeCharacterName(trimmed))return {ok:false,reason:'empty'};
  return {ok:true,name:trimmed};
}

// The path-safe key: hex of the UTF-8 bytes of the COMPARISON form, so
// `Alex` and `alex` land in the same bucket and no Unicode can break a path.
export function characterNameKey(value){
  const normalized=normalizeCharacterName(value);
  const bytes=utf8Bytes(normalized);
  if(bytes===null)throw Error('Invalid soldier name');
  if(normalized.length<CHARACTER_NAME_MIN||normalized.length>CHARACTER_NAME_MAX)throw Error('Enter the full soldier name (2–24 characters).');
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

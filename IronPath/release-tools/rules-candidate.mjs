import {CONTROL_PATH} from './release-control.mjs';

// A candidate only: no Firebase credentials, network calls or deploy operation.
// Access requires an Admin-minted *session* claim, not a version supplied by
// the browser. Rotating the epoch on every closure rejects pre-update sessions
// even after reopening. The release record itself is public/read-only to clients.
export const RELEASE_GATE = `auth != null && root.child('${CONTROL_PATH}').child('mode').val() === 'open' && root.child('${CONTROL_PATH}').child('build').isString() && root.child('${CONTROL_PATH}').child('build').val().matches(/^[a-z0-9][a-z0-9-]{0,63}$/) && root.child('${CONTROL_PATH}').child('epoch').isString() && root.child('${CONTROL_PATH}').child('epoch').val().matches(/^[a-f0-9]{32}$/) && root.child('${CONTROL_PATH}').child('authAfterMs').isNumber() && root.child('${CONTROL_PATH}').child('authAfterMs').val() > 0 && root.child('${CONTROL_PATH}').child('authAfterMs').val() % 1 === 0 && auth.token.auth_time * 1000 > root.child('${CONTROL_PATH}').child('authAfterMs').val() && auth.token.firebase.sign_in_provider === 'custom' && auth.token.ip_release_epoch === root.child('${CONTROL_PATH}').child('epoch').val()`;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isFalse = value => value === false || (typeof value === 'string' && value.trim() === 'false');

// Wrap EVERY existing grant, not merely a child rule: RTDB grants cascade and
// a denial on a descendant cannot override a grant on an ancestor. Refuse root
// grants/wildcards so no parent or wildcard can grant writes to CONTROL_PATH.
// Pass a verified export of the complete live rules only after auditing whether
// this database is dedicated to Iron Path. Never deploy an unverified reference.
export function buildRulesCandidate(source) {
  if (!isObject(source) || !isObject(source.rules)) throw Error('Expected a complete rules object');
  const original = source.rules;
  for (const key of ['.read', '.write']) {
    if (!Object.hasOwn(original, key) || !isFalse(original[key])) throw Error(`Root ${key} must be explicitly false`);
  }
  if (Object.hasOwn(original, CONTROL_PATH)) throw Error('Release control path already exists; audit the live rules first');
  if (Object.keys(original).some(key => key.startsWith('$'))) throw Error('Root wildcards require a manual control-path security audit');

  const counts = {readWrapped: 0, writeWrapped: 0, readDenied: 0, writeDenied: 0};
  function visit(node, path) {
    if (!isObject(node)) throw Error(`Invalid rules node at ${path || '/'}`);
    // Firebase keys are data, including names such as "__proto__". A null
    // prototype prevents assignment from silently changing the JS prototype.
    const result = Object.create(null);
    for (const [key, value] of Object.entries(node)) {
      if (key === '.read' || key === '.write') {
        if (!(typeof value === 'boolean' || (typeof value === 'string' && value.trim()))) {
          throw Error(`Invalid ${key} at ${path || '/'}`);
        }
        const prefix = key === '.read' ? 'read' : 'write';
        if (isFalse(value)) {
          counts[`${prefix}Denied`]++;
          result[key] = value;
        } else {
          counts[`${prefix}Wrapped`]++;
          result[key] = `(${RELEASE_GATE}) && (${String(value)})`;
        }
      } else if (key === '.validate' || key === '.indexOn') {
        result[key] = structuredClone(value);
      } else if (key.startsWith('.')) {
        throw Error(`Unknown rules directive ${key} at ${path || '/'}`);
      } else {
        result[key] = visit(value, `${path}/${key}`);
      }
    }
    return result;
  }
  const rules = visit(original, '');
  rules[CONTROL_PATH] = {'.read': true, '.write': false};
  return {candidate: {...structuredClone(source), rules}, counts: Object.freeze(counts)};
}

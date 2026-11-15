// Local preparation only: this module does not connect to Firebase or write a
// database. A privileged operator must independently verify the target, use an
// atomic RTDB set/transaction and verify its result. Do not put a privileged
// database credential in the session service or in this repository.
import {randomBytes} from 'node:crypto';
import {BUILD_PATTERN, EPOCH_PATTERN} from './release-control.mjs';

// RTDB resolves {'.sv':'timestamp'} to its own Unix time in milliseconds when
// it applies the write. Including it in the SAME atomic write as mode:'open'
// prevents a gap between reading the cutoff and actually reopening. Preparing
// the object does not obtain a timestamp or enforce a single operator.
export function prepareReleaseControlWrite(input, random = randomBytes) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key=>!['mode','build','currentEpoch'].includes(key)) ||
      !Object.hasOwn(input,'currentEpoch') || !['open','maintenance'].includes(input.mode) ||
      typeof input.build !== 'string' || !BUILD_PATTERN.test(input.build) ||
      !(input.currentEpoch === null || (typeof input.currentEpoch === 'string' && EPOCH_PATTERN.test(input.currentEpoch))) ||
      typeof random !== 'function') throw Error('Invalid release transition');
  const bytes = random(16);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== 16) throw Error('Secure release epoch unavailable');
  const epoch = Buffer.from(bytes).toString('hex');
  if (epoch === input.currentEpoch) throw Error('Release epoch must change');
  return {mode:input.mode, build:input.build, epoch, authAfterMs:{'.sv':'timestamp'}};
}

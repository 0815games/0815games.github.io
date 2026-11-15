// Shared, deliberately small contract for the public release-control record.
// The record is only a signal; it is not proof that the browser runs honest code.
export const CONTROL_PATH = '_ironpathRelease';
export const BUILD_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const EPOCH_PATTERN = /^[a-f0-9]{32}$/;

// The browser and the exchange must read the control record belonging to the
// same Firebase database they use. Reject paths, credentials, query strings,
// non-Firebase hosts and non-HTTPS URLs instead of guessing a deployment URL.
export function firebaseControlUrl(databaseUrl) {
  let url;
  try { url = new URL(databaseUrl); } catch { throw Error('Invalid Firebase database URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.pathname !== '/' || url.search || url.hash ||
      !/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:firebasedatabase\.app|firebaseio\.com)$/.test(url.hostname)) {
    throw Error('Invalid Firebase database URL');
  }
  url.pathname = `/${CONTROL_PATH}.json`;
  return url.href;
}

// Fail closed for absent, partially written, legacy or malformed records.
// authAfterMs is an RTDB-server-derived Unix time in milliseconds, written
// atomically with mode:'open', not a browser clock or an earlier sampled time.
export function parseReleaseControl(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const {mode, build, epoch, authAfterMs} = value;
  if (!['maintenance', 'open'].includes(mode) || typeof build !== 'string' ||
      !BUILD_PATTERN.test(build) || typeof epoch !== 'string' || !EPOCH_PATTERN.test(epoch) ||
      !Number.isSafeInteger(authAfterMs) || authAfterMs <= 0) return null;
  return Object.freeze({mode, build, epoch, authAfterMs});
}

// Firebase Auth exposes whole seconds; RTDB server timestamps are milliseconds.
// A sign-in in the cutoff's second is deliberately rejected, even if it happened
// just after opening. The next complete Auth second may be admitted. This does
// not prove synchronization between the distinct Firebase Auth and RTDB clocks.
export function isAuthAfterCutoff(authTimeSeconds, cutoffMs) {
  if (!Number.isSafeInteger(authTimeSeconds) || authTimeSeconds <= 0 ||
      !Number.isSafeInteger(cutoffMs) || cutoffMs <= 0) return false;
  const authTimeMs = authTimeSeconds * 1000;
  return Number.isSafeInteger(authTimeMs) && authTimeMs > cutoffMs;
}

export function sameRelease(a, b) {
  return !!a && !!b && a.mode === b.mode && a.build === b.build &&
    a.epoch === b.epoch && a.authAfterMs === b.authAfterMs;
}

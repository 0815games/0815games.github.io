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

// Fail closed for absent, partially written or malformed records. authAfter is
// a server-derived Unix time in seconds, NOT a browser time. The exchange must
// reject password authentications made at or before that cutoff.
export function parseReleaseControl(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const {mode, build, epoch, authAfter} = value;
  if (!['maintenance', 'open'].includes(mode) || typeof build !== 'string' ||
      !BUILD_PATTERN.test(build) || typeof epoch !== 'string' || !EPOCH_PATTERN.test(epoch) ||
      !Number.isSafeInteger(authAfter) || authAfter <= 0) return null;
  return Object.freeze({mode, build, epoch, authAfter});
}

export function sameRelease(a, b) {
  return !!a && !!b && a.mode === b.mode && a.build === b.build &&
    a.epoch === b.epoch && a.authAfter === b.authAfter;
}

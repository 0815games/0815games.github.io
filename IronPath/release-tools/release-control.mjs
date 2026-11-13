// Shared, deliberately small contract for the public release-control record.
// The record is only a signal; it is not proof that the browser runs honest code.
export const CONTROL_PATH = '_ironpathRelease';
export const BUILD_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const EPOCH_PATTERN = /^[a-f0-9]{32}$/;

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

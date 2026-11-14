// EXPERIMENTAL: unmounted, no credentials or Firebase deployment in this file.
// A trusted service may verify a fresh Firebase password ID token and mint a
// custom token whose claim is checked by the candidate database rules. The
// caller-supplied build is a compatibility check, NOT proof of code integrity.
import {BUILD_PATTERN, parseReleaseControl, sameRelease, isAuthAfterCutoff} from './release-control.mjs';

export function createReleaseSessionExchange({readControl, verifyIdToken, mintCustomToken, now = Date.now} = {}) {
  if (![readControl, verifyIdToken, mintCustomToken, now].every(fn => typeof fn === 'function')) {
    throw Error('Fresh control reader, revoked-token verifier, token signer and clock are required');
  }
  async function read() {
    try { return parseReleaseControl(await readControl()); } catch { return null; }
  }
  return Object.freeze({
    async exchange(request) {
      if (!request || typeof request !== 'object' || Array.isArray(request)) return {status:'invalid'};
      const {idToken, build} = request;
      if (typeof idToken !== 'string' || idToken.length < 1 || idToken.length > 8192 || /\s/.test(idToken) ||
          typeof build !== 'string' || !BUILD_PATTERN.test(build)) return {status:'invalid'};
      const initial = await read();
      if (!initial) return {status:'unavailable'};
      if (initial.mode !== 'open') return {status:'maintenance'};
      if (initial.build !== build) return {status:'outdated'};

      let identity;
      try { identity = await verifyIdToken(idToken, true); } catch { return {status:'unauthorized'}; }
      const seconds = Math.floor(now() / 1000);
      if (!Number.isSafeInteger(seconds) || !identity || typeof identity.uid !== 'string' ||
          identity.uid.length < 1 || identity.uid.length > 128 ||
          identity.firebase?.sign_in_provider !== 'password' || identity.firebase?.tenant != null ||
          !isAuthAfterCutoff(identity.auth_time, initial.authAfterMs) ||
          identity.auth_time > seconds + 30 || identity.auth_time < seconds - 300) {
        return {status:'unauthorized'};
      }

      // Each read must reach the authoritative server. A closure can still race
      // with the final response: the atomically changed rules/epoch must reject
      // any token minted just before that closure. Never reuse an old epoch.
      const beforeMint = await read();
      if (!sameRelease(initial, beforeMint)) return {status:'unavailable'};
      let customToken;
      try { customToken = await mintCustomToken(identity.uid, {ip_release_epoch:initial.epoch}); }
      catch { return {status:'unavailable'}; }
      if (typeof customToken !== 'string' || !customToken || customToken.length > 16384) return {status:'unavailable'};
      const beforeReturn = await read();
      if (!sameRelease(initial, beforeReturn)) return {status:'unavailable'};
      return {status:'ok', customToken};
    }
  });
}

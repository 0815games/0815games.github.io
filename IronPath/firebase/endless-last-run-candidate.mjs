// OFFLINE candidate only. No credentials, network calls or deployment.
// The pinned workshop reference is not a fresh export of the live Rules:
// rebase and re-audit it before any separately authorized publication.
import {buildSocialCleanupCandidate} from './social-cleanup-candidate.mjs';

const AUDIT='Endless last-run rule reference changed; re-audit before building a candidate';

// The last endless run, as the client stores it on the soldier's profile
// (players/$uid/endlessLastRun): the run summary the launch dialog shows.
// Bounded integers only - the same caps the client clamps to when it records
// a run - plus the day it happened. Nothing here grants a read or a write to
// anyone who does not already own the profile; the field is owner-written
// through the profile's existing .write, like the four record counters.
export const ENDLESS_LAST_RUN_VALIDATE="newData.hasChildren(['waves', 'bosses', 'sector'])";
export const ENDLESS_LAST_RUN_WAVES_VALIDATE='newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 100000';
export const ENDLESS_LAST_RUN_BOSSES_VALIDATE='newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 20000';
export const ENDLESS_LAST_RUN_SECTOR_VALIDATE='newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 999';
export const ENDLESS_LAST_RUN_DATE_VALIDATE='newData.isNumber() && newData.val() >= 0';

// Applied to an existing ruleset, in place. It only ever ADDS the
// `endlessLastRun` child of a player: today's published rules have no such
// field, and without it the catch-all (`$other: {".validate": false}`)
// refuses the write, which is why the last run used to live on the device
// only. Existing children are never touched; a base that already carries a
// different spelling of this field aborts the build instead of drifting.
export function applyEndlessLastRunRules(rules){
 const player=rules.players?.$uid;
 if(!player)throw Error(AUDIT);
 if(player.endlessLastRun)throw Error(AUDIT);
 player.endlessLastRun={
  '.validate':ENDLESS_LAST_RUN_VALIDATE,
  waves:{'.validate':ENDLESS_LAST_RUN_WAVES_VALIDATE},
  bosses:{'.validate':ENDLESS_LAST_RUN_BOSSES_VALIDATE},
  sector:{'.validate':ENDLESS_LAST_RUN_SECTOR_VALIDATE},
  date:{'.validate':ENDLESS_LAST_RUN_DATE_VALIDATE},
  $other:{'.validate':false},
 };
 return rules;
}

export function buildEndlessLastRunCandidate(bytes){
 const result=buildSocialCleanupCandidate(bytes);
 applyEndlessLastRunRules(result.rules);
 return result;
}

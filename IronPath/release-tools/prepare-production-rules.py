#!/usr/bin/env python3
"""Compare a fresh, separately exported Rules file and prepare a candidate only.

No network, credentials, Firebase writes or deployment occur here. A matching
file does not prove which project it came from or that the live rules remain
unchanged. Never put player data or service-account keys in the input file.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / 'IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json'
REFERENCE_SHA256 = '8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577'
CANDIDATE_SHA256 = '3228688deafc6b2989a03945f92f37043ffef22ac75a2df98bf5d73b688715e4'


def unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate JSON key')
        result[key] = value
    return result


def invalid_constant(_value):
    raise ValueError('Invalid JSON constant')


def parse_rules(data):
    return json.loads(data.decode('utf-8-sig'), object_pairs_hook=unique_pairs,
                      parse_constant=invalid_constant)


def canonical(value):
    # Key order and formatting may differ in an export. Do not ignore keys,
    # expressions, types or array order; even a small real change needs review.
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(',', ':'))


def prepare(export_file, output_file):
    source = REFERENCE.read_bytes()
    if hashlib.sha256(source).hexdigest() != REFERENCE_SHA256:
        raise ValueError('Pinned reference changed; review required')
    exported = Path(export_file).read_bytes()
    if len(exported) > 1024 * 1024:
        raise ValueError('Rules export is too large')
    if canonical(parse_rules(exported)) != canonical(parse_rules(source)):
        raise ValueError('Fresh Rules differ from the reference; reconcile before publishing')
    program = r'''
      import {readFile} from 'node:fs/promises';
      import {buildSocialCleanupCandidate} from './IronPath/firebase/social-cleanup-candidate.mjs';
      import {buildRulesCandidate} from './IronPath/release-tools/rules-candidate.mjs';
      const source=await readFile('./IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json');
      const {candidate,counts}=buildRulesCandidate(buildSocialCleanupCandidate(source));
      if(counts.readWrapped!==45 || counts.writeWrapped!==41)throw Error('Unexpected release-rule count');
      process.stdout.write(JSON.stringify(candidate,null,2)+'\n');
    '''
    result = subprocess.run(['node', '--input-type=module', '-e', program], cwd=ROOT,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    candidate = result.stdout
    if hashlib.sha256(candidate).hexdigest() != CANDIDATE_SHA256:
        raise ValueError('Combined candidate changed; review required')
    # Write only the specified new candidate, never overwrite an existing file.
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(output_file, flags, 0o600)
    with os.fdopen(fd, 'wb') as out:
        out.write(candidate)
    return CANDIDATE_SHA256


def main():
    if len(sys.argv) != 3:
        print('Usage: python3 prepare-production-rules.py <fresh-rules-export.json> <new-candidate.json>', file=sys.stderr)
        return 2
    try:
        candidate_hash = prepare(sys.argv[1], sys.argv[2])
        print(f'Local candidate prepared (SHA-256 {candidate_hash}); nothing was published.')
        return 0
    except (OSError, ValueError, UnicodeError, subprocess.SubprocessError) as error:
        # Do not print export contents or subprocess output.
        detail = str(error) if isinstance(error, ValueError) else 'Could not read, compare or prepare the Rules'
        print(f'Stopped: {detail}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

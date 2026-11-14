#!/usr/bin/env python3
"""Prepare the Firebase-only candidate after comparing a fresh Rules export.

This program is offline: it reads no credentials and cannot deploy Rules. A
matching export does not prove its origin or protect against later changes.
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
CANDIDATE_SHA256 = '369bf819546c4f063dfe88212bd61f1599e88e4eef9b30d77089d9fc7982f029'


def unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate JSON key')
        result[key] = value
    return result


def invalid_constant(_value):
    raise ValueError('Invalid JSON constant')


def parse(data):
    return json.loads(data.decode('utf-8-sig'), object_pairs_hook=unique_pairs,
                      parse_constant=invalid_constant)


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(',', ':'))


def prepare(export_file, output_file):
    source = REFERENCE.read_bytes()
    if hashlib.sha256(source).hexdigest() != REFERENCE_SHA256:
        raise ValueError('Pinned reference changed; review required')
    exported = Path(export_file).read_bytes()
    if len(exported) > 1024 * 1024:
        raise ValueError('Rules export is too large')
    if canonical(parse(exported)) != canonical(parse(source)):
        raise ValueError('Fresh Rules differ from the reference; reconcile before publishing')
    program = r'''
      import {readFile} from 'node:fs/promises';
      import {buildSocialCleanupCandidate} from './IronPath/firebase/social-cleanup-candidate.mjs';
      import {buildMaintenanceRulesCandidate} from './IronPath/release-tools/maintenance-rules.mjs';
      const bytes=await readFile('./IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json');
      const {candidate,counts}=buildMaintenanceRulesCandidate(buildSocialCleanupCandidate(bytes));
      if(counts.readWrapped!==45||counts.writeWrapped!==41)throw Error('Unexpected grant count');
      process.stdout.write(JSON.stringify(candidate,null,2)+'\n');
    '''
    result = subprocess.run(['node', '--input-type=module', '-e', program], cwd=ROOT,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    candidate = result.stdout
    if hashlib.sha256(candidate).hexdigest() != CANDIDATE_SHA256:
        raise ValueError('Candidate changed; review required')
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(output_file, flags, 0o600)
    with os.fdopen(fd, 'wb') as out:
        out.write(candidate)
    return CANDIDATE_SHA256


def main():
    if len(sys.argv) != 3:
        print('Usage: python3 prepare-maintenance-rules.py <fresh-rules-export.json> <new-candidate.json>', file=sys.stderr)
        return 2
    try:
        result = prepare(sys.argv[1], sys.argv[2])
        print(f'Local candidate prepared (SHA-256 {result}); nothing was published.')
        return 0
    except (OSError, ValueError, UnicodeError, subprocess.SubprocessError) as error:
        detail = str(error) if isinstance(error, ValueError) else 'Could not read, compare or prepare the Rules'
        print(f'Stopped: {detail}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

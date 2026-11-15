#!/usr/bin/env python3
"""Prepare the Firebase-only candidate after comparing a fresh Rules export.

This program is offline: it reads no credentials and cannot deploy Rules. A
matching export does not prove its origin or protect against later changes.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / 'IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json'
REFERENCE_SHA256 = '8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577'
CANDIDATE_SHA256 = '369bf819546c4f063dfe88212bd61f1599e88e4eef9b30d77089d9fc7982f029'
ADMIN_TEMPLATE_UID = 'LOCAL_TEMPLATE_UID'
ADMIN_TEMPLATE_SHA256 = '04a686f4f52ab3ec84ff9682d9a546c9211c75aa4ebf5c9e8e1a74afc0993e08'


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


def prepare(export_file, output_file, admin_uid):
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', admin_uid) or admin_uid == ADMIN_TEMPLATE_UID:
        raise ValueError('A verified administrator Firebase UID is required')
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
      import {buildMaintenanceRulesCandidate,maintenanceAdminRules,maintenanceAdminAccessRules} from './IronPath/release-tools/maintenance-rules.mjs';
      const bytes=await readFile('./IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json');
      const source=buildSocialCleanupCandidate(bytes);
      const {candidate:base,counts}=buildMaintenanceRulesCandidate(source);
      if(counts.readWrapped!==45||counts.writeWrapped!==41)throw Error('Unexpected grant count');
      const {candidate:admin}=buildMaintenanceRulesCandidate(source,{adminUid:process.argv[1]});
      const template={control:maintenanceAdminRules('LOCAL_TEMPLATE_UID'),access:maintenanceAdminAccessRules('LOCAL_TEMPLATE_UID')};
      process.stdout.write(JSON.stringify({base:JSON.stringify(base,null,2)+'\n',admin:JSON.stringify(admin,null,2)+'\n',template}));
    '''
    result = subprocess.run(['node', '--input-type=module', '-e', program, '--', admin_uid], cwd=ROOT,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    generated = parse(result.stdout)
    base = generated['base'].encode('utf-8')
    candidate = generated['admin'].encode('utf-8')
    if hashlib.sha256(base).hexdigest() != CANDIDATE_SHA256:
        raise ValueError('Base candidate changed; review required')
    template = generated['template']
    if hashlib.sha256(canonical(template).encode('ascii')).hexdigest() != ADMIN_TEMPLATE_SHA256:
        raise ValueError('Administrator Rules template changed; review required')
    expected_admin = dict(template['control'])
    expected_access = dict(template['access'])
    needle = "'" + ADMIN_TEMPLATE_UID + "'"
    for rules, field in [(expected_admin, '.write'), (expected_access, '.read')]:
        if rules[field].count(needle) != 1:
            raise ValueError('Unexpected administrator Rules template')
        rules[field] = rules[field].replace(needle, "'" + admin_uid + "'")
    prepared, baseline = parse(candidate), parse(base)
    if prepared['rules'].pop('_ironpathMaintenance') != expected_admin or prepared['rules'].pop('_ironpathMaintenanceAdminAccess') != expected_access:
        raise ValueError('Unexpected administrator Rules')
    baseline['rules'].pop('_ironpathMaintenance')
    if canonical(prepared) != canonical(baseline):
        raise ValueError('Unexpected changes beyond the administrator Rules')
    digest = hashlib.sha256(candidate).hexdigest()
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(output_file, flags, 0o600)
    with os.fdopen(fd, 'wb') as out:
        out.write(candidate)
    return digest


def main():
    if len(sys.argv) != 5 or sys.argv[3] != '--admin-uid':
        print('Usage: python3 prepare-maintenance-rules.py <fresh-rules-export.json> <new-candidate.json> --admin-uid <verified-firebase-uid>', file=sys.stderr)
        return 2
    try:
        result = prepare(sys.argv[1], sys.argv[2], sys.argv[4])
        print(f'Local candidate prepared (SHA-256 {result}); nothing was published.')
        return 0
    except (OSError, ValueError, UnicodeError, KeyError, TypeError, subprocess.SubprocessError) as error:
        detail = str(error) if isinstance(error, ValueError) else 'Could not read, compare or prepare the Rules'
        print(f'Stopped: {detail}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

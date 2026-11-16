#!/usr/bin/env python3
"""Read-only, offline name-collision *draft*; never connects to Firebase.

The JSON input must be a full database export containing ``players``. A file
alone cannot prove completeness, so even a clean result is NOT permission to
publish rules or assign names. The comparison is a proposal, not an agreed
registration policy: ECMAScript-style outer whitespace, NFC, Unicode default
casefold and NFC again, using the Unicode tables of this Python interpreter.
It does not conflate visually similar characters or apply compatibility folding.

Stdout contains counts only. A deliberately requested private report contains
names and account IDs: it is exclusively created, mode 0600, outside this Git
checkout. Handle that report and the original backup as sensitive data; never
commit, upload, paste or log them. No player data is modified by this tool.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import stat
import sys
import unicodedata

MAX_INPUT_BYTES = 128 * 1024 * 1024
# ECMAScript TrimString whitespace and line terminators, not Python's larger
# str.strip() set. Name equivalence is still only a candidate policy.
JS_TRIM = ('\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680'
           '\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a'
           '\u2028\u2029\u202f\u205f\u3000\ufeff')
REPOSITORY = Path(__file__).resolve().parents[2]


def no_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key')
        result[key] = value
    return result


def valid_uid(uid):
    try:
        return (isinstance(uid, str) and 0 < len(uid.encode('utf-16-le')) // 2 <= 128
                and not any(c in '.#$[]/' or ord(c) < 32 or ord(c) == 127 for c in uid))
    except UnicodeError:
        return False


def audit(data):
    if not isinstance(data, dict) or not isinstance(data.get('players'), dict):
        raise ValueError('missing players object')
    players = data['players']
    groups, issues = {}, []
    valid_names = 0
    for uid, profile in players.items():
        reasons = [] if valid_uid(uid) else ['invalid account key']
        name = profile.get('name') if isinstance(profile, dict) else None
        if not isinstance(name, str):
            reasons.append('missing or non-string name')
        else:
            try:
                # Reject unpaired surrogates rather than producing a lossy key.
                name.encode('utf-8', errors='strict')
                trimmed = name.strip(JS_TRIM)
                units = len(trimmed.encode('utf-16-le')) // 2
                canonical = unicodedata.normalize('NFC', unicodedata.normalize('NFC', trimmed).casefold())
                if not canonical or not 2 <= units <= 24:
                    reasons.append('empty or outside the current client length bounds')
                # Include even too-short/too-long named profiles and invalid
                # account keys: legacy conflicts must never disappear silently.
                if canonical:
                    groups.setdefault(canonical, []).append({'uid': uid, 'name': name})
            except UnicodeError:
                reasons.append('invalid Unicode')
        if reasons:
            issues.append({'uid': uid, 'reason': '; '.join(reasons)})
        else:
            valid_names += 1
    conflicts = [
        {'canonical': canonical, 'members': sorted(members, key=lambda item: item['uid'])}
        for canonical, members in sorted(groups.items()) if len(members) > 1
    ]
    summary = {
        'policy': 'DRAFT_NFC_DEFAULT_CASEFOLD',
        'unicodeVersion': unicodedata.unidata_version,
        'profiles': len(players),
        'namedProfiles': valid_names,
        'invalidProfiles': len(issues),
        'conflictGroups': len(conflicts),
        'conflictingProfiles': sum(len(group['members']) for group in conflicts),
        'completeExportVerified': False,
    }
    return summary, {'summary': summary, 'conflicts': conflicts, 'invalidProfiles': issues}


def reject_constant(_value):
    raise ValueError('non-finite JSON number')


def read_export(path):
    # Open nonblocking and fstat the opened object: a FIFO/device is rejected
    # rather than hanging, and replacing a path after stat cannot change what
    # is actually read. Never read more than the documented bound plus one.
    fd = os.open(Path(path), os.O_RDONLY | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_INPUT_BYTES:
            raise ValueError('input is not a bounded regular file')
        with os.fdopen(fd, 'rb', closefd=False) as source:
            content = source.read(MAX_INPUT_BYTES + 1)
        if len(content) > MAX_INPUT_BYTES:
            raise ValueError('input too large')
    finally:
        os.close(fd)
    return json.loads(content.decode('utf-8'), object_pairs_hook=no_duplicate_keys, parse_constant=reject_constant)


def save_private_report(path, report):
    target = Path(path).expanduser()
    parent = target.parent.resolve(strict=True)
    if parent == REPOSITORY or REPOSITORY in parent.parents:
        raise ValueError('private report must be outside the checkout')
    if target.name in ('', '.', '..'):
        raise ValueError('invalid output filename')
    # Open a resolved directory and an exclusive, non-symlink final file. No
    # existing file is overwritten; permissions can only be made more restrictive
    # by the process umask. Callers must also secure the parent and backup.
    directory = os.open(parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
        fd = os.open(target.name, flags, 0o600, dir_fd=directory)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as output:
                json.dump(report, output, ensure_ascii=True, indent=2, sort_keys=True)
                output.write('\n')
        except BaseException:
            # Remove only the exclusive file this invocation created.
            try:
                os.unlink(target.name, dir_fd=directory)
            except OSError:
                pass
            raise
    finally:
        os.close(directory)


def main(argv=None):
    parser = argparse.ArgumentParser(description='Offline draft collision audit; stdout contains counts only.')
    parser.add_argument('export', help='path to an already-authorized complete database JSON export')
    parser.add_argument('--private-report', help='create a sensitive conflict report outside the checkout, without overwriting')
    args = parser.parse_args(argv)
    try:
        summary, report = audit(read_export(args.export))
        if args.private_report:
            save_private_report(args.private_report, report)
        print(json.dumps(summary, ensure_ascii=True, sort_keys=True))
        return 0
    except (OSError, ValueError, UnicodeError, RecursionError):
        # Do not print paths, names, identifiers, input fragments or traceback.
        print('Name audit failed: check the JSON export and private-report destination.', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())

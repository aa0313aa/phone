#!/usr/bin/env python3
"""
Restore files from .bak by decoding as CP949 and writing UTF-8 targets.
Creates a pre-restore backup of existing target files named <target>.pre_restore.bak
and commits changes with git if any files were restored.
"""
import sys
from pathlib import Path
import codecs
import subprocess

ROOT = Path(__file__).resolve().parent.parent

def find_bak_files():
    return [p for p in ROOT.rglob('*') if p.is_file() and p.name.endswith('.bak') and '.git' not in p.parts]

def decode_and_restore(bak_path: Path):
    target = bak_path.with_suffix('')
    try:
        data = bak_path.read_bytes()
        decoded = data.decode('cp949')
    except Exception as e:
        return (bak_path, target, False, f"decode-failed: {e}")
    # create pre-restore backup
    if target.exists():
        pre = target.with_suffix(target.suffix + '.pre_restore.bak')
        if not pre.exists():
            target.replace(pre) if False else pre.write_bytes(target.read_bytes())
    # write target as utf-8
    target.write_text(decoded, encoding='utf-8')
    return (bak_path, target, True, 'restored')

def main():
    bak_files = find_bak_files()
    if not bak_files:
        print('No .bak files found')
        return
    restored = []
    skipped = []
    for b in bak_files:
        b = Path(b)
        res = decode_and_restore(b)
        if res[2]:
            print(f"Restored: {res[1]} (from {res[0]})")
            restored.append(str(res[1]))
        else:
            print(f"Skipped: {res[0]} -> {res[3]}")
            skipped.append(str(res[0]))
    print('--- Summary ---')
    print(f'Restored: {len(restored)} files')
    print(f'Skipped: {len(skipped)} files')
    if restored:
        try:
            subprocess.run(['git','add','--'] + restored, check=False)
            subprocess.run(['git','commit','-m','fix: restore from .bak (CP949->UTF-8) for mojibake files'], check=False)
            print('Staged and attempted commit')
        except Exception as e:
            print('Git commit failed:', e)

if __name__ == '__main__':
    main()

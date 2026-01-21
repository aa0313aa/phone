#!/usr/bin/env python3
from pathlib import Path
import sys
root = Path(__file__).resolve().parents[1]
exts = {'.html','.htm','.xml','.json','.js','.css','.md'}
report = []
changed = []
for p in root.rglob('*'):
    if not p.is_file():
        continue
    if p.suffix.lower() not in exts:
        continue
    # skip .bak and backup files
    if p.name.endswith('.bak') or p.name.endswith('.pre_restore.bak') or p.name.endswith('.pre_restore_final.bak'):
        continue
    try:
        raw = p.read_bytes()
    except Exception as e:
        report.append((str(p), 'read_error', str(e)))
        continue
    # decode current as utf-8 (replace) and as cp949
    try:
        text_utf8 = raw.decode('utf-8', errors='replace')
    except Exception:
        text_utf8 = ''
    try:
        text_cp949 = raw.decode('cp949', errors='replace')
    except Exception:
        text_cp949 = ''
    def hangul_count(s):
        return sum(1 for ch in s if '\uac00' <= ch <= '\ud7af')
    hu = hangul_count(text_utf8)
    hc = hangul_count(text_cp949)
    # heuristic: prefer cp949 if it yields significantly more Hangul
    prefer_cp949 = False
    if hc > hu and (hc - hu) >= 3:
        prefer_cp949 = True
    # Also if utf8 contains many replacement chars
    if text_utf8.count('\ufffd') > 0 and hc >= hu:
        prefer_cp949 = True
    if prefer_cp949:
        # backup original file bytes if not already backed up
        bak = p.with_name(p.name + '.pre_restore_final.bak')
        if not bak.exists():
            bak.write_bytes(raw)
        # write cp949-decoded text as utf-8
        try:
            p.write_text(text_cp949, encoding='utf-8')
            changed.append(str(p))
            report.append((str(p), 'rewritten_cp949', hu, hc))
        except Exception as e:
            report.append((str(p), 'write_error', str(e)))
    else:
        report.append((str(p), 'no_change', hu, hc))
# write report
out = root / 'tools' / 'repair_report.txt'
with out.open('w', encoding='utf-8') as f:
    f.write('repair run\n')
    f.write('changed count: %d\n' % len(changed))
    for r in report:
        f.write(str(r) + '\n')
print('WROTE', out)
print('changed:', len(changed))
for c in changed[:200]:
    print(c)

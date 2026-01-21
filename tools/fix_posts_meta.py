import json
from pathlib import Path
import shutil

repo_root = Path(__file__).resolve().parents[1]
p = repo_root / 'blog' / 'posts-meta.json'
backup = repo_root / 'blog' / 'posts-meta.json.pre_restore.bak'
if not backup.exists():
    shutil.copy2(p, backup)
with open(p, 'r', encoding='utf-8') as f:
    data = json.load(f)
changed = False
for item in data:
    title = item.get('title', '')
    region = (item.get('region') or '').strip()
    keyword = (item.get('keyword') or '').strip()
    # Count Hangul characters
    hangul_count = sum(1 for ch in title if '\uac00' <= ch <= '\ud7af')
    # If few Hangul characters or title looks corrupted, rebuild from region+keyword
    if hangul_count < max(4, len(title) // 3):
        new_title = (region + ' ' + keyword).strip() or title
        if new_title != title:
            item['title'] = new_title
            changed = True
    # Fix tags containing replacement
    tags = item.get('tags', []) or []
    new_tags = [t for t in tags if ('\ufffd' not in t and '�' not in t)]
    if not new_tags and keyword:
        new_tags = [keyword]
    if new_tags != tags:
        item['tags'] = new_tags
        changed = True
if changed:
    out = p
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print('Updated', out)
else:
    print('No changes')

from pathlib import Path
import subprocess
import sys

try:
    from PIL import Image
except ImportError:
    print('Pillow not found. Installing...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--user', 'Pillow'])
    try:
        from PIL import Image
    except ImportError:
        print('Failed to install Pillow. Aborting.')
        sys.exit(1)

BASE = Path(__file__).resolve().parents[1] / 'assets' / 'img' / 'blog'
FILES = ['1.png', '2.png', '3.png', 'phonetech-og.png']

converted = []
for name in FILES:
    src = BASE / name
    if not src.exists():
        print(f"Skipping missing: {src}")
        continue
    dst = src.with_suffix('.webp')
    try:
        im = Image.open(src)
        im.save(dst, 'WEBP', quality=80, method=6)
        converted.append(dst)
        print(f"Saved: {dst}")
    except Exception as e:
        print(f"Failed to convert {src}: {e}")

if not converted:
    print('No files converted.')
else:
    print('Converted files:')
    for p in converted:
        print(' -', p)

print('Done')

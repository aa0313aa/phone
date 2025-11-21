from pathlib import Path
import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    print('Pillow not found. Installing...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--user', 'Pillow'])
    from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG_DIRS = [ROOT / 'assets' / 'img', ROOT / 'assets' / 'img' / 'blog']

converted = []
for d in IMG_DIRS:
    if not d.exists():
        print('Missing directory, skipping:', d)
        continue
    for p in d.glob('*.png'):
        dst = p.with_suffix('.webp')
        try:
            with Image.open(p) as im:
                if im.mode not in ('RGB', 'RGBA'):
                    im = im.convert('RGB')
                im.save(dst, 'WEBP', quality=80, method=6)
            converted.append(dst)
            print('Saved:', dst)
        except Exception as e:
            print('Failed to convert', p, e)

if not converted:
    print('No files converted.')
else:
    print('Converted files:')
    for p in converted:
        print('-', p)

print('Done')

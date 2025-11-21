from pathlib import Path
import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    print('Pillow not found. Installing...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--user', 'Pillow'])
    from PIL import Image

BASE = Path(__file__).resolve().parents[1] / 'assets' / 'img' / 'blog'
FILES = ['1.png','2.png','3.png']
SIZES = [480, 768, 1200]
QUALITY = 80

for name in FILES:
    src = BASE / name
    if not src.exists():
        print(f'Skipping missing: {src}')
        continue
    for w in SIZES:
        dst_name = f"{src.stem}-{w}.webp"
        dst = BASE / dst_name
        try:
            with Image.open(src) as im:
                if im.mode not in ('RGB','RGBA'):
                    im = im.convert('RGB')
                # compute height preserving aspect
                iw, ih = im.size
                h = int( (w / iw) * ih )
                im_resized = im.resize((w, h), Image.LANCZOS)
                im_resized.save(dst, 'WEBP', quality=QUALITY, method=6)
                print('Saved:', dst)
        except Exception as e:
            print('Failed to process', src, e)

print('Done')

from pathlib import Path
import sys

try:
    from PIL import Image
except ImportError:
    print('Pillow not installed. Installing...')
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--user', 'Pillow'])
    from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / 'assets' / 'img' / 'og-banner.png']

for f in FILES:
    if not f.exists():
        print('Missing:', f)
        continue
    dst = f.with_suffix('.webp')
    try:
        im = Image.open(f)
        im.save(dst, 'WEBP', quality=80, method=6)
        print('Saved', dst)
    except Exception as e:
        print('Failed', f, e)

from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
blog_img = ROOT / 'assets' / 'img' / 'blog'
src = blog_img / 'phonetech-og.png'
dest_png = blog_img / 'phonetech-cover.png'
dest_webp = blog_img / 'phonetech-cover.webp'

print('Source:', src)
if not src.exists():
    print('Source OG not found, aborting')
    raise SystemExit(1)

with Image.open(src) as im:
    # ensure RGB
    im = im.convert('RGB')
    # resize to 1200x630 (cover)
    im2 = im.resize((1200, 630), Image.LANCZOS)
    im2.save(dest_png, format='PNG', optimize=True)
    im2.save(dest_webp, format='WEBP', quality=80)

print('Wrote:', dest_png, dest_webp)

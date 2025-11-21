from PIL import Image
from pathlib import Path

# Paths
base = Path(__file__).resolve().parents[1]
src = base / 'assets' / 'img' / 'blog' / '1.png'
dst = base / 'assets' / 'img' / 'blog' / 'phonetech-og.png'

print('src:', src)
print('dst:', dst)

if not src.exists():
    raise SystemExit(f'Source image not found: {src}')

# Desired size
W, H = 1200, 630

with Image.open(src) as im:
    # Convert to RGBA or RGB
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    iw, ih = im.size
    # Compute crop box to maintain center crop at desired aspect ratio
    target_ratio = W / H
    src_ratio = iw / ih
    if src_ratio > target_ratio:
        # source wider: crop left and right
        new_w = int(ih * target_ratio)
        left = (iw - new_w) // 2
        box = (left, 0, left + new_w, ih)
    else:
        # source taller: crop top and bottom
        new_h = int(iw / target_ratio)
        top = (ih - new_h) // 2
        box = (0, top, iw, top + new_h)
    im_cropped = im.crop(box)
    im_resized = im_cropped.resize((W, H), Image.LANCZOS)
    # Save optimized
    im_resized.save(dst, format='PNG', optimize=True)
    print('Saved OG image to', dst)

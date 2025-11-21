import sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
POSTS = list(ROOT.glob('blog-*.html'))
REQUIRED_META = [
    ('title', 'title'),
    ('meta', 'description'),
    ('link', 'canonical'),
    ('meta', 'og:title'),
    ('meta', 'og:description'),
    ('meta', 'og:image'),
    ('meta', 'twitter:card'),
    ('script[type="application/ld+json"]', 'json-ld')
]

missing_report = {}

for p in POSTS:
    html = p.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    missing = []
    # title
    if not soup.title or not soup.title.string.strip():
        missing.append('title')
    # meta description
    if not soup.find('meta', attrs={'name': 'description'}):
        missing.append('meta:description')
    # canonical
    if not soup.find('link', rel='canonical'):
        missing.append('link:canonical')
    # og:title / og:description / og:image
    if not soup.find('meta', attrs={'property': 'og:title'}):
        missing.append('meta:og:title')
    if not soup.find('meta', attrs={'property': 'og:description'}):
        missing.append('meta:og:description')
    if not soup.find('meta', attrs={'property': 'og:image'}):
        missing.append('meta:og:image')
    # twitter card
    if not soup.find('meta', attrs={'name': 'twitter:card'}):
        missing.append('meta:twitter:card')
    # json-ld
    if not soup.find('script', attrs={'type': 'application/ld+json'}):
        missing.append('json-ld')

    if missing:
        missing_report[p.name] = missing

if not missing_report:
    print('All blog posts contain required SEO tags.')
    sys.exit(0)

print('SEO validation issues found:')
for name, items in missing_report.items():
    print(f'- {name}: missing {", ".join(items)}')

sys.exit(2)

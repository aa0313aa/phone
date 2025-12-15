from pathlib import Path
import re
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
POST_GLOB = ["blog-*.html", "phonetech-*.html", "phonetech-*.html"]

DATE_RE_ISO = re.compile(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"')
DATE_RE_KO = re.compile(r'>(\d{4})??s*(\d{1,2})??s*(\d{1,2})??')
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I|re.S)
META_DESC_RE = re.compile(r'<meta\s+name="description"\s+content="(.*?)"', re.I|re.S)
IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+\.(?:png|jpg|jpeg|webp))["\']', re.I)
META_KEYWORDS_RE = re.compile(r'<meta\s+name="keywords"\s+content="(.*?)"', re.I|re.S)


def parse_post(path: Path):
    text = path.read_text(encoding='utf-8')
    # date
    m = DATE_RE_ISO.search(text)
    if m:
        date = datetime.fromisoformat(m.group(1)).date()
    else:
        m2 = DATE_RE_KO.search(text)
        if m2:
            y,mo,d = map(int, m2.groups())
            date = datetime(y, mo, d).date()
        else:
            date = None
    # title
    m = TITLE_RE.search(text)
    title = m.group(1).strip() if m else path.stem
    # description
    m = META_DESC_RE.search(text)
    desc = (m.group(1).strip() if m else '')
    # thumbnail: first image in the file
    m = IMG_RE.search(text)
    thumb = m.group(1) if m else 'assets/img/og-banner.png'
    # keywords/tags
    from pathlib import Path
    import re
    from datetime import datetime

    # Generator that writes /blog/index.html (backup safe)
    ROOT = Path(__file__).resolve().parents[1]

    POST_PATTERNS = ["blog-*.html", "phonetech-*.html"]

    ISO_DATE_RE = re.compile(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"')
    FALLBACK_DATE_RE = re.compile(r'>(\d{4})[^0-9]*(\d{1,2})[^0-9]*(\d{1,2})')
    TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)
    DESC_RE = re.compile(r'<meta\s+name="description"\s+content="(.*?)"', re.I | re.S)
    IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+\.(?:png|jpg|jpeg|webp))["\']', re.I)


    def parse_post(path: Path):
      text = path.read_text(encoding='utf-8', errors='ignore')
      m = ISO_DATE_RE.search(text)
      if m:
        try:
          date = datetime.fromisoformat(m.group(1)).date()
        except Exception:
          date = None
      else:
        m2 = FALLBACK_DATE_RE.search(text)
        if m2:
          try:
            y, mo, d = map(int, m2.groups())
            date = datetime(y, mo, d).date()
          except Exception:
            date = None
        else:
          date = None

      m = TITLE_RE.search(text)
      title = m.group(1).strip() if m else path.stem

      m = DESC_RE.search(text)
      desc = m.group(1).strip() if m else ''

      m = IMG_RE.search(text)
      thumb = m.group(1) if m else 'assets/img/og-banner.png'

      return {
        'path': path.name,
        'title': title,
        'date': date,
        'desc': desc,
        'thumb': thumb,
      }


    def find_posts(root: Path):
      posts = []
      for pat in POST_PATTERNS:
        for p in sorted(root.glob(pat)):
          if p.name == 'blog' or p.name == 'blog.html':
            continue
          posts.append(parse_post(p))
      return posts


    def render_card(it):
      date_str = it['date'].strftime('%Y.%m.%d') if it['date'] else ''
      title = it['title']
      desc = (it['desc'][:160] + '...') if it['desc'] and len(it['desc']) > 160 else it['desc']
      thumb = it['thumb']
      return f'''<article class="card mb-4">\n  <div class="row g-0">\n    <div class="col-md-4">\n      <img src="{thumb}" alt="{title}" class="img-fluid rounded-start" style="height:200px;object-fit:cover;">\n    </div>\n    <div class="col-md-8">\n      <div class="card-body">\n        <h5 class="card-title"><a href="{it['path']}" class="text-decoration-none">{title}</a></h5>\n        <p class="card-text text-muted">{desc}</p>\n        <p class="card-text"><small class="text-muted">{date_str}</small></p>\n      </div>\n    </div>\n  </div>\n</article>\n'''


    def main():
      posts = find_posts(ROOT)
      posts_sorted = sorted(posts, key=lambda x: (x['date'] is None, x['date'] or datetime.min.date()), reverse=True)
      cards = ''.join(render_card(p) for p in posts_sorted)

      blog_dir = ROOT / 'blog'
      blog_dir.mkdir(exist_ok=True)
      index_path = blog_dir / 'index.html'

      # Backup existing index.html
      if index_path.exists():
        index_path.with_suffix('.html.bak').write_text(index_path.read_text(encoding='utf-8', errors='ignore'), encoding='utf-8')

      html = f"""<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />\n  <title>블로그</title>\n  <link href=\"/assets/css/styles.css\" rel=\"stylesheet\" />\n</head>\n<body>\n  <div class=\"container py-4\">\n    <h1 class=\"h3\">블로그</h1>\n    <div class=\"mt-3\">\n{cards}\n    </div>\n  </div>\n</body>\n</html>"""

      index_path.write_text(html, encoding='utf-8')
      print('Updated blog/index.html with', len(posts_sorted), 'posts')


    if __name__ == '__main__':
      main()

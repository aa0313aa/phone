from pathlib import Path
import re
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
POST_GLOB = ["blog-*.html", "phonetech-*.html", "phonetech-*.html"]

DATE_RE_ISO = re.compile(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"')
DATE_RE_KO = re.compile(r'>(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일<')
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
    m = META_KEYWORDS_RE.search(text)
    keywords = []
    if m:
        keywords = [k.strip() for k in m.group(1).split(',') if k.strip()]
    return {
        'path': path.name,
        'title': title,
        'date': date,
        'desc': desc,
        'thumb': thumb,
        'keywords': keywords
    }


def find_posts(root: Path):
    posts = []
    for pat in ["blog-*.html", "phonetech-*.html", "phonetech-*.html"]:
        for p in root.glob(pat):
            if p.name == 'blog.html':
                continue
            posts.append(parse_post(p))
    # also include any files that start with phonetech- or blog- but not blog.html
    for p in root.iterdir():
        if p.suffix == '.html' and (p.name.startswith('blog-') or p.name.startswith('phonetech-')):
            if p.name != 'blog.html':
                if not any(d['path']==p.name for d in posts):
                    posts.append(parse_post(p))
    return posts


def render_card(it):
    # format date
    date_str = it['date'].strftime('%Y년 %m월 %d일') if it['date'] else ''
    title = it['title']
    desc = (it['desc'][:160] + '...') if it['desc'] and len(it['desc'])>160 else it['desc']
    thumb = it['thumb']
    # normalize thumb path: if relative without leading /, keep as-is
    card = f'''          <article class="card mb-4" data-tags="{','.join([k for k in it.get('keywords',[])][:3])}">
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <picture>
                    <source type="image/webp" srcset="{thumb.rsplit('.',1)[0]}.webp">
                    <img src="{thumb}" alt="{title}" class="img-fluid rounded" style="height:200px; object-fit:cover;">
                  </picture>
                </div>
                <div class="col-md-8">
                  <h3 class="card-title h5 fw-bold">
                    <a href="{it['path']}" class="text-decoration-none">{title}</a>
                  </h3>
                  <p class="card-text text-muted">{desc}</p>
                  <div class="d-flex align-items-center text-muted small">
                    <i class="bi bi-calendar3 me-2"></i>
                    <span>{date_str}</span>
                    <span class="mx-2">•</span>
                    <i class="bi bi-eye me-2"></i>
                    <span>읽기</span>
                  </div>
                </div>
              </div>
            </div>
          </article>\n'''
    return card


def main():
    posts = find_posts(ROOT)
    # filter posts with a path and sort by date desc; unknown date goes last
    posts_sorted = sorted(posts, key=lambda x: (x['date'] is None, x['date'] or datetime.min.date()), reverse=True)
    cards = ''.join(render_card(p) for p in posts_sorted)

    # replace between markers in blog.html
    blog_path = ROOT / 'blog.html'
    text = blog_path.read_text(encoding='utf-8')
    start_marker = '<!-- POSTS_START - 자동 생성된 게시물 목록 시작 (do not edit) -->'
    end_marker = '<!-- POSTS_END - 자동 생성된 게시물 목록 끝 (do not edit) -->'
    if start_marker in text and end_marker in text:
        before, rest = text.split(start_marker, 1)
        _, after = rest.split(end_marker, 1)
        new_text = before + start_marker + "\n" + cards + "          " + end_marker + after
        blog_path.write_text(new_text, encoding='utf-8')
        print('Updated blog.html with', len(posts_sorted), 'posts')
    else:
        print('Markers not found in blog.html — aborting')

if __name__ == '__main__':
    main()

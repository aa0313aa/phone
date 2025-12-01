// /auto-generator/template.js
// 개별 블로그 글 고급 레이아웃 템플릿

import slugify from "slugify";

export function generateHTML({
  title,
  date,
  region,
  keyword,
  content,        // 이미 summary-box 포함된 HTML
  heroImg,
  midImg,
  bottomImg,      // /assets/gallery/*.webp 중 1장
  canonicalPath,
  thumbUrl,
  tags = [],
  relatedPosts = [],
}) {
  const tagChips = tags
    .map((t) => {
      const slug = slugify(t, { lower: true, strict: true });
      if (!slug) {
        return `<span class="tag-chip">#${t}</span>`;
      }
      return `<a href="/tag/${slug}.html" class="tag-chip">#${t}</a>`;
    })
    .join("");

  const relatedHtml = relatedPosts
    .map((p) => {
      return `
      <li>
        <a href="${p.url}">
          <span class="title">${p.title}</span>
          <span class="date">${p.date}</span>
        </a>
      </li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${region} ${keyword} 폰테크 상담 - ${title} | 전국모바일</title>
<meta name="description" content="${region} 지역에서 ${keyword} 진행을 고민하신다면, 실제 상담 기준으로 폰테크 구조·진행 순서·주의사항을 정리한 안내 글입니다.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://폰테크.shop${canonicalPath}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${region} ${keyword} 폰테크 상담 - ${title}">
<meta property="og:description" content="${region}에서 ${keyword}를 어떻게 진행해야 할지, 폰테크 구조와 실제 상담 기준, 주의사항까지 한 번에 정리했습니다.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://폰테크.shop${canonicalPath}">
<meta property="og:site_name" content="전국모바일">
<meta property="og:image" content="${thumbUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${region} ${keyword} 폰테크 상담 - ${title}">
<meta name="twitter:description" content="${region}에서 ${keyword} 진행 시 알아두면 좋은 폰테크 상담 안내입니다.">
<meta name="twitter:image" content="${thumbUrl}">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  rel="stylesheet"
  integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
  crossorigin="anonymous"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
/>
<style>
:root{
  --bg:#f4f5f9;
  --card:#ffffff;
  --accent:#2563eb;
  --accent-soft:#e0edff;
  --text:#111827;
  --text-sub:#6b7280;
  --radius:18px;
  --shadow:0 10px 30px rgba(15,23,42,.10);
}
*{box-sizing:border-box;}
body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;
  background:#f3f4f6;
  color:var(--text);
}
a{color:var(--accent);}
a:hover{text-decoration:underline;}
.page-wrap{
  max-width:1120px;
  margin:0 auto;
  padding:20px 12px 40px;
}
.breadcrumb{
  font-size:.8rem;
  color:var(--text-sub);
  margin-bottom:10px;
}
.breadcrumb a{text-decoration:none;color:var(--text-sub);}
.breadcrumb a:hover{text-decoration:underline;}
.layout{
  display:grid;
  grid-template-columns:minmax(0,3fr) minmax(260px,1.1fr);
  gap:24px;
}
.article-card{
  background:var(--card);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  overflow:hidden;
}
.hero-img{
  width:100%;
  max-height:360px;
  object-fit:cover;
  display:block;
}
.article-inner{
  padding:18px 20px 22px;
}
.post-meta{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
  font-size:.8rem;
  color:var(--text-sub);
  margin-bottom:8px;
}
.post-meta .badge{
  padding:3px 8px;
  border-radius:999px;
  background:var(--accent-soft);
  color:#1e3a8a;
}
.post-title{
  font-size:1.5rem;
  margin:4px 0 10px;
}
.post-tags{
  margin-bottom:10px;
}
.tag-chip{
  display:inline-block;
  margin:0 6px 6px 0;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  font-size:.78rem;
  text-decoration:none;
  color:#4b5563;
  background:#f9fafb;
}
.tag-chip:hover{
  background:#eff6ff;
  border-color:#bfdbfe;
}
.summary-box{
  border-radius:12px;
  border:1px dashed #c7d2fe;
  background:#eef2ff;
  padding:12px 14px;
  font-size:.9rem;
  margin:8px 0 18px;
}
.summary-box strong{
  display:block;
  margin-bottom:4px;
  color:#1e3a8a;
}
.post-body{
  font-size:.95rem;
  line-height:1.7;
  color:#111827;
}
.post-body h2{
  font-size:1.15rem;
  margin:22px 0 8px;
}
.post-body h3{
  font-size:1rem;
  margin:16px 0 6px;
}
.post-body p{
  margin:8px 0;
}
.post-body ul, .post-body ol{
  padding-left:20px;
  margin:8px 0;
}
.post-body img{
  max-width:100%;
  border-radius:12px;
  margin:14px 0;
  display:block;
}
.mid-img{
  margin:20px 0 10px;
  text-align:center;
}
.mid-img img{
  max-width:100%;
  border-radius:14px;
  box-shadow:0 10px 26px rgba(15,23,42,.22);
}
/* 명함/영상 공통 블록 */
.biz-card{
  margin:20px 0;
  text-align:center;
}
.biz-card img{
  max-width:100%;
  max-height:260px;
  object-fit:contain;
}
.biz-video{
  margin-top:18px;
  border-radius:12px;
  overflow:hidden;
  background:#000;
}
.biz-video video{
  width:100%;
  height:auto;
  display:block;
}

/* 사이드바 */
.sidebar{
  display:flex;
  flex-direction:column;
  gap:18px;
  position:sticky;
  top:90px;
}
.side-card{
  background:var(--card);
  border-radius:16px;
  padding:14px 14px 16px;
  box-shadow:0 8px 22px rgba(15,23,42,.10);
}
.side-card h3{
  margin:0 0 10px;
  font-size:.95rem;
}
.related-list{
  list-style:none;
  padding:0;
  margin:0;
}
.related-list li{
  margin-bottom:10px;
}
.related-list a{
  text-decoration:none;
  color:var(--text);
  display:flex;
  flex-direction:column;
  gap:2px;
}
.related-list a .title{
  font-size:.86rem;
}
.related-list a .date{
  font-size:.76rem;
  color:var(--text-sub);
}
.side-tags{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.side-tags a{
  font-size:.78rem;
  padding:4px 9px;
  border-radius:999px;
  background:#f3f4f6;
  text-decoration:none;
  color:#4b5563;
}
.side-tags a:hover{
  background:#e5e7eb;
}
.side-cta{
  font-size:.85rem;
  color:var(--text-sub);
}
.side-cta strong{
  display:block;
  margin-bottom:4px;
}

/* 하단 갤러리 */
.bottom-gallery{
  margin-top:24px;
  padding-top:16px;
  border-top:1px solid #e5e7eb;
}
.bottom-gallery h3{
  font-size:.95rem;
  margin:0 0 10px;
  color:var(--text-sub);
}
.bottom-gallery img{
  max-width:100%;
  border-radius:14px;
  display:block;
  box-shadow:0 10px 26px rgba(15,23,42,.18);
}

/* 반응형 */
@media(max-width:900px){
  .layout{
    grid-template-columns:1fr;
  }
  .sidebar{
    position:static;
  }
}
@media(max-width:640px){
  .article-inner{padding:14px 14px 18px;}
  .post-title{font-size:1.25rem;}
}
</style>
</head>
<body>
  <nav class="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
    <div class="container" style="max-width:1120px;">
      <a class="navbar-brand fw-bold" href="/"><img src="/assets/img/favicon.svg" alt="전국모바일" width="28" height="28" class="me-2">전국모바일</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav" aria-controls="nav" aria-expanded="false" aria-label="메뉴 열기">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" href="/">홈</a></li>
          <li class="nav-item"><a class="nav-link" href="/services.html">폰테크</a></li>
          <li class="nav-item"><a class="nav-link" href="/information.html">이용안내</a></li>
          <li class="nav-item"><a class="nav-link" href="/about.html">회사소개</a></li>
          <li class="nav-item"><a class="nav-link" href="/contact.html">문의/예약</a></li>
          <li class="nav-item"><a class="nav-link" href="/phonetech-guide.html">폰테크가이드</a></li>
          <li class="nav-item"><a class="nav-link" href="/phonetech-tips.html">안전이용팁</a></li>
          <li class="nav-item"><a class="nav-link" href="/blog/">블로그</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="page-wrap">
    <nav class="breadcrumb">
      <a href="/">전국모바일</a> · <a href="/blog/">블로그</a> · <span>${region} ${keyword}</span>
    </nav>

    <div class="layout">
      <!-- 메인 글 영역 -->
      <article class="article-card">
        ${heroImg ? `<img src="${heroImg}" alt="${keyword} 상담 이미지" class="hero-img">` : ""}

        <div class="article-inner">
          <div class="post-meta">
            <span class="badge">${region}</span>
            <span>${date}</span>
          </div>
          <h1 class="post-title">${title}</h1>

          <div class="post-tags">
            ${tagChips}
          </div>

          <div class="post-body">
            <div class="cta-inline" style="margin:14px 0 18px; padding:10px 12px; border-radius:10px; background:#eff6ff; border:1px solid #bfdbfe; font-size:.87rem;">
              <p style="margin:0 0 6px; font-weight:600; color:#1d4ed8;">빠른 상담이 필요하시면 바로 연락 주세요.</p>
              <p style="margin:0; color:#4b5563;">📞 전화: <a href="tel:010-8290-9536" style="text-decoration:none; color:#1d4ed8;">010-8290-9536</a><br>💬 카톡 상담: <a href="http://pf.kakao.com/_gIKxnn/chat" target="_blank" rel="noopener" style="text-decoration:none; color:#1d4ed8;">바로가기</a></p>
            </div>
            ${content}

            <div class="biz-card">
              <img src="/assets/img/blog/명함.png" alt="전국모바일 명함 이미지">
            </div>

            ${midImg ? `
            <div class="mid-img">
              <img src="${midImg}" alt="${keyword} 폰테크 상담">
            </div>` : ""}

            <div class="bottom-cta" style="margin-top:22px; padding:14px 14px 12px; border-radius:12px; background:#f9fafb; border:1px solid #e5e7eb; font-size:.9rem;">
              <p style="margin:0 0 8px; font-weight:600;">다음 단계가 고민되시면 이렇게 진행해 보세요.</p>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                <a href="/information.html" style="flex:1 1 140px; text-align:center; padding:8px 10px; border-radius:999px; background:#2563eb; color:#fff; text-decoration:none; font-size:.86rem;">이용 안내 보기</a>
                <a href="/contact.html" style="flex:1 1 140px; text-align:center; padding:8px 10px; border-radius:999px; background:#10b981; color:#fff; text-decoration:none; font-size:.86rem;">상담 예약하기</a>
                <a href="http://pf.kakao.com/_gIKxnn/chat" target="_blank" rel="noopener" style="flex:1 1 140px; text-align:center; padding:8px 10px; border-radius:999px; background:#f59e0b; color:#111827; text-decoration:none; font-size:.86rem;">카톡 상담 열기</a>
              </div>
            </div>

            <div class="biz-video">
              <video controls preload="metadata">
                <source src="/assets/img/blog/grok-video-1d0862df-4106-4d06-ba5a-aabf05d29181.mp4" type="video/mp4">
                브라우저가 영상을 지원하지 않습니다.
              </video>
            </div>
          </div>
        </div>
      </article>

      <!-- 사이드바 -->
      <aside class="sidebar">
        <section class="side-card">
          <h3>관련 글</h3>
          <ul class="related-list">
            ${relatedHtml || "<li><span class='text-muted' style='font-size:.8rem;'>관련 글이 아직 많지 않습니다.</span></li>"}
          </ul>
        </section>

        <section class="side-card">
          <h3>태그</h3>
          <div class="side-tags">
            ${tagChips || "<span style='font-size:.8rem;color:#9ca3af;'>태그 없음</span>"}
          </div>
        </section>

        <section class="side-card">
          <h3>상담 안내</h3>
          <div class="side-cta">
            <strong>폰테크 / 신규가입,기기변경/ 비대면 개통</strong>
            <p>조건 확인은 무료입니다. 부담 없이 연락 주세요.</p>
            <p>📞 010-8290-9536<br>💬 카톡: k090912k</p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</body>
</html>`;
}

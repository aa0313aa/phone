// /auto-generator/template.js
// 개별 블로그 글 고급 레이아웃 템플릿

import slugify from "slugify";

const SITE_URL = "https://폰테크.shop";

function getTagSlug(tag, fallbackPrefix = "tag") {
  const base = (tag ?? "").toString().trim();
  if (!base) return "";
  const normalized = slugify(base, { lower: true, strict: true });
  if (normalized) return normalized;
  const hashed = Buffer.from(base, "utf8").toString("hex").slice(0, 8) || "id";
  return `${fallbackPrefix}-${hashed}`;
}

function buildFaqData(region, keyword) {
  const safeRegion = region || "전국";
  const safeKeyword = keyword || "폰테크";
  return [
    {
      question: `${safeRegion}에서 ${safeKeyword} 진행하려면 어떤 조건이 필요한가요?`,
      answer:
        `${safeRegion} 기준으로 본인 명의 회선을 신규가입 또는 기기변경으로 개통할 수 있고 최근 3개월 통신요금이 연체되지 않았다면 상담이 가능합니다. 신분증, 기본 소득 확인 자료를 미리 준비하면 승인과 현금 정산이 훨씬 빨라집니다.`,
    },
    {
      question: `${safeKeyword} 신청을 고민할 때 가장 주의해야 할 위험 요소는 무엇인가요?`,
      answer:
        `통신비 납부가 지연되면 연체 기록이 남고 위약금이 커질 수 있습니다. ${safeRegion} 지역에서도 ${safeKeyword} 후 통신사 약정과 회선 유지 의무가 남으니, 월 통신요금을 감당할 수 있는지 반드시 계산한 뒤 진행해야 합니다.`,
    },
    {
      question: `미납요금이 있어도 ${safeRegion} ${safeKeyword} 상담이 가능한가요?`,
      answer:
        `미납 금액이 크지 않다면 우선 대납으로 정리 후 조건을 다시 맞춰 드립니다. 다만 장기 연체나 신용정보 등록 상태라면 사전 조정이 필요하므로 정확한 금액과 통신사 정보를 먼저 공유해 주세요.`,
    },
  ];
}

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
  const heroDisplay = heroImg || "/assets/img/og-banner.png";
  const heroAlt = `${region} ${keyword} 폰테크 상담 이미지`;
  const midAlt = `${region} ${keyword} 진행 참고 이미지`;
  const bottomAlt = `${region} ${keyword} 현장 갤러리`;
  const ogImage = thumbUrl?.startsWith("http") ? thumbUrl : `${SITE_URL}${thumbUrl}`;

  const tagChips = tags
    .map((t) => {
      const slug = getTagSlug(t);
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

  const faqEntries = buildFaqData(region, keyword);
  const faqHtml = faqEntries.length
    ? `
      <section class="post-faq">
        <h3>자주 묻는 질문</h3>
        <div class="faq-items">
          ${faqEntries
            .map(
              (f) => `
          <article class="faq-item">
            <h4>${f.question}</h4>
            <p>${f.answer}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>`
    : "";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${region} ${keyword} 폰테크 상담 - ${title}`,
    datePublished: date,
    dateModified: date,
    author: {
      "@type": "Organization",
      name: "전국모바일",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "전국모바일",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/img/favicon.svg`,
      },
    },
    mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
    image: `${SITE_URL}${heroDisplay}`,
    keywords: tags.join(", "),
    articleSection: "폰테크 상담",
    description: `${region} 지역에서 ${keyword} 진행을 고민할 때 알아야 할 폰테크 구조와 리스크 정보를 실제 상담 기준으로 정리했습니다.`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "전국모바일",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "블로그",
        item: `${SITE_URL}/blog/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${region} ${keyword}`,
        item: `${SITE_URL}${canonicalPath}`,
      },
    ],
  };

  const articleJson = JSON.stringify(articleSchema).replace(/</g, "\\u003c");
  const breadcrumbJson = JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c");
  const faqJson = faqEntries.length
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntries.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }).replace(/</g, "\\u003c")
    : "";

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
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${region} ${keyword} 폰테크 상담 - ${title}">
<meta name="twitter:description" content="${region}에서 ${keyword} 진행 시 알아두면 좋은 폰테크 상담 안내입니다.">
<meta name="twitter:image" content="${ogImage}">
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
.section-img{
  margin:20px 0 12px;
  text-align:center;
}
.section-img img{
  max-width:100%;
  border-radius:14px;
  box-shadow:0 10px 26px rgba(15,23,42,.18);
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
}
.side-card{
  background:var(--card);
  border-radius:16px;
  padding:16px 18px;
  box-shadow:0 8px 22px rgba(15,23,42,.10);
  border:1px solid rgba(15,23,42,.05);
}
.side-card--cta{
  background:linear-gradient(145deg,#1d4ed8,#2563eb 55%,#38bdf8);
  color:#f8fafc;
  border:none;
  box-shadow:0 18px 35px rgba(37,99,235,.35);
  position:sticky;
  top:110px;
  z-index:15;
  overflow:hidden;
}
.side-card--cta::after{
  content:"";
  position:absolute;
  inset:14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.25);
  pointer-events:none;
}
.side-card h3{
  margin:0 0 10px;
  font-size:.95rem;
}
.side-card--cta h3{
  font-size:1.05rem;
  color:#fff;
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
  font-size:.9rem;
  color:var(--text-sub);
}
.side-cta strong{
  display:block;
  margin-bottom:4px;
}
.side-card--cta .side-cta{
  color:rgba(255,255,255,.85);
  position:relative;
  z-index:1;
}
.side-card--cta .cta-sub{
  margin:0 0 12px;
  font-size:.9rem;
}
.side-card--cta .cta-sub .cta-note{
  display:block;
  margin-top:4px;
  font-size:.78rem;
  color:rgba(255,255,255,.7);
}
.side-card--cta .cta-panel{
  background:rgba(15,23,42,.25);
  border-radius:14px;
  padding:12px 14px;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.side-card--cta .cta-line{
  display:flex;
  align-items:center;
  gap:10px;
  font-weight:600;
  font-size:1rem;
}
.side-card--cta .cta-line span{
  display:inline-flex;
  width:30px;
  height:30px;
  border-radius:50%;
  background:rgba(255,255,255,.2);
  align-items:center;
  justify-content:center;
  font-size:1rem;
}
.side-card--cta .cta-line a{
  color:#fff;
  text-decoration:none;
}
.side-card--cta .cta-btn{
  margin-top:6px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  border-radius:999px;
  padding:10px 14px;
  background:#fbbf24;
  color:#111827;
  font-weight:600;
  font-size:.9rem;
  text-decoration:none;
  transition:transform .15s ease, box-shadow .15s ease;
}
.side-card--cta .cta-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 18px rgba(15,23,42,.25);
}

/* FAQ 섹션 */
.post-faq{
  margin:24px 0;
  padding:18px 20px;
  border-radius:16px;
  background:#f8fafc;
  border:1px solid #e2e8f0;
}
.post-faq h3{
  margin:0 0 12px;
  font-size:1rem;
}
.faq-items{
  display:flex;
  flex-direction:column;
  gap:12px;
}
.faq-item h4{
  margin:0 0 4px;
  font-size:.95rem;
  color:#1e3a8a;
}
.faq-item p{
  margin:0;
  font-size:.9rem;
  color:#374151;
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
  .side-card--cta{
    position:static;
  }
}
@media(max-width:640px){
  .article-inner{padding:14px 14px 18px;}
  .post-title{font-size:1.25rem;}
}
</style>
<script type="application/ld+json">${articleJson}</script>
<script type="application/ld+json">${breadcrumbJson}</script>
${faqJson ? `<script type="application/ld+json">${faqJson}</script>` : ""}
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
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
  integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
  crossorigin="anonymous"></script>

    <nav class="breadcrumb">
      <a href="/">전국모바일</a> · <a href="/blog/">블로그</a> · <span>${region} ${keyword}</span>
    </nav>

    <div class="layout">
      <!-- 메인 글 영역 -->
      <article class="article-card">
        ${heroDisplay ? `<img src="${heroDisplay}" alt="${heroAlt}" class="hero-img">` : ""}

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

            ${midImg ? `
            <div class="mid-img">
              <img src="${midImg}" alt="${midAlt}">
            </div>` : ""}

            ${faqHtml}

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

            ${bottomImg ? `
            <div class="bottom-gallery">
              <h3>현장 갤러리</h3>
              <img src="${bottomImg}" alt="${bottomAlt}">
            </div>` : ""}
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

        <section class="side-card side-card--cta">
          <h3>상담 안내</h3>
          <div class="side-cta">
            <p class="cta-sub">폰테크 / 신규가입,기기변경 / 비대면 개통<span class="cta-note">조건 확인은 무료입니다. 부담 없이 연락 주세요.</span></p>
            <div class="cta-panel">
              <div class="cta-line">
                <span>📞</span>
                <a href="tel:010-8290-9536">010-8290-9536</a>
              </div>
              <div class="cta-line">
                <span>💬</span>
                <a href="http://pf.kakao.com/_gIKxnn/chat" target="_blank" rel="noopener">카톡: k090912k</a>
              </div>
            </div>
            <a class="cta-btn" href="http://pf.kakao.com/_gIKxnn/chat" target="_blank" rel="noopener">
              카톡 상담 열기 <i class="bi bi-arrow-up-right"></i>
            </a>
          </div>
        </section>
      </aside>
    </div>
  </div>
</body>
</html>`;
}

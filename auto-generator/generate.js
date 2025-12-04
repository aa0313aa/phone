// /auto-generator/generate.js
// 전국모바일 — AI 자동 블로그 퍼블리싱 풀오토 엔진
// --------------------------------------------------
// 기능:
// ✔ gpt-5.1로 자연스러운 인간 말투 글 생성
// ✔ Markdown → HTML 변환
// ✔ OpenAI gpt-image-1 이미지 2장 (Hero + 본문 중간)
// ✔ 하단 갤러리는 정적 WebP (/assets/gallery/*.webp) 랜덤 1장
// ✔ 썸네일 WebP 자동 생성
// ✔ posts-meta.json 메타 관리
// ✔ Masonry형 /blog/index.html 생성
// ✔ /tag/슬러그.html 태그 페이지 생성
// ✔ 관련 글 자동 추출
// ✔ sitemap.xml 자동 생성 (태그 포함)
// ✔ index.html 최신 글 3개 자동 반영
// --------------------------------------------------

import "dotenv/config";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import slugify from "slugify";
import sharp from "sharp";
import OpenAI from "openai";
import { marked } from "marked";

import { KEYWORDS } from "./keywords.js";
import { REGIONS } from "./regions.js";
import { generateImages } from "../modules/image_gen.js";
import { generateHTML } from "./template.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");
const BLOG_DIR = path.join(ROOT_DIR, "blog");
const TAG_DIR = path.join(ROOT_DIR, "tag");
const ASSET_BLOG_DIR = path.join(ROOT_DIR, "assets", "blog");
const GALLERY_DIR = path.join(ROOT_DIR, "assets", "gallery");
const INDEX_HTML = path.join(ROOT_DIR, "index.html");
const SITEMAP_XML = path.join(ROOT_DIR, "sitemap.xml");
const POSTS_META_JSON = path.join(BLOG_DIR, "posts-meta.json");

const BASE_URL = "https://폰테크.shop";
const DEFAULT_IMAGE = "/assets/img/og-banner.png";
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/index.html", changefreq: "daily", priority: "0.9" },
  { path: "/services.html", changefreq: "weekly", priority: "0.9" },
  { path: "/information.html", changefreq: "weekly", priority: "0.8" },
  { path: "/about.html", changefreq: "monthly", priority: "0.6" },
  { path: "/contact.html", changefreq: "daily", priority: "0.9" },
  { path: "/phonetech-guide.html", changefreq: "weekly", priority: "0.8" },
  { path: "/phonetech-tips.html", changefreq: "weekly", priority: "0.7" },
  { path: "/blog/index.html", changefreq: "daily", priority: "0.7" },
];

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ensureAsciiSlug(value, fallbackPrefix) {
  const base = (value ?? "").toString().trim();
  if (!base) return fallbackPrefix;
  const normalized = slugify(base, { lower: true, strict: true });
  if (normalized) return normalized;
  const hashed = Buffer.from(base, "utf8").toString("hex").slice(0, 8) || "id";
  return `${fallbackPrefix}-${hashed}`;
}

// --------------------------------------------------
// 유틸
// --------------------------------------------------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 제목 패턴: "지역명 + 폰테크(고정) + 키워드" 한글만 사용
function randomTitle(region, keyword) {
  const base = `${region} 폰테크`;

  const patterns = [
    `${region} 폰테크 ${keyword} 진행 가이드`,
    `${region} 폰테크 ${keyword} 상담 정리`,
    `${region} 폰테크 ${keyword} 이렇게 진행합니다`,
    `${region} 폰테크 ${keyword} 한 번에 정리`,
  ];

  return pick(patterns);
}

// --------------------------------------------------
// 이미지 저장 (로컬 PNG → WebP/썸네일)
// --------------------------------------------------

async function saveThumbnail(localImgPath, slugBase) {
  if (!localImgPath) return null;
  await fs.ensureDir(ASSET_BLOG_DIR);

  // heroImg는 "/assets/img/blog/xxx.png" 형태이므로, 루트 기준 실제 경로로 변환
  const normalized = localImgPath.replace(/^\//, "");
  const absPngPath = path.join(ROOT_DIR, normalized);

  let buf;
  try {
    buf = await fs.readFile(absPngPath);
  } catch (e) {
    console.warn("⚠ 로컬 이미지 읽기 실패:", absPngPath, e.message);
    return null;
  }

  const main = `${slugBase}.webp`;
  const thumb = `${slugBase}-thumb.webp`;

  const mainPath = path.join(ASSET_BLOG_DIR, main);
  const thumbPath = path.join(ASSET_BLOG_DIR, thumb);

  await sharp(buf).webp({ quality: 90 }).toFile(mainPath);
  await sharp(buf)
    .resize(480, 300, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile(thumbPath);

  return {
    full: `/assets/blog/${main}`,
    thumb: `/assets/blog/${thumb}`,
  };
}

// --------------------------------------------------
// posts-meta 로드 / 저장
// --------------------------------------------------

async function loadPostsMeta() {
  if (!(await fs.pathExists(POSTS_META_JSON))) return [];
  try {
    const data = await fs.readJson(POSTS_META_JSON);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function savePostsMeta(meta) {
  const map = {};
  for (const p of meta) {
    if (p.fileName) map[p.fileName] = p;
  }
  const arr = Object.values(map).sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
  await fs.writeJson(POSTS_META_JSON, arr, { spaces: 2 });
  return arr;
}

// --------------------------------------------------
// 태그 맵
// --------------------------------------------------

function buildTagMap(posts) {
  const map = {};
  for (const p of posts) {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    for (const tag of tags) {
      const slug = ensureAsciiSlug(tag, "tag");
      if (!slug) continue;
      if (!map[slug]) map[slug] = { tag, posts: [] };
      map[slug].posts.push(p);
    }
  }
  return map;
}

// --------------------------------------------------
// Masonry 블로그 인덱스 (/blog/index.html)
// --------------------------------------------------

async function updateBlogIndex(posts) {
  if (!posts.length) return;

  const cards = posts
    .map((p) => {
      const tagHtml =
        p.tags && p.tags.length
          ? `<div class="card-tags">${p.tags
              .slice(0, 3)
              .map((t) => `<span class="tag-chip">#${t}</span>`)
              .join("")}</div>`
          : "";

      return `
      <article class="card-item">
        <a href="${p.url}" class="card-link">
          <div class="thumb-wrap">
            <img src="${p.thumb}" alt="${p.title}" loading="lazy">
          </div>
          <div class="card-body">
            <span class="meta-date">${p.date}</span>
            <h2 class="card-title">${p.title}</h2>
            ${tagHtml}
          </div>
        </a>
      </article>`;
    })
    .join("");

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "폰테크 정보 블로그",
    description:
      "전국모바일이 실제 상담을 정리한 폰테크 · 비대면개통 · 미납요금대납 정보 모음",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.slice(0, 12).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${BASE_URL}${p.url}`,
        name: p.title,
        image: p.thumb ? `${BASE_URL}${p.thumb}` : `${BASE_URL}${DEFAULT_IMAGE}`,
        datePublished: p.date,
      })),
    },
  };

  const schemaJson = JSON.stringify(schema).replace(/</g, "\\u003c");

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>폰테크 정보 블로그 - 전국모바일</title>
<meta name="description" content="폰테크, 비대면개통, 미납요금대납 등 실제 상담 기반 정보 정리.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${BASE_URL}/blog/">
<style>
:root{
  --bg:#f4f5f9;
  --card:#ffffff;
  --accent:#2563eb;
  --accent-soft:#dbeafe;
  --text:#111827;
  --text-sub:#6b7280;
  --radius:18px;
  --shadow:0 8px 24px rgba(15,23,42,.08);
}
*{box-sizing:border-box;}
body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;
  background:radial-gradient(circle at top, #e0f2fe 0, #f4f5f9 45%, #eef2ff 100%);
}
.wrap{
  max-width:1120px;
  margin:0 auto;
  padding:28px 16px 40px;
}
.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:12px;
  margin-bottom:18px;
}
.header h1{
  font-size:1.9rem;
  margin:0;
}
.header p{
  margin:4px 0 0;
  font-size:.9rem;
  color:var(--text-sub);
}
.header a{
  font-size:.8rem;
  text-decoration:none;
  color:var(--accent);
}
.grid{
  column-count:3;
  column-gap:18px;
}
.card-item{
  break-inside:avoid;
  margin-bottom:18px;
}
.card-link{
  display:block;
  background:var(--card);
  border-radius:var(--radius);
  overflow:hidden;
  box-shadow:var(--shadow);
  text-decoration:none;
  color:var(--text);
  transition:transform .16s ease, box-shadow .16s ease;
}
.card-link:hover{
  transform:translateY(-4px);
  box-shadow:0 12px 28px rgba(15,23,42,.18);
}
.thumb-wrap{
  position:relative;
  overflow:hidden;
}
.thumb-wrap::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(to bottom,rgba(15,23,42,.05),transparent 40%);
  opacity:0;
  transition:opacity .16s ease;
}
.card-link:hover .thumb-wrap::after{
  opacity:.6;
}
.thumb-wrap img{
  width:100%;
  display:block;
}
.card-body{
  padding:14px 16px 14px;
}
.meta-date{
  display:inline-block;
  font-size:.78rem;
  padding:3px 9px;
  border-radius:999px;
  background:var(--accent-soft);
  color:#1e40af;
}
.card-title{
  margin:8px 0 6px;
  font-size:1rem;
  font-weight:600;
  line-height:1.4;
}
.card-tags{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:4px;
}
.tag-chip{
  font-size:.74rem;
  padding:3px 8px;
  border-radius:999px;
  background:#f3f4f6;
  color:#4b5563;
}
@media(max-width:900px){
  .grid{column-count:2;}
}
@media(max-width:640px){
  .grid{column-count:1;}
  .wrap{padding:20px 12px 28px;}
  .header{flex-direction:column;align-items:flex-start;}
  .header h1{font-size:1.5rem;}
}
</style>
<script type="application/ld+json">${schemaJson}</script>
</head>
<body>
  <div class="wrap">
    <header class="header">
      <div>
        <h1>폰테크 정보 블로그</h1>
        <p>실제 상담 내용을 바탕으로 폰테크, 미납요금대납, 비대면 개통 정보를 정리합니다.</p>
      </div>
      <a href="/">← 전국모바일 메인으로</a>
    </header>
    <section class="grid">
      ${cards}
    </section>
  </div>
</body>
</html>`;

  await fs.ensureDir(BLOG_DIR);
  await fs.writeFile(path.join(BLOG_DIR, "index.html"), html, "utf8");
  console.log("📄 /blog/index.html 생성 완료");
}

// --------------------------------------------------
// 태그 페이지 (/tag/슬러그.html)
// --------------------------------------------------

async function generateTagPages(posts) {
  const tagMap = buildTagMap(posts);
  await fs.ensureDir(TAG_DIR);

  for (const [slug, entry] of Object.entries(tagMap)) {
    const { tag, posts: list } = entry;

    const cards = list
      .map((p) => {
        const chip =
          p.tags && p.tags.length
            ? `<div class="card-tags">
                ${p.tags
                  .slice(0, 3)
                  .map((t) => `<span class="tag-chip">#${t}</span>`)
                  .join("")}
               </div>`
            : "";

        return `
        <article class="tag-card">
          <a href="${p.url}" class="tag-link">
            <div class="thumb">
              <img src="${p.thumb}" alt="${p.title}" loading="lazy">
            </div>
            <div class="body">
              <span class="meta-date">${p.date}</span>
              <h2>${p.title}</h2>
              ${chip}
            </div>
          </a>
        </article>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>#${tag} 관련 글 모음 - 전국모바일</title>
<meta name="description" content="${tag} 관련 폰테크, 비대면 개통, 미납요금대납 상담 사례 모음.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${BASE_URL}/tag/${slug}.html">
<style>
body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;
  background:#f4f5f9;
}
.wrap{
  max-width:1120px;
  margin:0 auto;
  padding:28px 16px 40px;
}
h1{
  margin:0 0 6px;
  font-size:1.8rem;
}
.desc{
  font-size:.9rem;
  color:#6b7280;
  margin-bottom:18px;
}
.grid{
  column-count:3;
  column-gap:18px;
}
.tag-card{
  break-inside:avoid;
  margin-bottom:18px;
}
.tag-link{
  display:block;
  background:#fff;
  border-radius:16px;
  overflow:hidden;
  text-decoration:none;
  color:#111827;
  box-shadow:0 8px 22px rgba(15,23,42,.08);
  transition:transform .16s ease, box-shadow .16s ease;
}
.tag-link:hover{
  transform:translateY(-4px);
  box-shadow:0 12px 28px rgba(15,23,42,.16);
}
.thumb img{
  width:100%;
  display:block;
}
.body{
  padding:14px 16px 14px;
}
.meta-date{
  display:inline-block;
  padding:3px 9px;
  border-radius:999px;
  background:#dbeafe;
  color:#1e40af;
  font-size:.78rem;
}
h2{
  margin:8px 0 6px;
  font-size:1rem;
}
.card-tags{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.tag-chip{
  padding:3px 8px;
  border-radius:999px;
  background:#f3f4f6;
  font-size:.75rem;
  color:#4b5563;
}
@media(max-width:900px){
  .grid{column-count:2;}
}
@media(max-width:640px){
  .grid{column-count:1;}
  .wrap{padding:20px 12px 28px;}
  h1{font-size:1.5rem;}
}
</style>
</head>
<body>
  <div class="wrap">
    <h1>#${tag}</h1>
    <p class="desc">${tag} 관련 실제 상담 내용을 모아서 정리한 페이지입니다.</p>
    <section class="grid">
      ${cards}
    </section>
  </div>
</body>
</html>`;

    await fs.writeFile(path.join(TAG_DIR, `${slug}.html`), html, "utf8");
  }

  console.log("🏷 태그 페이지 생성 완료");
}

// --------------------------------------------------
// Markdown → HTML 변환 + 요약 추출
// --------------------------------------------------

function extractSummary(text) {
  const plain = text.replace(/\s+/g, " ").trim();
  return plain.slice(0, 200) + (plain.length > 200 ? "..." : "");
}

function convertToHTML(mdText) {
  const summary = extractSummary(mdText);
  const bodyHtml = marked(mdText);

  return `
<div class="summary-box">
  <strong>이 글 한눈에 보기</strong>
  <p>${summary}</p>
</div>
${bodyHtml}
`;
}

// --------------------------------------------------
// 관련 글 추출
// --------------------------------------------------

function getRelated(posts, region, keyword, limit = 6) {
  if (!posts.length) return [];

  const rl = region.toLowerCase();
  const kl = keyword.toLowerCase();

  const scored = posts.map((p) => {
    let score = 0;
    const t = (p.title || "").toLowerCase();
    if (t.includes(rl)) score += 2;
    if (t.includes(kl)) score += 2;
    if (p.tags?.includes(region)) score += 1;
    if (p.tags?.includes(keyword)) score += 1;
    if (p.tags?.includes("폰테크")) score += 0.5;
    return { ...p, score };
  });

  const filtered = scored
    .filter((p) => p.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.date || "").localeCompare(a.date || "");
    })
    .slice(0, limit);

  return filtered.length ? filtered : posts.slice(0, limit);
}

// --------------------------------------------------
// sitemap.xml 생성 (태그 포함)
// --------------------------------------------------

async function updateSitemap(posts) {
  const today = new Date().toISOString().split("T")[0];
  const tagMap = buildTagMap(posts);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const route of STATIC_ROUTES) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const post of posts) {
    const loc = `${BASE_URL}${post.url}`;
    const imgPath = post.hero || post.thumb || DEFAULT_IMAGE;
    const imgLoc = `${BASE_URL}${imgPath}`;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(loc)}</loc>\n`;
    xml += `    <lastmod>${post.date || today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    if (imgPath) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(imgLoc)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(post.title || "폰테크 상담 이미지")}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  for (const slug of Object.keys(tagMap)) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/tag/${slug}.html</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.4</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  await fs.writeFile(SITEMAP_XML, xml, "utf8");
  console.log("🗺 sitemap.xml 업데이트 완료");
}

// --------------------------------------------------
// index.html 최신 글 3개 반영
// --------------------------------------------------

async function updateHomeLatest(posts) {
  if (!(await fs.pathExists(INDEX_HTML))) return;

  const html = await fs.readFile(INDEX_HTML, "utf8");
  const START = "<!-- AUTO_LATEST_POSTS_START -->";
  const END = "<!-- AUTO_LATEST_POSTS_END -->";

  if (!html.includes(START) || !html.includes(END)) {
    console.warn("⚠ index.html에 AUTO_LATEST_POSTS 마커 없음");
    return;
  }

  const latest = posts.slice(0, 3);
  const items = latest
    .map(
      (p) => `
<li class="list-group-item d-flex justify-content-between align-items-center">
  <a href="${p.url}" class="text-decoration-none">${p.title}</a>
  <span class="badge bg-light text-muted">${p.date}</span>
</li>`
    )
    .join("");

  const block = `
<section class="py-5 bg-white">
  <div class="container">
    <h2 class="h4 mb-3"><i class="bi bi-journal-text me-2"></i>최신 폰테크 정보</h2>
    <ul class="list-group">
      ${items}
    </ul>
    <div class="mt-3 text-end">
      <a href="/blog/" class="small text-decoration-none">블로그 전체보기 <i class="bi bi-arrow-right"></i></a>
    </div>
  </div>
</section>`;

  const before = html.split(START)[0];
  const after = html.split(END)[1];

  await fs.writeFile(INDEX_HTML, `${before}${START}${block}${END}${after}`, "utf8");
  console.log("🏠 index.html 최신 글 업데이트 완료");
}

// --------------------------------------------------
// 정적 갤러리 이미지 (/assets/gallery/*.webp) 중 1장 선택
// --------------------------------------------------

let cachedGallery = null;

async function pickStaticGalleryImage() {
  if (!cachedGallery) {
    try {
      await fs.ensureDir(GALLERY_DIR);
      const files = await fs.readdir(GALLERY_DIR);
      cachedGallery = files
        .filter((f) => f.toLowerCase().endsWith(".webp"))
        .map((f) => `/assets/gallery/${f}`);
    } catch (e) {
      console.warn("⚠ 갤러리 폴더 읽기 실패:", e.message);
      cachedGallery = [];
    }
  }
  if (!cachedGallery.length) return null;
  return pick(cachedGallery);
}

// --------------------------------------------------
// 개별 글 생성
// --------------------------------------------------

async function generateSinglePost(index, postsMeta) {
  const region = pick(REGIONS);
  const keyword = pick(KEYWORDS);
  const title = randomTitle(region, keyword);
  const dateStr = new Date().toISOString().split("T")[0];

  console.log(`\n✍️ (${index + 1}/2) 글 생성: ${title}`);

  // 1) 글 내용 (gpt-5.1, Markdown)
  const completion = await client.responses.create({
    model: "gpt-5.1",
    input: `
너는 "전국모바일"이라는 실제 폰테크 업체 운영자라고 가정하고,
네이버 블로그 스타일로 "${title}" 주제를 설명하는 글을 써줘.

전반 톤/스타일:
- 실제 사장이 상담 후 정리해서 올리는 네이버 블로그 글 느낌
- "안녕하세요, 전국모바일입니다" 로 시작
- 존댓말 위주, 중간중간 "솔직히 말해서", "이 부분은 진짜 중요해요" 같은 가벼운 표현 허용
- 광고 문구보다는 실제 상담 기준으로 차분하게 설명

필수 구성(꼭 이 순서/소제목 구조로 작성):
## 1. 인사와 글 목적
- ${region} 지역 언급 포함 (최소 1회)
- 오늘 글에서 무엇을 알려줄지 2~3문단으로 간단히 설명

## 2. 폰테크란 무엇인가
- "정식 통신사 개통(신규가입 또는 기기변경)을 통해 기기를 넘기고, 그 대가로 현금을 받는 구조" 라는 점을 설명
- 대출/사채가 아니라 통신사 개통후 매매 구조라는 점을 강조

## 3. 왜 폰테크를 이용하려 할까
- ${keyword} 와 연결해서 사람들이 어떤 상황에서 폰테크를 찾는지 3~5가지 예시
- 장점 위주로만 쓰지 말고, 현실적인 이유(자금이 급한 상황 등)를 함께 적기

## 4. 진행 구조 (상담부터 현금 지급까지)
- 1) 간단 상담 및 조건 확인
- 2) 통신사/요금제/약정 조건 설명
- 3) 개통 진행
- 4) 기기/회선 사용권 이전
- 5) 현금 지급
- 각 단계마다 고객이 꼭 알아야 할 포인트를 1~3문단씩 설명

## 5. 장점과 단점, 꼭 알아야 할 리스크
- 장점 2~3가지
- 단점/리스크 3~4가지 (연체, 신용도 하락, 통신비 부담, 중도해지 위약금 등)
- ${region} 예시를 1회 이상 자연스럽게 섞어서 설명

## 6. 이런 분들은 진행을 말립니다
- 진행을 말리는 케이스를 3~5가지로 정리
- "이미 통신비 연체 중인 분", "고정 수입이 거의 없는 상태", "당장 크게 한 번만 받자" 같은 패턴 포함

## 7. 마무리 및 상담 안내
- 오늘 내용 핵심을 2~3문단으로 다시 요약
- 무리한 진행은 말리고, 조건이 맞을 때만 신중하게 보라는 메시지 포함
- 마지막 문단에만 자연스럽게 상담 안내 멘트 추가

세부 조건:
- 전체 분량: 대략 1200~2000자 정도 (너무 길게 쓰지 말 것)
- 형식: 마크다운(Markdown) 사용, 위 소제목들은 H2(##) 로 그대로 사용
- 지역 "${region}" 최소 3회 자연스럽게 등장
- 키워드 "${keyword}" 최소 5회 자연스럽게 섞어서 사용
- "폰테크" 구조 설명 + 장단점 + 리스크(연체, 신용도, 통신비 부담) 반드시 포함
- 전화번호 "010-8290-9536" 정확히 1회 포함 (마지막 섹션 근처에서 자연스럽게)
- "카카오톡" 또는 "카톡 상담" 문구 1회 포함 (마지막 섹션 근처에서 자연스럽게)
- 이미지, 사진, 썸네일 언급은 절대 하지 말 것
- "AI", "챗GPT", "언어모델" 같은 표현 금지
- 제목(${title})을 그대로 본문에 반복하지 말고, 자연스럽게 풀어서 설명
`,
  });

  const mdText = completion.output_text;
  const contentHTML = convertToHTML(mdText);

  // 2) 이미지 2장 (OpenAI) - hero + middle
  console.log("📸 이미지 생성 중…");
  const imgs = await generateImages(keyword, region);
  // OpenAI에서 받은 원본 PNG 경로 (hero)
  const heroPng = imgs[0] || null;
  const midPng = imgs[1] || null;

  // 3) 썸네일 (hero 기준)
  // 파일명이 덮어씌워지는 문제를 방지하기 위해 각 글에 고유 ID(타임스탬프)를 사용
  const uid = `${dateStr}-${Date.now()}`;

  let thumbMeta = null;
  if (heroPng) {
    try {
      thumbMeta = await saveThumbnail(
        heroPng, // 로컬 PNG 기반으로 WebP/썸네일 생성
        `${uid}-${ensureAsciiSlug(region, "region")}-${ensureAsciiSlug(
          keyword,
          "keyword"
        )}`
      );
    } catch (e) {
      console.warn("⚠ 썸네일 생성 실패:", e.message);
    }
  }

  const heroWebp = thumbMeta ? thumbMeta.full : null;
  // 두 번째 이미지는 PNG 그대로 본문 하단에 사용
  const midWebp = midPng;

  // 썸네일/OG 모두 도메인 없이 상대 경로만 사용
  const thumbUrlRel = thumbMeta ? thumbMeta.thumb : "/assets/img/og-banner.png";

  // 4) 하단 갤러리용 정적 이미지 1장
  const bottomImg = await pickStaticGalleryImage();

  // 5) 태그 / 관련 글
  const tags = Array.from(
    new Set([keyword, region, "폰테크", "비대면개통", "미납요금대납"])
  );
  const related = getRelated(postsMeta, region, keyword, 6);

  const slugRegion = ensureAsciiSlug(region, "region");
  const slugKeyword = ensureAsciiSlug(keyword, "keyword");
  const fileName = `${uid}-${slugRegion}-${slugKeyword}.html`;
  const canonicalPath = `/blog/${fileName}`;

  const finalHTML = generateHTML({
    title,
    date: dateStr,
    region,
    keyword,
    content: contentHTML,
    // 본문에서는 WebP만 사용 (SEO/용량 최적화)
    heroImg: heroWebp,
    midImg: midWebp,
    bottomImg, // 정적 갤러리
    canonicalPath,
    thumbUrl: thumbUrlRel,
    tags,
    relatedPosts: related,
  });

  await fs.ensureDir(BLOG_DIR);
  await fs.writeFile(path.join(BLOG_DIR, fileName), finalHTML, "utf8");

  console.log(`✅ 글 생성 완료 → ${fileName}`);

  // 메타 추가
  postsMeta.unshift({
    fileName,
    url: canonicalPath,
    title,
    date: dateStr,
    region,
    keyword,
    tags,
    thumb: thumbUrlRel,
    hero: heroWebp || thumbUrlRel || DEFAULT_IMAGE,
  });
}

// --------------------------------------------------
// 메인 실행
// --------------------------------------------------

async function main() {
  await fs.ensureDir(BLOG_DIR);
  await fs.ensureDir(ASSET_BLOG_DIR);
  await fs.ensureDir(TAG_DIR);
  await fs.ensureDir(GALLERY_DIR);

  let postsMeta = await loadPostsMeta();

  // 새 글 2개
  for (let i = 0; i < 2; i++) {
    await generateSinglePost(i, postsMeta);
  }

  // 메타 저장 + 정렬
  postsMeta = await savePostsMeta(postsMeta);

  // 페이지들 업데이트
  await updateBlogIndex(postsMeta);
  await generateTagPages(postsMeta);
  await updateSitemap(postsMeta);
  await updateHomeLatest(postsMeta);

  console.log("\n🎉 전체 2개 글 자동 생성 + 모든 페이지 업데이트 완료!\n");
}

main().catch((err) => {
  console.error("❌ 오류 발생:", err);
  process.exit(1);
});

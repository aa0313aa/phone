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

import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import sharp from 'sharp';
import OpenAI from 'openai';
import { marked } from 'marked';

import { KEYWORDS } from './keywords.js';
import { REGIONS } from './regions.js';
import { generateImages } from '../modules/image_gen.js';
import { generateHTML } from './template.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const TAG_DIR = path.join(ROOT_DIR, 'tag');
const ASSET_BLOG_DIR = path.join(ROOT_DIR, 'assets', 'blog');
const GALLERY_DIR = path.join(ROOT_DIR, 'assets', 'gallery');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');
const SITEMAP_XML = path.join(ROOT_DIR, 'sitemap.xml');
const POSTS_META_JSON = path.join(BLOG_DIR, 'posts-meta.json');

const BASE_URL = 'https://폰테크.shop';
const DEFAULT_IMAGE = '/assets/img/og-banner.png';
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/index.html', changefreq: 'daily', priority: '0.9' },
  { path: '/services.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/information.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/about.html', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact.html', changefreq: 'daily', priority: '0.9' },
  { path: '/phonetech-guide.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/phonetech-tips.html', changefreq: 'weekly', priority: '0.7' },
  { path: '/blog/index.html', changefreq: 'daily', priority: '0.7' },
];

// --------------------------------------------------
// 🎭 AI 인간화 (Humanizing) 설정
// --------------------------------------------------

// 1. 화자 스타일 (페르소나) 랜덤 선택 — 점잖은 전문가 위주로 압축
const PERSONAS = [
  {
    name: '친절한 상담실장',
    tone: "고객의 걱정을 공감해주며 차분하게 설명하는 스타일. '~하셨나요?', '~입니다' 위주의 부드러운 경어체.",
    ending: '상담이 필요하시다면 언제든 편하게 문을 두드려주세요.',
  },
  {
    name: '명쾌한 전문가',
    tone: '군더더기 없이 깔끔하고 논리적인 스타일. 팩트 위주로 전달하며 신뢰감을 주는 단호한 경어체.',
    ending: '복잡하게 고민하지 마시고, 전문가와 상의하여 안전하게 진행하세요.',
  },
];

// 2. 글 구조 (템플릿) 랜덤 선택 - 목차 순서를 뒤섞음
const TEMPLATES = [
  {
    type: '후기 중심형',
    instructions:
      '도입부에서 오늘 겪은 황당하거나 기억에 남는 실제 상담 에피소드로 시작. 이론 설명은 뒤로 미루고, \'왜 이 손님이 돈이 급했는지\' 스토리텔링 위주로 전개.',
  },
  {
    type: '팩트 체크형',
    instructions:
      '인터넷에 떠도는 폰테크 사기 수법이나 잘못된 정보를 먼저 지적하면서 시작. \'절대 이렇게 하지 마세요\'라고 강력하게 경고하며 신뢰도 확보.',
  },
  {
    type: 'Q&A 해결형',
    instructions: '오늘 가장 많이 받은 질문 3가지를 답변하는 형식으로 구성. 목차를 Q&A 형식으로 잡을 것.',
  },
];

// 3. 인간적인 잡담 (Noise) 리스트
const HUMAN_NOISE = [
  '요즘 경기가 어려워서 그런지 문의주시는 분들의 사연을 들으면 마음이 무거울 때가 많습니다.',
  '날씨가 부쩍 변덕스럽네요. 다들 건강 챙기시면서 일 보시길 바랍니다.',
  '오전에 상담하다 보니 비슷한 고민을 하시는 분들이 많아 글로 정리해봅니다.',
  '인터넷에 잘못된 정보가 너무 많아, 오늘 제대로 된 내용을 알려드리려 합니다.',
];

const INLINE_DECOR_IMAGES = [
  '/assets/img/blog/Gemini_Generated_Image_v33un8v33un8v33u.png',
  '/assets/img/blog/Gemini_Generated_Image_7qqbvo7qqbvo7qqb.png',
  '/assets/img/blog/Gemini_Generated_Image_6wwdjd6wwdjd6wwd.png',
  '/assets/img/blog/Gemini_Generated_Image_3ch9el3ch9el3ch9.png',
];

function escapeXml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureAsciiSlug(value, fallbackPrefix) {
  const base = (value ?? '').toString().trim();
  if (!base) return fallbackPrefix;
  const normalized = slugify(base, { lower: true, strict: true });
  if (normalized) return normalized;
  const hashed = Buffer.from(base, 'utf8').toString('hex').slice(0, 8) || 'id';
  return `${fallbackPrefix}-${hashed}`;
}

// --------------------------------------------------
// 유틸
// --------------------------------------------------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickInlineDecorImage() {
  if (!INLINE_DECOR_IMAGES.length) return null;
  return pick(INLINE_DECOR_IMAGES);
}

// 키워드에 "폰테크"가 이미 포함된 경우 중복 제거
function normalizeKeywordForTitle(keyword) {
  const cleaned = (keyword ?? '').replace(/폰테크/gi, '').trim();
  return cleaned || '안전 이용';
}

// 제목 패턴: "지역명 + 폰테크(고정) + 키워드" 한글만 사용
function randomTitle(region, keyword) {
  const kw = normalizeKeywordForTitle(keyword);

  const patterns = [
    `${region} 폰테크 ${kw} 실제 상담 노트`,
    `${region} 폰테크 ${kw} 체크리스트 버전`,
    `${region} 폰테크 ${kw} 진행 주의사항 정리`,
    `${region} 폰테크 ${kw} 최근 상담 사례`,
    `${region} 폰테크 ${kw} 꼭 알아야 할 포인트`,
    `${region} 폰테크 ${kw} 안전하게 이용하세요`,
    `${region} 폰테크 ${kw} 정식 업체 진행`,
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
  const normalized = localImgPath.replace(/^\//, '');
  const absPngPath = path.join(ROOT_DIR, normalized);

  let buf;
  try {
    buf = await fs.readFile(absPngPath);
  } catch (e) {
    console.warn(
      '⚠ 로컬 이미지 읽기 실패, 기본 배너로 대체:',
      absPngPath,
      e.message
    );
    const fallbackPath = path.join(ROOT_DIR, DEFAULT_IMAGE.replace(/^\//, ''));
    try {
      buf = await fs.readFile(fallbackPath);
    } catch (fallbackErr) {
      console.warn('⚠ 기본 배너 읽기 실패:', fallbackPath, fallbackErr.message);
      return null;
    }
  }

  const main = `${slugBase}.webp`;
  const thumb = `${slugBase}-thumb.webp`;

  const mainPath = path.join(ASSET_BLOG_DIR, main);
  const thumbPath = path.join(ASSET_BLOG_DIR, thumb);

  await sharp(buf).webp({ quality: 90 }).toFile(mainPath);
  await sharp(buf)
    .resize(480, 300, { fit: 'cover' })
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
    (b.date || '').localeCompare(a.date || '')
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
      const slug = ensureAsciiSlug(tag, 'tag');
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
            .join('')}</div>`
          : '';

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
    .join('');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '폰테크 정보 블로그',
    description:
      '전국모바일이 실제 상담을 정리한 폰테크 · 비대면개통 · 미납요금대납 정보 모음',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.slice(0, 12).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${BASE_URL}${p.url}`,
        name: p.title,
        image: p.thumb
          ? `${BASE_URL}${p.thumb}`
          : `${BASE_URL}${DEFAULT_IMAGE}`,
        datePublished: p.date,
      })),
    },
  };

  const schemaJson = JSON.stringify(schema).replace(/</g, '\\u003c');

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
  await fs.writeFile(path.join(BLOG_DIR, 'index.html'), html, 'utf8');
  console.log('📄 /blog/index.html 생성 완료');
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
              .join('')}
               </div>`
            : '';

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
      .join('');

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

    await fs.writeFile(path.join(TAG_DIR, `${slug}.html`), html, 'utf8');
  }

  console.log('🏷 태그 페이지 생성 완료');
}

// --------------------------------------------------
// Markdown → HTML 변환 + 요약 추출
// --------------------------------------------------

function extractSummary(text) {
  const plain = text.replace(/\s+/g, ' ').trim();
  return plain.slice(0, 200) + (plain.length > 200 ? '...' : '');
}

function convertToHTML(mdText) {
  const summary = extractSummary(mdText);
  const bodyHtml = marked(mdText);

  // HTML 내용에 요약상자를 포함
  const fullHtml = `
<div class="summary-box">
  <strong>이 글 한눈에 보기</strong>
  <p>${summary}</p>
</div>
${bodyHtml}
`;

  return { html: fullHtml, summary };
}

function decorateContent(html, { region, keyword, inlineImage }) {
  let output = html || '';

  if (inlineImage) {
    const inlineAlt = `${region} ${keyword} 진행 참고 이미지`;
    const inlineBlock = `
<div class="section-img">
  <img src="${inlineImage}" alt="${inlineAlt}">
</div>`;
    const section5Key = '<h2>5.';
    if (output.includes(section5Key)) {
      output = output.replace(section5Key, `${inlineBlock}\n${section5Key}`);
    }
  }

  return output;
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
    const t = (p.title || '').toLowerCase();
    if (t.includes(rl)) score += 2;
    if (t.includes(kl)) score += 2;
    if (p.tags?.includes(region)) score += 1;
    if (p.tags?.includes(keyword)) score += 1;
    if (p.tags?.includes('폰테크')) score += 0.5;
    return { ...p, score };
  });

  const filtered = scored
    .filter((p) => p.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.date || '').localeCompare(a.date || '');
    })
    .slice(0, limit);

  return filtered.length ? filtered : posts.slice(0, limit);
}

// --------------------------------------------------
// sitemap.xml 생성 (태그 포함)
// --------------------------------------------------

async function updateSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];
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
      xml += `      <image:title>${escapeXml(post.title || '폰테크 상담 이미지')}</image:title>\n`;
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

  await fs.writeFile(SITEMAP_XML, xml, 'utf8');
  console.log('🗺 sitemap.xml 업데이트 완료');
}

// --------------------------------------------------
// index.html 최신 글 3개 반영
// --------------------------------------------------

async function updateHomeLatest(posts) {
  if (!(await fs.pathExists(INDEX_HTML))) return;

  const html = await fs.readFile(INDEX_HTML, 'utf8');
  const START = '<!-- AUTO_LATEST_POSTS_START -->';
  const END = '<!-- AUTO_LATEST_POSTS_END -->';

  if (!html.includes(START) || !html.includes(END)) {
    console.warn('⚠ index.html에 AUTO_LATEST_POSTS 마커 없음');
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
    .join('');

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

  await fs.writeFile(
    INDEX_HTML,
    `${before}${START}${block}${END}${after}`,
    'utf8'
  );
  console.log('🏠 index.html 최신 글 업데이트 완료');
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
        .filter((f) => f.toLowerCase().endsWith('.webp'))
        .map((f) => `/assets/gallery/${f}`);
    } catch (e) {
      console.warn('⚠ 갤러리 폴더 읽기 실패:', e.message);
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

  // 제목 다양화: 기존 randomTitle 활용
  const title = randomTitle(region, keyword);
  const dateStr = new Date().toISOString().split('T')[0];

  console.log(`\n✍️ (${index + 1}/2) 글 생성 중... [${region} ${keyword}]`);

  // 랜덤 톤/구조/잡담 선택
  const persona = pick(PERSONAS);
  const template = pick(TEMPLATES);
  const noise = pick(HUMAN_NOISE);

  // 프롬프트 엔지니어링 강화
  const systemPrompt = `
당신은 "전국모바일"의 신뢰할 수 있는 폰테크 전문가입니다.
아래 [페르소나]에 맞춰 네이버 블로그 포스팅을 작성하세요.

[페르소나 설정]
- 화자: ${persona.name}
- 말투: ${persona.tone}
- **필수:** 무조건 정중한 존댓말(합쇼체/해요체)만 사용. 반말, 비속어, 공격적 표현 금지.
- **금지:** "솔직히 까놓고", "긴 말 안 함", "장난하냐" 같은 저급한 표현 금지.
- **금지:** "소개합니다", "결론적으로", "종합하면" 같은 AI 상투적 접속사 남발 금지.
- 문단 길이는 불규칙하게, 그러나 호흡은 자연스럽게. 너무 짧은 문단만 연속 사용 금지.
- 분량: 본문 기준 1,500~2,300자 범위로 충분히 서술.

[글 작성 목표]
- 독자가 읽었을 때 광고 로봇이 아닌 실제 상담사가 진심을 담아 쓴 글처럼 느껴져야 함.
- 정보 전달은 명료하게, 톤은 점잖고 신뢰감 있게 유지.

[글 작성 규칙]
1. 형식: Markdown (소제목은 ## 사용)
2. 지역: "${region}" 3회 이상 자연스럽게 언급
3. 키워드: "${keyword}" 4~5회 자연스럽게 분산 언급
4. 연락처: 010-8290-9536 (글 하단부 1회), 카카오톡 상담 언급 1회
5. 필수 포함: 신규/기변 요금 구조(신규=통신요금+할부금, 기변=기존 요금+할부금), 개통 단말기 즉시 매입·현금 지급, 유심은 고객이 직접 보관해야 함.
6. 각 주요 소제목(절차/주의/장단점/마무리)은 최소 2~3문단 이상으로 충분히 풀어 쓸 것.
  `;

  const userPrompt = `
주제: "${title}"
글의 구성 타입: ${template.type}
작성 지침: ${template.instructions}

[구성 가이드]
1. **도입부**: "${noise}" 라는 문장으로 자연스럽게 시작하고, ${region} 지역의 ${keyword} 수요가 늘고 있다는 배경을 덧붙여 주세요.
2. **진행 과정**: 상담 → 조건 확인 → 진행 → 입금까지 3~4단계로 설명하며 ${region} 실제 상담 사례 한 줄씩 곁들여 생동감 있게.
3. **핵심 포인트(주의사항)**: 무조건 높은 금액을 준다는 곳을 피해야 하는 이유, 비대면 진행 시 서류 확인 중요성, 유심 보관 주의 등을 전문가 시선으로 조언.
4. **마무리**: ${persona.ending} 느낌으로 정중히 끝맺고, 마지막에 자연스럽게 연락처와 카카오톡 상담을 안내.

위 내용을 바탕으로 전문적이고 신뢰감 있는 블로그 글을 작성해줘.
`;

  try {
    // 글 내용 생성 (gpt-4o)
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    const mdText = completion?.choices?.[0]?.message?.content?.trim();
    if (!mdText) {
      throw new Error('빈 응답 수신');
    }

    // 이미지 생성 (Hero, Mid, Bottom)
    const images = await generateImages(keyword, region);

    const heroInfo = images[0]
      ? await saveThumbnail(images[0], `post-${Date.now()}-hero`)
      : null;
    const midInfo = images[1]
      ? await saveThumbnail(images[1], `post-${Date.now()}-mid`)
      : null;
    let bottomInfo = null;
    if (images[2]) {
      bottomInfo = await saveThumbnail(images[2], `post-${Date.now()}-bottom`);
    }

    // Markdown → HTML 변환 + 장식
    const { html: bodyHtml, summary: postSummary } = convertToHTML(mdText);
    const decoratedHtml = decorateContent(bodyHtml, {
      region,
      keyword,
      inlineImage: midInfo ? midInfo.full : null,
    });

    const uid = `${dateStr}-${Date.now()}`;
    const slugRegion = ensureAsciiSlug(region, 'region');
    const slugKeyword = ensureAsciiSlug(keyword, 'keyword');
    const fileName = `${uid}-${slugRegion}-${slugKeyword}.html`;
    const canonicalPath = `/blog/${fileName}`;

    // 썸네일 생성 (Hero 기준)
    let thumbMeta = null;
    if (heroInfo) {
      try {
        thumbMeta = await saveThumbnail(
          heroInfo.full || images[0],
          `${uid}-${slugRegion}-${slugKeyword}`
        );
      } catch (e) {
        console.warn('⚠ 썸네일 생성 실패:', e.message);
      }
    }

    const heroWebp = thumbMeta ? thumbMeta.full : heroInfo?.full || null;
    const thumbUrlRel = thumbMeta?.thumb || heroInfo?.thumb || '/assets/img/og-banner.png';
    const bottomImg = bottomInfo ? bottomInfo.full : await pickStaticGalleryImage();

    // 태그 및 관련 글
    const tags = Array.from(new Set([keyword, region, '폰테크', '박스폰', '가개통']));
    const related = getRelated(postsMeta, region, keyword, 6);

    const finalHTML = generateHTML({
      title,
      date: dateStr,
      region,
      keyword,
      content: decoratedHtml,
      heroImg: heroInfo ? heroInfo.full : null,
      midImg: midInfo ? midInfo.full : null,
      bottomImg,
      canonicalPath,
      thumbUrl: thumbUrlRel,
      tags,
      relatedPosts: related,
      faqData: [],
      summary: postSummary,
    });

    await fs.ensureDir(BLOG_DIR);
    await fs.writeFile(path.join(BLOG_DIR, fileName), finalHTML, 'utf8');

    console.log(`✅ 글 생성 완료 → ${fileName} (컨셉: ${persona.name} / ${template.type})`);

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
  } catch (error) {
    console.error('❌ 글 생성 중 에러 발생:', error);
  }
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

  console.log('\n🎉 전체 2개 글 자동 생성 + 모든 페이지 업데이트 완료!\n');
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});

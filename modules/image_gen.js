// modules/image_gen.js
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 이미지가 항상 프로젝트 루트의 assets/img/blog에 저장되도록 고정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

/* -----------------------------------------
   랜덤 스타일 리스트 (50종 이상)
------------------------------------------ */
const STYLES = [
  'flat vector illustration',
  '3D soft clay style',
  'pastel cartoon style',
  'korean webtoon style',
  'soft watercolor illustration',
  'line-art minimal style',
  'studio corporate illustration',
  'digital painting smooth style',
  'isometric business illustration',
  'modern gradient vector style',
  'professional office illustration',
  'semi-realistic 2.5D illustration',
  'high-end corporate character style',
  'warm soft-child book illustration',
  'clean UI/UX onboarding style',
  'Adobe-illustrator flat design style',
  'smooth cel-shading illustration',
  'premium business cartoon style',
  'friendly consulting illustration',
  'pastel-toned 2D character style',
  'micro 3D character style',
  'minimal beige-tone illustration',
  'warm vintage corporate art',
  'soft outline flat art',
  'rounded-corner character style',
  'office scene clay-art style',
  'digital brush soft-render style',
  'calm neutral-tone illustration',
  'business infographic illustration',
  'friendly doodle-style illustration',
  'professional avatar-style art',
  'soft matte illustration',
  'modern workplace illustration',
  'pastel vector consulting scene',
  'top-view flat illustration',
  'simple colorful flat-style',
  'clean cartoon workplace style',
  'office daylight illustration',
  '3D gradient people illustration',
];

/* -----------------------------------------
   랜덤 조명
------------------------------------------ */
const LIGHTING = [
  'soft warm studio light',
  'bright daylight',
  'sunset warm ambient',
  'cinematic soft shadows',
  'natural window light',
  'pastel diffused lighting',
  'clean neutral lighting',
  'smooth ambient light',
  'commercial product-light style',
];

/* -----------------------------------------
   랜덤 카메라 구도
------------------------------------------ */
const ANGLES = [
  'front view',
  '45-degree angle view',
  'top view desk scene',
  'isometric view',
  'slightly zoomed-in view',
  'over-the-shoulder view',
  'side view',
  'wide office shot',
  'close-up portrait',
];

/* -----------------------------------------
   랜덤 배경
------------------------------------------ */
const BACKGROUNDS = [
  'modern office interior',
  'clean minimal desk',
  'cozy home office',
  'corporate workspace',
  'professional consulting room',
  'simple warm pastel background',
  'cafe-style work desk',
  'bright meeting room',
  'soft gradient background',
];

/* -----------------------------------------
   랜덤 인물 구성
------------------------------------------ */
const PERSON_SET = [
  'female consultant talking on the phone',
  'male consultant using headset while talking',
  'consultant with laptop assisting a customer',
  'customer calling on smartphone visible on big screen',
  '2-person phone conversation scene',
  'consultant smiling while explaining',
];

/* -----------------------------------------
   랜덤 프롬프트 생성
------------------------------------------ */
function buildImagePrompt(keyword, region) {
  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  const light = LIGHTING[Math.floor(Math.random() * LIGHTING.length)];
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
  const person = PERSON_SET[Math.floor(Math.random() * PERSON_SET.length)];

  return `
${person}.
Scene about: ${region} ${keyword}.
Style: ${style}.
Lighting: ${light}.
Camera angle: ${angle}.
Background: ${bg}.
Warm tone, friendly consulting atmosphere.
High-quality illustration for blog.
No text, no watermark, no symbols.
`.trim();
}

/* -----------------------------------------
   OpenAI 이미지 생성 2장
------------------------------------------ */
export async function generateImages(keyword, region) {
  console.log(`📸 OpenAI 이미지 생성 시작: ${region} ${keyword}`);

  const prompt = buildImagePrompt(keyword, region);

  try {
    const result = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 3,
      size: '1024x1024',
    });

    const images = (result.data || []).map((item, idx) => {
      const base64 = item.b64_json;
      if (!base64) return null;

      const buffer = Buffer.from(base64, 'base64');

      const fileName = `blog-image-${Date.now()}-${idx + 1}.png`;
      const outDir = path.join(ROOT_DIR, 'assets', 'img', 'blog');
      const outPath = path.join(outDir, fileName);

      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      fs.writeFileSync(outPath, buffer);

      // Keep a copy under assets/blog/ for backward-compat paths used in older templates/CDNs.
      try {
        const legacyDir = path.join(ROOT_DIR, 'assets', 'blog');
        if (!fs.existsSync(legacyDir)) {
          fs.mkdirSync(legacyDir, { recursive: true });
        }
        fs.copyFileSync(outPath, path.join(legacyDir, fileName));
      } catch (copyErr) {
        console.warn('⚠ 이미지 백업 복사 실패 (assets/blog):', copyErr.message);
      }

      return `/assets/img/blog/${fileName}`;
    });

    console.log('✅ 최종 생성 이미지:', images);
    return images.filter(Boolean);
  } catch (err) {
    console.log('❌ OpenAI 이미지 오류:', err.message);
    return [];
  }
}

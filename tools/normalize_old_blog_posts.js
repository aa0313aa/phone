// tools/normalize_old_blog_posts.js
// 기존 잘못된 블로그 파일명/메타를 새 규칙으로 정리

import fs from "fs";
import path from "path";

// 루트 기준 (pone 폴더에서 실행)
const ROOT_DIR = path.resolve(".");
const BLOG_DIR = path.join(ROOT_DIR, "blog");
const POSTS_META_JSON = path.join(BLOG_DIR, "posts-meta.json");

// 간단 지역 → 영문 매핑
const REGION_EN_MAP = {
  "부천": "bucheon",
  "의정부": "uijeongbu",
  "남원": "namwon",
  "통영": "tongyeong",
};

function toRegionSlug(region) {
  return REGION_EN_MAP[region] || region || "region";
}

async function fileExists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await fileExists(BLOG_DIR))) {
    console.log("blog 폴더가 없습니다.");
    return;
  }

  // 1) posts-meta 로드
  let meta = [];
  if (await fileExists(POSTS_META_JSON)) {
    const raw = await fs.promises.readFile(POSTS_META_JSON, "utf8");
    try {
      meta = JSON.parse(raw);
    } catch {
      meta = [];
    }
  }

  const allFiles = await fs.promises.readdir(BLOG_DIR);
  const targetFiles = allFiles.filter((f) =>
    /^\d{4}-\d{2}-\d{2}---\d+\.html$/.test(f)
  );

  if (!targetFiles.length) {
    console.log("변경 대상 파일이 없습니다.");
    return;
  }

  for (const oldName of targetFiles) {
    const oldPath = path.join(BLOG_DIR, oldName);
    const html = await fs.promises.readFile(oldPath, "utf8");

    const regionMatch = html.match(/<span class="badge">([^<]+)<\/span>/i);
    const region = regionMatch ? regionMatch[1].trim() : "";
    const regionSlug = toRegionSlug(region);

    const date = oldName.slice(0, 10); // YYYY-MM-DD
    const numMatch = oldName.match(/---(\d+)\.html$/);
    const index = numMatch ? numMatch[1] : "1";

    const newName = `${date}-${regionSlug}-phonetech-${index}.html`;
    const canonicalPath = `/blog/${newName}`;
    const newPath = path.join(BLOG_DIR, newName);

    // canonical / og:url 교체
    let newHtml = html
      .replace(
        /href="https?:\/\/[^"]+\/blog\/[^"]+"/g,
        `href="https://폰테크.shop${canonicalPath}"`
      )
      .replace(
        /content="https?:\/\/[^"]+\/blog\/[^"]+"/g,
        `content="https://폰테크.shop${canonicalPath}"`
      );

    await fs.promises.writeFile(newPath, newHtml, "utf8");
    await fs.promises.unlink(oldPath);

    // posts-meta 갱신
    meta = meta.map((p) => {
      if (p.fileName === oldName || p.url === `/blog/${oldName}`) {
        return {
          ...p,
          fileName: newName,
          url: canonicalPath,
        };
      }
      return p;
    });

    console.log(`✅ ${oldName} → ${newName}`);
  }

  await fs.promises.writeFile(
    POSTS_META_JSON,
    JSON.stringify(meta, null, 2),
    "utf8"
  );
  console.log("📝 posts-meta.json 갱신 완료");
}

main().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});

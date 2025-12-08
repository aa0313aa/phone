# 블로그 글 작성 가이드

## 📝 새 글 작성 방법

### 1. 템플릿 복사

1. `_blog-template.html` 파일을 복사
2. 새로운 파일명으로 저장 (예: `blog-phonetech-news-20251114.html`)

### 2. 대표 이미지 설정

#### 방법 A: CSS 아이콘 이미지 (기본)

```html
<div
  class="bg-primary rounded d-flex align-items-center justify-content-center text-white mb-4"
  style="height: 400px;"
>
  <div class="text-center">
    <i class="bi bi-[아이콘명]" style="font-size: 5rem;"></i>
    <div class="mt-3 h4">[제목]</div>
    <div class="small">[부제목]</div>
  </div>
</div>
```

#### 방법 B: 실제 이미지 업로드

1. `assets/img/blog/` 폴더에 이미지 업로드
2. 템플릿의 이미지 부분을 다음과 같이 교체:

```html
<img
  src="assets/img/blog/[이미지파일명].jpg"
  alt="[이미지 설명]"
  class="img-fluid rounded mb-4"
/>
```

#### 추천 아이콘들:

- `bi-shield-check` - 안전/보안 관련
- `bi-book` - 가이드/설명서
- `bi-lightbulb` - 팁/아이디어
- `bi-graph-up` - 성과/수익
- `bi-phone` - 폰테크 관련
- `bi-cash-stack` - 돈/수익
- `bi-clock` - 신속함/당일
- `bi-people` - 고객/서비스

### 2. 메타 정보 수정

```html
<title>[실제 글 제목] - 전국모바일</title>
<meta name="description" content="[글 요약 설명 (150자 내외)]" />
<meta name="keywords" content="폰테크,비대면,[추가 키워드]" />
```

### 3. Open Graph 정보 수정

```html
<meta property="og:url" content="https://폰테크.shop/[실제파일명].html" />
<meta property="og:title" content="[실제 글 제목] - 전국모바일" />
<meta property="og:description" content="[글 요약 설명]" />
```

### 4. 구조화 데이터 수정

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "[실제 글 제목]",
    "description": "[글 설명]",
    "datePublished": "2025-11-14",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://폰테크.shop/[실제파일명].html"
    }
  }
</script>
```

### 5. 본문 작성

- `[글 제목을 여기에 입력하세요]` → 실제 글 제목
- `[글의 간단한 요약...]` → 실제 요약
- `[첫 번째 소제목]` → 실제 소제목들
- `[내용...]` → 실제 글 내용

### 6. 카테고리 및 태그 설정

- 카테고리: 폰테크 가이드, 안전 이용팁, 업계 뉴스, 고객 후기
- 태그: #폰테크, #비대면, #당일현금지급, #휴대폰내구제 등

## 🎯 SEO 최적화 팁

### 제목 작성 규칙

- 주요 키워드 포함 (폰테크, 비대면, 당일현금지급 등)
- 60자 이내로 작성
- 구체적이고 명확한 제목

### 메타 설명 작성

- 150자 내외로 작성
- 키워드 자연스럽게 포함
- 클릭을 유도하는 매력적인 문구

### 본문 작성 가이드

- H1 (제목) 1개, H2-H6 적절히 사용
- 키워드 밀도 2-3% 유지
- 내부링크 2-3개 포함
- 이미지에 alt 태그 필수

## 📚 블로그 글 목록 업데이트

새 글 작성 후 `blog.html` 파일 수정:

```html
<!-- 새 글을 맨 위에 추가 -->
<article class="card mb-4">
  <div class="card-body">
    <div class="row">
      <div class="col-md-4">
        <!-- 방법 A: CSS 아이콘 이미지 -->
        <div
          class="bg-[색상] rounded d-flex align-items-center justify-content-center text-white"
          style="height: 200px;"
        >
          <div class="text-center">
            <i class="bi bi-[아이콘]" style="font-size: 3rem;"></i>
            <div class="mt-2 fw-bold">[간단한 제목]</div>
          </div>
        </div>

        <!-- 방법 B: 실제 이미지 (선택사항) -->
        <!-- <img src="assets/img/blog/[이미지].jpg" alt="[설명]" class="img-fluid rounded"> -->
      </div>
      <div class="col-md-8">
        <h3 class="card-title h5 fw-bold">
          <a href="[파일명].html" class="text-decoration-none">[글 제목]</a>
        </h3>
        <p class="card-text text-muted">[글 요약]</p>
        <div class="d-flex align-items-center text-muted small">
          <i class="bi bi-calendar3 me-2"></i>
          <span>[날짜]</span>
          <span class="mx-2">•</span>
          <i class="bi bi-eye me-2"></i>
          <span>[읽기시간]</span>
          <span class="mx-2">•</span>
          <span class="badge bg-[색상]">[카테고리]</span>
        </div>
      </div>
    </div>
  </div>
</article>
```

### 색상 가이드:

- `bg-primary` (파란색) - 일반 정보
- `bg-success` (초록색) - 가이드/성공 사례
- `bg-warning` (노란색) - 주의사항/팁
- `bg-danger` (빨간색) - 긴급/중요
- `bg-info` (청록색) - 뉴스/업데이트
- `bg-dark` (검은색) - 전문가 의견

## 🔗 내비게이션 업데이트

모든 페이지의 네비게이션에 블로그 링크가 추가되었습니다:

```html
<li class="nav-item"><a class="nav-link" href="blog.html">블로그</a></li>
```

## 📋 체크리스트

글 발행 전 확인사항:

- [ ] 메타 정보 모두 수정
- [ ] 구조화 데이터 업데이트
- [ ] 이미지에 alt 태그 추가
- [ ] 내부링크 2-3개 포함
- [ ] blog.html 목록 업데이트
- [ ] 사이트맵 업데이트 (필요시)
- [ ] 맞춤법 및 문법 검사
- [ ] 모바일 반응형 확인

## 💡 콘텐츠 아이디어

### 추천 주제들

1. **폰테크 관련**
   - 폰테크 비대면 최신 동향
   - 시즌별 폰테크 팁
   - 폰테크 성공 사례

2. **안전 및 주의사항**
   - 사기 업체 구별법
   - 안전한 거래 방법
   - 법적 주의사항

3. **업계 정보**
   - 통신사별 정책 변화
   - 새로운 서비스 소개
   - 시장 분석

4. **고객 서비스**
   - 자주 묻는 질문
   - 고객 후기 (개인정보 보호)
   - 이용 가이드

## 🚀 발행 후 할 일

1. **소셜미디어 공유** (있다면)
2. **Google Search Console에 색인 요청**
3. **기존 글에서 새 글로 내부링크 추가**
4. **성과 모니터링** (방문자, 체류시간 등)

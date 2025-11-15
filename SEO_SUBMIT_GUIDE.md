# Search Indexing & DNS Submission Guide

이 문서는 `폰테크.shop` 도메인을 구글과 네이버에 빠르게 색인(등록)하기 위한 단계별 가이드입니다.

1) DNS 설정 확인 (도메인 소유자 필요)
- GitHub Pages로 서비스할 경우(루트 도메인): A 레코드로 GitHub Pages의 IP를 설정하거나 `ALIAS`/`ANAME`을 사용합니다.
  - 권장 A 레코드(예시, GitHub 가이드 확인 필요): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- 서브도메인(`www`)을 사용하는 경우: `CNAME` 레코드로 `username.github.io` 또는 레포지토리 페이지로 포인팅.
- DNS 변경 후 `nslookup 폰테크.shop` 또는 `ping 폰테크.shop`으로 정상 응답 확인.

2) GitHub Pages 확인
- 리포지토리에 `CNAME` 파일이 존재하는지 확인(`폰테크.shop`).
- 브라우저에서 `https://폰테크.shop/` 접속 시 사이트가 정상 노출되는지 확인.

3) Google Search Console
- 권장: "도메인 속성(Domain)"으로 소유권 확인 (DNS TXT 레코드 필요).
  - Search Console에서 도메인 속성 등록 → 제공되는 TXT 레코드를 도메인 DNS에 추가 → 검증
  - 자세한 예시:
    1. Search Console → '속성 추가' → '도메인' 선택 → `폰테크.shop` 입력.
    2. 화면에서 제시하는 `DNS TXT` 레코드 값을 복사합니다. 예시: `google-site-verification=abcd1234example` (실제 값은 콘솔에서 확인).
    3. 도메인 관리자(등록기관)의 DNS 설정에서 TXT 레코드를 추가합니다. (레코드 이름: `@` 또는 비워둠; 값: 위에서 복사한 전체 문자열)
    4. DNS 전파(보통 수분~최대 48시간) 이후 Search Console에서 '확인'을 클릭합니다.
    5. 확인되면 'Sitemaps'에 `https://폰테크.shop/sitemap.xml` 제출.

  - 팁: DNS TXT 추가 후 `nslookup -type=txt 폰테크.shop`로 TXT 레코드가 보이는지 확인하세요.
- 사이트 소유권이 확인되면: `Sitemaps` 메뉴에 `https://폰테크.shop/sitemap.xml` 제출
- 중요: 제출 후 `URL 검사`에서 주요 페이지(홈, 블로그, 글)를 개별적으로 검사하고 `색인 요청`을 클릭하면 색인 속도를 높일 수 있습니다.

4) Naver(네이버) 웹마스터 도구
- Naver Search Advisor(웹마스터 도구)에 로그인 → 사이트 등록
- DNS 방식 또는 HTML 파일 업로드 방식으로 소유권 확인
- 사이트맵 제출: `https://폰테크.shop/sitemap.xml` 입력
- 색인 요청: 주요 URL을 수동으로 제출 가능(네이버는 반영에 시간이 더 걸릴 수 있음)

5) 권장 색인 제출 목록(우선순위)
- `/` (홈)
- `/phonetech-guide.html`
- `/phonetech-tips.html`
- `/blog-phonetech-20251115.html`
- `/blog-phonetech-safety-20251115.html`
- 서비스/문의/약관 관련 주요 페이지

6) 모니터링
- Search Console: Coverage(색인 상태), Performance(노출/클릭), URL 검사 사용
- Naver: 사이트 진단 및 색인 상태 확인

7) 추가 권장 작업
- Robots.txt에 사이트맵 경로가 명확히 있어야 합니다(이미 적용됨).
- RSS 구독자·포털(예: 네이버 블로그) 및 소셜 채널에 게시해 외부 반응(백링크)을 유도하면 색인 속도·노출에 긍정적입니다.
- 사이트 속도 최적화(이미지 WebP 변환, lazy-loading 적용, 캐시 정책 강화)는 검색 순위에 도움됩니다.

---

문서 필요 시 제가 Google Search Console 등록 단계(도메인 속성 추가 및 DNS TXT 레코드 예시)와 Naver 업로드(HTML 파일 업로드용 예시)까지 자세히 작성해 드리겠습니다.
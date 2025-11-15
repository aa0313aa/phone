# RSS 등록 및 피드 배포 가이드

이 문서는 `rss.xml`을 외부 피드 리더·디렉토리·포털에 등록하는 방법을 정리합니다. 자동으로 등록해 주는 서비스는 대부분 계정 필요하므로, 아래 절차를 따라 직접 등록하세요.

1) Feed 확인
- RSS가 올바른지 확인: `https://폰테크.shop/rss.xml` 을 브라우저에서 열거나, Feed Validator(https://validator.w3.org/feed/)로 검증하세요.

2) Feedly에 추가(사용자 중심)
- Feedly는 수동 구독 서비스입니다. 사용자가 Feedly에 RSS 주소를 추가하면 구독됩니다.
- 조직 계정으로 모니터링하려면 Feedly Pro 사용을 고려하세요.

3) Feedspot/Feedreader 디렉토리 등록
- Feedspot, Bloglovin 같은 디렉토리에 사이트를 등록하면 트래픽/발견 가능성이 올라갑니다. 각 사이트에서 'Submit a Feed' 또는 'Add Site' 항목을 찾아 URL 제출.

4) Bing Webmaster Tools
- Bing에도 사이트 등록 권장: https://www.bing.com/webmasters
- 사이트 추가 → sitemap 제출 또는 RSS URL 제출 가능.

5) 네이버(포털) 노출 방법
- 네이버 웹마스터 도구에 사이트 등록 후 사이트맵 제출이 우선입니다.
- 별도의 RSS 제출 인터페이스는 없지만, 네이버 블로그/카페 등에 RSS를 공유하거나 자동 포스팅 봇을 설정하면 노출에 도움됩니다.

6) 자동 포스팅(선택적)
- Zapier/IFTTT를 사용해 RSS 새 항목이 올라올 때마다 네이버 블로그(또는 다른 채널)에 자동으로 포스팅할 수 있습니다. 다만 네이버는 API 접근이 제한적이므로 중간 서비스(예: 구글 스프레드시트 + 크롤러)를 사용할 수 있습니다.

7) 모니터링
- Feedly나 Feedspot에서 새 구독자나 트래픽 변화를 확인하고, Search Console/Bing Webmaster에서 유입 변화를 모니터링하세요.

문서 보완 필요 시, 특정 서비스 등록 절차(예: Feedspot 등록 폼 단계별 채우기)를 상세히 작성해 드리겠습니다.
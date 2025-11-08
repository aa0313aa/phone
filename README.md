# 전국모바일 홈페이지 (정적 사이트)

두 참고 사이트(폰테크천국, 폰테크나라)의 구조를 벤치마킹하여, 저작권을 침해하지 않는 선에서 비슷한 구성/레이아웃을 가진 정적 웹사이트 템플릿입니다.

## 구성
- index.html: 메인(히어로, 예약 현황 예시, 이용후기 캐러셀, 매입가 카드, 주의사항, CTA)
- services.html: 서비스/특장점/간단 견적표 예시
- information.html: 폰테크 개요/업체선정/미납정리/주의사항/절차
- about.html: 회사 소개/가치/기본 정보 (+ 빠른 연결 버튼)
- contact.html: 문의/상담 예약(프론트엔드 검증만 포함)
- assets/css/styles.css: 커스텀 스타일
- assets/js/main.js: 작은 UX 스크립트(맨 위로 등)
- assets/img/favicon.svg: 파비콘(자유 사용 가능)

## 로컬 미리보기
웹서버 없이도 파일을 더블클릭하면 브라우저로 열 수 있습니다.

## GitHub Pages로 배포하기
1) 새 GitHub 저장소 생성 (예: `yourname/phone-site`)
2) 현재 폴더를 Git 초기화 후 원격에 푸시 (Windows PowerShell)

```powershell
# 저장소 초기화 및 커밋
git init
git add .
git commit -m "init: jeonguk-mobile static site"

# 원격 추가 및 푸시 (URL은 본인 저장소로 변경)
git remote add origin https://github.com/USER/REPO.git
git branch -M main
git push -u origin main
```

3) GitHub 웹에서 Settings → Pages → Source를 "Deploy from a branch"로 선택하고, Branch는 `main` / 폴더는 `/ (root)`로 저장.
4) 잠시 후 `https://USER.github.io/REPO/` 로 접속 확인.

### 사용자 지정 도메인
- 도메인이 있다면 Pages 설정에서 Custom domain을 추가하세요.
- DNS에 `CNAME` 레코드를 GitHub Pages 호스트로 연결해야 합니다.

## 커스터마이즈 방법
- 연락처/카카오톡 링크: 모든 페이지 상단/하단의 전화번호를 `tel:010-8290-9536`으로, 카톡 바로가기를 `http://pf.kakao.com/_gIKxnn/chat`으로 변경 완료. 채널/ID는 필요 시 수정.
- 색상/폰트: `assets/css/styles.css`의 CSS 변수/규칙을 수정하세요.
- 섹션 텍스트: 각 HTML의 문구는 임의 작성본이므로 회사 정책에 맞게 변경하세요.
- 이미지: 저작권 문제 없는 직접 촬영 이미지나 무료 아이콘(예: Bootstrap Icons)을 사용하세요.

## 백엔드 연동(선택)
- contact.html의 폼은 데모입니다. 실제 저장/전송은 서버 또는 Google Forms, Formspree 등의 서비스를 연결하여 구현하세요.
- Kakao JavaScript SDK를 사용하는 경우, `index.html` 내 `meta[name="kakao-app-key"]`와 `meta[name="kakao-channel-id"]` 값을 실제 앱 정보로 교체하세요.

## 라이선스
- 본 템플릿 소스는 MIT로 자유롭게 수정/배포 가능합니다. (단, 외부 CDN 라이브러리는 각 라이선스를 따릅니다.)

# Apps Script 설정 가이드 (웹 앱 → 스프레드시트 저장)

이 폴더에는 Google Apps Script 코드와 설정 방법이 포함되어 있습니다. 이 스크립트는 사이트 `contact.html` 폼에서 전송된 데이터를 Google 스프레드시트에 저장합니다.

## 준비물

- 스프레드시트 링크(예시):
  - https://docs.google.com/spreadsheets/d/13oFbFkTluFH_UpSiBcENzIAWy_7YeTRk3YGXxytnBig/edit
- 수신할 탭 이름: `responses` (없으면 자동 생성)

## 1) Apps Script 프로젝트 생성

1. 스프레드시트를 열고 상단 메뉴에서 확장 프로그램 → 앱스 스크립트.
2. 새 프로젝트가 열리면 `Code.gs` 파일 내용을 이 저장소의 `apps-script/Code.gs`로 교체(복사/붙여넣기).
3. `SPREADSHEET_ID` 값이 위 스프레드시트 ID와 일치하는지 확인합니다.

## 2) 배포(웹 앱)

1. 배포 → 새 배포 → 유형: 웹 앱.
2. 설명: 예) web v1
3. 실행 권한: 나(작성자)
4. 액세스 권한: 모두
5. 배포를 누르고 생성된 웹 앱 URL(…/exec)을 복사합니다.

## 3) 사이트에 연결

- `contact.html`의 폼 `action`에 위에서 복사한 웹 앱 URL을 설정합니다.
- 이 저장소의 `contact.html`은 이미 Apps Script URL로 POST를 보내고, 성공 시 `{ result: 'success' }` JSON을 기대합니다.

## 4) 필드 매핑

- 프론트 폼 name 값과 스크립트 파라미터 키가 동일해야 합니다.
  - 이름, 연락처, 문의유형, 통신사, 최근개통일, 미납연체, 지역, 희망진행방식, 상세내용

## 5) 점검/디버깅

- Apps Script → 실행 기록에서 로그/에러 확인.
- 배포 후 스크립트를 수정했다면, "새 버전으로 다시 배포"를 반드시 수행해야 최신 코드가 적용됩니다.

## 6) 선택: Discord Webhook 연동

`Code.gs`에 이미 `notifyDiscord`와 메시지 빌더가 포함되어 있습니다. Webhook URL은 스크립트 속성에 저장해야 합니다.

### 설정 방법

1. Apps Script 편집기 → 실행할 함수는 `testNotify` 선택 후 먼저 실행(필요시).
2. 왼쪽 사이드바 톱니바퀴(프로젝트 설정) 또는 `파일 → 프로젝트 속성` → 스크립트 속성 탭.
3. 새 Property 추가: 키 = `DISCORD_WEBHOOK_URL`, 값 = 디스코드 Webhook 전체 URL.
4. 저장 후 `testNotify` 실행 → 디스코드 채널에 테스트 메시지 수신 확인.
5. 이후 사용자가 `contact.html` 폼을 제출하면 `doPost`가 시트 저장 후 알림을 전송합니다.

### 메시지 포맷 예시

```
새 상담 요청이 접수되었습니다.
—
이름: 홍길동
연락처: 010-****-1234
유형: 비대면 개통
통신사: SKT
최근개통일: 2025-11-09
미납연체: 없음
지역: 서울 강남
희망진행방식: 비대면 개통
상세내용: 아이폰15 조건 문의
```

### 알림이 안 올 때 점검

| 항목               | 확인 방법                                                       |
| ------------------ | --------------------------------------------------------------- |
| Webhook URL 정상성 | 브라우저에서 GET은 안 되지만 curl POST로 204 응답 확인 가능     |
| 속성 키 철자       | `DISCORD_WEBHOOK_URL` 정확히 일치 여부                          |
| 실행 권한          | 웹 앱 배포가 "나"로 실행되는지                                  |
| 응답 형식          | doPost가 `{result:'success'}` JSON 반환하는지 (프론트에서 파싱) |
| 오류 로그          | Apps Script 실행 기록에서 에러 여부 확인                        |

### 보안 권장사항

- Webhook URL은 절대 코드에 직접 하드코딩하지 말고 Script Properties에만 저장.
- 필요 시 PropertiesService를 통해 교체 시 별도 로깅 없이 즉시 반영 가능.

## 7) CORS 관련

- FormData로 POST하는 경우 일반적으로 사전 요청(preflight) 없이 동작합니다.
- 응답은 JSON(`{ result: 'success' }`) 형태로 반환합니다.

---

문제 발생 시 스크린샷 또는 실행 기록 내용과 함께 알려주시면 원인 분석을 도와드립니다.

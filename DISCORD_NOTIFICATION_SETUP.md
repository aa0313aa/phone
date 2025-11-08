# Discord 자동 알림 설정 가이드

> 상담 신청서 제출 시 자동으로 Discord로 실시간 알림을 받는 방법

## 📋 전체 흐름
```
웹사이트 폼 제출 → Google Form → Apps Script → Discord 알림 (모바일 푸시)
```

---

## 1단계: Google Form 만들기 (2분)

### 1-1. 새 Form 생성
1. [Google Forms](https://forms.google.com) 접속
2. **"+ 새로 만들기"** 클릭
3. 제목: `전국모바일 상담 신청`

### 1-2. 질문 추가 (아래 항목 그대로 추가)

**질문 1: 이름**
- 유형: 단답형
- 필수 체크

**질문 2: 연락처**
- 유형: 단답형
- 필수 체크
- 설명: "010-1234-5678 형식"

**질문 3: 문의 유형**
- 유형: 객관식 질문
- 옵션: 
  - 비대면 개통
  - 매장 방문
  - 단말 매입
  - 일반 상담
- 필수 체크

**질문 4: 통신사**
- 유형: 객관식 질문
- 옵션: SKT, KT, LGU+, 알뜰/MVNO, 선택안함

**질문 5: 최근 개통일**
- 유형: 날짜
- 필수 아님

**질문 6: 미납/연체 여부**
- 유형: 객관식 질문
- 옵션: 없음, 소액 미납, 연체 있음

**질문 7: 지역**
- 유형: 단답형

**질문 8: 희망 진행 방식**
- 유형: 객관식 질문
- 옵션: 비대면 개통, 매장 방문, 택배 접수

**질문 9: 상세 내용**
- 유형: 장문형
- 필수 체크

### 1-3. Form URL 복사
- 우측 상단 **"보내기"** → **링크 아이콘** 클릭
- **"URL 단축"** 체크 해제
- URL 복사해두기 (예: `https://docs.google.com/forms/d/e/xxxxx/viewform`)

---

## 2단계: Apps Script로 Discord 연결 (10분)

### 2-1. Script 편집기 열기
1. Form 화면에서 우측 상단 **⋮ (더보기)** → **스크립트 편집기** 클릭
2. 새 창이 열림 (Apps Script 에디터)

### 2-2. 코드 붙여넣기

기존 `Code.gs` 내용을 모두 지우고 아래 코드를 붙여넣으세요:

\`\`\`javascript
// ⚙️ 설정: Discord Webhook URL (이미 설정됨)
const KAKAO_WEBHOOK_URL = "https://discord.com/api/webhooks/1436730569718239232/lT8cYH6l7nr8YP_OOu14uM_JcA1DnPK5Uo-13hGcAFDxZHKFuqD0ZFYgoY2iTY8hP7g2";

function onFormSubmit(e) {
  try {
    const responses = e.response.getItemResponses();
    
    // 응답 파싱
    const data = {};
    responses.forEach(item => {
      const title = item.getItem().getTitle();
      const answer = item.getResponse();
      data[title] = answer || '';
    });
    
    // Discord 메시지 내용 구성
    const message = `
🔔 **새 상담 신청이 접수되었습니다!**

📝 **이름:** ${data['이름'] || '-'}
📞 **연락처:** ${data['연락처'] || '-'}
📋 **문의 유형:** ${data['문의 유형'] || '-'}
📡 **통신사:** ${data['통신사'] || '-'}
📅 **최근 개통일:** ${data['최근 개통일'] || '-'}
💳 **미납/연체:** ${data['미납/연체 여부'] || '-'}
📍 **지역:** ${data['지역'] || '-'}
🚀 **희망 방식:** ${data['희망 진행 방식'] || '-'}

💬 **상세 내용:**
${data['상세 내용'] || '-'}

⏰ **접수 시간:** ${new Date().toLocaleString('ko-KR')}
`.trim();

    // Discord로 전송
    sendToDiscord(message);
    
    // 시트에도 자동 저장됨 (기본 기능)
    Logger.log('알림 전송 완료');
    
  } catch (error) {
    Logger.log('오류 발생: ' + error.toString());
  }
}

function sendToDiscord(message) {
  if (!KAKAO_WEBHOOK_URL || KAKAO_WEBHOOK_URL.includes("여기에")) {
    Logger.log('⚠️ Webhook URL을 설정하세요!');
    return;
  }
  
  const payload = {
    "content": message
  };
  
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    const response = UrlFetchApp.fetch(KAKAO_WEBHOOK_URL, options);
    Logger.log('Discord 전송 성공: ' + response.getResponseCode());
  } catch (e) {
    Logger.log('Discord 전송 실패: ' + e.toString());
  }
}

// 테스트 함수 (수동 실행용)
function testDiscordNotification() {
  const testMessage = "✅ **Discord 알림 테스트입니다!**\n전국모바일 상담 시스템이 정상 작동 중입니다.";
  sendToDiscord(testMessage);
  Logger.log('테스트 메시지 전송 완료');
}
\`\`\`

### 2-3. 트리거 설정
1. 좌측 메뉴에서 **⏰ 트리거** (시계 아이콘) 클릭
2. 우측 하단 **"+ 트리거 추가"** 클릭
3. 설정:
   - 실행할 함수: `onFormSubmit`
   - 이벤트 소스: `From form (폼에서)`
   - 이벤트 유형: `On form submit (폼 제출 시)`
4. **저장** 클릭
5. 권한 승인 (Google 계정 선택 → 고급 → 안전하지 않은 페이지로 이동 → 허용)

---

## 3단계: Discord Webhook URL 받기 ✅ 완료!

**귀하의 Webhook URL:**
```
https://discord.com/api/webhooks/1436730569718239232/lT8cYH6l7nr8YP_OOu14uM_JcA1DnPK5Uo-13hGcAFDxZHKFuqD0ZFYgoY2iTY8hP7g2
```

### 📱 모바일 알림 설정 (선택)
1. 스마트폰에 **Discord 앱** 설치
2. 같은 계정으로 로그인
3. 알림 허용
4. 이제 상담 신청이 오면 폰으로 즉시 푸시! 🔔

---

## 4단계: Webhook URL 적용

### 4-1. Apps Script에 URL 입력
1. Apps Script 편집기로 돌아가기
2. 첫 줄 `KAKAO_WEBHOOK_URL` 값에 3단계에서 받은 URL 붙여넣기
   ```javascript
   const KAKAO_WEBHOOK_URL = "https://your-webhook-url";
   ```
3. **저장** (Ctrl+S)

### 4-2. 테스트
1. 상단 함수 선택: `testDiscordNotification`
2. **▶ 실행** 클릭
3. Discord에 테스트 메시지가 오면 성공! ✅

---

## 5단계: 웹사이트 폼 연결 (자동 완료)

> 이 부분은 제가 `contact.html` 코드를 수정해서 자동으로 Google Form에 제출되도록 만들어 드릴게요.

완료되면:
- 사용자가 웹사이트에서 "제출" 버튼 클릭
- → 자동으로 Google Form에 제출
- → Apps Script가 감지
- → **Discord로 즉시 알림 전송** (모바일 푸시 포함)
- → Google Sheets에 자동 저장

---

## ✅ 완료 후 확인 사항

1. **웹사이트에서 테스트 제출**
2. **알림 수신 확인**
3. **Google Sheets에서 데이터 확인**

---

## 🔧 문제 해결

### 알림이 안 와요
- Apps Script 로그 확인: 실행 로그 → 최근 실행 확인
- Webhook URL이 정확한지 확인
- 트리거가 활성화되어 있는지 확인

### 권한 오류
- Google 계정 → 보안 → 액세스 권한 확인
- Apps Script 권한 재승인

---

## 📞 다음 단계

Webhook URL을 받으시면 알려주세요!
제가 `contact.html`을 수정해서 Google Form과 자동 연동되도록 완성해드릴게요.

**필요하신 것:**
1. Google Form URL (1단계 완료 후)
2. Webhook URL (3단계 완료 후)

두 가지만 알려주시면 웹사이트 코드를 바로 수정해드립니다! 🚀

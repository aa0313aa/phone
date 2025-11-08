# Google Apps Script 웹 앱 배포 가이드

## 📌 개요
contact.html의 폼 제출을 직접 받아서 Discord로 알림을 보내는 웹 앱을 배포합니다.

---

## 🚀 배포 단계

### 1단계: Google Apps Script 편집기 열기

1. **Google Drive** 접속: https://drive.google.com
2. 기존 Google Form과 연결된 **Google Sheets** 열기
3. 상단 메뉴에서 **확장 프로그램** > **Apps Script** 클릭

---

### 2단계: 코드 업데이트

1. Apps Script 편집기에서 **Code.gs** 파일 열기
2. **전체 코드를 삭제**하고 아래 내용으로 **교체**:

```javascript
// Discord Webhook URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1436730569718239232/lT8cYH6l7nr8YP_OOu14uM_JcA1DnPK5Uo-13hGcAFDxZHKFuqD0ZFYgoY2iTY8hP7g2";

// 웹사이트에서 직접 제출받는 함수 (POST 요청 처리)
function doPost(e) {
  try {
    var params = e.parameter;
    
    var message = "🔔 **새 상담 신청이 접수되었습니다!**\n\n" +
      "📝 **이름:** " + (params['이름'] || '-') + "\n" +
      "📞 **연락처:** " + (params['연락처'] || '-') + "\n" +
      "📋 **문의 유형:** " + (params['문의유형'] || '-') + "\n" +
      "📡 **통신사:** " + (params['통신사'] || '-') + "\n" +
      "📅 **최근 개통일:** " + (params['최근개통일'] || '-') + "\n" +
      "💳 **미납/연체:** " + (params['미납연체'] || '-') + "\n" +
      "📍 **지역:** " + (params['지역'] || '-') + "\n" +
      "🚀 **희망 방식:** " + (params['희망진행방식'] || '-') + "\n\n" +
      "💬 **상세 내용:**\n" + (params['상세내용'] || '-') + "\n\n" +
      "⏰ **접수 시간:** " + new Date().toLocaleString('ko-KR');

    sendToDiscord(message);
    Logger.log('웹사이트 제출 - 알림 전송 완료');
    
    // 성공 응답 반환
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': '상담 신청이 접수되었습니다!'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('오류 발생: ' + error.toString());
    
    // 오류 응답 반환
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': '처리 중 오류가 발생했습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Google Form 제출 트리거 함수 (기존 유지)
function onFormSubmit(e) {
  try {
    var responses = e.response.getItemResponses();
    
    var data = {};
    responses.forEach(function(item) {
      var title = item.getItem().getTitle();
      var answer = item.getResponse();
      data[title] = answer || '';
    });
    
    var message = "🔔 **새 상담 신청이 접수되었습니다!**\n\n" +
      "📝 **이름:** " + (data['이름'] || '-') + "\n" +
      "📞 **연락처:** " + (data['연락처'] || '-') + "\n" +
      "📋 **문의 유형:** " + (data['문의 유형'] || '-') + "\n" +
      "📡 **통신사:** " + (data['통신사'] || '-') + "\n" +
      "📅 **최근 개통일:** " + (data['최근 개통일'] || '-') + "\n" +
      "💳 **미납/연체:** " + (data['미납/연체 여부'] || '-') + "\n" +
      "📍 **지역:** " + (data['지역'] || '-') + "\n" +
      "🚀 **희망 방식:** " + (data['희망 진행 방식'] || '-') + "\n\n" +
      "💬 **상세 내용:**\n" + (data['상세 내용'] || '-') + "\n\n" +
      "⏰ **접수 시간:** " + new Date().toLocaleString('ko-KR');

    sendToDiscord(message);
    Logger.log('Google Form - 알림 전송 완료');
    
  } catch (error) {
    Logger.log('오류 발생: ' + error.toString());
  }
}

function sendToDiscord(message) {
  var payload = {
    "content": message
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
    Logger.log('Discord 전송 성공: ' + response.getResponseCode());
  } catch (e) {
    Logger.log('Discord 전송 실패: ' + e.toString());
  }
}

function testDiscordNotification() {
  var testMessage = "✅ **Discord 알림 테스트입니다!**\n전국모바일 상담 시스템이 정상 작동 중입니다.";
  sendToDiscord(testMessage);
  Logger.log('테스트 메시지 전송 완료');
}
```

3. 상단의 **💾 저장** 버튼 클릭

---

### 3단계: 웹 앱으로 배포

1. Apps Script 편집기 **우측 상단**의 **배포** 버튼 클릭
2. **새 배포** 선택

3. 배포 설정:
   - **유형 선택**: ⚙️ 아이콘 클릭 → **웹 앱** 선택
   - **설명** (선택사항): "전국모바일 상담 신청 웹 앱"
   - **다음 사용자로 실행**: **나**
   - **액세스 권한**: **모든 사용자** ⚠️ 중요!

4. **배포** 버튼 클릭

5. **권한 부여 필요** 팝업이 나타나면:
   - **액세스 권한 부여** 클릭
   - Google 계정 선택
   - **고급** 클릭 (안전하지 않은 앱이라는 경고가 나올 수 있음)
   - **[프로젝트명](안전하지 않은 페이지)로 이동** 클릭
   - **허용** 클릭

6. **웹 앱 URL 복사**:
   ```
   https://script.google.com/macros/s/AKfy...../exec
   ```
   ⚠️ **이 URL을 반드시 복사해두세요!**

---

### 4단계: contact.html에 URL 적용

1. **contact.html** 파일 열기
2. 아래 부분을 찾기:
   ```html
   <form class="needs-validation" novalidate id="contactForm" method="POST" action="GOOGLE_APPS_SCRIPT_URL_HERE">
   ```

3. `GOOGLE_APPS_SCRIPT_URL_HERE`를 복사한 웹 앱 URL로 교체:
   ```html
   <form class="needs-validation" novalidate id="contactForm" method="POST" action="https://script.google.com/macros/s/AKfy...../exec">
   ```

4. 파일 저장

---

### 5단계: 테스트

1. **Live Server로 웹사이트 미리보기** (localhost:5500)
2. **문의/예약** 페이지로 이동
3. 폼 작성 후 **상담 신청하기** 버튼 클릭
4. **Discord 채널에서 알림 확인** ✅

---

## ⚠️ 문제 해결

### CORS 오류 발생 시
웹사이트에서 직접 제출할 때 CORS 오류가 발생할 수 있습니다.

**해결 방법**: JavaScript로 제출하지 말고 **폼의 기본 제출 방식** 사용

contact.html의 JavaScript 부분을 수정:

```javascript
// 기존 submit 이벤트 핸들러 제거하고 폼이 직접 제출되도록 허용
form.addEventListener('submit', function(e) {
  if (!form.checkValidity()) {
    e.preventDefault();
    form.classList.add('was-validated');
    return;
  }
  // 유효성 검사만 통과하면 폼이 자동 제출됨
  // Google Apps Script로 POST 요청 전송
});
```

### Discord 알림이 안 올 때
1. Apps Script 편집기의 **실행 로그** 확인 (Ctrl+Enter)
2. Discord Webhook URL이 정확한지 확인
3. `testDiscordNotification()` 함수 실행해서 테스트

---

## ✅ 완료!

이제 사용자가 웹사이트의 폼을 작성하면:
1. Google Apps Script가 데이터를 받음
2. 자동으로 Discord 알림 전송
3. 사용자에게 성공 메시지 표시

**두 번 작성할 필요 없이** 웹사이트에서 바로 제출 → Discord 알림! 🎉

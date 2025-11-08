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
    const response = UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
    Logger.log('Discord 전송 성공: ' + response.getResponseCode());
  } catch (e) {
    Logger.log('Discord 전송 실패: ' + e.toString());
  }
}

function testDiscordNotification() {
  const testMessage = "✅ **Discord 알림 테스트입니다!**\n전국모바일 상담 시스템이 정상 작동 중입니다.";
  sendToDiscord(testMessage);
  Logger.log('테스트 메시지 전송 완료');
}

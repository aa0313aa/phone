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
  const testMessage = "✅ **알림 테스트입니다!**\n전국모바일 상담 시스템이 정상 작동 중입니다.";
  sendToDiscord(testMessage);
  Logger.log('테스트 메시지 전송 완료');
}

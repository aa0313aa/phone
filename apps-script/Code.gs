// Google Apps Script: Web App doPost → Google Sheets append
// 스프레드시트 ID: 아래 값은 사용자 제공 링크에서 추출됨
// https://docs.google.com/spreadsheets/d/13oFbFkTluFH_UpSiBcENzIAWy_7YeTRk3YGXxytnBig/edit
var SPREADSHEET_ID = '13oFbFkTluFH_UpSiBcENzIAWy_7YeTRk3YGXxytnBig';
var SHEET_NAME = 'responses'; // 원하는 시트 탭 이름(없으면 자동 생성)

function doPost(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // 최초 1회 헤더 생성
    if (sh.getLastRow() === 0) {
      sh.appendRow([
        'timestamp','이름','연락처','문의유형','통신사',
        '최근개통일','미납연체','지역','희망진행방식','상세내용',
        'userAgent','ip'
      ]);
    }

    var userAgent = (e && e.headers && (e.headers['User-Agent'] || e.headers['user-agent'])) || '';
    var ip = (e && e.headers && (e.headers['X-Forwarded-For'] || e.headers['x-forwarded-for'])) || '';

    // 1) 스프레드시트 기록
    sh.appendRow([
      new Date(),
      p['이름'] || '',
      p['연락처'] || '',
      p['문의유형'] || '',
      p['통신사'] || '',
      p['최근개통일'] || '',
      p['미납연체'] || '',
      p['지역'] || '',
      p['희망진행방식'] || '',
      p['상세내용'] || '',
      userAgent,
      ip
    ]);

    // 2) Discord Webhook 알림(옵션) - 스크립트 속성에 DISCORD_WEBHOOK_URL 설정 필요
    try {
      notifyDiscord(buildDiscordMessage(p));
    } catch (notifyErr) {
      // 알림 실패는 저장 성공을 막지 않음
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Discord 메시지 구성(간단 text)
function buildDiscordMessage(p){
  var maskPhone = function(phone){
    if(!phone) return '';
    return String(phone).replace(/(\d{3})\d{2,4}(\d{4})/, '$1-****-$2');
  };
  var lines = [
    '새 상담 요청이 접수되었습니다.',
    '—',
    '이름: ' + (p['이름']||''),
    '연락처: ' + maskPhone(p['연락처']||''),
    '유형: ' + (p['문의유형']||''),
    '통신사: ' + (p['통신사']||''),
    '최근개통일: ' + (p['최근개통일']||''),
    '미납연체: ' + (p['미납연체']||''),
    '지역: ' + (p['지역']||''),
    '희망진행방식: ' + (p['희망진행방식']||''),
    '상세내용: ' + (p['상세내용']||'')
  ];
  return lines.join('\n');
}

// Discord Webhook 호출(스크립트 속성에 DISCORD_WEBHOOK_URL 저장 필요)
function notifyDiscord(message){
  var url = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!url) return;
  var payload = { content: message };
  var params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, params);
}

// 수동 테스트용(스크립트 편집기에서 실행)
function testNotify(){
  notifyDiscord('테스트 알림: Apps Script에서 보낸 메시지 입니다.');
}

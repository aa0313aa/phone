// Google Apps Script: Web App doPost → Google Sheets append + Discord 알림
// 설정 안내:
// 1) 프로젝트 설정 → 스크립트 속성 → 키: DISCORD_WEBHOOK_URL, 값: 디스코드 Webhook URL 전체 입력
// 2) (선택) 아래 DEFAULT_WEBHOOK_URL 상수에 값을 넣으면 속성 미설정 시 대체로 사용됩니다. 보안상 권장하지 않습니다.
// 3) 배포 → 새 배포(또는 기존 배포 업데이트) 후 contact.html의 action exec URL와 일치하는지 확인
// 스프레드시트 ID: 아래 값은 사용자 제공 링크에서 추출됨
// https://docs.google.com/spreadsheets/d/13oFbFkTluFH_UpSiBcENzIAWy_7YeTRk3YGXxytnBig/edit
var SPREADSHEET_ID = '13oFbFkTluFH_UpSiBcENzIAWy_7YeTRk3YGXxytnBig';
var SHEET_NAME = 'responses'; // 원하는 시트 탭 이름(없으면 자동 생성)
var DEFAULT_WEBHOOK_URL = ''; // 비워두세요. 꼭 필요할 때만 임시 사용.

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
      Logger.log('Discord 알림 예외: ' + notifyErr);
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
  var url = getWebhookUrl();
  if (!url){
    Logger.log('⚠️ DISCORD_WEBHOOK_URL 미설정(또는 DEFAULT_WEBHOOK_URL 비어있음)');
    return;
  }
  var payload = { content: message };
  var params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var res = UrlFetchApp.fetch(url, params);
  var code = res.getResponseCode();
  Logger.log('Discord 응답: ' + code);
  if (code >= 400){
    Logger.log('본문: ' + res.getContentText());
  }
}

function getWebhookUrl(){
  var prop = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (prop && prop.trim().length) return prop.trim();
  if (DEFAULT_WEBHOOK_URL && DEFAULT_WEBHOOK_URL.trim().length) return DEFAULT_WEBHOOK_URL.trim();
  return '';
}

// 수동 테스트용(스크립트 편집기에서 실행)
function testNotify(){
  notifyDiscord('테스트 알림: Apps Script에서 보낸 메시지 입니다.');
}

// 디버그: 속성에 Webhook 설정 여부 확인
function debugCheckWebhookProperty(){
  var url = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  Logger.log('DISCORD_WEBHOOK_URL: ' + (url ? '[SET]' : '[NOT SET]'));
}

// 디버그: 간단 텍스트 전송
function debugSendPlain(){
  var url = getWebhookUrl();
  if (!url){
    Logger.log('Webhook 미설정');
    return;
  }
  var payload = { content: '디버그: 간단 테스트 ' + new Date().toISOString() };
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  Logger.log('debugSendPlain 응답: ' + res.getResponseCode() + ' ' + res.getContentText());
}

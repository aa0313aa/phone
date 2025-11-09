// Google Apps Script 통합 버전: 웹앱 doPost + Google Form onFormSubmit + 시트 기록 + Discord 임베드 알림 + 중복 방지 + 디버그
// 설정:
// 1) 스크립트 속성 DISCORD_WEBHOOK_URL 에 Webhook URL 추가
// 2) (선택) SELF_WEBAPP_URL 속성에 본인 웹앱 exec URL 저장 후 testWebAppPost()로 내부 테스트 가능
// 3) 트리거: Form 또는 Spreadsheet 바운드 onFormSubmit 존재 확인
// 4) 배포 후 contact.html action과 exec URL 일치 여부 점검

var SPREADSHEET_ID = '13oFbFkTluFH_UpSiBcENzIAWy_7YeTRk3YGXxytnBig';
var SHEET_NAME = 'responses';
var DEDUPE_WINDOW_MS = 2 * 60 * 1000; // 2분 중복 방지
var PROP_WEBHOOK = 'DISCORD_WEBHOOK_URL';
var PROP_LAST_HASH = 'LAST_NOTIFICATION_HASH';
var PROP_LAST_TS = 'LAST_NOTIFICATION_TIME';

// ===== 웹앱 제출 처리 =====
function doPost(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow([
        'timestamp','이름','연락처','문의유형','통신사','최근개통일','미납연체','지역','희망진행방식','상세내용','userAgent','ip'
      ]);
    }
    var userAgent = (e && e.headers && (e.headers['User-Agent'] || e.headers['user-agent'])) || '';
    var ip = (e && e.headers && (e.headers['X-Forwarded-For'] || e.headers['x-forwarded-for'])) || '';
    sh.appendRow([
      new Date(), p['이름']||'', p['연락처']||'', p['문의유형']||'', p['통신사']||'', p['최근개통일']||'',
      p['미납연체']||'', p['지역']||'', p['희망진행방식']||'', p['상세내용']||'', userAgent, ip
    ]);
    var normalized = normalizeFields(p);
    if (isDuplicate(normalized)) {
      Logger.log('중복 제출 감지(웹앱)');
      return jsonOut({ result:'skip', reason:'duplicate' });
    }
    sendDiscordEmbed(normalized);
    return jsonOut({ result:'success' });
  } catch(err) {
    Logger.log('doPost 오류: ' + err);
    return jsonOut({ result:'error', message:String(err) });
  }
}

// ===== Google Form/Spreadsheet 트리거 =====
function onFormSubmit(e){
  try {
    var raw = parseFormEvent(e); // 객체 {제목:답변}
    var normalized = normalizeFields(raw);
    if (isDuplicate(normalized)) {
      Logger.log('중복 제출 감지(onFormSubmit)');
      return;
    }
    sendDiscordEmbed(normalized);
  } catch(err){
    Logger.log('onFormSubmit 오류: ' + err);
  }
}

// 이벤트 파서 (Form 또는 Spreadsheet namedValues)
function parseFormEvent(e){
  var out = {};
  if (!e) return out;
  if (e.response && typeof e.response.getItemResponses==='function'){
    e.response.getItemResponses().forEach(function(item){
      out[item.getItem().getTitle()] = item.getResponse();
    });
    return out;
  }
  if (e.namedValues){
    for (var k in e.namedValues){
      if (!Object.prototype.hasOwnProperty.call(e.namedValues,k)) continue;
      var v = e.namedValues[k];
      out[k] = Array.isArray(v)? (v[0]||'') : (v||'');
    }
  }
  return out;
}

// 필드 정규화 + 기본 구조
function normalizeFields(src){
  var get = function(list){
    for (var i=0;i<list.length;i++){
      var key = list[i];
      if (src.hasOwnProperty(key)) return String(src[key]||'');
    }
    return '';
  };
  var obj = {
    이름: get(['이름','성함','고객명']),
    연락처: maskPhone(get(['연락처','전화','전화번호','휴대폰','휴대폰 번호'])),
    문의유형: get(['문의유형','문의 유형','유형','상담유형']),
    통신사: get(['통신사','통신사명']),
    최근개통일: get(['최근개통일','최근 개통일','개통일']),
    미납연체: get(['미납연체','미납/연체 여부','미납/연체','연체 여부']),
    지역: get(['지역','거주지역','사는곳']),
    희망진행방식: get(['희망진행방식','희망 진행 방식','희망 방식','진행방식']),
    상세내용: get(['상세내용','상세 내용','문의내용','세부내용'])
  };
  return obj;
}

function maskPhone(phone){
  if(!phone) return '';
  var digits = String(phone).replace(/\D/g,'');
  var m = digits.match(/^(\d{3})(\d{2,4})(\d{4})$/);
  if (m) return m[1] + '-****-' + m[3];
  return String(phone).replace(/(\d{3})\d+(\d{2})/,'$1****$2');
}

// 중복 방지(이름+연락처+문의유형+상세내용 해시)
function isDuplicate(entry){
  try {
    var base = [entry.이름, entry.연락처, entry.문의유형, entry.상세내용].join('|');
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base);
    var hash = digest.map(function(b){
      b = b<0? b+256:b; var h=b.toString(16); return h.length===1?'0'+h:h;
    }).join('');
    var props = PropertiesService.getScriptProperties();
    var last = props.getProperty(PROP_LAST_HASH)||'';
    var ts = Number(props.getProperty(PROP_LAST_TS)||'0');
    var now = Date.now();
    var dup = (hash===last) && (now - ts < DEDUPE_WINDOW_MS);
    if(!dup){
      props.setProperty(PROP_LAST_HASH, hash);
      props.setProperty(PROP_LAST_TS, String(now));
    }
    return dup;
  } catch(e){ Logger.log('isDuplicate 오류: '+e); return false; }
}

// Discord 임베드 전송
function sendDiscordEmbed(data){
  var url = PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK);
  if(!url){ Logger.log('⚠️ Webhook 속성 미설정'); return; }
  var embed = {
    title: '새 상담 신청이 접수되었습니다',
    color: 0x5865F2,
    fields: [
      { name:'이름', value:safe(data.이름), inline:true },
      { name:'연락처', value:safe(data.연락처), inline:true },
      { name:'문의유형', value:safe(data.문의유형), inline:true },
      { name:'통신사', value:safe(data.통신사), inline:true },
      { name:'최근개통일', value:safe(data.최근개통일), inline:true },
      { name:'미납연체', value:safe(data.미납연체), inline:true },
      { name:'지역', value:safe(data.지역), inline:true },
      { name:'희망진행방식', value:safe(data.희망진행방식), inline:true },
      { name:'상세내용', value:multiline(data.상세내용), inline:false }
    ],
    footer: { text: '접수 시간: ' + formatTS(new Date()) }
  };
  var payload = { embeds:[embed] };
  try {
    var res = UrlFetchApp.fetch(url, {
      method:'post', contentType:'application/json', payload:JSON.stringify(payload), muteHttpExceptions:true
    });
    var code = res.getResponseCode();
    Logger.log('Discord 응답: '+code);
    if(code>=400) Logger.log('본문: '+res.getContentText());
  } catch(err){ Logger.log('Discord 전송 실패: '+err); }
}

function safe(v){ var s=(v==null?'':String(v).trim()); return s.length? s : '-'; }
function multiline(v){ var s=(v==null?'':String(v).trim()); if(!s) return '-'; return s.length>1000? s.slice(0,997)+'...' : s; }
function formatTS(d){ return Utilities.formatDate(d, Session.getScriptTimeZone()||'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'); }

// ===== 디버그 & 유틸 =====
function debugCheckWebhookProperty(){
  var url = PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK);
  Logger.log('DISCORD_WEBHOOK_URL: ' + (url? '[SET]':'[NOT SET]'));
}
function debugSendPlain(){
  var url = PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK);
  if(!url){ Logger.log('Webhook 미설정'); return; }
  var res = UrlFetchApp.fetch(url, { method:'post', contentType:'application/json', payload:JSON.stringify({ content:'디버그: '+new Date().toISOString() }), muteHttpExceptions:true });
  Logger.log('debugSendPlain 응답: '+res.getResponseCode()+' '+res.getContentText());
}
function testDiscordNotification(){
  sendDiscordEmbed({
    이름:'테스트', 연락처:maskPhone('01012345678'), 문의유형:'비대면 개통', 통신사:'KT', 최근개통일:'2025-11-09', 미납연체:'없음', 지역:'서울', 희망진행방식:'비대면', 상세내용:'임베드 테스트 메시지'
  });
}
function testWebAppPost(){
  var selfUrl = PropertiesService.getScriptProperties().getProperty('SELF_WEBAPP_URL');
  if(!selfUrl){ Logger.log('SELF_WEBAPP_URL 속성 없음'); return; }
  var resp = UrlFetchApp.fetch(selfUrl, { method:'post', payload:{ '이름':'웹앱테스트','연락처':'01022223333','문의유형':'비대면 개통','통신사':'SKT','최근개통일':'2025-11-09','미납연체':'없음','지역':'서울','희망진행방식':'비대면','상세내용':'웹앱 경로 테스트' }, muteHttpExceptions:true });
  Logger.log('testWebAppPost 응답코드: '+resp.getResponseCode());
  Logger.log('본문: '+resp.getContentText());
}
function jsonOut(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function testNotify(){ sendDiscordEmbed({ 이름:'홍길동', 연락처:maskPhone('01098765432'), 문의유형:'테스트', 통신사:'LGU+', 최근개통일:'2025-11-09', 미납연체:'없음', 지역:'부산', 희망진행방식:'택배', 상세내용:'간단 테스트'}); }


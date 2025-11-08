// ⚙️ 설정: Discord Webhook URL (이미 설정됨)
const KAKAO_WEBHOOK_URL = "https://discord.com/api/webhooks/1436730569718239232/lT8cYH6l7nr8YP_OOu14uM_JcA1DnPK5Uo-13hGcAFDxZHKFuqD0ZFYgoY2iTY8hP7g2";

/**
 * Google Forms onFormSubmit → Discord Webhook 업그레이드 버전
 * - 하드코딩된 Webhook URL 제거(스크립트 속성 사용)
 * - 필드명 변형(공백/슬래시 등) 자동 매핑
 * - 연락처 마스킹 처리
 * - 임베드 형식으로 가독성 향상
 * - 중복 방지(최근 2분 내 동일 내용은 알림 건너뜀)
 */

// 스크립트 속성 키명
var PROP_WEBHOOK_URL = 'DISCORD_WEBHOOK_URL';
var PROP_LAST_HASH = 'LAST_NOTIFICATION_HASH';
var PROP_LAST_TIME = 'LAST_NOTIFICATION_TIME'; // epoch millis

// Google Form 항목 제목 → 내부 표준 키 매핑
var KEY_MAP = {
  '이름': ['이름'],
  '연락처': ['연락처', '전화', '전화번호', '휴대폰', '휴대폰 번호'],
  '문의유형': ['문의 유형', '문의유형'],
  '통신사': ['통신사'],
  '최근개통일': ['최근 개통일', '최근개통일'],
  '미납연체': ['미납/연체 여부', '미납연체'],
  '지역': ['지역'],
  '희망진행방식': ['희망 진행 방식', '희망진행방식'],
  '상세내용': ['상세 내용', '상세내용']
};

function onFormSubmit(e) {
  try {
    var dataRaw = parseFormResponse(e);
    var data = normalizeData(dataRaw);
    var masked = Object.assign({}, data, { 연락처: maskPhone(data.연락처) });

    // 중복 방지: 동일 내용이 최근 WINDOW_MS내 재도착하면 스킵
    if (isDuplicate(masked)) {
      Logger.log('중복 제출 감지: 알림 전송 생략');
      return;
    }

    var message = buildDiscordEmbed(masked);
    notifyDiscord(message);

    // Google Form 연결시트에는 기본적으로 응답이 저장됩니다.
    Logger.log('알림 전송 완료');
  } catch (error) {
    Logger.log('오류 발생: ' + error.toString());
  }
}

// Google Form 응답 파싱
function parseFormResponse(e){
  var out = {};
  if (!e || !e.response) return out;
  var responses = e.response.getItemResponses();
  responses.forEach(function(item){
    var title = item.getItem().getTitle();
    var answer = item.getResponse();
    out[title] = (answer == null ? '' : String(answer));
  });
  return out;
}

// 다양한 제목을 내부 표준 키로 정규화
function normalizeData(raw){
  var result = {
    이름: '', 연락처: '', 문의유형: '', 통신사: '', 최근개통일: '',
    미납연체: '', 지역: '', 희망진행방식: '', 상세내용: ''
  };
  for (var stdKey in KEY_MAP){
    var candidates = KEY_MAP[stdKey];
    for (var i=0; i<candidates.length; i++){
      var t = candidates[i];
      if (raw.hasOwnProperty(t)){
        result[stdKey] = raw[t] || '';
        break;
      }
    }
  }
  return result;
}

function maskPhone(phone){
  if (!phone) return '';
  return String(phone).replace(/(\d{3})\d{2,4}(\d{4})/, '$1-****-$2');
}

// 중복 감지: 최근 2분 이내 동일 페이로드면 중복 처리
function isDuplicate(data){
  var props = PropertiesService.getScriptProperties();
  var windowMs = 2 * 60 * 1000; // 2분
  var base = [
    data.이름, data.연락처, data.문의유형, data.통신사,
    data.최근개통일, data.미납연체, data.지역, data.희망진행방식, data.상세내용
  ].join('|');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base);
  var hash = digest.map(function(b){
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0'+v : v;
  }).join('');

  var lastHash = props.getProperty(PROP_LAST_HASH) || '';
  var lastTime = parseInt(props.getProperty(PROP_LAST_TIME) || '0', 10);
  var now = Date.now();

  var dup = (hash === lastHash) && (now - lastTime < windowMs);
  if (!dup){
    props.setProperty(PROP_LAST_HASH, hash);
    props.setProperty(PROP_LAST_TIME, String(now));
  }
  return dup;
}

// Discord 임베드 페이로드 구성
function buildDiscordEmbed(p){
  var tz = Session.getScriptTimeZone() || 'Asia/Seoul';
  var ts = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
  var color = 0x5865F2; // Discord blurple
  return {
    username: '전국모바일 알림',
    embeds: [{
      title: '새 상담 신청이 접수되었습니다',
      color: color,
      fields: [
        { name: '이름', value: safeField(p.이름), inline: true },
        { name: '연락처', value: safeField(p.연락처), inline: true },
        { name: '문의유형', value: safeField(p.문의유형), inline: true },
        { name: '통신사', value: safeField(p.통신사), inline: true },
        { name: '최근개통일', value: safeField(p.최근개통일), inline: true },
        { name: '미납연체', value: safeField(p.미납연체), inline: true },
        { name: '지역', value: safeField(p.지역), inline: true },
        { name: '희망진행방식', value: safeField(p.희망진행방식), inline: true },
        { name: '상세내용', value: safeMultiline(p.상세내용), inline: false }
      ],
      footer: { text: '접수 시간: ' + ts }
    }]
  };
}

function safeField(v){
  var s = (v == null ? '' : String(v).trim());
  return s.length ? s : '-';
}
function safeMultiline(v){
  var s = (v == null ? '' : String(v)).trim();
  if (!s.length) return '-';
  // 임베드 필드 길이 제한 대비, 너무 길면 잘라내기
  var max = 1000;
  return s.length > max ? s.slice(0, max-3) + '...' : s;
}

function notifyDiscord(payload){
  var url = PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK_URL);
  if (!url){
    Logger.log('⚠️ Webhook URL이 설정되지 않았습니다. 프로젝트 속성에 ' + PROP_WEBHOOK_URL + ' 키를 추가하세요.');
    return;
  }
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  try {
    var res = UrlFetchApp.fetch(url, options);
    Logger.log('Discord 응답: ' + res.getResponseCode());
    // 204(No Content) 또는 200 OK 등
  } catch (err) {
    Logger.log('Discord 전송 실패: ' + err);
  }
}

// 수동 테스트용
function testDiscordNotification(){
  var p = {
    이름: '홍길동', 연락처: '01012345678', 문의유형: '비대면 개통', 통신사: 'SKT',
    최근개통일: '2025-11-09', 미납연체: '없음', 지역: '서울 강남', 희망진행방식: '비대면', 상세내용: '아이폰15 조건 문의'
  };
  var msg = buildDiscordEmbed(Object.assign({}, p, { 연락처: maskPhone(p.연락처) }));
  notifyDiscord(msg);
  Logger.log('테스트 메시지 전송 요청 완료');
}

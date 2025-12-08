/**
 * 설정 가이드(복붙용 요약)
 * 1) 스크립트 속성 등록: 프로젝트 속성 → 스크립트 속성 →
 *    - 키: DISCORD_WEBHOOK_URL
 *    - 값: 디스코드 Webhook 전체 URL
 * 2) 트리거: Google Form 연결 상태에서 onFormSubmit 트리거 자동 실행
 *    - 필요 시 Triggers(시계 아이콘)에서 "양식 제출 시 → onFormSubmit" 확인
 * 3) 테스트:
 *    - testDiscordNotification() 실행 → 디스코드 채널에 테스트 임베드가 도착하면 OK
 * 4) 필드 매핑:
 *    - 폼 항목 제목이 약간 달라도 정상 매핑되도록 KEY_MAP에 후보가 등록되어 있음
 *      (이름/연락처/문의유형/통신사/최근개통일/미납연체/지역/희망진행방식/상세내용)
 * 5) 주의:
 *    - 하드코딩된 Webhook(URL) 사용 금지 → 반드시 DISCORD_WEBHOOK_URL 속성 사용
 *    - 중복 방지: 최근 2분 내 동일 내용은 알림이 스킵됩니다
 * 6) 시트 저장:
 *    - Google Form 자체가 연결된 응답 시트에 자동 저장하므로 별도 append 코드 불필요
 *    - 추가 컬럼(예: 처리상태)을 자동 생성/관리하려면 추후 확장 함수 addStatusColumn() 등 추가 가능
 */

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
  이름: ['이름'],
  연락처: ['연락처', '전화', '전화번호', '휴대폰', '휴대폰 번호'],
  문의유형: ['문의 유형', '문의유형'],
  통신사: ['통신사'],
  최근개통일: ['최근 개통일', '최근개통일'],
  미납연체: ['미납/연체 여부', '미납연체', '미납/연체'],
  지역: ['지역'],
  희망진행방식: ['희망 진행 방식', '희망진행방식', '희망 방식'],
  상세내용: ['상세 내용', '상세내용'],
};

// 웹앱 URL 자체 테스트용 (원하면 Script Properties에 SELF_WEBAPP_URL로 저장 후 사용)
function testWebAppPost() {
  var selfUrl =
    PropertiesService.getScriptProperties().getProperty('SELF_WEBAPP_URL');
  if (!selfUrl) {
    Logger.log(
      'SELF_WEBAPP_URL 속성이 없습니다. 프로젝트 속성에 추가하거나 함수 내에 직접 URL을 넣으세요.'
    );
    return;
  }
  var payload = {
    이름: '웹앱테스트',
    연락처: '01022223333',
    문의유형: '비대면 개통',
    통신사: 'KT',
    최근개통일: '2025-11-09',
    미납연체: '없음',
    지역: '서울',
    희망진행방식: '비대면',
    상세내용: '웹앱 doPost 경로 테스트입니다.',
  };
  var resp = UrlFetchApp.fetch(selfUrl, {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true,
  });
  Logger.log('testWebAppPost 응답코드: ' + resp.getResponseCode());
  Logger.log('본문: ' + resp.getContentText());
}

// 웹사이트(Web App) POST 제출 처리
function doPost(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var raw = {};
    for (var k in params) {
      if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
      raw[k] = String(params[k] == null ? '' : params[k]);
    }
    var data = normalizeData(raw);
    var masked = Object.assign({}, data, { 연락처: maskPhone(data.연락처) });

    if (isDuplicate(masked)) {
      Logger.log('중복 제출 감지(웹앱): 알림 전송 생략');
      return ContentService.createTextOutput(
        JSON.stringify({ result: 'skip', reason: 'duplicate' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var message = buildDiscordEmbed(masked);
    notifyDiscord(message);
    Logger.log('웹앱 알림 전송 완료');
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost 오류: ' + (err && err.stack ? err.stack : err));
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function onFormSubmit(e) {
  try {
    var dataRaw = parseFormResponse(e);
    if (!dataRaw || Object.keys(dataRaw).length === 0) {
      Logger.log(
        'onFormSubmit 호출됨, 그러나 e.response가 없거나 응답 항목이 비어 있습니다. 트리거가 "From form → On form submit"인지 확인하세요.'
      );
    }
    var data = normalizeData(dataRaw);
    var masked = Object.assign({}, data, { 연락처: maskPhone(data.연락처) });

    if (isDuplicate(masked)) {
      Logger.log('중복 제출 감지: 알림 전송 생략');
      return;
    }

    var message = buildDiscordEmbed(masked);
    notifyDiscord(message);
    Logger.log('알림 전송 완료');
  } catch (error) {
    Logger.log('오류 발생: ' + (error && error.stack ? error.stack : error));
  }
}

// Google Form 응답 파싱
function parseFormResponse(e) {
  var out = {};
  if (!e) return out;
  // 1) Form submit event (preferred)
  if (e.response && typeof e.response.getItemResponses === 'function') {
    var responses = e.response.getItemResponses();
    responses.forEach(function (item) {
      var title = item.getItem().getTitle();
      var answer = item.getResponse();
      out[title] = answer == null ? '' : String(answer);
    });
    return out;
  }
  // 2) Spreadsheet on form submit event fallback (e.namedValues)
  if (e.namedValues) {
    // namedValues: { "질문 제목": ["답변"] }
    for (var key in e.namedValues) {
      if (!Object.prototype.hasOwnProperty.call(e.namedValues, key)) continue;
      var val = e.namedValues[key];
      out[key] = Array.isArray(val) ? String(val[0] || '') : String(val || '');
    }
    return out;
  }
  return out;
}

// 다양한 제목을 내부 표준 키로 정규화
function normalizeData(raw) {
  var result = {
    이름: '',
    연락처: '',
    문의유형: '',
    통신사: '',
    최근개통일: '',
    미납연체: '',
    지역: '',
    희망진행방식: '',
    상세내용: '',
  };
  for (var stdKey in KEY_MAP) {
    var candidates = KEY_MAP[stdKey];
    for (var i = 0; i < candidates.length; i++) {
      var t = candidates[i];
      if (raw.hasOwnProperty(t)) {
        result[stdKey] = raw[t] || '';
        break;
      }
    }
  }
  return result;
}

function maskPhone(phone) {
  if (!phone) return '';
  var raw = String(phone);
  var digits = raw.replace(/\D/g, '');
  var m = digits.match(/^(\d{3})(\d{2,4})(\d{4})$/);
  if (m) return m[1] + '-****-' + m[3];
  // fallback: 최소 부분만 가리기
  return raw.replace(/(\d{3})\d+(\d{2})/, '$1****$2');
}

// 중복 감지: 최근 2분 이내 동일 페이로드면 중복 처리
function isDuplicate(data) {
  var props = PropertiesService.getScriptProperties();
  var windowMs = 2 * 60 * 1000; // 2분
  var base = [
    data.이름,
    data.연락처,
    data.문의유형,
    data.통신사,
    data.최근개통일,
    data.미납연체,
    data.지역,
    data.희망진행방식,
    data.상세내용,
  ].join('|');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base);
  var hash = digest
    .map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');

  var lastHash = props.getProperty(PROP_LAST_HASH) || '';
  var lastTime = parseInt(props.getProperty(PROP_LAST_TIME) || '0', 10);
  var now = Date.now();

  var dup = hash === lastHash && now - lastTime < windowMs;
  if (!dup) {
    props.setProperty(PROP_LAST_HASH, hash);
    props.setProperty(PROP_LAST_TIME, String(now));
  }
  return dup;
}

// Discord 임베드 페이로드 구성
function buildDiscordEmbed(p) {
  var tz = Session.getScriptTimeZone() || 'Asia/Seoul';
  var ts = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
  var color = 0x5865f2; // Discord blurple
  return {
    username: '전국모바일 알림',
    embeds: [
      {
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
          {
            name: '희망진행방식',
            value: safeField(p.희망진행방식),
            inline: true,
          },
          { name: '상세내용', value: safeMultiline(p.상세내용), inline: false },
        ],
        footer: { text: '접수 시간: ' + ts },
      },
    ],
  };
}

function safeField(v) {
  var s = v == null ? '' : String(v).trim();
  return s.length ? s : '-';
}
function safeMultiline(v) {
  var s = (v == null ? '' : String(v)).trim();
  if (!s.length) return '-';
  // 임베드 필드 길이 제한 대비, 너무 길면 잘라내기
  var max = 1000;
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function notifyDiscord(payload) {
  var url =
    PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK_URL);
  if (!url) {
    Logger.log(
      '⚠️ Webhook URL이 설정되지 않았습니다. 프로젝트 속성에 ' +
        PROP_WEBHOOK_URL +
        ' 키를 추가하세요.'
    );
    return;
  }
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  try {
    var res = UrlFetchApp.fetch(url, options);
    var code = res.getResponseCode();
    Logger.log('Discord 응답: ' + code);
    if (code >= 400) {
      Logger.log('본문: ' + res.getContentText());
    }
    // 204(No Content) 또는 200 OK 등
  } catch (err) {
    Logger.log('Discord 전송 실패: ' + err);
  }
}

// 수동 테스트용
function testDiscordNotification() {
  var p = {
    이름: '홍길동',
    연락처: '01012345678',
    문의유형: '비대면 개통',
    통신사: 'SKT',
    최근개통일: '2025-11-09',
    미납연체: '없음',
    지역: '서울 강남',
    희망진행방식: '비대면',
    상세내용: '아이폰15 조건 문의',
  };
  var msg = buildDiscordEmbed(
    Object.assign({}, p, { 연락처: maskPhone(p.연락처) })
  );
  notifyDiscord(msg);
  Logger.log('테스트 메시지 전송 요청 완료');
}

// 디버그: Webhook 속성 확인
function debugCheckWebhookProperty() {
  var url =
    PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK_URL);
  Logger.log('DISCORD_WEBHOOK_URL: ' + (url ? '[SET]' : '[NOT SET]'));
}

// 디버그: 최소 payload 전송
function debugSendPlain() {
  var url =
    PropertiesService.getScriptProperties().getProperty(PROP_WEBHOOK_URL);
  if (!url) {
    Logger.log('Webhook 미설정');
    return;
  }
  var payload = {
    content: '디버그 메시지: 간단 테스트 ' + new Date().toISOString(),
  };
  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    Logger.log(
      'debugSendPlain 응답: ' +
        res.getResponseCode() +
        ' ' +
        res.getContentText()
    );
  } catch (err) {
    Logger.log('debugSendPlain 실패: ' + err);
  }
}

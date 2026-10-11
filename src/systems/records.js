// [리텐션] 🏛️ 기록실 — 회차를 넘어 남는 기록 (세이브와 분리된 localStorage, 업적·감정안과 같은 방식).
// 엔딩 도감(5종)과 최고 기록을 타이틀에서 보여 줘 "다른 길도 가 볼까"를 만든다.
const REC_KEY = 'pawnshop_records_v1';

// 잠긴 엔딩은 조건만 흐릿하게 — 다음 회차의 목표가 된다
const ENDING_BOOK = [
  { key: 'debt', icon: '💸', name: '빚의 무게', hint: () => '7일 안에 김사장 빚을 못 갚는다' },
  { key: 'appraiser', icon: '🚬', name: '회장의 감정사', hint: () => `14일차까지 순자산 ${fmt(CONFIG.ACT2_TARGET)} G에 못 미친다` },
  { key: 'shop', icon: '🏪', name: '이름난 전당포 주인', hint: () => `21일 완주, 순자산 ${fmt(CONFIG.ENDING_RING)} G 미만` },
  { key: 'ring', icon: '🥊', name: '격투장의 새 주인', hint: () => `21일 완주, 순자산 ${fmt(CONFIG.ENDING_RING)} G 이상` },
  { key: 'king', icon: '👑', name: '지하경제의 왕 (진엔딩)', hint: () => `21일 완주, 순자산 ${fmt(CONFIG.ENDING_TRUE)} G 이상` },
];

let records = { endings: {}, hardEndings: {}, bestNet: null, seasons: 0, contracts: 0, bestSeason: null };
try {
  const raw = localStorage.getItem(REC_KEY);
  if (raw) records = { ...records, ...JSON.parse(raw) };
} catch (e) { /* 빈 기록 */ }

function persistRecords() {
  try { localStorage.setItem(REC_KEY, JSON.stringify(records)); } catch (e) { /* 무시 */ }
}

// 엔딩 도달 — 같은 결과 화면을 다시 열어도 중복 집계되지 않는다 (도감은 집합, 최고값은 max)
function recordEnding(key, net) {
  if (!ENDING_BOOK.some(e => e.key === key)) return;
  const first = !records.endings[key];
  if (first) records.endings[key] = Date.now();
  if (S.hard && !records.hardEndings[key]) records.hardEndings[key] = Date.now(); // 🔥
  if (S.hard && key === 'king') achieve('hard-king');
  if (key !== 'debt' && key !== 'appraiser' && (records.bestNet === null || net > records.bestNet)) records.bestNet = net;
  persistRecords();
  if (first) toast(`🏛️ 엔딩 도감 — ${ENDING_BOOK.find(e => e.key === key).name} 등록 (${endingsSeen()}/${ENDING_BOOK.length})`, 3200);
  if (endingsSeen() === ENDING_BOOK.length) achieve('all-endings');
}

function recordSeason(season, grade, done) {
  records.seasons++;
  records.contracts += done;
  const rank = g => ['C', 'B', 'A', 'S'].indexOf(g);
  if (!records.bestSeason || rank(grade) > rank(records.bestSeason.grade)) records.bestSeason = { grade, season };
  persistRecords();
}

function hardUnlocked() { return ['shop', 'ring', 'king'].some(k => records.endings[k]); }

function endingsSeen() { return ENDING_BOOK.filter(e => records.endings[e.key]).length; }

function renderRecords() {
  sndClick();
  showModal(`
    <h2 class="accent">🏛️ 기록실</h2>
    <h3 style="font-size:15px; margin-top:6px">엔딩 도감 ${endingsSeen()}/${ENDING_BOOK.length}</h3>
    ${ENDING_BOOK.map(e => records.endings[e.key]
      ? `<div class="contract-row done"><span>${e.icon} <b>${e.name}</b></span><span class="good">${records.hardEndings[e.key] ? '🔥 ' : ''}✔</span></div>`
      : `<div class="contract-row"><span class="dim">🔒 ??? — ${e.hint()}</span></div>`).join('')}
    <table style="margin-top:10px; font-size:14px">
      <tr><td>캠페인 최고 순자산</td><td class="accent">${records.bestNet === null ? '-' : fmt(records.bestNet) + ' G'}</td></tr>
      <tr><td>시즌 최고 등급</td><td class="accent">${records.bestSeason ? `${records.bestSeason.grade} (시즌 ${records.bestSeason.season})` : '-'}</td></tr>
      <tr><td>마친 시즌 · 달성한 의뢰</td><td>${records.seasons}시즌 · ${records.contracts}개</td></tr>
    </table>
    <div class="center" style="margin-top:10px"><button onclick="hideModal()">닫기</button></div>`);
}

Object.assign(globalThis, { ENDING_BOOK, recordEnding, recordSeason, endingsSeen, hardUnlocked, renderRecords });
export { ENDING_BOOK, recordEnding, recordSeason, endingsSeen, hardUnlocked, renderRecords };

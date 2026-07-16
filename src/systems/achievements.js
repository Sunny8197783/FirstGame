// [Phase 2 신규] 업적 20종 — localStorage 영구 저장 (세이브와 분리, 여러 회차에 걸쳐 누적)
// 해금은 게임 코드 곳곳의 [Phase2] 훅에서 achieve(id) 호출로 이뤄진다.
const ACH_KEY = 'pawnshop_achievements_v1';

const ACHIEVEMENTS = [
  // ── 흥정 ──
  { id: 'first-deal',    icon: '🤝', name: '개시',           desc: '첫 거래를 성사시킨다' },
  { id: 'streak-10',     icon: '🔥', name: '밀당의 신',      desc: '결렬·모욕 없이 10연속 거래 성사' },
  { id: 'cheap-buy',     icon: '✂️', name: '반값의 예술',    desc: '요구가의 50% 이하로 거래 성사' },
  { id: 'expert-70',     icon: '🧠', name: '감정가의 눈',    desc: '평균 매입가율 70% 미만 달성 (성사 10건 이상)' },
  { id: 'big-profit',    icon: '💰', name: '최고의 한 방',   desc: '한 물건으로 +10,000G 이익' },
  // ── 감정·추리 ──
  { id: 'jackpot-1',     icon: '🎉', name: '숨은 진품',      desc: '숨은 진품을 처음 발굴' },
  { id: 'jackpot-3',     icon: '🏺', name: '보물 사냥꾼',    desc: '숨은 진품 3회 발굴' },
  { id: 'trap-5',        icon: '🪤', name: '함정 무효',      desc: '함정 힌트 손님에게서 이익 낸 거래 5회' },
  { id: 'stolen-5',      icon: '🕶️', name: '위험한 장사',    desc: '장물 5개를 압수 없이 처분' },
  { id: 'clash-5',       icon: '🕵️', name: '모순 간파',      desc: '소문이 충돌한 경기에서 베팅 적중 5회' },
  // ── 밤 베팅 ──
  { id: 'bet-first-win', icon: '🎯', name: '첫 적중',        desc: '첫 베팅 적중' },
  { id: 'underdog',      icon: '🐕', name: '언더독의 밤',    desc: '하우스 추정 35% 이하 파이터에 베팅해 적중' },
  { id: 'edge-10',       icon: '📈', name: '하우스 킬러',    desc: '판단 우위 +10%p 이상 (베팅 10회 이상)' },
  { id: 'drop-1',        icon: '✦',  name: '전설의 부품',    desc: '전설 부품을 처음 획득' },
  { id: 'allin-final',   icon: '👑', name: '올인 파이널',    desc: '그랜드 파이널에서 골드 50% 이상 베팅해 적중' },
  // ── 스파링 ──
  { id: 'spar-1',        icon: '🥋', name: '데뷔전',         desc: '스파링 첫 승리' },
  { id: 'feint-3',       icon: '👁️', name: '페인트 간파',    desc: '페인트 텔을 3연속 꿰뚫고 라운드 승리' },
  { id: 'spar-perfect',  icon: '🛡️', name: '퍼펙트 게임',    desc: '무피격으로 스파링 승리' },
  // ── 스타일 ──
  { id: 'no-bet-7',      icon: '🧘', name: '금욕의 7일',     desc: '7일 연속 베팅 없이 보내기' },
  { id: 'debt-free-5',   icon: '⛓️', name: '조기 상환',      desc: '5일차 안에 김사장 빚 완납' },
];

let unlocked = {};
try {
  const raw = localStorage.getItem(ACH_KEY);
  if (raw) unlocked = JSON.parse(raw) || {};
} catch (e) { /* 빈 상태 */ }

function achieve(id) {
  if (unlocked[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  unlocked[id] = Date.now();
  try { localStorage.setItem(ACH_KEY, JSON.stringify(unlocked)); } catch (e) { /* 무시 */ }
  toast(`🏆 업적 달성 — ${a.icon} ${a.name}`, 3000);
  sndLevelUp(); // [Phase4] 업적 달성 상승 4음
}

function isUnlocked(id) { return !!unlocked[id]; }
function unlockedCount() { return Object.keys(unlocked).length; }

// 업적 화면 (모달)
function renderAchievements() {
  sndClick();
  const rows = ACHIEVEMENTS.map(a => {
    const on = isUnlocked(a.id);
    return `<div class="ach-row ${on ? 'on' : ''}">
      <span class="ach-icon">${on ? a.icon : '🔒'}</span>
      <span class="ach-body"><b>${a.name}</b><br><span class="dim" style="font-size:12px">${a.desc}</span></span>
      <span class="ach-state ${on ? 'good' : 'dim'}">${on ? '달성' : '미달성'}</span>
    </div>`;
  }).join('');
  showModal(`
    <h2 class="accent">🏆 업적 <span class="dim" style="font-size:14px">${unlockedCount()} / ${ACHIEVEMENTS.length}</span></h2>
    <div class="modal-scroll">${rows}</div>
    <div class="center" style="margin-top:8px"><button onclick="hideModal()">닫기</button></div>`);
}

Object.assign(globalThis, { ACHIEVEMENTS, achieve, isUnlocked, unlockedCount, renderAchievements });
export { ACHIEVEMENTS, achieve, isUnlocked, unlockedCount, renderAchievements };

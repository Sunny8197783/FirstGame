// [리텐션] 📜 회장의 시즌 의뢰 — 시즌 모드에 '목표'와 '결산'을 준다.
// 왜: 시즌 모드는 42일짜리 끝없는 샌드박스였다(목표·결산·보상 없음). 시즌마다 의뢰 3개를 뽑아
//     진행도를 보여 주고, 시즌이 끝나면 결산(등급·보수)을 낸다.
// 원칙: 의뢰는 전부 '시즌 동안 늘어난 통계(델타)'로만 판정한다 — 기존 엔진·밸런스는 건드리지 않는다.
//       보수는 능동 플레이의 결과에만 붙는다 (방치 보상 = 0 그대로).
// 목표치는 sim/season_report.mjs 분포로 보정: 보통 봇 기준 의뢰마다 대략 40~55% 달성 (신임 0단계 기준).
// ⭐ 회장의 신임(0~5): 시즌 S면 +1, C면 −1. 단계가 오를수록 목표치·보수가 함께 오른다 — 시즌을 넘는 사다리.

const SEASON_CONTRACTS = [
  { id: 'trade', icon: '💰', name: '큰 장사', target: t => Math.round(1100000 * prestigeMul() * (1 + 0.2 * t) / 10000) * 10000,
    desc: t => `시즌 장사 순익 ${fmt(t)} G`, cur: d => d.tradePL },
  { id: 'eye', icon: '🧐', name: '매의 눈', target: t => Math.max(70, 74 - t), le: true, keep: true,
    desc: t => `평균 매입가율 ${t}% 이하로 마감 (10건 이상)`,
    cur: d => d.deals >= 10 ? Math.round(d.buyRatioSum / d.deals * 100) : null, unit: '%' },
  { id: 'jackpot', icon: '🎉', name: '보물 사냥', target: t => 7 + t, desc: t => `숨은 진품 ${t}회 발굴`, cur: d => d.jackpots },
  { id: 'clean', icon: '🧼', name: '깨끗한 장부', target: t => (t >= 3 ? 0 : 1), le: true, keep: true,
    desc: t => `장물 압수 ${t}회 이하로 마감`, cur: d => d.stolenLost },
  { id: 'clash', icon: '⚔️', name: '소문 감별사', target: t => 14 + 2 * t,
    desc: t => `좋은·나쁜 소문이 엇갈린 경기 적중 ${t}회`, cur: d => d.clashWins },
  { id: 'final', icon: '👑', name: '파이널의 눈', target: () => 1, desc: () => '시즌 그랜드 파이널 적중', cur: d => d.finalWins },
  { id: 'spar', icon: '🥋', name: '링 위의 주인', target: t => 5 + t, desc: t => `직접 출전 ${t}승`, cur: d => d.playerWins },
  { id: 'rival', icon: '🏪', name: '황금손 사냥', target: t => 60 + 5 * t, desc: t => `밀봉 입찰 ${t}회 낙찰`, cur: d => d.rivalWon },
];
const SEASON_GRADES = ['C', 'B', 'A', 'S']; // 달성 수 0~3
const TRUST_MAX = 5;
const trustStars = t => '★'.repeat(t) + '☆'.repeat(TRUST_MAX - t);
const contractTrust = () => (S.contracts && S.contracts.trust) || 0; // 의뢰를 뽑은 시점의 단계
// 보수도 목표치처럼 뽑는 시점의 가게 이전 배율로 고정 — 시즌 도중 이전해 보수만 부풀리는 허점 차단
const contractBounty = () => Math.round(150000 * ((S.contracts && S.contracts.pm) || prestigeMul()) * (1 + 0.5 * contractTrust()) / 1000) * 1000;

// 시즌 시작: 의뢰 3개 + 통계 기준점. 목표치는 뽑는 순간 고정한다 (도중 가게 이전에도 안 바뀜)
function drawContracts() {
  const trust = S.trust || 0;
  S.contracts = {
    season: S.season, trust, pm: prestigeMul(),
    base: { ...S.stats },
    list: shuffle(SEASON_CONTRACTS.slice()).slice(0, 3).map(c => ({ id: c.id, target: c.target(trust) })),
  };
}

// 현재 진행 — { def, target, cur, done } 배열. keep(유지형)은 시즌 끝까지 조건을 지켜야 확정
function evaluateContracts() {
  if (!S.contracts) return [];
  const b = S.contracts.base, d = {};
  for (const k in S.stats) d[k] = (S.stats[k] || 0) - (b[k] || 0);
  return S.contracts.list.map(({ id, target }) => {
    const def = SEASON_CONTRACTS.find(c => c.id === id);
    const cur = def.cur(d) || 0;
    const ok = def.le ? def.cur(d) !== null && cur <= target : cur >= target;
    return { def, target, cur: def.cur(d), done: ok };
  });
}

function contractLineHTML(c) {
  const shown = c.cur === null ? '—' : fmt(c.cur) + (c.def.unit || '');
  const state = c.done ? (c.def.keep ? '<span class="good">유지 중</span>' : '<span class="good">✔ 달성</span>')
    : `<span class="dim">${shown} / ${fmt(c.target)}${c.def.unit || ''}</span>`;
  return `<div class="contract-row${c.done ? ' done' : ''}"><span>${c.def.icon} <b>${c.def.name}</b> — ${c.def.desc(c.target)}</span>${state}</div>`;
}

// 새벽 암시장 패널 (시즌 모드)
function contractsPanelHTML() {
  if (!S.season) return '';
  if (!S.contracts) drawContracts(); // 의뢰 도입 전 세이브: 지금부터 집계
  const cs = evaluateContracts();
  return `
    <div class="panel" style="margin:6px 0; padding:12px; border-color:#c8a24a">
      <h3 style="font-size:16px">📜 회장의 시즌 의뢰 <span class="accent" title="회장의 신임 — 시즌 S면 오르고 C면 내려간다">${trustStars(contractTrust())}</span> <span class="dim" style="font-size:12px">(D${seasonDayOf()}/${CONFIG.SEASON_LEN} · 하나당 보수 ${fmt(contractBounty())} G · 시즌 끝에 정산)</span></h3>
      ${cs.map(contractLineHTML).join('')}
    </div>`;
}

// 아침 전환 한 줄
function contractsMorningLine() {
  const cs = evaluateContracts();
  if (!cs.length) return '';
  return `<div style="font-size:13px; color:#ffd23e; margin-top:6px">📜 시즌 의뢰 ${cs.filter(c => c.done).length}/${cs.length} · ${cs.map(c => `${c.def.icon}${c.done ? '✔' : ''}`).join(' ')}</div>`;
}

// 시즌 정산 — 상태만 바꾼다 (화면과 분리: 시뮬도 같은 규칙으로 여러 시즌을 돌린다)
function settleSeason() {
  const cs = evaluateContracts();
  const done = cs.filter(c => c.done).length;
  const grade = SEASON_GRADES[done];
  const bounty = done * contractBounty();
  const b = S.contracts.base;
  const trade = S.stats.tradePL - (b.tradePL || 0), bet = S.stats.betPL - (b.betPL || 0);
  const trustBefore = S.trust || 0;
  S.trust = Math.max(0, Math.min(TRUST_MAX, trustBefore + (done === 3 ? 1 : done === 0 ? -1 : 0)));
  S.gold += bounty;
  const season = S.contracts.season;
  S.contracts = null;
  recordSeason(season, grade, done, S.trust); // 기록실 (회차 넘어 영구)
  if (done === 3) achieve('season-s');
  if (S.trust === TRUST_MAX) achieve('trust-max');
  return { cs, done, grade, bounty, trade, bet, season, trustBefore, trust: S.trust };
}

// 시즌 결산 화면 — 그랜드 파이널 다음 날 아침, 다음 시즌으로 넘어가기 전에 한 번
function renderSeasonReport(next) {
  const { cs, done, grade, bounty, trade, bet, season, trustBefore, trust } = settleSeason();
  S.phase = 'result'; setTheme('night'); updateHUD(); // 결과 화면처럼 HUD를 숨긴다 (지난 시즌 D1 표기 방지)
  S._afterSeasonReport = next;
  $('screen').innerHTML = `
    <div class="panel center">
      <h1>🌆 시즌 ${season} 결산</h1>
      <p class="huge accent" style="margin:8px 0">${grade}</p>
      <p class="dim">회장: ${done === 3 ? '"완벽하군. 이 바닥에 자네 같은 눈은 없어."' : done ? '"나쁘지 않아. 다음 시즌엔 전부 해내 보게."' : '"이번 시즌은 쉬어 간 셈 치지."'}</p>
    </div>
    <div class="panel">
      <h3>📜 의뢰 ${done}/${cs.length}</h3>
      ${cs.map(contractLineHTML).join('')}
      <table style="margin-top:8px">
        <tr><td>의뢰 보수</td><td class="good">+${fmt(bounty)} G</td></tr>
        <tr><td>시즌 장사 손익</td><td>${plHTML(trade, ' G')}</td></tr>
        <tr><td>시즌 베팅 손익</td><td>${plHTML(bet, ' G')}</td></tr>
        <tr><td>회장의 신임 <span class="dim" style="font-size:12px">(S면 ↑ · C면 ↓ — 단계만큼 의뢰 목표·보수 ↑)</span></td>
            <td class="accent">${trustStars(trustBefore)}${trust !== trustBefore ? ` → ${trustStars(trust)}` : ''}</td></tr>
      </table>
    </div>
    <div class="center" style="margin:14px 0">
      <button class="btn-big btn-pink" onclick="afterSeasonReport()">🌆 시즌 ${season + 1} 개막 →</button>
    </div>`;
}

function afterSeasonReport() {
  sndClick();
  const f = S._afterSeasonReport; S._afterSeasonReport = null;
  if (f) f();
}

Object.assign(globalThis, { SEASON_CONTRACTS, drawContracts, evaluateContracts, settleSeason, contractsPanelHTML, contractsMorningLine, renderSeasonReport, afterSeasonReport });
export { SEASON_CONTRACTS, drawContracts, evaluateContracts, settleSeason, contractsPanelHTML, contractsMorningLine, renderSeasonReport, afterSeasonReport };

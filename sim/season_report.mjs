// [리텐션] 시즌 모드 1시즌(42일) 통계 분포 — 시즌 의뢰(SEASON_CONTRACTS) 목표치 보정용.
// 캠페인을 클리어한 런만 시즌으로 이어 가며, 시즌 동안 늘어난 통계(델타)의 분위수를 본다.
import { loadGame } from './stub.mjs';
import { makeBots, median } from './bots.mjs';

const G = await loadGame();
const { S, CONFIG } = G;
const B = makeBots(G);
const RUNS = 60;
const KEYS = ['deals', 'jackpots', 'betWins', 'bets', 'drops', 'clashWins', 'trapProfits', 'rivalWon', 'stolenLost', 'tradePL', 'betPL', 'buyRatioSum', 'houseEstSum'];
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const fmt = (n) => Math.round(n).toLocaleString('ko-KR');

// 시즌 1 진입 직후부터 SEASON_LEN일 — 실제 흐름(startSeasonMode → startDay → rotateSeason)과 같은 순서
function runSeason(bot) {
  S.season = 1; S.endingId = null;
  const before = { ...S.stats };
  for (let d = 0; d < CONFIG.SEASON_LEN; d++) {
    if (G.seasonDayOf() === 1) G.rotateSeason();
    B.runDay(bot);
  }
  const delta = {};
  KEYS.forEach(k => { delta[k] = (S.stats[k] || 0) - (before[k] || 0); });
  // 실력 지표: 평균 매입가율(낮을수록 고수) · 판단 우위(적중률 − 하우스 추정, %p)
  delta.avgBuy = delta.deals ? Math.round(delta.buyRatioSum / delta.deals * 100) : 0;
  delta.edge = delta.bets ? Math.round((delta.betWins - delta.houseEstSum) / delta.bets * 100) : 0;
  if (G.evaluateContracts) {
    const cs = G.evaluateContracts();
    delta.contracts = cs.filter(c => c.done).length; // 의뢰 도입 후 달성 수
    // 의뢰별 달성률 집계를 위해 전 의뢰를 같은 기준점으로 평가 (뽑힌 3개와 무관하게)
    S.contracts.list = G.SEASON_CONTRACTS.map(c => ({ id: c.id, target: c.target(S.contracts.trust || 0) }));
    delta.byId = Object.fromEntries(G.evaluateContracts().map(c => [c.def.id, c.done]));
  }
  return delta;
}

for (const bot of [B.BOT_AVERAGE, B.BOT_SMART]) {
  const rows = [];
  for (let i = 0; i < RUNS; i++) {
    const run = B.runCampaign(bot);
    if (run.ending) continue; // 캠페인 실패 런은 시즌 모드에 못 들어간다
    rows.push(runSeason(bot));
  }
  console.log(`\n── ${bot.name} — 시즌 1 (${CONFIG.SEASON_LEN}일) · 표본 ${rows.length}런 ──`);
  console.log('통계'.padEnd(14) + 'p25'.padStart(12) + 'median'.padStart(12) + 'p75'.padStart(12));
  for (const k of [...KEYS.filter(k => !k.endsWith('Sum')), 'avgBuy', 'edge', ...(rows[0] && 'contracts' in rows[0] ? ['contracts'] : [])]) {
    const a = rows.map(r => r[k]);
    console.log(k.padEnd(14) + fmt(q(a, 0.25)).padStart(12) + fmt(median(a)).padStart(12) + fmt(q(a, 0.75)).padStart(12));
  }
  if (rows[0] && rows[0].byId) {
    const ids = Object.keys(rows[0].byId);
    console.log('의뢰별 달성률: ' + ids.map(id => `${id} ${Math.round(rows.filter(r => r.byId[id]).length / rows.length * 100)}%`).join(' · '));
  }
}

// ── ⭐ 회장의 신임 사다리 — 5시즌 연속. S면 +1·C면 −1, 단계만큼 목표치가 오른다 ──
// 목표: 보통은 0~1단계 언저리, 정보 활용도 꼭대기(★5)는 쉽게 못 닿는 '긴 사다리'
const SEASONS = 5, RUNS2 = 16;
for (const bot of [B.BOT_AVERAGE, B.BOT_SMART]) {
  const finals = [], sRate = Array(SEASONS).fill(0);
  let n = 0;
  for (let i = 0; i < RUNS2; i++) {
    if (B.runCampaign(bot).ending) continue;
    n++; S.season = 1; S.trust = 0;
    for (let s = 0; s < SEASONS; s++) {
      for (let d = 0; d < CONFIG.SEASON_LEN; d++) { if (G.seasonDayOf() === 1) G.rotateSeason(); B.runDay(bot); }
      if (G.settleSeason().done === 3) sRate[s]++;
    }
    finals.push(S.trust);
  }
  const hist = [0, 1, 2, 3, 4, 5].map(t => `★${t} ${finals.filter(x => x === t).length}`).join(' · ');
  console.log(`\n⭐ ${bot.name} — ${SEASONS}시즌 후 신임 분포 (${n}런): ${hist}`);
  console.log(`   시즌별 S등급률: ${sRate.map((c, i) => `S${i + 1} ${Math.round(c / Math.max(1, n) * 100)}%`).join(' · ')}`);
}

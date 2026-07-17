// [Phase5] 인바리언트 봇 3종 — 게임의 핵심 설계 원칙을 자동 검증한다.
//   BOT_IDLE   방치하면 1G도 늘지 않는다 (절대 원칙: 방치 보상 = 0)
//   BOT_RANDOM 무작위 플레이는 하우스 마진에 갉여 기대값이 마이너스다
//   BOT_SMART  정보(최저 수락가·소문 진위)를 읽으면 흑자다 → 판단력 = 수익
import { loadGame } from './stub.mjs';
import { makeBots, median, mean } from './bots.mjs';

const G = await loadGame();
const { S, CONFIG } = G;
const B = makeBots(G);

let errors = 0;
const assert = (cond, msg) => { if (!cond) { errors++; console.log('FAIL:', msg); } };

const RUNS = 40;
const startNet = CONFIG.START_GOLD - CONFIG.DEBT_START;
console.log(`기준: 시작 순자산 ${startNet.toLocaleString()} G · ${CONFIG.DAYS}일 × ${RUNS}회`);

// ── ① BOT_IDLE: 방치 보상 = 0 (절대 원칙) ──
G.startGame();
const idleGold0 = S.gold;
for (let d = 0; d < CONFIG.DAYS; d++) B.runDay(B.BOT_IDLE);
console.log(`[${B.BOT_IDLE.name}] 골드 ${idleGold0.toLocaleString()} → ${S.gold.toLocaleString()} · 장사 ${S.stats.tradePL} · 베팅 ${S.stats.betPL}`);
assert(S.gold === idleGold0, '방치 보상 = 0 — 21일을 방치해도 골드가 1G도 변하지 않는다');
assert(S.stats.tradePL === 0 && S.stats.betPL === 0, '방치는 장사·베팅 손익이 모두 0이다');
assert(S.stats.deals === 0 && S.stats.bets === 0, '방치는 거래·베팅 자체가 없다');
assert(S.debt > CONFIG.DEBT_START, '방치해도 빚 이자는 불어난다 (가만히 있으면 손해)');

// ── ②③ 무작위 vs 정보 활용 ──
const runBot = (bot) => {
  const r = { nets: [], trades: [], betPLs: [] };
  for (let i = 0; i < RUNS; i++) {
    const c = B.runCampaign(bot);
    r.nets.push(c.net); r.trades.push(c.tradePL); r.betPLs.push(c.betPL);
  }
  r.netMed = median(r.nets);
  return r;
};

const rnd = runBot(B.BOT_RANDOM);
console.log(`[${B.BOT_RANDOM.name}] 순자산 중앙값 ${Math.round(rnd.netMed).toLocaleString()} G · 베팅손익 평균 ${Math.round(mean(rnd.betPLs)).toLocaleString()} G`);
const smt = runBot(B.BOT_SMART);
console.log(`[${B.BOT_SMART.name}] 순자산 중앙값 ${Math.round(smt.netMed).toLocaleString()} G · 장사손익 평균 ${Math.round(mean(smt.trades)).toLocaleString()} G`);

assert(mean(rnd.betPLs) < 0, '무작위 베팅은 하우스 마진에 갉여 기대값이 마이너스다');
assert(smt.netMed > rnd.netMed, '정보를 읽는 쪽이 무작위보다 부유하다 (판단력 = 수익)');
assert(smt.netMed > startNet, '정보를 활용하면 시작 순자산보다 늘어난다 (스킬 보상 존재)');
assert(mean(smt.trades) > mean(rnd.trades), '최저 수락가를 읽으면 장사 손익이 앞선다');
assert(rnd.netMed > -Infinity && smt.netMed > 0, '정보 활용 플레이는 흑자로 끝난다');

console.log(errors === 0 ? 'INVARIANTS ALL PASS ✅' : `INVARIANTS ${errors} FAILURES ❌`);
process.exit(errors === 0 ? 0 : 1);

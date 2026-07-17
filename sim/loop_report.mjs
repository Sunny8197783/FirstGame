// [Phase5] 하루 루프 전체 밸런스 리포트 — 봇 3종의 순자산 곡선·엔딩 도달률을 표로 낸다.
// 튜닝 목적: CONFIG 수치를 바꾼 뒤 이 리포트로 난이도 곡선이 의도대로 움직였는지 본다.
import { loadGame } from './stub.mjs';
import { makeBots, endingOf, median } from './bots.mjs';

const G = await loadGame();
const { CONFIG } = G;
const B = makeBots(G);

const RUNS = 60;
const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const pad = (s, w, right) => (right ? String(s).padStart(w) : String(s).padEnd(w));

console.log(`\n═══ 하루 루프 밸런스 리포트 (${CONFIG.DAYS}일 × ${RUNS}회/봇) ═══`);
console.log(`시작 순자산 ${fmt(CONFIG.START_GOLD - CONFIG.DEBT_START)} G · 빚 ${fmt(CONFIG.DEBT_START)} G(이자 ${Math.round(CONFIG.DEBT_INTEREST * 100)}%/일)\n`);

const bots = [B.BOT_IDLE, B.BOT_RANDOM, B.BOT_SMART];
const results = bots.map((bot) => {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(B.runCampaign(bot));
  // 일자별 순자산 중앙값 곡선
  const curve = [];
  for (let d = 0; d < CONFIG.DAYS; d++) curve.push(median(runs.map(r => r.curve[d])));
  const endings = {};
  runs.forEach(r => { const e = endingOf(r); endings[e] = (endings[e] || 0) + 1; });
  return { bot, runs, curve, endings, netMed: median(runs.map(r => r.net)) };
});

// ── 순자산 곡선 (막별 체크포인트) ──
const marks = [1, CONFIG.ACT1_END, CONFIG.ACT2_END, CONFIG.DAYS]; // 1막끝·2막끝·최종
console.log('── 순자산 중앙값 곡선 (G) ──');
console.log(pad('봇', 22) + marks.map(d => pad(`D${d}`, 12, true)).join(''));
results.forEach(({ bot, curve }) => {
  console.log(pad(bot.name, 22) + marks.map(d => pad(fmt(curve[d - 1]), 12, true)).join(''));
});

// ── 막 관문 통과율 (설계 목표: 방치는 전멸, 정보 활용은 통과) ──
console.log('\n── 막 관문 통과율 ──');
console.log(pad('봇', 22) + pad('1막(빚청산)', 16, true) + pad(`2막(순자산 ${fmt(CONFIG.ACT2_TARGET)})`, 22, true));
results.forEach(({ bot, runs }) => {
  const act1 = runs.filter(r => r.ending !== 'debt_fail').length / runs.length;
  const act2 = runs.filter(r => !r.ending).length / runs.length; // 두 관문 모두 통과 = 완주
  console.log(pad(bot.name, 22) + pad((act1 * 100).toFixed(0) + '%', 16, true) + pad((act2 * 100).toFixed(0) + '%', 22, true));
});

// ── 엔딩 도달률 ──
console.log('\n── 최종 엔딩 도달률 ──');
results.forEach(({ bot, endings }) => {
  const rows = Object.entries(endings).sort((a, b) => b[1] - a[1])
    .map(([e, n]) => `${e} ${(n / RUNS * 100).toFixed(0)}%`).join(' · ');
  console.log(`${pad(bot.name, 22)}${rows}`);
});

// ── 수익 출처 분해 ──
console.log('\n── 수익 출처 (평균) ──');
console.log(pad('봇', 22) + pad('장사손익', 14, true) + pad('베팅손익', 14, true) + pad('거래수', 10, true) + pad('베팅수', 10, true));
results.forEach(({ bot, runs }) => {
  const avg = (k) => runs.reduce((s, r) => s + r[k], 0) / runs.length;
  console.log(pad(bot.name, 22) + pad(fmt(avg('tradePL')), 14, true) + pad(fmt(avg('betPL')), 14, true)
    + pad(avg('deals').toFixed(1), 10, true) + pad(avg('bets').toFixed(1), 10, true));
});

console.log('\n💡 판독: 방치는 전 구간 변화 0(보상 없음), 무작위는 하우스 마진에 마모,');
console.log('   정보 활용만 우상향해야 한다 — 이 순서가 깨지면 밸런스가 무너진 것이다.\n');

// 밀당 흥정 엔진 회귀 검증 (데모 시절 수치 범위와 동일해야 함)
// 기준치(데모): 신중 ~92% 매입가율 / 고수 ~66% / 공격 결렬 ~10-12% / 장물 ~3% / 진품 ~5%
import { loadGame, elCache } from './stub.mjs';

const G = await loadGame();
const { S, CONFIG } = G;

let errors = 0;
const assert = (cond, msg) => { if (!cond) { errors++; console.log('FAIL:', msg); } };

G.startGame();

function playHaggle(c, aggressive) {
  S.haggle = { D: c.asking, P: c.patience, maxP: c.patience };
  let X = Math.round(c.asking * (aggressive ? 0.45 : 0.62) / 100) * 100;
  let safety = 0;
  while (S.haggle && safety < 12) {
    elCache['offer-input'].value = String(Math.min(X, S.gold));
    const dealsBefore = S.stats.deals, rejBefore = S.stats.rejected;
    G.makeOffer();
    if (S.stats.deals > dealsBefore) return 'deal';
    if (S.stats.rejected > rejBefore) return 'walk';
    X = Math.round((X + S.haggle.D) / 2 / 100) * 100;
    safety++;
  }
  return 'stuck';
}

// 신중 전략 200명
let deals = 0, walks = 0, stuck = 0;
for (let i = 0; i < 200; i++) {
  S.gold = 1e9; S.purchases = [];
  S.event = { id: 'normal' };
  S.customers = G.genCustomers(); S.custIdx = 0;
  const r = playHaggle(S.customers[0], false);
  if (r === 'deal') deals++; else if (r === 'walk') walks++; else stuck++;
  G.hideModal();
}
const ratio = S.stats.buyRatioSum / S.stats.deals;
console.log(`[신중 전략] 200명: 성사 ${deals} / 결렬 ${walks} / 교착 ${stuck}`);
console.log(`평균 매입가율: ${(ratio * 100).toFixed(1)}%`);
assert(stuck === 0, '흥정이 항상 유한하게 끝난다');
assert(deals > 120, '신중 전략은 대체로 성사된다');
assert(ratio < 0.95, '평균 매입가율 < 95% (흥정으로 이득)');
assert(ratio > 0.55, '평균 매입가율 > 55% (일방적 착취는 아님)');

// 고수 전략: 최저가 살짝 위를 고집
const dealsE0 = S.stats.deals, sumE0 = S.stats.buyRatioSum;
for (let i = 0; i < 200; i++) {
  S.gold = 1e9; S.purchases = [];
  S.event = { id: 'normal' };
  S.customers = G.genCustomers(); S.custIdx = 0;
  const c = S.customers[0];
  S.haggle = { D: c.asking, P: c.patience, maxP: c.patience };
  const X = Math.max(100, Math.round(c.M * 1.06 / 100) * 100);
  let safety = 0;
  while (S.haggle && safety < 12) {
    elCache['offer-input'].value = String(X);
    G.makeOffer();
    safety++;
  }
  G.hideModal();
}
const expertRatio = (S.stats.buyRatioSum - sumE0) / (S.stats.deals - dealsE0);
console.log(`[고수 전략] 평균 매입가율: ${(expertRatio * 100).toFixed(1)}%`);
assert(expertRatio < 0.85, '고수는 85% 미만에 산다 (스킬 보상 존재)');
assert(expertRatio < ratio, '잘 읽을수록 더 싸게 산다');

// 공격 전략 결렬률
const rejBase = S.stats.rejected;
for (let i = 0; i < 200; i++) {
  S.gold = 1e9; S.purchases = [];
  S.event = { id: 'normal' };
  S.customers = G.genCustomers(); S.custIdx = 0;
  playHaggle(S.customers[0], true);
  G.hideModal();
}
const aggWalkRate = (S.stats.rejected - rejBase) / 200;
console.log(`[공격 전략] 결렬률: ${(aggWalkRate * 100).toFixed(0)}%`);
assert(aggWalkRate > walks / 200, '더 후려칠수록 결렬 위험이 커진다');

// 장물/진품 발생률
let stolenN = 0, jackpotN = 0, total = 0;
for (let i = 0; i < 500; i++) {
  S.gold = 10000; S.event = { id: 'normal' };
  G.genCustomers().forEach(c => { total++; if (c.stolen) stolenN++; if (c.jackpot) jackpotN++; });
}
console.log(`장물 ${(stolenN / total * 100).toFixed(1)}% · 진품 ${(jackpotN / total * 100).toFixed(1)}%`);
assert(jackpotN / total > 0.02 && jackpotN / total < 0.09, '진품률 ≈ 5%');
assert(stolenN > 0, '장물이 등장한다');

console.log(errors === 0 ? 'HAGGLE ALL PASS ✅' : `HAGGLE ${errors} FAILURES ❌`);
process.exit(errors === 0 ? 0 : 1);

// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
const S = {
  day: 0, gold: 0, phase: 'title',
  customers: [], custIdx: 0, purchases: [],
  fighters: [], matches: [], matchIdx: 0,
  currentBet: null, // { fighterIdx, amount }
  stats: {
    deals: 0, rejected: 0, tradePL: 0, buyRatioSum: 0, bestDeal: 0, jackpots: 0, stolenLost: 0,
    bets: 0, betWins: 0, betPL: 0, houseEstSum: 0, drops: 0, loans: 0,
  },
};

Object.assign(globalThis, { S });
export { S };

// 직접 출전(스파링) 회귀 검증 (데모 시절 수치 범위와 동일해야 함)
// 기준치(데모): 막러시 43~53% (-EV) / 텔 읽기 56~68% (+EV) / 텔 진실률 ≈ TELL_TRUTH
import { loadGame, elCache } from './stub.mjs';

const G = await loadGame();
const { S, CONFIG } = G;

let errors = 0;
const assert = (cond, msg) => { if (!cond) { errors++; console.log('FAIL:', msg); } };

G.startGame();
assert(S.player.atk === 5 && S.player.def === 5 && S.player.spd === 5, '플레이어 시작 스탯 5/5/5');
assert(S.debt === CONFIG.DEBT_START, '시작 빚 = DEBT_START');

let tellTrue = 0, tellTotal = 0;
for (let trial = 0; trial < 100; trial++) {
  Object.assign(S.player, { atk: 5, def: 5, spd: 5 });
  S.gold = 10000; S.day = 2;
  S.challengeOfferDay = 0;
  G.renderChallengeOffer();
  assert(S.challengeOffers.length === 2, '상대 후보 2명');
  G.selectChallengeOpp(S.challengeOffers[0]);
  globalThis.document.getElementById('chal-stake').value = '1000';
  const goldBefore = S.gold;
  G.startChallenge();
  assert(S.gold === goldBefore - 1000, '판돈 차감');
  let safety = 0;
  while (S.challenge && S.challenge.php > 0 && S.challenge.ohp > 0 && safety < 50) {
    tellTotal++; if (S.challenge.tellTruth) tellTrue++;
    const sumBefore = S.challenge.php + S.challenge.ohp;
    G.playerMove('rush');
    assert(S.challenge.php + S.challenge.ohp < sumBefore, '라운드마다 체력 감소');
    safety++;
  }
  assert(safety < 50, '전투가 유한하게 종료');
  assert(S.challenge.php <= 0 || S.challenge.ohp <= 0, 'KO 도달');
  const frozen = S.challenge.php + S.challenge.ohp;
  G.playerMove('rush');
  assert(S.challenge.php + S.challenge.ohp === frozen, 'KO 후 입력 무시');
  G.proceedAfterChallenge();
  assert(S.challenge === null, '종료 후 challenge 해제');
}
const rushWins = S.stats.playerWins;
console.log(`[막러시 전략] 100판: ${rushWins}승 ${100 - rushWins}패 (challengePL ${S.stats.challengePL})`);
console.log(`텔 진실률: ${(tellTrue / tellTotal * 100).toFixed(1)}% (설계 ${CONFIG.TELL_TRUTH * 100}%)`);
assert(S.stats.playerFights === 100, '출전 횟수 집계');
assert(Math.abs(tellTrue / tellTotal - CONFIG.TELL_TRUTH) < 0.08, '텔 진실률 ≈ CONFIG.TELL_TRUTH');

// 텔 읽기 전략 (보이는 수를 그대로 믿고 카운터픽)
const beatsMe = { rush: 'counter', poke: 'rush', counter: 'poke' };
const startWins = S.stats.playerWins, startPL = S.stats.challengePL;
for (let trial = 0; trial < 100; trial++) {
  Object.assign(S.player, { atk: 5, def: 5, spd: 5 });
  S.gold = 10000; S.day = 2; S.challengeOfferDay = 0;
  G.renderChallengeOffer();
  G.selectChallengeOpp(S.challengeOffers[0]);
  globalThis.document.getElementById('chal-stake').value = '1000';
  G.startChallenge();
  let safety = 0;
  while (S.challenge && S.challenge.php > 0 && S.challenge.ohp > 0 && safety < 50) {
    const om = S.challenge.oppMove;
    const shownGuess = S.challenge.tellTruth ? om : beatsMe[om];
    G.playerMove(beatsMe[shownGuess]);
    safety++;
  }
  if (S.challenge) G.proceedAfterChallenge();
}
const readWins = S.stats.playerWins - startWins;
const readPL = S.stats.challengePL - startPL;
console.log(`[텔 읽기 전략] 100판: ${readWins}승 ${100 - readWins}패 (PL ${readPL >= 0 ? '+' : ''}${readPL})`);
assert(readWins > rushWins, '텔을 읽는 쪽이 막러시보다 강하다 (스킬 게임)');
assert(readWins >= 55, '텔 읽기는 +EV');

console.log(errors === 0 ? 'CHALLENGE ALL PASS ✅' : `CHALLENGE ${errors} FAILURES ❌`);
process.exit(errors === 0 ? 0 : 1);

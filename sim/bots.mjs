// [Phase5] 헤드리스 하루-루프 드라이버 + 봇 3종 (invariants·loop_report 공용)
// UI 연출은 건너뛰고 엔진 함수만 구동한다. 승자 결정은 runFight() 원문 규칙을 이식.
import { elCache } from './stub.mjs';

export function makeBots(G) {
  const { S, CONFIG } = G;

  // runFight()의 승자 결정 규칙만 이식 (연출 없음 — pActual이 실제 승률)
  const resolveMatch = (m) => {
    const A = S.fighters[m.ia], B = S.fighters[m.ib];
    const aWins = Math.random() < m.pActual;
    const W = aWins ? A : B, L = aWins ? B : A;
    m.winner = aWins ? 'A' : 'B'; m.done = true;
    W.w++; L.l++;
    return aWins;
  };

  // 흥정 한 건을 끝까지 진행 (제시가 정책은 봇이 결정)
  const haggleWith = (c, nextOffer) => {
    S.haggle = { D: c.asking, P: c.patience, maxP: c.patience };
    let safety = 0;
    while (S.haggle && safety < 14) {
      elCache['offer-input'].value = String(Math.min(nextOffer(c, S.haggle), S.gold));
      G.makeOffer();
      safety++;
    }
    G.hideModal();
  };

  // 베팅 확정 (confirmBet은 runFight 연출을 호출하므로 상태만 직접 세팅)
  const placeBet = (side, amount) => {
    const amt = Math.min(Math.floor(amount / 100) * 100, Math.floor(S.gold * G.betCapRate()));
    if (amt <= 0) return;
    S.currentBet = { side, amount: amt };
    S.gold -= amt;
  };

  // 하루 루프: ☀️낮 흥정 → 🌆저녁 정산 → 🌙밤 베팅 → 💸빚 이자
  const runDay = (bot) => {
    S.event = { id: 'normal' };
    S.customers = G.genCustomers(); S.custIdx = 0; S.purchases = [];
    for (let i = 0; i < S.customers.length; i++) {
      S.custIdx = i;
      bot.haggle(S.customers[i]);
    }
    G.renderEvening(); // 매입품 되팔이 정산 (진짜 가치 공개)

    S.matches = G.genMatches(CONFIG.MATCHES_PER_NIGHT);
    for (let i = 0; i < S.matches.length; i++) {
      S.matchIdx = i;
      S.currentBet = null;
      bot.bet(S.matches[i]);
      G.settleFight(S.matches[i], resolveMatch(S.matches[i]));
      G.hideModal();
    }
    if (S.debt > 0) S.debt = Math.round(S.debt * (1 + CONFIG.DEBT_INTEREST) / 100) * 100;
    S.day++;
  };

  const BOT_IDLE = {
    name: 'BOT_IDLE (방치)',
    haggle() { /* 아무것도 사지 않는다 */ },
    bet() { S.currentBet = null; /* 관망만 한다 */ },
  };

  const BOT_RANDOM = {
    name: 'BOT_RANDOM (무작위)',
    haggle(c) { haggleWith(c, (cc) => Math.round(cc.asking * G.rand(0.3, 1.0) / 100) * 100); },
    bet() { placeBet(Math.random() < 0.5 ? 'A' : 'B', S.gold * G.rand(0.02, 0.10)); },
  };

  const BOT_SMART = {
    name: 'BOT_SMART (정보 활용)',
    // 숨은 최저 수락가 바로 위를 노린다 = 검수·힌트를 완벽히 읽어낸 플레이어
    haggle(c) { haggleWith(c, (cc) => Math.max(100, Math.round(cc.M * 1.04 / 100) * 100)); },
    // 소문의 진짜 효과를 읽어 실제 승률을 추정 → 기대값(+)일 때만 베팅
    bet(m) {
      const eff = (rs) => rs.reduce((s, r) => s + r.effect, 0);
      const p = G.clamp(m.est + eff(m.rumorsA) - eff(m.rumorsB), CONFIG.WINPROB_MIN, CONFIG.WINPROB_MAX);
      const evA = p * m.oddsA - 1, evB = (1 - p) * m.oddsB - 1;
      const best = evA >= evB ? { side: 'A', ev: evA } : { side: 'B', ev: evB };
      if (best.ev <= 0.05) return; // 우위가 없으면 관망 (방치가 아니라 절제)
      placeBet(best.side, S.gold * 0.08);
    },
  };

  // 21일 완주 1회 — 막 관문(startDay 원문 규칙)을 거치며 일자별 순자산 곡선·엔딩을 돌려준다
  const runCampaign = (bot) => {
    G.startGame(); // S·stats 완전 초기화
    const curve = [];
    let ending = null;
    for (let d = 0; d < CONFIG.DAYS; d++) {
      const day = d + 1;
      // 8일차 아침: 김사장이 남은 빚을 강제 회수 — 못 갚으면 배드엔딩
      if (day === CONFIG.ACT1_END + 1 && S.debt > 0) {
        if (S.gold >= S.debt) { S.gold -= S.debt; S.debt = 0; }
        else { ending = 'debt_fail'; break; }
      }
      // 15일차 아침: 회장의 시험 (순자산 기준) — 미달이면 엔딩
      if (day === CONFIG.ACT2_END + 1 && S.gold - S.debt < CONFIG.ACT2_TARGET) {
        ending = 'act2_fail'; break;
      }
      runDay(bot);
      curve.push(S.gold - S.debt);
    }
    const net = S.gold - S.debt;
    while (curve.length < CONFIG.DAYS) curve.push(net); // 조기 종료분은 최종값으로 채운다
    return { curve, net, ending, tradePL: S.stats.tradePL, betPL: S.stats.betPL,
             deals: S.stats.deals, bets: S.stats.bets, debt: S.debt };
  };

  return { resolveMatch, haggleWith, placeBet, runDay, runCampaign, BOT_IDLE, BOT_RANDOM, BOT_SMART };
}

// 엔딩 판정 (result.js의 분기 기준과 동일)
export function endingOf(run) {
  if (run.ending === 'debt_fail') return '💸 배드: 빚의 무게';
  if (run.ending === 'act2_fail') return '🚬 회장의 감정사';
  if (run.net >= 100000) return '👑 진엔딩: 지하경제의 왕';
  if (run.net >= 60000) return '🥊 격투장의 새 주인';
  return '🏪 이름난 전당포 주인';
}

export const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

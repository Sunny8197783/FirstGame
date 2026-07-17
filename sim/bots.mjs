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

  // [2막] 라이벌 밀봉 입찰 한 건 (흥정과 다른 경로 — 단 한 번만 부른다)
  const bidWith = (c, amount) => {
    const x = Math.min(Math.max(100, Math.round(amount / 100) * 100), Math.floor(S.gold / 100) * 100);
    G.document.getElementById('bid-input').value = String(x); // 스텁 엘리먼트는 조회 시 생성된다
    G.submitBid();
    G.hideModal();
  };

  // 베팅 확정 (confirmBet은 runFight 연출을 호출하므로 상태만 직접 세팅)
  const placeBet = (side, amount) => {
    const amt = Math.min(Math.floor(amount / 100) * 100, Math.floor(S.gold * G.betCapRate()));
    if (amt <= 0) return;
    S.currentBet = { side, amount: amt };
    S.gold -= amt;
  };

  // [3막] 🔨 경매의 날 — 저녁과 밤 사이. endAuction()은 밤 연출을 시작하므로 부르지 않는다.
  const runAuction = (bot) => {
    if (!G.isAuctionDay()) return;
    G.startAuction();                       // 스텁 setTimeout이 즉시 renderAuction까지 진행
    let safety = 0;
    while (S.auction && !S.auction.done && safety++ < 60) {
      if (!bot.auction(S.auction)) break;   // false = 여기서 손을 뗀다
      G.raiseAuction();
    }
    if (S.auction && !S.auction.done) G.quitAuction();
    S.auction = null;
    G.hideModal();
  };

  // 하루 루프: ☀️낮 흥정 → 🌆저녁 정산 → 🔨경매(3막) → 🌙밤 베팅 → 💸빚 이자
  const runDay = (bot) => {
    S.event = { id: 'normal' };
    S.customers = G.genCustomers(); S.custIdx = 0; S.purchases = [];
    for (let i = 0; i < S.customers.length; i++) {
      S.custIdx = i;
      bot.haggle(S.customers[i]);
    }
    G.renderEvening(); // 매입품 되팔이 정산 (진짜 가치 공개)
    runAuction(bot);

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
    auction() { return false; /* 호가에 손도 대지 않는다 */ },
  };

  const BOT_RANDOM = {
    name: 'BOT_RANDOM (무작위)',
    haggle(c) {
      if (c.rival) return bidWith(c, (c.item.lo + c.item.hi) / 2 * G.rand(0.3, 1.1)); // 감으로 지른다
      haggleWith(c, (cc) => Math.round(cc.asking * G.rand(0.3, 1.0) / 100) * 100);
    },
    bet() { placeBet(Math.random() < 0.5 ? 'A' : 'B', S.gold * G.rand(0.02, 0.10)); },
    auction(A) { return Math.random() < 0.5 && A.price + A.step <= S.gold; }, // 감으로 따라간다
  };

  const BOT_SMART = {
    name: 'BOT_SMART (정보 활용)',
    // 숨은 최저 수락가 바로 위를 노린다 = 검수·힌트를 완벽히 읽어낸 플레이어
    haggle(c) {
      // [2막] 라이벌 입찰: 나사장을 딱 한 끗 넘겨 부른다 — 단, 이익이 남을 때만
      if (c.rival) {
        const need = Math.max(c.M, c.rivalBid + 100);
        if (need >= c.V * 0.95) return;                // 승자의 저주 회피 — 포기
        return bidWith(c, need);
      }
      haggleWith(c, (cc) => Math.max(100, Math.round(cc.M * 1.04 / 100) * 100));
    },
    // 소문의 진짜 효과를 읽어 실제 승률을 추정 → 기대값(+)일 때만 베팅
    bet(m) {
      const eff = (rs) => rs.reduce((s, r) => s + r.effect, 0);
      const p = G.clamp(m.est + eff(m.rumorsA) - eff(m.rumorsB), CONFIG.WINPROB_MIN, CONFIG.WINPROB_MAX);
      const evA = p * m.oddsA - 1, evB = (1 - p) * m.oddsB - 1;
      const best = evA >= evB ? { side: 'A', ev: evA } : { side: 'B', ev: evB };
      if (best.ev <= 0.05) return; // 우위가 없으면 관망 (방치가 아니라 절제)
      placeBet(best.side, S.gold * 0.08);
    },
    // 이익이 남는 선까지만 따라간다 — 그 위로는 미련 없이 손을 뗀다
    auction(A) { return A.price + A.step <= Math.min(A.lot.V * 0.85, S.gold); },
  };

  // [Phase5] 보통 플레이어 — 정보를 보긴 하지만 완벽히 읽지 못한다(실난이도 측정용).
  // 흥정: 최저가를 ±18% 오차로 추정 / 베팅: 헛소문을 걸러내지 못하고 액면 그대로 믿는다
  const BOT_AVERAGE = {
    name: 'BOT_AVERAGE (보통)',
    haggle(c) {
      // [2막] 라이벌 입찰: 성향 힌트를 보긴 하지만 세기를 정확히 모른다 → 시세 기준 ±오차로 지른다
      if (c.rival) {
        const lean = c.rivalTell ? (c.rivalTell.aggr > 1 ? 1.08 : 0.94) : 1; // 방향만 읽고 크기는 못 읽음
        return bidWith(c, c.V * G.rand(0.62, 0.92) * lean);
      }
      const guess = c.M * G.rand(0.82, 1.18);
      haggleWith(c, () => Math.max(100, Math.round(guess * 1.05 / 100) * 100));
    },
    bet(m) {
      const naive = (rs) => rs.reduce((s, r) => s + Math.abs(r.effect) * r.sign, 0); // 진짜/헛소문 구분 못함
      const p = G.clamp(m.est + naive(m.rumorsA) - naive(m.rumorsB), CONFIG.WINPROB_MIN, CONFIG.WINPROB_MAX);
      const evA = p * m.oddsA - 1, evB = (1 - p) * m.oddsB - 1;
      const best = evA >= evB ? { side: 'A', ev: evA } : { side: 'B', ev: evB };
      if (best.ev <= 0.05) return;
      placeBet(best.side, S.gold * 0.06);
    },
    // 가치를 대충 어림해 그 언저리까지 따라간다 (승자의 저주에 자주 걸린다)
    auction(A) {
      if (A._cap == null) A._cap = A.lot.V * G.rand(0.7, 1.05);
      return A.price + A.step <= Math.min(A._cap, S.gold);
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

  return { resolveMatch, haggleWith, placeBet, runDay, runCampaign, BOT_IDLE, BOT_RANDOM, BOT_AVERAGE, BOT_SMART };
}

// 엔딩 판정 (result.js의 분기 기준과 동일 — 임계는 CONFIG에서 읽는다)
export function endingOf(run, CONFIG) {
  if (run.ending === 'debt_fail') return '💸 배드: 빚의 무게';
  if (run.ending === 'act2_fail') return '🚬 회장의 감정사';
  if (run.net >= CONFIG.ENDING_TRUE) return '👑 진엔딩: 지하경제의 왕';
  if (run.net >= CONFIG.ENDING_RING) return '🥊 격투장의 새 주인';
  return '🏪 이름난 전당포 주인';
}

export const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

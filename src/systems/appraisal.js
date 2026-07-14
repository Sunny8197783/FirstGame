// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function actOf() { return S.day <= CONFIG.ACT1_END ? 1 : S.day <= CONFIG.ACT2_END ? 2 : 3; }

function customersPerDay() {
  return CONFIG.CUSTOMERS_PER_DAY
    + (S.upgrades && S.upgrades.expand ? 1 : 0)
    + (S.upgrades && S.upgrades.remodel ? 1 : 0);
}


function genCustomers() {
  const n = customersPerDay();
  // 현재 막에서 풀린 매물만 유통 + 현재 골드로 정가 매입이 가능한 아이템 우선 배치
  const pool = ITEMS.filter(it => (it.act || 1) <= actOf());
  const budget = Math.max(S.gold, 2000);
  const aff = shuffle(pool.filter(it => (it.lo + it.hi) / 2 * CONFIG.AFFORD_RATE <= budget));
  const rest = shuffle(pool.filter(it => !aff.includes(it)));
  const itemPool = shuffle(aff.slice(0, n - 1)
    .concat(rest.length ? [rest[0]] : [])
    .concat(aff.slice(n - 1)).concat(rest.slice(1)));
  // 큰손 이벤트 또는 '큰손 인맥' 업그레이드: 손님 하나는 반드시 고가품을 들고 온다
  if ((S.event && S.event.vip) || S.upgrades.bigshot) {
    const lux = pool.filter(it => it.hi >= 18000);
    if (lux.length) itemPool[randInt(0, n - 1)] = pick(lux);
  }
  return Array.from({ length: n }, (_, i) => {
    const ctype = pick(CUSTOMER_TYPES);
    const item = itemPool[i % itemPool.length];
    const V = Math.round(rand(item.lo, item.hi) / 100) * 100;
    // 단골: 같은 유형과 REGULAR_DEALS_REQ회 이상 거래 성사 → 더 싸게 넘겨준다
    const regular = (S.regularDeals[ctype.type] || 0) >= CONFIG.REGULAR_DEALS_REQ;
    const desperation = Math.max(0.5, rand(ctype.desp[0], ctype.desp[1]) - (regular ? CONFIG.REGULAR_DESP_DISCOUNT : 0));
    let M = Math.round(V * desperation);
    // 밀당 흥정 파라미터: 첫 요구가(앵커 — 유형별 뻥튀기/투매 성향), 인내심
    let asking = Math.max(M + 300, Math.round(V * rand(ctype.ask[0], ctype.ask[1]) / 100) * 100);
    let patience = ctype.pat;
    // 🚨 장물: 수상한 부류가 터무니없이 싸게 서둘러 던진다 — 너무 싼 건 이유가 있다
    const stolen = !!ctype.shady && Math.random() < CONFIG.STOLEN_RATE;
    if (stolen) {
      asking = Math.round(V * rand(0.45, 0.60) / 100) * 100;
      M = Math.min(M, Math.round(V * rand(0.33, 0.48)));
      patience = 2;
    }
    // 🎉 숨은 진품: 저녁 되팔이 때 가치 ×2로 판명 (아무도 모른다)
    const jackpot = !stolen && Math.random() < CONFIG.JACKPOT_RATE;
    // 힌트 생성: 가치의 위치(t)에 따라 방향성 힌트 선택
    const t = (V - item.lo) / (item.hi - item.lo);
    const dir = t >= 0.55 ? 'high' : t <= 0.45 ? 'low' : 'mid';
    let hints = [];
    if (dir === 'mid') {
      hints = [ { text: pick(item.high), trap: false }, { text: pick(item.low), trap: false } ];
    } else {
      const pool = shuffle(item[dir]);
      hints = [ { text: pool[0], trap: false }, { text: pool[1 % pool.length], trap: false } ];
    }
    if (Math.random() < 0.5) hints.push({ text: pick(NEUTRAL_HINTS), trap: false });
    // 함정 힌트: 실제 방향과 반대를 가리키는 힌트로 교체
    const trapRate = ctype.swindler ? CONFIG.TRAP_HINT_RATE_SWINDLER : CONFIG.TRAP_HINT_RATE;
    let hasTrap = false;
    if (Math.random() < trapRate) {
      hasTrap = true;
      const trapPool = dir === 'high' ? item.trapLow : dir === 'low' ? item.trapHigh
                     : (Math.random() < 0.5 ? item.trapHigh : item.trapLow);
      hints[randInt(0, Math.min(1, hints.length - 1))] = { text: pick(trapPool), trap: true };
    }
    // 실물 검수: 부위별 상태 점수(1~5). 진짜 가치 위치(t)에서 나오되,
    // 부위마다 VISUAL_NOISE_RATE 확률로 ±1 오차가 생긴다 (⚖️ 정밀 저울 보유 시 오차 없음)
    const partNames = ITEM_PARTS[item.name] || ['외관', '상태', '마감'];
    const baseScore = clamp(Math.round(t * 4) + 1, 1, 5);
    const partsView = partNames.map(pn => {
      let sc = baseScore;
      if (!S.upgrades.scale && Math.random() < CONFIG.VISUAL_NOISE_RATE) sc = clamp(sc + (Math.random() < 0.5 ? -1 : 1), 1, 5);
      return { name: pn, score: sc, desc: pick(STATE_DESC[sc - 1]) };
    });
    const avgScore = partsView.reduce((s, p) => s + p.score, 0) / partsView.length;
    // 진열대 마크는 검수 점수와 일치하도록 파생 (정보 채널이 어긋나지 않게)
    const DEFECTS = ['💥', '🩹', '🕸️'];
    const nDef = avgScore <= 1.8 ? 3 : avgScore <= 2.6 ? 2 : avgScore <= 3.3 ? 1 : 0;
    const nSpark = avgScore >= 4.5 ? 2 : avgScore >= 3.8 ? 1 : 0;
    const marks = shuffle(DEFECTS).slice(0, nDef).map(e => ({ e, spark: false }))
      .concat(Array.from({ length: nSpark }, () => ({ e: '✨', spark: true })))
      .map(mk => ({ ...mk, x: randInt(6, 74), y: randInt(6, 62) }));
    return {
      name: pick(CUSTOMER_NAMES), ctype, item, V, M, desperation, regular, t,
      asking, patience, stolen, jackpot,
      hints: shuffle(hints), hasTrap, line: pick(ctype.lines), marks, nDef, nSpark, partsView,
    };
  });
}

Object.assign(globalThis, { actOf, customersPerDay, genCustomers });
export { actOf, customersPerDay, genCustomers };

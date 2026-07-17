// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function actOf() { return S.day <= CONFIG.ACT1_END ? 1 : S.day <= CONFIG.ACT2_END ? 2 : 3; }

// [Phase3] 시즌 모드 헬퍼: 시즌 몇 일째인가 (캠페인 중엔 0)
function seasonDayOf() {
  if (!S.season || S.day <= CONFIG.DAYS) return 0;
  return ((S.day - CONFIG.DAYS - 1) % CONFIG.SEASON_LEN) + 1;
}
// [Phase3] 프레스티지(가게 이전) 배율 — 아이템 가치가 험한 동네일수록 커진다
function prestigeMul() { return 1 + (S.prestige || 0) * CONFIG.PRESTIGE_VALUE_MUL; }

function customersPerDay() {
  return CONFIG.CUSTOMERS_PER_DAY
    + ((CONFIG.ACT_CUSTOMER_BONUS && CONFIG.ACT_CUSTOMER_BONUS[actOf()]) || 0) // [밸런스] 막별 물량 증가
    + (S.upgrades && S.upgrades.expand ? 1 : 0)
    + (S.upgrades && S.upgrades.remodel ? 1 : 0)
    + ((S.event && S.event.extraCustomer) || 0); // [Phase3] 손님 몰림 이벤트
}


function genCustomers() {
  const n = customersPerDay();
  // 현재 막에서 풀린 매물만 유통 + 현재 골드로 정가 매입이 가능한 아이템 우선 배치
  // [Phase3] 전설 세트(set 필드)는 시즌 모드에서 현재 시즌 세트만 로테이션 유통
  const curSet = S.season > 0 ? ((S.season - 1) % 3) + 1 : 0;
  const pool = ITEMS.filter(it => (it.act || 1) <= actOf())
    .filter(it => !it.set || it.set === curSet);
  // [매물 진행] 자산에 맞는 물건만 들어온다 — 자산이 늘수록 매물이 점점 비싸진다.
  // ⚠️ 예전 코드는 감당 가능/불가능을 나눈 뒤 전체를 shuffle해서 필터가 무력화됐다.
  //    (1일차 5,000G에 12만G짜리가 뜨던 원인) 이제 보이는 n명분을 직접 구성한다.
  const budget = Math.max(S.gold, 2000);
  const midOf = (it) => (it.lo + it.hi) / 2;
  const cost = (it) => midOf(it) * CONFIG.AFFORD_RATE; // 흥정 후 대략적인 매입 예상가
  const floor = budget * CONFIG.ITEM_FLOOR_RATE;       // 자산이 커지면 푼돈 물건은 발길이 끊긴다
  let aff = pool.filter(it => cost(it) <= budget && midOf(it) >= floor);
  if (aff.length < 3) aff = pool.filter(it => cost(it) <= budget);         // 풀이 마르면 바닥 해제
  if (!aff.length) aff = [...pool].sort((a, b) => midOf(a) - midOf(b)).slice(0, 3); // 극빈 구제
  aff = shuffle(aff);
  // 도전 매물: 예산을 '살짝' 넘는 물건 1개. 엄두도 못 낼 물건은 아예 안 나온다.
  const stretch = shuffle(pool.filter(it => cost(it) > budget && cost(it) <= budget * CONFIG.STRETCH_MAX_RATE));
  const list = [];
  for (let i = 0; i < n; i++) list.push(aff[i % aff.length]);
  if (S.day >= CONFIG.STRETCH_FROM_DAY && stretch.length) list[randInt(0, n - 1)] = stretch[0];
  const itemPool = shuffle(list);
  // 큰손 이벤트 또는 '큰손 인맥' 업그레이드: 손님 하나는 반드시 고가품을 들고 온다
  if ((S.event && S.event.vip) || S.upgrades.bigshot) {
    const lux = pool.filter(it => it.hi >= 18000);
    if (lux.length) itemPool[randInt(0, n - 1)] = pick(lux);
  }
  return Array.from({ length: n }, (_, i) => {
    const ctype = pick(CUSTOMER_TYPES);
    const item = itemPool[i % itemPool.length];
    const V = Math.round(rand(item.lo, item.hi) * prestigeMul() / 100) * 100; // [Phase3] 프레스티지 배율
    // 단골: 같은 유형과 REGULAR_DEALS_REQ회 이상 거래 성사 → 더 싸게 넘겨준다
    const regular = (S.regularDeals[ctype.type] || 0) >= CONFIG.REGULAR_DEALS_REQ;
    const desperation = Math.max(0.5, rand(ctype.desp[0], ctype.desp[1]) - (regular ? CONFIG.REGULAR_DESP_DISCOUNT : 0));
    let M = Math.round(V * desperation);
    // 밀당 흥정 파라미터: 첫 요구가(앵커 — 유형별 뻥튀기/투매 성향), 인내심
    let asking = Math.max(M + 300, Math.round(V * rand(ctype.ask[0], ctype.ask[1]) / 100) * 100);
    let patience = ctype.pat + ((S.event && S.event.patienceBonus) || 0); // [Phase3] 거리 악사 이벤트
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
    // [Phase3] 손님 몰림 이벤트(trapBoost) + 프레스티지(험한 동네일수록 함정↑)
    const trapRate = (ctype.swindler ? CONFIG.TRAP_HINT_RATE_SWINDLER : CONFIG.TRAP_HINT_RATE)
      + ((S.event && S.event.trapBoost) || 0)
      + (S.prestige || 0) * CONFIG.PRESTIGE_TRAP_ADD;
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
      if (!S.upgrades.scale && !(S.event && S.event.noNoise) && Math.random() < CONFIG.VISUAL_NOISE_RATE) sc = clamp(sc + (Math.random() < 0.5 ? -1 : 1), 1, 5); // [Phase3] 감정 세미나: 당일 오차 없음
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
    const c = {
      name: pick(CUSTOMER_NAMES), ctype, item, V, M, desperation, regular, t,
      asking, patience, stolen, jackpot,
      hints: shuffle(hints), hasTrap, line: pick(ctype.lines), marks, nDef, nSpark, partsView,
    };
    // [2막] 🏪 라이벌 전당포: 2막부터 일부 손님은 황금손도 노린다 → 밀봉 입찰 1회 승부.
    // 장물은 라이벌도 손대지 않는다(뒤탈 나는 물건은 서로 피한다).
    if (actOf() >= 2 && !stolen && Math.random() < CONFIG.RIVAL_RATE) {
      const tell = Math.random() < CONFIG.RIVAL_TELL_RATE ? pick(RIVAL_TELLS) : null;
      const aggr = tell ? tell.aggr : 1;
      // 라이벌도 눈이 있다 — 진짜 가치 기반으로 입찰하되 성향(aggr)만큼 세게/약하게 부른다
      c.rival = true;
      c.rivalTell = tell;
      c.rivalBid = Math.max(100, Math.round(V * rand(CONFIG.RIVAL_BID_LO, CONFIG.RIVAL_BID_HI) * aggr / 100) * 100);
      c.rivalLine = pick(RIVAL_INTRO);
    }
    return c;
  });
}

Object.assign(globalThis, { actOf, seasonDayOf, prestigeMul, customersPerDay, genCustomers });
export { actOf, seasonDayOf, prestigeMul, customersPerDay, genCustomers };

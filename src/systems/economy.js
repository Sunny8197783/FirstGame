// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function startGame() {
  sndClick();
  S.day = 0; S.gold = CONFIG.START_GOLD;
  S.season = 0;                 // [Phase3] 0 = 캠페인, 1+ = 시즌 모드
  S.prestige = 0;               // [Phase3] 가게 이전 횟수
  S.endingId = null;            // 막 전환 판정에서 정해지는 엔딩 분기
  S.debt = CONFIG.DEBT_START;   // 김사장에게 진 빚 — 매일 아침 이자가 붙는다
  S.sponsorIdx = null;          // 후원 계약 중인 파이터 인덱스
  S.sponsorOffersDay = 0;       // 후원 후보 갱신 기준일
  S.upgrades = {};        // 암시장에서 산 도구들
  S.regularDeals = {};    // 손님 유형별 거래 성사 횟수 (단골 판정)
  S.player = { name: '당신', emoji: '🥋', ...CONFIG.PLAYER_STATS, w: 0, l: 0 }; // 직접 출전용
  S.challenge = null; S.challengeOfferDay = 0;
  S.stats = { deals: 0, rejected: 0, tradePL: 0, buyRatioSum: 0, bestDeal: 0, jackpots: 0, stolenLost: 0,
              bets: 0, betWins: 0, betPL: 0, houseEstSum: 0, drops: 0, loans: 0, sponsorIncome: 0,
              playerFights: 0, playerWins: 0, challengePL: 0,
              // [Phase2] 업적 추적 카운터
              dealStreak: 0, stolenSold: 0, clashWins: 0, feintStreak: 0, trapProfits: 0,
              betToday: false, noBetRun: 0 };
  S.history = []; // [Phase2] 일자별 통계 스냅샷
  // 파이터 초기화: 스탯 ±JITTER 랜덤 변동(매 판 다른 전력) + 초기 전적 시드
  const J = CONFIG.FIGHTER_STAT_JITTER;
  S.fighters = FIGHTERS_DATA.map(f => ({ ...f,
    atk: clamp(f.atk + randInt(-J, J), 1, 10),
    def: clamp(f.def + randInt(-J, J), 1, 10),
    spd: clamp(f.spd + randInt(-J, J), 1, 10),
    w: randInt(2, 5), l: randInt(1, 4) }));
  startDay();
}

/* ═══════════════════════════════════════════════════════════════
   낮 루프 — 감정 시스템
   ═══════════════════════════════════════════════════════════════ */
// 막 전환 인터루드 (스토리 컷신 + 해금 안내)

// [Phase3] 캠페인 클리어 후: 시즌 모드 진입 (결과 화면 버튼에서 호출)
function startSeasonMode() {
  sndClick();
  S.season = 1;
  S.endingId = null;
  renderInterlude('season', S.gold - S.debt, () => startDay());
}

// [Phase3] 시즌 교체: 승률 하위 파이터 은퇴 → 신인 데뷔 (후원 파이터는 계약 보호)
function rotateSeason() {
  S.season = Math.floor((S.day - CONFIG.DAYS - 1) / CONFIG.SEASON_LEN) + 1;
  const ranked = S.fighters.map((_, i) => i)
    .sort((a, b) => winRate(S.fighters[a]) - winRate(S.fighters[b]));
  const retired = [];
  let replaced = 0;
  for (let k = 0; k < ranked.length && replaced < CONFIG.SEASON_RETIRE; k++) {
    const idx = ranked[k];
    if (idx === S.sponsorIdx) continue;
    retired.push(S.fighters[idx].name);
    S.fighters[idx] = makeRookie();
    replaced++;
  }
  // 시즌이 바뀌면 모든 전적을 절반으로 리셋 (신·구 격차 완화)
  S.fighters.forEach(f => { f.w = Math.ceil(f.w / 2); f.l = Math.ceil(f.l / 2); });
  S.sponsorOffersDay = 0; S.challengeOfferDay = 0;
  const setName = ['왕실 예물', '전장 유물', '밀수 보물'][(S.season - 1) % 3];
  toast(`🌆 시즌 ${S.season} 개막! ${retired.join('·')} 은퇴 → 신인 데뷔 · 전설 세트: ${setName}`, 4200);
}

function makeRookie() {
  const name = pick(ROOKIE_RING) + ' ' + pick(ROOKIE_NAMES);
  return {
    name,
    emoji: pick(['🐯', '🦁', '🐲', '🦈', '🐆', '🦍', '🦏', '🦊']),
    color: pick(['#3a7a8a', '#8a3a5a', '#5a8a3a', '#8a6a2a', '#4a4a9a', '#7a3a8a']),
    atk: randInt(4, 9), def: randInt(4, 9), spd: randInt(4, 9),
    skill: pick(ROOKIE_SKILLS),
    w: 0, l: 0,
  };
}

function startDay() {
  S.day++;
  // [Phase3] 시즌 모드: 막 판정 없음 — 시즌 첫날마다 리그 물갈이 + 세트 로테이션
  if (S.season > 0) {
    if (seasonDayOf() === 1) rotateSeason();
    beginDay();
    return;
  }
  // ── 막 전환 판정 ──
  if (S.day === CONFIG.ACT1_END + 1) {
    // 8일차 아침: 김사장이 남은 빚을 강제 회수한다
    if (S.debt <= 0) { renderInterlude('act2', 0, beginDay); return; }
    if (S.gold >= S.debt) {
      const collected = S.debt;
      S.gold -= collected; S.debt = 0;
      updateHUD();
      renderInterlude('act2', collected, beginDay);
    } else {
      S.endingId = 'debt_fail';
      renderResult();
    }
    return;
  }
  if (S.day === CONFIG.ACT2_END + 1) {
    // 15일차 아침: 회장의 시험 판정 (순자산 기준)
    const net = S.gold - S.debt;
    if (net >= CONFIG.ACT2_TARGET) {
      renderInterlude('act3', net, beginDay);
    } else {
      S.endingId = 'act2_fail';
      renderResult();
    }
    return;
  }
  beginDay();
}


// [Phase2] 아침마다 전일까지의 누적 통계를 스냅샷 (추이 그래프·업적 판정용)
function recordHistory() {
  const st = S.stats;
  if (!S.history) S.history = [];
  if (S.history.some(h => h.day === S.day)) return; // 같은 아침 중복 방지 (이어하기 재개 등)
  S.history.push({
    day: S.day, gold: S.gold, debt: S.debt, net: S.gold - S.debt,
    deals: st.deals, rejected: st.rejected, bets: st.bets, betWins: st.betWins,
    houseEstSum: st.houseEstSum, betPL: st.betPL, tradePL: st.tradePL,
  });
  // 🧘 금욕의 7일: 어제 베팅이 없었으면 연속일 증가
  if (S.day > 1) {
    st.noBetRun = st.betToday ? 0 : (st.noBetRun || 0) + 1;
    if (st.noBetRun >= 7) achieve('no-bet-7');
  }
  st.betToday = false;
}

function beginDay() {
  recordHistory(); // [Phase2] 통계 스냅샷 (저장 전에 기록해 세이브에 포함)
  saveGame('morning'); // [Phase 1] 매일 아침 자동 저장 (이벤트·손님 생성 전 시점)
  let loanMsg = '';
  if (S.gold < CONFIG.BANKRUPT_FLOOR) {
    const borrowed = CONFIG.BANKRUPT_FLOOR - S.gold;
    S.gold = CONFIG.BANKRUPT_FLOOR;
    S.debt += borrowed; // 빌린 만큼 빚에 가산
    S.stats.loans++;
    loanMsg = `<p class="bad" style="font-size:18px">💸 김사장이 혀를 차며 ${fmt(borrowed)} G를 얹어줬다... 물론 빚이다.</p>`;
  }
  // 김사장 빚 이자 (2일차 아침부터 복리)
  let debtLine = '';
  if (S.day === 1) {
    debtLine = `<div style="font-size:15px; color:#ff6b6b; margin-top:6px">💸 김사장: "개업 축하하네. 빚 ${fmt(CONFIG.DEBT_START)} G — 7일 뒤에 받으러 오지. 이자는 매일 ${Math.round(CONFIG.DEBT_INTEREST * 100)}%야."</div>`;
  } else if (S.debt > 0) {
    S.debt = Math.round(S.debt * (1 + CONFIG.DEBT_INTEREST) / 100) * 100;
    debtLine = `<div style="font-size:15px; color:#ff6b6b; margin-top:6px">💸 남은 빚 ${fmt(S.debt)} G (이자 +${Math.round(CONFIG.DEBT_INTEREST * 100)}% 반영)</div>`;
  }
  // 일일 이벤트 추첨 (1일차는 튜토리얼 성격으로 평범한 날 고정)
  // [Phase3] 선택지형 이벤트: 아침 전환 → 선택 모달 → 선택 결과를 반영해 손님 생성
  const rolled = S.day === 1 ? DAILY_EVENTS[0] : pickWeighted(DAILY_EVENTS);
  S.event = { id: rolled.id, name: rolled.name, desc: rolled.desc };
  S.pendingEvent = rolled.choices ? rolled : null;
  S.phase = 'day'; S.purchases = [];
  setTheme('day'); updateHUD();
  const evLine = S.event.id !== 'normal'
    ? `<div style="font-size:18px; color:#ffb347; margin-top:6px">${S.event.name}<br><span style="font-size:14px; opacity:0.85">${S.event.desc}</span></div>` : '';
  // 막 목표 리마인더 / [Phase3] 시즌 모드 후일담
  const goalLine = S.season > 0
    ? (Math.random() < 0.25 ? `<div style="font-size:13px; color:#8fa3ff; margin-top:6px">${pick(EPILOGUE_LINES)}</div>` : '')
    : actOf() === 2
      ? `<div style="font-size:13px; color:#8fa3ff; margin-top:6px">🎯 회장의 시험: ${CONFIG.ACT2_END}일차까지 순자산 ${fmt(CONFIG.ACT2_TARGET)} G (현재 ${fmt(S.gold - S.debt)} G)</div>`
      : actOf() === 3
        ? `<div style="font-size:13px; color:#ff9edb; margin-top:6px">👑 ${CONFIG.DAYS}일차 밤, 그랜드 파이널 — 최대한 불려라</div>` : '';
  const dayLabel = S.season > 0 ? `시즌 ${S.season} — ${seasonDayOf()}일째 아침` : `${S.day}일차 아침`;
  showTransition(`<div>☀️</div><div>${dayLabel}</div><div style="font-size:16px;opacity:0.7">전당포 문을 연다${loanMsg ? '' : '...'}</div>${loanMsg}${debtLine}${goalLine}${evLine}`,
    () => { if (S.pendingEvent) showEventChoice(); else startCustomers(); },
    S.event.id !== 'normal' || S.day === 1 ? 2000 : 1600);
}

// [Phase3] 선택지 이벤트 모달 — 고른 선택지의 비용을 내고 효과를 S.event에 합친다
function showEventChoice() {
  const ev = S.pendingEvent;
  if (!ev) { startCustomers(); return; }
  showModal(`
    <h2 class="accent">${ev.name}</h2>
    <p style="font-size:14px">${ev.desc}</p>
    <div style="margin-top:10px">
      ${ev.choices.map((c, i) => `
        <button class="btn-big" style="width:100%; margin:4px 0; font-size:15px" ${c.cost > S.gold ? 'disabled' : ''}
          onclick="chooseEvent(${i})">${c.label}${c.cost ? ` (−${fmt(c.cost)} G)` : ''}
          ${c.note ? `<span class="menu-sub">${c.note}</span>` : ''}</button>`).join('')}
    </div>`);
}

function chooseEvent(i) {
  const ev = S.pendingEvent;
  if (!ev) return;
  const c = ev.choices[i];
  if (!c || c.cost > S.gold) return;
  sndClick();
  S.gold -= c.cost || 0;
  S.event = { id: ev.id, name: ev.name, desc: c.note || c.label, ...c.fx };
  S.pendingEvent = null;
  hideModal();
  updateHUD();
  startCustomers();
}

// 이벤트 확정 후 손님 생성 → 첫 손님 응대
function startCustomers() {
  S.customers = genCustomers();
  S.custIdx = 0;
  renderCustomer();
}


function nextCustomer() {
  hideModal();
  S.custIdx++;
  if (S.custIdx < S.customers.length) renderCustomer();
  else startEvening();
}

/* ═══════════════════════════════════════════════════════════════
   저녁 — 정산
   ═══════════════════════════════════════════════════════════════ */

function startEvening() {
  S.phase = 'evening'; setTheme('evening'); updateHUD();
  showTransition('<div>🌆</div><div>저녁 — 오늘의 장사를 정산한다</div>', renderEvening, 1100);
}


function renderEvening() {
  S.timeLabel = '오후 6:30';
  updateHUD();
  let total = 0;
  const mul = (S.event && S.event.resaleMul) || 1; // 호황/불황 이벤트 반영
  const rows = S.purchases.map(p => {
    // 🚨 장물: 매입한 게 장물이면 경찰에 압수될 수 있다 (매입가 전액 손실)
    if (p.stolen && Math.random() < CONFIG.STOLEN_CONFISCATE) {
      S.stats.stolenLost++;
      S.stats.tradePL -= p.price;
      total -= p.price;
      return `<tr>
        <td>🚨 ${p.item.emoji} ${p.item.name}</td>
        <td>-${fmt(p.price)}</td><td class="bad">경찰 압수!</td>
        <td class="bad">-${fmt(p.price)}</td>
      </tr>`;
    }
    // 🎉 숨은 진품 판정: 가치 ×2
    let saleV = Math.round(p.V * mul);
    let tag = p.stolen ? ' <span class="dim">(장물이었지만 무사통과)</span>' : '';
    if (p.jackpot) {
      saleV = Math.round(saleV * CONFIG.JACKPOT_MUL);
      tag = ' <span class="drop-fx" style="font-size:14px">🎉 진품 판정! ×' + CONFIG.JACKPOT_MUL + '</span>';
      S.stats.jackpots++;
    }
    const profit = saleV - p.price;
    S.gold += saleV;
    S.stats.tradePL += profit;
    S.stats.bestDeal = Math.max(S.stats.bestDeal, profit);
    total += profit;
    // [Phase2] 업적 훅: 잭팟·장물 무사 처분·함정 극복·큰 이익
    if (p.jackpot) { achieve('jackpot-1'); if (S.stats.jackpots >= 3) achieve('jackpot-3'); }
    if (p.stolen) { S.stats.stolenSold = (S.stats.stolenSold || 0) + 1; if (S.stats.stolenSold >= 5) achieve('stolen-5'); }
    if (p.hasTrap && profit > 0) { S.stats.trapProfits = (S.stats.trapProfits || 0) + 1; if (S.stats.trapProfits >= 5) achieve('trap-5'); }
    if (profit >= 10000) achieve('big-profit');
    return `<tr>
      <td>${p.item.emoji} ${p.item.name}${tag}</td>
      <td>-${fmt(p.price)}</td><td>+${fmt(saleV)}</td>
      <td class="${profit >= 0 ? 'good' : 'bad'}">${profit >= 0 ? '+' : ''}${fmt(profit)}</td>
    </tr>`;
  }).join('');
  S.purchases = [];
  updateHUD();
  $('screen').innerHTML = `
    <div class="panel">
      <h2>🌆 저녁 정산</h2>
      ${S.event && S.event.resaleMul ? `<p class="${S.event.resaleMul > 1 ? 'good' : 'bad'}" style="font-size:14px">${S.event.name} — 되팔이 가격 ×${S.event.resaleMul}</p>` : ''}
      ${rows ? `<table>
        <tr><th>매입 물건</th><th>매입가</th><th>되팔이</th><th>손익</th></tr>${rows}
      </table>` : '<p class="dim">오늘 매입한 물건이 없다. 정산할 것도 없다.</p>'}
      <p class="big" style="margin-top:12px">오늘 장사 손익:
        <span class="${total >= 0 ? 'good' : 'bad'}">${total >= 0 ? '+' : ''}${fmt(total)} G</span></p>
      <p>현재 자산: <span class="accent big">${fmt(S.gold)} G</span></p>
      <div class="center" style="margin-top:14px">
        <button class="btn-big" onclick="startNight()">🌙 지하 격투장으로 내려간다</button>
      </div>
    </div>`;
  updateDebug();
}

/* ═══════════════════════════════════════════════════════════════
   밤 루프 — 지하 격투장 베팅
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { startGame, startDay, beginDay, recordHistory, showEventChoice, chooseEvent, startCustomers, nextCustomer, startEvening, renderEvening, startSeasonMode, rotateSeason, makeRookie });
export { startGame, startDay, beginDay, recordHistory, showEventChoice, chooseEvent, startCustomers, nextCustomer, startEvening, renderEvening, startSeasonMode, rotateSeason, makeRookie };

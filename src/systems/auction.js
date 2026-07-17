// [3막 신규] 🔨 경매의 날 — 3막에만 열리는 공개 호가 경매.
// 흥정(손님과 다회 밀당)·밀봉입찰(단 한 번)과 또 다른 세 번째 결정 구조:
//   여러 경쟁자와 호가를 주고받으며 "언제 손을 뗄지"를 정한다.
//   남들이 계속 따라붙으면 내 감정이 틀린 걸까? — 승자의 저주와 정보의 싸움.
// 경쟁자의 상한선은 끝까지 안 보인다 (정보 비대칭 원칙 유지).
// 낙찰품은 매입품으로 편입되어 다음 저녁 정산에서 진짜 가치가 판명된다(기존 루프 재사용).

function isAuctionDay() {
  return S.season === 0 && CONFIG.AUCTION_DAYS.includes(S.day);
}

// 경매 출품작 — 손님 생성기를 재사용해 검수·힌트·함정 정보 구조를 그대로 얻는다.
// 시세 상단(item.hi)만 보면 진짜 가치(V)가 낮게 굴러 '거물 물건'이 아닐 수 있으므로,
// 여러 후보 중 가치가 가장 높은 물건을 골라 V 하한을 만족할 때까지 뽑는다.
function genAuctionLot() {
  let best = null;
  for (let i = 0; i < 12; i++) {
    for (const c of genCustomers()) {
      if (c.stolen || c.item.hi < CONFIG.AUCTION_MIN_HI) continue;
      if (!best || c.V > best.V) best = c;
    }
    if (best && best.V >= CONFIG.AUCTION_MIN_V) break;
  }
  return best || genCustomers()[0];
}

function startAuction() {
  sndClick();
  const lot = genAuctionLot();
  // 경쟁자별 숨은 상한선 = 진짜 가치 × 성향 배율 (플레이어는 모른다)
  const rivals = AUCTION_BIDDERS.map(b => ({
    ...b,
    limit: Math.round(lot.V * rand(b.mul[0], b.mul[1]) / 100) * 100,
    out: false,
  }));
  const step = Math.max(500, Math.round(lot.V * CONFIG.AUCTION_STEP_RATE / 100) * 100);
  S.auction = {
    lot, rivals, step,
    price: Math.max(step, Math.round(lot.V * CONFIG.AUCTION_START_RATE / 100) * 100),
    holder: null, // null = 아직 아무도, 'me' = 나, 그 외 = 경쟁자 id
    done: false,
  };
  setTheme('evening');
  showTransition('<div>🔨</div><div class="blink" style="color:#ffd23e">경매의 날</div>'
    + '<div style="font-size:16px;opacity:0.7">거물 물건이 나왔다. 눈 밝은 자들이 모여든다...</div>',
    renderAuction, 1400);
}

function renderAuction() {
  const A = S.auction;
  if (!A) return;
  S.phase = 'auction'; S.timeLabel = '오후 8:00';
  updateHUD();
  const c = A.lot;
  const nextPrice = A.price + A.step;
  const canRaise = nextPrice <= S.gold;
  $('screen').innerHTML = `
    <div class="scene scene-auction">
      <div class="auc-crowd"></div>
      <div class="day-grid">
        <div class="panel">
          <h3 class="accent">🔨 출품작</h3>
          <h2 class="center" style="font-size:18px">${c.item.emoji} ${c.item.name}</h2>
          <p class="dim center" style="font-size:12px">${c.item.lore || ''}</p>
          <p class="dim center">시장 시세: ${fmt(c.item.lo)} ~ ${fmt(c.item.hi)} G</p>
          <div class="drop-in" style="width:150px; margin:8px auto 10px">
            <div class="item-stage">
              <div class="shelf"></div>
              ${pixelArtHTML(c.item)}
              ${c.marks.map(mk => `<span class="mark${mk.spark ? ' sparkle' : ''}" style="left:${mk.x}%;top:${mk.y}%">${mk.e}</span>`).join('')}
            </div>
          </div>
          <div class="inspect">
            <p style="font-size:12px; margin-bottom:3px">🔍 실물 검수 ${S.upgrades.scale
              ? '<span class="good">(⚖️ 정밀 저울 — 오차 없음)</span>'
              : '<span class="dim">(눈대중 — 오차 있음)</span>'}</p>
            ${c.partsView.map(p => `<div class="inspect-row">
              <span class="inspect-name">${p.name}</span>
              <span class="inspect-desc">${p.desc}</span>
              <span class="inspect-dots">${'●'.repeat(p.score)}${'○'.repeat(5 - p.score)}</span>
            </div>`).join('')}
          </div>
          ${c.hints.map(h => `<div class="hint">👁️ ${h.text}</div>`).join('')}
          ${S.upgrades.lens ? `<div class="hint" style="border-left-color:#7dff7d">🔎 감정 렌즈: 가치가 시세 <b>${c.t < 0.33 ? '하단' : c.t < 0.66 ? '중단' : '상단'}권</b>으로 보인다</div>` : ''}
        </div>

        <div class="panel panel-auction">
          <h3 class="accent center">📣 현재 호가</h3>
          <p class="huge center accent" id="auc-price" style="margin:6px 0">${fmt(A.price)} G</p>
          <p class="center" id="auc-holder" style="font-size:14px">
            ${A.holder === 'me' ? '<b class="good">내가 최고가</b>'
              : A.holder ? `<b class="bad">${rivalOf(A.holder).emoji} ${rivalOf(A.holder).name}</b>이(가) 최고가`
              : '<span class="dim">아직 아무도 부르지 않았다</span>'}</p>
          <div id="auc-log" class="fightlog" style="min-height:90px; max-height:120px; margin:10px 0"></div>
          <button class="btn-big" id="auc-raise" style="width:100%" onclick="raiseAuction()" ${canRaise ? '' : 'disabled'}>
            ${canRaise ? `호가를 올린다 (${fmt(nextPrice)} G)` : '💸 자금 부족'}
          </button>
          <button class="btn-ghost" style="width:100%; margin-top:6px" onclick="quitAuction()">손을 뗀다</button>
          <p class="dim" style="font-size:11px; margin-top:8px">
            경쟁자가 모두 물러나면 <b>현재 호가</b>에 낙찰된다. 남들이 따라붙는다고 무리하면 —
            낙찰돼도 손해다.</p>
        </div>

        <div class="panel">
          <h3 class="accent">👥 경쟁자</h3>
          <p class="dim" style="font-size:12px">상한선은 아무도 말해주지 않는다. 물러나는 순간이 곧 정보다.</p>
          <div id="auc-rivals">${rivalsHTML()}</div>
        </div>
      </div>
    </div>`;
  aucLog(`🔨 "${c.item.name}" 경매를 시작합니다. 시작가 ${fmt(A.price)} G!`);
  updateDebug();
}

function rivalOf(id) { return S.auction.rivals.find(r => r.id === id); }

function rivalsHTML() {
  return S.auction.rivals.map(r => `
    <div class="auc-rival ${r.out ? 'out' : ''}">
      <span style="font-size:22px">${r.emoji}</span>
      <span class="auc-rival-name">${r.name}</span>
      <span class="auc-rival-state">${r.out ? '<span class="dim">손 뗌</span>' : '<span class="accent blink">경합 중</span>'}</span>
      <div class="auc-rival-desc dim">${r.desc}</div>
    </div>`).join('');
}

function aucLog(html) {
  const el = $('auc-log');
  if (!el) return;
  el.innerHTML += `<div>${html}</div>`;
  el.scrollTop = el.scrollHeight;
}

// 내가 호가를 올린다 → 경쟁자 중 하나가 받아치거나, 아무도 못 따라오면 낙찰
function raiseAuction() {
  const A = S.auction;
  if (!A || A.done) return;
  const bid = A.price + A.step;
  if (bid > S.gold) return;
  sndClick();
  A.price = bid; A.holder = 'me';
  aucLog(`🙋 <b class="good">나</b>: ${fmt(bid)} G!`);

  // 경쟁자 응수: 상한선이 다음 호가를 감당하는 자 중 한 명이 받아친다
  const next = A.price + A.step;
  const able = A.rivals.filter(r => !r.out && r.limit >= next);
  A.rivals.forEach(r => {
    if (!r.out && r.limit < next) {
      r.out = true;
      aucLog(`🚪 <span class="dim">${r.emoji} ${r.name}이(가) 고개를 젓고 손을 내렸다.</span>`);
    }
  });
  if (able.length) {
    const ch = pick(able);
    A.price = next; A.holder = ch.id;
    sndBad();
    aucLog(`✋ <b class="bad">${ch.emoji} ${ch.name}</b>: ${fmt(next)} G!`);
  }
  refreshAuction();
  if (!A.rivals.some(r => !r.out)) winAuction();
}

function refreshAuction() {
  const A = S.auction;
  $('auc-price').textContent = fmt(A.price) + ' G';
  $('auc-holder').innerHTML = A.holder === 'me'
    ? '<b class="good">내가 최고가</b>'
    : A.holder ? `<b class="bad">${rivalOf(A.holder).emoji} ${rivalOf(A.holder).name}</b>이(가) 최고가` : '';
  $('auc-rivals').innerHTML = rivalsHTML();
  const nextPrice = A.price + A.step;
  const btn = $('auc-raise');
  if (btn) {
    const can = nextPrice <= S.gold;
    btn.disabled = !can;
    btn.textContent = can ? `호가를 올린다 (${fmt(nextPrice)} G)` : '💸 자금 부족';
  }
}

// 낙찰 — 매입품으로 편입(진짜 가치는 다음 저녁 정산에서 판명, 기존 루프 재사용)
function winAuction() {
  const A = S.auction;
  if (A.done) return;
  A.done = true;
  const c = A.lot, price = A.price;
  S.gold -= price;
  S.stats.deals++;
  S.stats.buyRatioSum += price / c.V;
  S.stats.auctionWon = (S.stats.auctionWon || 0) + 1;
  if (S.stats.auctionWon >= 2) achieve('auction-2');
  S.purchases.push({ item: c.item, V: c.V, price, jackpot: c.jackpot, stolen: false, hasTrap: c.hasTrap });
  updateHUD();
  sndJackpot();
  const topLimit = Math.max(...A.rivals.map(r => r.limit));
  showModal(`
    <h2 class="good">🔨 낙찰!</h2>
    <p>${c.item.emoji} <b>${c.item.name}</b>을(를) <b class="accent">${fmt(price)} G</b>에 손에 넣었다.</p>
    <p class="dim" style="font-size:13px">경쟁자 최고 상한선은 ${fmt(topLimit)} G였다
      — ${price > topLimit + A.step ? '필요 이상으로 올렸다.' : '거의 최소한으로 이겼다.'}</p>
    <p style="font-size:13px">진짜 가치는 <b>다음 저녁 정산</b>에서 판명된다.</p>
    <div class="center"><button class="btn-big" onclick="endAuction()">🌙 격투장으로</button></div>`);
}

// 손을 뗀다 — 경쟁자들이 자기들끼리 가져간다
function quitAuction() {
  const A = S.auction;
  if (!A || A.done) return;
  A.done = true;
  sndClick();
  const alive = A.rivals.filter(r => !r.out);
  const winner = alive.length
    ? alive.reduce((a, b) => (a.limit >= b.limit ? a : b))
    : A.rivals.reduce((a, b) => (a.limit >= b.limit ? a : b));
  const soldAt = Math.max(A.price, Math.min(winner.limit, A.price + A.step));
  showModal(`
    <h2>🚪 손을 뗐다</h2>
    <p>${winner.emoji} <b>${winner.name}</b>이(가) <b>${fmt(soldAt)} G</b>에 가져갔다.</p>
    <table style="margin:10px 0">
      <tr><td>내가 멈춘 호가</td><td>${fmt(A.price)} G</td></tr>
      <tr><td>진짜 가치</td><td class="accent">${fmt(A.lot.V)} G${A.lot.jackpot ? ' (숨은 진품이었다...!)' : ''}</td></tr>
    </table>
    <p class="dim" style="font-size:13px">💡 ${soldAt > A.lot.V
      ? '잘 물러났다 — 저 값이면 낙찰자가 손해다.'
      : '아까웠다. 조금 더 따라갔다면 이익이었다.'}</p>
    <div class="center"><button class="btn-big" onclick="endAuction()">🌙 격투장으로</button></div>`);
}

function endAuction() {
  hideModal();
  S.auction = null;
  startNight();
}

Object.assign(globalThis, {
  isAuctionDay, genAuctionLot, startAuction, renderAuction, raiseAuction,
  refreshAuction, winAuction, quitAuction, endAuction, rivalOf, rivalsHTML, aucLog,
});
export { isAuctionDay, startAuction, renderAuction, raiseAuction, winAuction, quitAuction, endAuction };

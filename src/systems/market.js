// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function renderDawnShop() {
  S.phase = 'dawn'; S.timeLabel = '새벽 2:00';
  updateHUD();
  const items = UPGRADES.filter(u => (u.act || 1) <= actOf()).map(u => {
    const cost = CONFIG.UPGRADE_COSTS[u.id];
    const owned = !!S.upgrades[u.id];
    const cantAfford = cost > S.gold;
    return `
      <div class="panel" style="margin:6px 0; padding:12px">
        <div class="row" style="align-items:center; flex-wrap:nowrap; gap:10px">
          <span style="font-size:34px">${u.emoji}</span>
          <div style="flex:1">
            <h3 style="font-size:16px">${u.name} ${owned ? '<span class="good">— 보유 중 ✔</span>' : ''}</h3>
            <p class="dim" style="font-size:13px">${u.desc}</p>
          </div>
          ${owned ? '' : `<button class="btn-pink" style="white-space:nowrap" onclick="buyUpgrade('${u.id}')" ${cantAfford ? 'disabled' : ''}>${fmt(cost)} G</button>`}
        </div>
      </div>`;
  }).join('');
  // 후원 후보는 하룻밤 동안 고정 (재렌더링해도 안 바뀜)
  if (S.sponsorOffersDay !== S.day) {
    S.sponsorOffers = shuffle(S.fighters.map((_, i) => i).filter(i => i !== S.sponsorIdx)).slice(0, 3);
    S.sponsorOffersDay = S.day;
  }
  const debtPanel = `
    <div class="panel" style="margin:6px 0; padding:12px; border-color:#a03a3a">
      <h3 style="font-size:16px">💸 김사장 빚 상환 창구</h3>
      ${S.debt > 0 ? `
        <p style="font-size:14px">남은 빚: <b class="bad">${fmt(S.debt)} G</b> <span class="dim">(내일 아침 이자 +${Math.round(CONFIG.DEBT_INTEREST * 100)}%)</span></p>
        <div style="margin-top:6px">
          <button class="btn-ghost" onclick="repayDebt(1000)" ${S.gold < 1000 || S.debt <= 0 ? 'disabled' : ''}>1,000 갚기</button>
          <button class="btn-ghost" onclick="repayDebt(5000)" ${S.gold < 5000 || S.debt <= 0 ? 'disabled' : ''}>5,000 갚기</button>
          <button class="btn-pink" onclick="repayDebt('all')" ${S.gold < S.debt ? 'disabled' : ''}>전액 상환 (${fmt(S.debt)} G)</button>
        </div>
        <p class="dim" style="font-size:12px; margin-top:4px">김사장 부하: "일찍 갚을수록 이자가 덜 붙는 거, 알지?"</p>`
      : `<p class="good">✔ 빚 청산 완료! 김사장이 아쉬운 표정으로 차용증을 찢었다.</p>
        ${actOf() >= 2 ? `
        <div class="row" style="align-items:center; margin-top:6px">
          <span class="dim" style="font-size:13px">김사장: "필요하면 또 빌려주지. 이자는 알지?"</span>
          <span style="flex:1"></span>
          <button class="btn-ghost" onclick="borrowLoan()">💸 ${fmt(CONFIG.LOAN_AMOUNT)} G 빌리기 (이자 ${Math.round(CONFIG.DEBT_INTEREST * 100)}%/일)</button>
        </div>` : ''}`}
    </div>`;
  const sponsorPanel = `
    <div class="panel" style="margin:6px 0; padding:12px">
      <h3 style="font-size:16px">🤝 파이터 후원 계약 <span class="dim" style="font-size:12px">(계약금 ${fmt(CONFIG.SPONSOR_COST)} G · 승리 시마다 +${fmt(CONFIG.SPONSOR_WIN_CUT)} G · 소문 전부 진위 확인)</span></h3>
      ${S.sponsorIdx !== null ? `<p style="font-size:14px">현재 계약: <b class="accent">${S.fighters[S.sponsorIdx].emoji} ${S.fighters[S.sponsorIdx].name}</b> (${S.fighters[S.sponsorIdx].w}승 ${S.fighters[S.sponsorIdx].l}패) — 새 계약 시 자동 해지</p>` : '<p class="dim" style="font-size:13px">아직 후원 중인 파이터가 없다.</p>'}
      <div class="row" style="margin-top:6px">
        ${S.sponsorOffers.map(i => { const f = S.fighters[i]; return `
          <div class="panel" style="flex:1; min-width:170px; margin:0; padding:8px">
            <p class="center" style="font-size:26px">${f.emoji}</p>
            <p class="center" style="font-size:13px">${f.name}</p>
            <p class="center dim" style="font-size:12px">${f.w}승 ${f.l}패 · 공${f.atk}/방${f.def}/속${f.spd}</p>
            <div class="center"><button class="btn-ghost" style="font-size:13px" onclick="signSponsor(${i})" ${CONFIG.SPONSOR_COST > S.gold ? 'disabled' : ''}>계약</button></div>
          </div>`; }).join('')}
      </div>
    </div>`;
  $('screen').innerHTML = `
    <div class="scene scene-night">
      <div class="crowd"></div>
      <div class="neon neon-l"></div><div class="neon neon-r"></div>
      <div style="position:relative; z-index:2">
        <h2 class="center neon-pink" style="margin-top:4px">🌌 새벽 암시장</h2>
        <p class="center dim" style="font-size:14px">격투장 뒷골목의 장물아비가 좌판을 벌였다.<br>밤에 번 돈으로 빚을 갚거나, 낮 장사를 강화하거나 — 선택은 당신 몫이다.</p>
        ${debtPanel}
        ${sponsorPanel}
        ${items}
        ${S.season > 0 ? `
        <div class="panel" style="margin:6px 0; padding:12px; border-color:#8a5aa0">
          <h3 style="font-size:16px">🏚️ 가게 이전 <span class="dim" style="font-size:12px">(프레스티지 ${S.prestige}회)</span></h3>
          <p class="dim" style="font-size:13px">더 험한 동네로 옮긴다 — 아이템 가치 <b class="good">+${Math.round(CONFIG.PRESTIGE_VALUE_MUL * 100)}%</b>,
            함정 힌트·헛소문 <b class="bad">+${Math.round(CONFIG.PRESTIGE_TRAP_ADD * 100)}%p</b> (영구 누적)</p>
          <div class="center"><button class="btn-ghost" onclick="confirmPrestige()">이전을 알아본다</button></div>
        </div>` : ''}
        <div class="center" style="margin-top:10px">
          <button class="btn-big" onclick="startDay()">잠자리에 든다 (다음 날로) →</button>
          <div style="margin-top:6px">
            <button class="btn-ghost" onclick="if(saveGame('dawn')) toast('새벽 시점에 저장했다 💾'); else toast('저장 실패 ⚠️')">💾 저장하기</button>
            <button class="btn-ghost" onclick="exportSave()">📤 내보내기</button>
          </div>
        </div>
      </div>
    </div>`;
  updateDebug();
  maybeTip('dawn'); // [Phase2] 1일차 온보딩 팁
}


// [Phase3] 가게 이전 프레스티지 — 위험과 보상을 함께 올리는 선택
function confirmPrestige() {
  sndClick();
  showModal(`
    <h2 class="accent">🏚️ 가게 이전</h2>
    <p style="font-size:14px">간판을 내리고 더 깊은 골목으로 들어간다. 되돌릴 수 없다.</p>
    <table style="margin:8px 0">
      <tr><td class="good">아이템 가치</td><td>+${Math.round(CONFIG.PRESTIGE_VALUE_MUL * 100)}% (누적 ×${(1 + (S.prestige + 1) * CONFIG.PRESTIGE_VALUE_MUL).toFixed(1)})</td></tr>
      <tr><td class="bad">함정 힌트</td><td>+${Math.round(CONFIG.PRESTIGE_TRAP_ADD * 100)}%p</td></tr>
      <tr><td class="bad">헛소문 동반</td><td>+${Math.round(CONFIG.PRESTIGE_FAKE_ADD * 100)}%p</td></tr>
    </table>
    <div class="center" style="margin-top:10px">
      <button class="btn-big" onclick="doPrestige()">이전한다</button>
      <button class="btn-ghost" onclick="hideModal()">아직은...</button>
    </div>`);
}

function doPrestige() {
  hideModal();
  S.prestige = (S.prestige || 0) + 1;
  sndDrop();
  renderInterlude('prestige', S.prestige, () => startDay());
}

function buyUpgrade(id) {
  const cost = CONFIG.UPGRADE_COSTS[id];
  if (S.upgrades[id] || cost > S.gold) return;
  S.gold -= cost;
  S.upgrades[id] = true;
  sndGood();
  renderDawnShop();
}


function borrowLoan() {
  sndClick();
  S.debt += CONFIG.LOAN_AMOUNT;
  S.gold += CONFIG.LOAN_AMOUNT;
  S.stats.loans++;
  updateHUD();
  renderDawnShop();
}


function repayDebt(amt) {
  const pay = amt === 'all' ? S.debt : Math.min(amt, S.debt);
  if (pay <= 0 || pay > S.gold) return;
  S.gold -= pay;
  S.debt -= pay;
  if (S.debt <= 0) {
    S.debt = 0; sndDrop();
    if (S.day <= 5) achieve('debt-free-5'); // [Phase2] 조기 상환 업적
  } else { sndGood(); }
  updateHUD();
  renderDawnShop();
}


function signSponsor(i) {
  if (CONFIG.SPONSOR_COST > S.gold || S.sponsorIdx === i) return;
  S.gold -= CONFIG.SPONSOR_COST;
  S.sponsorIdx = i;
  // 방금 계약한 파이터는 후보 목록에서 제외
  S.sponsorOffers = S.sponsorOffers.filter(x => x !== i);
  sndGood();
  updateHUD();
  renderDawnShop();
}

/* ═══════════════════════════════════════════════════════════════
   결과 화면 (7일 종료)
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { renderDawnShop, buyUpgrade, borrowLoan, repayDebt, signSponsor, confirmPrestige, doPrestige });
export { renderDawnShop, buyUpgrade, borrowLoan, repayDebt, signSponsor, confirmPrestige, doPrestige };

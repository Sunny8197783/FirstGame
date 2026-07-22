// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function renderCustomer() {
  S.timeLabel = CONFIG.DAY_TIMES[Math.min(S.custIdx, CONFIG.DAY_TIMES.length - 1)];
  updateHUD();
  const c = S.customers[S.custIdx];
  // 밀당 흥정 상태 초기화: D = 손님의 현재 요구가, P = 남은 인내심
  S.haggle = { D: c.asking, P: c.patience, maxP: c.patience };
  const sliderMin = Math.max(100, Math.round(c.item.lo * 0.3 / 100) * 100);
  // [2막] 라이벌 입찰은 손님이 요구가를 부르지 않는다 — 시세 상단까지 자유롭게 부른다
  const sliderMax = c.rival
    ? Math.max(sliderMin, Math.min(Math.floor(S.gold / 100) * 100, Math.round(c.item.hi * 1.1 / 100) * 100))
    : c.asking;
  // 시작 제시가: 요구가(또는 시세 중앙)의 55% 부근, 보유 골드로 클램프
  const anchor = c.rival ? (c.item.lo + c.item.hi) / 2 : c.asking;
  const start = clamp(Math.round(anchor * 0.55 / 100) * 100, sliderMin, Math.max(sliderMin, Math.min(sliderMax, Math.floor(S.gold / 100) * 100)));
  $('screen').innerHTML = `
    <div class="scene scene-day">
      <div class="shop-shelf sh1">🏺&nbsp;📚&nbsp;🕰️&nbsp;🎻&nbsp;📻&nbsp;⚱️&nbsp;🖼️&nbsp;📚&nbsp;🏺</div>
      <div class="shop-shelf sh2">🖼️&nbsp;⚔️&nbsp;🎵&nbsp;💎&nbsp;📷&nbsp;🕯️&nbsp;🥃&nbsp;⌚&nbsp;✒️</div>
      <div class="shop-counter"></div>
      <div class="day-grid">
        <div class="panel walk-in">
          <div class="center"><span class="pframe" id="cust-frame">${
            customerArtHTML(c, `<span class="face">${c.look.face}</span>`)
          }<span class="mood-badge" id="cust-mood">😐</span></span><span class="carry">${c.item.emoji}</span></div>
          <h3 class="center" style="margin-top:6px">${c.ctype.type}</h3>
          ${c.look.desc ? `<p class="center look-desc">${c.look.desc}</p>` : ''}
          ${c.rival ? '<p class="center rival-badge">⚔️ 황금손과 경합 중 — 밀봉 입찰</p>' : ''}
          ${c.regular ? '<p class="center accent" style="font-size:13px">⭐ 단골 — 값을 잘 쳐주는 가게라 소문났다</p>' : ''}
          <p class="center dim" style="font-size:13px">${c.name} · 손님 ${S.custIdx + 1}/${S.customers.length}</p>
          <div class="bubble">"${c.line}"
            <div class="trust ${c.ctype.swindler ? 'low' : 'mid'}">(구두 정보 신뢰도: ${c.ctype.swindler ? '매우 낮음' : '보통'})</div>
          </div>
          <p class="dim" style="font-size:13px; margin-top:8px">👀 ${c.desperation < 0.65 ? '한눈에도 급해 보인다. 값을 좀 후려쳐도 받아들일지 모른다.'
            : c.desperation < 0.75 ? '적당히 아쉬운 눈치다. 너무 헐값만 아니면 될 것 같다.'
            : '만만치 않은 상대다. 헐값엔 절대 안 넘길 기세다.'}</p>
        </div>
        <div class="panel">
          <h2 class="center" style="font-size:19px">${c.item.emoji} ${c.item.name}</h2>
          <p class="dim center" style="font-size:12px">시세 ${fmt(c.item.lo)} ~ ${fmt(c.item.hi)} G</p>
          <div class="drop-in" style="width:150px; margin:8px auto 6px">
            ${stageHTML(c)}
          </div>
          <p class="loupe-hint center" id="loupe-hint">🔍 물건 위를 훑어 살펴본다</p>
          <div class="inspect">
            <div id="inspect-rows"></div>
            <button class="btn-ghost" id="btn-scan" style="width:100%; font-size:12px; padding:5px; margin:6px 0 0"
              onclick="scanAll()">대충 훑어본다 (전체 확인)</button>
          </div>
          ${c.hints.map(h => `<div class="hint">👁️ ${h.text}</div>`).join('')}
          ${(S.upgrades.lens || c.mastery.valueHint) ? `<div class="hint" style="border-left-color:#7dff7d">🔎 ${c.mastery.valueHint && !S.upgrades.lens ? `${catInfo(c.cat).emoji} 감정안` : '감정 렌즈'}: 가치가 시세 <b>${c.t < 0.33 ? '하단' : c.t < 0.66 ? '중단' : '상단'}권</b></div>` : ''}
          ${(S.upgrades.journal || c.mastery.trapSense) ? (c.hasTrap
            ? '<div class="hint" style="border-left-color:#ff6b6b">📖 함정 감지: 정보 중 <b>하나가 수상하다!</b></div>'
            : '<div class="hint" style="border-left-color:#7dff7d">📖 함정 감지: 특이사항 없음</div>') : ''}
          ${c.mastery.lvl > 0 ? `<p class="mastery-badge">${catInfo(c.cat).emoji} ${catInfo(c.cat).name} 감정 <b>Lv${c.mastery.lvl}</b></p>` : ''}
        </div>
        ${c.rival ? `
        <div class="panel panel-rival">
          <h3 class="accent">🏪 밀봉 입찰</h3>
          <div class="bubble" style="font-size:13px">${c.rivalLine}</div>
          <p class="rival-warn">⚔️ <b>${RIVAL.name}</b>도 이 물건을 노린다.<br>
            <b>단 한 번</b>만 부를 수 있다 — 높은 쪽이 가져간다.</p>
          ${c.rivalTell
            ? `<div class="hint rival-tell">🕵️ ${c.rivalTell.text}</div>`
            : '<div class="hint" style="opacity:0.6">🕵️ 나사장의 낌새를 읽을 단서가 없다 — 감으로 불러야 한다.</div>'}
          <p style="font-size:13px; margin-top:10px">내 입찰가</p>
          <input type="range" id="offer-slider" min="${sliderMin}" max="${sliderMax}" step="100" value="${start}">
          <div class="row" style="align-items:center; margin-top:4px">
            <input type="number" id="bid-input" min="${sliderMin}" max="${sliderMax}" step="100" value="${start}" style="width:110px">
            <span>G</span>
          </div>
          <p class="bad" id="gold-warn" style="display:none; font-size:13px">⚠️ 보유 골드를 넘는 금액이다!</p>
          <button class="btn-big" id="btn-offer" style="width:100%; margin:10px 0 4px" onclick="submitBid()">이 값으로 입찰한다</button>
          <button class="btn-ghost" style="width:100%; margin:0" onclick="passCustomer()">입찰 포기</button>
          <p class="dim" style="font-size:11px; margin-top:6px">낮게 부르면 뺏기고, 높게 부르면 낙찰돼도 손해다. 나사장의 성향을 읽어라.</p>
        </div>` : `
        <div class="panel">
          <h3 class="accent">💰 밀당 흥정</h3>
          <p style="font-size:13px; margin-top:2px">손님의 요구가</p>
          <p class="big" style="margin:0"><b id="hg-demand" class="accent">${fmt(c.asking)} G</b></p>
          <p id="hg-mood" style="font-size:13px; margin-top:4px">기분 ${MOOD_FACES[Math.min(c.patience + 2, 5)]} · 인내심 ${'❤️'.repeat(c.patience)}</p>
          <div class="bubble" id="hg-say" style="font-size:13px">${pick(HAGGLE_LINES.open).replaceAll('{D}', fmt(c.asking) + ' G')}</div>
          <p style="font-size:13px; margin-top:10px">내 제시가</p>
          <input type="range" id="offer-slider" min="${sliderMin}" max="${sliderMax}" step="100" value="${start}">
          <div class="row" style="align-items:center; margin-top:4px">
            <input type="number" id="offer-input" min="${sliderMin}" max="${sliderMax}" step="100" value="${start}" style="width:110px">
            <span>G</span>
          </div>
          <p class="bad" id="gold-warn" style="display:none; font-size:13px">⚠️ 보유 골드를 넘는 금액이다!</p>
          <button class="btn-big" id="btn-offer" style="width:100%; margin:10px 0 4px" onclick="makeOffer()">이 가격을 제시한다</button>
          <button class="btn-ghost" id="btn-take" style="width:100%; margin:0 0 4px" onclick="acceptDemand()" ${c.asking > S.gold ? 'disabled' : ''}>요구가에 산다 (${fmt(c.asking)} G)</button>
          <button class="btn-ghost" style="width:100%; margin:0" onclick="passCustomer()">거절하고 보낸다</button>
        </div>`}
      </div>
    </div>`;
  const slider = $('offer-slider'), input = $(c.rival ? 'bid-input' : 'offer-input');
  const sync = (v) => {
    v = clamp(Math.round(v / 100) * 100 || sliderMin, sliderMin, sliderMax);
    slider.value = v; input.value = v;
    const short = v > S.gold;
    $('gold-warn').style.display = short ? 'block' : 'none';
    $('btn-offer').disabled = short;
  };
  slider.addEventListener('input', () => sync(+slider.value));
  input.addEventListener('input', () => sync(+input.value));
  sync(start);
  renderInspectRows(); // 🔍 아직 못 찾은 상태로 시작 — 돋보기로 훑어야 드러난다
  updateDebug();
  // 1일차 첫 손님: 단계별 튜토리얼이 화면 요소를 짚어 준다.
  // 라이벌 입찰 손님은 흥정 UI가 없어 튜토리얼 앵커가 안 맞으므로 제외(2막부터라 1일차엔 안 걸린다).
  if (!c.rival) maybeTutorial('day', TUT_DAY);
  // [Phase2] 말풍선 팁 — 튜토리얼이 끝난 뒤의 가벼운 보조
  maybeTip('debt');
}

/* ── 밀당 흥정 엔진 ──
   손님의 현재 요구가 D와 숨은 최저 수락가 M 사이에서 라운드를 주고받는다.
   낮게 부를수록 D가 내려오지만 인내심이 깎이고, 모욕 수준이면 박차고 나간다. */

Object.assign(globalThis, { renderCustomer });
export { renderCustomer };

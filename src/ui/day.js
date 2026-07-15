// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function renderCustomer() {
  S.timeLabel = CONFIG.DAY_TIMES[Math.min(S.custIdx, CONFIG.DAY_TIMES.length - 1)];
  updateHUD();
  const c = S.customers[S.custIdx];
  // 밀당 흥정 상태 초기화: D = 손님의 현재 요구가, P = 남은 인내심
  S.haggle = { D: c.asking, P: c.patience, maxP: c.patience };
  const sliderMin = Math.max(100, Math.round(c.item.lo * 0.3 / 100) * 100);
  const sliderMax = c.asking;
  // 시작 제시가: 요구가의 55% 부근 (흥정을 유도), 보유 골드로 클램프
  const start = clamp(Math.round(c.asking * 0.55 / 100) * 100, sliderMin, Math.max(sliderMin, Math.min(sliderMax, Math.floor(S.gold / 100) * 100)));
  $('screen').innerHTML = `
    <div class="scene scene-day">
      <div class="shop-shelf sh1">🏺&nbsp;📚&nbsp;🕰️&nbsp;🎻&nbsp;📻&nbsp;⚱️&nbsp;🖼️&nbsp;📚&nbsp;🏺</div>
      <div class="shop-shelf sh2">🖼️&nbsp;⚔️&nbsp;🎵&nbsp;💎&nbsp;📷&nbsp;🕯️&nbsp;🥃&nbsp;⌚&nbsp;✒️</div>
      <div class="shop-counter"></div>
      <div class="day-grid">
        <div class="panel walk-in">
          <div class="center"><span class="pframe"><span class="face">${c.ctype.emoji}</span></span><span class="carry">${c.item.emoji}</span></div>
          <h3 class="center" style="margin-top:6px">${c.ctype.type}</h3>
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
          <p class="dim center" style="font-size:12px; margin-top:2px">${c.item.lore || ''}</p>
          <p class="dim center">시장 시세: ${fmt(c.item.lo)} ~ ${fmt(c.item.hi)} G</p>
          <div class="drop-in" style="width:150px; margin:8px auto 10px">
            <div class="item-stage">
              <div class="shelf"></div>
              ${pixelArtHTML(c.item)}
              <span class="loupe">🔍</span>
              ${c.marks.map(mk => `<span class="mark${mk.spark ? ' sparkle' : ''}" style="left:${mk.x}%;top:${mk.y}%">${mk.e}</span>`).join('')}
            </div>
            <p class="dim center" style="font-size:12px; margin-top:4px">실물 상태</p>
          </div>
          <div class="inspect">
            <p style="font-size:12px; margin-bottom:3px">🔍 실물 검수 ${S.upgrades.scale
              ? '<span class="good">(⚖️ 정밀 저울 — 오차 없음)</span>'
              : '<span class="dim">(눈대중 — 부위별 오차 있음)</span>'}</p>
            ${c.partsView.map(p => `<div class="inspect-row">
              <span class="inspect-name">${p.name}</span>
              <span class="inspect-desc">${p.desc}</span>
              <span class="inspect-dots">${'●'.repeat(p.score)}${'○'.repeat(5 - p.score)}</span>
            </div>`).join('')}
          </div>
          ${c.hints.map(h => `<div class="hint">👁️ ${h.text}</div>`).join('')}
          ${S.upgrades.lens ? `<div class="hint" style="border-left-color:#7dff7d">🔎 감정 렌즈 소견: 가치가 시세 <b>${c.t < 0.33 ? '하단' : c.t < 0.66 ? '중단' : '상단'}권</b>으로 보인다</div>` : ''}
          ${S.upgrades.journal ? (c.hasTrap
            ? '<div class="hint" style="border-left-color:#ff6b6b">📖 학회지 대조: 이 손님의 정보 중 <b>하나가 수상하다!</b></div>'
            : '<div class="hint" style="border-left-color:#7dff7d">📖 학회지 대조: 정보에 특이사항 없음</div>') : ''}
          <p class="dim" style="font-size:12px; margin-top:6px">🔍 검수 점수가 높을수록 진품·상급일 확률이 높다. 구두 힌트(👁️)와 교차 검증하라.</p>
        </div>
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
          <p class="dim" style="font-size:11px; margin-top:6px">깎을수록 남는다 — 하지만 너무 후려치면 화내며 떠난다. 진짜 가치는 저녁 정산에서 판명된다.</p>
        </div>
      </div>
    </div>`;
  const slider = $('offer-slider'), input = $('offer-input');
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
  updateDebug();
  // [Phase2] 1일차 온보딩 팁
  maybeTip('haggle'); maybeTip('inspect'); maybeTip('debt');
}

/* ── 밀당 흥정 엔진 ──
   손님의 현재 요구가 D와 숨은 최저 수락가 M 사이에서 라운드를 주고받는다.
   낮게 부를수록 D가 내려오지만 인내심이 깎이고, 모욕 수준이면 박차고 나간다. */

Object.assign(globalThis, { renderCustomer });
export { renderCustomer };

// [신규] 🔍 돋보기 검수 — 정보를 '한꺼번에 읽기'에서 '찾아내기'로 바꾼다.
// 왜: 물건 패널에 검수 3부위·힌트·시세·설명이 전부 펼쳐져 있어 읽을 게 너무 많았다.
//     같은 정보를 숨겨 두고 돋보기로 찾게 하면 화면은 깔끔해지고 행위는 능동적이 된다.
// ⚠️ 감정 정보구조(점수·오차·함정·잭팟)는 그대로다 — 표현 방식만 바뀐다.
//     끝까지 안 찾아도 '대충 훑어본다'로 한 번에 다 볼 수 있다(강제 노동 금지).

const LOUPE_RADIUS = 17; // 발견 판정 반경 (진열대 크기 대비 %) — 넉넉하게 잡아 답답하지 않게

// 진열대 위에서 돋보기를 움직인다 → 가까운 미발견 지점이 드러난다
function loupeMove(e) {
  const stage = $('item-stage');
  const c = S.customers[S.custIdx];
  if (!stage || !c) return;
  const r = stage.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * 100;
  const py = ((e.clientY - r.top) / r.height) * 100;
  const lens = $('loupe-lens');
  if (lens) { lens.style.left = px + '%'; lens.style.top = py + '%'; lens.classList.add('active'); }
  c.partsView.forEach((p, i) => {
    if (p.found) return;
    if (Math.hypot(px - p.x, py - p.y) <= LOUPE_RADIUS) revealSpot(i);
  });
}

function loupeLeave() {
  const lens = $('loupe-lens');
  if (lens) lens.classList.remove('active');
}

function revealSpot(i) {
  const c = S.customers[S.custIdx];
  const p = c && c.partsView[i];
  if (!p || p.found) return;
  p.found = true;
  sndCoin();
  const dot = $('spot-' + i);
  if (dot) { dot.classList.add('found'); dot.textContent = p.score >= 4 ? '✨' : p.score <= 2 ? '💥' : '🔎'; }
  renderInspectRows();
  // 전부 찾으면 안내 문구를 정리한다
  if (c.partsView.every(x => x.found)) {
    const hint = $('loupe-hint');
    if (hint) hint.innerHTML = '<span class="good">✔ 검수 완료 — 이제 값을 부르자.</span>';
    const btn = $('btn-scan');
    if (btn) btn.remove();
  }
}

// 전부 한 번에 (돋보기 놀이를 원치 않는 플레이어용 — 정보량은 동일하다)
function scanAll() {
  const c = S.customers[S.custIdx];
  if (!c) return;
  sndClick();
  c.partsView.forEach((_, i) => revealSpot(i));
}

function renderInspectRows() {
  const c = S.customers[S.custIdx];
  const box = $('inspect-rows');
  if (!c || !box) return;
  const found = c.partsView.filter(p => p.found);
  box.innerHTML = found.length
    ? found.map(p => `<div class="inspect-row">
        <span class="inspect-name">${p.name}</span>
        <span class="inspect-desc">${p.desc}</span>
        <span class="inspect-dots">${'●'.repeat(p.score)}${'○'.repeat(5 - p.score)}</span>
      </div>`).join('')
    : '<div class="inspect-row dim">아직 아무것도 못 봤다.</div>';
}

// 진열대 HTML — 숨은 검수 지점 + 돋보기 렌즈
function stageHTML(c) {
  return `
    <div class="item-stage" id="item-stage" onmousemove="loupeMove(event)" onmouseleave="loupeLeave()">
      <div class="shelf"></div>
      ${pixelArtHTML(c.item)}
      ${c.marks.map(mk => `<span class="mark${mk.spark ? ' sparkle' : ''}" style="left:${mk.x}%;top:${mk.y}%">${mk.e}</span>`).join('')}
      ${c.partsView.map((p, i) => `<span class="spot${p.found ? ' found' : ''}" id="spot-${i}"
        style="left:${p.x}%;top:${p.y}%" title="${p.name}">${p.found ? (p.score >= 4 ? '✨' : p.score <= 2 ? '💥' : '🔎') : ''}</span>`).join('')}
      <span class="loupe-lens" id="loupe-lens"></span>
    </div>`;
}

Object.assign(globalThis, { loupeMove, loupeLeave, revealSpot, scanAll, renderInspectRows, stageHTML, LOUPE_RADIUS });
export { loupeMove, loupeLeave, revealSpot, scanAll, renderInspectRows, stageHTML };

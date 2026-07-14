// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function rigHTML(side, color, extra) {
  return `
    <div class="sprite-pos${extra ? ' ' + extra : ''}" id="sprite-${side}">
      <div class="flip"><div class="rig" style="--c:${color}">
        <div class="f-head"></div>
        <div class="f-arm back"></div>
        <div class="f-body"></div>
        <div class="f-leg back"></div>
        <div class="f-leg front"></div>
        <div class="f-arm front"></div>
      </div></div>
    </div>`;
}

function rigOf(side) { const p = $('sprite-' + side); return p ? p.querySelector('.rig') : null; }

// 새벽 암시장 상품 (1회 구매, 영구 효과). 가격은 CONFIG.UPGRADE_COSTS에서 튜닝.

Object.assign(globalThis, { rigHTML, rigOf });
export { rigHTML, rigOf };

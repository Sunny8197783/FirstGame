// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
// [아트] slug가 있고 public/art/sprites/<slug>.png가 있으면 관절 리그 대신 PixelLab 스프라이트시트를 그린다.
// 모션 클래스(act-*/rx-*/go/ko…)는 그대로 — CSS가 시트 프레임만 바꾼다. 그림이 없으면 onerror로 기존 리그 복귀.
function rigHTML(side, color, extra, slug) {
  const url = slug ? artUrlFor('sprites', slug) : null;
  const spr = url && !artMissing.has(url)
    ? `<span class="spr"><img class="spr-sheet" src="${url}" alt="" onerror="this.closest('.rig').classList.remove('has-spr'); artNext(this)"></span>`
    : '';
  return `
    <div class="sprite-pos${extra ? ' ' + extra : ''}" id="sprite-${side}">
      <div class="flip"><div class="rig${spr ? ' has-spr' : ''}" style="--c:${color}">${spr}
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

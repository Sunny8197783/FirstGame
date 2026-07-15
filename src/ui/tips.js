// [Phase 2 신규] 온보딩 컨텍스트 팁 — 1일차에 해당 UI 옆 말풍선으로 한 번씩만 (벽텍스트 금지: 팁당 2문장 이내)
const TIPS_KEY = 'pawnshop_tips_seen_v1';

const TIPS = {
  haggle: { anchor: '#hg-demand', text: '요구가보다 <b>낮게 불러</b> 보라. 너무 후려치면 ❤️가 깎이고 떠난다.' },
  inspect: { anchor: '.inspect', text: '●가 많을수록 상급. 시세 범위 안에서 <b>진짜 가치</b>를 가늠하라.' },
  rumor: { anchor: '#fcard-A', text: '같은 아이콘 소문이 겹치면 <b>사실</b>! 배당에 반영 안 된 당신만의 정보다.' },
  dawn: { anchor: '#night-console, .scene-night h2', text: '밤 수익으로 <b>빚을 갚거나 도구에 투자</b>하라. 💾 저장도 여기서.' },
  debt: { anchor: '#hud-debt', text: '매일 아침 <b>이자 5%</b>가 붙는다. 7일차까지 못 갚으면...' },
};

let seen = {};
try { seen = JSON.parse(localStorage.getItem(TIPS_KEY) || '{}') || {}; } catch (e) { seen = {}; }

function persistTips() {
  try { localStorage.setItem(TIPS_KEY, JSON.stringify(seen)); } catch (e) { /* 무시 */ }
}

function resetTips() { seen = {}; persistTips(); }

// 렌더 직후 호출: 1일차 + 미표시 팁만, 앵커 요소 옆에 말풍선
function maybeTip(id) {
  const tip = TIPS[id];
  if (!tip || seen[id]) return;
  if (S.day > 1) return; // 온보딩은 1일차 한정
  setTimeout(() => {
    const anchor = document.querySelector(tip.anchor);
    if (!anchor || seen[id]) return;
    seen[id] = true; persistTips();
    const el = document.createElement('div');
    el.className = 'ctx-tip';
    el.innerHTML = `💡 ${tip.text} <button class="ctx-tip-x" onclick="this.parentElement.remove()">✕</button>`;
    const r = anchor.getBoundingClientRect();
    el.style.left = Math.max(8, Math.min(window.innerWidth - 280, r.left)) + 'px';
    el.style.top = (r.bottom + window.scrollY + 8) + 'px';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentElement) el.classList.add('out'); }, 7000);
    setTimeout(() => el.remove(), 7600);
  }, 350); // 씬 등장 애니메이션 후 위치 계산
}

Object.assign(globalThis, { maybeTip, resetTips });
export { maybeTip, resetTips };

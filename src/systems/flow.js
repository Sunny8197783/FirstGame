// [Phase 2 신규] 전역 스킵/배속 컨트롤러 — 스페이스 한 키로 모든 연출을 넘긴다
// 대상: ① 전환 오버레이(아침/저녁/밤/결산) ② 경기 중계 ③ 인트로/인터루드 진행
// 모달의 확정 버튼(수락/베팅 등)은 오클릭 방지를 위해 스페이스 대상에서 제외한다.

// ── 전환 오버레이 스킵 상태 (ui/hud.js showTransition이 등록) ──
let pendingTransition = null; // { timer, cb }

function registerTransition(timer, cb) {
  pendingTransition = { timer, cb };
}
function clearTransition() { pendingTransition = null; }

function skipTransition() {
  if (!pendingTransition) return false;
  const { timer, cb } = pendingTransition;
  pendingTransition = null;
  clearTimeout(timer);
  const ov = document.getElementById('overlay');
  if (ov) ov.classList.remove('show');
  if (cb) cb();
  return true;
}

// ── 경기 중계 스킵 상태 (ui/fight.js runFight가 소비) ──
let fightSkipFlag = false;
function requestFightSkip() { fightSkipFlag = true; }
function consumeFightSkip() { const v = fightSkipFlag; return v; }
function resetFightSkip() { fightSkipFlag = false; }
function fightRunning() {
  // 경기 진행 중 판정: 중계 로그가 있고 아직 정산 버튼이 안 떴다
  const log = document.getElementById('fightlog');
  const after = document.getElementById('fight-after');
  return !!log && !!after && after.textContent.trim() === '';
}

// ── 스페이스 키 라우팅 ──
function onSpaceSkip(e) {
  if (e.code !== 'Space' && e.key !== ' ') return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON')) return; // 입력 중엔 무시
  // ① 전환 오버레이
  if (skipTransition()) { e.preventDefault(); return; }
  // ② 경기 중계
  if (fightRunning()) { requestFightSkip(); e.preventDefault(); return; }
  // ③ 인트로 / 인터루드
  if (document.querySelector('.intro-scene')) { e.preventDefault(); nextIntroBeat(); return; }
  if (typeof S !== 'undefined' && S._afterInterlude) { e.preventDefault(); afterInterlude(); return; }
}

function initFlow() {
  document.addEventListener('keydown', onSpaceSkip);
}

Object.assign(globalThis, {
  registerTransition, clearTransition, skipTransition,
  requestFightSkip, consumeFightSkip, resetFightSkip, fightRunning, initFlow,
});
export { registerTransition, clearTransition, skipTransition, requestFightSkip, consumeFightSkip, resetFightSkip, initFlow };

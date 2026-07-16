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

// [Phase4] 접근성 키보드 단축키 — Enter=주요 행동, Esc=모달 닫기
// (SPACE 스킵과 별개. 버튼 포커스·전환 오버레이 중에는 기본 동작을 방해하지 않는다.)
function onKeyShortcut(e) {
  const t = e.target;
  const modal = document.getElementById('modal');
  const modalOpen = modal && modal.classList.contains('show');
  const overlay = document.getElementById('overlay');
  const overlayOpen = overlay && overlay.classList.contains('show');

  if (e.key === 'Escape') {
    // 진행 게이팅 모달(다음 →/확정)은 보존하고, '닫기/취소' 버튼이 있는 정보성 모달만 닫는다
    if (modalOpen) {
      const closeBtn = [...modal.querySelectorAll('button')]
        .find(b => /hideModal|renderSettings/.test(b.getAttribute('onclick') || ''));
      if (closeBtn) { e.preventDefault(); closeBtn.click(); }
    }
    return;
  }
  if (e.key === 'Enter') {
    if (overlayOpen) return;                         // 전환 중엔 SPACE 스킵에 맡긴다
    if (t && t.tagName === 'BUTTON') return;         // 버튼 포커스 시 브라우저 기본 클릭
    // 모달이 열려 있으면 모달의 주요 버튼, 아니면 화면의 주요 버튼(.btn-big)
    const scope = modalOpen ? modal : document.getElementById('screen');
    if (!scope) return;
    const btn = [...scope.querySelectorAll('button.btn-big:not(:disabled)')]
      .find(b => b.offsetParent !== null);
    if (btn) { e.preventDefault(); btn.click(); }    // 예) 흥정 화면에서 금액 입력 후 Enter=제시
  }
}

function initFlow() {
  document.addEventListener('keydown', onSpaceSkip);
  document.addEventListener('keydown', onKeyShortcut); // [Phase4] Enter/Esc 단축키
}

Object.assign(globalThis, {
  registerTransition, clearTransition, skipTransition,
  requestFightSkip, consumeFightSkip, resetFightSkip, fightRunning, initFlow,
});
export { registerTransition, clearTransition, skipTransition, requestFightSkip, consumeFightSkip, resetFightSkip, initFlow };

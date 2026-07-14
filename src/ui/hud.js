// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function setTheme(t) { document.body.className = 'theme-' + t; }

function updateHUD() {
  const playing = !(S.phase === 'title' || S.phase === 'result');
  $('hud').style.display = playing ? 'flex' : 'none';
  $('hud-day').textContent = `📅 ${S.day}일차/${CONFIG.DAYS} · ${actOf()}막`;
  $('hud-gold').textContent = `💰 ${fmt(S.gold)} G`;
  $('hud-time').textContent = S.timeLabel || '';
  $('hud-debt').textContent = S.debt > 0 ? `💸 빚 ${fmt(S.debt)} G` : '✔ 빚 청산';
  $('hud-parts').textContent = S.stats.drops ? `✦ ${S.stats.drops} 전설 부품` : '';
  const labels = { day: '☀️ 낮 — 전당포', evening: '🌆 저녁 — 정산', night: '🌙 밤 — 지하 격투장', dawn: '🌌 새벽 — 암시장' };
  $('hud-phase').textContent = labels[S.phase] || '';
  const eb = $('event-banner');
  if (playing && S.event && S.event.id !== 'normal') {
    eb.style.display = 'block';
    eb.textContent = `${S.event.name} — ${S.event.desc}`;
  } else eb.style.display = 'none';
}
// 데모 조기 종료(결과 화면 보기) — 오클릭 방지 2단계 확인

let endArm = false;

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'btn-endnow') {
    if (!endArm) {
      endArm = true; e.target.textContent = '정말 종료할까? (다시 클릭)';
      setTimeout(() => { endArm = false; const b = $('btn-endnow'); if (b) b.textContent = '결과 화면 보기'; }, 2500);
    } else { endArm = false; renderResult(); }
  }
});

function showTransition(html, cb, ms) {
  const ov = $('overlay');
  ov.innerHTML = html; ov.classList.add('show');
  setTimeout(() => { ov.classList.remove('show'); if (cb) cb(); }, ms || 1200);
}

function showModal(html) { $('modal-body').innerHTML = html; $('modal').classList.add('show'); }

function hideModal() { $('modal').classList.remove('show'); }

/* ═══════════════════════════════════════════════════════════════
   타이틀 화면
   ═══════════════════════════════════════════════════════════════ */

// [Phase 1 신규] 토스트 알림 — 저장/가져오기 등 가벼운 피드백용
function toast(msg, ms) {
  const wrap = $('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.classList.add('out'), (ms || 2200) - 350);
  setTimeout(() => t.remove(), ms || 2200);
}

Object.assign(globalThis, { setTheme, updateHUD, showTransition, showModal, hideModal, toast });
export { setTheme, updateHUD, showTransition, showModal, hideModal, toast };

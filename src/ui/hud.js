// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function setTheme(t) { document.body.className = 'theme-' + t; }

// [Phase4] 골드 카운트업 — 값 변화 시 이전값→새값으로 부드럽게 굴러간다.
let _hudGoldShown = null; // 마지막으로 화면에 표시된 골드
let _goldRAF = 0;
function countUpGold(el, from, to) {
  // 헤드리스 시뮬(브라우저 API 없음)·최초 표시·감속 모션 끔·미세 변화는 즉시 반영
  if (!el || typeof requestAnimationFrame !== 'function' || from == null
      || document.body.classList.contains('no-shake') || Math.abs(to - from) < 50) {
    if (el) el.textContent = `💰 ${fmt(to)} G`;
    return;
  }
  if (_goldRAF) cancelAnimationFrame(_goldRAF);
  el.classList.remove('gold-up', 'gold-down');
  void el.offsetWidth;                         // 리플로우로 애니메이션 재시작
  el.classList.add(to >= from ? 'gold-up' : 'gold-down');
  const dur = 550 / (gameSpeed() || 1);
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - t, 3);          // easeOutCubic
    el.textContent = `💰 ${fmt(Math.round(from + (to - from) * e))} G`;
    if (t < 1) _goldRAF = requestAnimationFrame(step);
    else { el.textContent = `💰 ${fmt(to)} G`; _goldRAF = 0; }
  };
  _goldRAF = requestAnimationFrame(step);
}

function updateHUD() {
  const playing = !(S.phase === 'title' || S.phase === 'result');
  $('hud').style.display = playing ? 'flex' : 'none';
  $('hud-day').textContent = S.season > 0
    ? `🌆 시즌${S.season} · D${seasonDayOf()}/${CONFIG.SEASON_LEN}` // [Phase3]
    : `📅 ${S.day}일차/${CONFIG.DAYS} · ${actOf()}막`;
  countUpGold($('hud-gold'), playing ? _hudGoldShown : null, S.gold); // [Phase4] 카운트업
  _hudGoldShown = playing ? S.gold : null; // 화면 밖(타이틀/결과)에선 추적 초기화
  $('hud-time').textContent = S.timeLabel || '';
  $('hud-debt').textContent = S.debt > 0 ? `💸 빚 ${fmt(S.debt)} G` : '✔ 빚 청산';
  $('hud-parts').textContent = (S.stats.drops ? `✦ ${S.stats.drops} 전설 부품` : '')
    + (S.prestige ? ` 🏚️×${S.prestige}` : ''); // [Phase3]
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
  // [Phase2] 배속 적용 + 스페이스 스킵 등록 + 스킵 힌트
  ov.innerHTML = html + '<div class="skip-hint">SPACE ▸ 스킵</div>';
  ov.classList.add('show');
  const timer = setTimeout(() => { clearTransition(); ov.classList.remove('show'); if (cb) cb(); }, (ms || 1200) / gameSpeed());
  registerTransition(timer, cb);
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

// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
// [Phase 1 개편] 타이틀 = 메뉴 화면 (새 게임 / 이어하기 미리보기 / 백업 / 설정·확률·업적 자리)
function renderTitle() {
  S.phase = 'title'; setTheme('night'); updateHUD();
  setBgm('title'); // [Phase4] 타이틀 BGM
  const sav = loadSaveData();
  const act = sav ? (sav.day <= CONFIG.ACT1_END ? 1 : sav.day <= CONFIG.ACT2_END ? 2 : 3) : 0;
  const preview = sav
    ? `${sav.season > 0 ? `시즌${sav.season}` : `${sav.day}일차 · ${act}막`} · 💰 ${fmt(sav.gold)} G · ${sav.point === 'dawn' ? '🌌 새벽' : '☀️ 아침'}부터`
    : '저장된 게임이 없다';
  $('screen').innerHTML = `
    <div class="scene scene-night center" style="min-height:540px; padding-top:48px">
      <div class="crowd"></div>
      <div class="neon neon-l"></div><div class="neon neon-r"></div>
      <div style="position:relative; z-index:2">
        <div class="logo-deco">🏪&nbsp;&nbsp;💰&nbsp;&nbsp;🥊</div>
        <div class="game-logo">
          <div class="logo-top">IDLE PAWN SHOP</div>
          <div class="logo-main">지하경제</div>
          <div class="logo-sub">— UNDERGROUND ECONOMY —</div>
        </div>
        <div class="title-menu">
          <button class="btn-big btn-start" onclick="newGameFromTitle()">▶ 새 게임</button>
          <button class="btn-big" onclick="continueFromTitle()" ${sav ? '' : 'disabled'}>⏸ 이어하기<span class="menu-sub">${preview}</span></button>
          <div class="menu-row">
            <button class="btn-ghost" onclick="exportSave()">📤 내보내기</button>
            <button class="btn-ghost" onclick="$('save-import').click()">📥 가져오기</button>
          </div>
          <div class="menu-row">
            <button class="btn-ghost" onclick="renderSettings()">⚙️ 설정</button>
            <button class="btn-ghost" onclick="renderOddsInfo()">📊 확률 정보</button>
            <button class="btn-ghost" onclick="renderAchievements()">🏆 업적</button>
          </div>
        </div>
        <input type="file" id="save-import" accept=".json,application/json" style="display:none"
          onchange="if(this.files[0]) importSaveFile(this.files[0]); this.value='';">
        <p class="dim" style="margin-top:22px; font-size:13px">3막 캠페인 · 게임 내 21일 · [D] 디버그 패널 · v0.2</p>
      </div>
    </div>`;
}

// 새 게임: 기존 세이브가 있으면 덮어쓰기 확인
function newGameFromTitle() {
  sndClick();
  if (!hasSave()) { startIntro(); return; }
  showModal(`
    <h2 class="accent">⚠️ 새 게임</h2>
    <p>저장된 게임이 있다. 새 게임을 시작하면 <b>다음 아침 자동 저장 때 덮어써진다.</b></p>
    <p class="dim" style="font-size:13px">지금 백업하려면 타이틀의 [📤 내보내기]를 먼저 사용하라.</p>
    <div class="center" style="margin-top:10px">
      <button class="btn-big" onclick="hideModal(); startIntro()">새로 시작한다</button>
      <button class="btn-ghost" onclick="hideModal()">취소</button>
    </div>`);
}

function continueFromTitle() {
  sndClick();
  if (!continueGame()) toast('저장된 게임이 없다 ⚠️');
}

/* ── 오프닝 인트로 ── */

let introIdx = 0;

function startIntro() {
  sndClick();
  introIdx = 0;
  renderIntroBeat();
}

function renderIntroBeat() {
  if (introIdx >= INTRO_BEATS.length) { startGame(); return; }
  const b = INTRO_BEATS[introIdx];
  setTheme(b.theme);
  $('hud').style.display = 'none'; $('event-banner').style.display = 'none';
  $('screen').innerHTML = `
    <div class="scene scene-${b.theme === 'day' ? 'day' : 'night'} intro-scene" onclick="nextIntroBeat()" style="cursor:pointer; min-height:420px">
      ${b.theme !== 'day' ? '<div class="crowd"></div><div class="neon neon-l"></div><div class="neon neon-r"></div>' : '<div class="shop-counter"></div>'}
      <div class="center" style="position:relative; z-index:2; padding:46px 20px">
        <div class="intro-art">${b.art}</div>
        <h2 class="accent" style="margin-top:14px; font-size:26px">${b.title}</h2>
        <p class="intro-text" style="margin-top:14px; font-size:17px; line-height:2">${b.text}</p>
        <p class="dim blink" style="margin-top:30px; font-size:13px">▼ 클릭해서 계속 (${introIdx + 1}/${INTRO_BEATS.length})</p>
        <button class="btn-ghost" style="font-size:13px" onclick="event.stopPropagation(); sndClick(); startGame()">스킵 ≫</button>
      </div>
    </div>`;
}

function nextIntroBeat() { sndClick(); introIdx++; renderIntroBeat(); }


function renderInterlude(key, val, next) {
  setTheme('night'); S.timeLabel = ''; updateHUD();
  const it = INTERLUDES[key](val);
  S._afterInterlude = next;
  $('screen').innerHTML = `
    <div class="scene scene-night" style="min-height:440px">
      <div class="crowd"></div>
      <div class="neon neon-l"></div><div class="neon neon-r"></div>
      <div class="center" style="position:relative; z-index:2; padding:30px 24px">
        <div class="intro-art">${it.art}</div>
        <h2 class="accent" style="margin:12px 0; font-size:24px">${it.title}</h2>
        <div style="text-align:left; max-width:560px; margin:0 auto">
          ${it.paras.map((p, i) => `<p class="intro-text" style="font-size:15px; line-height:1.9; margin-top:10px; animation-delay:${0.25 + i * 0.35}s">${p}</p>`).join('')}
        </div>
        <p class="neon-pink" style="margin-top:16px; font-size:13px">${it.note}</p>
        <button class="btn-big" style="margin-top:14px" onclick="afterInterlude()">계속 →</button>
      </div>
    </div>`;
}

function afterInterlude() {
  sndClick();
  const f = S._afterInterlude; S._afterInterlude = null;
  if (f) f();
}

Object.assign(globalThis, { renderTitle, newGameFromTitle, continueFromTitle, startIntro, renderIntroBeat, nextIntroBeat, renderInterlude, afterInterlude });
export { renderTitle, newGameFromTitle, continueFromTitle, startIntro, renderIntroBeat, nextIntroBeat, renderInterlude, afterInterlude };

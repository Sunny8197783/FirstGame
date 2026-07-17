// [신규] 🎬 시네마틱 연출 — 막 전환과 밤 이동에 '장면'을 넣는다.
// 왜: 막 전환은 정적 배경 + 텍스트뿐이었고, 밤은 1.4초 텍스트 오버레이로 순간이동했다.
//     이야기가 꺾이는 지점과 장소를 옮기는 지점에 실제로 움직이는 장면을 넣어 몰입을 만든다.
// 원칙: ① 언제든 스킵(버튼·SPACE·클릭) ② 배속 설정 존중 ③ 스킵해도 게임 상태는 동일
//       ④ 아트가 없어도 성립 — 전부 CSS 실루엣/그라디언트로 그린다

let cineTimer = null, cineNext = null, cineOn = false;

const CINE = {
  // 🌙 밤 이동: 전당포를 나와 골목을 걸어 지하 계단으로 내려간다
  night: { ms: 4200, sfx: 'walk', html: `
    <div class="cine-stage cw">
      <div class="cw-sky"></div>
      <div class="cw-far"></div>
      <div class="cw-near"></div>
      <div class="cw-signs">
        <span class="cw-sign s1">🍺</span><span class="cw-sign s2">💈</span>
        <span class="cw-sign s3">🏮</span><span class="cw-sign s4">🚬</span>
      </div>
      <div class="cw-ground"></div>
      <div class="cw-hero"><div class="cw-head"></div><div class="cw-coat"></div>
        <div class="cw-leg l"></div><div class="cw-leg r"></div></div>
      <div class="cw-door">🚪</div>
      <div class="cw-stairs"><div class="cw-hole"></div><div class="cw-neonsign">🥊 언더그라운드</div></div>
      <div class="cine-cap">
        <span class="c1">전당포 셔터를 내린다.</span>
        <span class="c2">골목엔 벌써 네온이 켜졌다.</span>
        <span class="c3">쇠 냄새와 함성이 계단 아래에서 올라온다...</span>
      </div>
    </div>` },

  // 🚬 1막 → 2막: 김사장의 부하들이 들이닥쳐 빚을 회수해 간다
  act2: { ms: 4600, sfx: 'raid', html: `
    <div class="cine-stage ca2">
      <div class="ca-room"></div>
      <div class="ca-doorframe"><div class="ca-light"></div></div>
      <div class="ca-thugs"><span class="th t1"></span><span class="th t2"></span><span class="th t3"></span></div>
      <div class="ca-coins"><span>🪙</span><span>🪙</span><span>🪙</span><span>🪙</span><span>🪙</span></div>
      <div class="ca-flash"></div>
      <div class="ca-smoke"></div>
      <div class="ca-cigar">🚬</div>
      <div class="cine-cap">
        <span class="c1">쾅— 아침부터 문이 부서질 듯 열렸다.</span>
        <span class="c2">"약속은 지켰군." 금고가 순식간에 비었다.</span>
        <span class="c3">그날 밤, 격투장 가장 깊은 방으로 불려갔다.</span>
      </div>
    </div>` },

  // 👑 2막 → 3막: 회장이 격투장 지분 문서를 밀어 준다
  act3: { ms: 4600, sfx: 'crown', html: `
    <div class="cine-stage ca3">
      <div class="ca-room"></div>
      <div class="ca-smoke"></div>
      <div class="ca3-table"></div>
      <div class="ca3-doc">📜</div>
      <div class="ca3-stamp">🔴</div>
      <div class="ca3-crown">👑</div>
      <div class="ca3-glow"></div>
      <div class="cine-cap">
        <span class="c1">회장이 처음으로 웃었다. "약속은 약속이지."</span>
        <span class="c2">지분 문서가 테이블 위로 미끄러져 온다.</span>
        <span class="c3">이제 당신은 이 바닥의 플레이어다.</span>
      </div>
    </div>` },
};

function cineSfx(kind) {
  if (kind === 'walk') {
    // 발소리 — 낮게 툭툭
    for (let i = 0; i < 6; i++) tone(90, 0.06, 'sine', { when: i * 0.42, vol: 0.7 });
    setTimeout(() => sndDrop(), 3400 / (gameSpeed() || 1));
  } else if (kind === 'raid') {
    noise(0.18, { cut: 400, vol: 1.3 });              // 문 쾅
    setTimeout(() => sndSeize(), 900 / (gameSpeed() || 1));
    setTimeout(() => sndCoin(), 1700 / (gameSpeed() || 1));
  } else if (kind === 'crown') {
    setTimeout(() => sndCoin(), 1200 / (gameSpeed() || 1));
    setTimeout(() => sndJackpot(), 2600 / (gameSpeed() || 1));
  }
}

// 장면을 재생하고 끝나면 next()를 부른다. 스킵해도 next()는 반드시 한 번 불린다.
function playCine(id, next) {
  const sc = CINE[id];
  if (!sc) { next(); return; }
  let el = $('cine');
  if (!el) { el = document.createElement('div'); el.id = 'cine'; document.body.appendChild(el); }
  cineNext = next; cineOn = true;
  const speed = gameSpeed() || 1;
  el.style.setProperty('--cine-ms', (sc.ms / speed) + 'ms');
  el.innerHTML = sc.html +
    '<button class="cine-skip" onclick="endCine()">건너뛰기 ▸ <span class="menu-sub">SPACE</span></button>';
  el.classList.add('show');
  try { cineSfx(sc.sfx); } catch (e) { /* 소리는 없어도 무방 */ }
  cineTimer = setTimeout(endCine, sc.ms / speed);
}

function endCine() {
  if (!cineOn) return;
  cineOn = false;
  if (cineTimer) { clearTimeout(cineTimer); cineTimer = null; }
  const el = $('cine');
  if (el) { el.classList.remove('show'); el.innerHTML = ''; }
  const f = cineNext; cineNext = null;
  if (f) f();
}

function cinePlaying() { return cineOn; }

Object.assign(globalThis, { CINE, playCine, endCine, cinePlaying });
export { CINE, playCine, endCine, cinePlaying };

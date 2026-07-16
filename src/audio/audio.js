// [Phase4] 사운드 시스템 — Web Audio 신스 SFX 12종+ & BGM 2트랙
// 원본(Phase1) beep/sndClick/sndGood/sndBad/sndDrop 이름·동작은 100% 보존(호환).
// 규칙: 첫 사용자 입력 후 시작 / 음소거(sfxVol·bgmVol=0)에서도 완전 동작 / 실패해도 게임 무방.

let audioCtx = null;
let masterSfx = null; // SFX 마스터 게인(즉시 음소거 대응)

// AudioContext 지연 생성 — 첫 소리 요청 또는 첫 입력 때 만들어진다.
function ac() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterSfx = audioCtx.createGain();
      masterSfx.gain.value = 1;
      masterSfx.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
  }
  return audioCtx;
}

// 저수준 톤: freq(Hz), dur(s), type, opts{ vol, when(상대초), attack, dest }
function tone(freq, dur, type, opts) {
  try {
    const o = opts || {};
    const v = 0.12 * (typeof sfxVol === 'function' ? sfxVol() : 0.5) * (o.vol != null ? o.vol : 1);
    if (v <= 0.001) return;              // 음소거 시 노드 생성도 생략
    const ctx = ac(); if (!ctx) return;
    const t0 = ctx.currentTime + (o.when || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    const atk = o.attack != null ? o.attack : 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.dest || masterSfx || ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  } catch (e) { /* 무방 */ }
}

// 노이즈 버스트(타격·압수 등) — 짧은 화이트노이즈 + 로우패스
function noise(dur, opts) {
  try {
    const o = opts || {};
    const v = 0.12 * (typeof sfxVol === 'function' ? sfxVol() : 0.5) * (o.vol != null ? o.vol : 1);
    if (v <= 0.001) return;
    const ctx = ac(); if (!ctx) return;
    const t0 = ctx.currentTime + (o.when || 0);
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = o.hp ? 'highpass' : 'lowpass';
    f.frequency.value = o.cut || 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(masterSfx || ctx.destination);
    src.start(t0); src.stop(t0 + dur);
  } catch (e) { /* 무방 */ }
}

// 원본 beep — 다른 모듈이 그대로 호출한다(시그니처 보존)
function beep(freq, dur, type) { tone(freq, dur, type || 'square', { attack: 0.001 }); }

/* ─── 기존 4종(호환) ─── */
const sndClick = () => tone(660, 0.07, 'square');
const sndGood  = () => { tone(523, 0.09, 'triangle'); tone(784, 0.12, 'triangle', { when: 0.09 }); };
const sndBad   = () => { tone(196, 0.18, 'sawtooth'); };
const sndDrop  = () => { tone(880, 0.08, 'square'); tone(1175, 0.1, 'square', { when: 0.08 }); tone(1568, 0.18, 'square', { when: 0.17 }); };

/* ─── [Phase4] 신규 SFX ─── */
// 흥정 성사 — 밝은 3음 상승
const sndHaggleOk   = () => { tone(523, 0.08, 'triangle'); tone(659, 0.08, 'triangle', { when: 0.08 }); tone(880, 0.16, 'triangle', { when: 0.16 }); };
// 흥정 결렬 — 문 쾅 + 하강
const sndHaggleFail = () => { noise(0.12, { cut: 500, vol: 1.1 }); tone(300, 0.16, 'sawtooth', { when: 0.02, slideTo: 120 }); };
// 모욕 — 불협 버즈
const sndInsult     = () => { tone(180, 0.14, 'sawtooth', { vol: 1.1 }); tone(190, 0.14, 'square', { vol: 0.7 }); };
// 잭팟(숨은 진품) — 반짝이는 아르페지오
const sndJackpot    = () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'triangle', { when: i * 0.07, vol: 1.1 })); tone(1568, 0.4, 'sine', { when: 0.4, vol: 0.9 }); };
// 장물 압수 — 경보 사이렌 2회
const sndSeize      = () => { for (let i = 0; i < 2; i++) { tone(740, 0.16, 'sawtooth', { when: i * 0.24, slideTo: 480, vol: 1.1 }); } noise(0.2, { cut: 800, when: 0.02, vol: 0.5 }); };
// 베팅 승리 — 코인 + 팡파레
const sndBetWin     = () => { sndCoin(); tone(659, 0.1, 'triangle', { when: 0.06 }); tone(880, 0.1, 'triangle', { when: 0.16 }); tone(1047, 0.24, 'triangle', { when: 0.26 }); };
// 베팅 패배 — 3음 하강
const sndBetLose    = () => { tone(392, 0.12, 'sawtooth'); tone(311, 0.12, 'sawtooth', { when: 0.12 }); tone(233, 0.24, 'sawtooth', { when: 0.24 }); };
// 각성 — 파워업 상승 스윕
const sndAwaken     = () => { tone(220, 0.5, 'sawtooth', { slideTo: 1320, vol: 1.2 }); tone(330, 0.5, 'square', { slideTo: 1760, vol: 0.5, when: 0.05 }); tone(1568, 0.3, 'triangle', { when: 0.5, vol: 0.9 }); };
// 타격 — 펀치 임팩트
const sndHit        = (heavy) => { noise(heavy ? 0.13 : 0.07, { cut: heavy ? 350 : 700, vol: heavy ? 1.3 : 0.9 }); tone(heavy ? 90 : 150, heavy ? 0.14 : 0.07, 'sine', { slideTo: heavy ? 50 : 90 }); };
// 레벨업 — 4음 상승
const sndLevelUp    = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, 'square', { when: i * 0.09 })); };
// 코인 — 짧은 딩
const sndCoin       = () => { tone(988, 0.06, 'square'); tone(1319, 0.1, 'square', { when: 0.05 }); };

/* ═══════════════════════════════════════════════════════════════
   BGM — Web Audio 신스 2트랙(낮 lo-fi / 밤 신스)
   룩어헤드 스케줄러. bgmVol=0이면 음 생성 생략(즉시 무음, 복귀 즉시 재개).
   ═══════════════════════════════════════════════════════════════ */
let bgmGain = null;
let bgmTimer = null;
let bgmName = null;      // 'day' | 'night' | 'title' | null
let pendingBgm = null;   // 첫 입력 전 예약된 트랙
let bgmStep = 0;
let nextStepTime = 0;
let audioUnlocked = false;

const N = { C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
            C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.0, Ab4: 415.30, A4: 440.0, Bb4: 466.16, B4: 493.88, C5: 523.25 };
const _ = null; // 쉼표

// 각 트랙: spb(스텝당 초), bass[], lead[], 파형/게인
const TRACKS = {
  // 낮: 따뜻한 lo-fi — 느린 triangle, C장조 계열
  day: {
    spb: 0.34,
    bass: [N.C3, _, N.G3, _, N.A3, _, N.F3, _, N.C3, _, N.G3, _, N.E3, _, N.F3, _],
    lead: [N.E4, _, _, N.G4, N.C5, _, N.A4, _, N.G4, _, N.E4, _, N.D4, _, _, _],
    bassType: 'triangle', leadType: 'sine', bassVol: 0.5, leadVol: 0.32,
  },
  // 밤: 어두운 신스 — 빠른 saw, A단조 계열
  night: {
    spb: 0.26,
    bass: [N.A3, N.A3, _, N.A3, N.F3, _, N.G3, _, N.A3, N.A3, _, N.C4, N.E4, _, N.D4, _],
    lead: [N.A4, _, N.C5, _, N.B4, _, N.A4, N.G4, N.A4, _, N.E4, _, N.F4, _, N.E4, _],
    bassType: 'sawtooth', leadType: 'square', bassVol: 0.42, leadVol: 0.26,
  },
  // 타이틀: 잔잔한 신스 아르페지오
  title: {
    spb: 0.4,
    bass: [N.A3, _, _, _, N.F3, _, _, _, N.C3, _, _, _, N.G3, _, _, _],
    lead: [N.E4, N.A4, N.C5, N.A4, N.F4, N.A4, N.C5, N.A4, N.C4, N.E4, N.G4, N.E4, N.D4, N.G4, N.B4, N.G4],
    bassType: 'triangle', leadType: 'triangle', bassVol: 0.38, leadVol: 0.22,
  },
};

function bgmVolNow() { return typeof bgmVol === 'function' ? bgmVol() : 0.5; }

function scheduleBgm() {
  const ctx = ac(); if (!ctx || !bgmName) return;
  const tr = TRACKS[bgmName]; if (!tr) return;
  const lookahead = 0.2; // 초
  while (nextStepTime < ctx.currentTime + lookahead) {
    const v = bgmVolNow();
    if (v > 0.001) {                    // 음소거면 음 생성 생략
      const i = bgmStep % tr.bass.length;
      const when = nextStepTime - ctx.currentTime;
      if (tr.bass[i]) tone(tr.bass[i], tr.spb * 1.7, tr.bassType, { when, vol: tr.bassVol * v * 1.6, attack: 0.02, dest: bgmGain });
      if (tr.lead[i]) tone(tr.lead[i], tr.spb * 1.4, tr.leadType, { when, vol: tr.leadVol * v * 1.6, attack: 0.02, dest: bgmGain });
    }
    nextStepTime += tr.spb;
    bgmStep++;
  }
}

// BGM 트랙 지정. 첫 입력 전이면 예약만 해두고, 잠금 해제 시 시작된다.
function setBgm(name) {
  if (!audioUnlocked) { pendingBgm = name; return; }
  if (name === bgmName) return;
  bgmName = name;
  bgmStep = 0;
  const ctx = ac();
  if (ctx) nextStepTime = ctx.currentTime + 0.05;
  if (name && !bgmTimer) bgmTimer = setInterval(scheduleBgm, 60);
  if (!name && bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
}

// 첫 사용자 제스처에 오디오 잠금 해제 + BGM 게인 준비 + 예약 트랙 시작
function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = ac(); if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!bgmGain) { bgmGain = ctx.createGain(); bgmGain.gain.value = 1; bgmGain.connect(ctx.destination); }
  audioUnlocked = true;
  if (pendingBgm !== null) { const p = pendingBgm; pendingBgm = null; setBgm(p); }
}

// 엔트리에서 1회 호출 — 첫 입력을 한 번만 잡는다
function initAudio() {
  const h = () => { unlockAudio(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, h, { once: true, passive: true }));
}

Object.assign(globalThis, {
  beep, sndClick, sndGood, sndBad, sndDrop,
  sndHaggleOk, sndHaggleFail, sndInsult, sndJackpot, sndSeize,
  sndBetWin, sndBetLose, sndAwaken, sndHit, sndLevelUp, sndCoin,
  setBgm, initAudio, unlockAudio,
});
export {
  beep, sndClick, sndGood, sndBad, sndDrop,
  sndHaggleOk, sndHaggleFail, sndInsult, sndJackpot, sndSeize,
  sndBetWin, sndBetLose, sndAwaken, sndHit, sndLevelUp, sndCoin,
  setBgm, initAudio, unlockAudio,
};

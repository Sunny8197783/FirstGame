// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
let audioCtx = null;

function beep(freq, dur, type) {
  try {
    // [Phase2] SFX 볼륨 설정 반영 (0이면 완전 무음 — 노드 생성도 생략)
    const vol = 0.12 * (typeof sfxVol === 'function' ? sfxVol() : 0.5);
    if (vol <= 0.001) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* 사운드 없어도 무방 */ }
}

const sndClick = () => beep(660, 0.07);

const sndGood  = () => { beep(523, 0.09); setTimeout(() => beep(784, 0.12), 90); };

const sndBad   = () => { beep(196, 0.18, 'sawtooth'); };

const sndDrop  = () => { beep(880, 0.08); setTimeout(() => beep(1175, 0.1), 80); setTimeout(() => beep(1568, 0.18), 170); };

/* ═══════════════════════════════════════════════════════════════
   게임 상태
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { beep, sndClick, sndGood, sndBad, sndDrop });
export { beep, sndClick, sndGood, sndBad, sndDrop };

// [Phase 2 신규] 설정 시스템 — localStorage 영구 저장 (세이브와 분리, 계정 단위)
const SETTINGS_KEY = 'pawnshop_settings_v1';

const DEFAULT_SETTINGS = {
  bgmVol: 0.5,    // BGM 볼륨 (BGM 트랙은 Phase 4에서 추가 — 값은 지금부터 보존)
  sfxVol: 0.5,    // 효과음 볼륨
  speed: 1,       // 연출 배속 1× / 2× / 3× (전환·경기 중계·타이머)
  textSpeed: 1,   // 중계 텍스트 표시 간격 배속 1× / 2× / 3×
  fontScale: 1,   // 폰트 크기 1 = 기본, 1.15 = 크게
  shake: true,    // 피격 화면 흔들림
};

let SETTINGS = { ...DEFAULT_SETTINGS };
try {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) SETTINGS = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
} catch (e) { /* 기본값 사용 */ }

function persistSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) { /* 무시 */ }
}

function setSetting(key, value) {
  SETTINGS[key] = value;
  persistSettings();
  applySettings();
}

// DOM에 반영이 필요한 설정 적용 (폰트 크기 / 흔들림)
function applySettings() {
  document.body.classList.toggle('font-lg', SETTINGS.fontScale > 1);
  document.body.classList.toggle('no-shake', !SETTINGS.shake);
}

// 연출 지연 계산 헬퍼 — 전환·경기 타이머가 이 값으로 나눈다
function gameSpeed() { return SETTINGS.speed || 1; }
function textSpeed() { return SETTINGS.textSpeed || 1; }
function sfxVol() { return SETTINGS.sfxVol; }
function bgmVol() { return SETTINGS.bgmVol; }

Object.assign(globalThis, { SETTINGS, setSetting, applySettings, gameSpeed, textSpeed, sfxVol, bgmVol });
export { SETTINGS, setSetting, applySettings, gameSpeed, textSpeed, sfxVol, bgmVol };

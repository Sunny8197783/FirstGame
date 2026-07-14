// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
const $ = (id) => document.getElementById(id);

const fmt = (n) => Math.round(n).toLocaleString('ko-KR');

const rand = (a, b) => a + Math.random() * (b - a);

const randInt = (a, b) => Math.floor(rand(a, b + 1));

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const pickWeighted = (arr) => { const tot = arr.reduce((s, e) => s + e.w, 0); let r = Math.random() * tot; for (const e of arr) { if ((r -= e.w) < 0) return e; } return arr[0]; };

// Web Audio 삑삑이 (선택사항 — 실패해도 무시)

Object.assign(globalThis, { $, fmt, rand, randInt, pick, clamp, shuffle, pickWeighted });
export { fmt, rand, randInt, pick, clamp, shuffle, pickWeighted };

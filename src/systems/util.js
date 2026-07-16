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

// [Phase4] 손익 이중코딩 — 색(good/bad)만이 아니라 방향 아이콘(▲/▼)을 함께 붙여
// 색각 이상 사용자도 이익/손실을 구분할 수 있게 한다. (아이콘은 CSS ::before가 그림)
const plHTML = (v, suffix, opts) => {
  const o = opts || {};
  const pos = v >= 0;
  const body = (pos ? '+' : '-') + fmt(Math.abs(v)) + (suffix || '');
  return `<span class="pl ${pos ? 'pl-pos' : 'pl-neg'}${o.big ? ' big' : ''}">${body}</span>`;
};

Object.assign(globalThis, { $, fmt, rand, randInt, pick, clamp, shuffle, pickWeighted, plHTML });
export { fmt, rand, randInt, pick, clamp, shuffle, pickWeighted, plHTML };

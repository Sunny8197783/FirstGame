// 헤드리스 시뮬 공용 DOM/브라우저 스텁 — src/game.js 임포트 전에 로드할 것
export const mkEl = () => ({
  style: { getPropertyValue() { return ''; }, setProperty() {} },
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  innerHTML: '', textContent: '', value: '1000', disabled: false, className: '',
  appendChild() {}, remove() {}, addEventListener() {}, click() {},
  querySelector() { return mkEl(); }, querySelectorAll() { return []; },
  getBoundingClientRect() { return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }; },
  scrollTop: 0, scrollHeight: 0, children: [], lastChild: null, max: 0, files: [],
});

export const elCache = {};

export function installStubs() {
  const body = mkEl();
  body.className = '';
  globalThis.document = {
    getElementById: (id) => (elCache[id] = elCache[id] || mkEl()),
    querySelector: () => mkEl(),
    querySelectorAll: () => [],
    createElement: () => mkEl(),
    addEventListener() {},
    body,
  };
  globalThis.window = globalThis;
  globalThis.innerWidth = 1280;
  globalThis.scrollY = 0;
  // 연출용 타이머는 즉시 실행 (로직만 검증)
  globalThis.setTimeout = (fn) => { fn(); return 0; };
  // 저장 시스템 스텁
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
}

export async function loadGame() {
  installStubs();
  await import('../src/game.js');
  return globalThis; // S, CONFIG, 함수 전부 globalThis 등록됨
}

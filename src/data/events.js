// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
const UPGRADES = [
  { id: 'scale',     emoji: '⚖️', name: '정밀 저울',   desc: '실물 검수의 오차가 사라진다 — 부위별 점수가 100% 정직해진다.' },
  { id: 'lens',      emoji: '🔎', name: '감정 렌즈',   desc: '감정 소견이 추가된다 — 가치가 시세 하단/중단/상단권인지 알려준다 (항상 진실).' },
  { id: 'journal',   emoji: '📖', name: '감정 학회지', desc: '손님의 정보에 함정이 섞여 있으면 경고해 준다 (어느 것인지는 모른다).' },
  { id: 'informant', emoji: '🕵️', name: '정보원 고용', desc: '매 경기 소문 하나의 진위를 확인해 준다 — 진짜인지 헛소문인지.' },
  { id: 'expand',    emoji: '🏗️', name: '가게 확장',   desc: '진열대가 넓어져 손님이 하루 1명 더 온다.' },
  { id: 'remodel',   emoji: '🏛️', name: '전당포 리모델링', act: 2, desc: '거리의 명소가 된다 — 손님이 하루 1명 더 온다 (확장과 중첩).' },
  { id: 'bigshot',   emoji: '🎩', name: '큰손 인맥',   act: 2, desc: '매일 손님 중 1명은 반드시 고가품을 들고 온다.' },
];

// 오프닝 인트로 컷신 (클릭으로 진행, 스킵 가능)

const DAILY_EVENTS = [
  { id: 'normal', w: 3, name: '평범한 날',      desc: '특별한 일 없이 하루가 시작된다.' },
  { id: 'boom',   w: 1, name: '시장 호황 📈',   desc: '골동품 시세가 들썩인다 — 오늘 되팔이 +12%!', resaleMul: 1.12 },
  { id: 'bust',   w: 1, name: '시장 불황 📉',   desc: '경기가 얼어붙었다 — 오늘 되팔이 −10%...', resaleMul: 0.90 },
  { id: 'vip',    w: 1, name: '큰손의 소문 🎩', desc: '거물이 물건을 내놓는다는 소문 — 고가품 손님이 온다!', vip: true },
  { id: 'fest',   w: 1, name: '격투장 대목 🔥', desc: '오늘 밤은 특별히 3경기가 열린다!', nightMatches: 3 },
  { id: 'raid',   w: 1, name: '단속 소문 🚨',   desc: '경찰이 눈을 번뜩인다 — 오늘 밤 베팅 상한 30%.', betCap: 0.30 },
];

// 파이터 12명 (공/방/스피드 1~10 기준치 — 게임 시작 시 ±FIGHTER_STAT_JITTER 랜덤 변동)

Object.assign(globalThis, { UPGRADES, DAILY_EVENTS });
export { UPGRADES, DAILY_EVENTS };

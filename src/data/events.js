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

// [Phase3] 선택지형 일일 이벤트 10종 + 평범한 날.
// 아침 전환 후 선택 모달이 뜨고, 고른 선택지의 fx가 당일 S.event에 합쳐진다. (통보형 금지)
const DAILY_EVENTS = [
  { id: 'normal', w: 5, name: '평범한 날', desc: '특별한 일 없이 하루가 시작된다.' },
  { id: 'boom', w: 1, name: '시장 호황 📈', desc: '골동품 시세가 들썩인다. 오늘 물량을 어떻게 굴릴까?',
    choices: [
      { label: '웃돈 주고 물량 매집', cost: 500, note: '오늘 되팔이 +20%', fx: { resaleMul: 1.20 } },
      { label: '평소대로 판다', cost: 0, note: '오늘 되팔이 +12%', fx: { resaleMul: 1.12 } },
    ] },
  { id: 'bust', w: 1, name: '시장 불황 📉', desc: '경기가 얼어붙었다. 오늘 매입분을 어쩐다?',
    choices: [
      { label: '헐값에라도 던진다', cost: 0, note: '오늘 되팔이 −10%', fx: { resaleMul: 0.90 } },
      { label: '보관료 내고 버틴다', cost: 300, note: '되팔이 정상가 유지', fx: {} },
    ] },
  { id: 'vip', w: 1, name: '큰손의 소문 🎩', desc: '거물이 물건을 내놓는다는 소문이다. 다리를 놓아줄까?',
    choices: [
      { label: '소개비를 낸다', cost: 400, note: '고가품 손님 확정 방문', fx: { vip: true } },
      { label: '소문일 뿐이다', cost: 0, note: '평범한 하루', fx: {} },
    ] },
  { id: 'fest', w: 1, name: '격투장 대목 🔥', desc: '오늘 밤 특별 흥행이 열린다는 전단이 붙었다.',
    choices: [
      { label: '특석 입장권을 산다', cost: 300, note: '오늘 밤 3경기 관전·베팅', fx: { nightMatches: 3 } },
      { label: '평소처럼 2경기만', cost: 0, note: '', fx: {} },
    ] },
  { id: 'raid', w: 1, name: '단속 소문 🚨', desc: '경찰이 격투장 주변을 어슬렁거린다.',
    choices: [
      { label: '뇌물을 찔러준다', cost: 600, note: '오늘 밤 베팅 정상 운영', fx: {} },
      { label: '납작 엎드린다', cost: 0, note: '오늘 밤 베팅 상한 30%', fx: { betCap: 0.30 } },
    ] },
  { id: 'seminar', w: 1, name: '감정 세미나 📚', desc: '전설의 감정사가 하루짜리 특강을 연다.',
    choices: [
      { label: '수강한다', cost: 500, note: '오늘 실물 검수 오차 없음', fx: { noNoise: true } },
      { label: '독학으로 충분하다', cost: 0, note: '', fx: {} },
    ] },
  { id: 'informer', w: 1, name: '뒷골목 정보상 🕵️', desc: '"오늘 밤 경기, 진짜 정보 하나 물어왔는데."',
    choices: [
      { label: '정보를 산다', cost: 400, note: '오늘 밤 경기당 소문 1개 진위 확인', fx: { oneVerify: true } },
      { label: '사기꾼일 게 뻔하다', cost: 0, note: '', fx: {} },
    ] },
  { id: 'crowd', w: 1, name: '손님 몰림 👥', desc: '옆 전당포가 문을 닫아 손님이 몰려온다.',
    choices: [
      { label: '전부 받는다', cost: 0, note: '손님 +1명 · 함정 힌트 +10%p', fx: { extraCustomer: 1, trapBoost: 0.10 } },
      { label: '평소만큼만 받는다', cost: 0, note: '', fx: {} },
    ] },
  { id: 'scandal', w: 1, name: '파이터 찌라시 📰', desc: '오늘 밤 출전 선수들의 소문지가 은밀히 돈다.',
    choices: [
      { label: '찌라시를 산다', cost: 300, note: '실제 정황이 있는 파이터는 확증 소문이 반드시 붙는다', fx: { extraRumor: true } },
      { label: '루머일 뿐이다', cost: 0, note: '', fx: {} },
    ] },
  { id: 'busker', w: 1, name: '거리 악사 🎻', desc: '가게 앞에서 악사가 바이올린을 켠다. 분위기가 좋다.',
    choices: [
      { label: '한 곡 청한다', cost: 200, note: '오늘 손님들의 인내심 +1', fx: { patienceBonus: 1 } },
      { label: '조용히 지나친다', cost: 0, note: '', fx: {} },
    ] },
];

// 파이터 12명 (공/방/스피드 1~10 기준치 — 게임 시작 시 ±FIGHTER_STAT_JITTER 랜덤 변동)

Object.assign(globalThis, { UPGRADES, DAILY_EVENTS });
export { UPGRADES, DAILY_EVENTS };

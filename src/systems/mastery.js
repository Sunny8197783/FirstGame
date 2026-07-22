// [신규] 📖 감정안(鑑定眼) — 회차를 넘어 영구히 쌓이는 감정 실력.
// 세이브(한 회차)와 분리된 독립 저장(업적과 같은 방식)이라, 새 게임을 시작해도 유지된다.
// → "나날이 갈수록 감정인으로 성장하는" 장기 훅.
//
// ⚠️ 핵심 원칙(게임 심장 보존): 성장 보상은 '정보 명료화'뿐이다 — 정답을 자동으로 주지 않는다.
//    카테고리를 파고들수록 그 분야 물건이 '더 잘 보일' 뿐, 진짜 가치·흥정은 여전히 플레이어 몫이다.
//    실제로 새벽 암시장 도구(렌즈/저울/학회지)를 카테고리 한정으로 영구히 얻는 구조라
//    기존 밸런스와 어긋나지 않는다.
const MASTERY_KEY = 'pawnshop_mastery_v1';

// 감정 카테고리 6종. 각 물건이 정확히 하나에 속한다(아래 ITEM_CAT에서 명시).
const CATEGORIES = [
  { id: 'time', name: '시계·정밀기계', emoji: '⏱️' },
  { id: 'gem',  name: '보석·귀금속',   emoji: '💎' },
  { id: 'cera', name: '도자·공예',     emoji: '🏺' },
  { id: 'art',  name: '서화·고서',     emoji: '🖼️' },
  { id: 'arms', name: '무기·갑주',     emoji: '⚔️' },
  { id: 'misc', name: '명품·기타',     emoji: '🎁' },
];

// 물건 → 카테고리 (이름으로 명시 고정 — 키워드 추론은 오분류 위험이 있어 쓰지 않는다)
const ITEM_CAT = {
  '스위스 태엽 회중시계': 'time', '스위스 크로노그래프 시계': 'time',
  '독일제 레인지파인더 카메라': 'time', '14K 금촉 만년필': 'time',
  '스위스제 실린더 오르골': 'time', '40년대 진공관 라디오': 'time',
  '18K 다이아 세팅 금반지': 'gem', '3캐럿급 다이아 목걸이': 'gem',
  '순금 두꺼비상 (한 냥)': 'gem', '고려 금동불상(전세품)': 'gem',
  '로마 금화 세트': 'gem', '금화 궤짝': 'gem', '조선 어보(왕실 인장)': 'gem',
  '익선관(왕의 관모)': 'gem', '산호 왕관': 'gem', '보석 세공 달걀': 'gem',
  '빅토리아풍 은촛대': 'gem', '궁중 은장도': 'gem',
  '고려청자 상감 매병(추정)': 'cera', '명나라 청화백자': 'cera',
  '청동 궁중 향로': 'cera', '아르데코 샹들리에': 'cera',
  '고려 나전 경함': 'cera', '자개 경대': 'cera',
  '인상파풍 풍경 유화': 'art', '옛 기념우표 앨범': 'art',
  '고서 초판본': 'art', '곤룡포 흉배': 'art',
  '조선 환도(추정)': 'arms', '중세 기사 투구': 'arms', '에도 시대 일본도(추정)': 'arms',
  '전통 각궁': 'arms', '승자총통': 'arms', '군령기(장군 깃발)': 'arms', '장군 갑주': 'arms',
  '이탈리아 공방 라벨 바이올린': 'misc', '60년대 싱글몰트 위스키': 'misc',
  '70년대 라이더스 가죽 재킷': 'misc', '운석 조각': 'misc', '고가구 문갑': 'misc',
};

function catOf(item) { return ITEM_CAT[item.name] || 'misc'; }
function catInfo(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[5]; }

// 레벨 임계(누적 XP). Lv0~5. 한 분야를 5까지 올리려면 여러 회차가 걸린다 → 장기 성장.
const LEVEL_XP = [0, 40, 110, 230, 420, 700];
const MAX_LEVEL = 5;

// 레벨별 특전 — 전부 '정보 명료화'. 새벽 도구(렌즈/저울/학회지)를 카테고리 한정으로 영구히 얻는 셈.
const LEVEL_PERKS = [
  '',                                                   // Lv0
  '👁️ 검수 시작 시 부위 하나가 이미 눈에 들어온다',        // Lv1 preReveal
  '🔬 이 분야는 검수 오차가 절반으로 준다',                // Lv2 noiseMul .5
  '🔎 진짜 가치의 위치(상·중·하)가 보인다',               // Lv3 valueHint (렌즈급)
  '📖 힌트에 함정이 섞였는지 감지한다',                    // Lv4 trapSense (학회지급)
  '⚖️ 검수에 오차가 사라진다 (경지)',                     // Lv5 noNoise (저울급)
];

let mastery = {}; // { time: {xp, lvl}, ... }
try {
  const raw = localStorage.getItem(MASTERY_KEY);
  if (raw) mastery = JSON.parse(raw) || {};
} catch (e) { mastery = {}; }
// 누락 카테고리 보정
CATEGORIES.forEach(c => { if (!mastery[c.id]) mastery[c.id] = { xp: 0, lvl: 0 }; });

function persistMastery() {
  try { localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery)); } catch (e) { /* 무시 */ }
}

function levelForXP(xp) {
  let lvl = 0;
  for (let i = 1; i <= MAX_LEVEL; i++) if (xp >= LEVEL_XP[i]) lvl = i;
  return lvl;
}

function masteryLevel(catId) { return (mastery[catId] || { lvl: 0 }).lvl; }
function totalMastery() { return CATEGORIES.reduce((s, c) => s + masteryLevel(c.id), 0); }

// 누적 특전(상위 레벨은 하위를 포함) — 감정 로직이 이 플래그를 읽는다
function masteryPerks(catId) {
  const lvl = masteryLevel(catId);
  return {
    lvl,
    preReveal: lvl >= 1 ? 1 : 0,
    noiseMul: lvl >= 5 ? 0 : lvl >= 2 ? 0.5 : 1,
    noNoise: lvl >= 5,
    valueHint: lvl >= 3,
    trapSense: lvl >= 4,
  };
}

// 감정 경험치 획득 — 저녁 정산에서 매입품마다 호출. 레벨업이면 정보를 돌려준다.
function gainAppraisalXP(item, opts) {
  const o = opts || {};
  const cat = catOf(item);
  const m = mastery[cat];
  const before = m.lvl;
  // 기본 + 이익 보너스(잘 산 만큼) + 잭팟 보너스 — 좋은 판단이 더 빨리 큰다
  let xp = 10;
  if (o.profit > 0) xp += Math.min(10, Math.round(o.profit / 2000));
  if (o.jackpot) xp += 15;
  m.xp += xp;
  m.lvl = levelForXP(m.xp);
  persistMastery();
  return m.lvl > before ? { cat, name: catInfo(cat).name, emoji: catInfo(cat).emoji, lvl: m.lvl, perk: LEVEL_PERKS[m.lvl] } : null;
}

// 계급 — 전 카테고리 레벨 합(0~30)으로 타이틀을 준다
function masteryRank() {
  const t = totalMastery();
  const ranks = [
    [30, '전설의 명인'], [24, '감정의 대가'], [18, '이름난 감정사'],
    [12, '노련한 감정사'], [7, '어엿한 감정사'], [3, '초짜 감정사'], [0, '견습 감정사'],
  ];
  return ranks.find(([cut]) => t >= cut)[1];
}

function resetMastery() {
  mastery = {};
  CATEGORIES.forEach(c => { mastery[c.id] = { xp: 0, lvl: 0 }; });
  persistMastery();
}

// 📖 감정 수첩 — 분야별 진척·특전·계급을 보는 참조 화면
function renderMasteryBook() {
  sndClick();
  const rows = CATEGORIES.map(c => {
    const m = mastery[c.id];
    const nextXP = m.lvl < MAX_LEVEL ? LEVEL_XP[m.lvl + 1] : null;
    const prevXP = LEVEL_XP[m.lvl];
    const pct = nextXP ? Math.round((m.xp - prevXP) / (nextXP - prevXP) * 100) : 100;
    return `<div class="mb-row">
      <div class="mb-head">
        <span class="mb-name">${c.emoji} ${c.name}</span>
        <span class="mb-lvl ${m.lvl >= MAX_LEVEL ? 'max' : ''}">Lv ${m.lvl}${m.lvl >= MAX_LEVEL ? ' · 경지' : ''}</span>
      </div>
      <div class="mb-bar"><div class="mb-fill" style="width:${pct}%"></div>
        <span class="mb-xp">${nextXP ? `${m.xp} / ${nextXP} XP` : 'MAX'}</span></div>
      ${m.lvl > 0 ? `<div class="mb-perk">${LEVEL_PERKS[m.lvl]}</div>` : '<div class="mb-perk dim">아직 이 분야를 감정한 적이 없다.</div>'}
    </div>`;
  }).join('');
  showModal(`
    <h2 class="accent">📖 감정 수첩</h2>
    <p style="font-size:14px; margin-bottom:4px">현재 계급 — <b class="accent">${masteryRank()}</b>
      <span class="dim" style="font-size:12px">(감정안 총합 ${totalMastery()} / ${CATEGORIES.length * MAX_LEVEL})</span></p>
    <p class="dim" style="font-size:12px; margin-bottom:8px">같은 분야를 감정할수록 그 분야가 <b>더 잘 보인다</b> — 정답이 아니라 눈이다.</p>
    <div class="modal-scroll">${rows}</div>
    <div class="center" style="margin-top:8px">
      <button onclick="hideModal()">닫기</button>
      <button class="btn-ghost" style="font-size:11px; padding:5px 8px" onclick="confirmResetMastery()">기록 초기화</button>
    </div>`);
}

function confirmResetMastery() {
  showModal(`
    <h2 class="bad">📖 감정 수첩 초기화</h2>
    <p>지금까지 쌓은 감정안을 전부 지운다. 되돌릴 수 없다.</p>
    <div class="center" style="margin-top:10px">
      <button class="btn-big" onclick="resetMastery(); toast('감정 수첩을 초기화했다'); renderMasteryBook()">초기화한다</button>
      <button class="btn-ghost" onclick="renderMasteryBook()">취소</button>
    </div>`);
}

Object.assign(globalThis, {
  CATEGORIES, ITEM_CAT, catOf, catInfo, masteryLevel, totalMastery,
  masteryPerks, gainAppraisalXP, masteryRank, resetMastery,
  renderMasteryBook, confirmResetMastery, LEVEL_PERKS,
});
export { CATEGORIES, catOf, masteryPerks, gainAppraisalXP, masteryRank, totalMastery, renderMasteryBook, resetMastery };

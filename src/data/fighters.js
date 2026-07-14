// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
const MOVES = {
  rush:    { name: '러시',   emoji: '👊', beats: 'poke' },
  poke:    { name: '견제',   emoji: '🦶', beats: 'counter' },
  counter: { name: '카운터', emoji: '🛡️', beats: 'rush' },
};

const BEAT_OF = { rush: 'counter', poke: 'rush', counter: 'poke' }; // x를 이기는 수
// 상대의 예비 동작(텔) — TELL_TRUTH 확률로 진짜, 아니면 페인트

const TELLS = {
  rush: ['어깨를 낮추고 발끝에 체중을 싣는다... 돌진해 올 기세다!', '주먹을 꽉 쥐고 성큼성큼 거리를 좁혀온다!'],
  poke: ['가볍게 스텝을 밟으며 잽 거리를 잰다.', '시선이 당신의 다리께를 훑는다... 견제가 올 것 같다.'],
  counter: ['가드를 단단히 올린 채 당신의 선공을 기다린다.', '뒷발에 체중을 실었다... 카운터 자세다.'],
};

// 격투 기술 8종: act = 공격자 모션 클래스, rx = 피격자 리액션, fly = 도약기(이동 궤적이 다름)

const FIGHT_MOVES = [
  { id: 'punch',    heavy: false, act: 'act-punch',    rx: 'rx-hit',     fx: '💢', lines: [
    '{a}의 스트레이트가 {b}의 턱에 꽂힌다!', '{a}, 원투 콤보! {b}가 뒷걸음질 친다!'] },
  { id: 'kick',     heavy: false, act: 'act-kick',     rx: 'rx-hit',     fx: '💢', lines: [
    '{a}의 미들킥이 {b}의 옆구리를 강타한다!', '{a}의 로우킥! {b}의 다리가 휘청인다!'] },
  { id: 'sweep',    heavy: false, act: 'act-sweep',    rx: 'rx-tripped', fx: '💫', lines: [
    '{a}의 발목 후리기! {b}가 균형을 잃고 나뒹군다!', '{a}가 낮게 파고들어 다리를 걷어찬다! {b} 전도!'] },
  { id: 'lowblow',  heavy: false, act: 'act-lowblow',  rx: 'rx-lowblow', fx: '🥴', lines: [
    '{a}의 은밀한 급소 공격!! 심판은 못 봤다! {b}가 새하얗게 질려 주저앉는다!'] },
  { id: 'flykick',  heavy: true,  act: 'act-flykick',  rx: 'rx-hit',     fx: '💥', fly: true, lines: [
    '{a}가 날아올랐다!! 플라잉 니킥이 {b}의 안면에 작렬한다!!', '{a}의 점프 하이킥!! {b}의 고개가 꺾인다!!'] },
  { id: 'flypunch', heavy: true,  act: 'act-flypunch', rx: 'rx-hit',     fx: '💥', fly: true, lines: [
    '{a}의 슈퍼맨 펀치!! 공중에서 내리꽂힌다!! {b} 대미지 심각!!'] },
  { id: 'throw',    heavy: true,  act: 'act-throw',    rx: 'rx-thrown',  fx: '💥', lines: [
    '{a}의 업어치기!! {b}가 허공을 돌아 바닥에 메다꽂힌다!!', '{a}가 허리를 잡았다—— 그대로 뒤집어 던진다!! {b} 낙하!!'] },
  { id: 'slam',     heavy: true,  act: 'act-slam',     rx: 'rx-slammed', fx: '💥', fly: true, lines: [
    '{a}가 온몸을 날린다!! 바디 프레스가 {b}를 짓누른다!!'] },
];

const LIGHT_MOVES = FIGHT_MOVES.filter(mv => !mv.heavy);

const HEAVY_MOVES = FIGHT_MOVES.filter(mv => mv.heavy);

const PLAYER_COLOR = '#3a6ab0';

// 팔다리가 있는 격투가 리그 (outer: 위치·이동 / .flip: 좌우 반전 / .rig: 몸통 모션 / 부위: 기술 모션)

const FIGHTERS_DATA = [
  { name: '불곰 강대호',   emoji: '🐻', color: '#8a5a2b', atk: 8, def: 7, spd: 3,  skill: '곰발바닥 스매시' },
  { name: '독사 백사연',   emoji: '🐍', color: '#3f8f4f', atk: 7, def: 4, spd: 9,  skill: '베놈 스트라이크' },
  { name: '망치 오철근',   emoji: '🔨', color: '#7a7f8a', atk: 9, def: 5, spd: 4,  skill: '해머 드롭' },
  { name: '그림자 신무영', emoji: '🥷', color: '#2e2e3e', atk: 6, def: 6, spd: 8,  skill: '섀도 스텝' },
  { name: '탱크 방태산',   emoji: '🛡️', color: '#4a6a3a', atk: 5, def: 9, spd: 3,  skill: '철벽 카운터' },
  { name: '번개 전광석',   emoji: '⚡', color: '#c8a020', atk: 6, def: 5, spd: 10, skill: '라이트닝 러시' },
  { name: '전갈 황독침',   emoji: '🦂', color: '#a04818', atk: 8, def: 3, spd: 8,  skill: '테일 훅' },
  { name: '늑대 서리한',   emoji: '🐺', color: '#5a7a9a', atk: 7, def: 6, spd: 6,  skill: '울프 팽' },
  { name: '도깨비 곽두팔', emoji: '👹', color: '#a03030', atk: 9, def: 6, spd: 2,  skill: '도깨비 방망이' },
  { name: '매 차성준',     emoji: '🦅', color: '#6a4a8a', atk: 5, def: 4, spd: 10, skill: '탤런 다이브' },
  { name: '멧돼지 노강돌', emoji: '🐗', color: '#6a5030', atk: 8, def: 5, spd: 5,  skill: '차지 태클' },
  { name: '조커 한무패',   emoji: '🃏', color: '#8a2a6a', atk: 6, def: 7, spd: 7,  skill: '와일드 카드' },
];

// 소문 테마 6종. 파이터에게 '실제 정황'이 있으면 그 테마의 소문이 진짜로 돈다.
// 같은 아이콘 소문이 2개 겹치면 상호 검증(사실 확률↑), +/− 테마가 충돌하면 최소 하나는 거짓.

const FIGHT_ATTACK_LINES = [
  '{a}의 묵직한 훅! {b}의 몸이 크게 흔들린다!',
  '{a}, 빈틈을 파고든다! {b}의 가드가 뚫렸다!',
  '{a}의 로우킥이 {b}의 다리를 강타한다!',
  '{a}가 코너로 몰아붙인다! {b} 위기!',
  '{a}의 카운터가 정확히 꽂힌다! {b}가 휘청인다!',
  '{a}의 연타! {b}가 뒷걸음질 친다!',
];

const FIGHT_WEAK_LINES = [
  '{a}가 반격하지만 {b}가 침착하게 흘려낸다.',
  '{a}의 주먹이 허공을 가른다. {b}는 여유롭다.',
  '{a}가 클린치로 버틴다. 관중석에서 야유가 쏟아진다.',
];

const FIGHT_HEAVY_LINES = [
  '{a}의 필살 준비 동작—— 묵직한 일격이 {b}를 정통으로 강타한다!!',
  '{a}가 온몸의 체중을 실었다! {b}가 로프까지 날아간다!!',
  '{a}의 어퍼컷이 작렬! {b}의 무릎이 꺾인다!!',
];

const FIGHT_DODGE_LINES = [
  '{b}가 종이 한 장 차이로 피한다! {a}의 공격이 허공을 가른다!',
  '{a}의 일격을 {b}가 몸을 젖혀 흘린다! 아슬아슬하다!',
  '{b}의 위빙! {a}의 연타가 전부 빗나간다!',
];

const FIGHT_CROWD_LINES = [
  '🔥 관중석이 들끓는다! 양쪽 다 물러서지 않는다!',
  '🔥 피 냄새를 맡은 함성이 지하를 뒤흔든다! 승부를 알 수 없다!',
];

const FIGHT_COMEBACK_LINES = [
  '⚡ {a}(이)가 로프를 잡고 일어선다... 눈빛이 아직 죽지 않았다!',
  '⚡ 쓰러지기 직전의 {a}—— 갑자기 반격의 리듬을 타기 시작한다!',
];

/* ═══════════════════════════════════════════════════════════════
   유틸리티
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { MOVES, BEAT_OF, TELLS, FIGHT_MOVES, LIGHT_MOVES, HEAVY_MOVES, PLAYER_COLOR, FIGHTERS_DATA, FIGHT_ATTACK_LINES, FIGHT_WEAK_LINES, FIGHT_HEAVY_LINES, FIGHT_DODGE_LINES, FIGHT_CROWD_LINES, FIGHT_COMEBACK_LINES });
export { MOVES, BEAT_OF, TELLS, FIGHT_MOVES, LIGHT_MOVES, HEAVY_MOVES, PLAYER_COLOR, FIGHTERS_DATA, FIGHT_ATTACK_LINES, FIGHT_WEAK_LINES, FIGHT_HEAVY_LINES, FIGHT_DODGE_LINES, FIGHT_CROWD_LINES, FIGHT_COMEBACK_LINES };

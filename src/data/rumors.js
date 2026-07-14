// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
const RUMOR_THEMES = [
  { id: 'injury', icon: '🩹', sign: -1, mag: [0.07, 0.13], rumors: [
    { text: '어제 훈련 중 다리를 절었다는 소문이 돈다', strength: 'weak' },
    { text: '대기실에서 다리에 붕대를 감는 걸 직접 봤다', strength: 'strong' },
    { text: '요즘 진통제를 달고 산다는 얘기가 있다', strength: 'weak' },
  ]},
  { id: 'drink', icon: '🍶', sign: -1, mag: [0.06, 0.12], rumors: [
    { text: '새벽까지 술을 마시는 걸 직접 봤다', strength: 'strong' },
    { text: '어젯밤 도박장에서 만취했다는 얘기가 있다', strength: 'weak' },
    { text: '입장할 때 술 냄새가 났다는 수군거림이 있다', strength: 'weak' },
  ]},
  { id: 'slump', icon: '🌫️', sign: -1, mag: [0.05, 0.11], rumors: [
    { text: '가족 문제로 심란하다는 이야기가 들린다', strength: 'weak' },
    { text: '스파링에서 후배에게 밀렸다는 소문이 있다', strength: 'weak' },
    { text: '눈빛이 완전히 죽어 있는 걸 직접 봤다', strength: 'strong' },
  ]},
  { id: 'training', icon: '🔥', sign: +1, mag: [0.06, 0.12], rumors: [
    { text: '비밀 특훈을 했다는 소문이 있다', strength: 'weak' },
    { text: '새벽마다 로드워크를 뛰는 걸 직접 봤다', strength: 'strong' },
    { text: '체육관 불이 밤새 켜져 있었다고 한다', strength: 'weak' },
  ]},
  { id: 'form', icon: '⚡', sign: +1, mag: [0.07, 0.13], rumors: [
    { text: '워밍업에서 움직임이 날아다니는 걸 직접 봤다', strength: 'strong' },
    { text: '요즘 컨디션이 인생 최고라는 얘기가 있다', strength: 'weak' },
    { text: '스파링 파트너를 압도하는 걸 직접 봤다', strength: 'strong' },
  ]},
  { id: 'focus', icon: '🎯', sign: +1, mag: [0.05, 0.11], rumors: [
    { text: '오늘따라 눈빛이 무섭게 날카로운 걸 직접 봤다', strength: 'strong' },
    { text: '오늘 무조건 이겨야 할 빚이 있다는 얘기가 있다', strength: 'weak' },
    { text: '가족이 처음 보러 왔다 — 각오가 다르다고 한다', strength: 'weak' },
  ]},
];

// 격투 중계 텍스트

Object.assign(globalThis, { RUMOR_THEMES });
export { RUMOR_THEMES };

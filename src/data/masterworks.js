// [신규] 🎖️ 분야 명품(전설 매물) — 감정안 만렙(Lv5)의 보상.
// 한 분야를 만렙까지 파고들면, 그 분야에서만 도는 '명품'을 든 손님이 가끔 찾아온다.
//   · 값이 매우 크다(성공 시 한 방) — 하지만 큰 판일수록 오판의 대가도 크다(위험/보상).
//   · 명품은 '진짜 걸작이거나, 걸작을 흉내 낸 정교한 위작'이다 → 잭팟·함정 확률이 둘 다 높다.
//   · 감정안 Lv5 특전(오차 0·가치위치·함정감지)이 있어야 그나마 읽어낼 수 있다 — 성장이 곧 열쇠.
// 데이터는 기존 ITEMS/ITEM_PARTS 배열에 밀어 넣는다(items.js 다음에 로드). 아트는 폴백으로 이모지.

const MASTERWORKS = [
  { name: '월상 미닛리피터 회중시계', emoji: '⏱️', lo: 45000, hi: 130000, act: 1, master: 'time', reqLvl: 5,
    lore: '누르면 시각을 종소리로 알리는 최고 난도의 합병증(컴플리케이션). 위작은 소리가 죽는다.',
    high: ['리피터를 울리니 두 음정이 맑게 갈라져 운다', '월상 원반의 톱니가 머리카락처럼 정교하다'],
    low:  ['리피터 소리가 먹먹하게 뭉개진다', '월상이 실제 달과 어긋나 있다 — 기어가 헐거웠다'],
    trapHigh: ['왕실 주문 제작 유일본이라고 손님이 속삭인다'],
    trapLow:  ['정교한 복각 무브먼트가 시장에 돈다는 얘기가 있다'] },
  { name: '비둘기핏빛 루비 목걸이', emoji: '💎', lo: 55000, hi: 160000, act: 1, master: 'gem', reqLvl: 5,
    lore: '가열 처리하지 않은 천연 피죤블러드 루비. 색과 형광이 값을 수십 배로 가른다.',
    high: ['자외선 아래 핏빛 형광이 살아 타오른다', '내포물이 비단결처럼 자연스레 흐른다'],
    low:  ['색이 균일해 너무 완벽하다 — 가열 처리 의심', '자세히 보니 유리 충전 흔적이 비친다'],
    trapHigh: ['왕가의 대관식 보석이었다고 주장한다'],
    trapLow:  ['합성 루비를 천연으로 속이는 수법이 정교해졌다고 한다'] },
  { name: '북송 천청유 여요 접시', emoji: '🏺', lo: 50000, hi: 150000, act: 1, master: 'cera', reqLvl: 5,
    lore: '전 세계 100점도 안 남았다는 하늘색 여요. 빙렬(氷裂)과 굽의 흔적이 진위의 전부다.',
    high: ['유약에 게발 모양 빙렬이 자연스레 번졌다', '굽에 참깨 같은 지정(支釘) 자국 다섯이 또렷하다'],
    low:  ['빙렬이 인위적으로 그은 듯 규칙적이다', '천청색이 들떠 요즘 유약처럼 밝다'],
    trapHigh: ['박물관 소장품과 같은 가마 것이라고 속삭인다'],
    trapLow:  ['고령토로 완벽히 재현한 방품이 나돈다는 소문이다'] },
  { name: '진경산수 대가의 실경 진작', emoji: '🖼️', lo: 45000, hi: 140000, act: 1, master: 'art', reqLvl: 5,
    lore: '조선 진경산수의 정점. 필묵의 기세와 지질·낙관이 진작 여부를 가른다.',
    high: ['먹의 농담이 한 붓에 살아 산세가 숨쉰다', '한지의 발 무늬와 배접이 시대와 정확히 맞는다'],
    low:  ['필선이 어딘가 머뭇거려 임모(臨摸) 티가 난다', '낙관의 인주가 종이보다 새것이다'],
    trapHigh: ['대가가 말년에 그린 비장의 진작이라고 한다'],
    trapLow:  ['정교한 목판 영인본에 낙관만 찍은 위작이 흔하다'] },
  { name: '왕실 어검(御劍)', emoji: '⚔️', lo: 50000, hi: 150000, act: 1, master: 'arms', reqLvl: 5,
    lore: '임금이 하사하던 의장용 검. 도신의 접쇠 무늬와 장식 금구가 격을 증명한다.',
    high: ['도신에 접쇠 단조의 물결무늬가 살아 있다', '손잡이 금구의 칠보가 하나도 안 바랬다'],
    low:  ['도신 무늬가 산으로 그린 듯 얕고 균일하다', '금구가 후대에 새로 끼운 티가 난다'],
    trapHigh: ['어전에서 하사받은 가문 전세품이라고 속삭인다'],
    trapLow:  ['의장검 복제품에 가짜 명문을 새기는 공방이 있다고 한다'] },
  { name: '17세기 명공 첼로', emoji: '🎻', lo: 50000, hi: 145000, act: 1, master: 'misc', reqLvl: 5,
    lore: '명공방의 현악기. 앞판의 나뭇결과 니스, 라벨의 진위가 값을 가른다.',
    high: ['앞판 가문비 나뭇결이 곧고 균일하며 울림이 깊다', '니스가 세월에 맞게 은은히 삭아 호박빛이 돈다'],
    low:  ['라벨은 옛것인데 안쪽 라이닝이 최근 수리품이다', '니스가 두껍고 균일해 공장 마감 같다'],
    trapHigh: ['명공 본인이 만든 무명작이라고 손님이 주장한다'],
    trapLow:  ['라벨만 진짜를 베껴 붙인 후대 악기가 많다고 한다'] },
];

const MASTERWORK_PARTS = {
  '월상 미닛리피터 회중시계': ['리피터 음정', '월상 기어', '케이스'],
  '비둘기핏빛 루비 목걸이': ['형광·색', '내포물', '세팅'],
  '북송 천청유 여요 접시': ['빙렬', '천청 유약', '굽·지정'],
  '진경산수 대가의 실경 진작': ['필묵', '지질·배접', '낙관'],
  '왕실 어검(御劍)': ['도신 접쇠', '금구 칠보', '명문'],
  '17세기 명공 첼로': ['앞판 결', '니스', '라벨'],
};

// 슬러그(아트 연동) — 나중에 public/art/items/에 그림을 넣으면 자동 반영
const MASTERWORK_SLUGS = {
  '월상 미닛리피터 회중시계': 'mw-repeater-watch',
  '비둘기핏빛 루비 목걸이': 'mw-ruby-necklace',
  '북송 천청유 여요 접시': 'mw-ru-ware',
  '진경산수 대가의 실경 진작': 'mw-landscape-painting',
  '왕실 어검(御劍)': 'mw-royal-sword',
  '17세기 명공 첼로': 'mw-master-cello',
};

// 명품 픽셀아트 — 정식 팔레트 색을 직접 써서(정규화 불필요) PIXEL_ART에 편입
const MASTERWORK_ART = {
  '월상 미닛리피터 회중시계': { p: { O:'#241a10', G:'#e8b23a', g:'#a3711d', W:'#f2efe6', K:'#3a3226', L:'#3a5aa8' }, r: [
    '......OOO.......','.....OGGGO.....','....OGGGGGO....','...OGWWWWWgO...','..OGWWLWLWWgO..',
    '..OGWLWKWLWgO..','..OGWWWKWWWgO..','..OGWLWKWLWgO..','..OGWWLWLWWgO..','...OGWWWWWgO...',
    '....OGGGGGO....','.....OGgGO.....','......OOO......',
  ]},
  '비둘기핏빛 루비 목걸이': { p: { O:'#241a10', G:'#e8b23a', C:'#b03040', c:'#7a1824', W:'#f2efe6' }, r: [
    '..OO.......OO..','.OGGO.....OGGO.','.OGGGO...OGGGO.','..OGGGO.OGGGO..','...OGGGOGGGO...',
    '....OGGGGGO....','.....OGGGO.....','......OCO......','.....OCcCO.....','....OCWCcCO....',
    '.....OCcCO.....','......OCO......','.......O.......',
  ]},
  '북송 천청유 여요 접시': { p: { O:'#241a10', T:'#7cc8d8', t:'#4a94a8', W:'#eaf8fb' }, r: [
    '...OOOOOOOOO...','..OTTTTTTTTTO..','.OTWTtTTtTWTTO.','.OTTtTTTTTtTTO.','.OTTTWTTTWTTTO.',
    '.OTtTTTTTTTtTO.','.OTTTTWTWTTTTO.','.OTTtTTTTTtTTO.','..OTTTTTTTTTO..','...OtttttttO...',
    '....OOOOOOO....',
  ]},
  '진경산수 대가의 실경 진작': { p: { O:'#241a10', B:'#8a5a2b', W:'#e8dcc0', K:'#3a3226', F:'#4a6a5a', R:'#b03030' }, r: [
    'OOOOOOOOOOOOOOOO','OBBBBBBBBBBBBBBO','OBWWWWWWWWWWWWBO','OBWKKWWKWWKKWWBO','OBWKWWWWWWWKWWBO',
    'OBWWWFWFWFWWWWBO','OBWWFFFFFFFWWRBO','OBWFFFFFFFFFWRBO','OBWWWWWWWWWWWWBO','OBBBBBBBBBBBBBBO',
    'OOOOOOOOOOOOOOOO',
  ]},
  '왕실 어검(御劍)': { p: { O:'#241a10', S:'#d4d8de', s:'#9aa0aa', G:'#e8b23a', R:'#b03040' }, r: [
    '.............OO','............OSO','...........OSsO','..........OSsO.','.........OSsO..',
    '........OSsO...','.......OSsO....','......OSsO.....','.....OGGGO.....','....OGRGGO.....',
    '....OGGGO......','...OGGO........','..OGGO.........','..OOO..........',
  ]},
  '17세기 명공 첼로': { p: { O:'#241a10', B:'#a2622e', b:'#7a4418', K:'#3a3226', W:'#e8dcc0' }, r: [
    '......OO.......','.....OWWO......','......bb.......','.....OBBO......','....OBBBBO.....',
    '....OBKBBO....','...OBBBBBBO...','...OBBKKBBO...','...OBBBBBBO...','....OBBBBO....',
    '...OBBBBBBO...','..OBBBBBBBBO..','..OBBBBBBBbO..','...OBBBBBBO...','....OOOOOO....',
  ]},
};

// 기존 데이터 구조에 편입 (globalThis 배열/객체는 items.js가 이미 등록)
MASTERWORKS.forEach(it => ITEMS.push(it));
Object.assign(ITEM_PARTS, MASTERWORK_PARTS);
Object.assign(ART_SLUGS, MASTERWORK_SLUGS);
Object.assign(PIXEL_ART, MASTERWORK_ART);

Object.assign(globalThis, { MASTERWORKS });
export { MASTERWORKS };

// [아트 파이프라인] 외부 일러스트(png/webp)를 게임에 붙이는 계층.
// 원칙: 그림이 없어도 게임은 100% 그대로 동작한다 — 파일이 없으면 기존 픽셀아트/이모지로 폴백.
// 그림 파일은 public/art/<kind>/<slug>.<ext> 에 넣으면 자동으로 잡힌다. (ART.md 참고)
//
// 왜 슬러그를 쓰나: 아이템/손님 이름이 한글이라 파일명으로 쓰면 OneDrive 동기화·빌드 도구에서
// 깨질 수 있다. 그래서 ASCII 슬러그를 명시적으로 고정해 둔다.

const ART_EXT = 'png';   // 생성물 확장자 (webp로 바꾸려면 여기만 수정)
const ART_BASE = '/art';

// 이름 → ASCII 슬러그 (파일명). 새 콘텐츠를 추가하면 여기에도 한 줄 추가할 것.
const ART_SLUGS = {
  // ── 아이템 40종 ──
  '스위스 태엽 회중시계': 'pocket-watch',
  '18K 다이아 세팅 금반지': 'diamond-ring',
  '독일제 레인지파인더 카메라': 'rangefinder-camera',
  '고려청자 상감 매병(추정)': 'goryeo-celadon',
  '인상파풍 풍경 유화': 'impressionist-painting',
  '스위스제 실린더 오르골': 'music-box',
  '14K 금촉 만년필': 'fountain-pen',
  '빅토리아풍 은촛대': 'silver-candelabra',
  '70년대 라이더스 가죽 재킷': 'leather-jacket',
  '이탈리아 공방 라벨 바이올린': 'violin',
  '옛 기념우표 앨범': 'stamp-album',
  '60년대 싱글몰트 위스키': 'whisky-bottle',
  '스위스 크로노그래프 시계': 'chronograph-watch',
  '3캐럿급 다이아 목걸이': 'diamond-necklace',
  '고려 금동불상(전세품)': 'gilt-buddha',
  '40년대 진공관 라디오': 'tube-radio',
  '순금 두꺼비상 (한 냥)': 'gold-toad',
  '조선 환도(추정)': 'joseon-sword',
  '중세 기사 투구': 'knight-helmet',
  '명나라 청화백자': 'ming-porcelain',
  '아르데코 샹들리에': 'artdeco-chandelier',
  '고려 나전 경함': 'najeon-sutra-box',
  '에도 시대 일본도(추정)': 'katana',
  '로마 금화 세트': 'roman-coins',
  '조선 어보(왕실 인장)': 'royal-seal',
  '운석 조각': 'meteorite',
  '자개 경대': 'najeon-vanity',
  '고가구 문갑': 'antique-cabinet',
  '익선관(왕의 관모)': 'ikseongwan-crown',
  '곤룡포 흉배': 'dragon-insignia',
  '궁중 은장도': 'silver-dagger',
  '청동 궁중 향로': 'bronze-censer',
  '장군 갑주': 'general-armor',
  '전통 각궁': 'horn-bow',
  '승자총통': 'hand-cannon',
  '군령기(장군 깃발)': 'war-banner',
  '보석 세공 달걀': 'jeweled-egg',
  '금화 궤짝': 'coin-chest',
  '산호 왕관': 'coral-crown',
  '고서 초판본': 'first-edition-book',
  // ── 손님 유형 14종 ──
  '급전이 필요한 회사원': 'cust-salaryman',
  '깐깐한 수집가': 'cust-collector',
  '수상한 사기꾼': 'cust-swindler',
  '유품 정리인': 'cust-estate-cleaner',
  '등록금이 급한 학생': 'cust-student',
  '은퇴한 골동품상': 'cust-retired-dealer',
  '한탕 노리는 도박꾼': 'cust-gambler',
  '장롱 정리하던 주부': 'cust-housewife',
  '몰락한 귀족 후예': 'cust-fallen-noble',
  '전당포 브로커': 'cust-broker',
  '골동품 경매사': 'cust-auctioneer',
  '뒷골목 밀수업자': 'cust-smuggler',
  '박물관 큐레이터': 'cust-curator',
  '몰락한 재벌 2세': 'cust-fallen-heir',
  // ── 파이터 15명 ──
  '불곰 강대호': 'fighter-bear',
  '독사 백사연': 'fighter-viper',
  '망치 오철근': 'fighter-hammer',
  '그림자 신무영': 'fighter-shadow',
  '탱크 방태산': 'fighter-tank',
  '번개 전광석': 'fighter-lightning',
  '전갈 황독침': 'fighter-scorpion',
  '늑대 서리한': 'fighter-wolf',
  '도깨비 곽두팔': 'fighter-ogre',
  '매 차성준': 'fighter-falcon',
  '멧돼지 노강돌': 'fighter-boar',
  '조커 한무패': 'fighter-joker',
};

function artSlug(name) { return ART_SLUGS[name] || null; }

// 그림 URL. 슬러그가 없으면 null → 호출부는 폴백을 그린다.
function artUrl(kind, name) {
  const slug = artSlug(name);
  return slug ? `${ART_BASE}/${kind}/${slug}.${ART_EXT}` : null;
}

// 로드 실패(파일 없음) 슬러그 캐시 — 같은 그림을 매번 재요청하지 않는다
const artMissing = new Set();

// 그림 + 폴백을 함께 렌더한다.
//   그림이 로드되면 폴백을 숨기고, 실패하면 <img>를 제거해 폴백만 남긴다.
//   kind: 'items' | 'customers' | 'fighters' | 'scenes'
function artHTML(kind, name, fallbackHTML, cls) {
  const url = artUrl(kind, name);
  const key = kind + '/' + name;
  if (!url || artMissing.has(key)) return fallbackHTML; // 이미 없다고 확인된 그림은 시도조차 안 한다
  // loading="lazy"는 쓰지 않는다 — 화면당 1~2장뿐이고, 지연 로드 시 폴백→그림 전환이 늦게 튄다
  return `<span class="art-slot ${cls || ''}">
    <img class="art-img" src="${url}" alt="${name}"
         onload="artOk(this)" onerror="artFail(this,'${key.replace(/'/g, "\\'")}')">
    <span class="art-fb">${fallbackHTML}</span>
  </span>`;
}

function artOk(img) {
  img.classList.add('ok');
  const slot = img.closest('.art-slot');
  if (slot) slot.classList.add('has-art');
}

function artFail(img, key) {
  artMissing.add(key);
  img.remove(); // 폴백(.art-fb)만 남는다
}

Object.assign(globalThis, { ART_SLUGS, ART_EXT, ART_BASE, artSlug, artUrl, artHTML, artOk, artFail });
export { ART_SLUGS, artSlug, artUrl, artHTML, artOk, artFail };

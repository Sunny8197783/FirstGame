# 🎨 아트 제작 가이드 — 그림 넣는 법

> **핵심: 그림이 없어도 게임은 100% 그대로 돌아갑니다.** 파일을 하나 넣을 때마다 그 부분만 새 그림으로 바뀝니다.
> 40장을 한 번에 만들 필요 없이 **한 장씩 넣어가며 확인**하면 됩니다.

---

## 1. 넣는 법 (3단계)

1. 이미지를 생성한다 (Midjourney / DALL·E / Stable Diffusion 등 — 프롬프트는 아래 4장 참고)
2. **투명 배경 PNG**로 저장하고, 아래 표의 **파일명 그대로** 이름 붙인다
3. 해당 폴더에 넣는다 → 새로고침하면 바로 반영

```
public/art/
  items/       ← 물건 40종
  customers/   ← 손님 14종
  fighters/    ← 파이터 12명
  scenes/      ← 배경 (나중에)
```

> 폴더가 없으면 만들어 주세요. 파일명은 **반드시 아래 슬러그와 정확히 일치**해야 합니다(대소문자 구분).
> 한글 파일명은 OneDrive 동기화·빌드에서 깨질 수 있어 영문 슬러그로 고정했습니다.

**규격**
| 종류 | 크기 | 배경 | 비고 |
|---|---|---|---|
| items | 512×512 | **투명** | 물건만. 그림자 없이 |
| customers | 512×512 | **투명** | 상반신. 정면~살짝 측면 |
| fighters | 512×512 | **투명** | 전신 파이팅 포즈 |

확장자는 `png` 고정입니다. `webp`로 바꾸려면 `src/systems/art.js`의 `ART_EXT`만 고치면 됩니다.

---

## 2. 공통 스타일 프롬프트 (모든 그림에 붙일 것)

지브리 + 디즈니 느낌을 노리되, **이 게임의 톤(1980~90년대 한국 뒷골목 지하경제, 앰버빛 낮 / 네온 밤)** 을 유지하는 게 중요합니다.

```
hand-painted 2D animation style, warm cel-shaded lighting, soft painterly textures,
expressive silhouette, clean readable shapes, storybook illustration,
1980s Korean back-alley pawn shop atmosphere, amber and deep teal palette,
subtle grain, high detail, centered composition, transparent background
--no text, watermark, signature, 3d render, photo, harsh outlines
```

> ⚠️ 참고: "지브리풍/디즈니풍" 같은 **화풍**을 노리는 건 괜찮지만, 토토로·미키마우스 같은 **실제 캐릭터**는 넣지 마세요. 상표·저작권 문제가 됩니다.

**색 팔레트** (게임과 맞추려면 이 값들을 프롬프트나 후보정에 반영)
- 앰버(낮/금): `#e8b23a` · 짙은 금: `#a3711d`
- 네온 시안(밤): `#00f0ff` · 네온 핑크: `#ff44aa`
- 목재: `#8a5a2b` · 먹/외곽: `#241a10` · 상아: `#f2efe6`

---

## 3. 우선순위 — 이 순서로 만드는 걸 추천

| 순서 | 대상 | 장수 | 이유 |
|---|---|---|---|
| 1️⃣ | **1막 아이템 18종** | 18 | 플레이어가 가장 오래·자주 보는 화면. 여기만 바뀌어도 체감이 확 달라짐 |
| 2️⃣ | **손님 14종** | 14 | 1인칭 입장 연출(9번)의 재료이기도 함 |
| 3️⃣ | 2막 아이템 6종 | 6 | |
| 4️⃣ | 파이터 12명 | 12 | 격투 연출 개편(12·13번)의 재료 |
| 5️⃣ | 3막·시즌 아이템 16종 | 16 | 후반/시즌 모드라 노출이 적음 |

**1막 18종만 먼저** 만들어 넣어보시고 느낌을 보시는 걸 권합니다.

---

## 4. 파일명 + 프롬프트

### 📦 items — 1막 (18종 · 우선순위 1)

각 프롬프트 앞뒤에 **2장의 공통 스타일 프롬프트**를 붙이세요.

| 파일명 | 물건 | 프롬프트 핵심 |
|---|---|---|
| `pocket-watch.png` | 스위스 태엽 회중시계 | ornate swiss mechanical pocket watch, open case showing gears, worn gold |
| `diamond-ring.png` | 18K 다이아 세팅 금반지 | 18k gold ring with a single diamond, prong setting, slight wear |
| `rangefinder-camera.png` | 독일제 레인지파인더 카메라 | vintage german rangefinder camera, chrome and black leather, 1950s |
| `goryeo-celadon.png` | 고려청자 상감 매병 | korean goryeo celadon vase, jade-green glaze, inlaid crane motif |
| `impressionist-painting.png` | 인상파풍 풍경 유화 | small impressionist landscape oil painting in gilded frame |
| `music-box.png` | 스위스제 실린더 오르골 | swiss cylinder music box, open wooden case, brass comb |
| `fountain-pen.png` | 14K 금촉 만년필 | fountain pen with 14k gold nib, dark resin barrel |
| `silver-candelabra.png` | 빅토리아풍 은촛대 | victorian silver candelabra, tarnished, ornate scrollwork |
| `leather-jacket.png` | 70년대 라이더스 가죽 재킷 | 1970s black leather biker jacket, worn creases, silver zippers |
| `violin.png` | 이탈리아 공방 라벨 바이올린 | old italian violin, warm amber varnish, visible label through f-hole |
| `stamp-album.png` | 옛 기념우표 앨범 | open vintage stamp album, colorful commemorative stamps |
| `whisky-bottle.png` | 60년대 싱글몰트 위스키 | 1960s single malt whisky bottle, aged label, amber liquid |
| `chronograph-watch.png` | 스위스 크로노그래프 시계 | swiss chronograph wristwatch, steel case, subdials |
| `diamond-necklace.png` | 3캐럿급 다이아 목걸이 | diamond necklace, 3-carat centre stone, platinum chain |
| `gilt-buddha.png` | 고려 금동불상 | small gilt-bronze korean buddha statue, serene face, lotus base |
| `tube-radio.png` | 40년대 진공관 라디오 | 1940s wooden tube radio, fabric speaker grille, warm dial glow |
| `gold-toad.png` | 순금 두꺼비상 | solid gold toad figurine, glossy, korean lucky charm |
| `joseon-sword.png` | 조선 환도 | joseon dynasty single-edged sword, lacquered scabbard, brass fittings |

### 📦 items — 2막 (6종)

| 파일명 | 물건 | 프롬프트 핵심 |
|---|---|---|
| `knight-helmet.png` | 중세 기사 투구 | medieval knight great helm, hammered steel, rivets |
| `ming-porcelain.png` | 명나라 청화백자 | ming dynasty blue-and-white porcelain vase, cobalt dragon |
| `artdeco-chandelier.png` | 아르데코 샹들리에 | art deco chandelier, brass frame, faceted crystal drops, 1920s |
| `najeon-sutra-box.png` | 고려 나전 경함 | korean lacquered sutra box, mother-of-pearl inlay, iridescent |
| `katana.png` | 에도 시대 일본도 | edo period katana, visible hamon wave, wrapped tsuka |
| `roman-coins.png` | 로마 금화 세트 | stack of roman gold aurei coins, emperor profile, worn edges |

### 📦 items — 3막·시즌 (16종)

<details><summary>펼치기</summary>

| 파일명 | 물건 |
|---|---|
| `royal-seal.png` | 조선 어보 — joseon royal seal, gilt turtle handle, engraved seal face |
| `meteorite.png` | 운석 조각 — iron meteorite fragment, fusion crust, pitted surface |
| `najeon-vanity.png` | 자개 경대 — korean mother-of-pearl vanity table with mirror |
| `antique-cabinet.png` | 고가구 문갑 — joseon wooden document cabinet, brass fittings |
| `ikseongwan-crown.png` | 익선관 — joseon king's black silk crown with wings |
| `dragon-insignia.png` | 곤룡포 흉배 — royal dragon embroidery badge, gold thread on red silk |
| `silver-dagger.png` | 궁중 은장도 — ornate korean silver dagger, cloisonné inlay |
| `bronze-censer.png` | 청동 궁중 향로 — bronze three-legged incense burner, green patina |
| `general-armor.png` | 장군 갑주 — korean general's brigandine armor, studded plates |
| `horn-bow.png` | 전통 각궁 — korean traditional horn bow, recurved, strung |
| `hand-cannon.png` | 승자총통 — joseon bronze hand cannon, inscribed barrel |
| `war-banner.png` | 군령기 — general's war banner, embroidered, weathered silk |
| `jeweled-egg.png` | 보석 세공 달걀 — fabergé-style jeweled enamel egg, opens to miniature |
| `coin-chest.png` | 금화 궤짝 — wooden chest overflowing with gold coins, salt-stained |
| `coral-crown.png` | 산호 왕관 — red coral crown, delicate branching, gold band |
| `first-edition-book.png` | 고서 초판본 — ancient korean woodblock-printed book, hanji paper |

</details>

### 👤 customers (14종 · 우선순위 2)

**공통**: `korean, 1980s-90s, upper body portrait, entering a pawn shop, holding an item, expressive face`
정면 또는 살짝 측면. **표정은 중립**으로 (게임이 😐🤔😠😊 배지를 따로 올립니다).

> #### 🔀 외모 변형 — 14장만 만들어도 되고, 56장까지 늘려도 됩니다
> 손님은 **유형 14종 × 외모 4종 = 56가지**로 등장합니다. 그림은 아래 순서로 찾습니다:
> `cust-salaryman-3.png` → `cust-salaryman.png` → 이모지
>
> - **최소(14장)**: `cust-salaryman.png` 처럼 유형별로 1장만 → 그 유형 전원이 같은 그림
> - **최대(56장)**: `cust-salaryman-1.png` ~ `-4.png` 까지 → 외모마다 다른 그림
>
> 각 외모의 생김새 설명은 `src/data/looks.js`에 있습니다. 그대로 프롬프트에 붙이면 됩니다.
> 예) `cust-salaryman-3.png` = "말끔한 양복인데 손끝만 떨고 있다"
> → `neatly dressed office worker, composed posture but trembling fingertips`
>
> **먼저 유형별 14장**으로 시작하고, 마음에 들면 변형을 늘리시는 걸 권합니다.

| 파일명 | 손님 | 프롬프트 핵심 |
|---|---|---|
| `cust-salaryman.png` | 급전이 필요한 회사원 | anxious office worker, loosened tie, sweating, desperate |
| `cust-collector.png` | 깐깐한 수집가 | fussy collector, round glasses, scrutinizing, well-dressed |
| `cust-swindler.png` | 수상한 사기꾼 | shifty conman, smug grin, flashy cheap suit |
| `cust-estate-cleaner.png` | 유품 정리인 | somber estate cleaner, work gloves, respectful posture |
| `cust-student.png` | 등록금이 급한 학생 | broke university student, backpack, worried |
| `cust-retired-dealer.png` | 은퇴한 골동품상 | retired antique dealer, elderly, knowing eyes |
| `cust-gambler.png` | 한탕 노리는 도박꾼 | reckless gambler, gold chain, jittery energy |
| `cust-housewife.png` | 장롱 정리하던 주부 | middle-aged housewife, permed hair, apron, curious |
| `cust-fallen-noble.png` | 몰락한 귀족 후예 | fallen aristocrat, threadbare formal coat, proud but ashamed |
| `cust-broker.png` | 전당포 브로커 | pawn broker middleman, slick, briefcase |
| `cust-auctioneer.png` | 골동품 경매사 | antique auctioneer, gavel, theatrical confidence |
| `cust-smuggler.png` | 뒷골목 밀수업자 | back-alley smuggler, cap pulled low, wary glance |
| `cust-curator.png` | 박물관 큐레이터 | museum curator, thick glasses, cotton gloves, precise |
| `cust-fallen-heir.png` | 몰락한 재벌 2세 | fallen chaebol heir, designer sunglasses, arrogant but broke |

### 🥊 fighters (12명)

**공통**: `underground fighter, full body fighting stance, neon-lit arena, gritty, dynamic pose`

| 파일명 | 파이터 | 프롬프트 핵심 |
|---|---|---|
| `fighter-bear.png` | 불곰 강대호 | huge burly brawler, bear-like, brown, heavy fists |
| `fighter-viper.png` | 독사 백사연 | lean fast striker, snake tattoo, green accents |
| `fighter-hammer.png` | 망치 오철근 | thick-armed slugger, hammer motif, grey steel tones |
| `fighter-shadow.png` | 그림자 신무영 | ninja-like agile fighter, dark hood, shadow motif |
| `fighter-tank.png` | 탱크 방태산 | massive defensive wall of a man, shield motif, olive |
| `fighter-lightning.png` | 번개 전광석 | blindingly fast fighter, lightning motif, yellow |
| `fighter-scorpion.png` | 전갈 황독침 | wiry counter-striker, scorpion tail motif, burnt orange |
| `fighter-wolf.png` | 늑대 서리한 | balanced feral fighter, wolf motif, steel blue |
| `fighter-ogre.png` | 도깨비 곽두팔 | monstrous slow powerhouse, korean dokkaebi motif, red |
| `fighter-falcon.png` | 매 차성준 | aerial fast attacker, falcon motif, purple |
| `fighter-boar.png` | 멧돼지 노강돌 | charging bruiser, boar motif, earth brown |
| `fighter-joker.png` | 조커 한무패 | unpredictable trickster, harlequin motif, magenta |

---

## 5. 확인하는 법

1. `npm run dev` (또는 이 대화에서 띄우는 서버)
2. 그림을 폴더에 넣고 **새로고침**
3. 브라우저 콘솔에 404가 뜨면 → 파일명 오타입니다 (게임은 안 깨지고 폴백으로 돌아갑니다)

**동작 원리** (`src/systems/art.js`)
- `artHTML(kind, name, fallback)` 이 `<img>` + 폴백을 함께 렌더
- 로드 성공 → 폴백 숨김 / 실패 → `<img>` 제거하고 폴백만 남김
- 한 번 실패한 그림은 캐시해서 재요청하지 않음

새 아이템·손님을 추가하면 `art.js`의 `ART_SLUGS`에 한 줄 추가하세요.

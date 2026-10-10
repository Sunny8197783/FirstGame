// [아트 생성] 슬러그 → 프롬프트 매니페스트 (게임 모듈과 독립 — Node 단독 실행용).
// gen-art.mjs가 이 데이터로 이미지 API를 호출한다. 프롬프트를 다듬고 싶으면 여기만 고치면 된다.
// 슬러그는 src/systems/art.js의 ART_SLUGS(+ masterworks)와 일치해야 게임이 그림을 찾는다.

// 모든 프롬프트 앞에 붙는 공통 화풍. "지브리+디즈니풍"을 노리되 이 게임의 톤을 유지한다.
// ⚠️ 실제 캐릭터/브랜드(토토로·미키마우스 등)는 넣지 말 것 — 화풍만.
export const STYLE = [
  'hand-painted 2D animation still, warm cel-shaded lighting, soft painterly textures',
  'storybook illustration, expressive clean silhouette, high detail, centered composition',
  '1980s-90s Korean back-alley pawn shop mood, amber gold and deep teal palette',
  'no text, no watermark, no signature, not a 3d render, not a photograph',
].join(', ');

// [PixelLab] 픽셀아트 제공자용 화풍 — painterly STYLE 대신 이걸 쓴다. 게임의 도트 정체성과 맞춘다.
export const PIXEL_STYLE = 'high quality detailed pixel art, crisp clean pixels, limited palette, subtle dithering, dark outline, centered';
export const PIXEL_KIND_SUFFIX = {
  items:     'single antique object icon, transparent background',
  customers: 'character bust portrait, facing viewer, korean person, transparent background',
  fighters:  'full body fighter in fighting stance, transparent background',
  scenes:    'wide background scene, atmospheric',
};

// 종류별 꼬리말 (구도·배경)
export const KIND_SUFFIX = {
  items:     'single antique object, plain soft studio background, product illustration, subtle rim light',
  customers: 'upper body character portrait, neutral calm expression, facing the viewer, korean person',
  fighters:  'full body character, dynamic fighting stance, gritty neon-lit underground arena',
  scenes:    'wide cinematic background illustration, atmospheric depth',
};

// slug → 프롬프트 핵심(구체 묘사). STYLE + KIND_SUFFIX가 자동으로 감싼다.
export const PROMPTS = {
  items: {
    // ── 1막 18종 ──
    'pocket-watch': 'ornate swiss mechanical pocket watch, open case showing brass gears, worn gold',
    'diamond-ring': '18k gold ring with a single brilliant diamond, prong setting, slight wear',
    'rangefinder-camera': 'vintage german rangefinder camera, chrome and black leather, 1950s',
    'goryeo-celadon': 'korean goryeo celadon vase, jade-green glaze, inlaid crane and cloud motif',
    'impressionist-painting': 'small impressionist landscape oil painting in an ornate gilded frame',
    'music-box': 'swiss cylinder music box, open wooden case with brass comb and pins',
    'fountain-pen': 'luxury fountain pen with a 14k gold nib, dark marbled resin barrel',
    'silver-candelabra': 'victorian silver candelabra, tarnished, ornate scrollwork, three arms',
    'leather-jacket': '1970s black leather biker jacket, worn creases, silver zippers',
    'violin': 'old italian violin, warm amber varnish, f-holes, paper label visible inside',
    'stamp-album': 'open vintage stamp album, colorful commemorative postage stamps in rows',
    'whisky-bottle': '1960s single malt whisky bottle, aged paper label, amber liquid, wax seal',
    'chronograph-watch': 'swiss chronograph wristwatch, polished steel case, subdials, leather strap',
    'diamond-necklace': 'diamond necklace with a large centre stone, platinum chain, sparkling',
    'gilt-buddha': 'small gilt-bronze korean buddha statue, serene face, seated on a lotus base',
    'tube-radio': '1940s wooden tube radio, fabric speaker grille, warm glowing dial',
    'gold-toad': 'solid gold toad figurine, glossy, korean lucky charm, sitting',
    'joseon-sword': 'joseon dynasty single-edged sword, lacquered scabbard, brass fittings',
    // ── 2막 6종 ──
    'knight-helmet': 'medieval knight great helm, hammered steel, rivets, aged patina',
    'ming-porcelain': 'ming dynasty blue-and-white porcelain vase, cobalt dragon painting',
    'artdeco-chandelier': 'art deco chandelier, brass frame, faceted crystal drops, 1920s',
    'najeon-sutra-box': 'korean lacquered sutra box, iridescent mother-of-pearl inlay',
    'katana': 'edo period katana, visible wavy hamon temper line, wrapped handle, black scabbard',
    'roman-coins': 'a stack of ancient roman gold aurei coins, emperor profile, worn edges',
    // ── 3막·시즌 16종 ──
    'royal-seal': 'joseon royal seal, gilt turtle-shaped handle, engraved seal face',
    'meteorite': 'iron meteorite fragment, dark fusion crust, pitted surface, heavy',
    'najeon-vanity': 'korean mother-of-pearl inlaid vanity table with a small mirror',
    'antique-cabinet': 'joseon wooden document cabinet, brass fittings, aged wood grain',
    'ikseongwan-crown': "joseon king's black silk crown with two upward wings",
    'dragon-insignia': 'royal dragon embroidery badge, gold thread on deep red silk',
    'silver-dagger': 'ornate korean silver ornamental dagger with cloisonne enamel inlay',
    'bronze-censer': 'bronze three-legged incense burner, deep green patina, ritual form',
    'general-armor': "korean general's brigandine armor, studded metal plates, leather straps",
    'horn-bow': 'korean traditional recurved horn bow, strung, water-buffalo horn',
    'hand-cannon': 'joseon bronze hand cannon, inscribed barrel, aged bronze',
    'war-banner': "general's war banner, embroidered emblem, weathered silk, wooden pole",
    'jeweled-egg': 'faberge-style jeweled enamel egg that opens to a tiny miniature inside',
    'coin-chest': 'wooden treasure chest overflowing with gold coins, salt-stained wood',
    'coral-crown': 'red coral crown, delicate branching coral, gold band',
    'first-edition-book': 'ancient korean woodblock-printed book, hanji paper, worn cover',
    // ── 🎖️ 명품 6종 ──
    'mw-repeater-watch': 'exquisite minute-repeater pocket watch with a moonphase dial, museum-grade masterpiece, glowing gold',
    'mw-ruby-necklace': 'pigeon-blood red ruby necklace, unheated natural rubies, intense red glow, masterpiece',
    'mw-ru-ware': 'northern song ru ware dish, rare sky-blue glaze with crackle, priceless ceramic masterpiece',
    'mw-landscape-painting': 'masterwork korean true-view landscape ink painting, powerful brushwork, red seal, museum piece',
    'mw-royal-sword': "royal ceremonial sword with folded-steel pattern blade and cloisonne gold fittings, regal masterpiece",
    'mw-master-cello': '17th century master-luthier cello, deep amber varnish, straight spruce grain, priceless instrument',
  },

  customers: {
    'cust-salaryman': 'anxious office worker, loosened tie, sweating, desperate look',
    'cust-collector': 'fussy antique collector, round gold glasses, scrutinizing, well-dressed',
    'cust-swindler': 'shifty con man, smug grin, flashy cheap suit, gold chain',
    'cust-estate-cleaner': 'somber estate cleaner in dark clothes, work gloves, respectful posture',
    'cust-student': 'broke university student, backpack, worried, plain clothes',
    'cust-retired-dealer': 'retired antique dealer, elderly, fedora, knowing shrewd eyes',
    'cust-gambler': 'reckless gambler, gold jewelry, jittery restless energy, red eyes',
    'cust-housewife': 'middle-aged housewife, permed hair, apron, curious expression',
    'cust-fallen-noble': 'fallen aristocrat in a threadbare formal coat, proud but ashamed',
    'cust-broker': 'slick pawn broker middleman, briefcase, calculating',
    'cust-auctioneer': 'theatrical antique auctioneer holding a gavel, confident',
    'cust-smuggler': 'wary back-alley smuggler, cap pulled low, cautious glance',
    'cust-curator': 'museum curator, thick glasses, white cotton gloves, precise',
    'cust-fallen-heir': 'fallen chaebol heir, designer sunglasses, arrogant but broke',
    // ── 외모 변형 2~4번 (src/data/looks.js 묘사와 1:1). 1번 외모 = 위의 기본 초상 ──
    'cust-salaryman-2': 'exhausted office worker, frayed white shirt cuffs, dark circles under his eyes',
    'cust-salaryman-3': 'office worker in a neat sharp suit, composed face but trembling fingertips',
    'cust-salaryman-4': 'office worker clutching a briefcase to his chest, glancing anxiously at his wristwatch',
    'cust-collector-2': 'meticulous antique collector wearing white cotton gloves, tidy vest, prepared',
    'cust-collector-3': 'elderly white-haired collector, slicked-back hair, arms crossed, skeptical',
    'cust-collector-4': 'bearded collector stroking his beard, distrustful squint',
    'cust-swindler-2': 'shifty con man avoiding eye contact, fidgety hands, cheap leather jacket',
    'cust-swindler-3': 'overly friendly grinning con man, loud hawaiian shirt, too-familiar wave',
    'cust-swindler-4': 'smooth-talking hustler in a cowboy hat, wide fake smile, gold tooth',
    'cust-estate-cleaner-2': 'quiet estate cleaner holding a bundle wrapped in korean bojagi cloth, gentle sad eyes',
    'cust-estate-cleaner-3': 'grey-haired middle-aged man, estate cleaner holding work gloves in his hand, head slightly bowed, plain work vest, realistic proportions',
    'cust-estate-cleaner-4': 'grieving estate cleaner in black mourning clothes, melancholy, reluctant to let go',
    'cust-student-2': 'shy university student in a hoodie fiddling with the drawstrings, avoiding eye contact',
    'cust-student-3': 'korean high school student in school uniform with a worn-out padded jacket over it',
    'cust-student-4': 'savvy student with glasses holding a smartphone showing prices, determined look',
    'cust-retired-dealer-2': 'elderly antique dealer with a magnifying loupe hanging from his neck, knowing smile',
    'cust-retired-dealer-3': 'elderly grey-haired man, retired antique dealer wearing a traditional korean hanbok vest, well-groomed, calm smile',
    'cust-retired-dealer-4': 'elderly korean grandmother antique dealer, sharp experienced eyes, cardigan, dignified',
    'cust-gambler-2': 'bleary-eyed gambler with bloodshot eyes after an all-nighter, rumpled shirt, stubble',
    'cust-gambler-3': 'nervous gambler with an ink stamp on the back of his hand, tense grin',
    'cust-gambler-4': 'excited gambler in a flashy disco jacket, overconfident grin, holding playing cards',
    'cust-housewife-2': 'korean housewife carrying a shopping basket, cardigan, practical',
    'cust-housewife-3': 'middle-aged housewife wearing a headscarf and apron, holding a folded dust cloth, warm smile',
    'cust-housewife-4': 'red-haired cheerful auntie in home clothes blowing dust off an old object',
    'cust-fallen-noble-2': 'fallen aristocrat in a worn tuxedo with frayed sleeves but polished manner, proud posture',
    'cust-fallen-noble-3': 'fallen noble heir fiddling with a family crest signet ring, long hair, faded velvet jacket',
    'cust-fallen-noble-4': 'pale gaunt aristocrat with slicked hair and high collar, haughty, faded elegance',
    'cust-broker-2': 'slick broker holding out a business card, sharp suit, confident smirk',
    'cust-broker-3': 'calculating broker with a pocket calculator, rimless glasses, tie',
    'cust-broker-4': 'watchful broker in a trench coat and fedora, eyes scanning the room',
    'cust-auctioneer-2': 'female antique auctioneer in a tailored suit holding an auction catalog under her arm',
    'cust-auctioneer-3': 'theatrical auctioneer speaking into a microphone, bow tie, dramatic gesture',
    'cust-auctioneer-4': 'confident female auctioneer snapping her fingers, elegant blazer, sharp eyes',
    'cust-smuggler-2': 'silent smuggler dressed all in black, hood up, cautious eyes',
    'cust-smuggler-3': 'smuggler wearing a black face mask and beanie, suspicious glance',
    'cust-smuggler-4': 'weathered harbor smuggler in a navy dock worker jacket and captain cap',
    'cust-curator-2': 'precise female museum curator, neat bun hair, cardigan, careful hands',
    'cust-curator-3': 'curator holding tweezers, lab coat, magnifying glasses, scientific look',
    'cust-curator-4': 'professorial male curator in a tweed jacket, raising a finger while explaining',
    'cust-fallen-heir-2': 'fallen chaebol heir with perfectly styled hair but a wrinkled out-of-season designer coat',
    'cust-fallen-heir-3': 'fallen rich heir with hand on forehead, regretful, expensive but worn shirt',
    'cust-fallen-heir-4': 'arrogant fallen heir with dyed hair and chin raised, flashy leather jacket, broke',
  },

  scenes: {
    'pawnshop-day': 'cozy 1980s korean pawn shop interior seen from behind the counter, warm amber lamplight, wooden shelves crammed with antiques and clocks, dusty back-alley mood',
    'arena-night': 'underground fight club arena at night, empty boxing ring with red ropes, cheering silhouette crowd, hazy neon pink and cyan lights, smoky gritty basement',
    'vip-office': 'dim luxurious underground crime boss office, leather armchair behind a dark wooden desk, red lampshade glow, cigar smoke haze, gold trophies on shelves',
  },

  fighters: {
    'fighter-bear': 'huge burly brawler, bear-like build, brown tones, heavy fists',
    'fighter-viper': 'lean fast striker, snake tattoo, green accents, coiled pose',
    'fighter-hammer': 'thick-armed slugger, hammer motif, grey steel tones',
    'fighter-shadow': 'agile ninja-like fighter, dark hood, shadow motif',
    'fighter-tank': 'massive defensive wall of a man, shield motif, olive green',
    'fighter-lightning': 'blindingly fast fighter, lightning motif, electric yellow',
    'fighter-scorpion': 'wiry counter-striker, scorpion tail motif, burnt orange',
    'fighter-wolf': 'balanced feral fighter, wolf motif, steel blue',
    'fighter-ogre': 'monstrous slow powerhouse, korean dokkaebi ogre motif, deep red',
    'fighter-falcon': 'aerial fast attacker, falcon motif, purple tones',
    'fighter-boar': 'charging bruiser, wild boar motif, earth brown',
    'fighter-joker': 'unpredictable trickster fighter, harlequin motif, magenta',
  },
};

// [링 스프라이트] gen-sprites.mjs용 — 64px 옆모습 전신. 소품(방패·무기)은 몸을 가리고 애니가 깨져서 뺀다.
// 슬러그는 카드 초상(fighters)과 같고, 'player'는 스파링의 나.
export const SPRITE_PROMPTS = {
  'fighter-bear':      'huge burly bearded brawler, brown fur vest, brown pants, heavy fists',
  'fighter-viper':     'lean fast street fighter, green snake tattoos on arms, green sleeveless top, black pants',
  'fighter-hammer':    'thick-armed slugger, grey steel-colored work overalls, rolled sleeves, heavy fists',
  'fighter-shadow':    'agile fighter in a dark hooded ninja outfit, black mask, dark grey clothes',
  'fighter-tank':      'huge muscular bald street brawler, olive green tank top, dark cargo pants, taped fists',
  'fighter-lightning': 'slim fast boxer, spiky blond hair, electric yellow tracksuit',
  'fighter-scorpion':  'wiry counter-striker, burnt orange sleeveless gi, black headband',
  'fighter-wolf':      'balanced fighter with grey wolf-like messy hair, steel blue jacket, dark pants',
  'fighter-ogre':      'monstrous giant red-skinned brute with small horns, korean dokkaebi, loincloth',
  'fighter-falcon':    'nimble aerial fighter, purple vest, feathered hair, purple pants',
  'fighter-boar':      'stocky charging bruiser, shaved head, brown leather vest, earth brown pants',
  'fighter-joker':     'trickster fighter in a magenta and black harlequin outfit, painted face',
  'player':            'young korean pawnshop owner street fighter, short black hair, blue zip-up track jacket, jeans, wrapped fists',
};

// 전체 (kind, slug, prompt) 목록으로 펼친다
export function allAssets() {
  const out = [];
  for (const kind of Object.keys(PROMPTS)) {
    for (const [slug, core] of Object.entries(PROMPTS[kind])) {
      const suffix = KIND_SUFFIX[kind] || '';
      // core를 함께 노출 — PixelLab 제공자가 painterly STYLE 대신 PIXEL_STYLE로 다시 감싼다
      out.push({ kind, slug, core, prompt: `${core}. ${suffix}. ${STYLE}` });
    }
  }
  return out;
}

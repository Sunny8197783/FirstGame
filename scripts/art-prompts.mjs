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

// 전체 (kind, slug, prompt) 목록으로 펼친다
export function allAssets() {
  const out = [];
  for (const kind of Object.keys(PROMPTS)) {
    for (const [slug, core] of Object.entries(PROMPTS[kind])) {
      const suffix = KIND_SUFFIX[kind] || '';
      out.push({ kind, slug, prompt: `${core}. ${suffix}. ${STYLE}` });
    }
  }
  return out;
}

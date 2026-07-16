// [Phase 1 신규] 저장 시스템 — localStorage 자동/수동 저장 + JSON 내보내기/가져오기
// 저장 시점은 두 곳뿐이다:
//   'morning' : 매일 아침 beginDay() 진입 직후 자동 (이벤트·손님 생성 전 → 이어하기 시 아침부터 재개)
//   'dawn'    : 새벽 암시장의 수동 저장 버튼 (이어하기 시 새벽 암시장부터 재개)
// 낮/밤 진행 중 상태(손님·경기·흥정)는 저장하지 않는다 — 세이브 데이터를 작고 견고하게 유지.

const SAVE_KEY = 'pawnshop_save_v1';
const SAVE_VERSION = 1;

function snapshotState(point) {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    point, // 'morning' | 'dawn'
    day: S.day,
    gold: S.gold,
    debt: S.debt,
    season: S.season || 0,     // [Phase3]
    prestige: S.prestige || 0, // [Phase3]
    endingId: S.endingId || null,
    upgrades: { ...S.upgrades },
    regularDeals: { ...S.regularDeals },
    sponsorIdx: S.sponsorIdx === undefined ? null : S.sponsorIdx,
    player: { ...S.player },
    stats: { ...S.stats },
    fighters: S.fighters.map(f => ({ ...f })),
    history: (S.history || []).map(h => ({ ...h })), // [Phase2] 통계 추이
  };
}

function saveGame(point) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotState(point)));
    return true;
  } catch (e) {
    return false;
  }
}

function loadSaveData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.version !== SAVE_VERSION || !d.day || !Array.isArray(d.fighters)) return null;
    return d;
  } catch (e) {
    return null;
  }
}

function hasSave() { return !!loadSaveData(); }

function deleteSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
}

// 이어하기: 스냅샷을 S에 복원하고 저장 시점(아침/새벽)에서 재개
function continueGame() {
  const d = loadSaveData();
  if (!d) return false;
  S.day = d.day;
  S.gold = d.gold;
  S.debt = d.debt;
  S.season = d.season || 0;     // [Phase3]
  S.prestige = d.prestige || 0; // [Phase3]
  S.endingId = d.endingId || null;
  S.upgrades = d.upgrades || {};
  S.regularDeals = d.regularDeals || {};
  S.sponsorIdx = d.sponsorIdx === undefined ? null : d.sponsorIdx;
  S.sponsorOffersDay = 0; // 후원 후보는 재추첨
  S.challengeOfferDay = 0;
  S.player = d.player;
  S.stats = d.stats;
  // [Phase2] 구버전 세이브 호환: 새 카운터 필드 기본값 보충
  const defaults = { dealStreak: 0, stolenSold: 0, clashWins: 0, feintStreak: 0, trapProfits: 0, betToday: false, noBetRun: 0 };
  for (const k in defaults) if (S.stats[k] === undefined) S.stats[k] = defaults[k];
  S.fighters = d.fighters;
  S.history = d.history || []; // [Phase2] 통계 추이
  // 진행 중이던 휘발 상태는 초기화
  S.challenge = null; S.haggle = null; S.currentBet = null;
  S.customers = []; S.custIdx = 0; S.purchases = [];
  S.matches = []; S.matchIdx = 0;
  S.event = null; S._afterInterlude = null;
  if (d.point === 'dawn') {
    S.phase = 'dawn';
    setTheme('night');
    renderDawnShop();
  } else {
    S.phase = 'day';
    setTheme('day');
    beginDay(); // 아침 루틴부터 재개 (이자·이벤트·손님은 새로 굴린다)
  }
  return true;
}

// JSON 파일로 내보내기 (세이브 유실 대비 백업)
function exportSave() {
  const d = loadSaveData();
  if (!d) { toast('내보낼 저장 데이터가 없다'); return; }
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `idlepawnshop_save_day${d.day}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('세이브 파일을 내보냈다 💾');
}

// JSON 파일 가져오기 (타이틀의 숨은 file input에서 호출)
function importSaveFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(String(reader.result));
      if (!d || d.version !== SAVE_VERSION || !d.day || !Array.isArray(d.fighters)) {
        toast('세이브 파일 형식이 올바르지 않다 ⚠️');
        return;
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      toast(`가져오기 완료 — ${d.day}일차 세이브 ✔`);
      renderTitle();
    } catch (e) {
      toast('세이브 파일을 읽을 수 없다 ⚠️');
    }
  };
  reader.readAsText(file);
}

Object.assign(globalThis, {
  saveGame, loadSaveData, hasSave, deleteSave, continueGame, exportSave, importSaveFile,
});
export { saveGame, loadSaveData, hasSave, deleteSave, continueGame, exportSave, importSaveFile };

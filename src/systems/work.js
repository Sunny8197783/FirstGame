// [신규] 💪 알바 — 완전히 망했을 때의 회생 경로.
// 설계 원칙:
//   ① 확정 수익이다 — 전부 놓쳐도 WORK_BASE는 번다 (바닥을 뚫고 내려가지 않는다)
//   ② 전당포·격투장보다 명백히 못 벌어야 한다 — 여유가 있으면 알바는 손해 (최적해가 되면 안 됨)
//   ③ '방치 보상 = 0'은 그대로다 — 가만히 있으면 0G. 직접 타이밍을 맞춰야 벌린다
//   ④ 대가가 있다 — 가게를 닫으므로 그날 손님·매입이 통째로 날아간다

const WORK_JOBS = [
  { id: 'dishes', emoji: '🍽️', name: '밥집 접시 닦기',
    place: '골목 끝 백반집', verb: '접시를 문지른다',
    intro: '"주방 보조 급구"라고 써 붙인 백반집. 사장이 팔을 걷어붙이라며 고무장갑을 던진다.',
    tip: '기름때가 가장 잘 벗겨지는 순간이 있다 — 그때 힘을 줘라.' },
  { id: 'floor', emoji: '🧹', name: '당구장 바닥 청소',
    place: '2층 당구장', verb: '밀대를 민다',
    intro: '담배 연기가 밴 당구장. 주인이 "구석까지 싹 밀면 일당 쳐준다"며 밀대를 건넨다.',
    tip: '밀대는 리듬이다. 왕복의 끝에서 힘을 줘야 때가 진다.' },
  { id: 'carry', emoji: '📦', name: '시장 짐 나르기',
    place: '새벽 청과 시장', verb: '짐을 싣는다',
    intro: '트럭이 줄지어 선 시장통. 반장이 "허리 조심하고, 박자만 맞춰"라며 목장갑을 준다.',
    tip: '들어 올리는 타이밍이 어긋나면 허리만 나간다.' },
];

// 성과 판정 — 순수 함수 (마커 위치 pos와 목표 target은 0~100)
function workScore(pos, target) {
  const d = Math.abs(pos - target);
  if (d <= CONFIG.WORK_PERFECT_W) return 'perfect';
  if (d <= CONFIG.WORK_HIT_W) return 'hit';
  return 'miss';
}

function workPayOf(hits, perfects) {
  const raw = CONFIG.WORK_BASE + hits * CONFIG.WORK_PAY_HIT + perfects * CONFIG.WORK_PAY_PERFECT;
  return Math.min(raw, CONFIG.WORK_MAX);
}

// 아침 선택지 — 자금이 마른 날에만 뜬다
function offerWork(next) {
  if (S.gold >= CONFIG.WORK_OFFER_GOLD || S.season > 0) { next(); return; }
  S._afterWorkSkip = next;
  const job = pick(WORK_JOBS);
  S.workJob = job;
  showModal(`
    <h2 class="bad">💸 주머니가 비었다</h2>
    <p>보유 골드 <b class="bad">${fmt(S.gold)} G</b> — 이 돈으로는 쓸 만한 물건을 잡기 어렵다.</p>
    <p style="font-size:14px">${job.emoji} <b>${job.place}</b>에서 사람을 구한다는 얘기를 들었다.
      하루 몸을 쓰면 <b class="good">확정 수익</b>이 들어온다 —
      대신 <b>오늘 가게는 못 연다</b>(손님·매입 없음).</p>
    <table style="margin:10px 0; font-size:13px">
      <tr><td>기본 일당 (성과 무관)</td><td class="good">${fmt(CONFIG.WORK_BASE)} G</td></tr>
      <tr><td>열심히 하면 최대</td><td class="good">${fmt(CONFIG.WORK_MAX)} G</td></tr>
      <tr><td class="dim">전당포에서 잘 풀린 하루</td><td class="dim">이보다 훨씬 위</td></tr>
    </table>
    <div class="center" style="margin-top:10px">
      <button class="btn-big" onclick="startWork()">${job.emoji} 일하러 간다</button>
      <button class="btn-ghost" onclick="skipWork()">그래도 가게를 연다</button>
    </div>`);
}

function skipWork() {
  sndClick();
  hideModal();
  const next = S._afterWorkSkip;
  S._afterWorkSkip = null;
  if (next) next();
}

function startWork() {
  sndClick();
  hideModal();
  S._afterWorkSkip = null;
  S.work = { round: 0, hits: 0, perfects: 0, target: 50, pos: 0, t0: 0, stamped: false };
  S.phase = 'work'; S.timeLabel = '오전 9:00';
  setTheme('day'); updateHUD();
  showTransition(
    `<div>${S.workJob.emoji}</div><div>${S.workJob.name}</div>` +
    `<div style="font-size:15px;opacity:0.75;max-width:520px">${S.workJob.intro}</div>`,
    renderWork, 1800);
}

function renderWork() {
  const job = S.workJob, W = S.work;
  $('screen').innerHTML = `
    <div class="scene scene-work">
      <div class="panel center" style="max-width:640px; margin:0 auto">
        <h2>${job.emoji} ${job.name}</h2>
        <p class="dim" style="font-size:13px">${job.tip}</p>
        <p style="margin-top:10px">일감 <b class="accent" id="work-round">${W.round + 1}</b> / ${CONFIG.WORK_ROUNDS}
          · 번 돈 <b class="good" id="work-pay">${fmt(workPayOf(W.hits, W.perfects))} G</b></p>
        <div class="work-bar" id="work-bar">
          <div class="work-zone" id="work-zone"></div>
          <div class="work-core" id="work-core"></div>
          <div class="work-marker" id="work-marker"></div>
        </div>
        <button class="btn-big" id="work-btn" style="width:220px; margin-top:12px" onclick="workStamp()">
          지금! <span class="menu-sub">SPACE 또는 클릭</span>
        </button>
        <div id="work-log" class="fightlog" style="min-height:80px; max-height:110px; margin-top:12px"></div>
        <p class="dim" style="font-size:11px; margin-top:6px">
          가만히 있으면 한 푼도 못 번다. 초록 구간에서 눌러라 — 한가운데면 더 쳐준다.</p>
      </div>
    </div>`;
  workNextRound();
}

function workNextRound() {
  const W = S.work;
  if (!W) return;
  W.stamped = false;
  W.target = randInt(18, 82);
  W.t0 = performance.now();
  const zone = $('work-zone'), core = $('work-core');
  if (zone) { zone.style.left = (W.target - CONFIG.WORK_HIT_W) + '%'; zone.style.width = (CONFIG.WORK_HIT_W * 2) + '%'; }
  if (core) { core.style.left = (W.target - CONFIG.WORK_PERFECT_W) + '%'; core.style.width = (CONFIG.WORK_PERFECT_W * 2) + '%'; }
  const btn = $('work-btn');
  if (btn) btn.disabled = false;
  workTick();
}

let workRAF = 0;
function workTick() {
  const W = S.work;
  if (!W || W.stamped) return;
  const marker = $('work-marker');
  if (!marker) return;
  // 좌우 왕복 (삼각파) — 등속이라 눈으로 타이밍을 읽을 수 있다
  const t = ((performance.now() - W.t0) % CONFIG.WORK_SWEEP_MS) / CONFIG.WORK_SWEEP_MS;
  W.pos = t < 0.5 ? t * 200 : (1 - t) * 200;
  marker.style.left = W.pos + '%';
  workRAF = requestAnimationFrame(workTick);
}

function workStamp() {
  const W = S.work;
  if (!W || W.stamped) return;
  W.stamped = true;
  if (workRAF) { cancelAnimationFrame(workRAF); workRAF = 0; }
  const btn = $('work-btn');
  if (btn) btn.disabled = true;

  const res = workScore(W.pos, W.target);
  const log = $('work-log');
  if (res === 'perfect') {
    W.perfects++; sndGood();
    if (log) log.innerHTML += `<div>✨ <b class="good">정확하다!</b> ${S.workJob.verb} — <b>+${fmt(CONFIG.WORK_PAY_PERFECT)} G</b></div>`;
  } else if (res === 'hit') {
    W.hits++; sndCoin();
    if (log) log.innerHTML += `<div>👍 <b>좋다.</b> ${S.workJob.verb} — +${fmt(CONFIG.WORK_PAY_HIT)} G</div>`;
  } else {
    sndBad();
    if (log) log.innerHTML += `<div class="dim">💦 헛손질. 이번 건 공쳤다.</div>`;
  }
  if (log) log.scrollTop = log.scrollHeight;
  const payEl = $('work-pay');
  if (payEl) payEl.textContent = fmt(workPayOf(W.hits, W.perfects)) + ' G';

  W.round++;
  const roundEl = $('work-round');
  if (roundEl) roundEl.textContent = Math.min(W.round + 1, CONFIG.WORK_ROUNDS);
  if (W.round >= CONFIG.WORK_ROUNDS) { setTimeout(endWork, 700 / gameSpeed()); return; }
  setTimeout(workNextRound, 550 / gameSpeed());
}

function endWork() {
  const W = S.work, job = S.workJob;
  if (!W) return;
  const pay = workPayOf(W.hits, W.perfects);
  S.gold += pay;
  S.stats.workDays = (S.stats.workDays || 0) + 1;
  S.stats.workEarned = (S.stats.workEarned || 0) + pay;
  if (S.stats.workDays >= 3) achieve('work-3');
  S.work = null;
  updateHUD();
  sndLevelUp();
  const capped = CONFIG.WORK_BASE + W.hits * CONFIG.WORK_PAY_HIT + W.perfects * CONFIG.WORK_PAY_PERFECT > CONFIG.WORK_MAX;
  showModal(`
    <h2 class="good">${job.emoji} 하루 일당</h2>
    <p>${job.place}에서 하루를 꼬박 보냈다. 허리가 뻐근하다.</p>
    <table style="margin:10px 0">
      <tr><td>기본 일당</td><td>+${fmt(CONFIG.WORK_BASE)} G</td></tr>
      <tr><td>성공 ${W.hits}회</td><td>+${fmt(W.hits * CONFIG.WORK_PAY_HIT)} G</td></tr>
      <tr><td>✨ 정확 ${W.perfects}회</td><td class="accent">+${fmt(W.perfects * CONFIG.WORK_PAY_PERFECT)} G</td></tr>
      ${capped ? `<tr><td class="dim">일당 상한</td><td class="dim">${fmt(CONFIG.WORK_MAX)} G까지</td></tr>` : ''}
      <tr><td><b>오늘 번 돈</b></td><td>${plHTML(pay, ' G', { big: true })}</td></tr>
    </table>
    <p class="dim" style="font-size:13px">몸으로 번 돈은 정직하다 — 하지만 이걸로는 김사장을 못 이긴다.
      물건 보는 눈이 진짜 돈이다.</p>
    <div class="center"><button class="btn-big" onclick="afterWork()">🌙 밤이 온다</button></div>`);
}

// 알바한 날은 낮 장사를 통째로 건너뛰고 바로 저녁 정산(매입 없음) → 밤으로 간다
function afterWork() {
  hideModal();
  S.purchases = [];
  renderEvening();
}

Object.assign(globalThis, {
  WORK_JOBS, workScore, workPayOf, offerWork, skipWork, startWork,
  renderWork, workNextRound, workTick, workStamp, endWork, afterWork,
});
export { WORK_JOBS, workScore, workPayOf, offerWork, startWork, workStamp, endWork, afterWork };

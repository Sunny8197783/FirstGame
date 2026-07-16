// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function startNight() {
  sndClick();
  setBgm('night'); // [Phase4] 밤 BGM(신스)
  S.phase = 'night'; S.matchIdx = 0; S.timeLabel = '오후 11:30';
  S.matches = genMatches((S.event && S.event.nightMatches) || CONFIG.MATCHES_PER_NIGHT);
  setTheme('night'); updateHUD();
  const evLine = S.event && (S.event.nightMatches || S.event.betCap)
    ? `<div style="font-size:15px; color:#ff44aa; margin-top:4px">${S.event.name} — ${S.event.desc}</div>` : '';
  showTransition('<div>🌙</div><div class="blink" style="color:#ff44aa">지하 격투장</div><div style="font-size:16px;opacity:0.7">쇠 냄새와 함성이 뒤섞인 계단을 내려간다...</div>' + evLine, renderMatch, 1400);
}


function winRate(f) { return (f.w + f.l) === 0 ? 0.5 : f.w / (f.w + f.l); }
// 링 이펙트 헬퍼 (경기 연출·직접 출전 공용)

function betCapRate() {
  const m = S.matches && S.matches[S.matchIdx];
  if (m && m.final) return 1; // 👑 그랜드 파이널: 베팅 상한 해제
  return (S.event && S.event.betCap) || CONFIG.BET_MAX_RATE;
}

function partBonusMul() { return 1 + Math.min(S.stats.drops, CONFIG.PART_BONUS_CAP) * CONFIG.PART_PAYOUT_BONUS; }


function genMatches(count) {
  const order = shuffle(S.fighters.map((_, i) => i));
  const matches = [];
  const makeMatch = (ia, ib) => {
    const A = S.fighters[ia], B = S.fighters[ib];
    const sumA = A.atk + A.def + A.spd, sumB = B.atk + B.def + B.spd;
    // 하우스 추정 = 스탯 비율 + 전적 보정 (최대 ±10%p) — 소문은 모른다
    let est = sumA / (sumA + sumB) + (winRate(A) - winRate(B)) * CONFIG.RECORD_ADJ_MAX;
    est = clamp(est, CONFIG.HOUSE_EST_MIN, CONFIG.HOUSE_EST_MAX);
    const oddsA = (1 / est) * (1 - CONFIG.HOUSE_MARGIN);
    const oddsB = (1 / (1 - est)) * (1 - CONFIG.HOUSE_MARGIN);
    // 컨디션 소문 — 실제 승률에만 반영 (하우스는 모른다).
    // 실제 정황(테마)이 있으면 그 테마의 소문 1~2개가 진짜로 돌고, 헛소문은 다른 테마에서 섞인다.
    const fakeFrom = (theme) => {
      const weakPool = theme.rumors.filter(r => r.strength === 'weak');
      const src = (weakPool.length && Math.random() < CONFIG.RUMOR_FAKE_WEAK_BIAS) ? pick(weakPool) : pick(theme.rumors);
      return { text: src.text, strength: src.strength, icon: theme.icon, themeId: theme.id, sign: theme.sign, fake: true, effect: 0 };
    };
    const genRumors = () => {
      const out = [];
      if (Math.random() < CONFIG.RUMOR_COND_RATE) {
        // 실제 정황이 있다: 진짜 소문 1~2개 (같은 테마 = 상호 검증 가능)
        // [Phase3] 찌라시(extraRumor) 이벤트: 확증 소문이 반드시 붙는다
        const theme = pick(RUMOR_THEMES);
        const nTrue = ((S.event && S.event.extraRumor) || Math.random() < CONFIG.RUMOR_SECOND_TRUE) ? 2 : 1;
        const picked = shuffle(theme.rumors).slice(0, nTrue);
        const mag = rand(theme.mag[0], theme.mag[1]) + (picked.length - 1) * CONFIG.RUMOR_CORROBORATION_BONUS;
        picked.forEach(src => out.push({
          text: src.text, strength: src.strength, icon: theme.icon, themeId: theme.id,
          sign: theme.sign, fake: false, effect: theme.sign * mag / picked.length,
        }));
        // [Phase3] 프레스티지: 험한 동네일수록 헛소문이 더 잘 낀다
        if (Math.random() < CONFIG.RUMOR_EXTRA_FAKE + (S.prestige || 0) * CONFIG.PRESTIGE_FAKE_ADD) {
          out.push(fakeFrom(pick(RUMOR_THEMES.filter(t => t.id !== theme.id))));
        }
      } else {
        // 정황 없음: 헛소문만 0~N개 (서로 모순될 수도 — 그것도 단서다)
        shuffle(RUMOR_THEMES).slice(0, randInt(0, CONFIG.RUMOR_NOISE_MAX)).forEach(t => out.push(fakeFrom(t)));
      }
      return shuffle(out);
    };
    const rumorsA = genRumors(), rumorsB = genRumors();
    // 🕵️ 정보원 (상시) 또는 [Phase3] 뒷골목 정보상(당일 이벤트): 경기당 소문 하나의 진위를 알려준다
    if (S.upgrades.informant || (S.event && S.event.oneVerify)) {
      const all = rumorsA.concat(rumorsB);
      if (all.length) pick(all).verified = true;
    }
    // 🤝 후원 계약: 후원 파이터의 소문은 전부 진위가 확인된다 (컨디션 직보)
    if (S.sponsorIdx === ia) rumorsA.forEach(r => { r.verified = true; });
    if (S.sponsorIdx === ib) rumorsB.forEach(r => { r.verified = true; });
    const effA = rumorsA.reduce((s, r) => s + r.effect, 0);
    const effB = rumorsB.reduce((s, r) => s + r.effect, 0);
    const pActual = clamp(est + effA - effB, CONFIG.WINPROB_MIN, CONFIG.WINPROB_MAX);
    return { ia, ib, est, oddsA, oddsB, rumorsA, rumorsB, pActual, done: false };
  };
  for (let m = 0; m < count; m++) {
    matches.push(makeMatch(order[m * 2], order[m * 2 + 1]));
  }
  // 👑 그랜드 파이널: 캠페인 21일차 밤 또는 시즌 마지막 밤 — 랭킹 1·2위 격돌, 베팅 상한 해제
  const finalNight = (S.season > 0) ? (seasonDayOf() === CONFIG.SEASON_LEN) : (S.day >= CONFIG.DAYS);
  if (finalNight && matches.length) {
    const ranked = S.fighters.map((_, i) => i)
      .sort((x, y) => winRate(S.fighters[y]) - winRate(S.fighters[x]) || S.fighters[y].w - S.fighters[x].w);
    matches[matches.length - 1] = { ...makeMatch(ranked[0], ranked[1]), final: true };
  }
  return matches;
}


function selectFighter(side) {
  sndClick();
  const m = S.matches[S.matchIdx];
  S.currentBet = { side };
  document.querySelectorAll('.fighter-card').forEach(el => el.classList.remove('selected'));
  $('fcard-' + side).classList.add('selected');
  const f = S.fighters[side === 'A' ? m.ia : m.ib];
  const odds = side === 'A' ? m.oddsA : m.oddsB;
  $('bet-pick').innerHTML = `선택: <b class="accent">${f.emoji} ${f.name}</b> (배당 ×${odds.toFixed(2)})`;
  $('btn-bet').disabled = false;
}


function setBet(rate) {
  sndClick();
  $('bet-amount').value = Math.floor(S.gold * Math.min(rate, betCapRate()) / 100) * 100;
}


function confirmBet() {
  const m = S.matches[S.matchIdx];
  if (!S.currentBet) return;
  const maxBet = Math.floor(S.gold * betCapRate());
  const amt = clamp(Math.round(+($('bet-amount').value) || 0), 0, maxBet);
  if (amt <= 0) { $('bet-pick').innerHTML = '<span class="bad">베팅액을 입력하라.</span>'; return; }
  sndClick();
  S.currentBet.amount = amt;
  S.gold -= amt;
  S.stats.betToday = true; // [Phase2] 금욕의 7일 판정용
  updateHUD();
  runFight();
}


function watchOnly() { sndClick(); S.currentBet = null; runFight(); }


function settleFight(m, aWins) {
  const A = S.fighters[m.ia], B = S.fighters[m.ib];
  const W = aWins ? A : B;
  let html = '';
  // 🤝 후원 지분: 후원 파이터가 이기면 베팅과 무관하게 수익
  if (S.sponsorIdx === (aWins ? m.ia : m.ib)) {
    S.gold += CONFIG.SPONSOR_WIN_CUT;
    S.stats.sponsorIncome += CONFIG.SPONSOR_WIN_CUT;
    html += `<p class="accent">🤝 후원 파이터 ${W.name} 승리! 지분 수익 +${fmt(CONFIG.SPONSOR_WIN_CUT)} G</p>`;
  }
  if (S.currentBet) {
    const bet = S.currentBet;
    const betOnA = bet.side === 'A';
    const won = betOnA === aWins;
    const odds = betOnA ? m.oddsA : m.oddsB;
    const estChosen = betOnA ? m.est : 1 - m.est;
    S.stats.bets++;
    S.stats.houseEstSum += estChosen;
    if (won) {
      const pMul = partBonusMul();
      const payout = Math.floor(bet.amount * odds * pMul);
      S.gold += payout;
      const pl = payout - bet.amount;
      S.stats.betWins++; S.stats.betPL += pl;
      sndBetWin(); // [Phase4] 베팅 적중 코인+팡파레
      html += `<p class="good big">🎉 적중! +${fmt(payout)} G (순익 +${fmt(pl)} G)</p>`;
      if (pMul > 1) html += `<p class="dim" style="font-size:13px">✦ 부품 인맥 보너스 +${Math.round((pMul - 1) * 100)}% 포함</p>`;
      // [Phase2] 업적 훅: 첫 적중·언더독·판단 우위·모순 간파·올인 파이널
      achieve('bet-first-win');
      if (estChosen <= 0.35) achieve('underdog');
      if (S.stats.bets >= 10 && (S.stats.betWins / S.stats.bets - S.stats.houseEstSum / S.stats.bets) >= 0.10) achieve('edge-10');
      const clash = [m.rumorsA, m.rumorsB].some(rs => rs.some(r => r.sign > 0) && rs.some(r => r.sign < 0));
      if (clash) { S.stats.clashWins = (S.stats.clashWins || 0) + 1; if (S.stats.clashWins >= 5) achieve('clash-5'); }
      const goldBeforeBet = S.gold - payout + bet.amount;
      if (m.final && bet.amount >= goldBeforeBet * 0.5) achieve('allin-final');
      // 희귀 드롭: 언더독 적중일수록 확률 상승
      const dropP = CONFIG.DROP_BASE * (1 + (1 - estChosen) * CONFIG.DROP_UNDERDOG_COEF);
      if (Math.random() < dropP) {
        S.stats.drops++;
        sndDrop();
        achieve('drop-1'); // [Phase2]
        html += `<p class="drop-fx blink">✦ 전설 부품 획득! (보유 ${S.stats.drops}개)</p>
                 <p class="dim">쓰러진 파이터의 주머니에서 굴러 나왔다... (드롭률 ${(dropP * 100).toFixed(1)}%)</p>`;
      }
    } else {
      S.stats.betPL -= bet.amount;
      sndBetLose(); // [Phase4] 베팅 빗나감 하강음
      html += `<p class="bad big">💸 빗나갔다... -${fmt(bet.amount)} G</p>`;
    }
  } else {
    html += `<p class="dim">관망했다. 잃은 것도, 얻은 것도 없다.</p>`;
  }
  // 헛소문 공개 (학습 피드백)
  const fakes = [...m.rumorsA, ...m.rumorsB].filter(r => r.fake);
  if (fakes.length) {
    html += `<p class="dim" style="margin-top:6px">💡 헛소문이었다: ${fakes.map(r => `"${r.text}"`).join(' / ')}</p>`;
  }
  updateHUD();
  const isLast = S.matchIdx >= S.matches.length - 1;
  $('fight-after').innerHTML = html + `
    <button class="btn-big" onclick="nextMatch()">${isLast ? '🌃 밤을 마감한다' : '다음 경기 →'}</button>`;
}


function nextMatch() {
  sndClick();
  S.matchIdx++;
  if (S.matchIdx < S.matches.length) { renderMatch(); }
  else { renderChallengeOffer(); }
}

/* ═══════════════════════════════════════════════════════════════
   직접 출전 — 스파링 도전 (삼각 심리전: 러시 > 견제 > 카운터 > 러시)
   상대의 예비 동작(텔)을 읽어라. 단, 일부는 페인트다.
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { startNight, winRate, betCapRate, partBonusMul, genMatches, selectFighter, setBet, confirmBet, watchOnly, settleFight, nextMatch });
export { startNight, winRate, betCapRate, partBonusMul, genMatches, selectFighter, setBet, confirmBet, watchOnly, settleFight, nextMatch };

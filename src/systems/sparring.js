// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function proceedAfterChallenge() {
  sndClick();
  S.challenge = null;
  if (S.day >= CONFIG.DAYS) renderResult();
  else renderDawnShop();
}


function renderChallengeOffer() {
  S.phase = 'night'; updateHUD();
  if (S.challengeOfferDay !== S.day) {
    S.challengeOffers = shuffle(S.fighters.map((_, i) => i)).slice(0, 2);
    S.challengeOfferDay = S.day;
  }
  S.challengePick = null;
  const P = S.player;
  const maxStake = Math.floor(S.gold * CONFIG.CHALLENGE_STAKE_RATE / 100) * 100;
  const canFight = maxStake >= CONFIG.CHALLENGE_STAKE_MIN;
  $('screen').innerHTML = `
    <div class="scene scene-night">
      <div class="crowd"></div>
      <div class="neon neon-l"></div><div class="neon neon-r"></div>
      <div style="position:relative; z-index:2">
        <h2 class="center neon-pink" style="margin-top:4px">🥋 오늘 밤, 스파링 슬롯이 비었다</h2>
        <p class="center dim" style="font-size:14px">데스크: "직접 뛰어보겠나? 판돈은 이기면 <b>두 배</b>. 몸으로 갚는 거지."</p>
        <div class="night-grid" style="margin-top:10px">
          <div class="panel">
            <div class="center"><span class="pframe">${P.emoji}</span></div>
            <h3 class="center" style="font-size:15px; margin-top:4px">${P.name} (전당포 주인)</h3>
            <p class="center dim" style="font-size:12px">스파링 전적 ${P.w}승 ${P.l}패</p>
            <p style="font-size:13px; margin-top:4px">공격력 <span class="statbar">${statBar(P.atk)}</span> ${P.atk}<br>
               방어력 <span class="statbar">${statBar(P.def)}</span> ${P.def}<br>
               스피드 <span class="statbar">${statBar(P.spd)}</span> ${P.spd}</p>
            <p class="dim" style="font-size:12px; margin-top:6px">승리할 때마다 스탯 하나가 성장한다 (최대 ${CONFIG.PLAYER_GROWTH_CAP})</p>
          </div>
          <div class="panel center" style="align-self:center">
            <p class="big neon-pink">VS</p>
            <p class="dim" style="font-size:13px; margin-top:8px">⚔️ 심리전 규칙<br><b>러시</b>는 <b>견제</b>를 이기고,<br><b>견제</b>는 <b>카운터</b>를,<br><b>카운터</b>는 <b>러시</b>를 이긴다.</p>
            <p class="dim" style="font-size:12px; margin-top:8px">상대의 예비 동작을 읽어라 —<br>다만 ${Math.round((1 - CONFIG.TELL_TRUTH) * 100)}%는 페인트다.</p>
          </div>
          <div>
            ${S.challengeOffers.map(i => { const f = S.fighters[i]; return `
              <div class="panel chal-card" id="chal-${i}" onclick="selectChallengeOpp(${i})" style="margin:0 0 8px; padding:10px">
                <div class="row" style="gap:8px; align-items:center; flex-wrap:nowrap">
                  <span class="pframe" style="width:52px; height:52px; font-size:32px">${f.emoji}</span>
                  <div>
                    <p style="font-size:14px">${f.name}</p>
                    <p class="dim" style="font-size:12px">${f.w}승 ${f.l}패 · 공${f.atk}/방${f.def}/속${f.spd}</p>
                  </div>
                </div>
              </div>`; }).join('')}
            <p class="dim center" style="font-size:12px">↑ 상대를 선택하라</p>
          </div>
        </div>
        <div class="panel" style="margin-bottom:0">
          ${canFight ? `
          <div class="row" style="align-items:center">
            <span id="chal-pick" class="dim" style="font-size:14px">상대 미선택</span>
            <span style="flex:1"></span>
            <span style="font-size:14px">판돈:</span>
            <input type="number" id="chal-stake" min="${CONFIG.CHALLENGE_STAKE_MIN}" max="${maxStake}" step="100" value="${Math.min(1000, maxStake)}">
            <span>G</span>
            <button class="btn-ghost" onclick="$('chal-stake').value=${maxStake}">최대</button>
          </div>
          <p class="dim" style="font-size:12px">판돈 상한: 보유 골드의 ${Math.round(CONFIG.CHALLENGE_STAKE_RATE * 100)}% = ${fmt(maxStake)} G · 승리 시 판돈 ×${CONFIG.CHALLENGE_PAYOUT} + 부품 드롭 ${Math.round(CONFIG.CHALLENGE_DROP * 100)}%</p>
          <div class="center" style="margin-top:8px">
            <button class="btn-big btn-pink" id="btn-chal" onclick="startChallenge()" disabled>출전한다</button>
            <button class="btn-ghost" onclick="proceedAfterChallenge()">오늘은 관둔다 →</button>
          </div>`
          : `<p class="bad center">판돈 낼 골드도 없다... (최소 ${fmt(CONFIG.CHALLENGE_STAKE_MIN)} G)</p>
          <div class="center"><button class="btn-big" onclick="proceedAfterChallenge()">조용히 돌아간다 →</button></div>`}
        </div>
      </div>
    </div>`;
  updateDebug();
}


function selectChallengeOpp(i) {
  if (!$('chal-pick') || !$('btn-chal')) return; // 판돈 낼 골드가 없으면 선택 불가
  sndClick();
  S.challengePick = i;
  document.querySelectorAll('.chal-card').forEach(el => el.classList.remove('selected'));
  $('chal-' + i).classList.add('selected');
  const f = S.fighters[i];
  $('chal-pick').innerHTML = `상대: <b class="accent">${f.emoji} ${f.name}</b>`;
  $('btn-chal').disabled = false;
}


function rollOppMove(O) {
  return pickWeighted([
    { id: 'rush', w: O.atk }, { id: 'poke', w: O.spd }, { id: 'counter', w: O.def },
  ]).id;
}


function startChallenge() {
  if (S.challengePick === null) return;
  const maxStake = Math.floor(S.gold * CONFIG.CHALLENGE_STAKE_RATE / 100) * 100;
  const stake = clamp(Math.round(+($('chal-stake').value) || 0), CONFIG.CHALLENGE_STAKE_MIN, maxStake);
  if (stake > S.gold) return;
  sndClick();
  S.gold -= stake;
  S.challenge = { oppIdx: S.challengePick, stake, php: 100, ohp: 100, round: 1, log: [] };
  updateHUD();
  renderChallengeRound();
}


function renderChallengeRound() {
  const C = S.challenge, O = S.fighters[C.oppIdx], P = S.player;
  // 이번 라운드 상대 수 결정 + 텔 생성 (일부는 페인트)
  C.oppMove = rollOppMove(O);
  C.tellTruth = Math.random() < CONFIG.TELL_TRUTH;
  // 페인트는 함정: 보이는 수를 그대로 믿고 카운터치면 정확히 지는 수를 보여준다
  const shown = C.tellTruth ? C.oppMove : BEAT_OF[C.oppMove];
  C.tell = pick(TELLS[shown]);
  $('screen').innerHTML = `
    <div class="scene scene-night">
      <div class="crowd"></div>
      <div class="neon neon-l"></div><div class="neon neon-r"></div>
      <div style="position:relative; z-index:2">
        <div class="hp-row">
          <span style="font-size:13px">${P.emoji} 나</span>
          <div class="hpbar-wrap"><div class="hpbar cyan" id="hp-A" style="width:${C.php}%"></div></div>
          <span class="neon-pink" style="font-size:15px; white-space:nowrap">R${C.round}</span>
          <div class="hpbar-wrap"><div class="hpbar" id="hp-B" style="width:${C.ohp}%"></div></div>
          <span style="font-size:13px">${O.emoji}</span>
        </div>
        <div class="ring" id="arena">
          <div class="ring-ropes"><i></i><i></i><i></i></div>
          <div class="ring-floor"></div>
          ${rigHTML('A', PLAYER_COLOR, 'idle')}
          ${rigHTML('B', O.color, 'idle')}
        </div>
        <div class="panel" id="night-console" style="margin-bottom:0">
          <div class="tell-box">👁️ ${O.name}의 움직임 — ${C.tell}</div>
          ${C.log.length ? `<p class="dim" style="font-size:13px">${C.log[C.log.length - 1]}</p>` : ''}
          <div class="center" style="margin-top:8px" id="move-btns">
            <button class="move-btn" onclick="playerMove('rush')">👊 러시<small>견제를 이긴다</small></button>
            <button class="move-btn" onclick="playerMove('poke')">🦶 견제<small>카운터를 이긴다</small></button>
            <button class="move-btn" onclick="playerMove('counter')">🛡️ 카운터<small>러시를 이긴다</small></button>
          </div>
        </div>
      </div>
    </div>`;
  updateDebug();
}


function playerMove(mv) {
  const C = S.challenge; if (!C || C.resolving || C.php <= 0 || C.ohp <= 0) return;
  C.resolving = true;
  sndClick();
  const O = S.fighters[C.oppIdx], P = S.player;
  const om = C.oppMove;
  const dmgOf = (att, dfn) => clamp(18 + att.atk * 2 - dfn.def, 12, 34);
  // 심리전 수 → 실제 격투 기술 매핑 (강타 여부에 따라 도약기로 승격)
  const toFightMove = (key, big) => {
    const map = { rush: big ? 'flypunch' : 'punch', poke: big ? 'flykick' : 'kick', counter: 'throw' };
    return FIGHT_MOVES.find(f => f.id === map[key]);
  };
  let line;
  document.querySelectorAll('#move-btns button').forEach(b => b.disabled = true);
  if (mv === om) {
    // 동수 — 서로 정면으로 부딪히며 잔타 교환
    const d = randInt(6, 12);
    C.php = Math.max(0, C.php - d); C.ohp = Math.max(0, C.ohp - d);
    line = `⚔️ 둘 다 ${MOVES[mv].name}! 정면으로 부딪히며 서로 잔타를 주고받는다 (-${d} / -${d})`;
    playFightStep({ type: 'attack', att: 'A', def: 'B', dmg: d, heavy: false, mv: toFightMove(mv, false) });
    setTimeout(() => playFightStep({ type: 'attack', att: 'B', def: 'A', dmg: d, heavy: false, mv: toFightMove(om, false) }), 240);
  } else if (MOVES[mv].beats === om) {
    // 내가 이김
    const d = dmgOf(P, O);
    C.ohp = Math.max(0, C.ohp - d);
    line = `✅ ${MOVES[mv].name}(으)로 상대의 ${MOVES[om].name}을(를) 꺾었다! ${O.name}에게 ${d} 데미지!`;
    playFightStep({ type: 'attack', att: 'A', def: 'B', dmg: d, heavy: d >= 26, mv: toFightMove(mv, d >= 26), ko: C.ohp <= 0 });
  } else {
    // 상대가 이김
    const d = dmgOf(O, P);
    C.php = Math.max(0, C.php - d);
    line = `❌ 상대의 ${MOVES[om].name}에 당했다! ${C.tellTruth ? '' : '(예비 동작은 페인트였다!) '}${d} 데미지를 입었다...`;
    playFightStep({ type: 'attack', att: 'B', def: 'A', dmg: d, heavy: d >= 26, mv: toFightMove(om, d >= 26), ko: C.php <= 0 });
  }
  C.log.push(line);
  // HP바 반영
  setTimeout(() => {
    $('hp-A').style.width = C.php + '%';
    $('hp-B').style.width = C.ohp + '%';
  }, 300);
  setTimeout(() => {
    C.resolving = false;
    if (C.php <= 0 || C.ohp <= 0) finishChallenge(C.ohp <= 0 && C.php > 0);
    else { C.round++; renderChallengeRound(); }
  }, 1150);
}


function finishChallenge(win) {
  const C = S.challenge, O = S.fighters[C.oppIdx], P = S.player;
  S.stats.playerFights++;
  let html = '';
  if (win) {
    const payout = C.stake * CONFIG.CHALLENGE_PAYOUT;
    S.gold += payout;
    S.stats.playerWins++;
    S.stats.challengePL += payout - C.stake;
    P.w++; O.l++;
    $('sprite-B') && $('sprite-B').classList.add('ko');
    $('sprite-A') && $('sprite-A').classList.add('win-pose');
    sndGood();
    html = `<p class="good big">🏆 승리! ${O.name}을(를) 쓰러뜨렸다! 판돈 ×${CONFIG.CHALLENGE_PAYOUT} = +${fmt(payout)} G</p>`;
    // 성장: 랜덤 스탯 +1
    const grow = shuffle(['atk', 'def', 'spd']).find(k => P[k] < CONFIG.PLAYER_GROWTH_CAP);
    if (grow) {
      P[grow]++;
      html += `<p class="accent">💪 실전으로 몸이 단련됐다 — ${grow === 'atk' ? '공격력' : grow === 'def' ? '방어력' : '스피드'} +1 (현재 ${P[grow]})</p>`;
    }
    if (Math.random() < CONFIG.CHALLENGE_DROP) {
      S.stats.drops++;
      sndDrop();
      html += `<p class="drop-fx blink">✦ 전설 부품 획득! (보유 ${S.stats.drops}개)</p>`;
    }
  } else {
    S.stats.challengePL -= C.stake;
    P.l++; O.w++;
    $('sprite-A') && $('sprite-A').classList.add('ko');
    $('sprite-B') && $('sprite-B').classList.add('win-pose');
    sndBad();
    html = `<p class="bad big">💥 패배... 판돈 ${fmt(C.stake)} G를 잃고 흠씬 두들겨 맞았다.</p>
      <p class="dim" style="font-size:13px">데스크: "몸은 성하지? 내일 또 오라고."</p>`;
  }
  updateHUD();
  $('night-console').innerHTML = `
    <div style="font-size:14px; line-height:1.8">${html}</div>
    <div class="center" style="margin-top:8px">
      <button class="btn-big" onclick="proceedAfterChallenge()">🌌 새벽 암시장으로 →</button>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   새벽 암시장 — 밤 수익으로 낮을 강화하는 역방향 고리
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { proceedAfterChallenge, renderChallengeOffer, selectChallengeOpp, rollOppMove, startChallenge, renderChallengeRound, playerMove, finishChallenge });
export { proceedAfterChallenge, renderChallengeOffer, selectChallengeOpp, rollOppMove, startChallenge, renderChallengeRound, playerMove, finishChallenge };

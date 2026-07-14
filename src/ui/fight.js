// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function arenaFx(side, emoji) {
  const el = $('arena'); if (!el) return;
  const fx = document.createElement('span');
  fx.className = 'fx-pop'; fx.textContent = emoji;
  fx.style[side === 'A' ? 'left' : 'right'] = '16%';
  el.appendChild(fx);
  setTimeout(() => fx.remove(), 600);
}

function arenaFloat(side, text, cls) {
  const el = $('arena'); if (!el) return;
  const fl = document.createElement('span');
  fl.className = 'dmg-float' + (cls ? ' ' + cls : ''); fl.textContent = text;
  fl.style[side === 'A' ? 'left' : 'right'] = '20%';
  el.appendChild(fl);
  setTimeout(() => fl.remove(), 800);
}

function runFight() {
  const m = S.matches[S.matchIdx];
  const A = S.fighters[m.ia], B = S.fighters[m.ib];
  // 승자는 실제 승률(소문 반영)로 결정
  const aWins = Math.random() < m.pActual;
  const W = aWins ? A : B, L = aWins ? B : A;
  m.winner = aWins ? 'A' : 'B'; m.done = true;
  W.w++; L.l++;

  // ── 경기 아크: 압승/접전/역전극 — 승자는 이미 확률로 정해졌고, 그 과정을 연출한다 ──
  const sideW = aWins ? 'A' : 'B', sideL = aWins ? 'B' : 'A';
  const arc = pickWeighted([{ id: 'dominant', w: 3 }, { id: 'close', w: 4 }, { id: 'comeback', w: 3 }]).id;
  const nEx = randInt(4, 6); // 공방 교환 횟수 (경기 길이)
  const wEnd = arc === 'dominant' ? randInt(55, 85) : arc === 'close' ? randInt(8, 25) : randInt(10, 20);
  // HP 웨이포인트 곡선: 역전극은 승자가 초반에 두들겨 맞고(p<1), 패자는 후반에 무너진다(p>1)
  const curve = (to, p) => {
    const pts = [100];
    for (let i = 1; i <= nEx; i++) {
      const v = 100 - (100 - to) * Math.pow(i / nEx, p) + rand(-7, 7);
      pts.push(Math.min(pts[i - 1], Math.max(to, Math.round(v))));
    }
    pts[nEx] = to;
    return pts;
  };
  const loserPts = curve(randInt(5, 10), arc === 'comeback' ? 2.4 : 1); // KO 피니시용으로 5~10 남김
  const winnerPts = curve(wEnd, arc === 'comeback' ? 0.45 : 1);

  const mkLine = (pool, a, b) => pick(pool).replaceAll('{a}', a.name).replaceAll('{b}', b.name);
  const first = A.spd >= B.spd ? A : B;
  // 각성 소재: 승자 측의 '진짜 호재 소문' — 있으면 역전극이 각성 연출이 된다
  const awakenRumor = (aWins ? m.rumorsA : m.rumorsB).find(r => !r.fake && r.sign > 0);
  const steps = [];
  let hw = 100, hl = 100;
  const hpOf = () => sideW === 'A' ? { hpA: hw, hpB: hl } : { hpA: hl, hpB: hw };
  steps.push({ line: `🔔 공이 울린다! ${first.name}(이)가 잽을 던지며 거리를 잰다!`, hpA: 100, hpB: 100 });
  for (let i = 1; i <= nEx; i++) {
    // 역전극 전반부에는 패자(초반 우세 쪽)가 먼저 친다
    const order = (arc === 'comeback' && i <= Math.ceil(nEx / 2)) ? ['L', 'W'] : ['W', 'L'];
    for (const who of order) {
      const att = who === 'W' ? W : L, def = who === 'W' ? L : W;
      const attSide = who === 'W' ? sideW : sideL, defSide = who === 'W' ? sideL : sideW;
      const target = who === 'W' ? loserPts[i] : winnerPts[i];
      const dmg = (who === 'W' ? hl : hw) - target;
      if (who === 'W') hl = target; else hw = target;
      if (dmg <= 0) {
        steps.push({ type: 'dodge', att: attSide, def: defSide, line: mkLine(FIGHT_DODGE_LINES, att, def), ...hpOf() });
      } else {
        const heavy = dmg >= 20;
        const mv = pick(heavy ? HEAVY_MOVES : LIGHT_MOVES);
        steps.push({ type: 'attack', att: attSide, def: defSide, dmg, heavy, mv,
          line: mkLine(mv.lines, att, def), ...hpOf() });
      }
    }
    // 중반 드라마: 접전은 관중 함성, 역전극은 각성(진짜 소문 인용) 또는 투혼
    if (i === Math.ceil(nEx / 2)) {
      if (arc === 'close') steps.push({ line: pick(FIGHT_CROWD_LINES), ...hpOf() });
      if (arc === 'comeback') {
        if (awakenRumor) {
          steps.push({ type: 'awaken', side: sideW,
            line: `⚡ 쓰러지기 직전—— "${awakenRumor.text}"... 그 소문, 진짜였다!! ${W.name}의 몸에서 불꽃이 튄다!!`, ...hpOf() });
        } else {
          steps.push({ line: pick(FIGHT_COMEBACK_LINES).replaceAll('{a}', W.name), ...hpOf() });
        }
      }
    }
  }
  // 피니시: 필살기 KO
  const lastDmg = hl;
  hl = 0;
  steps.push({ type: 'attack', att: sideW, def: sideL, dmg: lastDmg, heavy: true, ko: true, mv: pick(HEAVY_MOVES),
    line: `💥 ${W.name}의 필살기 '${W.skill}' 작렬!! ${L.name}, 그대로 쓰러진다!`, ...hpOf() });
  steps.push({ type: 'win', win: sideW,
    line: `🏆 ${W.emoji} ${W.name} 승리!${arc === 'comeback' ? (awakenRumor ? ' 소문은 사실이었다 — 대각성 역전극!!' : ' 대역전극이다!!') : arc === 'close' ? ' 명승부였다!' : ''}`, ...hpOf() });

  // 콘솔을 중계 로그로 전환 — 링·HP바·파이터 패널은 씬에 그대로 남는다
  $('night-console').innerHTML = `
    <div class="fightlog" id="fightlog"></div>
    <div class="center" id="fight-after" style="margin-top:8px"></div>`;
  $('sprite-A').className = 'sprite-pos';
  $('sprite-B').className = 'sprite-pos';
  updateDebug();

  const log = $('fightlog');
  let idx = 0;
  const tick = () => {
    if (idx >= steps.length) { settleFight(m, aWins); return; }
    const st = steps[idx++];
    const div = document.createElement('div');
    div.textContent = '▸ ' + st.line;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    $('hp-A').style.width = st.hpA + '%';
    $('hp-B').style.width = st.hpB + '%';
    playFightStep(st);
    setTimeout(tick, st.type === 'awaken' ? 1250 : 700);
  };
  tick();
}

// 스텝 하나를 링 위에서 연기한다 (경기·직접 출전 공용)

function playFightStep(st) {
  if (st.type === 'attack') {
    const outA = $('sprite-' + st.att), outD = $('sprite-' + st.def);
    const rigA = rigOf(st.att);
    outA.classList.remove('idle'); outD.classList.remove('idle');
    outA.classList.add(st.mv.fly ? 'go-fly' : 'go');
    rigA.classList.add(st.mv.act);
    setTimeout(() => {
      outD.classList.add(st.mv.rx);
      arenaFx(st.def, st.mv.fx);
      arenaFloat(st.def, '-' + st.dmg, st.heavy ? 'crit' : '');
      beep(st.heavy ? 150 : rand(190, 260), st.heavy ? 0.12 : 0.06);
      if (st.ko) {
        setTimeout(() => { outD.className = 'sprite-pos ko'; arenaFx(st.def, '💫'); }, 380);
      }
    }, 200);
    setTimeout(() => { rigA.classList.remove(st.mv.act); outA.classList.remove('go', 'go-fly'); }, 520);
    if (!st.ko) setTimeout(() => outD.classList.remove(st.mv.rx), 640);
  } else if (st.type === 'dodge') {
    const outA = $('sprite-' + st.att), outD = $('sprite-' + st.def);
    const rigA = rigOf(st.att);
    outA.classList.add('go'); rigA.classList.add('act-punch');
    setTimeout(() => {
      outD.classList.add('dodge');
      arenaFx(st.def, '💨');
      arenaFloat(st.def, 'MISS!', 'miss');
      setTimeout(() => outD.classList.remove('dodge'), 380);
      beep(520, 0.05);
    }, 160);
    setTimeout(() => { rigA.classList.remove('act-punch'); outA.classList.remove('go'); }, 460);
  } else if (st.type === 'awaken') {
    const out = $('sprite-' + st.side);
    out.classList.add('awaken');
    arenaFx(st.side, '✨');
    setTimeout(() => arenaFx(st.side, '⚡'), 300);
    setTimeout(() => arenaFx(st.side, '✨'), 600);
    sndDrop();
    setTimeout(() => out.classList.remove('awaken'), 1900);
  } else if (st.type === 'win') {
    $('sprite-' + st.win).classList.add('win-pose');
    sndGood();
  } else {
    beep(rand(300, 420), 0.05);
  }
}

Object.assign(globalThis, { arenaFx, arenaFloat, runFight, playFightStep });
export { arenaFx, arenaFloat, runFight, playFightStep };

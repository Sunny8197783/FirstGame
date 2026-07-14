// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function statBar(v) { return '█'.repeat(v) + '░'.repeat(10 - v); }


function fighterCardHTML(f, m, side) {
  const rumors = side === 'A' ? m.rumorsA : m.rumorsB;
  const odds = side === 'A' ? m.oddsA : m.oddsB;
  const idx = side === 'A' ? m.ia : m.ib;
  const sponsored = S.sponsorIdx === idx;
  return `
    <div class="fighter-card" id="fcard-${side}" onclick="selectFighter('${side}')">
      <div class="row" style="gap:8px; align-items:center; flex-wrap:nowrap">
        <span class="pframe" style="width:64px; height:64px; font-size:40px">${f.emoji}</span>
        <div>
          <h3 style="font-size:15px">파이터 ${side}${sponsored ? ' <span class="accent" style="font-size:12px">🤝 후원 중</span>' : ''}</h3>
          <p style="font-size:14px">${f.name}</p>
          <p class="dim" style="font-size:12px">전적 <span class="${winRate(f) >= 0.5 ? 'good' : 'bad'}">${f.w}승 ${f.l}패</span></p>
        </div>
      </div>
      <p style="font-size:13px; margin-top:6px">공격력 <span class="statbar">${statBar(f.atk)}</span> ${f.atk}<br>
         방어력 <span class="statbar">${statBar(f.def)}</span> ${f.def}<br>
         스피드 <span class="statbar">${statBar(f.spd)}</span> ${f.spd}</p>
      <p class="center big neon-pink" style="margin-top:4px">배당 ×${odds.toFixed(2)}</p>
      ${rumors.length ? rumors.map(r => `
        <div class="bubble" style="margin-top:8px; font-size:13px"><span class="rumor-icon">${r.icon}</span> ${r.text}
          ${r.verified
            ? `<div class="trust ${r.fake ? 'low' : 'high'}">🕵️ 정보원 확인: <b>${r.fake ? '헛소문이다!' : '진짜다!'}</b></div>`
            : `<div class="trust ${r.strength === 'strong' ? 'high' : 'low'}">(${r.strength === 'strong' ? '직접 목격 — 신뢰도 높음' : '뜬소문 — 신뢰도 낮음'})</div>`}
        </div>`).join('') : '<p class="dim center" style="margin-top:8px; font-size:13px">별다른 소문이 없다.</p>'}
    </div>`;
}


function renderMatch() {
  updateHUD();
  const m = S.matches[S.matchIdx];
  const A = S.fighters[m.ia], B = S.fighters[m.ib];
  S.currentBet = null;
  const maxBet = Math.floor(S.gold * betCapRate());
  const pMul = partBonusMul();
  $('screen').innerHTML = `
    <div class="scene scene-night">
      <div class="crowd"></div>
      <div class="neon neon-l"></div><div class="neon neon-r"></div>
      <div class="hp-row">
        <span style="font-size:13px">HP</span>
        <div class="hpbar-wrap"><div class="hpbar cyan" id="hp-A" style="width:100%"></div></div>
        <span class="neon-pink" style="font-size:15px; white-space:nowrap">${m.final ? '👑 그랜드 파이널' : `제${S.matchIdx + 1}경기/${S.matches.length}`}</span>
        <div class="hpbar-wrap"><div class="hpbar" id="hp-B" style="width:100%"></div></div>
        <span style="font-size:13px">HP</span>
      </div>
      <div class="night-grid">
        ${fighterCardHTML(A, m, 'A')}
        <div class="ring" id="arena">
          <div class="ring-ropes"><i></i><i></i><i></i></div>
          <div class="ring-floor"></div>
          ${rigHTML('A', A.color, 'idle')}
          ${rigHTML('B', B.color, 'idle')}
        </div>
        ${fighterCardHTML(B, m, 'B')}
      </div>
      <div class="panel" id="night-console" style="margin-bottom:0">
        <p class="center" style="font-size:15px">하우스 배당: <b class="accent">파이터 A (×${m.oddsA.toFixed(2)})</b> / <b class="neon-pink">파이터 B (×${m.oddsB.toFixed(2)})</b>
          <span class="dim" style="font-size:12px"> — 배당은 스탯·전적만 반영. 소문은 당신만 아는 정보다.</span></p>
        <p class="center dim" style="font-size:12px">🕵️ 추리법: 같은 표시(🩹🍶🌫️🔥⚡🎯)의 소문이 <b>겹치면 사실</b>일 확률이 높고, 좋은/나쁜 소문이 <b>충돌하면 최소 하나는 거짓</b>이다. 목격담(높음)이 뜬소문(낮음)보다 믿을 만하다.</p>
        <div class="row" style="align-items:center; margin-top:8px">
          <span id="bet-pick" class="dim" style="font-size:14px">파이터 패널을 눌러 선택 →</span>
          <span style="flex:1"></span>
          <input type="number" id="bet-amount" min="0" max="${maxBet}" step="100" value="${Math.min(1000, maxBet)}">
          <span>G</span>
          <button class="btn-ghost" onclick="setBet(0.1)">10%</button>
          <button class="btn-ghost" onclick="setBet(0.25)">25%</button>
          <button class="btn-ghost" onclick="setBet(0.5)">50%</button>
        </div>
        ${m.final ? '<p class="center neon-pink" style="font-size:13px">👑 그랜드 파이널의 밤 — 오늘만은 베팅 상한이 없다. 전부를 걸어도 좋다.</p>' : ''}
        <p class="dim" style="font-size:12px">베팅 상한: 보유 골드의 ${Math.round(betCapRate() * 100)}% = ${fmt(maxBet)} G${pMul > 1 ? ` · ✦ 부품 인맥 보너스: 당첨금 +${Math.round((pMul - 1) * 100)}%` : ''}</p>
        <div class="center" style="margin-top:6px">
          <button class="btn-big btn-pink" id="btn-bet" onclick="confirmBet()" disabled>베팅 확정</button>
          <button class="btn-ghost" onclick="watchOnly()">관망한다 (베팅 없이 관전)</button>
        </div>
      </div>
    </div>`;
  updateDebug();
}

Object.assign(globalThis, { statBar, fighterCardHTML, renderMatch });
export { statBar, fighterCardHTML, renderMatch };

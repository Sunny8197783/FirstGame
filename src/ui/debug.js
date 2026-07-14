// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
let debugOn = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D' || e.key === 'ㅇ') {
    debugOn = !debugOn;
    $('debug').classList.toggle('show', debugOn);
    updateDebug();
  }
});


function updateDebug() {
  if (!debugOn) return;
  let html = `<b>[DEBUG]</b> day=${S.day} phase=${S.phase} gold=${fmt(S.gold)} 빚=${fmt(S.debt || 0)}<br>이벤트=${S.event ? S.event.name : '-'}<br>도구=${Object.keys(S.upgrades || {}).filter(k => S.upgrades[k]).join(',') || '-'} 후원=${S.sponsorIdx !== null && S.fighters[S.sponsorIdx] ? S.fighters[S.sponsorIdx].name : '-'}<br>`;
  if (S.phase === 'day' && S.customers[S.custIdx]) {
    const c = S.customers[S.custIdx];
    html += `── 현재 손님 ──<br>
      진짜가치 V = ${fmt(c.V)}<br>
      요구가 = ${fmt(c.asking)} / 현재 D = ${S.haggle ? fmt(S.haggle.D) : '-'}<br>
      최저수락가 M = ${fmt(c.M)} / 인내심 = ${S.haggle ? S.haggle.P : c.patience}<br>
      장물 = ${c.stolen ? '🚨예' : '아니오'} / 진품 = ${c.jackpot ? '🎉예' : '아니오'}<br>
      함정힌트 = ${c.hasTrap ? '있음: "' + (c.hints.find(h => h.trap) || {}).text + '"' : '없음'}<br>
      가치위치 t = ${c.t.toFixed(2)} / 검수점수 = ${c.partsView.map(p => p.score).join(',')}`;
  }
  if (S.phase === 'night' && S.matches[S.matchIdx] && !S.matches[S.matchIdx].done) {
    const m = S.matches[S.matchIdx];
    const A = S.fighters[m.ia], B = S.fighters[m.ib];
    const fmtR = (rs) => rs.length ? rs.map(r => `${r.fake ? '❌헛' : '✅' + (r.effect * 100).toFixed(0) + '%p'}`).join(',') : '-';
    html += `── 현재 경기 ──<br>
      하우스추정 ${A.name.split(' ')[0]} = ${(m.est * 100).toFixed(1)}%<br>
      실제승률 ${A.name.split(' ')[0]} = ${(m.pActual * 100).toFixed(1)}%<br>
      소문A: ${fmtR(m.rumorsA)}<br>
      소문B: ${fmtR(m.rumorsB)}<br>
      EV(A베팅) = ${((m.pActual * m.oddsA - 1) * 100).toFixed(1)}%<br>
      EV(B베팅) = ${(((1 - m.pActual) * m.oddsB - 1) * 100).toFixed(1)}%`;
  }
  if (S.challenge && S.challenge.oppMove) {
    html += `── 스파링 ──<br>
      상대 실제 수 = ${MOVES[S.challenge.oppMove].name}<br>
      텔 = ${S.challenge.tellTruth ? '✅ 진짜' : '❌ 페인트'}`;
  }
  $('debug').innerHTML = html;
}

/* 시작 */

Object.assign(globalThis, { updateDebug });
export { updateDebug };

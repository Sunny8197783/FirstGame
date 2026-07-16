// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function renderResult() {
  S.phase = 'result'; setTheme('night'); updateHUD();
  const st = S.stats;
  const net = S.gold - S.debt; // 순자산 = 보유 골드 − 남은 빚
  const delta = net - (CONFIG.START_GOLD - CONFIG.DEBT_START);
  const avgBuyRatio = st.deals ? st.buyRatioSum / st.deals : 0; // 진짜 가치 대비 평균 매입가율
  const hitRate = st.bets ? st.betWins / st.bets : 0;
  const avgEst = st.bets ? st.houseEstSum / st.bets : 0;
  const edge = st.bets ? hitRate - avgEst : 0;
  let grade = 'F', comment = '';
  for (const [cut, g, c] of CONFIG.FINAL_GRADES) {
    if (net >= cut) { grade = g; comment = c; break; }
  }
  let storyLine;
  if (S.endingId === 'debt_fail') {
    storyLine = '💸 8일째 아침, 김사장의 부하들이 들이닥쳤다. 갚을 돈이 없다. 전당포 열쇠는 그의 손에 넘어갔고, 당신은 뒷골목으로 사라졌다... <b>[배드 엔딩: 빚의 무게]</b>';
  } else if (S.endingId === 'act2_fail') {
    storyLine = '🚬 회장이 고개를 저었다. "아깝군." 당신의 눈은 이제 회장의 것이다 — 격투장 구석에서 남의 장물이나 감정하며 산다. <b>[엔딩: 회장의 감정사]</b>';
  } else if (S.season > 0) {
    // [Phase3] 시즌 모드 중간 결산 — 엔딩이 아니다
    storyLine = `🌆 시즌 ${S.season} · ${seasonDayOf()}일째${S.prestige ? ` · 🏚️ 프레스티지 ×${S.prestige}` : ''} — 지하경제는 계속된다.`;
  } else if (S.day >= CONFIG.DAYS) {
    storyLine = net >= 100000
      ? '👑 그랜드 파이널의 함성이 잦아들 무렵, 거리의 모두가 알게 됐다 — 이 도시의 돈이 어디로 흐르는지를. <b>[진 엔딩: 지하경제의 왕]</b>'
      : net >= 60000
        ? '🥊 회장이 은퇴를 선언하며 당신에게 잔을 건넸다. 지하 격투장의 새 주인이 탄생했다. <b>[엔딩: 격투장의 새 주인]</b>'
        : '🏪 전당포는 이제 거리의 명물이 됐다. 낮에는 감정, 밤에는 베팅 — 나쁘지 않은 인생이다. <b>[엔딩: 이름난 전당포 주인]</b>';
  } else {
    storyLine = S.debt > 0
      ? `💸 아직 빚 ${fmt(S.debt)} G가 남은 채 장부를 덮었다. (${S.day}일차 중간 결산 — 이야기는 계속된다)`
      : `📜 ${S.day}일차의 중간 결산. 이야기는 아직 끝나지 않았다.`;
  }
  // [Phase3] 캠페인 정상 완주(엔딩 도달) 시 시즌 모드 해금 버튼 노출
  const seasonUnlock = !S.endingId && S.season === 0 && S.day >= CONFIG.DAYS;
  const canResume = typeof hasSave === 'function' && hasSave() && !S.endingId;
  showTransition(`<div>🌅</div><div>${S.season > 0 ? '시즌 결산의 시간...' : '장부를 덮는다...'}</div>`, () => {
    $('screen').innerHTML = `
      <div class="panel center">
        <h1>📜 최종 결산</h1>
        <p class="huge accent" style="margin:10px 0">${grade}</p>
        <p class="big">"${comment}"</p>
        <p style="margin-top:10px; font-size:15px">${storyLine}</p>
      </div>
      <div class="panel">
        <h3>💰 자산</h3>
        <table>
          <tr><td>진행</td><td>${S.day}일차 / ${CONFIG.DAYS}일 · ${actOf()}막</td></tr>
          <tr><td>최종 보유 골드</td><td>${fmt(S.gold)} G</td></tr>
          <tr><td>남은 빚 (김사장)</td><td class="${S.debt > 0 ? 'bad' : 'good'}">${S.debt > 0 ? '-' + fmt(S.debt) + ' G' : '청산 완료 ✔'}</td></tr>
          <tr><td>순자산</td><td class="accent big">${fmt(net)} G</td></tr>
          <tr><td>시작 대비 (시작 순자산 ${fmt(CONFIG.START_GOLD - CONFIG.DEBT_START)} G)</td><td class="${delta >= 0 ? 'good' : 'bad'} big">${delta >= 0 ? '+' : ''}${fmt(delta)} G</td></tr>
          <tr><td>암시장 도구 투자</td><td>${Object.values(S.upgrades).filter(Boolean).length} / ${UPGRADES.length}종</td></tr>
          <tr><td>단골 확보</td><td>${Object.values(S.regularDeals).filter(v => v >= CONFIG.REGULAR_DEALS_REQ).length}개 유형</td></tr>
          ${st.loans ? `<tr><td>김사장 신세진 횟수</td><td class="bad">${st.loans}회</td></tr>` : ''}
        </table>
      </div>
      <div class="panel">
        <h3>☀️ 낮 — 흥정 성적</h3>
        <table>
          <tr><td>평균 매입가율 (진짜 가치 대비 — 낮을수록 고수)</td><td>${st.deals ? (avgBuyRatio * 100).toFixed(0) + '%' : '-'}</td></tr>
          <tr><td>성사 / 결렬</td><td>${st.deals}건 / ${st.rejected}건</td></tr>
          <tr><td>최고의 한 방 (단일 최대 이익)</td><td class="good">${st.bestDeal > 0 ? '+' + fmt(st.bestDeal) + ' G' : '-'}</td></tr>
          ${st.jackpots ? `<tr><td>🎉 숨은 진품 발굴</td><td class="accent">${st.jackpots}회</td></tr>` : ''}
          ${st.stolenLost ? `<tr><td>🚨 장물 압수 피해</td><td class="bad">${st.stolenLost}회</td></tr>` : ''}
          <tr><td>장사 총손익</td><td class="${st.tradePL >= 0 ? 'good' : 'bad'}">${st.tradePL >= 0 ? '+' : ''}${fmt(st.tradePL)} G</td></tr>
        </table>
      </div>
      <div class="panel">
        <h3>🌙 밤 — 베팅 성적</h3>
        <table>
          <tr><td>베팅 횟수 / 적중</td><td>${st.bets}회 / ${st.betWins}회 (${st.bets ? (hitRate * 100).toFixed(0) : '-'}%)</td></tr>
          <tr><td>베팅 총손익</td><td class="${st.betPL >= 0 ? 'good' : 'bad'}">${st.betPL >= 0 ? '+' : ''}${fmt(st.betPL)} G</td></tr>
          <tr><td>판단 우위 (적중률 − 하우스 추정)</td>
              <td class="${edge >= 0 ? 'good' : 'bad'}">${st.bets ? (edge >= 0 ? '+' : '') + (edge * 100).toFixed(1) + '%p' : '-'}</td></tr>
          <tr><td>전설 부품 ✦</td><td class="accent">${st.drops}개</td></tr>
          ${st.sponsorIncome ? `<tr><td>🤝 후원 지분 수익</td><td class="good">+${fmt(st.sponsorIncome)} G</td></tr>` : ''}
          ${st.playerFights ? `<tr><td>🥋 직접 출전</td><td>${st.playerWins}승 ${st.playerFights - st.playerWins}패 <span class="${st.challengePL >= 0 ? 'good' : 'bad'}">(${st.challengePL >= 0 ? '+' : ''}${fmt(st.challengePL)} G)</span></td></tr>` : ''}
        </table>
        <p class="dim" style="margin-top:6px">판단 우위가 +라면, 당신은 소문을 읽어 하우스보다 정확히 예측한 것이다.</p>
      </div>
      <div class="center" style="margin:16px 0">
        ${seasonUnlock ? '<button class="btn-big btn-pink" onclick="startSeasonMode()">🌆 시즌 모드로 계속한다</button>' : ''}
        ${canResume ? '<button class="btn-big" onclick="continueGame()">게임으로 돌아간다 (오늘 아침부터)</button>' : ''}
        <button class="${seasonUnlock || canResume ? 'btn-ghost' : 'btn-big'}" onclick="renderTitle()">타이틀로</button>
      </div>`;
  }, 1400);
}

/* ═══════════════════════════════════════════════════════════════
   디버그 패널 ([D] 토글 — 밸런스 검증용)
   ═══════════════════════════════════════════════════════════════ */

Object.assign(globalThis, { renderResult });
export { renderResult };

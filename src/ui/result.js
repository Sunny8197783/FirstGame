// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.

// [Phase4] 엔딩 분기별 SVG 일러스트 — 픽셀 테마 색(앰버/네온)으로 통일한 실루엣 삽화.
function endingArt(key) {
  const svg = (inner) => `<svg class="ending-art" viewBox="0 0 320 150" role="img" aria-label="엔딩 삽화" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const A = {
    // 배드엔딩: 빚의 무게 — 붉게 물든 뒷골목으로 사라지는 실루엣
    debt: svg(`
      <rect width="320" height="150" fill="#140d0d"/>
      <rect x="0" y="0" width="90" height="150" fill="#241618"/>
      <rect x="230" y="0" width="90" height="150" fill="#241618"/>
      <polygon points="90,0 130,0 120,150 90,150" fill="#1a1012"/>
      <polygon points="230,0 190,0 200,150 230,150" fill="#1a1012"/>
      <ellipse cx="160" cy="150" rx="70" ry="16" fill="#3a0e12"/>
      <circle cx="160" cy="40" r="26" fill="#c0303a" opacity="0.25"/>
      <g fill="#0a0608"><ellipse cx="160" cy="78" rx="13" ry="15"/><rect x="150" y="90" width="20" height="46" rx="6"/></g>
      <text x="160" y="46" fill="#e05560" font-size="26" text-anchor="middle" font-weight="bold">빚</text>`),
    // 회장의 감정사 — 스탠드 조명 아래 갇혀 감정만 하는 신세
    appraiser: svg(`
      <rect width="320" height="150" fill="#15141a"/>
      <polygon points="205,10 235,10 300,140 140,140" fill="#e8b23a" opacity="0.12"/>
      <rect x="205" y="4" width="30" height="12" rx="3" fill="#3a3a44"/>
      <rect x="80" y="120" width="160" height="10" fill="#2a2620"/>
      <circle cx="150" cy="112" r="16" fill="none" stroke="#c9cdd4" stroke-width="4"/>
      <rect x="160" y="120" width="6" height="22" rx="3" fill="#8a8f9a" transform="rotate(38 163 131)"/>
      <rect x="120" y="116" width="10" height="8" fill="#9cc8f0"/>
      <g fill="#0a0810" opacity="0.9"><ellipse cx="250" cy="70" rx="14" ry="16"/><rect x="238" y="84" width="24" height="46" rx="6"/></g>`),
    // 진엔딩: 지하경제의 왕 — 도시 스카이라인 위 황금 왕관
    king: svg(`
      <rect width="320" height="150" fill="#120f1a"/>
      <g fill="#e8b23a" opacity="0.16"><rect x="10" y="90" width="26" height="60"/><rect x="46" y="70" width="26" height="80"/><rect x="82" y="100" width="26" height="50"/><rect x="212" y="95" width="26" height="55"/><rect x="248" y="72" width="26" height="78"/><rect x="284" y="88" width="26" height="62"/></g>
      <circle cx="160" cy="70" r="60" fill="#e8b23a" opacity="0.10"/>
      <polygon points="112,96 122,52 140,78 160,44 180,78 198,52 208,96" fill="#e8b23a" stroke="#a3711d" stroke-width="3"/>
      <rect x="112" y="96" width="96" height="16" fill="#c8a24a" stroke="#a3711d" stroke-width="3"/>
      <circle cx="122" cy="52" r="5" fill="#f0e08a"/><circle cx="160" cy="44" r="6" fill="#f0e08a"/><circle cx="198" cy="52" r="5" fill="#f0e08a"/>
      <circle cx="160" cy="104" r="5" fill="#c0303a"/>
      <text x="160" y="138" fill="#e8b23a" font-size="13" text-anchor="middle" font-weight="bold">지하경제의 왕</text>`),
    // 격투장의 새 주인 — 네온 링 로프 위로 치켜든 주먹
    ring: svg(`
      <rect width="320" height="150" fill="#0f0d16"/>
      <line x1="0" y1="46" x2="320" y2="46" stroke="#ff44aa" stroke-width="3" opacity="0.8"/>
      <line x1="0" y1="70" x2="320" y2="70" stroke="#44d0ff" stroke-width="3" opacity="0.7"/>
      <line x1="0" y1="94" x2="320" y2="94" stroke="#ff44aa" stroke-width="3" opacity="0.6"/>
      <rect x="18" y="30" width="8" height="110" fill="#3a3a44"/><rect x="294" y="30" width="8" height="110" fill="#3a3a44"/>
      <g fill="#0a0810"><ellipse cx="160" cy="96" rx="15" ry="17"/><rect x="150" y="108" width="20" height="34" rx="6"/><rect x="168" y="60" width="12" height="42" rx="6" transform="rotate(12 174 81)"/></g>
      <circle cx="182" cy="52" r="11" fill="#c0303a" stroke="#7a1820" stroke-width="2"/>
      <text x="160" y="24" fill="#ff66bb" font-size="13" text-anchor="middle" font-weight="bold">격투장의 새 주인</text>`),
    // 이름난 전당포 주인 — 따뜻한 앰버 간판의 가게 앞
    shop: svg(`
      <rect width="320" height="150" fill="#171009"/>
      <rect x="40" y="60" width="240" height="90" fill="#2a1c0e"/>
      <rect x="40" y="46" width="240" height="18" fill="#5a3617"/>
      <g fill="#8a5a2b"><rect x="40" y="64" width="240" height="14"/></g>
      <path d="M40 64 h240 l-14 18 h-212 z" fill="#c8a24a" opacity="0.25"/>
      <rect x="120" y="86" width="80" height="64" fill="#3a2a16"/>
      <rect x="132" y="98" width="56" height="40" fill="#e8b23a" opacity="0.22"/>
      <circle cx="220" cy="30" r="20" fill="#e8b23a" opacity="0.18"/>
      <rect x="205" y="16" width="30" height="28" rx="3" fill="#241a10" stroke="#e8b23a" stroke-width="2"/>
      <text x="220" y="38" fill="#e8b23a" font-size="20" text-anchor="middle" font-weight="bold">典</text>
      <text x="160" y="140" fill="#f2efe6" font-size="12" text-anchor="middle">낮엔 감정 · 밤엔 베팅</text>`),
    // 시즌/중간 결산 — 떠오르는 해와 장부
    season: svg(`
      <rect width="320" height="150" fill="#141019"/>
      <circle cx="160" cy="150" r="60" fill="#e8b23a" opacity="0.14"/>
      <circle cx="160" cy="150" r="40" fill="#ff9a3a" opacity="0.18"/>
      <rect x="108" y="96" width="104" height="46" rx="4" fill="#2a2620" stroke="#8a5a2b" stroke-width="3"/>
      <line x1="120" y1="108" x2="200" y2="108" stroke="#c9cdd4" stroke-width="2" opacity="0.5"/>
      <line x1="120" y1="120" x2="200" y2="120" stroke="#c9cdd4" stroke-width="2" opacity="0.5"/>
      <line x1="120" y1="132" x2="176" y2="132" stroke="#c9cdd4" stroke-width="2" opacity="0.5"/>`),
  };
  return A[key] || '';
}

// 엔딩 종류에서 삽화 키를 정한다(스토리 분기와 동일 기준)
function endingKey() {
  if (S.endingId === 'debt_fail') return 'debt';
  if (S.endingId === 'act2_fail') return 'appraiser';
  if (S.season > 0) return 'season';
  const net = S.gold - S.debt;
  if (S.day >= CONFIG.DAYS) return net >= CONFIG.ENDING_TRUE ? 'king' : net >= CONFIG.ENDING_RING ? 'ring' : 'shop';
  return 'season'; // 중간 결산
}

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
    storyLine = net >= CONFIG.ENDING_TRUE
      ? '👑 그랜드 파이널의 함성이 잦아들 무렵, 거리의 모두가 알게 됐다 — 이 도시의 돈이 어디로 흐르는지를. <b>[진 엔딩: 지하경제의 왕]</b>'
      : net >= CONFIG.ENDING_RING
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
        ${endingArt(endingKey())}
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
          <tr><td>시작 대비 (시작 순자산 ${fmt(CONFIG.START_GOLD - CONFIG.DEBT_START)} G)</td><td>${plHTML(delta, ' G', { big: true })}</td></tr>
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
          <tr><td>장사 총손익</td><td>${plHTML(st.tradePL, ' G')}</td></tr>
        </table>
      </div>
      <div class="panel">
        <h3>🌙 밤 — 베팅 성적</h3>
        <table>
          <tr><td>베팅 횟수 / 적중</td><td>${st.bets}회 / ${st.betWins}회 (${st.bets ? (hitRate * 100).toFixed(0) : '-'}%)</td></tr>
          <tr><td>베팅 총손익</td><td>${plHTML(st.betPL, ' G')}</td></tr>
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

Object.assign(globalThis, { renderResult, endingArt, endingKey });
export { renderResult, endingArt, endingKey };

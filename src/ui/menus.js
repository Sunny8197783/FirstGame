// [Phase 2 신규] 인게임 메뉴 3종 — ⚙️ 설정 / 📊 확률 정보 / 📈 통계(추이 그래프)
// 전부 모달 기반이라 게임 어느 시점에서든 열고 닫아도 진행에 영향이 없다.

/* ── ⚙️ 설정 ── */
function renderSettings() {
  sndClick();
  const seg = (key, options, labels) => options.map((v, i) =>
    `<button class="seg ${SETTINGS[key] === v ? 'seg-on' : ''}" onclick="setSetting('${key}', ${v}); renderSettings()">${labels[i]}</button>`
  ).join('');
  showModal(`
    <h2 class="accent">⚙️ 설정</h2>
    <div class="set-row"><span>효과음 볼륨</span>
      <input type="range" min="0" max="1" step="0.1" value="${SETTINGS.sfxVol}" style="width:150px"
        oninput="setSetting('sfxVol', +this.value)" onchange="sndGood()">
      <span class="dim" style="font-size:12px">${Math.round(SETTINGS.sfxVol * 100)}%</span></div>
    <div class="set-row"><span>BGM 볼륨 <span class="dim" style="font-size:11px">(낮 lo-fi · 밤 신스)</span></span>
      <input type="range" min="0" max="1" step="0.1" value="${SETTINGS.bgmVol}" style="width:150px"
        oninput="setSetting('bgmVol', +this.value)">
      <span class="dim" style="font-size:12px">${Math.round(SETTINGS.bgmVol * 100)}%</span></div>
    <div class="set-row"><span>연출 배속</span><span>${seg('speed', [1, 2, 3], ['1×', '2×', '3×'])}</span></div>
    <div class="set-row"><span>중계 텍스트 속도</span><span>${seg('textSpeed', [1, 2, 3], ['1×', '2×', '3×'])}</span></div>
    <div class="set-row"><span>폰트 크기</span><span>${seg('fontScale', [1, 1.15], ['기본', '크게'])}</span></div>
    <div class="set-row"><span>화면 흔들림</span><span>${seg('shake', [true, false], ['켬', '끔'])}</span></div>
    <p class="dim" style="font-size:12px; margin-top:8px">⌨️ 단축키 — <b>SPACE</b> 전환·중계 스킵 · <b>Enter</b> 주요 행동(흥정 제시 등) · <b>Esc</b> 창 닫기 · <b>D</b> 디버그</p>
    <div class="set-row" style="margin-top:6px"><span>세이브 데이터</span><span>
      <button class="btn-ghost seg" onclick="exportSave()">📤 내보내기</button>
      <button class="btn-ghost seg" onclick="$('save-import-menu').click()">📥 가져오기</button>
      <button class="btn-ghost seg" onclick="confirmDeleteSave()">🗑 삭제</button>
    </span></div>
    <div class="set-row"><span>온보딩 팁</span><span>
      <button class="btn-ghost seg" onclick="resetTips(); toast('1일차 팁을 다시 표시한다')">다시 보기</button>
    </span></div>
    <input type="file" id="save-import-menu" accept=".json,application/json" style="display:none"
      onchange="if(this.files[0]) importSaveFile(this.files[0]); this.value='';">
    <div class="center" style="margin-top:10px"><button onclick="hideModal()">닫기</button></div>`);
}

function confirmDeleteSave() {
  if (!hasSave()) { toast('삭제할 세이브가 없다'); return; }
  showModal(`
    <h2 class="bad">🗑 세이브 삭제</h2>
    <p>저장된 게임을 완전히 삭제한다. 되돌릴 수 없다.</p>
    <div class="center" style="margin-top:10px">
      <button class="btn-big" onclick="deleteSave(); toast('세이브를 삭제했다'); hideModal(); if (S.phase === 'title') renderTitle()">삭제한다</button>
      <button class="btn-ghost" onclick="renderSettings()">취소</button>
    </div>`);
}

/* ── 📊 확률 정보 (CONFIG에서 동적 생성 — 수치 튜닝 시 자동 반영) ── */
function renderOddsInfo() {
  sndClick();
  const pct = (v) => Math.round(v * 100) + '%';
  const row = (k, v, note) => `<tr><td>${k}${note ? ` <span class="dim" style="font-size:11px">${note}</span>` : ''}</td><td>${v}</td></tr>`;
  showModal(`
    <h2 class="accent">📊 확률 정보</h2>
    <div class="modal-scroll">
    <h3 style="font-size:15px">☀️ 낮 — 감정·흥정</h3>
    <table>
      ${row('🎉 숨은 진품', pct(CONFIG.JACKPOT_RATE), `되팔이 ×${CONFIG.JACKPOT_MUL} 판정`)}
      ${row('🚨 장물 등장', pct(CONFIG.STOLEN_RATE), '수상한 유형(사기꾼·도박꾼) 한정')}
      ${row('🚨 장물 압수', pct(CONFIG.STOLEN_CONFISCATE), '장물 매입 시 저녁 정산에서')}
      ${row('🪤 함정 힌트', pct(CONFIG.TRAP_HINT_RATE), `사기꾼은 ${pct(CONFIG.TRAP_HINT_RATE_SWINDLER)}`)}
      ${row('🔍 검수 오차', pct(CONFIG.VISUAL_NOISE_RATE), '부위별 ±1점 · ⚖️ 정밀 저울로 제거')}
      ${row('💢 모욕 임계', `최저 수락가의 ${pct(CONFIG.INSULT_RATIO)} 미만`, '인내심 -2')}
    </table>
    <h3 style="font-size:15px; margin-top:10px">🌙 밤 — 격투 베팅</h3>
    <table>
      ${row('하우스 마진', pct(CONFIG.HOUSE_MARGIN), '배당 = (1/추정승률)×(1−마진)')}
      ${row('전적 보정', '±' + Math.round(CONFIG.RECORD_ADJ_MAX * 100) + '%p', '하우스 추정에 반영')}
      ${row('🗣️ 실제 정황 보유', pct(CONFIG.RUMOR_COND_RATE), '그 테마의 소문이 진짜로 돈다')}
      ${row('🗣️ 확증 소문(같은 테마 2개)', pct(CONFIG.RUMOR_SECOND_TRUE), `효과 +${Math.round(CONFIG.RUMOR_CORROBORATION_BONUS * 100)}%p`)}
      ${row('🗣️ 헛소문 동반', pct(CONFIG.RUMOR_EXTRA_FAKE), '진짜 소문 옆에 다른 테마로 섞임')}
      ${row('진짜 소문 효과', `승률 ±${Math.round(CONFIG.RUMOR_THEMES ? 5 : 5)}~13%p`, '테마별 상이 · 배당엔 미반영')}
      ${row('✦ 전설 부품 드롭', pct(CONFIG.DROP_BASE) + ' 기본', `언더독 적중 시 최대 ×${(1 + CONFIG.DROP_UNDERDOG_COEF).toFixed(1)}`)}
      ${row('✦ 부품 인맥 보너스', '+' + Math.round(CONFIG.PART_PAYOUT_BONUS * 100) + '%/개', `당첨금 · 최대 ${CONFIG.PART_BONUS_CAP}개`)}
    </table>
    <h3 style="font-size:15px; margin-top:10px">🥋 스파링 · 💸 경제</h3>
    <table>
      ${row('👁️ 텔 진실률', pct(CONFIG.TELL_TRUTH), '나머지는 카운터치면 지는 스마트 페인트')}
      ${row('스파링 배당', '판돈 ×' + CONFIG.CHALLENGE_PAYOUT, `상한 골드의 ${pct(CONFIG.CHALLENGE_STAKE_RATE)}`)}
      ${row('스파링 부품 드롭', pct(CONFIG.CHALLENGE_DROP), '승리 시')}
      ${row('김사장 이자', pct(CONFIG.DEBT_INTEREST) + '/일', '매일 아침 복리')}
      ${row('파산 보정', fmt(CONFIG.BANKRUPT_FLOOR) + ' G', '아침 골드가 미만이면 채워주고 빚에 가산')}
    </table>
    </div>
    <div class="center" style="margin-top:8px"><button onclick="hideModal()">닫기</button></div>`);
}

/* ── 📈 통계 + 일자별 추이 그래프 (SVG) ── */
function svgLineChart(points, w, h, color, fmtY) {
  if (!points.length) return '<p class="dim center" style="font-size:12px">데이터 없음</p>';
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs, minX + 1);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, minY + 1);
  const px = (x) => 34 + (x - minX) / (maxX - minX) * (w - 44);
  const py = (y) => (h - 18) - (y - minY) / (maxY - minY) * (h - 30);
  const poly = points.map(p => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const dots = points.map(p => `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="3" fill="${color}"/>`).join('');
  const zeroY = (minY < 0 && maxY > 0) ? `<line x1="34" x2="${w - 8}" y1="${py(0)}" y2="${py(0)}" stroke="rgba(255,255,255,0.25)" stroke-dasharray="3 3"/>` : '';
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; background:rgba(0,0,0,0.3); border:2px solid rgba(255,255,255,0.15)">
    <text x="4" y="14" fill="rgba(255,255,255,0.6)" font-size="10">${fmtY(maxY)}</text>
    <text x="4" y="${h - 8}" fill="rgba(255,255,255,0.6)" font-size="10">${fmtY(minY)}</text>
    ${zeroY}
    <polyline points="${poly}" fill="none" stroke="${color}" stroke-width="2"/>
    ${dots}
  </svg>`;
}

function renderStats() {
  sndClick();
  const st = S.stats;
  const hist = S.history || [];
  const net = S.gold - S.debt;
  const hitRate = st.bets ? st.betWins / st.bets : 0;
  const avgEst = st.bets ? st.houseEstSum / st.bets : 0;
  const edge = st.bets ? hitRate - avgEst : 0;
  const avgBuy = st.deals ? st.buyRatioSum / st.deals : 0;
  const netPts = hist.map(h => ({ x: h.day, y: h.net }));
  netPts.push({ x: S.day, y: net }); // 현재 시점 포함
  const edgePts = hist.filter(h => h.bets > 0).map(h => ({ x: h.day, y: +(((h.betWins / h.bets) - (h.houseEstSum / h.bets)) * 100).toFixed(1) }));
  showModal(`
    <h2 class="accent">📈 통계 <span class="dim" style="font-size:13px">${S.day}일차 현재</span></h2>
    <div class="modal-scroll">
    <table>
      <tr><td>순자산</td><td class="accent">${fmt(net)} G</td></tr>
      <tr><td>흥정 성사율</td><td>${st.deals + st.rejected ? Math.round(st.deals / (st.deals + st.rejected) * 100) + '%' : '-'} <span class="dim">(${st.deals}성사/${st.rejected}결렬)</span></td></tr>
      <tr><td>평균 매입가율 <span class="dim" style="font-size:11px">낮을수록 고수</span></td><td>${st.deals ? Math.round(avgBuy * 100) + '%' : '-'}</td></tr>
      <tr><td>베팅 적중률</td><td>${st.bets ? Math.round(hitRate * 100) + '%' : '-'} <span class="dim">(${st.betWins}/${st.bets})</span></td></tr>
      <tr><td>판단 우위 <span class="dim" style="font-size:11px">적중률−하우스 추정</span></td>
          <td class="${edge >= 0 ? 'good' : 'bad'}">${st.bets ? (edge >= 0 ? '+' : '') + (edge * 100).toFixed(1) + '%p' : '-'}</td></tr>
      <tr><td>스파링</td><td>${st.playerFights ? `${st.playerWins}승 ${st.playerFights - st.playerWins}패` : '-'}</td></tr>
      <tr><td>🎉 진품 / 🚨 압수</td><td>${st.jackpots}회 / ${st.stolenLost}회</td></tr>
    </table>
    <h3 style="font-size:14px; margin-top:10px">순자산 추이 (일자별)</h3>
    ${svgLineChart(netPts, 440, 120, '#ffd23e', (v) => fmt(v))}
    <h3 style="font-size:14px; margin-top:10px">판단 우위 추이 <span class="dim" style="font-size:11px">(누적, 베팅한 날)</span></h3>
    ${edgePts.length ? svgLineChart(edgePts, 440, 100, '#00f0ff', (v) => v + '%p') : '<p class="dim" style="font-size:12px">아직 베팅 기록이 없다</p>'}
    </div>
    <div class="center" style="margin-top:8px"><button onclick="hideModal()">닫기</button></div>`);
}

Object.assign(globalThis, { renderSettings, confirmDeleteSave, renderOddsInfo, renderStats, svgLineChart });
export { renderSettings, confirmDeleteSave, renderOddsInfo, renderStats };

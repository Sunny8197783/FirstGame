// ⚠️ Phase 1 자동 이식: 데모 index.html에서 원문 그대로 분리한 코드 (로직 변경 금지 구역)
// 모듈 간 호출·인라인 onclick은 아래 globalThis 등록을 통해 해석된다.
function haggleSay(kind, text) {
  const H = S.haggle, c = S.customers[S.custIdx];
  $('hg-demand').textContent = fmt(H.D) + ' G';
  $('hg-mood').innerHTML = `기분 ${MOOD_FACES[Math.min(Math.max(H.P, 0) + (kind === 'insult' ? 0 : 2), 5)]} · 인내심 ${'❤️'.repeat(Math.max(H.P, 0)) || '💢'}`;
  $('hg-say').innerHTML = text || pick(HAGGLE_LINES[kind]).replaceAll('{D}', fmt(H.D) + ' G');
  const take = $('btn-take');
  take.textContent = `요구가에 산다 (${fmt(H.D)} G)`;
  take.disabled = H.D > S.gold;
  $('offer-slider').max = H.D;
  $('offer-input').max = H.D;
  beep(kind === 'insult' ? 180 : 392, 0.08);
}


function makeOffer() {
  const c = S.customers[S.custIdx], H = S.haggle;
  if (!H) return;
  const X = clamp(Math.round((+($('offer-input').value) || 0) / 100) * 100, 100, 999999);
  if (X > S.gold) return;
  sndClick();
  if (X >= H.D) { closeDeal(c, H.D, 'acceptEasy'); return; } // 요구가 이상이면 그 값에 즉시 성사
  if (X < c.M * CONFIG.INSULT_RATIO) {
    // 모욕적인 제시 — 인내심 -2, 요구가는 꿈쩍도 안 한다
    H.P -= 2;
    if (H.P <= 0) { walkOut(c, X); return; }
    haggleSay('insult');
  } else if (X >= c.M) {
    // 수락 가능한 가격대: 충분히 후하거나 인내심이 바닥이면 수락, 아니면 한 번 더 밀당
    const gap = (X - c.M) / Math.max(H.D - c.M, 1);
    if (gap >= CONFIG.ACCEPT_GAP || H.P <= 1) { closeDeal(c, X, 'accept'); return; }
    H.P -= 1;
    H.D = Math.max(Math.round((H.D + X) / 2 / 100) * 100, X + 100);
    haggleSay('counter');
  } else {
    // 최저가 미만 (모욕까진 아님): 요구가가 내려오지만 인내심 소모
    H.P -= 1;
    if (H.P <= 0) { walkOut(c, X); return; }
    H.D = Math.max(Math.round((H.D + X) / 2 / 100) * 100, Math.round(c.M * 1.02 / 100) * 100);
    haggleSay('counter');
  }
  updateDebug();
}


function acceptDemand() {
  const c = S.customers[S.custIdx], H = S.haggle;
  if (!H || H.D > S.gold) return;
  sndClick();
  closeDeal(c, H.D, 'acceptEasy');
}

// 거래 성사: price에 매입. 진짜 가치는 저녁 정산에서 공개된다.

function closeDeal(c, price, tone) {
  S.haggle = null;
  S.stats.deals++;
  S.regularDeals[c.ctype.type] = (S.regularDeals[c.ctype.type] || 0) + 1; // 단골 카운트
  S.gold -= price;
  S.stats.buyRatioSum += price / c.V;
  S.purchases.push({ item: c.item, V: c.V, price, jackpot: c.jackpot, stolen: c.stolen });
  updateHUD();
  sndGood();
  const cheap = price <= c.asking * 0.6;
  showModal(`
    <h2 class="good">🤝 거래 성사!</h2>
    <div class="speech">${pick(HAGGLE_LINES[tone])}</div>
    <p>${c.item.emoji} ${c.item.name}을(를) <b class="accent">${fmt(price)} G</b>에 매입했다${cheap ? ' — 요구가를 크게 후려쳤다!' : ''}</p>
    <p class="dim" style="font-size:13px">진짜 가치는 <b>저녁 정산</b>에서 판명된다. ${c.stolen ? '' : '두근두근...'}</p>
    ${S.regularDeals[c.ctype.type] === CONFIG.REGULAR_DEALS_REQ ? `<p class="accent">⭐ ${c.ctype.type} 사이에 좋은 소문이 났다 — 이제 단골이다! (최저 수락가 −5%p)</p>` : ''}
    <div class="center"><button onclick="nextCustomer()">다음 →</button></div>`);
}

// 흥정 결렬: 손님이 박차고 나간다 — 진상은 여기서 공개 (실패에서 배운다)

function walkOut(c, lastX) {
  S.haggle = null;
  S.stats.rejected++;
  sndBad();
  showModal(`
    <h2 class="bad">💢 흥정 결렬!</h2>
    <div class="speech">"${c.ctype.angry}"</div>
    <p>${c.name}(${c.ctype.type})이(가) 물건을 챙겨 박차고 나갔다.</p>
    <table style="margin:10px 0">
      <tr><td>내 마지막 제시가</td><td>${fmt(lastX)} G</td></tr>
      <tr><td>손님의 최저 수락가</td><td class="bad">${fmt(c.M)} G</td></tr>
      <tr><td>진짜 가치</td><td class="accent">${fmt(c.V)} G${c.jackpot ? ' (사실은 숨은 진품이었다...!)' : ''}</td></tr>
    </table>
    ${c.stolen ? '<p class="dim">💡 사실 이 물건은 장물이었다 — 안 산 게 다행일지도.</p>' : ''}
    ${c.hasTrap ? `<p class="dim">💡 힌트 중 하나는 함정이었다: "${c.hints.find(h => h.trap).text}"</p>` : ''}
    <div class="center"><button onclick="nextCustomer()">다음 →</button></div>`);
}


function passCustomer() {
  sndClick();
  const c = S.customers[S.custIdx];
  showModal(`
    <h2>🚪 매입 포기</h2>
    <p>${c.name}이(가) 물건을 도로 챙겨 떠났다.</p>
    <p class="dim">진짜 가치는 ${fmt(c.V)} G였다.</p>
    <div class="center"><button onclick="nextCustomer()">다음 →</button></div>`);
}

Object.assign(globalThis, { haggleSay, makeOffer, acceptDemand, closeDeal, walkOut, passCustomer });
export { haggleSay, makeOffer, acceptDemand, closeDeal, walkOut, passCustomer };

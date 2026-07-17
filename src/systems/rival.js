// [2막 신규] 🏪 라이벌 밀봉 입찰 — 흥정(다회 밀당)과 정반대의 결정 구조.
// 단 한 번만 부른다. 라이벌 입찰가는 끝까지 안 보이고, 성향 힌트로만 추정한다.
//   너무 낮으면 → 라이벌이 가져간다 (기회 상실)
//   너무 높으면 → 낙찰돼도 손해 (승자의 저주)
// 흥정 엔진(보존 대상)은 건드리지 않는다 — 별도 경로다.

// 입찰 확정. X = 내 입찰가
function submitBid() {
  const c = S.customers[S.custIdx];
  if (!c || !c.rival || c.bidDone) return;
  const X = clamp(Math.round((+($('bid-input').value) || 0) / 100) * 100, 100, 999999);
  if (X > S.gold) return;
  c.bidDone = true;
  S.haggle = null;

  const reveal = `
    <table style="margin:10px 0">
      <tr><td>내 입찰가</td><td>${fmt(X)} G</td></tr>
      <tr><td>${RIVAL.emoji} 황금손 입찰가</td><td class="accent">${fmt(c.rivalBid)} G</td></tr>
      <tr><td>손님의 최저 수락가</td><td>${fmt(c.M)} G</td></tr>
      <tr><td>진짜 가치</td><td class="accent">${fmt(c.V)} G${c.jackpot ? ' (숨은 진품이었다...!)' : ''}</td></tr>
    </table>`;

  // ① 둘 다 최저가 미달 — 손님이 그냥 물건을 도로 챙긴다
  if (X < c.M && c.rivalBid < c.M) {
    S.stats.rejected++;
    S.stats.dealStreak = 0;
    sndHaggleFail();
    setCustMood('angry');
    showModal(`
      <h2 class="bad">🚪 둘 다 퇴짜</h2>
      <div class="speech">"${c.ctype.angry}"</div>
      <p>${c.name}이(가) 코웃음을 치며 물건을 도로 챙겼다. 황금손도 값을 못 맞췄다.</p>
      ${reveal}
      <div class="center"><button onclick="nextCustomer()">다음 →</button></div>`);
    return;
  }
  // ② 라이벌에게 뺏겼다 (내 입찰이 낮거나, 최저가 미달)
  if (X < c.rivalBid || X < c.M) {
    S.stats.rejected++;
    S.stats.dealStreak = 0;
    S.stats.rivalLost = (S.stats.rivalLost || 0) + 1;
    sndHaggleFail();
    setCustMood('angry');
    const why = X < c.M ? '내 입찰가가 손님의 최저선에도 못 미쳤다.' : '한 끗 차이로 밀렸다.';
    showModal(`
      <h2 class="bad">🏪 황금손에 뺏겼다!</h2>
      <div class="speech">"${pick(RIVAL_LINES.lose)}" — ${RIVAL.boss}</div>
      <p>${c.name}은(는) 물건을 들고 옆 골목으로 걸어갔다. ${why}</p>
      ${reveal}
      <p class="dim" style="font-size:13px">💡 ${X < c.rivalBid && c.rivalBid > c.V
        ? '나사장이 무리했다 — 저 값이면 황금손이 손해다. 안 뺏긴 게 나을 수도.'
        : '나사장의 성향을 읽으면 다음엔 이길 수 있다.'}</p>
      <div class="center"><button onclick="nextCustomer()">다음 →</button></div>`);
    return;
  }
  // ③ 낙찰 — 매입 처리는 흥정과 동일한 경로(closeDeal)를 타서 통계·업적이 어긋나지 않게 한다
  S.stats.rivalWon = (S.stats.rivalWon || 0) + 1;
  if (S.stats.rivalWon >= 5) achieve('rival-5');
  const margin = X - c.rivalBid;
  closeDeal(c, X, 'accept');
  // closeDeal이 띄운 모달을 입찰 결과 화면으로 교체 (매입 처리는 그대로 둔다)
  showModal(`
    <h2 class="good">🏆 낙찰!</h2>
    <div class="speech">"${pick(RIVAL_LINES.win)}" — ${RIVAL.boss}</div>
    <p>${c.item.emoji} ${c.item.name}을(를) <b class="accent">${fmt(X)} G</b>에 낙찰받았다
       — 황금손보다 <b>${fmt(margin)} G</b> 높게 불렀다.</p>
    ${reveal}
    <p class="dim" style="font-size:13px">${margin > c.V * 0.25
      ? '⚠️ 너무 세게 불렀다. 이 정도 차이면 그냥 흥정이 나았을 것이다 (승자의 저주).'
      : '👍 아슬아슬하게 이겼다 — 딱 필요한 만큼만 불렀다.'}</p>
    <div class="center"><button onclick="nextCustomer()">다음 →</button></div>`);
}

Object.assign(globalThis, { submitBid });
export { submitBid };

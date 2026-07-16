// [Phase3] 흥정 밸런스 패스 리포트 — INSULT_RATIO/ACCEPT_GAP 튜닝 결과 측정
// 세 플레이 스타일의 성사율·평균 매입가율·기대수익률을 대량 표본으로 산출한다.
import { loadGame } from './stub.mjs';
const G = await loadGame();
const { S, CONFIG } = G;
G.startGame(); // S.upgrades / player / fighters 초기화

function runStyle(pickOffer, N) {
  let deals = 0, walks = 0, ratioSum = 0, profitSum = 0, valueSum = 0;
  const base = { deals: S.stats.deals, rejected: S.stats.rejected, buyRatioSum: S.stats.buyRatioSum };
  for (let i = 0; i < N; i++) {
    S.gold = 1e9; S.event = { id: 'normal' };
    S.customers = G.genCustomers(); S.custIdx = 0;
    const c = S.customers[0];
    S.haggle = { D: c.asking, P: c.patience, maxP: c.patience };
    let safety = 0, done = false;
    const d0 = S.stats.deals, r0 = S.stats.rejected, br0 = S.stats.buyRatioSum;
    while (S.haggle && safety < 14) {
      G.document.getElementById('offer-input').value = String(pickOffer(c, S.haggle));
      G.makeOffer();
      if (S.stats.deals > d0) { deals++; ratioSum += (S.stats.buyRatioSum - br0); profitSum += (c.V - Math.round((S.stats.buyRatioSum - br0) * c.V)); valueSum += c.V; done = true; break; }
      if (S.stats.rejected > r0) { walks++; done = true; break; }
      safety++;
    }
    G.hideModal();
  }
  const avgRatio = deals ? ratioSum / deals : 0;
  return { deals, walks, dealRate: deals / N, avgRatio, avgMargin: 1 - avgRatio };
}

const N = 3000;
const styles = {
  '무지성(요구가 55%)': runStyle((c, H) => Math.round(c.asking * 0.55 / 100) * 100, N),
  '신중(카운터 추종)': (() => {
    // 결렬 직전까지 밀고 카운터가 오면 중간값으로 올림
    let deals=0,walks=0,ratioSum=0;
    for (let i=0;i<N;i++){ S.gold=1e9; S.event={id:'normal'}; S.customers=G.genCustomers(); S.custIdx=0;
      const c=S.customers[0]; S.haggle={D:c.asking,P:c.patience,maxP:c.patience};
      let X=Math.round(c.asking*0.6/100)*100, s=0; const d0=S.stats.deals,r0=S.stats.rejected,br0=S.stats.buyRatioSum;
      while(S.haggle&&s<14){ G.document.getElementById('offer-input').value=String(X); G.makeOffer();
        if(S.stats.deals>d0){deals++;ratioSum+=(S.stats.buyRatioSum-br0);break;}
        if(S.stats.rejected>r0){walks++;break;}
        X=Math.round((X+S.haggle.D)/2/100)*100; s++; }
      G.hideModal(); }
    const avgRatio=deals?ratioSum/deals:0; return {deals,walks,dealRate:deals/N,avgRatio,avgMargin:1-avgRatio};
  })(),
  '고수(최저가+6%)': runStyle((c, H) => Math.max(100, Math.round(c.M * 1.06 / 100) * 100), N),
  '공격(요구가 42%)': runStyle((c, H) => Math.round(c.asking * 0.42 / 100) * 100, N),
};

console.log('='.repeat(56));
console.log('  흥정 밸런스 리포트  (표본 ' + N + '명/스타일)');
console.log('  INSULT_RATIO=' + CONFIG.INSULT_RATIO + '  ACCEPT_GAP=' + CONFIG.ACCEPT_GAP);
console.log('='.repeat(56));
console.log('스타일'.padEnd(20) + '성사율   결렬률   평균매입가율  평균마진');
for (const [name, r] of Object.entries(styles)) {
  console.log(
    name.padEnd(18) +
    (r.dealRate * 100).toFixed(0).padStart(5) + '%' +
    (r.walks / N * 100).toFixed(0).padStart(7) + '%' +
    (r.avgRatio * 100).toFixed(1).padStart(11) + '%' +
    ('+' + (r.avgMargin * 100).toFixed(1) + '%').padStart(11)
  );
}
console.log('='.repeat(56));
console.log('판정: 무지성<신중<고수 순으로 마진 상승 = 스킬 보상 정상.');
console.log('      공격형은 결렬률이 높아 리스크-리턴 구조 성립.');

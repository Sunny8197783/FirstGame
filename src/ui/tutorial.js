// [신규] 🎓 단계별 튜토리얼 — 1일차 첫 손님에서 화면 요소를 하나씩 짚어 준다.
// 설계: ① 진행을 막지 않는다(언제든 건너뛰기) ② 한 단계에 한 가지만 말한다(벽텍스트 금지)
//       ③ 정답을 알려주지 않는다 — '어디를 보라'까지만. 판단은 플레이어 몫이다.
const TUT_KEY = 'pawnshop_tutorial_v1';

// anchor: 스포트라이트를 씌울 요소. 없으면 그 단계는 건너뛴다.
const TUT_DAY = [
  { anchor: '.walk-in', title: '손님이 왔다',
    text: '손님마다 <b>성격이 다르다</b>. 급한 사람은 값을 깎아주고, 깐깐한 사람은 버틴다. 수상한 부류는 거짓말을 섞는다.' },
  { anchor: '.item-stage', title: '물건을 본다',
    text: '이 물건의 <b>진짜 가치</b>는 아무도 안 알려준다. 시세 범위 안 어딘가에 있고, 그걸 맞히는 게 이 게임의 전부다.' },
  { anchor: '.inspect', title: '실물 검수',
    text: '부위별 상태다. <b>●가 많을수록 상급</b> → 진짜 가치가 시세 상단일 확률이 높다.' },
  { anchor: '.hint', title: '손님의 말 — 함정 주의',
    text: '👁️ 힌트는 단서지만 <b>거짓이 섞인다</b>. 검수(●)와 말이 어긋나면, 둘 중 하나는 거짓말이다.' },
  { anchor: '#hg-demand', title: '요구가',
    text: '손님이 부른 값이다. <b>여기서 깎아야 남는다.</b> 요구가에 그냥 사면 거의 안 남는다.' },
  { anchor: '#btn-offer', title: '밀당',
    text: '낮게 부를수록 남지만, <b>너무 후려치면 ❤️가 깎이고 떠난다</b>. 손님의 최저선을 찾아라.' },
  { anchor: '#hud-gold', title: '채점은 저녁에',
    text: '진짜 가치는 <b>저녁 정산</b>에서 공개된다. 싸게 샀다면 이익, 비싸게 샀다면 손실 — 낮의 판단이 거기서 채점된다.' },
  { anchor: '#hud-debt', title: '시간이 없다',
    text: '김사장의 빚에 <b>매일 이자 5%</b>가 붙는다. 7일차까지 못 갚으면 가게를 뺏긴다. 이제 시작하자.' },
];

let tutDone = {};
try { tutDone = JSON.parse(localStorage.getItem(TUT_KEY) || '{}') || {}; } catch (e) { tutDone = {}; }
function persistTut() { try { localStorage.setItem(TUT_KEY, JSON.stringify(tutDone)); } catch (e) { /* 무시 */ } }
function resetTutorial() { tutDone = {}; persistTut(); }

let tutSteps = [], tutIdx = 0;

// 1일차 첫 손님에서 한 번만
function maybeTutorial(id, steps) {
  if (tutDone[id] || S.day > 1 || S.custIdx > 0) return;
  tutDone[id] = true; persistTut();
  setTimeout(() => startTutorial(steps), 500); // 등장 연출이 끝난 뒤 위치를 잰다
}

function startTutorial(steps) {
  tutSteps = steps.filter(s => document.querySelector(s.anchor)); // 없는 앵커는 통째로 건너뛴다
  if (!tutSteps.length) return;
  tutIdx = 0;
  let el = $('tut');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tut';
    document.body.appendChild(el);
  }
  el.innerHTML = '<div class="tut-hole" id="tut-hole"></div><div class="tut-box" id="tut-box"></div>';
  el.classList.add('show');
  renderTutStep();
}

function renderTutStep() {
  const s = tutSteps[tutIdx];
  if (!s) { endTutorial(); return; }
  const anchor = document.querySelector(s.anchor);
  if (!anchor) { tutNext(); return; }
  const r = anchor.getBoundingClientRect();
  const pad = 6;
  const hole = $('tut-hole'), box = $('tut-box');
  if (!hole || !box) return;
  hole.style.left = (r.left - pad) + 'px';
  hole.style.top = (r.top + window.scrollY - pad) + 'px';
  hole.style.width = (r.width + pad * 2) + 'px';
  hole.style.height = (r.height + pad * 2) + 'px';

  box.innerHTML = `
    <div class="tut-step">${tutIdx + 1} / ${tutSteps.length}</div>
    <h3 class="accent" style="font-size:16px">${s.title}</h3>
    <p style="font-size:14px; line-height:1.7; margin-top:4px">${s.text}</p>
    <div class="tut-btns">
      <button class="btn-ghost" onclick="endTutorial()" style="font-size:12px; padding:6px 10px">건너뛰기</button>
      <button class="btn-big" onclick="tutNext()" style="font-size:15px; padding:8px 18px">
        ${tutIdx === tutSteps.length - 1 ? '시작하자 ▸' : '다음 ▸'}</button>
    </div>`;

  // 말풍선은 스포트라이트 아래에 두되, 화면 밖으로 나가면 위로 접는다
  const bw = Math.min(320, window.innerWidth - 24);
  box.style.width = bw + 'px';
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(12, Math.min(window.innerWidth - bw - 12, left));
  let top = r.bottom + window.scrollY + 14;
  if (top + 190 > window.scrollY + window.innerHeight) top = r.top + window.scrollY - 190;
  box.style.left = left + 'px';
  box.style.top = Math.max(window.scrollY + 8, top) + 'px';
}

function tutNext() {
  sndClick();
  tutIdx++;
  if (tutIdx >= tutSteps.length) { endTutorial(); return; }
  renderTutStep();
}

function endTutorial() {
  const el = $('tut');
  if (el) { el.classList.remove('show'); el.innerHTML = ''; }
  tutSteps = []; tutIdx = 0;
}

/* ── ❓ 플레이 방법 — 언제든 열어보는 참조 문서 (튜토리얼과 별개) ── */
function renderHowTo() {
  sndClick();
  showModal(`
    <h2 class="accent">❓ 플레이 방법</h2>
    <div class="modal-scroll">
      <p style="font-size:14px"><b>한 줄 요약: 정보를 읽는 판단력이 곧 수익이다.</b>
        방치하면 1G도 늘지 않는다.</p>

      <h3 style="font-size:15px; margin-top:12px">☀️ 낮 — 전당포</h3>
      <ul style="font-size:13px; padding-left:18px; line-height:1.8">
        <li>손님이 <b>요구가</b>를 부른다. 깎을수록 남지만 <b>너무 후려치면 떠난다</b>(❤️ 인내심).</li>
        <li>단서는 둘: <b>실물 검수(●)</b>와 <b>구두 힌트(👁️)</b>. 힌트엔 <b>함정이 섞인다</b> — 둘이 어긋나면 의심하라.</li>
        <li>🎉 숨은 진품(가치 ×2)과 🚨 장물(압수 위험)이 드물게 섞인다.</li>
        <li><b>진짜 가치는 저녁에 공개된다</b> — 낮의 판단이 거기서 채점된다.</li>
      </ul>

      <h3 style="font-size:15px; margin-top:12px">🌙 밤 — 지하 격투장</h3>
      <ul style="font-size:13px; padding-left:18px; line-height:1.8">
        <li>배당은 <b>하우스의 추정</b>으로 정해진다. 하우스는 <b>소문을 모른다</b> — 그게 당신의 우위다.</li>
        <li>같은 아이콘 소문이 <b>겹치면 사실</b>, 반대로 <b>충돌하면 최소 하나는 거짓</b>이다.</li>
        <li>2경기 뒤엔 <b>직접 출전</b>도 가능하다(러시 &gt; 견제 &gt; 카운터 &gt; 러시).</li>
      </ul>

      <h3 style="font-size:15px; margin-top:12px">🌌 새벽 — 암시장</h3>
      <ul style="font-size:13px; padding-left:18px; line-height:1.8">
        <li>빚을 갚거나, 감정 도구를 사거나, 파이터를 후원한다. <b>저장도 여기서</b>.</li>
      </ul>

      <h3 style="font-size:15px; margin-top:12px">🗓️ 3막 21일</h3>
      <ul style="font-size:13px; padding-left:18px; line-height:1.8">
        <li><b>1막(1~7일)</b> 김사장의 빚 — 8일 아침에 강제 회수. 못 갚으면 끝.</li>
        <li><b>2막(8~14일)</b> 회장의 시험(순자산 ${fmt(CONFIG.ACT2_TARGET)} G). 🏪 라이벌이 <b>밀봉 입찰</b>로 손님을 채간다.</li>
        <li><b>3막(15~21일)</b> 🔨 경매의 날(공개 호가 경쟁). 21일 밤 그랜드 파이널.</li>
      </ul>

      <h3 style="font-size:15px; margin-top:12px">📖 감정안 (회차를 넘어 성장)</h3>
      <ul style="font-size:13px; padding-left:18px; line-height:1.8">
        <li>물건을 감정할수록 그 <b>분야 감정안</b>이 오른다(6분야). 새 게임에도 <b>영구히 남는다</b>.</li>
        <li>레벨이 오르면 그 분야가 <b>더 잘 보인다</b> — 검수 오차↓·가치 위치·함정 감지. 정답이 아니라 눈이다.</li>
        <li>한 분야를 <b>만렙</b>으로 키우면, 그 분야 <b>🎖️ 명품</b>을 든 손님이 찾아온다 — 한 방이 크지만 위작도 정교하다.</li>
      </ul>

      <h3 style="font-size:15px; margin-top:12px">💡 막히면</h3>
      <ul style="font-size:13px; padding-left:18px; line-height:1.8">
        <li>돈이 마르면 아침에 <b>💪 알바</b> 선택지가 뜬다 — 확정 수익이지만 그날 장사는 못 한다.</li>
        <li><b>[D]</b> 디버그 패널로 정답(진짜 가치·소문 진위)을 보며 감을 잡을 수 있다.</li>
      </ul>

      <p class="dim" style="font-size:12px; margin-top:10px">
        ⌨️ SPACE 스킵 · Enter 주요 행동 · Esc 창 닫기 · D 디버그</p>
    </div>
    <div class="center" style="margin-top:8px"><button onclick="hideModal()">닫기</button></div>`);
}

Object.assign(globalThis, {
  TUT_DAY, maybeTutorial, startTutorial, renderTutStep, tutNext, endTutorial, resetTutorial, renderHowTo,
});
export { TUT_DAY, maybeTutorial, startTutorial, tutNext, endTutorial, resetTutorial, renderHowTo };

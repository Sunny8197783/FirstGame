// 브라우저 엔트리 — 스타일 + 게임 전체 배럴을 로드하고 타이틀로 진입
import './style.css';
import './game.js';

// 데모의 최상위 초기 호출을 이식: 모든 모듈 로드 후 타이틀 렌더
applySettings(); // [Phase2] 폰트 크기·흔들림 설정 반영
initFlow();      // [Phase2] 스페이스 전역 스킵 리스너
renderTitle();

#!/usr/bin/env node
// [아트 생성] public/art/ 에 일러스트를 채우는 로컬 배치 생성기.
//
// ⚠️ API 키는 이 스크립트가 만들지도, 저장하지도 않는다. 오직 '네 컴퓨터의 환경변수'에서만 읽는다.
//    키는 저장소(git)에 절대 들어가지 않는다.
//
// 사용법 (PowerShell):
//   $env:OPENAI_API_KEY = "sk-..."         # 네 키를 환경변수로 (이 창에서만 유효)
//   node scripts/gen-art.mjs --dry          # 무엇을 만들지 미리보기(API 호출 없음)
//   node scripts/gen-art.mjs items          # items 카테고리 전부(이미 있는 파일은 건너뜀)
//   node scripts/gen-art.mjs items/pocket-watch   # 한 장만
//   node scripts/gen-art.mjs --force        # 이미 있어도 다시 생성
//   node scripts/gen-art.mjs --limit 5      # 이번 실행에서 최대 5장만
//
// 환경변수:
//   OPENAI_API_KEY (또는 ART_API_KEY)  — 필수(‑‑dry 제외)
//   ART_MODEL     기본 gpt-image-1
//   ART_SIZE      기본 1024x1024
//   ART_ENDPOINT  기본 https://api.openai.com/v1/images/generations
//   ART_QUALITY   기본 medium (gpt-image-1: low|medium|high)
//
// 다른 제공자(Replicate 등)를 쓰려면 callImageAPI()만 교체하면 된다.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allAssets } from './art-prompts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/art');
const EXT = 'png';

const API_KEY = process.env.OPENAI_API_KEY || process.env.ART_API_KEY || '';
const MODEL = process.env.ART_MODEL || 'gpt-image-1';
const SIZE = process.env.ART_SIZE || '1024x1024';
const ENDPOINT = process.env.ART_ENDPOINT || 'https://api.openai.com/v1/images/generations';
const QUALITY = process.env.ART_QUALITY || 'medium';

// ── CLI 인자 ──
const args = process.argv.slice(2);
const flags = { force: false, dry: false, limit: Infinity };
const filters = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--force') flags.force = true;
  else if (a === '--dry' || a === '--dry-run') flags.dry = true;
  else if (a === '--limit') flags.limit = parseInt(args[++i], 10) || Infinity;
  else if (a.startsWith('--')) { console.error(`알 수 없는 옵션: ${a}`); process.exit(1); }
  else filters.push(a.replace(':', '/')); // items:pocket-watch 도 허용
}

// 필터 매칭: "items" (카테고리 전체) 또는 "items/pocket-watch" (한 장)
function matches(asset) {
  if (!filters.length) return true;
  return filters.some(f => f === asset.kind || f === `${asset.kind}/${asset.slug}`);
}

async function exists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── 이미지 API 호출 (OpenAI Images) — b64 또는 url 응답 모두 처리 ──
async function callImageAPI(prompt) {
  const body = {
    model: MODEL, prompt, size: SIZE, n: 1,
    // gpt-image-1: 투명 배경 + 품질 지원. DALL·E엔 무시되거나 에러날 수 있어 모델별로 감싼다.
    ...(MODEL.startsWith('gpt-image') ? { background: 'transparent', quality: QUALITY } : { response_format: 'b64_json' }),
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const err = new Error(`API ${res.status}: ${txt.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const d = json.data && json.data[0];
  if (d && d.b64_json) return Buffer.from(d.b64_json, 'base64');
  if (d && d.url) { // 일부 모델은 URL만 준다
    const img = await fetch(d.url);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error('응답에 이미지 데이터가 없다: ' + JSON.stringify(json).slice(0, 200));
}

// 429/5xx는 지수 백오프로 재시도
async function generateWithRetry(prompt, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try { return await callImageAPI(prompt); }
    catch (e) {
      const retryable = e.status === 429 || (e.status >= 500 && e.status < 600) || e.code === 'ETIMEDOUT';
      if (!retryable || attempt >= tries) throw e;
      const wait = 2000 * attempt;
      console.log(`   ⏳ ${e.status || e.code} — ${wait / 1000}s 후 재시도 (${attempt}/${tries - 1})`);
      await sleep(wait);
    }
  }
}

async function main() {
  const targets = allAssets().filter(matches);
  if (!targets.length) {
    console.error('일치하는 대상이 없다. 예) node scripts/gen-art.mjs items  |  items/pocket-watch');
    process.exit(1);
  }

  // 이미 있는 파일 집계
  const plan = [];
  for (const t of targets) {
    const path = resolve(OUT_DIR, t.kind, `${t.slug}.${EXT}`);
    const has = await exists(path);
    plan.push({ ...t, path, skip: has && !flags.force });
  }
  const todo = plan.filter(p => !p.skip).slice(0, flags.limit);
  const skipped = plan.filter(p => p.skip).length;

  console.log(`\n🎨 아트 생성 — 대상 ${plan.length}장 · 생성 ${todo.length}장 · 건너뜀(이미 있음) ${skipped}장`);
  console.log(`   모델 ${MODEL} · 크기 ${SIZE} · 저장 위치 public/art/<kind>/<slug>.png`);

  if (flags.dry) {
    console.log('\n[--dry] 실제 호출 없음. 만들 목록:');
    todo.forEach(t => console.log(`   ${t.kind}/${t.slug}`));
    console.log('\n키를 넣고 --dry 없이 다시 실행하면 생성한다.');
    return;
  }
  if (!API_KEY) {
    console.error('\n❌ API 키가 없다. 환경변수를 설정하라:');
    console.error('   PowerShell:  $env:OPENAI_API_KEY = "sk-..."');
    console.error('   그리고 다시 실행. (키는 저장소에 저장되지 않는다)');
    process.exit(1);
  }
  if (!todo.length) { console.log('\n✅ 새로 만들 게 없다. (‑‑force 로 재생성 가능)'); return; }

  console.log(`\n⚠️ 이미지 ${todo.length}장을 유료 API로 생성한다. 중단하려면 Ctrl+C.\n`);
  let ok = 0, fail = 0;
  for (let i = 0; i < todo.length; i++) {
    const t = todo[i];
    process.stdout.write(`(${i + 1}/${todo.length}) ${t.kind}/${t.slug} ... `);
    try {
      await mkdir(dirname(t.path), { recursive: true });
      const buf = await generateWithRetry(t.prompt);
      await writeFile(t.path, buf);
      console.log(`✅ ${(buf.length / 1024).toFixed(0)}KB`);
      ok++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      fail++;
    }
    await sleep(400); // 가벼운 레이트리밋 완충
  }
  console.log(`\n완료 — 성공 ${ok} · 실패 ${fail}. public/art/ 를 확인하고 게임을 새로고침하라.`);
  if (fail) process.exitCode = 1;
}

main().catch(e => { console.error('치명적 오류:', e); process.exit(1); });

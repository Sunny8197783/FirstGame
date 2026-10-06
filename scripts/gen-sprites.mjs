#!/usr/bin/env node
// [링 스프라이트] 격투가 64px 옆모습 스프라이트시트 생성기 (PixelLab).
//   베이스(pixflux) → 관절 추정(estimate-skeleton) → 관절 좌표로 포즈 지정(animate-with-skeleton)
//   animate-with-text는 킥에서 형태가 무너져서 쓰지 않는다. 관절 좌표로 주면 정체성이 유지된다.
//
// 출력: public/art/sprites/<slug>.png — 64px 프레임 7칸 가로 시트
//   0 기본 | 1 펀치 준비 | 2 펀치 | 3 킥 접기 | 4 킥 | 5 피격 | 6 크게 피격
// 중간물(베이스·관절·포즈 프레임)은 scripts/.sprite-cache/<slug>/ 에 남겨 포즈 하나만 다시 뽑을 수 있다.
//
// 사용법 (PowerShell, 키는 환경변수에서만 읽는다 — 저장소에 들어가지 않는다):
//   $env:PIXELLAB_API_KEY = "..."
//   node scripts/gen-sprites.mjs                    # 없는 것만 전부
//   node scripts/gen-sprites.mjs fighter-tank       # 한 명
//   node scripts/gen-sprites.mjs fighter-tank --pose kick   # 캐시된 베이스로 킥만 다시
//   node scripts/gen-sprites.mjs --force            # 베이스부터 전부 다시
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync, deflateSync, crc32 } from 'node:zlib';
import { SPRITE_PROMPTS } from './art-prompts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/art/sprites');
const CACHE = resolve(ROOT, 'scripts/.sprite-cache');
const KEY = process.env.PIXELLAB_API_KEY || '';
const SZ = { width: 64, height: 64 };

// ── 최소 PNG 디코더/인코더 (8bit RGBA/RGB, 비인터레이스) — 의존성 없이 node:zlib만 ──
function decodePNG(buf) {
  let p = 8, w, h, ct; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9];
      if (d[8] !== 8 || d[12] !== 0 || (ct !== 6 && ct !== 2)) throw new Error(`지원 안 하는 PNG (depth ${d[8]}, color ${ct})`); }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4), prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) px[(y * w + x) * 4 + k] = k < bpp ? cur[x * bpp + k] : 255;
    cur.copy(prev);
  }
  return { w, h, px };
}
function encodePNG({ w, h, px }) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (type, data) => {
    const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, 'ascii'); data.copy(b, 8);
    b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length); return b;
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// 프레임들을 가로로 이어 붙인다 (scale = 정수 확대, 미리보기용)
function hstack(frames, scale = 1) {
  const fw = frames[0].w, fh = frames[0].h, W = fw * frames.length * scale, H = fh * scale, px = Buffer.alloc(W * H * 4);
  frames.forEach((f, i) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < fw * scale; x++) {
      const s = (((y / scale) | 0) * fw + ((x / scale) | 0)) * 4;
      f.px.copy(px, (y * W + i * fw * scale + x) * 4, s, s + 4);
    }
  });
  return { w: W, h: H, px };
}

// ── API ──
async function post(path, body, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch('https://api.pixellab.ai/v1' + path, { method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(`${path} ${r.status}: ${JSON.stringify(j).slice(0, 300)}`); e.status = r.status; throw e; }
      return j;
    } catch (e) {
      const retryable = !e.status || e.status === 429 || e.status >= 500;
      if (!retryable || attempt >= tries) throw e;
      console.log(`   ⏳ ${e.status || 'network'} — ${2 * attempt}s 후 재시도`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}
const img = b64 => ({ type: 'base64', base64: b64 });

// ── 포즈: 기본 관절에서 앞쪽 팔/다리(오른쪽=east를 보므로 x가 큰 쪽)만 옮긴다 ──
// over = { 'F ELBOW': [기준관절, dx, dy] } — 'F'는 앞쪽 L/R로 치환. lean = 상체 전체 x 이동.
const POSES = {
  punch: [{}, { 'F ELBOW': ['F SHOULDER', 0.02, 0.12], 'F ARM': ['F SHOULDER', 0.10, 0.06], lean: 0.02 },
              { 'F ELBOW': ['F SHOULDER', 0.15, 0.02], 'F ARM': ['F SHOULDER', 0.30, 0.01], lean: 0.05 }],
  kick:  [{}, { 'F KNEE': ['F HIP', 0.12, -0.04], 'F LEG': ['F HIP', 0.10, 0.14], lean: -0.03 },
              { 'F KNEE': ['F HIP', 0.18, -0.04], 'F LEG': ['F HIP', 0.34, -0.07], lean: -0.06 }],
  hurt:  [{}, { 'F ELBOW': ['F SHOULDER', 0.02, 0.14], 'F ARM': ['F SHOULDER', 0.05, 0.24], lean: -0.05 },
              { 'F ELBOW': ['F SHOULDER', -0.02, 0.15], 'F ARM': ['F SHOULDER', 0.0, 0.26], lean: -0.10 }],
};
function poseFrames(skel, name) {
  const get = l => skel.find(k => k.label === l);
  const need = l => { const k = get(l); if (!k) throw new Error(`관절 ${l} 없음 — 베이스를 다시 뽑아라 (--force)`); return k; };
  const front = need('LEFT HIP').x >= need('RIGHT HIP').x ? 'LEFT' : 'RIGHT';
  const frontArm = need('LEFT SHOULDER').x >= need('RIGHT SHOULDER').x ? 'LEFT' : 'RIGHT';
  const lab = s => s.replace(/^F (SHOULDER|ELBOW|ARM)$/, `${frontArm} $1`).replace(/^F (HIP|KNEE|LEG)$/, `${front} $1`);
  const clamp = v => Math.min(0.98, Math.max(0.02, v));
  return POSES[name].map(({ lean = 0, ...over }) => {
    const moved = Object.fromEntries(Object.entries(over).map(([k, [ref, dx, dy]]) => [lab(k), [need(lab(ref)), dx, dy]]));
    return skel.map(k => {
      if (moved[k.label]) { const [r, dx, dy] = moved[k.label]; return { ...k, x: clamp(r.x + dx + lean), y: clamp(r.y + dy) }; }
      const upper = /NOSE|EYE|EAR|NECK|SHOULDER|ELBOW|ARM/.test(k.label);
      return { ...k, x: clamp(k.x + (upper ? lean : 0)) };
    });
  });
}

const exists = p => access(p).then(() => true, () => false);

async function build(slug, { force, pose }) {
  const dir = resolve(CACHE, slug); await mkdir(dir, { recursive: true });
  const basePath = resolve(dir, 'base.png'), skelPath = resolve(dir, 'skel.json');
  if (force || !(await exists(basePath))) {
    const j = await post('/generate-image-pixflux', {
      description: `${SPRITE_PROMPTS[slug]}, full body, side view, fighting guard stance, facing right`,
      negative_description: 'weapon, shield, prop, text, multiple characters',
      image_size: SZ, view: 'side', direction: 'east', no_background: true,
      outline: 'single color black outline', shading: 'medium shading', detail: 'highly detailed' });
    await writeFile(basePath, Buffer.from(j.image.base64, 'base64'));
    force = true; // 베이스가 바뀌면 관절·포즈도 다시
  }
  const baseB64 = (await readFile(basePath)).toString('base64');
  if (force || !(await exists(skelPath))) {
    const j = await post('/estimate-skeleton', { image: img(baseB64) });
    await writeFile(skelPath, JSON.stringify(j.keypoints));
  }
  const skel = JSON.parse(await readFile(skelPath, 'utf8'));
  await Promise.all(Object.keys(POSES).map(async name => {
    const p = resolve(dir, `${name}.json`);
    if (!force && pose !== name && await exists(p)) return;
    const j = await post('/animate-with-skeleton', { image_size: SZ, view: 'side', direction: 'east', guidance_scale: 4,
      reference_image: img(baseB64), skeleton_keypoints: poseFrames(skel, name) });
    await writeFile(p, JSON.stringify(j.images.map(i => i.base64)));
  }));
  const pf = async name => JSON.parse(await readFile(resolve(dir, `${name}.json`), 'utf8')).map(b => decodePNG(Buffer.from(b, 'base64')));
  const [punch, kick, hurt] = await Promise.all(['punch', 'kick', 'hurt'].map(pf));
  const frames = [decodePNG(Buffer.from(baseB64, 'base64')), punch[1], punch[2], kick[1], kick[2], hurt[1], hurt[2]];
  if (frames.some(f => f.w !== 64 || f.h !== 64)) throw new Error('프레임 크기가 64x64가 아니다');
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, `${slug}.png`), encodePNG(hstack(frames)));
  await writeFile(resolve(dir, 'preview-x3.png'), encodePNG(hstack(frames, 3)));
}

const args = process.argv.slice(2);
const flags = { force: args.includes('--force'), pose: args.includes('--pose') ? args[args.indexOf('--pose') + 1] : null };
const slugs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--pose');
const targets = slugs.length ? slugs : Object.keys(SPRITE_PROMPTS);
if (flags.pose && !POSES[flags.pose]) { console.error(`포즈는 ${Object.keys(POSES).join('|')}`); process.exit(1); }
const unknown = targets.filter(s => !SPRITE_PROMPTS[s]);
if (unknown.length) { console.error(`모르는 슬러그: ${unknown.join(', ')}`); process.exit(1); }
if (!KEY) { console.error('❌ PIXELLAB_API_KEY 환경변수가 없다. (키는 저장소에 저장되지 않는다)'); process.exit(1); }

let ok = 0, fail = 0;
for (const slug of targets) {
  if (!flags.force && !flags.pose && await exists(resolve(OUT, `${slug}.png`))) { console.log(`· ${slug} 이미 있음`); continue; }
  process.stdout.write(`🥊 ${slug} ... `);
  try { await build(slug, flags); console.log('✅'); ok++; }
  catch (e) { console.log(`❌ ${e.message}`); fail++; }
}
console.log(`\n완료 — 성공 ${ok} · 실패 ${fail}. 미리보기: scripts/.sprite-cache/<slug>/preview-x3.png`);
if (fail) process.exitCode = 1;

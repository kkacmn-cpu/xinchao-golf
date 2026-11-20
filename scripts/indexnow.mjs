// IndexNow로 빙·네이버(그리고 IndexNow에 참여하는 검색엔진)에 새 페이지·바뀐 페이지 주소를 알린다.
// 풀빌라 저장소(hochiminh-poolvilla/scripts/indexnow.mjs)와 같은 방식, 골프는 2026-11-20 추가.
// 키 파일: public/d5b83e4cf4084a38b2b71a6f9a62c7de.txt → /d5b83e4cf4084a38b2b71a6f9a62c7de.txt
//
//   node scripts/indexnow.mjs --build    Vercel 빌드(vercel.json buildCommand)에서 쓰는 모드: 운영 배포(VERCEL_ENV=production)일 때만 보냄
//   node scripts/indexnow.mjs --dry-run  보내지 않고 대상 목록만 출력
//   node scripts/indexnow.mjs --all      sitemap.xml 주소 전부 보냄
//
// 대상 고르기: 빌드할 때마다 dist/indexnow-state.json(주소별 페이지 내용 해시)을 함께 내보낸다.
// 지금 운영 중인 사이트의 같은 파일(직전 운영 배포)과 비교해 새로 생긴 주소와 내용이 바뀐 주소만 보낸다.
// 직전 파일을 못 받으면(첫 배포·네트워크 실패) sitemap lastmod가 최근 2일 안인 주소만 보낸다(풀빌라 방식).
// 실패해도 종료 코드는 0이다(배포를 막지 않음).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = (process.env.SITE_URL || "https://xinchaogolf.com").trim().replace(/\/+$/, "");
const HOST = new URL(SITE).host;
const KEY = "d5b83e4cf4084a38b2b71a6f9a62c7de";
const ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://searchadvisor.naver.com/indexnow"];
const STATE_FILE = "indexnow-state.json";
const RECENT_DAYS = 2;
const MAX_URLS = 10000;

export function sitemapEntries(sitemapXml) {
  return [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: body.match(/<loc>([^<]+)<\/loc>/)?.[1],
    lastmod: body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
  })).filter((entry) => entry.loc && entry.loc.startsWith(`${SITE}/`));
}

// 주소 → dist 파일: /golf → golf/index.html, /golf/x.html → golf/x.html, / → index.html
export function distFile(loc) {
  const pathname = new URL(loc).pathname;
  if (pathname === "/") return "index.html";
  const clean = pathname.replace(/^\/+/, "");
  if (clean.endsWith(".html")) return clean;
  return existsSync(join(dist, clean, "index.html")) ? `${clean}/index.html` : `${clean}.html`;
}

// 모든 쪽에 같이 바뀌는 CSS·JS 버전 꼬리표(?v=해시)는 빼고 해시한다. 그래야 스타일만 바뀐 배포가 전 주소 제출이 되지 않는다.
export function pageHash(html) {
  return createHash("sha256").update(html.replace(/\?v=[0-9a-f]{8,}/g, "")).digest("hex").slice(0, 16);
}

export function buildState(entries, readHtml) {
  const pages = {};
  for (const { loc } of entries) {
    const html = readHtml(loc);
    if (html !== null) pages[loc] = pageHash(html);
  }
  return { host: HOST, pages };
}

export function pickChanged(current, previous) {
  return Object.keys(current.pages).filter((loc) => previous.pages?.[loc] !== current.pages[loc]);
}

export function pickRecent(entries, today = new Date()) {
  const cutoff = new Date(today.getTime() - RECENT_DAYS * 86400000).toISOString().slice(0, 10);
  return entries.filter((entry) => entry.lastmod && entry.lastmod.slice(0, 10) >= cutoff).map((entry) => entry.loc);
}

async function previousState() {
  try {
    const res = await fetch(`${SITE}/${STATE_FILE}`, { signal: AbortSignal.timeout(15000), headers: { "cache-control": "no-cache" } });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.host === HOST && data.pages ? data : null;
  } catch {
    return null;
  }
}

async function submit(urls) {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(0, MAX_URLS) });
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(15000),
      });
      console.log(`IndexNow ${endpoint}: ${res.status}`);
    } catch (err) {
      console.log(`IndexNow ${endpoint}: 실패 ${err.message}`);
    }
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const entries = sitemapEntries(readFileSync(join(dist, "sitemap.xml"), "utf8"));
  const current = buildState(entries, (loc) => {
    const file = join(dist, distFile(loc));
    return existsSync(file) ? readFileSync(file, "utf8") : null;
  });
  // 다음 운영 배포가 비교할 수 있게 이번 상태를 항상 같이 내보낸다(미리보기 배포에도 있어도 무방).
  writeFileSync(join(dist, STATE_FILE), `${JSON.stringify(current)}\n`);

  if (args.has("--build") && process.env.VERCEL_ENV !== "production") {
    console.log(`IndexNow: 운영 배포가 아니라 보내지 않음 (VERCEL_ENV=${process.env.VERCEL_ENV ?? "없음"})`);
    return;
  }
  let urls;
  if (args.has("--all")) urls = entries.map((entry) => entry.loc);
  else {
    const previous = await previousState();
    urls = previous ? pickChanged(current, previous) : pickRecent(entries);
    console.log(`IndexNow 기준: ${previous ? "직전 운영 배포와 내용 비교" : `직전 상태 없음 → lastmod 최근 ${RECENT_DAYS}일`}`);
  }
  console.log(`IndexNow 대상 ${urls.length}개`);
  if (args.has("--dry-run")) urls.forEach((url) => console.log(`  ${url}`));
  else if (urls.length) await submit(urls);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await main();
  } catch (err) {
    console.log(`IndexNow: 건너뜀 (${err.message})`);
  }
  process.exit(0);
}

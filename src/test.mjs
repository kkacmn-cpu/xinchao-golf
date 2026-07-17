import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarkdownPosts } from "./blog-content.mjs";
import { site } from "./site-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const failures = [];
const markdownPosts = await loadMarkdownPosts(path.join(root, "src/content/blog"));
const expectedContentPages = 44 + markdownPosts.length;
const expectedSitemapUrls = 43 + markdownPosts.length;
const expectedRedirects = 41 + markdownPosts.length;

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (entry.name === "client" && path.resolve(dir) === dist) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await collect(target));
    else output.push(target);
  }
  return output;
}

const files = await collect(dist);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const contentPages = [];
const titles = new Map();

const count = (text, regex) => [...text.matchAll(regex)].length;
const exists = async (target) => { try { await access(target); return true; } catch { return false; } };

for (const file of htmlFiles) {
  const relative = path.relative(dist, file);
  const html = await readFile(file, "utf8");
  const redirect = /http-equiv="refresh"/i.test(html);
  if (!redirect) {
    contentPages.push(relative);
    if (/http:\/\//i.test(html)) failures.push(`${relative}: 비보안 http 링크 존재`);
    if (/신짜오호치민/.test(html)) failures.push(`${relative}: 이전 브랜드명 잔존`);
    const ids = [...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length) failures.push(`${relative}: 중복 id ${[...new Set(duplicateIds)].join(", ")}`);
    for (const [label, regex, expected] of [
      ["title", /<title\b[^>]*>/gi, 1],
      ["description", /<meta\s+name="description"/gi, 1],
      ["canonical", /<link\s+rel="canonical"/gi, 1],
      ["H1", /<h1\b/gi, 1],
      ["OG 제목", /<meta\s+property="og:title"/gi, 1],
      ["OG 이미지 설명", /<meta\s+property="og:image:alt"/gi, 1],
      ["Twitter 제목", /<meta\s+name="twitter:title"/gi, 1],
      ["Twitter 설명", /<meta\s+name="twitter:description"/gi, 1],
      ["Twitter 이미지", /<meta\s+name="twitter:image"/gi, 1],
    ]) {
      const actual = count(html, regex);
      if (actual !== expected) failures.push(`${relative}: ${label} ${actual}개`);
    }
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    if (title) {
      if (titles.has(title)) failures.push(`${relative}: 중복 title (${title})`);
      titles.set(title, relative);
    }
    for (const image of html.matchAll(/<img\b([^>]+)>/gi)) {
      const attrs = image[1];
      for (const attr of ["src", "alt", "width", "height"]) {
        if (!new RegExp(`\\b${attr}=`).test(attrs)) failures.push(`${relative}: 이미지 ${attr} 누락`);
      }
    }
    for (const button of html.matchAll(/<button\b([^>]*)>/gi)) {
      if (!/\btype="(?:button|submit)"/i.test(button[1])) failures.push(`${relative}: type 없는 button`);
    }
    for (const link of html.matchAll(/<a\b([^>]*)\btarget="_blank"([^>]*)>/gi)) {
      const attrs = `${link[1]} ${link[2]}`;
      if (!/\brel="[^"]*noopener[^"]*"/i.test(attrs)) failures.push(`${relative}: 새 창 링크 noopener 누락`);
    }
    for (const consult of html.matchAll(/<button\b([^>]*\bjs-consult\b[^>]*)>/gi)) {
      if (!/\bdata-interest="[^"]+"/i.test(consult[1])) failures.push(`${relative}: 상담 버튼 문의 주제 누락`);
    }
    if (!/id="consult-dialog"/.test(html) || !/id="consult-form"/.test(html)) failures.push(`${relative}: 상담창 누락`);
    if (!/id="consult-summary"[^>]*readonly/.test(html)) failures.push(`${relative}: 문의 내용 복구 영역 누락`);
    if (!/id="consult-kakao"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/.test(html)) failures.push(`${relative}: 카카오톡 직접 연결 누락`);

    const schemas = [];
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      try { schemas.push(JSON.parse(block[1])); }
      catch (error) { failures.push(`${relative}: JSON-LD 문법 오류 (${error.message})`); }
    }
    const schemaTypes = schemas.map((schema) => schema["@type"]);
    if (relative === "index.html" && !schemaTypes.includes("Organization")) failures.push(`${relative}: Organization 구조화 데이터 누락`);
    if (relative === "index.html" && !schemaTypes.includes("WebSite")) failures.push(`${relative}: WebSite 구조화 데이터 누락`);
    if (/^golf\/.+\.html$/.test(relative) && relative !== "golf/index.html" && !schemaTypes.includes("GolfCourse")) failures.push(`${relative}: GolfCourse 구조화 데이터 누락`);
    if (/class="breadcrumb\b/.test(html) && !schemaTypes.includes("BreadcrumbList")) failures.push(`${relative}: BreadcrumbList 구조화 데이터 누락`);
    if (/^blog\/.+\.html$/.test(relative) && relative !== "blog/index.html" && !schemaTypes.includes("Article")) failures.push(`${relative}: Article 구조화 데이터 누락`);
    if (/^blog\/.+\.html$/.test(relative) && relative !== "blog/index.html" && !/property="og:type" content="article"/.test(html)) failures.push(`${relative}: Article OG 유형 누락`);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/gi)) {
    const raw = match[1];
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/.test(raw)) continue;
    const clean = raw.split(/[?#]/)[0];
    if (!clean) continue;
    let target;
    if (clean.startsWith("/")) target = path.join(dist, clean);
    else target = path.resolve(path.dirname(file), clean);
    if (clean.endsWith("/")) target = path.join(target, "index.html");
    if (!await exists(target)) failures.push(`${relative}: 없는 경로 ${raw}`);
  }
}

const script = await readFile(path.join(dist, "assets/js/site.js"), "utf8");
try { new Function(script); } catch (error) { failures.push(`site.js 문법 오류: ${error.message}`); }
for (const required of ["navigator.clipboard", "document.execCommand", "consult-summary", "consult-kakao"]) {
  if (!script.includes(required)) failures.push(`상담 스크립트 필수 처리 누락: ${required}`);
}

const css = await readFile(path.join(dist, "assets/css/site.css"), "utf8");
for (const breakpoint of ["@media (max-width: 760px)", "@media (max-width: 390px)"]) {
  if (!css.includes(breakpoint)) failures.push(`반응형 기준 누락: ${breakpoint}`);
}

if (contentPages.length !== expectedContentPages) failures.push(`콘텐츠 페이지 수 ${contentPages.length}개 (예상 ${expectedContentPages}개)`);
if (!files.some((file) => file.endsWith("sitemap.xml"))) failures.push("sitemap.xml 누락");
if (!files.some((file) => file.endsWith("robots.txt"))) failures.push("robots.txt 누락");
if (!files.some((file) => file.endsWith("manifest.webmanifest"))) failures.push("manifest.webmanifest 누락");
if (!files.some((file) => file.endsWith("server/index.js"))) failures.push("Sites 서버 엔트리 누락");
if (!files.some((file) => file.endsWith(".openai/hosting.json"))) failures.push("Sites 호스팅 매니페스트 누락");
if (!await exists(path.join(dist, "client/index.html"))) failures.push("Sites 정적 클라이언트 결과 누락");
for (const icon of ["xinchao-golf-logo-192.webp", "xinchao-golf-logo-512.webp"]) {
  if (!files.some((file) => file.endsWith(icon))) failures.push(`브랜드 아이콘 누락: ${icon}`);
}

const vercel = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
if (vercel.buildCommand !== "npm run build") failures.push("Vercel 빌드 명령 오류");
if (vercel.outputDirectory !== "dist") failures.push("Vercel 결과 폴더 오류");
if (!Array.isArray(vercel.redirects) || vercel.redirects.length !== expectedRedirects) failures.push(`301 이전 규칙 ${vercel.redirects?.length ?? 0}개 (예상 ${expectedRedirects}개)`);
if (!Array.isArray(vercel.headers) || vercel.headers.length < 2) failures.push("배포 보안·캐시 헤더 누락");
if (await exists(path.join(dist, "vercel.json"))) failures.push("배포 설정이 공개 결과물 안에 포함됨");
const notFound = await readFile(path.join(dist, "404.html"), "utf8");
if (!/name="robots" content="noindex,nofollow"/.test(notFound)) failures.push("404 noindex 누락");

const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
if (count(sitemap, /<loc>/g) !== expectedSitemapUrls) failures.push(`사이트맵 URL ${count(sitemap, /<loc>/g)}개 (예상 ${expectedSitemapUrls}개)`);
if (count(sitemap, /<lastmod>/g) !== expectedSitemapUrls) failures.push(`사이트맵 lastmod ${count(sitemap, /<lastmod>/g)}개 (예상 ${expectedSitemapUrls}개)`);
if (!sitemap.includes(`<loc>${site.siteUrl}/</loc>`)) failures.push("사이트맵 대표 주소 누락");
if (/golf-detail_|villa-detail_|apartment-detail_/.test(sitemap)) failures.push("사이트맵에 이전 주소 포함");

const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${site.siteUrl}/sitemap.xml`)) failures.push("robots.txt 사이트맵 주소 오류");

if (failures.length) {
  console.error(`검수 실패 ${failures.length}건`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`검수 통과: 콘텐츠 ${contentPages.length}페이지, 전체 HTML ${htmlFiles.length}개, 내부 경로·SEO 기본값 정상`);

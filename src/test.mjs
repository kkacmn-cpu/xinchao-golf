import { access, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarkdownPosts } from "./blog-content.mjs";
import { apartments, courses, golfAreas, site, villas } from "./site-data.mjs";
import { topicHubs } from "./topic-hubs.mjs";
import { legacyGolfDestination, legacyGolfPaths } from "./legacy-golf-paths.mjs";
import { pricing } from "./pricing-guide.mjs";
import { golfRentPath, hcmCourses, rentGoCodes, rentPages } from "./rent-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const failures = [];
const markdownPosts = await loadMarkdownPosts(path.join(root, "src/content/blog"));
const guideCount = JSON.parse(await readFile(path.join(root, "src/content/guides.json"), "utf8")).length;
// 차량 렌트(/rent 허브 1 + 상황별 + 호치민권 골프장별)가 페이지·사이트맵에 더해진다(2026-11-20).
const rentPageCount = 1 + rentPages.length + hcmCourses.length;
const expectedContentPages = 27 + courses.length + markdownPosts.length + 1 + guideCount + rentPageCount;
const expectedSitemapUrls = 26 + courses.length + markdownPosts.length + 1 + guideCount + rentPageCount;
// 붕따우 지역 게시판(/regions/vungtau.html)이 생겨 페이지·사이트맵이 1개씩 늘었다(2026-11-20).
// 숙소 상세 19쪽(아파트 4·빌라 15)은 호치민풀빌라로 넘겨 페이지·사이트맵에서 빠지고, 상세 주소 19개 이동 규칙이 늘었다(2026-11-20).
const expectedRedirects = 66 + markdownPosts.length + legacyGolfPaths.length; // 66 = 기존 45 + 옛 주소→새 주소 2 + 숙소 상세 19, 닫힌 골프 사이트 옛 상세 주소 74

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
  const relative = path.relative(dist, file).split(path.sep).join("/");
  if (/^(google|naver)[^/]+\.html$/i.test(relative)) continue;
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
    if (/\bjs-consult\b|id="consult-dialog"|id="consult-form"/.test(html)) failures.push(`${relative}: 중간 상담창 경로 잔존`);
    if (html.includes("_FXwxkG/chat")) failures.push(`${relative}: 종합 상담 채널 혼용`);
    if (!html.includes(`href="${site.kakaoUrl}" target="_blank" rel="noopener noreferrer"`)) failures.push(`${relative}: 골프 상담 직접 연결 누락`);

    const schemas = [];
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      try { schemas.push(JSON.parse(block[1])); }
      catch (error) { failures.push(`${relative}: JSON-LD 문법 오류 (${error.message})`); }
    }
    const schemaTypes = schemas.map((schema) => schema["@type"]);
    const collectionPages = ["golf/index.html", "regions/index.html", "services/index.html", "services/apartments.html", "services/villas.html", "blog/index.html", "golf-price/index.html", "golf-booking/index.html", "golf-itinerary/index.html"];
    if (collectionPages.includes(relative) || relative === "services/vehicle.html") {
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      const expectedType = relative === "services/vehicle.html" ? "WebPage" : "CollectionPage";
      const pages = schemas.filter((schema) => schema["@type"] === expectedType);
      if (pages.length !== 1) failures.push(`${relative}: ${expectedType} 구조화 데이터 정확히 1개 필요`);
      const page = pages[0];
      if (page?.url !== canonical || page?.["@id"] !== `${canonical}#webpage`) failures.push(`${relative}: 구조화 페이지 URL 불일치`);
      if (page?.publisher?.["@id"] !== `${site.siteUrl}/#organization` || page?.isPartOf?.["@id"] !== `${site.siteUrl}/#website`) failures.push(`${relative}: 브랜드 연결 누락`);
      const plainTitle = title?.split(" | ")[0];
      if (page?.name !== plainTitle || page?.inLanguage !== "ko-KR") failures.push(`${relative}: 구조화 제목·언어 불일치`);
      if (relative === "services/vehicle.html") {
        const service = page?.mainEntity;
        if (service?.["@type"] !== "Service" || service?.name !== plainTitle || service?.url !== canonical || service?.provider?.["@id"] !== `${site.siteUrl}/#organization` || service?.areaServed?.name !== "호치민") failures.push(`${relative}: 차량 상담 서비스 계약 불일치`);
      }
      if (/(?:"offers"|"aggregateRating"|"review"|"price"|"availability")\s*:/.test(JSON.stringify(page))) failures.push(`${relative}: 미확인 판매·평점 구조화 데이터`);
    }
    if (relative === "404.html" && schemaTypes.some((type) => ["WebPage", "CollectionPage", "Service"].includes(type))) failures.push(`${relative}: 오류 페이지를 공개 서비스로 표기`);
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
    // /go/<코드>는 vercel rewrites가 /go/<코드>.html로 보낸다.
    if (/^\/go\/[a-z0-9-]+$/.test(clean)) target = path.join(dist, `${clean}.html`);
    if (!await exists(target)) failures.push(`${relative}: 없는 경로 ${raw}`);
  }
}

const script = await readFile(path.join(dist, "assets/js/site.js"), "utf8");
try { new Function(script); } catch (error) { failures.push(`site.js 문법 오류: ${error.message}`); }
// 옛 상담 대화상자(중간 입력 단계)는 없어야 한다. 클립보드 복사는 홈 상담 준비표 요약에만 쓴다(2026-11-20 손님 점검 #11).
if (/consult-dialog|consult-form|js-consult/.test(script)) failures.push("상담 스크립트에 중간 입력 경로 잔존");
if (count(script, /navigator\.clipboard\.writeText\(/g) !== 1 || count(script, /document\.execCommand\(/g) !== 1 || count(script, /copyPrepSummary\(/g) !== 1) failures.push("클립보드 복사는 상담 준비표 요약(copyPrepSummary) 한 곳에서만 써야 함");
const home = await readFile(path.join(dist, "index.html"), "utf8");
for (const required of ["id=\"home-prep-form\"", "name=\"region\"", "name=\"date\"", "name=\"people\"", "name=\"purpose\"", "id=\"home-prep-result\"", "id=\"home-prep-candidates\"", "id=\"home-prep-copy-status\""]) {
  if (!home.includes(required)) failures.push(`홈 상담 준비표 누락: ${required}`);
}
if (!home.includes("예약 가능 여부·티오프·가격은 확정 정보가 아닙니다")) failures.push("홈 상담 준비표의 미확정 조건 안내 누락");
if (!home.includes(`id="home-prep-continue" href="${site.kakaoUrl}"`)) failures.push("홈 상담 준비표의 골프 상담 직접 연결 누락");
for (const relative of ["css/site.css", "js/site.js"]) {
  const version = createHash("sha256").update(await readFile(path.join(root, "public/assets", relative))).digest("hex").slice(0, 12);
  if (!home.includes(`/assets/${relative}?v=${version}`)) failures.push(`브라우저 캐시 우회용 콘텐츠 버전 누락: ${relative}`);
}

const css = await readFile(path.join(dist, "assets/css/site.css"), "utf8");
for (const breakpoint of ["@media (max-width: 760px)", "@media (max-width: 390px)"]) {
  if (!css.includes(breakpoint)) failures.push(`반응형 기준 누락: ${breakpoint}`);
}

if (contentPages.length !== expectedContentPages) failures.push(`콘텐츠 페이지 수 ${contentPages.length}개 (예상 ${expectedContentPages}개)`);
if (!files.some((file) => file.endsWith("sitemap.xml"))) failures.push("sitemap.xml 누락");
if (!files.some((file) => file.endsWith("robots.txt"))) failures.push("robots.txt 누락");
if (!files.some((file) => file.endsWith("manifest.webmanifest"))) failures.push("manifest.webmanifest 누락");
if (!await exists(path.join(dist, "server", "index.js"))) failures.push("Sites 서버 엔트리 누락");
if (!await exists(path.join(dist, ".openai", "hosting.json"))) failures.push("Sites 호스팅 매니페스트 누락");
if (!await exists(path.join(dist, "client/index.html"))) failures.push("Sites 정적 클라이언트 결과 누락");
for (const icon of ["xinchao-golf-logo-192.webp", "xinchao-golf-logo-512.webp"]) {
  if (!files.some((file) => file.endsWith(icon))) failures.push(`브랜드 아이콘 누락: ${icon}`);
}

const vercel = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
if (vercel.buildCommand !== "npm run build && (node scripts/indexnow.mjs --build || true)") failures.push("Vercel 빌드 명령 오류(빌드 + IndexNow 운영 제출)");
if (vercel.outputDirectory !== "dist") failures.push("Vercel 결과 폴더 오류");
if (!Array.isArray(vercel.redirects) || vercel.redirects.length !== expectedRedirects) failures.push(`301 이전 규칙 ${vercel.redirects?.length ?? 0}개 (예상 ${expectedRedirects}개)`);
if (vercel.redirects?.filter((rule) => rule.source === "/golf/compare-regions" && rule.destination === "/regions" && rule.permanent === true).length !== 1) failures.push("이전 지역 비교 URL의 영구 이전 규칙 누락 또는 중복");
for (const source of ["/blog/vietnam-golf-caddie-tip-checklist.html", "/vietnam-golf-caddie-tip-checklist.html"]) {
  if (vercel.redirects?.filter((rule) => rule.source === source && rule.destination === "/blog/hochiminh-golf-stay-selection-checklist.html" && rule.permanent === true).length !== 1) failures.push(`${source}: 중복 없는 숙소 가이드 영구 이전 규칙 필요`);
}
{
  // 옛 주소 → 새 .com 영구 이동: 맨 앞 2개 규칙, 인증 파일 4개는 제외
  const hostRules = vercel.redirects?.filter((rule) => rule.has?.some((h) => h.type === "host" && h.value === "xinchao-golf.vercel.app")) ?? [];
  if (hostRules.length !== 2 || vercel.redirects.indexOf(hostRules[0]) !== 0 || vercel.redirects.indexOf(hostRules[1]) !== 1) failures.push("옛 주소 이동 규칙 2개가 맨 앞에 있어야 함");
  if (!hostRules.every((rule) => rule.permanent === true && rule.destination.startsWith(`${site.siteUrl}/`))) failures.push("옛 주소 이동 규칙의 도착지·영구 여부 오류");
  for (const file of ["google42ff51d2f339800e.html", "google9dfe2426ca118753.html", "naveracfd10be671c96cdfb93a6b8dadd8e45.html", "d5b83e4cf4084a38b2b71a6f9a62c7de.txt"]) {
    if (!hostRules[1]?.source.includes(file.replace(".", "\\."))) failures.push(`옛 주소 이동에서 인증 파일 제외 누락: ${file}`);
    if (!files.some((item) => item.endsWith(file))) failures.push(`인증 파일 누락: ${file}`);
  }
}
{
  // 닫힌 골프 사이트 3곳의 옛 상세 주소: 실제 있는 페이지로 308(끝 / 는 Vercel trailingSlash:false가 먼저 뗌)
  if (vercel.redirects.length > 1024) failures.push(`Vercel redirects 한도 초과: ${vercel.redirects.length}개`);
  for (const entry of legacyGolfPaths) {
    const destination = legacyGolfDestination(entry);
    const target = destination.split("#")[0];
    const built = target === "/golf" ? "golf/index.html" : target.slice(1);
    if (!files.some((item) => path.relative(dist, item).split(path.sep).join("/") === built)) failures.push(`옛 골프장 주소 도착 페이지 없음: ${entry.from} → ${destination}`);
    for (const source of [`/golf/${entry.from}`]) {
      if (vercel.redirects.filter((rule) => rule.source === source && rule.destination === destination && rule.permanent === true).length !== 1) failures.push(`옛 골프장 주소 이동 규칙 누락 또는 중복: ${source}`);
    }
  }
  if (new Set(legacyGolfPaths.map((entry) => entry.from)).size !== legacyGolfPaths.length) failures.push("옛 골프장 주소 대응표 중복");
}
if (!files.some((item) => item.endsWith(`${path.sep}favicon.ico`) && path.dirname(item) === dist)) failures.push("favicon.ico 누락");
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
{
  // RSS 피드: 최신 글 50개 이하, 모두 사이트맵에 있는 새 주소
  const rss = files.some((file) => file.endsWith("rss.xml")) ? await readFile(path.join(dist, "rss.xml"), "utf8") : "";
  const rssLinks = [...rss.matchAll(/<item>\s*<title>[^<]+<\/title>\s*<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  if (!rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>') || !rss.includes(`<atom:link href="${site.siteUrl}/rss.xml"`)) failures.push("rss.xml 누락 또는 형식 오류");
  if (rssLinks.length === 0 || rssLinks.length > 50 || new Set(rssLinks).size !== rssLinks.length) failures.push(`rss.xml 글 수 오류: ${rssLinks.length}`);
  for (const link of rssLinks) if (!sitemap.includes(`<loc>${link}</loc>`)) failures.push(`rss.xml에 사이트맵 밖 주소: ${link}`);
  if (rss.includes("vercel.app")) failures.push("rss.xml에 옛 주소");
}
if (!robots.includes(`Sitemap: ${site.siteUrl}/sitemap.xml`)) failures.push("robots.txt 사이트맵 주소 오류");

// 주제별 모음(골프장별 가격·예약 방법·일정 짜기): 사이트맵·llms.txt·가이드 위치 표시에 연결되고, 금액을 적지 않는다.
const llms = await readFile(path.join(dist, "llms.txt"), "utf8");
const PRICE = /\d{1,3}(?:,\d{3})+|\d+\s*(?:VND|동|원|달러|USD)(?![가-힣])|\d+만\s*원/;
// 모음 페이지에 새로 쓴 문구(제목·설명·안내·질문)에는 금액을 넣지 않는다. 기존 글 제목은 각 글의 출처를 따른다.
for (const hub of topicHubs) {
  const hit = JSON.stringify([hub.title, hub.description, hub.lead, hub.notice, hub.stepsTitle, hub.courseTitle, hub.faq]).match(PRICE);
  if (hit) failures.push(`${hub.path}: 주제 모음 문구에 금액 표기(${hit[0]})`);
}
for (const [hubPath, label] of [["/golf-price", "골프장별 가격"], ["/golf-booking", "예약 방법"], ["/golf-itinerary", "일정 짜기"]]) {
  const hubFile = path.join(dist, hubPath.slice(1), "index.html");
  if (!await exists(hubFile)) { failures.push(`${hubPath}: 주제 모음 페이지 없음`); continue; }
  const hubHtml = await readFile(hubFile, "utf8");
  if (!sitemap.includes(`<loc>${site.siteUrl}${hubPath}</loc>`)) failures.push(`${hubPath}: 사이트맵 누락`);
  if (!llms.includes(`(${site.siteUrl}${hubPath})`)) failures.push(`${hubPath}: llms.txt 누락`);
  if (!/"@type":"FAQPage"/.test(hubHtml) || !/"@type":"ItemList"/.test(hubHtml) || !/"@type":"BreadcrumbList"/.test(hubHtml)) failures.push(`${hubPath}: 구조화 데이터 누락`);
  const guideLinks = count(hubHtml, /href="\/guide\/[^"]+\.html"/g);
  if (guideLinks < 10) failures.push(`${hubPath}: 가이드 글 링크 ${guideLinks}개`);
  const sample = hubHtml.match(/<h2>[^<]* 글 전체[\s\S]*?href="(\/guide\/[^"]+\.html)"/)?.[1];
  const sampleHtml = sample ? await readFile(path.join(dist, sample.slice(1)), "utf8") : "";
  if (!sampleHtml.includes(`<a href="${hubPath}">${label}</a>`)) failures.push(`${hubPath}: 가이드 글 위치 표시에 주제 모음 링크 없음 (${sample})`);
}

// 요금 구성·결제·변경/취소 안내(2026-11-20 손님 점검 #2·#3): 넣을 곳에 견적기 문장이 한 번씩, 금액 숫자는 없음(예약대행 수수료도 견적서 표시로만 안내, 총괄 11-20).
{
  const visibleText = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<head>[\s\S]*?<\/head>/i, "");
  const pages = {
    "index.html": ["greenFee", "prepaid", "onsite", "split", "change", "howTo", "reply"],
    "about.html": ["greenFee", "prepaid", "onsite", "split", "change", "howTo", "reply"],
    "golf-price/index.html": ["greenFee", "prepaid", "onsite", "split", "change"],
    ...Object.fromEntries(courses.map((course) => [`golf/${course.slug}.html`, ["greenFee", "prepaid", "onsite", "split", "change"]])),
  };
  for (const [relative, keys] of Object.entries(pages)) {
    const text = visibleText(await readFile(path.join(dist, relative), "utf8"));
    for (const key of keys) {
      const sentence = key === "greenFee" ? pricing.greenFee.replace("그린피는 ", "") : pricing[key];
      const found = text.split(sentence).length - 1;
      if (found !== 1) failures.push(`${relative}: 요금 안내 문장(${key}) ${found}번 (1번이어야 함)`);
    }
    if (!text.includes(pricing.fee)) failures.push(`${relative}: 예약대행 수수료 안내 누락`);
  }
  for (const file of htmlFiles) {
    const relative = path.relative(dist, file).split(path.sep).join("/");
    const usd = (await readFile(file, "utf8")).match(/USD\s*\d[\d.,]*|\d[\d.,]*\s*(?:USD|달러)/g) || [];
    if (usd.length) failures.push(`${relative}: 달러 금액(${usd.join(", ")}) — 사이트에는 금액 숫자를 넣지 않음`);
  }
}

// 홈 자주 묻는 질문: 보이는 문답 = FAQPage JSON-LD(구글 규칙), 5~7문항, 금액·답변 시간 숫자 없음, 다른 페이지 FAQ와 같은 질문 없음.
{
  const decode = (value) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  const section = home.match(/<section\b[^>]*\bid="faq"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
  const visible = [...section.matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map((match) => [decode(match[1]), decode(match[2])]);
  const faqBlocks = [];
  for (const block of home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(block[1]); } catch (error) { failures.push(`홈 JSON-LD 파싱 실패: ${error.message}`); continue; }
    if (data["@type"] === "FAQPage") faqBlocks.push(data);
  }
  if (faqBlocks.length !== 1) failures.push(`홈 FAQPage 구조화 데이터 ${faqBlocks.length}개 (1개여야 함)`);
  const structured = (faqBlocks[0]?.mainEntity ?? []).map((item) => [item?.["@type"] === "Question" ? item.name : null, item?.acceptedAnswer?.["@type"] === "Answer" ? item.acceptedAnswer.text : null]);
  if (visible.length < 5 || visible.length > 7) failures.push(`홈 FAQ ${visible.length}문항 (5~7문항이어야 함)`);
  if (JSON.stringify(visible) !== JSON.stringify(structured)) failures.push("홈 FAQ 보이는 문답과 FAQPage JSON-LD 불일치");
  for (const [question, answer] of visible) {
    const hit = `${question} ${answer}`.match(PRICE);
    if (hit) failures.push(`홈 FAQ 금액 표기(${hit[0]}): ${question}`);
    if (/\d+\s*(?:분|시간|일)\s*(?:안|내|이내)/.test(answer) && /답변|회신|연락/.test(answer)) failures.push(`홈 FAQ 답변 시간 숫자 약속: ${question}`);
    if (/<[a-z]/i.test(answer)) failures.push(`홈 FAQ 답변에 HTML 태그: ${question}`);
  }
  // Organization sameAs: 공식 채널 6개만(페이스북·틱톡 제외), 카카오 채널은 contactPoint 유지.
  const organizations = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((block) => { try { return JSON.parse(block[1]); } catch { return null; } }).filter((data) => data?.["@type"] === "Organization");
  const sameAs = organizations[0]?.sameAs ?? [];
  const expectedSameAs = ["https://www.youtube.com/channel/UCATu1VDcTf8FqNkbvlkRgyA", "https://www.instagram.com/xin.chaohcm/", "https://www.threads.com/@xin.chaohcm", "https://cafe.naver.com/prpr12", "https://blog.naver.com/jjacmn", "https://blog.naver.com/akkacmn"];
  if (JSON.stringify(sameAs) !== JSON.stringify(expectedSameAs)) failures.push(`홈 Organization sameAs 오류: ${JSON.stringify(sameAs)}`);
  if (sameAs.some((url) => /facebook|tiktok/i.test(url))) failures.push("홈 Organization sameAs에 페이스북·틱톡 포함");
  if (organizations[0]?.contactPoint?.url !== site.kakaoUrl) failures.push("홈 Organization 카카오 채널 contactPoint 누락");
  const homeQuestions = new Set(visible.map(([question]) => question));
  for (const file of htmlFiles) {
    const relative = path.relative(dist, file).split(path.sep).join("/");
    if (relative === "index.html") continue;
    const html = await readFile(file, "utf8");
    if (!html.includes('"FAQPage"')) continue;
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      let data; try { data = JSON.parse(block[1]); } catch { continue; }
      if (data["@type"] !== "FAQPage") continue;
      for (const item of data.mainEntity ?? []) if (homeQuestions.has(item.name)) failures.push(`${relative}: 홈 FAQ와 같은 질문 (${item.name})`);
    }
  }
}

// 숙소 상세 19쪽(빌라 15·아파트 4)과 옛 주소: 호치민풀빌라 최종 주소(.html)로 바로 308, 골프 결과물에는 상세·옛 이동 파일·내부 링크가 없다(2026-11-20).
// 목적지가 운영에서 리다이렉트 없이 200인지는 네트워크가 필요해 따로 확인한다: npm run check:lodging (src/check-lodging-targets.mjs)
{
  const lodging = [...apartments.map((item) => ["apartment", item]), ...villas.map((item) => ["villa", item])];
  if (lodging.length !== 19) failures.push(`숙소 상세 수 ${lodging.length}개 (19개여야 함)`);
  for (const [type, item] of lodging) {
    if (!/^https:\/\/hochiminhpoolvilla\.com\/(?:villa|apartment)\/[a-z0-9-]+\.html$/.test(item.moved || "")) failures.push(`${item.slug}: 풀빌라 이동 주소가 .html 최종 주소가 아님 (${item.moved})`);
    for (const source of [`/services/${type}/${item.slug}.html`, `/${item.legacy}`]) {
      const rules = vercel.redirects.filter((rule) => rule.source === source);
      if (rules.length !== 1 || rules[0].destination !== item.moved || rules[0].permanent !== true) failures.push(`숙소 이동 규칙 누락·중복·오류: ${source}`);
    }
    for (const built of [`services/${type}/${item.slug}.html`, item.legacy]) {
      if (await exists(path.join(dist, built)) || await exists(path.join(dist, "client", built))) failures.push(`숙소 상세가 결과물에 남음: ${built}`);
    }
  }
  if (await exists(path.join(dist, "services/villa")) || await exists(path.join(dist, "services/apartment"))) failures.push("숙소 상세 폴더가 결과물에 남음");
  for (const rule of vercel.redirects) {
    if (/^\/services\/(?:villa|apartment)\//.test(rule.source) && !rule.destination.startsWith("https://hochiminhpoolvilla.com/")) failures.push(`숙소 상세 목적지가 풀빌라 사이트가 아님: ${rule.source}`);
    if (/\/services\/(?:villa|apartment)\//.test(rule.destination)) failures.push(`없앤 숙소 상세로 보내는 규칙: ${rule.source} → ${rule.destination}`);
    if (rule.destination.startsWith("https://hochiminhpoolvilla.com/") && !/\.html$/.test(rule.destination)) failures.push(`풀빌라 목적지가 .html 최종 주소가 아님: ${rule.destination}`);
  }
  if (vercel.redirects.length >= 1024) failures.push(`Vercel redirects 1024개 이상: ${vercel.redirects.length}개`);
  for (const file of files.filter((item) => /\.(?:html|xml|txt|webmanifest|js)$/.test(item))) {
    const text = await readFile(file, "utf8");
    if (/\/services\/(?:villa|apartment)\//.test(text)) failures.push(`${path.relative(dist, file)}: 없앤 숙소 상세 주소(/services/villa/·/services/apartment/) 잔존`);
  }
  // 숙소 목록 2쪽·서비스 허브: 자매 사이트 목록(.html 최종 주소)으로 새 탭 연결 + 카카오톡 상담 유지, 금액 숫자 없음
  const villaList = "https://hochiminhpoolvilla.com/villa/villa.html";
  const apartmentList = "https://hochiminhpoolvilla.com/apartment/apartment.html";
  for (const [relative, lists] of [["services/villas.html", [villaList]], ["services/apartments.html", [apartmentList]], ["services/index.html", [villaList, apartmentList]], ["index.html", [villaList, apartmentList]]]) {
    const html = await readFile(path.join(dist, relative), "utf8");
    for (const url of lists) if (!html.includes(`href="${url}" target="_blank" rel="noopener"`)) failures.push(`${relative}: 풀빌라 목록 새 탭 연결 누락 (${url})`);
    if (/href="https:\/\/hochiminhpoolvilla\.com\/(?:villa|apartment)\/?"/.test(html)) failures.push(`${relative}: 풀빌라 폴더 주소 링크(최종 주소가 아니라 리다이렉트를 거침)`);
    if (!html.includes("자매 사이트 호치민풀빌라")) failures.push(`${relative}: 자매 사이트 안내 문구 누락`);
    if (/class="property-card"/.test(html)) failures.push(`${relative}: 숙소 카드 잔존`);
    const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? "";
    if (!main.includes(`href="${site.kakaoUrl}"`)) failures.push(`${relative}: 본문 카카오톡 상담 버튼 누락`);
    const hit = main.replace(/<[^>]+>/g, " ").match(PRICE);
    if (hit) failures.push(`${relative}: 금액 표기(${hit[0]})`);
  }
}

// 키워드 지도(07) "글 안 섹션" 보강(2026-11-20): 지역 게시판 5곳(붕따우 신설)과 골프장 10곳.
// 섹션이 있고, 그 지역 골프장 카드가 다 있고, 새 문구에 금액 숫자·후기 섹션이 없고, 요금 문장은 한 번씩만.
{
  const visibleText = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<head>[\s\S]*?<\/head>/i, "");
  // 해발·거리(1,200m·약 105km)는 금액이 아니므로 금액 검사 전에 뺀다.
  const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/\d[\d,.]*\s*k?m(?![a-z])/gi, " ");
  const once = (text, sentence, label) => { const found = text.split(sentence).length - 1; if (found !== 1) failures.push(`${label}: 요금 문장 ${found}번 (1번이어야 함) — ${sentence.slice(0, 20)}`); };
  const boardOf = (course) => course.board || golfAreas.find((area) => area.key === course.area).board;
  if (!await exists(path.join(dist, "regions/vungtau.html"))) failures.push("붕따우 지역 쪽 없음: regions/vungtau.html");
  if (!sitemap.includes(`<loc>${site.siteUrl}/regions/vungtau.html</loc>`)) failures.push("붕따우 지역 쪽 사이트맵 누락");
  if (!llms.includes(`(${site.siteUrl}/regions/vungtau.html)`)) failures.push("붕따우 지역 쪽 llms.txt 누락");
  for (const slug of ["vung-tau-paradise-golf", "the-bluffs-grand-ho-tram", "sonadezi-chau-duc-golf"]) {
    if (boardOf(courses.find((course) => course.slug === slug)) !== "vungtau") failures.push(`${slug}: 붕따우 게시판으로 분류되지 않음`);
  }
  const regionsIndex = await readFile(path.join(dist, "regions/index.html"), "utf8");
  if (!regionsIndex.includes('href="/regions/vungtau.html"')) failures.push("지역 목록에 붕따우 링크 누락");
  // 하노이·푸꾸옥은 2026-11-20 보류 해제로 섹션을 켰다(7곳 모두).
  for (const key of ["hochiminh", "vungtau", "nhatrang", "danang", "dalat", "hanoi", "phuquoc"]) {
    const relative = `regions/${key}.html`;
    const html = await readFile(path.join(dist, relative), "utf8");
    const text = visibleText(html);
    for (const other of ["hochiminh", "vungtau", "nhatrang", "danang", "dalat", "hanoi", "phuquoc"]) if (other !== key && !html.includes(`href="/regions/${other}.html"`)) failures.push(`${relative}: 지역 메뉴에 ${other} 링크 누락`);
    for (const id of ["region-courses", "region-airport", "region-price", "region-booking"]) if (!html.includes(`id="${id}"`)) failures.push(`${relative}: 섹션 누락 (${id})`);
    const sections = plain(html.match(/<section class="guide-group" id="region-courses">[\s\S]*?<section class="guide-group"><h2>/)?.[0] ?? "");
    if (!sections) failures.push(`${relative}: 지역 섹션 묶음을 찾지 못함`);
    const hit = sections.match(PRICE);
    if (hit) failures.push(`${relative}: 지역 섹션에 금액 표기(${hit[0]})`);
    if (/<h[23][^>]*>[^<]*후기/.test(html)) failures.push(`${relative}: 후기 섹션(실제 후기 없음)`);
    for (const course of courses.filter((item) => boardOf(item) === key)) if (!html.includes(`<article class="course-card">`) || !html.includes(`href="/golf/${course.slug}.html" aria-label=`)) failures.push(`${relative}: 골프장 카드 누락 (${course.slug})`);
    for (const sentence of [pricing.greenFee, pricing.fee, pricing.split, pricing.howTo, pricing.reply]) once(text, sentence, relative);
  }
  for (const key of ["hanoi", "phuquoc"]) {
    const html = await readFile(path.join(dist, `regions/${key}.html`), "utf8");
    if (!/<title>[^<]* 골프장 가격·예약·이동시간 안내 \|/.test(html)) failures.push(`regions/${key}.html: 보류 해제 뒤 제목이 섹션 제목이 아님`);
  }
  // 붕따우 글을 붕따우 게시판에 모아도 호치민 게시판에서는 빠지지 않는다.
  const hcmBoard = await readFile(path.join(dist, "regions/hochiminh.html"), "utf8");
  const vtBoard = await readFile(path.join(dist, "regions/vungtau.html"), "utf8");
  for (const href of ["/blog/the-bluffs-grand-ho-tram-golf-booking-guide.html"]) {
    if (!hcmBoard.includes(`href="${href}"`)) failures.push(`호치민 게시판에서 글이 빠짐: ${href}`);
    if (!vtBoard.includes(`href="${href}"`)) failures.push(`붕따우 게시판에 글 누락: ${href}`);
  }
  for (const slug of ["vinpearl-golf-nha-trang", "montgomerie-links-vietnam", "long-thanh-golf-club", "ba-na-hills-golf-club", "sam-tuyen-lam-golf", "song-be-golf-resort", "tan-son-nhat-golf-course", "thu-duc-country-club", "twin-doves-golf-club", "leman-golf-club", "dalat-at-1200", "dalat-palace-golf-club", "sonadezi-chau-duc-golf", "vung-tau-paradise-golf", "vinpearl-golf-phu-quoc", "the-bluffs-grand-ho-tram"]) {
    const relative = `golf/${slug}.html`;
    const html = await readFile(path.join(dist, relative), "utf8");
    const section = html.match(/<section class="course-guide course-keyword"[\s\S]*?<\/section>/)?.[0] ?? "";
    if (!section) { failures.push(`${relative}: 가격·예약·코스 섹션 누락`); continue; }
    for (const heading of ["가격 안내", "예약 방법", "코스·위치"]) if (!new RegExp(`<h3>[^<]*${heading}</h3>`).test(section)) failures.push(`${relative}: 섹션 제목 누락 (${heading})`);
    const hit = plain(section).match(PRICE);
    if (hit) failures.push(`${relative}: 가격·예약 섹션에 금액 표기(${hit[0]})`);
    if (/<h[23][^>]*>[^<]*후기/.test(html)) failures.push(`${relative}: 후기 섹션(실제 후기 없음)`);
    once(visibleText(html), pricing.howTo, relative);
    // 홀 수는 원문 그대로(예: 레만 "36홀 전체 규모 · 단계별 운영 확인")를 써서 운영 규모를 단정하지 않는다.
    const course = courses.find((item) => item.slug === slug);
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    if (!description.includes(course.holes)) failures.push(`${relative}: description에 홀 수 원문(${course.holes}) 없음`);
    if (!section.includes(`<li>규모: ${course.holes}</li>`)) failures.push(`${relative}: 코스·위치에 홀 수 원문 없음`);
  }
}

// 골프 + 숙소 + 차량 묶음 견적(2026-11-20 차별화 ③): 호치민권 골프장 상세마다 블록 1개, 다른 지역에는 없음.
// 숙소는 호치민풀빌라 목록(새 탭), 이동은 그 골프장 공항 이동시간, 버튼은 /go/golf-combo. 금액 숫자 없음.
{
  const comboPath = "/go/golf-combo";
  const villaList = "https://hochiminhpoolvilla.com/villa/villa.html";
  const apartmentList = "https://hochiminhpoolvilla.com/apartment/apartment.html";
  const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/\d[\d,.]*\s*k?m(?![a-z])/gi, " ");
  const targets = courses.filter((course) => course.area === "hcm");
  if (targets.length < 13 || targets.length > 16) failures.push(`묶음 견적 대상 골프장 ${targets.length}곳 (13~16곳 예상)`);
  for (const course of courses) {
    const relative = `golf/${course.slug}.html`;
    const html = await readFile(path.join(dist, relative), "utf8");
    const blocks = html.match(/<section class="section shell stay-combo"[\s\S]*?<\/section>/g) || [];
    if (course.area !== "hcm") {
      if (blocks.length || html.includes(`href="${comboPath}"`)) failures.push(`${relative}: 호치민권이 아닌데 묶음 견적 블록 있음`);
      continue;
    }
    if (blocks.length !== 1) { failures.push(`${relative}: 묶음 견적 블록 ${blocks.length}개 (1개여야 함)`); continue; }
    const block = blocks[0];
    for (const url of [villaList, apartmentList]) if (!block.includes(`href="${url}" target="_blank" rel="noopener"`)) failures.push(`${relative}: 묶음 견적 숙소 목록 새 탭 연결 누락 (${url})`);
    if (!block.includes("4룸~27룸")) failures.push(`${relative}: 묶음 견적 룸 수 범위 누락`);
    if (!block.includes(`차량 약 ${course.drive}`)) failures.push(`${relative}: 묶음 견적 공항 이동시간(${course.drive}) 누락`);
    if (count(block, new RegExp(`href="${comboPath}"`, "g")) !== 1 || !block.includes("골프·숙소·차량 한 번에 견적")) failures.push(`${relative}: 묶음 견적 버튼(${comboPath}) 1개 필요`);
    const hit = plain(block).match(PRICE);
    if (hit) failures.push(`${relative}: 묶음 견적 블록에 금액 표기(${hit[0]})`);
    if (/\d+\s*(?:분|시간|일)\s*(?:안|내|이내)/.test(plain(block).replace(/차량 약[^.]*\./, ""))) failures.push(`${relative}: 묶음 견적 블록에 답변 시간 숫자 약속`);
    if (/후기/.test(block)) failures.push(`${relative}: 묶음 견적 블록에 후기 문구`);
    if (html.split(pricing.reply).length - 1 !== 1) failures.push(`${relative}: 답변 안내 문장 1번이어야 함`);
  }
  const goFile = path.join(dist, "go/golf-combo.html");
  if (!await exists(goFile)) failures.push("/go/golf-combo 페이지 없음");
  else {
    const go = await readFile(goFile, "utf8");
    if (!go.includes('<meta name="robots" content="noindex,nofollow">')) failures.push("/go/golf-combo noindex 누락");
    if (!go.includes('href="https://pf.kakao.com/_xdBALn/chat"') || go.includes("_FXwxkG")) failures.push("/go/golf-combo 골프 카카오 채널(_xdBALn) 아님");
    if (!go.includes('data-company-site-tracker="xinchao-golf"')) failures.push("/go/golf-combo 관제판 tracker 누락");
    const hit = go.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").match(PRICE);
    if (hit) failures.push(`/go/golf-combo 금액 표기(${hit[0]})`);
  }
  if (/\/go\//.test(sitemap)) failures.push("사이트맵에 /go/ 주소 포함");
  if (/\/go\//.test(llms)) failures.push("llms.txt에 /go/ 주소 포함");
}

// 새 골프장 상세(2026-11-20 1일차 5곳): 상세 쪽·목록·지역 쪽·sitemap·llms.txt 반영, 금액 0, 출처 상자, 카톡 버튼, 사진 대신 안내 카드.
{
  const { courseGuides } = await import("./course-guides.mjs");
  const added = ["legend-valley-country-club", "stone-valley-golf-resort", "trang-an-golf-resort", "amber-hills-golf-resort", "golden-sands-golf-resort", "silk-path-dong-trieu-golf", "stone-highland-golf-resort", "van-lang-empire-golf-club", "corn-hill-golf-resort", "royal-golf-club-ninh-binh", "flc-samson-golf-links", "royal-island-golf-villas"];
  const plain = (html) => html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\d[\d,.]*\s*k?m(?![a-z])/gi, " ");
  const golfIndex = await readFile(path.join(dist, "golf/index.html"), "utf8");
  const boardOf = (course) => course.board || golfAreas.find((area) => area.key === course.area).board;
  for (const slug of added) {
    const course = courses.find((item) => item.slug === slug);
    const relative = `golf/${slug}.html`;
    if (!course) { failures.push(`새 골프장 데이터 없음: ${slug}`); continue; }
    if (!await exists(path.join(dist, relative))) { failures.push(`새 골프장 상세 없음: ${relative}`); continue; }
    const html = await readFile(path.join(dist, relative), "utf8");
    const guide = courseGuides[slug];
    if (!guide?.sources?.length) failures.push(`${relative}: 출처(sources) 없음`);
    else for (const [, url] of guide.sources) if (!html.includes(`href="${url}"`)) failures.push(`${relative}: 출처 링크 누락 (${url})`);
    if (!html.includes('<aside class="course-sources"') || !html.includes(guide?.sourceNote || "출처 문구 없음")) failures.push(`${relative}: 출처 상자·안내 문구 누락`);
    if (!html.includes('<details class="pay-guide-compact">')) failures.push(`${relative}: 요금 구성 접이식 안내 누락`);
    if (!html.includes('<ul class="detail-steps">')) failures.push(`${relative}: 예약 단계 누락`);
    if (!html.includes(`href="${site.kakaoUrl}"`)) failures.push(`${relative}: 카카오톡 버튼 누락`);
    if (course.image || course.gallery?.length) failures.push(`${relative}: 저작권 확인 전 사진 사용`);
    if (!html.includes('class="course-plate course-plate-detail"')) failures.push(`${relative}: 사진 대신 안내 카드 누락`);
    const hit = plain(html).match(PRICE);
    if (hit) failures.push(`${relative}: 금액 표기(${hit[0]})`);
    if (course.area !== "hcm" && !course.points.includes("숙소·차량 함께 상담")) failures.push(`${relative}: 호치민권 밖 숙소 상담 문구 누락`);
    if (!sitemap.includes(`<loc>${site.siteUrl}/golf/${slug}.html</loc>`)) failures.push(`${relative}: 사이트맵 누락`);
    if (!llms.includes(`(${site.siteUrl}/golf/${slug}.html)`)) failures.push(`${relative}: llms.txt 누락`);
    if (!golfIndex.includes(`href="/golf/${slug}.html"`)) failures.push(`${relative}: 골프장 목록(/golf) 누락`);
    const board = await readFile(path.join(dist, `regions/${boardOf(course)}.html`), "utf8");
    if (!board.includes(`href="/golf/${slug}.html"`)) failures.push(`${relative}: 지역 쪽(${boardOf(course)}) 카드 누락`);
  }
  const home = await readFile(path.join(dist, "index.html"), "utf8");
  if (!home.includes(`${courses.length}곳`)) failures.push(`홈에 골프장 수(${courses.length}곳) 없음`);
  // 옛 사이트에서 지역 목록으로 보내던 5곳은 새 상세로 다시 연결한다.
  for (const [from, to] of [["bacgiang/bacgiang-amber-hill-golf-and-resort", "amber-hills-golf-resort"], ["hanam/hanam-legend-valley-country-club", "legend-valley-country-club"], ["hanam/hanam-stone-valley-golf-and-resort", "stone-valley-golf-resort"], ["ninhbinh/ninhbinh-trang-an-golf-and-resort", "trang-an-golf-resort"], ["hue/hue-golden-sands-golf-resort", "golden-sands-golf-resort"], ["phutho/phutho-stone-highland-golf-and-resort", "stone-highland-golf-resort"], ["phutho/phutho-van-lang-empire-golf-club", "van-lang-empire-golf-club"], ["quangninh/quangninh-silk-path-dong-trieu-golf-and-country-club", "silk-path-dong-trieu-golf"], ["bacgiang/bacgiang-corn-hill-luc-nam-bac-giang", "corn-hill-golf-resort"], ["binhduong/binhduong-royal-island-golf-and-villas", "royal-island-golf-villas"], ["ninhbinh/ninhbinh-royal-golf-course", "royal-golf-club-ninh-binh"], ["thanhhoa/thanhhoa-flc-golf-links-sam-son", "flc-samson-golf-links"]]) {
    const entry = legacyGolfPaths.find((item) => item.from === from);
    if (legacyGolfDestination(entry ?? {}) !== `/golf/${to}.html`) failures.push(`옛 경로 재연결 누락: ${from} → ${to}`);
  }
}

// IndexNow(2026-11-20): 사이트맵 주소마다 dist 파일이 있어야 내용 비교가 된다. 바뀐 주소만 고르고, 키 파일은 public에 있다.
{
  const { distFile, pageHash, pickChanged, sitemapEntries } = await import("../scripts/indexnow.mjs");
  const entries = sitemapEntries(sitemap);
  if (entries.length !== (sitemap.match(/<loc>/g) || []).length) failures.push("IndexNow: 사이트맵 주소를 다 읽지 못함");
  for (const { loc } of entries) if (!await exists(path.join(dist, distFile(loc)))) failures.push(`IndexNow: 주소에 맞는 dist 파일 없음 (${loc})`);
  if (pageHash('<link href="/a.css?v=0123456789ab">') !== pageHash('<link href="/a.css?v=ba9876543210">')) failures.push("IndexNow: 자산 버전만 바뀐 쪽을 바뀐 쪽으로 봄");
  const picked = pickChanged({ pages: { a: "1", b: "2", c: "3" } }, { pages: { a: "1", b: "9" } });
  if (picked.join() !== "b,c") failures.push(`IndexNow: 새·바뀐 주소 고르기 오류 (${picked.join()})`);
  if ((await readFile(path.join(root, "public/d5b83e4cf4084a38b2b71a6f9a62c7de.txt"), "utf8")).trim() !== "d5b83e4cf4084a38b2b71a6f9a62c7de") failures.push("IndexNow 키 파일 내용 오류");
}

// 차량 렌트 상황별 페이지(/rent)와 골프·숙소·차량·베트남밤 교차 연결(2026-11-20).
// 렌트 쪽 존재·사이트맵·llms.txt, /go/rent-* noindex·사이트맵 제외, 금액 0, FAQ 화면=FAQPage, 베트남밤은 호치민·다낭 골프장에만.
{
  const decode = (value) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#039;/g, "'").replace(/&amp;/g, "&");
  const plain = (html) => html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\d[\d,.]*\s*k?m(?![a-z])/gi, " ");
  const bamUrls = { hcm: "https://vietnambam.com/hochiminh/", danang: "https://vietnambam.com/danang/" };
  const rentPaths = ["/rent", ...rentPages.map((page) => `/rent/${page.slug}.html`), ...hcmCourses.map(golfRentPath)];
  const goOf = (pathname) => pathname === "/rent" ? null : (rentPages.find((page) => `/rent/${page.slug}.html` === pathname)?.go ?? "golf");
  if (hcmCourses.length !== 15) failures.push(`골프장별 차량 쪽 ${hcmCourses.length}곳 (호치민권 15곳 예상, 11-21 로얄 아일랜드 추가)`);
  for (const pathname of rentPaths) {
    const relative = pathname === "/rent" ? "rent/index.html" : pathname.slice(1);
    if (!await exists(path.join(dist, relative))) { failures.push(`렌트 쪽 없음: ${relative}`); continue; }
    if (!sitemap.includes(`<loc>${site.siteUrl}${pathname}</loc>`)) failures.push(`${relative}: 사이트맵 누락`);
    if (!llms.includes(`(${site.siteUrl}${pathname})`)) failures.push(`${relative}: llms.txt 누락`);
    const html = await readFile(path.join(dist, relative), "utf8");
    const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? "";
    const hit = plain(main).match(PRICE);
    if (hit) failures.push(`${relative}: 금액 표기(${hit[0]})`);
    if (/(?:29|45)\s*인승/.test(plain(main))) failures.push(`${relative}: 사이트에 없는 인승(29·45인승) 표기`);
    if (/영어\s*가능|영어 기사|한국어 기사/.test(main)) failures.push(`${relative}: 사이트에 없는 서비스 문구`);
    if (!html.includes('href="/rent"')) failures.push(`${relative}: 렌트 허브 링크 누락`);
    if (pathname === "/rent") continue;
    const go = goOf(pathname);
    const goLinks = [...main.matchAll(/href="(\/go\/rent-[a-z0-9-]+)"/g)].map((match) => match[1]);
    if (goLinks.length < 1 || goLinks.some((href) => href !== `/go/rent-${go}`)) failures.push(`${relative}: 카톡 버튼은 /go/rent-${go}만 (${[...new Set(goLinks)].join(", ")})`);
    const visible = [...(main.match(/<section class="rent-faq"[\s\S]*?<\/section>/)?.[0] ?? "").matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map((match) => [decode(match[1]), decode(match[2])]);
    const faqBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((block) => { try { return JSON.parse(block[1]); } catch { return null; } }).filter((data) => data?.["@type"] === "FAQPage");
    const structured = (faqBlocks[0]?.mainEntity ?? []).map((item) => [item.name, item.acceptedAnswer?.text]);
    if (faqBlocks.length !== 1 || visible.length !== 3) failures.push(`${relative}: FAQ ${visible.length}문항·FAQPage ${faqBlocks.length}개 (3문항·1개여야 함)`);
    if (JSON.stringify(visible) !== JSON.stringify(structured)) failures.push(`${relative}: FAQ 보이는 문답과 FAQPage 불일치`);
    for (const heading of ["차량 고르는 기준|몇 인승을 고를까", "일정 예시", "함께 묶으면 좋은 것", "자주 묻는 질문"]) if (!new RegExp(`<h2[^>]*>(?:[^<]*)(?:${heading})`).test(main)) failures.push(`${relative}: 공통 틀 섹션 누락 (${heading})`);
    if (!main.includes('href="https://hochiminhpoolvilla.com/villa/villa.html" target="_blank" rel="noopener"')) failures.push(`${relative}: 풀빌라 목록 새 탭 연결 누락`);
  }
  if (await exists(path.join(dist, "rent/airport-pickup.html")) || rentPaths.some((item) => /airport/.test(item))) failures.push("공항 픽업 전용 렌트 쪽은 만들지 않음");
  for (const page of rentPages.filter((item) => item.trip)) {
    const html = await readFile(path.join(dist, `rent/${page.slug}.html`), "utf8");
    if (!/약 \d+km, 약 \d+시간(?: \d+분)?입니다\(교통 상황에 따라 다름\)/.test(html)) failures.push(`rent/${page.slug}.html: 당일 이동시간 "약 ○시간, 교통 상황에 따라 다름" 표시 누락`);
  }
  // 골프장 상세 ↔ 골프장별 차량 쪽 연결
  for (const course of hcmCourses) {
    const golf = await readFile(path.join(dist, `golf/${course.slug}.html`), "utf8");
    const block = golf.match(/<section class="section shell stay-combo"[\s\S]*?<\/section>/)?.[0] ?? "";
    if (!block.includes(`href="${golfRentPath(course)}"`)) failures.push(`golf/${course.slug}.html: 묶음 블록에 "이 골프장까지 차량" 링크 누락`);
    if (!block.includes("차량은 기본으로 넣어 드리고 필요 없으면 빼 드립니다")) failures.push(`golf/${course.slug}.html: 묶음 블록에 차량 기본 포함 문구 누락`);
    if (/vietnambam\.com/.test(block)) failures.push(`golf/${course.slug}.html: 풀빌라 묶음 블록 안에 베트남밤 링크`);
    const rent = await readFile(path.join(dist, golfRentPath(course).slice(1)), "utf8");
    if (!rent.includes(`href="/golf/${course.slug}.html"`)) failures.push(`${golfRentPath(course)}: 골프장 상세 링크 누락`);
    if (!rent.includes(`약 ${course.drive}`) || !rent.includes("공항 기준")) failures.push(`${golfRentPath(course)}: 공항 기준 이동시간(${course.drive}) 누락`);
  }
  // 베트남밤: 호치민권 골프장 → hochiminh, 다낭권 → danang, 다른 지역 골프장 0. 그 밖에는 렌트 쪽(호치민)만. 모두 새 탭 noopener.
  let bamCourses = 0;
  for (const file of htmlFiles) {
    const relative = path.relative(dist, file).split(path.sep).join("/");
    const html = await readFile(file, "utf8");
    const links = [...html.matchAll(/<a\b[^>]*href="(https:\/\/vietnambam\.com[^"]*)"[^>]*>/g)];
    for (const link of links) {
      if (!Object.values(bamUrls).includes(link[1])) failures.push(`${relative}: 열리지 않은 베트남밤 주소 ${link[1]}`);
      if (!/target="_blank"/.test(link[0]) || !/rel="[^"]*noopener/.test(link[0])) failures.push(`${relative}: 베트남밤 링크 새 탭 noopener 누락`);
    }
    const urls = links.map((link) => link[1]);
    const course = courses.find((item) => relative === `golf/${item.slug}.html`);
    if (course) {
      const expected = bamUrls[course.area];
      if (!expected) { if (urls.length) failures.push(`${relative}: 호치민·다낭권이 아닌데 베트남밤 링크`); continue; }
      if (urls.length !== 1 || urls[0] !== expected) failures.push(`${relative}: 베트남밤 링크는 ${expected} 1개여야 함 (${urls.join(", ")})`);
      else bamCourses += 1;
      continue;
    }
    if (urls.length && !relative.startsWith("rent/")) failures.push(`${relative}: 골프장·렌트 쪽이 아닌데 베트남밤 링크`);
    if (relative.startsWith("rent/") && urls.some((url) => url !== bamUrls.hcm)) failures.push(`${relative}: 렌트(호치민) 쪽에 호치민 밖 베트남밤 링크`);
    if (/^go\//.test(relative) && urls.length) failures.push(`${relative}: 상담 이동 쪽에 베트남밤 링크`);
  }
  const expectedBam = courses.filter((course) => bamUrls[course.area]).length;
  if (bamCourses !== expectedBam) failures.push(`베트남밤 링크 골프장 ${bamCourses}곳 (예상 ${expectedBam}곳)`);
  // /go/rent-*: 골프 카카오 채널, noindex, tracker, 금액 없음, 사이트맵·llms.txt 제외
  for (const code of rentGoCodes) {
    const goFile = path.join(dist, `go/rent-${code}.html`);
    if (!await exists(goFile)) { failures.push(`/go/rent-${code} 페이지 없음`); continue; }
    const go = await readFile(goFile, "utf8");
    if (!go.includes('<meta name="robots" content="noindex,nofollow">')) failures.push(`/go/rent-${code} noindex 누락`);
    if (!go.includes('href="https://pf.kakao.com/_xdBALn/chat"') || go.includes("_FXwxkG")) failures.push(`/go/rent-${code} 골프 카카오 채널(_xdBALn) 아님`);
    if (!go.includes('data-company-site-tracker="xinchao-golf"')) failures.push(`/go/rent-${code} 관제판 tracker 누락`);
    const hit = plain(go).match(PRICE);
    if (hit) failures.push(`/go/rent-${code} 금액 표기(${hit[0]})`);
  }
  const combo = await readFile(path.join(dist, "go/golf-combo.html"), "utf8");
  if (!combo.includes("차량은 기본으로 넣어 드리고 필요 없으면 빼 드립니다")) failures.push("/go/golf-combo 차량 기본 포함 문구 누락");
  if (/\/go\//.test(sitemap) || /\/go\//.test(llms)) failures.push("사이트맵·llms.txt에 /go/ 주소 포함");
  // 메뉴·서비스 허브·차량 쪽에서 렌트 허브로
  for (const relative of ["index.html", "services/index.html", "services/vehicle.html"]) {
    const html = await readFile(path.join(dist, relative), "utf8");
    if (!html.includes('<a href="/rent"')) failures.push(`${relative}: 렌트 허브(/rent) 연결 누락`);
  }
}

if (failures.length) {
  console.error(`검수 실패 ${failures.length}건`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`검수 통과: 콘텐츠 ${contentPages.length}페이지, 전체 HTML ${htmlFiles.length}개, 내부 경로·SEO 기본값 정상`);

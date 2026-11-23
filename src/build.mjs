import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarkdownPosts } from "./blog-content.mjs";
import { apartments, courses, golfAreas, legacyHost, poolvilla, regions, services, site, villas } from "./site-data.mjs";
import { courseFaqs, courseGuides } from "./course-guides.mjs";
import { coursesForGuide, hubForCategory, topicHubs } from "./topic-hubs.mjs";
import { legacyGolfDestination, legacyGolfPaths } from "./legacy-golf-paths.mjs";
import { pricing, pricingGuideHtml, pricingSummary } from "./pricing-guide.mjs";
import { readFileSync } from "node:fs";
import { chooseRows, courseLabel, dayTripRoutes, directionOf, golfRentFaqs, golfRentPath, hcmCourses, longDistance, luggageNote, rentGo, rentPages, vehicleTypes, vietnambam } from "./rent-data.mjs";

const flatName = (name) => name.replace(/\s*\(([^)]+)\)/g, "·$1");
const areaOf = (course) => golfAreas.find((area) => area.key === course.area);
// 지역 게시판: 골프장에 board가 있으면(붕따우·호트람·쩌우득 → vungtau) 그쪽, 없으면 권역의 게시판.
const boardOf = (course) => course.board || areaOf(course).board;
const airportShort = (course) => (course.airport || areaOf(course).airport).replace(/\s*\(.*\)$/, "");
// 사진 없는 골프장의 "코스 정보 카드"용 베트남 윤곽(직접 그린 단순 선, 외부 지도 아님)과 지역 점 위치(2026-11-21)
const vnOutline = "M5.5 12.0 L9.0 8.0 L14.0 10.0 L19.0 8.0 L24.0 8.0 L29.0 6.0 L37.0 3.0 L42.0 7.0 L50.0 7.0 L51.0 13.0 L58.0 20.0 L64.0 21.0 L56.0 26.0 L51.0 29.0 L50.0 33.0 L44.0 38.0 L42.0 44.0 L40.0 48.0 L47.0 54.0 L49.0 58.0 L55.0 66.0 L62.0 72.0 L66.0 75.0 L71.0 82.0 L74.0 90.0 L76.0 98.0 L77.0 106.0 L76.0 112.0 L76.0 118.0 L73.0 123.0 L68.0 126.0 L60.0 131.0 L54.0 132.0 L51.0 134.0 L48.0 140.0 L43.0 143.0 L38.0 148.0 L34.0 150.0 L32.0 148.0 L33.0 141.0 L32.0 134.0 L29.0 132.0 L34.0 127.0 L42.0 126.0 L45.0 119.0 L49.0 117.0 L59.0 113.0 L59.0 106.0 L60.0 98.0 L59.0 89.0 L60.0 84.0 L56.0 78.0 L51.0 73.0 L49.0 69.0 L43.0 62.0 L40.0 56.0 L35.0 50.0 L29.0 47.0 L23.0 43.0 L27.0 39.0 L30.0 33.0 L24.0 27.0 L16.0 28.0 L11.0 23.0 Z";
const vnAreaDot = { hcm: [51.0, 128.0], phanthiet: [65.0, 126.5], hanoi: [42.5, 26.0], haiphong: [51.0, 27.5], danang: [66.0, 75.5], central: [52.0, 63.0], nhatrang: [76.0, 113.5], dalat: [68.5, 116.5], phuquoc: [23.7, 133.5] };
// 지역 점에서 많이 떨어진 골프장(예: 하노이권의 탄호아 FLC 삼선)은 course.mapDot으로 점 위치를 따로 준다.
const vnMap = (area, dot) => { const [cx, cy] = dot || vnAreaDot[area] || vnAreaDot.hcm; return `<svg class="plate-map" viewBox="0 0 80 155" aria-hidden="true" focusable="false"><path d="${vnOutline}"/><ellipse cx="23.7" cy="133.5" rx="1.6" ry="3.2"/><circle class="plate-map-ring" cx="${cx}" cy="${cy}" r="6"/><circle class="plate-map-dot" cx="${cx}" cy="${cy}" r="3"/></svg>`; };
const courseVisual = (course, className, loading = "lazy") => course.image
  ? `<img src="/assets/images/${course.image}" width="1200" height="800"${focusStyle(course.image)} ${loading === "eager" ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} alt="${photoAlt(course)}">${aiBadge(course)}`
  : `<span class="course-plate ${className}" data-area="${course.area}" role="img" aria-label="${escapeHtml(course.name)} 코스 정보 카드">${vnMap(course.area, course.mapDot)}<small>${escapeHtml(areaOf(course).name)} · ${escapeHtml(course.holes.split(" ")[0])}</small><strong>${escapeHtml(course.name)}</strong><em>✈ ${escapeHtml(airportShort(course))}에서 차량 약 <b>${escapeHtml(course.drive)}</b></em><span class="plate-note">실제 사진은 카톡 상담 때 보내 드립니다</span></span>`;
// 상세 첫 화면 대표 사진: 기본은 course.image, 해상도가 낮으면 같은 골프장의 더 큰 사진을 쓴다(2026-11-21).
const heroImageOverride = {
  "harmony-golf-park": "course-harmony.webp",
  "sky-lake-golf": "courses/golf-sky-lake-golf-2.webp",
  "thanh-lanh-valley-golf": "courses/golf-thanh-lanh-valley-golf-1.webp",
  "ruby-tree-golf": "courses/golf-ruby-tree-golf-1.webp",
  // 11-22 대표님 "흐린 첫 사진 보완": 가진 실사 중 가장 선명한 장 + 가벼운 선명 보정(UnsharpMask)
  "sea-links-golf": "courses/golf-sea-links-golf-3.webp",
  "heron-lake-golf": "courses/golf-heron-lake-golf-1.webp",
};
// 사진마다 잘리면 안 되는 곳(클럽하우스·그린·사람)에 맞춘 초점. 없으면 가운데.
const photoFocus = { "course-tan-son-nhat.webp": "30% center", "courses/ai-amber-hills-golf-resort.webp": "25% center", "courses/ai-legend-valley-country-club.webp": "70% center", "courses/ai-silk-path-dong-trieu-golf.webp": "80% center", "courses/golf-stone-valley-golf-resort-video.webp": "center top", "courses/ai-corn-hill-golf-resort.webp": "35% center", "courses/ai-royal-golf-club-ninh-binh.webp": "60% center", "courses/ai-flc-samson-golf-links.webp": "40% center", "courses/ai-royal-island-golf-villas.webp": "60% center", "courses/ai-flc-quang-tri-golf-links.webp": "25% center", "courses/ai-muong-thanh-xuan-thanh-golf.webp": "60% center" };
// AI 연출 대표 사진(course.aiStaged): 실제 골프장 사진으로 오해하지 않게 "AI 연출 이미지" 표시를 붙이고 alt를 바꾼다.
// 구조화 데이터(GolfCourse image)와 공유 이미지(og:image)에는 쓰지 않는다.
// 이름이 이미 "골프장"으로 끝나면(롱비엔 골프장·몬타냐 골프장) 한 번만 쓴다(11-22).
const photoAlt = (course) => course.aiStaged ? "골프 연출 이미지" : `${escapeHtml(course.name)}${/골프장$/.test(course.name) ? "" : " 골프장"} 전경`;
const aiBadge = (course) => course.aiStaged ? `<span class="ai-badge">AI 연출 이미지</span>` : "";
const focusStyle = (file) => photoFocus[file] ? ` style="object-position:${photoFocus[file]}"` : "";
const courseHeroImage = (course) => heroImageOverride[course.slug] || course.image;
const courseGalleryImages = (course) => course.image ? [course.image, ...(course.gallery || [])].filter((file) => file !== courseHeroImage(course)) : [];
// "1시간 20분~1시간 50분", "40~60분" → 가장 짧은 분(정렬용)
const driveMinMinutes = (drive = "") => { const first = drive.split("~")[0]; const h = first.match(/(\d+)\s*시간/); const m = first.match(/(\d+)\s*분?$/) || first.match(/(\d+)\s*분/); return (h ? +h[1] * 60 : 0) + (m && !/시간$/.test(first.trim()) ? +m[1] : 0); };
const relatedHref = (file) => file.startsWith("guide/") ? `/${file}` : `/blog/${file}`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const assetVersion = async (relative) => createHash("sha256")
  .update(await readFile(path.join(root, "public/assets", relative)))
  .digest("hex").slice(0, 12);
const styleVersion = await assetVersion("css/site.css");
const scriptVersion = await assetVersion("js/site.js");
const reqCardVersion = await assetVersion("js/req-card.js");

const legacyBlogPosts = [
  {
    file: "ho-chi-minh-4-room-pool-villa-guide.html",
    title: "호치민 4룸 풀빌라 예약 전 확인사항",
    description: "호치민 4룸 풀빌라를 알아볼 때 확인해야 할 임시 거주자 등록, 침실과 공용 공간 구조, 골프 일정에 맞춘 숙소 상담 방법을 정리했습니다.",
    category: "풀빌라",
    date: "2025-12-18",
    cover: "18_12_1/1 (1).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-8-room-pool-villa-guide.html",
    title: "호치민 8룸 꿈 풀빌라 안내",
    description: "호치민 단체여행을 위한 8룸 꿈 풀빌라의 공간 구성과 방 나누기, 골프 일행이 예약 전에 확인해야 할 사항을 정리했습니다.",
    category: "풀빌라",
    date: "2025-12-18",
    cover: "18_12_2/1 (7).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-lexington-apartment-guide.html",
    title: "호치민 렉싱턴 아파트 안내",
    description: "호치민 2군 렉싱턴 아파트의 객실 구성과 체류 전 확인사항, 골프장 이동을 함께 생각한 숙소 선택 기준을 정리했습니다.",
    category: "아파트",
    date: "2025-12-18",
    cover: "19_12_2/p1 (1).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-the-sun-avenue-q2-apartment-guide.html",
    title: "호치민 더 썬 에비뉴 Q2 아파트 안내",
    description: "호치민 2군 더 썬 에비뉴 아파트의 객실 유형과 체류 전 확인사항, 골프 일정에 맞춘 숙소 선택 기준을 정리했습니다.",
    category: "아파트",
    date: "2025-12-18",
    cover: "19_12_1/tn (1).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-y4-6-room-pool-villa.html",
    title: "호치민 Y4 6룸 풀빌라 안내",
    description: "타오디엔 Y4 6룸 풀빌라의 객실과 수영장, 단체 골프여행 일행이 예약 전에 확인할 방 배정과 상담 방법을 안내합니다.",
    category: "풀빌라",
    date: "2025-12-18",
    cover: "18_12_3/z7300994846764_e68cccb1267513b8c1f894d22df62f5d.webp",
    sourceType: "legacy",
  },
];

const markdownBlogPosts = await loadMarkdownPosts(path.join(root, "src/content/blog"));
const guides = JSON.parse(await readFile(path.join(root, "src/content/guides.json"), "utf8")).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "ko"));
const guideCategories = ["예약 준비", "일정 짜기", "비용 확인"];
const blogPosts = [...legacyBlogPosts, ...markdownBlogPosts].sort((a, b) => b.date.localeCompare(a.date));
const duplicatePostFiles = blogPosts.filter((post, index) => blogPosts.findIndex((item) => item.file === post.file) !== index);
if (duplicatePostFiles.length) throw new Error(`중복 블로그 주소: ${[...new Set(duplicatePostFiles.map((post) => post.file))].join(", ")}`);

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function directInquiryLinks(markup) {
  return markup
    .replaceAll("https://pf.kakao.com/_FXwxkG/chat", site.kakaoUrl)
    .replaceAll("http://pf.kakao.com/_FXwxkG/chat", site.kakaoUrl)
    .replace(/<button\b([^>]*\bclass="[^"]*\bjs-consult\b[^"]*"[^>]*)>([\s\S]*?)<\/button>/g, (_, attributes, label) => {
      const classes = attributes.match(/\bclass="([^"]*)"/)?.[1];
      if (!classes) throw new Error("상담 버튼의 class 속성이 없습니다.");
      const otherAttributes = attributes
        .replace(/\s*class="[^"]*"/, "")
        .replace(/\s*type="button"/, "")
        .replace(/\s*data-interest="[^"]*"/, "");
      const linkClasses = classes.split(/\s+/).filter((name) => name !== "js-consult").join(" ");
      return `<a class="${linkClasses}" href="${site.kakaoUrl}" target="_blank" rel="noopener noreferrer"${otherAttributes}>${label}</a>`;
    });
}

const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;

const breadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, pathname], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: `${site.siteUrl}${pathname}`,
  })),
});

function head({ title, description, pathname, image = "hero-golf-longthanh.webp", schema = [], robots = "index,follow,max-image-preview:large", pageType = "website", publishedTime, modifiedTime, keywords = [], preloadImage }) {
  const canonical = `${site.siteUrl}${pathname}`;
  const fullTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  const socialImage = image.startsWith("blog/") ? `${site.siteUrl}/assets/${image}` : `${site.siteUrl}/assets/images/${image}`;
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    ${keywords.length ? `<meta name="keywords" content="${escapeHtml(keywords.join(", "))}">` : ""}
    <meta name="robots" content="${robots}">
    <meta name="naver-site-verification" content="b96abf7bc05e345b7845c532c910b39d94492f16">
    ${pathname === "/" ? '<meta name="google-site-verification" content="-k-E0u84LV0aNcr4V98z4TuLgwzxHWbOmGMCDDxsLzg" />' : ""}
    <meta name="theme-color" content="#0f5138">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="${pageType}">
    <meta property="og:locale" content="ko_KR">
    <meta property="og:site_name" content="${site.name}">
    <meta property="og:title" content="${escapeHtml(fullTitle)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${socialImage}">
    <meta property="og:image:alt" content="${escapeHtml(fullTitle)}">
    ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ""}
    ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${socialImage}">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/assets/images/xinchao-golf-logo-192.webp" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/images/xinchao-golf-logo-192.webp">
    <link rel="manifest" href="/manifest.webmanifest">
    ${preloadImage ? `<link rel="preload" as="image" href="${preloadImage}" fetchpriority="high">` : ""}
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="preload" as="style" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"></noscript>
    <link rel="stylesheet" href="/assets/css/site.css?v=${styleVersion}">
    ${schema.map(jsonLd).join("\n")}`;
}

function header(active = "") {
  const items = [
    ["golf", "/golf", "베트남 골프장"],
    ["regions", "/regions", "지역별 골프"],
    ["guide", "/guide", "예약 가이드"],
    ["services", "/services", "숙소·차량"],
    ["rent", "/rent", "차량 렌트"],
    ["airport", "/airport", "공항 픽업"],
    ["blog", "/blog", "골프정보"],
  ];
  return `
    <a class="skip-link" href="#main">본문 바로가기</a>
    <header class="site-header">
      <div class="shell header-inner">
        <a class="brand" href="/" aria-label="신짜오골프 홈">
          <span class="brand-mark" aria-hidden="true"></span>
          <span><strong>${site.name}</strong><small>${site.englishName}</small></span>
        </a>
        <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu">메뉴</button>
        <nav id="site-menu" class="site-nav" aria-label="주요 메뉴">
          ${items.map(([key, href, label]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
          <button class="button button-small js-consult" type="button" data-interest="빠른 상담">상담하기</button>
        </nav>
      </div>
    </header>`;
}

function footer(pathname = "") {
  return `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div><strong>${site.name}</strong><p>베트남 골프장·차량·숙소 한국어 상담</p><p>상담 채널: 카카오톡 「신짜오베트남 골프예약」</p></div>
        <div><p>홈페이지에서는 상품을 판매하거나 결제받지 않습니다.</p><p><a href="/about.html">브랜드 소개</a> · <a href="/editorial-policy.html">편집 원칙</a> · <a href="/source-policy.html">출처 원칙</a></p><button class="text-button js-consult" type="button" data-interest="홈페이지 상담">카카오톡 상담하기 →</button></div>
      </div>
      <div class="shell copyright">© ${new Date().getFullYear()} ${site.englishName}. All rights reserved.</div>
    </footer>
    <button class="floating-consult js-consult" type="button" data-interest="빠른 상담" aria-label="카카오톡 빠른 상담">상담</button>
    <div class="mobile-cta-bar"><a class="mobile-cta-golf" href="/golf">골프장 ${courses.length}곳</a>${courseOfPath(pathname) ? `<a class="mobile-cta-kakao" href="/go/quick-golf?from=${courseOfPath(pathname).slug}" data-one-tap="${escapeHtml(`[신짜오골프] ${courseOfPath(pathname).name} 견적 문의\n날짜·인원·티오프 희망 시간은 이어서 알려 드릴게요.`)}">이 골프장으로 견적</a>` : `<button class="mobile-cta-kakao js-consult" type="button" data-interest="모바일 하단 상담">카카오톡 예약 문의</button>`}</div>
    <script src="/assets/js/site.js?v=${scriptVersion}" defer></script>
    <script src="/assets/js/req-card.js?v=${reqCardVersion}" defer></script>
    <script src="https://company-site-monitor.vercel.app/tracker.js?site=xinchao-golf" defer></script>`;
}

// 믿음 칸(한 줄, 2026-11-22 대표님 "보완"): 첫 화면 아래와 골프장 상세 맨 아래. 가격·패키지 표현 없음.
const trustLine = (href = "/#ops") => `<div class="trust-line" aria-label="운영 안내"><span>🏢 운영 신짜오</span><span>📍 호치민 현지 사무실</span><span>💬 카톡 ID kkacmn</span><a href="/#ops">📱 실제 운영 화면</a></div>`.replace('href="/#ops"', `href="${href}"`);
const courseOfPath = (pathname) => courses.find((course) => pathname === `/golf/${course.slug}.html`);
function layout({ title, description, pathname, active, content, image, schema = [], robots, pageType, publishedTime, modifiedTime, keywords = [], preloadImage }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.siteUrl}/#organization`,
    name: site.name,
    alternateName: site.englishName,
    url: site.siteUrl,
    description: site.description,
    logo: {
      "@type": "ImageObject",
      url: `${site.siteUrl}/assets/images/xinchao-golf-logo-512.webp`,
      width: 512,
      height: 512,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: site.kakaoUrl,
      availableLanguage: "ko",
    },
    // 공식 채널(총괄 11-20 확인, 모두 200). 카카오 채널은 contactPoint에 있다. 페이스북·틱톡은 넣지 않는다.
    sameAs: [
      "https://www.youtube.com/channel/UCATu1VDcTf8FqNkbvlkRgyA",
      "https://www.instagram.com/xin.chaohcm/",
      "https://www.threads.com/@xin.chaohcm",
      "https://cafe.naver.com/prpr12",
      "https://blog.naver.com/jjacmn",
      "https://blog.naver.com/akkacmn",
    ],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.siteUrl}/#website`,
    url: `${site.siteUrl}/`,
    name: site.name,
    alternateName: site.englishName,
    inLanguage: "ko-KR",
    publisher: { "@id": `${site.siteUrl}/#organization` },
  };
  const collectionPaths = ["/golf", "/regions", "/guide", "/services", "/rent", "/services/apartments.html", "/services/villas.html", "/blog", ...topicHubs.map((hub) => hub.path)];
  const isVehicle = pathname === "/services/vehicle.html";
  const pageSchema = pathname === "/" ? [organization, website, ...schema] : [...schema];
  if (collectionPaths.includes(pathname) || isVehicle) {
    const url = `${site.siteUrl}${pathname}`;
    pageSchema.push({
      "@context": "https://schema.org",
      "@type": isVehicle ? "WebPage" : "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": website["@id"] },
      publisher: { "@id": organization["@id"] },
      ...(isVehicle ? { mainEntity: {
        "@type": "Service",
        "@id": `${url}#service`,
        url,
        name: title,
        description,
        serviceType: title,
        areaServed: { "@type": "City", name: "호치민" },
        provider: { "@id": organization["@id"] },
      } } : {}),
    });
  }
  return directInquiryLinks(`<!doctype html>
<html lang="ko">
  <head>${head({ title, description, pathname, image, schema: pageSchema, robots, pageType, publishedTime, modifiedTime, keywords, preloadImage })}</head>
  <body class="${pathname === "/" ? "home-page" : ""}${pathname === "/golf" ? " golf-index-page" : ""}">${header(active)}<main id="main">${content}${courseOfPath(pathname) ? trustLine() : ""}</main>${footer(pathname)}</body>
</html>`);
}

function courseCard(course) {
  return `
    <article class="course-card">
      <a class="card-image" href="/golf/${course.slug}.html" aria-label="${escapeHtml(course.name)} 상세보기">
        ${courseVisual(course, "course-plate-card")}
        ${course.image ? `<span class="card-badges"><span>${escapeHtml(course.holes.split(" ")[0])}</span><span>공항에서 ${escapeHtml(course.drive)}</span></span>` : ""}
      </a>
      <div class="card-body">
        <div class="card-meta"><span>${escapeHtml(course.region)}</span><span>✈ ${escapeHtml(airportShort(course).replace(" 국제공항", "").replace(" 공항", ""))} 공항</span></div>
        <h3><a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a></h3>
        <p class="english-name">${escapeHtml(course.englishName)}</p>
        <p>${escapeHtml(course.summary)}</p>
        <div class="card-actions">
          <a class="text-link" href="/golf/${course.slug}.html">자세히 보기</a>
          <button class="button button-kakao button-small js-consult" type="button" data-interest="${escapeHtml(course.name)} 상담">카톡 문의</button>
        </div>
      </div>
    </article>`;
}

// 첫 화면 밖 배경 사진은 site.js가 화면 가까이 왔을 때 붙인다(모바일 LCP 대역폭 확보).
// 첫 번째 히어로 슬라이드만 바로 불러오고, 나머지 슬라이드는 load 뒤에 붙인다.
function deferHomeBackgrounds(html) {
  let slide = 0;
  return html
    .replace(/<span class="hero-slide" style="([^"]*)"/g, (match, style) => (slide++ === 0 ? match : `<span class="hero-slide" data-deferred-style="${style}"`))
    .replace(/(<(?:a|article|section|div)\b[^>]*?) style="(--(?:tile|card|hero)-img:url\([^)]*\))"/g, (match, start, style) => `${start} data-lazy-style="${style}"`);
}

// 홈 자주 묻는 질문(손님용). 보이는 문답과 FAQPage JSON-LD는 이 배열 하나에서 만든다(구글 규칙: 내용 일치).
// 사이트에 이미 있는 사실만 쓰고, 금액·답변 시간 숫자는 넣지 않는다. 홈 #pricing 블록 문장(src/pricing-guide.mjs)은 되풀이하지 않는다.
function homeFaqs() {
  return [
    ["어떤 골프장을 예약할 수 있나요?", `베트남 ${golfAreas.length}개 지역(${golfAreas.map((area) => area.name).join(", ")})의 골프장 ${courses.length}곳을 안내합니다. 원하는 날짜의 예약 가능 여부는 상담 때 확인합니다.`],
    ["차량·숙소도 함께 예약되나요?", "네. 골프장과 함께 공항 픽업·골프장 왕복 차량, 호치민 아파트·풀빌라를 한 번에 상담합니다. 이용 가능 여부는 날짜와 인원에 따라 달라 상담 때 확인합니다."],
    ["티타임은 어떻게 정하나요?", "희망 시간대를 알려 주시면 골프장에 가능한 티타임을 확인해 안내합니다. 도착일 라운드라면 항공 도착 시각에 입국 심사·짐 찾기와 공항 이동시간을 더해 티오프를 잡으세요."],
    ["예약 확정은 언제 되나요?", "문의 접수만으로는 예약이 확정되지 않습니다. 날짜·인원·티오프를 확인한 뒤 골프장별 결제 방식에 따라 입금하시면 부킹을 진행하고, 부킹이 완료되면 바우처를 안내해 드립니다."],
    ["공항에서 골프장까지 이동시간은 어디서 보나요?", "골프장마다 가장 가까운 공항에서 차로 걸리는 시간을 표시해 두었고, 골프장 안내의 공항→골프장 시간표에서 한 번에 비교할 수 있습니다. 평소 교통 기준이라 출퇴근 시간·주말·비 오는 날에는 더 걸릴 수 있습니다."],
    ["한국어로 상담할 수 있나요?", "네. 골프장·차량·숙소 상담을 모두 한국어로 진행합니다. 카카오톡 「신짜오베트남 골프예약」 채널에 희망 지역·날짜·인원을 보내 주시면 상담을 시작합니다."],
  ];
}

function homePage() {
  const faqs = homeFaqs();
  const featured = golfAreas.flatMap((area) => courses.filter((course) => course.area === area.key).slice(0, area.key === "hcm" ? 2 : 1)).slice(0, 6);
  const content = `
    <section class="hero-x">
      <picture class="hero-photo"><source media="(max-width: 760px)" srcset="/assets/images/hero/golf_mobile_b.webp" width="1080" height="2340"><img src="/assets/images/courses/golf-novaworld-phan-thiet-golf.webp" width="1200" height="800" fetchpriority="high" alt="골프 연출 이미지"></picture><span class="ai-badge hero-ai-badge">AI 연출 이미지</span>
      <div class="shell hero-x-inner">
        <p class="hero-x-kicker">베트남 골프 한국어 예약 상담</p>
        <h1>베트남 골프장 예약,<br>카톡 한 번으로</h1>
        <p class="hero-x-lead"><span class="lead-long">베트남 골프장 ${courses.length}곳의 위치와 공항 이동시간을 비교하고, 골프장 예약·차량·숙소를 카카오톡으로 한 번에 상담하세요.</span><span class="lead-short">골프장 ${courses.length}곳 공항 이동시간 비교, <span class="nowrap">예약·차량·숙소는</span> 한국어로 한 번에.</span></p>
        <div class="hero-x-actions">
          <a class="button button-kakao button-lg" href="#combo">골프·숙소·차량 한 번에 견적</a>
          <a class="button button-glass button-lg" href="/golf">골프장 ${courses.length}곳 공항시간 보기</a>
        </div>
        <p class="hero-x-note">한국어로 상담합니다 · 문의는 확인 후 순서대로 답변드립니다</p>
      </div>
    </section>
    ${comboReqCard()}
    ${trustLine("#ops")}<section class="near-airport" aria-labelledby="near-airport-title"><div class="shell">
      <div class="section-heading"><div><p class="eyebrow">골프장 ${courses.length}곳 공항 이동시간</p><h2 id="near-airport-title">공항에서 가까운 골프장</h2></div><a class="text-link" href="/golf#airport-times">공항→골프장 시간표 전체 →</a></div>
      <ul class="near-row">${courses.filter((course) => course.image).sort((a, b) => driveMinMinutes(a.drive) - driveMinMinutes(b.drive)).slice(0, 10).map((course) => `<li><a href="/golf/${course.slug}.html"><img src="/assets/images/${course.image}" width="1200" height="800"${focusStyle(course.image)} loading="lazy" decoding="async" alt="${photoAlt(course)}">${aiBadge(course)}<span class="near-area">${escapeHtml(areaOf(course).name)}</span><strong>${escapeHtml(course.name)}</strong><em>✈ ${escapeHtml(airportShort(course))}에서 <b>${escapeHtml(course.drive)}</b></em></a></li>`).join("")}</ul>
      <p class="near-note">골프장마다 가장 가까운 공항에서 차로 걸리는 평소 교통 기준 시간입니다.</p>
    </div></section>
    <section class="hero-facts" aria-label="신짜오골프 안내 범위"><div class="shell">
        <ul class="fact-strip">
          <li><strong>${courses.length}곳</strong><span>베트남 골프장</span></li>
          <li><strong>${golfAreas.length}개 지역</strong><span>북부·중부·남부</span></li>
          <li><strong>공항 시간</strong><span>골프장마다 표시</span></li>
          <li><strong>한국어</strong><span>예약·차량·숙소 상담</span></li>
        </ul>
    </div></section>
    <section class="area-strip" aria-label="지역별 골프장">
      <div class="shell">
        <div class="section-heading"><div><p class="eyebrow">어디로 가시나요?</p><h2>지역을 고르면 골프장과 공항 시간이 바로 나옵니다</h2></div><a class="text-link" href="/golf">전체 보기 →</a></div>
        <div class="area-tiles">${golfAreas.map((area) => `<a class="area-tile" href="/golf#area-${area.key}" style="--tile-img:url('/assets/images/${area.image}')">${area.image.startsWith("courses/ai-") ? `<span class="ai-badge">AI 연출 이미지</span>` : ""}<span class="area-tile-count">${courses.filter((course) => course.area === area.key).length}곳</span><strong>${escapeHtml(area.name)}</strong><em>✈ ${escapeHtml(area.airport.replace(/\s*\(.*\)$/, ""))} 기준</em></a>`).join("")}</div>
      </div>
    </section>
    <section class="signature" aria-labelledby="signature-title">
      <div class="shell">
        <div class="section-heading"><div><p class="eyebrow">대표 코스</p><h2 id="signature-title">한 번은 꼭 쳐봐야 할 베트남 대표 코스</h2></div><a class="text-link" href="/golf">${courses.length}곳 모두 보기 →</a></div>
        <div class="signature-grid">${["the-bluffs-grand-ho-tram", "hoiana-shores-golf-club", "montgomerie-links-vietnam", "kn-golf-links-cam-ranh", "ba-na-hills-golf-club", "dalat-at-1200"].map((slug, index) => { const course = courses.find((item) => item.slug === slug); const img = course.image?.startsWith("courses/") ? course.image : (course.gallery?.[0] || course.image); return `<a class="signature-card${index === 0 ? " is-feature" : ""}" href="/golf/${course.slug}.html" style="--card-img:url('/assets/images/${img}')"><span class="signature-region">${escapeHtml(areaOf(course).name)}</span><strong>${escapeHtml(course.name)}</strong><em>${escapeHtml(course.holes.split(" ")[0])} · 공항에서 ${escapeHtml(course.drive)}</em></a>`; }).join("")}</div>
      </div>
    </section>
    <section class="section prep-section">
      <div class="shell prep-grid">
        <div class="prep-copy"><p class="eyebrow">1분 상담 준비</p><h2>네 가지만 고르면<br>상담이 빨라집니다</h2><p>지역·날짜·인원·목적을 고르면 그 지역 골프장과 공항 이동시간을 바로 보여드립니다. 요약 문장은 자동으로 복사되니 카카오톡에 붙여 넣어 보내 주세요.</p><ul class="trust-list" aria-label="상담 서비스 특징"><li>한국어 상담</li><li>현지 일정 확인</li><li>부킹 후 바우처 안내</li></ul></div>
        <div class="prep-card">
          <form class="home-prep-form" id="home-prep-form" aria-label="골프 상담 준비표 만들기">
            <p class="home-prep-heading">상담 전에 네 가지만 정하세요</p>
            <div class="home-prep-fields">
              <label>희망 지역<select name="region" required><option value="">지역 선택</option>${regions.map((region) => `<option value="${region.name}">${region.name}</option>`).join("")}</select></label>
              <label>희망 날짜<input name="date" type="date" required></label>
              <label>인원<input name="people" type="number" min="1" max="40" inputmode="numeric" placeholder="예: 4" required></label>
              <label>상담 목적<select name="purpose" required><option value="">목적 선택</option><option value="골프장 후보">골프장 후보</option><option value="골프·차량">골프·차량</option><option value="골프·숙소">골프·숙소</option><option value="골프·차량·숙소">골프·차량·숙소</option></select></label>
            </div>
            <button class="button" type="submit">상담 준비 요약 보기·복사 →</button>
            <p class="home-prep-caveat">예약 가능 여부·티오프·가격은 확정 정보가 아닙니다. 상담 시 확인합니다.</p>
          </form>
          <div class="home-prep-result" id="home-prep-result" hidden aria-live="polite">
            <h2>상담 준비 요약</h2>
            <p id="home-prep-summary"></p>
            <p id="home-prep-copy-status" role="status"></p>
            <div id="home-prep-candidates" hidden><strong>선택한 지역 골프장</strong><p>아래는 상세 정보가 있는 골프장입니다. 선택한 날짜의 예약 가능 여부나 추천 순위가 아닙니다.</p>${regions.map((region) => { const list = courses.filter((course) => areaOf(course).homeRegion === region.name); return list.length ? `<ul data-region="${region.name}" hidden>${list.map((course) => `<li><a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a> <small>✈ ${escapeHtml(course.drive)}</small></li>`).join("")}</ul>` : ""; }).join("")}</div>
            <p id="home-prep-other-region" hidden>선택한 지역의 골프장 후보는 이 사이트에서 확인되지 않았습니다. <a href="/regions">지역 상담 범위</a>를 보고 상담 시 후보 확인을 요청하세요.</p>
            <a class="button button-outline" id="home-prep-continue" href="${site.kakaoUrl}" target="_blank" rel="noopener noreferrer">카카오톡 상담 바로하기 →</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section shell">
      <div class="section-heading"><div><p class="eyebrow">지역별 대표 골프장</p><h2>호치민부터 푸꾸옥까지, 공항 이동시간과 함께</h2></div><a class="text-link" href="/golf">전체 ${courses.length}곳 보기 →</a></div>
      <div class="course-grid">${featured.map(courseCard).join("")}</div>
    </section>
    <section class="section shell">
      <div class="section-heading"><div><p class="eyebrow">예약 전에 읽어보세요</p><h2>베트남 골프 예약 가이드</h2></div><a class="text-link" href="/guide">가이드 전체 보기 →</a></div>
      <ul class="guide-list guide-list-home">${guideCategories.flatMap((category) => guides.filter((guide) => guide.category === category).slice(0, 2)).map((guide) => `<li><a href="/guide/${guide.slug}.html"><em>${guide.category}</em><strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.sub)}</span></a></li>`).join("")}</ul>
      <div class="guide-jump">${topicHubs.map((hub) => `<a class="button button-quiet" href="${hub.path}">${escapeHtml(hub.title)}</a>`).join("")}</div>
    </section>
    <section class="section shell">
      <div class="section-heading"><div><p class="eyebrow">함께 준비하기</p><h2>숙소와 차량도 따로 찾지 마세요</h2></div><a class="text-link" href="/services">서비스 전체 보기 →</a></div>
      <div class="service-grid">${services.map((service) => `<article class="service-card"><img src="/assets/images/${service.image}" width="1200" height="700" loading="lazy" decoding="async" alt="${service.name} 상담"><div><h3>${service.name}</h3><p>${service.text}</p>${service.slug === "villa" || service.slug === "apartment" ? `<a class="text-link" href="${service.slug === "villa" ? poolvilla.villaList : poolvilla.apartmentList}" target="_blank" rel="noopener">${poolvilla.name}에서 ${service.name} 목록 보기 →</a><br>` : ""}<button class="text-button js-consult" type="button" data-interest="${service.name} 상담">${service.name} 상담하기 →</button></div></article>`).join("")}</div>
    </section>
    <section class="section process-section"><div class="shell"><div class="section-heading"><div><p class="eyebrow">진행 과정</p><h2>상담부터 바우처까지</h2></div></div><ol class="process-list"><li><span>01</span><strong>일정 상담</strong><p>날짜·인원·희망 지역을 확인합니다.</p></li><li><span>02</span><strong>가능 여부 확인</strong><p>골프장과 차량·숙소 일정을 확인합니다.</p></li><li><span>03</span><strong>예약 진행</strong><p>안내된 조건을 확인한 뒤 예약을 진행합니다.</p></li><li><span>04</span><strong>바우처 안내</strong><p>부킹 완료 후 필요한 내용을 전달합니다.</p></li></ol></div></section>
    <section class="ops-section" id="ops" aria-labelledby="ops-title"><div class="shell ops-inner">
      <figure class="ops-shot"><img src="/assets/images/ops/zalo-pickup.webp" alt="손님 전용 단톡방 실제 운영 화면(이름·사진·지도는 가림)" width="440" height="905" loading="lazy"><figcaption>실제 운영 화면(개인정보 가림)</figcaption></figure>
      <div class="ops-copy"><p class="eyebrow">실제 운영 화면</p><h2 id="ops-title">우리가 일하는 방식</h2>
        <ol class="ops-list"><li><strong>손님 한 팀마다 기사·숙소와 전용 단톡방</strong><span>담당 기사와 숙소 담당이 같은 방에서 손님 일정을 함께 챙깁니다.</span></li><li><strong>"왔어요?" 한마디에 기사가 실시간 위치 공유</strong><span>공항·숙소·골프장 어디서든 기사가 지금 어디쯤인지 바로 알려 드립니다.</span></li><li><strong>출발부터 귀국까지 한 방에서</strong><span>공항 픽업부터 숙소·골프장 이동, 귀국 샌딩까지 한 단톡방에서 안내합니다.</span></li></ol>
        <a class="button button-kakao ops-btn-g" href="/go/golf-combo">골프·숙소·차량 카톡 상담</a></div></div></section><section class="section shell pay-guide-section" id="pricing" aria-labelledby="pricing-title"><div class="section-heading"><div><p class="eyebrow">요금과 결제</p><h2 id="pricing-title">요금 구성·결제·변경/취소, 견적 받는 법</h2></div><a class="text-link" href="/golf-price">가격 확인 가이드 →</a></div>${pricingGuideHtml({ kakaoUrl: site.kakaoUrl })}</section>
    <section class="section shell home-faq" id="faq" aria-labelledby="faq-title"><div class="section-heading"><div><p class="eyebrow">자주 묻는 질문</p><h2 id="faq-title">예약 전에 많이 묻는 질문</h2></div><a class="text-link" href="/golf#airport-times">공항→골프장 시간표 →</a></div><dl class="home-faq-list">${faqs.map(([question, answer]) => `<div><dt>${escapeHtml(question)}</dt><dd>${escapeHtml(answer)}</dd></div>`).join("")}</dl></section>
    <section class="cta-section cta-photo" style="--hero-img:url('/assets/images/courses/golf-hoiana-shores-golf-club.webp')"><div class="shell cta-inner"><div><p class="eyebrow">날짜와 인원만 알려주세요</p><h2>베트남 어디든,<br>골프 일정부터 카톡으로 상담하세요</h2><p>골프장·티타임·공항 차량·숙소까지 한국어로 한 번에 맞춰 드립니다. 홈페이지에서는 결제하지 않습니다.</p></div><button class="button button-kakao button-lg js-consult" type="button" data-interest="베트남 골프 빠른 상담">카카오톡 예약 문의</button></div></section>`;
  return layout({
    title: "베트남 골프장 상담 전문 신짜오골프",
    description: "호치민·하노이·다낭·하롱·나트랑·달랏·푸꾸옥 베트남 골프장 정보와 공항 이동시간. 골프장 예약과 차량, 아파트, 풀빌라를 한국어로 한 번에 상담하세요.",
    pathname: "/",
    content: deferHomeBackgrounds(content),
    schema: [{ "@context": "https://schema.org", "@type": "FAQPage", "@id": `${site.siteUrl}/#faq`, mainEntity: faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) }],
  });
}

function golfIndexPage() {
  const areaSections = golfAreas.map((area) => {
    const list = courses.filter((course) => course.area === area.key);
    if (!list.length) return "";
    return `<section class="area-section" id="area-${area.key}" data-area="${area.key}" aria-labelledby="area-${area.key}-title">
      <div class="area-head"><div><p class="eyebrow">${escapeHtml(area.airport)} 기준</p><h2 id="area-${area.key}-title">${escapeHtml(area.name)} 골프장 <span>${list.length}곳</span></h2><p>${escapeHtml(area.lead)}</p></div><button class="button button-quiet js-consult" type="button" data-interest="${escapeHtml(area.name)} 골프장 추천 상담">${escapeHtml(area.name)} 상담</button></div>
      <div class="course-grid course-grid-wide">${list.map(courseCard).join("")}</div>
    </section>`;
  }).join("");
  const airportRows = golfAreas.flatMap((area) => courses.filter((course) => course.area === area.key).map((course) => `<tr><th scope="row"><a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a></th><td>${escapeHtml(area.name)}</td><td>${escapeHtml(airportShort(course))}</td><td><strong>${escapeHtml(course.drive)}</strong>${course.driveKm ? ` <small>(${escapeHtml(course.driveKm)})</small>` : ""}</td></tr>`)).join("");
  const content = `
    <section class="page-hero page-hero-photo" style="--hero-img:url('/assets/images/courses/golf-dragon-golf-links.webp')"><div class="shell"><p class="eyebrow">베트남 전역 골프</p><h1>베트남 골프장 안내</h1><p>호치민·판티엣·하노이·하이퐁·하롱·다낭·나트랑·달랏·푸꾸옥 골프장 ${courses.length}곳을 지역별로 모았습니다. 골프장마다 가장 가까운 공항에서 차로 얼마나 걸리는지 함께 적었습니다.</p><div class="hero-x-actions"><button class="button button-kakao js-consult" type="button" data-interest="베트남 골프장 추천 상담">카톡으로 골프장 추천받기</button><a class="button button-glass" href="#airport-times">공항 이동시간표</a></div></div></section>
    <section class="section shell">
      <div class="filter-bar" role="group" aria-label="골프장 지역 필터">
        <button class="filter-button is-active" type="button" data-filter="all">전체 ${courses.length}</button>
        ${golfAreas.filter((area) => courses.some((course) => course.area === area.key)).map((area) => `<button class="filter-button" type="button" data-filter="${area.key}">${escapeHtml(area.name)} ${courses.filter((course) => course.area === area.key).length}</button>`).join("")}
      </div>
      <div id="course-list">${areaSections}</div>
    </section>
    <section class="section section-tint" id="airport-times"><div class="shell">
      <div class="section-heading"><div><p class="eyebrow">공항 → 골프장</p><h2>공항에서 골프장까지 걸리는 시간</h2></div></div>
      <div class="table-scroll"><table class="airport-table"><caption>평소 교통 기준 차량 이동 시간입니다. 출퇴근 시간·주말·비 오는 날에는 더 걸릴 수 있습니다.</caption><thead><tr><th scope="col">골프장</th><th scope="col">지역</th><th scope="col">가까운 공항</th><th scope="col">차량 시간</th></tr></thead><tbody>${airportRows}</tbody></table></div>
      <p class="muted">도착일 라운드는 입국 심사·짐 찾기 시간을 더해 티오프를 잡으세요. <a href="/blog/hochiminh-airport-fasttrack-golfbag-guide.html">공항 패스트트랙·골프백 안내</a></p>
    </div></section>
    <section class="notice-section"><div class="shell notice-grid"><strong>표시된 정보는 선택을 돕기 위한 안내입니다.</strong><p>티오프 가능 여부와 실제 조건은 날짜·인원에 따라 달라질 수 있으므로 상담 시 다시 확인합니다.</p><button class="button button-small js-consult" type="button" data-interest="골프장 가능 여부 확인">가능 여부 상담</button></div></section>`;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "베트남 골프장 안내",
    itemListElement: courses.map((course, index) => ({ "@type": "ListItem", position: index + 1, url: `${site.siteUrl}/golf/${course.slug}.html`, name: course.name })),
  };
  return layout({
    title: `베트남 골프장 ${courses.length}곳 안내: 호치민·하노이·다낭·하롱·나트랑·푸꾸옥`,
    description: `베트남 골프장 ${courses.length}곳을 지역별로 비교하세요. 호치민·판티엣·하노이·하이퐁·하롱·다낭·나트랑·달랏·푸꾸옥 골프장과 공항에서 걸리는 차량 시간을 한국어로 안내하고 바로 상담합니다.`,
    pathname: "/golf",
    active: "golf",
    content,
    schema: [itemList],
  });
}

function courseTopicGuides(course) {
  const list = guides.filter((guide) => hubForCategory(guide.category) && coursesForGuide(guide, courses).includes(course));
  if (!list.length) return "";
  return `<h3>${escapeHtml(course.shortName)} 가격·예약·일정 글</h3><ul>${list.map((guide) => `<li><a href="/guide/${guide.slug}.html">${escapeHtml(hubForCategory(guide.category).label)} · ${escapeHtml(guide.title)}</a></li>`).join("")}</ul>`;
}

// 상세 쪽 "지역 글 모음" 링크: 붕따우 3곳은 붕따우 게시판, 나머지는 권역 이름 그대로. 섹션이 있는 게시판은 "골프장·글 모음".
function boardLink(course) {
  const board = regionBoards.find((item) => item.key === boardOf(course));
  if (!board) return `<a href="/regions">지역별 골프 글</a>`;
  const name = course.board ? board.name : areaOf(course).name;
  return `<a href="/regions/${board.key}.html">${escapeHtml(name)} ${board.sections ? "골프장·글 모음" : "골프 글 모음"}</a>`;
}

function courseGuideContent(course, guide) {
  if (!guide) throw new Error(`공식 출처 안내 누락: ${course.slug}`);
  const related = guide.related.map(file => {
    const post = file.startsWith("guide/")
      ? guides.find(item => `guide/${item.slug}.html` === file)
      : blogPosts.find(item => item.file === file);
    if (!post) throw new Error(`골프장 관련 글 누락: ${file}`);
    return `<li><a href="${relatedHref(file)}">${escapeHtml(post.title)}</a></li>`;
  }).join("");
  return `<section class="course-guide" aria-labelledby="course-guide-title">
    <h2 id="course-guide-title">${escapeHtml(course.shortName)} 예약 전에 알아둘 질문</h2>
    ${courseFaqs(course).map(([q, a]) => `<section><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></section>`).join("")}
    <h3>같은 조건으로 견적을 받으려면</h3><p>이용일·인원·홀 수·희망 티타임을 먼저 맞추고, 그린피·캐디·카트·팁·식사·차량·대여 장비·세금과 취소 조건을 나눠 확인하세요. 문의 접수는 예약 확정이나 최종 요금 안내가 아닙니다.</p>
    ${courseTopicGuides(course)}
    <h3>예약 준비에 이어서 읽기</h3><ul>${related}</ul><p>${topicHubs.map((hub) => `<a href="${hub.path}">${escapeHtml(hub.title)}</a>`).join(" · ")} · ${courseVehicleLink(course)} · ${boardLink(course)} · <a href="/golf#airport-times">공항→골프장 시간표</a></p>
    <aside class="course-sources" aria-label="공식 출처"><h3>공식 출처</h3><p>자료 확인: <time datetime="${guide.checkedAt}">${guide.checkedAt}</time></p><ul>${guide.sources.map(([title, url]) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></li>`).join("")}</ul><p>${escapeHtml(guide.sourceNote || "공식 안내를 기준으로 골프장 이름과 코스 구성을 정리했습니다. 요금·티타임과 당일 운영·교통은 상담 때 그날 기준으로 확인해 드립니다.")}</p><a href="/source-policy.html">정보 출처 원칙</a></aside>
  </section>`;
}

// 키워드 지도(07, 2026-11-20) 골프장 칸 10곳 + 지역 칸 키워드 5곳: 검색어로 쓰는 골프장 이름과 "글 안 섹션"(가격·예약·코스·위치)을 더한다.
// 후기 섹션은 실제 후기가 없어 만들지 않는다. 금액 숫자와 요금 안내 문장(pricing-guide)은 위 요금 요약과 겹치지 않게 쓴다.
// 키워드 쪽 제목을 따로 정하는 곳(11-21 골프 키워드 맞춤표): 손님 검색어("탄손녓 골프장 가는 법")를 제목 앞에 둔다.
const keywordTitles = {
  "tan-son-nhat-golf-course": "탄손녓 골프장 가는 법·가격·예약 (탄손넛 골프코스, 공항에서 10~20분)",
};
const keywordCourses = {
  "vinpearl-golf-nha-trang": "빈펄 나트랑 골프장",
  "montgomerie-links-vietnam": "다낭 몽고메리 골프장",
  "long-thanh-golf-club": "롱탄 골프클럽", // 11-21 검색 맞춤(블로그·검색 창): 손님 검색어 "롱탄 골프클럽"
  "ba-na-hills-golf-club": "바나힐 골프장",
  "sam-tuyen-lam-golf": "삼투엔람 골프장",
  "song-be-golf-resort": "송베 골프장",
  "tan-son-nhat-golf-course": "탄손녓 골프장", // 11-21: 손님은 "탄손녓"으로 검색(사이트 표기 탄손넛)
  "thu-duc-country-club": "투득 골프장",
  "twin-doves-golf-club": "트윈도브 골프장", // 11-21: 손님 검색어는 "트윈도브"(스 없음)
  "leman-golf-club": "빈펄 레만 골프장",
  // 2026-11-20 보류 해제: 지역 칸(달랏·붕따우·푸꾸옥 골프) 키워드지만 기존 골프장 쪽에 넣는 9개 키워드(삼투엔람 "달랏 삼 골프장"은 위 대상).
  "dalat-at-1200": "달랏 1200 골프장",
  "dalat-palace-golf-club": "달랏 팰리스 골프장",
  "sonadezi-chau-duc-golf": "붕따우 쩌우득 골프장",
  "vung-tau-paradise-golf": "붕따우 파라다이스 골프장",
  "vinpearl-golf-phu-quoc": "빈펄 푸꾸옥 골프장",
  // 2026-11-20 보류 없는 골프장 칸 중 빠져 있던 곳(키워드지도 "붕따우 더 블러프 골프장").
  "the-bluffs-grand-ho-tram": "붕따우 더 블러프 골프장",
};

function courseKeywordSections(course) {
  const keyword = keywordCourses[course.slug];
  if (!keyword) return "";
  const board = regionBoards.find((item) => item.key === boardOf(course));
  const airport = course.airport || areaOf(course).airport;
  return `<section class="course-guide course-keyword" aria-labelledby="course-keyword-title">
    <h2 id="course-keyword-title">${escapeHtml(keyword)} 가격·예약·코스 안내</h2>
    <h3>${escapeHtml(keyword)} 가격 안내</h3><p>${escapeHtml(course.shortName)} 요금 구성과 결제·변경/취소 조건은 위 요금 안내에 정리했습니다. 금액은 이용일·인원·홀 수·티타임을 받은 뒤 견적서로 안내합니다. 골프장마다 확인할 항목은 <a href="/golf-price">골프장별 가격 글 모음</a>에 있습니다.</p>
    <h3>${escapeHtml(keyword)} 예약 방법</h3><ol><li>날짜·인원·홀 수·희망 티타임을 카카오톡으로 보냅니다.</li><li>가능한 티타임과 포함 조건, 견적을 확인합니다.</li><li>입금 후 예약이 확정되면 바우처를 받습니다.</li></ol><p>${escapeHtml(pricing.howTo)} 티오프 가능 시간과 휴장 여부는 날짜마다 달라 상담 때 그날 기준으로 확인합니다. <a href="/golf-booking">예약 방법 글 모음</a></p>
    <h3>${escapeHtml(keyword)} 코스·위치</h3><ul><li>골프장: ${escapeHtml(course.name)} (${escapeHtml(course.englishName)})</li><li>위치: ${escapeHtml(course.location)}</li><li>규모: ${escapeHtml(course.holes)}</li><li>공항 이동: ${escapeHtml(airport)}에서 약 ${escapeHtml(course.drive)}${course.driveKm ? ` (${escapeHtml(course.driveKm)})` : ""}, 평소 교통 기준</li></ul>${board?.sections ? `<p>같은 지역 골프장과 이동시간은 <a href="/regions/${board.key}.html">${escapeHtml(board.name)} 골프장 안내</a>에서 비교할 수 있습니다.</p>` : ""}
  </section>`;
}

// 골프 + 숙소 + 차량 묶음 견적(2026-11-20 차별화 ③): 호치민권 골프장 상세에만 넣는다.
// 숙소는 자매 사이트 호치민풀빌라(호치민 숙소)라서 다른 지역에는 넣지 않는다. 금액 숫자·답변 시간 숫자는 쓰지 않는다.
const golfComboPath = "/go/golf-combo";
const golfComboAreas = ["hcm"];
// 빠른 견적 카드(2026-11-21 총괄 승인, 예약 흐름 기능표): 날짜·인원 칩 → 골프장 이름이 든 요약을 복사하고 /go/quick-golf로 카톡을 연다.
// 기존 카톡·견적 단추는 그대로 두고 첫 화면 아래에 더한다. 요금 숫자 없음. 도착일 라운드는 공항 최대 이동시간으로 계산한 추정.
const driveMaxMinutes = (drive = "") => { const last = drive.split("~").pop(); const h = last.match(/(\d+)\s*시간/); const m = last.match(/(\d+)\s*분/); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0); };
function quickQuoteCard(course) {
  const others = courses.filter((item) => item.area === course.area && item.slug !== course.slug).length;
  const chip = (attrs, label) => `<button type="button" class="qq-chip" aria-pressed="false" ${attrs}>${label}</button>`;
  return `
    <section class="quick-quote shell" id="quick-quote" aria-labelledby="qq-title" data-qq-site="golf" data-name="${escapeHtml(course.name)}" data-slug="${course.slug}" data-drive-max="${driveMaxMinutes(course.drive)}" data-airport="${escapeHtml(airportShort(course))}">
      <div class="qq-head"><p class="eyebrow">빠른 견적</p><h2 id="qq-title">날짜·인원만 누르면 카톡으로 견적 요청</h2><p>로그인·결제 없이 ${escapeHtml(course.shortName)} 이름이 들어간 요약을 카톡으로 보냅니다.</p></div>
      <fieldset class="qq-group" data-qq="date"><legend>날짜</legend><div class="qq-chips">${chip('data-date="sat0"', "이번 주 토")}${chip('data-date="sun0"', "이번 주 일")}${chip('data-date="sat1"', "다음 주 토")}${chip("data-date-pick", "직접 고르기")}</div><input class="qq-input qq-date" type="date" hidden aria-label="날짜 직접 고르기"></fieldset>
      <fieldset class="qq-group" data-qq="people"><legend>인원</legend><div class="qq-chips">${[2, 3, 4, 8].map((n) => chip(`data-people="${n}"`, `${n}명`)).join("")}${chip("data-people-pick", "직접")}</div><input class="qq-input qq-people" type="number" min="1" max="60" inputmode="numeric" placeholder="인원 수" hidden aria-label="인원 직접 입력"></fieldset>
      <fieldset class="qq-group" data-qq="extra"><legend>같이 견적 <small>(선택)</small></legend><div class="qq-chips">${chip('data-extra="숙소(풀빌라·아파트)"', "숙소")}${chip('data-extra="차량(공항·골프장)"', "차량")}${others ? chip('data-extra="같은 지역 2라운드 후보"', "2라운드 후보") : ""}${chip("data-arrival", "도착일에 라운드")}</div>
        <div class="qq-arrival" hidden><label>항공 도착 시각 <input class="qq-input qq-time" type="time"></label><p class="qq-arrival-result" aria-live="polite"></p></div></fieldset>
      <button class="button button-kakao button-lg qq-send" type="button">카톡으로 견적 받기</button>
      <p class="qq-status" role="status" aria-live="polite"></p>
      <textarea class="qq-fallback" readonly hidden aria-label="견적 요청 요약"></textarea>
      <p class="qq-note">예약 가능 여부·티오프·요금은 상담 때 확인합니다. 누르면 요약이 복사되고 카톡이 열립니다 — 붙여넣고 보내 주세요.</p>
    </section>`;
}

function courseStayCombo(course) {
  if (!golfComboAreas.includes(course.area)) return "";
  const airport = course.airport || areaOf(course).airport;
  return `<section class="section shell stay-combo" id="stay-combo" aria-labelledby="stay-combo-title"><div class="stay-combo-box"><p class="eyebrow">골프 + 숙소 + 차량</p><h2 id="stay-combo-title">${escapeHtml(course.shortName)} 일정, 숙소·차량까지 한 번에 견적</h2><p>골프·숙소·차량(공항·골프장 이동)을 함께 견적 드립니다. 차량은 기본으로 넣어 드리고 필요 없으면 빼 드립니다. 날짜와 인원을 보내 주시면 한 장의 견적으로 묶어 안내합니다.</p><dl class="stay-combo-list"><div><dt>숙소</dt><dd>자매 사이트 ${poolvilla.name}에서 ${poolvilla.villaRooms} 풀빌라를 룸 수로 골라 볼 수 있습니다.<span class="stay-combo-links"><a href="${poolvilla.villaList}" target="_blank" rel="noopener">룸 수별 풀빌라 목록 →</a><a href="${poolvilla.apartmentList}" target="_blank" rel="noopener">아파트 목록 →</a></span></dd></div><div><dt>이동</dt><dd>${escapeHtml(airport)}에서 ${escapeHtml(course.name)}까지 차량 약 ${escapeHtml(course.drive)}${course.driveKm ? ` (${escapeHtml(course.driveKm)})` : ""}, 평소 교통 기준입니다. 공항 픽업·샌딩과 숙소·골프장 왕복 차량을 인원과 골프백 수에 맞춰 함께 예약할 수 있습니다.<span class="stay-combo-links"><a href="${golfRentPath(course)}">이 골프장까지 차량 →</a><a href="/rent">상황별 차량 보기 →</a></span></dd></div><div><dt>견적</dt><dd>카카오톡에 날짜·인원·희망 룸 수를 보내 주세요. ${pricing.reply}</dd></div></dl><a class="button button-kakao button-lg" href="${golfComboPath}" data-combo="golf-stay">골프·숙소·차량 한 번에 견적</a></div></section>`;
}

// 골프 후 저녁 일정(2026-11-20 차별화: 낮엔 골프, 저녁엔 숙소, 이동은 렌트, 밤엔 베트남밤).
// 베트남밤은 호치민·다낭만 열려 있어 그 권역 골프장에만 넣는다. 풀빌라 묶음 블록과는 따로 둔다(숙소 사이트 안내에 섞지 않음).
function courseEvening(course) {
  const bam = vietnambam[course.area];
  if (!bam) return "";
  return `<section class="section shell course-evening" aria-label="골프 후 저녁 일정"><p class="course-evening-line"><a href="${bam.url}" target="_blank" rel="noopener">${escapeHtml(bam.label)} →</a></p></section>`;
}

// 골프장 상세 "차량" 링크: 호치민권은 그 골프장 차량 쪽, 판티엣·무이네는 무이네 차량 쪽, 나머지는 차량 상담 쪽.
function courseVehicleLink(course) {
  if (course.area === "hcm") return `<a href="${golfRentPath(course)}">${escapeHtml(courseLabel(course))}까지 차량</a>`;
  if (course.area === "phanthiet") return `<a href="/rent/muine-day-trip.html">호치민→무이네·판티엣 차량</a>`;
  return `<a href="/services/vehicle.html">골프장 왕복 차량 상담</a>`;
}

// 구글 평점·후기 수(2026-11-22 대표님 "보완": 진짜 값, 확인일 표기). 자료 src/google-ratings.json.
const googleRatings = JSON.parse(readFileSync(new URL("./google-ratings.json", import.meta.url), "utf8"));
const ratingLine = (course) => { const r = googleRatings.items.find((x) => x.slug === course.slug); if (!r) return ""; const [y, m, d] = googleRatings.checkedAt.split("-"); return `<p class="g-rating"><a href="${escapeHtml(r.mapsUrl || "")}" target="_blank" rel="noopener"><span class="g-rating-star" aria-hidden="true">★</span> 구글 평점 <strong>${r.rating.toFixed(1)}</strong> · 후기 ${r.reviews.toLocaleString("ko-KR")}개</a> <small>(${+y}.${+m}.${+d} 구글 지도 확인)</small></p>`; };
function courseDetailPage(course) {
  const guide = courseGuides[course.slug];
  const keyword = keywordCourses[course.slug];
  const content = `
    <section class="course-hero${course.image ? "" : " is-plate"}" data-area="${course.area}">
      ${course.image ? `<div class="course-hero-media"><img src="/assets/images/${courseHeroImage(course)}" width="1200" height="800"${focusStyle(courseHeroImage(course))} fetchpriority="high" alt="${photoAlt(course)}">${aiBadge(course)}</div>` : `<div class="course-hero-card">${courseVisual(course, "course-plate-detail", "eager")}</div>`}
      <div class="shell course-hero-copy"><p class="eyebrow">${course.region} 골프장 · ${escapeHtml(course.holes.split(" ")[0])}</p><h1>${course.name}</h1><p class="english-name large">${course.englishName}</p><p class="detail-lead">${course.summary}</p>${ratingLine(course)}<dl class="course-keyfacts"><div><dt>✈ ${escapeHtml(airportShort(course))}에서</dt><dd>차량 약 ${escapeHtml(course.drive)}</dd></div><div><dt>위치</dt><dd>${escapeHtml(course.access)}</dd></div>${golfComboAreas.includes(course.area) ? `<div><dt>숙소</dt><dd><a href="#stay-combo">호치민 풀빌라·아파트 함께 상담 ↓</a></dd></div>` : ""}</dl><div class="hero-x-actions"><button class="button button-kakao button-lg js-consult" type="button" data-interest="${course.name} 상담">카카오톡 한국어 상담</button><a class="button button-glass button-lg" href="/golf#airport-times">다른 골프장과 공항시간 비교</a></div></div>
    </section>${quickQuoteCard(course)}
    <nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/golf">베트남 골프장</a><span>›</span><a href="/golf#area-${course.area}">${escapeHtml(areaOf(course).name)}</a><span>›</span><span aria-current="page">${course.shortName}</span></nav>
    <section class="detail-hero shell${courseGalleryImages(course).length ? "" : " no-media"}">
      ${courseGalleryImages(course).length ? `<div class="detail-media"><div class="detail-gallery" aria-label="${escapeHtml(course.name)} 사진">${courseGalleryImages(course).map((file, index) => `<a href="/assets/images/${file}" target="_blank" rel="noopener"><img src="/assets/images/${file}" width="1200" height="800"${focusStyle(file)} loading="lazy" decoding="async" alt="${escapeHtml(course.name)} 코스 사진 ${index + 2}"></a>`).join("")}</div></div>` : ""}
      <div class="detail-summary"><p class="eyebrow">골프장 기본 정보</p><dl class="fact-list"><div><dt>지역</dt><dd>${course.location}</dd></div><div><dt>규모</dt><dd>${course.holes}</dd></div><div><dt>공항</dt><dd>${escapeHtml(course.airport || areaOf(course).airport)}에서 차량 약 ${escapeHtml(course.drive)}${course.driveKm ? ` (${escapeHtml(course.driveKm)})` : ""}</dd></div><div><dt>이동</dt><dd>${course.access}</dd></div></dl><p class="drive-note">공항 시간은 평소 교통 기준입니다. 출퇴근·주말·우천 시 더 걸릴 수 있습니다.</p><button class="button button-kakao button-block button-lg js-consult" type="button" data-interest="${course.name} 상담">카카오톡으로 예약 가능 날짜 묻기</button><ul class="detail-steps"><li>날짜·인원 보내기</li><li>티타임·조건 확인</li><li>확정 후 바우처</li></ul>${pricingGuideHtml({ variant: "compact" })}<small>홈페이지에서는 결제나 온라인 예약을 진행하지 않습니다.</small></div>
    </section>${courseStayCombo(course)}${courseEvening(course)}
    <section class="section shell detail-content">
      <article><p class="eyebrow">선택 포인트</p><h2>${course.shortName}, 이런 일정에 검토하세요</h2><ul class="point-list">${course.points.map((point) => `<li>${point}</li>`).join("")}</ul>${courseKeywordSections(course)}${courseGuideContent(course, guide)}</article>
      <aside class="side-consult"><strong>빠른 상담</strong><p>${course.shortName} 가능 여부와 이동 일정을 확인해드립니다.</p><button class="button button-kakao button-block js-consult" type="button" data-interest="${course.name} 티오프 및 차량 상담">카톡으로 일정 확인</button></aside>
    </section>
    <section class="section section-tint"><div class="shell"><div class="section-heading"><div><p class="eyebrow">함께 보기</p><h2>${escapeHtml(areaOf(course).name)} 다른 골프장</h2></div><a class="text-link" href="/golf#area-${course.area}">전체 보기 →</a></div><div class="course-grid">${[...courses.filter((item) => item.slug !== course.slug && item.area === course.area), ...courses.filter((item) => item.area !== course.area)].slice(0, 3).map(courseCard).join("")}</div></div></section>`;
  const schema = [{
    "@context": "https://schema.org",
    "@type": "GolfCourse",
    name: course.name,
    alternateName: course.englishName,
    sameAs: guide.sources[0][1],
    description: course.summary,
    url: `${site.siteUrl}/golf/${course.slug}.html`,
    ...(course.image && !course.aiStaged ? { image: `${site.siteUrl}/assets/images/${course.image}` } : {}),
    address: { "@type": "PostalAddress", addressCountry: "VN", addressRegion: course.province || course.region },
    mainEntityOfPage: `${site.siteUrl}/golf/${course.slug}.html`,
  }, breadcrumbSchema([
    ["홈", "/"],
    ["베트남 골프장", "/golf"],
    [course.shortName, `/golf/${course.slug}.html`],
  ]), {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: courseFaqs(course).map(([question, answer]) => ({
      "@type": "Question", name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }];
  return layout({
    // 이름에 괄호가 있으면(예: "쩌우득 골프장 (소나데지)") 괄호 안에서 다시 괄호가 겹치지 않게 "쩌우득 골프장·소나데지"로 쓴다.
    title: keywordTitles[course.slug] || (keyword ? `${keyword} 가격·예약·위치 안내 (${keyword === flatName(course.name) ? course.englishName : flatName(course.name)})` : `${course.name} 위치·공항 이동시간·예약 상담`),
    description: keyword
      ? `${keyword}(${keyword === flatName(course.name) ? course.englishName : `${flatName(course.name)}, ${course.englishName}`}) 위치·규모(${course.holes})와 ${airportShort(course)}에서 약 ${course.drive} 이동, 요금 구성(그린피+예약대행 수수료)과 예약 방법을 한국어로 안내합니다.`
      : `${course.name}(${course.englishName}) 위치·규모와 ${airportShort(course)}에서 차량 약 ${course.drive} 이동 정보, 한국어 골프 일정 상담 안내.`,
    pathname: `/golf/${course.slug}.html`,
    active: "golf",
    ...(course.image && !course.aiStaged ? { image: course.image } : {}),
    schema,
    keywords: [
      course.name,
      `${course.name} 예약`,
      `${course.name} 가격`,
      `${course.name} 위치`,
      `${course.name} 골프여행`,
      `${course.name} 티오프`,
      `${course.name} 한국인 예약`,
    ],
    content,
  });
}

const regionBoards = [
  { key: "hochiminh", sections: true, name: "호치민", lead: "호치민 시내와 동나이·빈즈엉·롱안·붕따우·호트람 골프장 예약, 일정, 이동 글을 모았습니다.", words: ["호치민", "롱탄", "송베", "동나이", "빈즈엉", "붕따우", "호트람", "탄손넛", "투득", "트윈도브", "롱안", "떠이닌", "에메랄드", "정산", "하모니", "블러프스", "레만", "웨스트레이크", "로얄롱안", "판티엣", "무이네", "쩌우득"] },
  // 붕따우(2026-11-20 키워드 지도 "붕따우 골프" 칸): 호치민 게시판의 붕따우·호트람·쩌우득 글은 호치민에도 그대로 남는다(글은 두 게시판에 함께 보임).
  { key: "vungtau", sections: true, name: "붕따우", lead: "붕따우 해안·호트람과 호치민에서 붕따우 가는 길의 쩌우득 골프장 예약, 일정, 이동 글을 모았습니다.", words: ["붕따우", "호트람", "호짬", "블러프", "쩌우득", "소나데지"], extra: ["hochiminh-golf-travel-guide.html", "hochiminh-golf-rental-car-guide.html"] },
  { key: "hanoi", sections: true, name: "하노이", lead: "하노이와 근교·닌빈·박닌, 하이퐁·하롱 골프장 예약, 단체 조편성, 공항·숙소 차량 연결 글을 모았습니다.", words: ["하노이", "하이퐁", "하롱", "도선", "찌린", "속선", "호아빈", "몬타나", "다이라이", "땀다오", "킹스아일랜드", "탄라인", "롱비엔", "스카이레이크", "반찌", "땀다오", "탐다오", "하롱", "닌빈", "짱안", "레전드 밸리", "스톤 밸리", "앰버 힐스", "스톤 하이랜드", "반랑", "실크패스", "동찌에우", "콘힐", "루크남", "로얄 닌빈", "옌탕", "삼선", "탄호아"] },
  { key: "danang", sections: true, name: "다낭·호이안", lead: "다낭·호이안·후에 골프장 예약과 티오프 확인, 가족·단체 일정 글을 모았습니다.", words: ["다낭", "호이안", "호이아나", "몽고메리", "바나힐", "랑꼬"] },
  { key: "nhatrang", sections: true, name: "나트랑", lead: "나트랑·캄란 리조트 골프 예약과 일정 글을 모았습니다.", words: ["나트랑", "캄란"] },
  { key: "phuquoc", sections: true, name: "푸꾸옥", lead: "푸꾸옥 골프 예약, 항공 도착과 티오프 연결, 포함 항목 확인 글을 모았습니다.", words: ["푸꾸옥"] },
  { key: "dalat", sections: true, name: "달랏", lead: "달랏 골프장 예약과 일정 글을 모았습니다.", words: ["달랏"] },
];

function regionBoardItems(board) {
  const hit = (text) => board.words.some((word) => text.includes(word));
  // extra: 제목·설명에는 지역 이름이 없지만 본문에서 그 지역 골프장을 다루는 글(붕따우: 호치민 골프여행·렌트카 글).
  const extra = (post) => (board.extra || []).includes(post.file);
  const items = [
    ...guides.filter((guide) => hit(`${guide.title} ${guide.description}`)).map((guide) => ({ href: `/guide/${guide.slug}.html`, title: guide.title, text: guide.sub || guide.description, date: guide.date })),
    ...blogPosts.filter((post) => hit(`${post.title} ${post.description}`) || extra(post)).map((post) => ({ href: `/blog/${post.file}`, title: post.title, text: post.description, date: post.date })),
  ];
  return items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// 지역 게시판 "글 안 섹션"(키워드 지도 07: 가격·예약·이동시간·코스): 이 사이트 골프장 자료(홀 수·위치·공항 이동시간)만 쓴다.
// sections: true인 게시판만. 하노이·푸꾸옥은 2026-11-20 보류 해제(신짜오 사이트 성장 매일 1일차)로 켰다 → 지금은 7곳 모두.
// 후기 섹션은 실제 후기가 없어 만들지 않는다. 요금 문장은 pricing-guide 문장을 한 번씩만 쓴다.
function regionKeywordSections(board) {
  if (!board.sections) return "";
  const list = courses.filter((course) => boardOf(course) === board.key);
  const vungtau = board.key === "hochiminh" ? `<p>붕따우·호트람·쩌우득 골프장은 <a href="/regions/vungtau.html">붕따우 골프장 안내</a>에 따로 모았습니다.</p>` : "";
  if (!list.length) return "";
  const rows = list.map((course) => `<tr><th scope="row"><a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a></th><td>${escapeHtml(course.region)}</td><td>${escapeHtml(course.holes)}</td><td>${escapeHtml(airportShort(course))}에서 <strong>${escapeHtml(course.drive)}</strong>${course.driveKm ? ` <small>(${escapeHtml(course.driveKm)})</small>` : ""}</td></tr>`).join("");
  return `<section class="guide-group" id="region-courses"><h2>${board.name} 골프장 <span>${list.length}곳</span></h2>${vungtau}<div class="course-grid">${list.map(courseCard).join("")}</div></section>
    <section class="guide-group course-guide" id="region-airport"><h2>${board.name} 골프장 이동시간</h2><div class="table-scroll"><table class="airport-table"><caption>평소 교통 기준 이동 시간입니다. 출퇴근 시간·주말·비 오는 날에는 더 걸릴 수 있습니다.</caption><thead><tr><th scope="col">골프장</th><th scope="col">지역</th><th scope="col">규모</th><th scope="col">공항에서 이동</th></tr></thead><tbody>${rows}</tbody></table></div><p>도착일 라운드는 입국 심사·짐 찾기 시간을 더해 티오프를 잡으세요. 골프장 왕복 차량은 <a href="/services/vehicle.html">차량 상담</a>, 하루 동선은 <a href="/golf-itinerary">일정 짜기 글 모음</a>에서 볼 수 있습니다.</p></section>
    <section class="guide-group course-guide" id="region-price"><h2>${board.name} 골프 가격 안내</h2><p>${escapeHtml(pricingSummary)}</p><p>${escapeHtml(pricing.split)} 골프장끼리 비교할 때는 같은 날짜·인원·홀 수·티타임으로 견적을 받으세요. 골프장별 확인 항목은 <a href="/golf-price">골프장별 가격 글 모음</a>에 정리했습니다.</p></section>
    <section class="guide-group course-guide" id="region-booking"><h2>${board.name} 골프 예약 방법</h2><ol><li>날짜·인원·홀 수·희망 골프장과 티타임을 카카오톡으로 보냅니다.</li><li>가능한 티타임과 포함 조건, 견적을 확인합니다.</li><li>입금 후 예약이 확정되면 바우처를 받습니다.</li></ol><p>${escapeHtml(pricing.howTo)} ${escapeHtml(pricing.reply)} <a href="/golf-booking">예약 방법 글 모음</a></p></section>`;
}

function regionBoardPage(board) {
  const items = regionBoardItems(board);
  const courseCount = courses.filter((course) => boardOf(course) === board.key).length;
  const others = regionBoards.filter((item) => item.key !== board.key).map((item) => `<a class="button button-quiet" href="/regions/${item.key}.html">${item.name}</a>`).join("");
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/regions">지역별 골프</a><span>›</span><span aria-current="page">${board.name}</span></nav><section class="page-hero"><div class="shell"><p class="eyebrow">지역별 골프 게시판</p><h1>${board.sections ? `${board.name} 골프장 ${courseCount}곳 가격·예약·이동시간 안내` : `${board.name} 골프 예약·일정 안내`}</h1><p>${board.lead}</p><div class="guide-jump">${others}</div></div></section><section class="section shell">${regionKeywordSections(board)}<section class="guide-group"><h2>${board.name} 골프 글 <span>${items.length}</span></h2>${items.length ? `<ul class="guide-list">${items.map((item) => `<li><a href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text || "")}</span></a></li>`).join("")}</ul>` : `<p>아직 이 지역 글을 준비 중입니다. 원하는 골프장과 날짜를 알려주시면 상담으로 먼저 안내해 드립니다.</p>`}</section></section><section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">${board.name} 골프 상담</p><h2>날짜·인원·희망 골프장을 알려주세요</h2><p>골프장 예약과 숙소·차량까지 일정에 맞춰 한 번에 안내해 드립니다.</p></div><button class="button js-consult" type="button" data-interest="${board.name} 골프 상담">${board.name} 골프 상담하기</button></div></section>`;
  // 11-21 검색 맞춤: 제목은 "<지역> 골프"로 시작(손님 검색어 "호치민 골프"), H1은 "<지역> 골프장 N곳"
  const title = board.sections ? `${board.name} 골프 — 골프장 ${courseCount}곳 가격·예약·이동시간` : `${board.name} 골프 예약·일정 안내`;
  const description = board.sections
    ? `${board.name} 골프장 ${courseCount}곳의 공항 이동시간과 요금 구성·예약 방법, ${board.name} 골프 글을 모았습니다. 날짜·인원·희망 골프장을 알려주시면 숙소·차량까지 한국어로 상담합니다.`
    : `${board.lead} 날짜·인원·희망 골프장을 알려주시면 골프장 예약과 숙소·차량까지 한국어로 상담합니다.`;
  return layout({ title, description, pathname: `/regions/${board.key}.html`, active: "regions", content, schema: [breadcrumbSchema([["홈", "/"], ["지역별 골프", "/regions"], [board.name, `/regions/${board.key}.html`]])] });
}

// 지도 쪽(/map, 2026-11-22 총괄): 골프장 66곳 중심. 누르면 공항 시간(골프장 상세의 drive 그대로)과 가까운 숙소(풀빌라 동네, 직선거리)가 나온다.
// 지도 코드·CSS는 풀빌라 사이트 지도와 같은 파일(public/assets/js/site-map.js = hochiminh-poolvilla js/villa-map.js). 자료는 src/map-data.json.
const mapData = JSON.parse(readFileSync(new URL("./map-data.json", import.meta.url), "utf8"));
const mapKm = (a, b) => { const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2; return Math.round(2 * 6371 * Math.asin(Math.sqrt(h))); };
const MAP_STAY_KM = 45;
const mapCoordOf = (course) => { const c = mapData.courses.find((x) => x.slug === course.slug); if (!c) throw new Error(`지도 좌표 없음: ${course.slug}`); return c; };
const nearStays = (course) => { const c = mapCoordOf(course); return mapData.stays.map((st) => ({ ...st, km: mapKm(c, st) })).filter((st) => st.km <= MAP_STAY_KM).sort((a, b) => a.km - b.km).slice(0, 3); };
const mapCourseFacts = (course) => {
  const stays = nearStays(course);
  const air = `✈️ ${escapeHtml(airportShort(course))}에서 차로 ${escapeHtml(course.drive)}${course.driveKm ? ` (${escapeHtml(course.driveKm)})` : ""}`;
  const stay = stays.length ? `🏠 가까운 풀빌라 동네(직선) ${stays.map((st) => `<a href="${st.url}" target="_blank" rel="noopener">${escapeHtml(st.label)} 약 ${st.km}km</a>`).join(" · ")}` : "🏠 숙소는 지역에 맞춰 상담으로 안내";
  return { air, stay };
};
function mapPage() {
  const pathname = "/map";
  const regionsOnMap = golfAreas.map((area) => ({ area, list: courses.filter((course) => course.area === area.key) })).filter((r) => r.list.length);
  const areas = regionsOnMap.map(({ area, list }) => {
    const pts = list.map(mapCoordOf);
    const lat = pts.reduce((n, p) => n + p.lat, 0) / pts.length;
    const lon = pts.reduce((n, p) => n + p.lon, 0) / pts.length;
    return { id: `region-${area.key}`, label: area.name, title: `${area.name} 골프장 ${list.length}곳`, lat: +lat.toFixed(4), lon: +lon.toFixed(4), n: list.length, b: [[Math.min(...pts.map((p) => p.lat)), Math.min(...pts.map((p) => p.lon))], [Math.max(...pts.map((p) => p.lat)), Math.max(...pts.map((p) => p.lon))]] };
  });
  const golf = courses.map((course) => {
    const c = mapCoordOf(course);
    const f = mapCourseFacts(course);
    const approx = c.precision === "approx";
    return { slug: course.slug, name: course.name, short: course.shortName, area: course.area, region: course.region, lat: c.lat, lon: c.lon, url: `/golf/${course.slug}.html`, approx, pop: `<strong class="mk-pop-title">${escapeHtml(course.name)}</strong><br><span class="mk-pop-sub">${escapeHtml(course.region)} · ${escapeHtml(course.holes)}${approx ? " · 대략 위치(지역 중심)" : ""}</span><br>${f.air}<br>${f.stay}<br><a href="/golf/${course.slug}.html">골프장 자세히 보기 →</a><br><a href="/golf/${course.slug}.html#quick-quote">빠른 견적 →</a>` };
  });
  const stays = mapData.stays.map((st) => ({ label: `${st.label} ${st.n}채`, lat: st.lat, lon: st.lon, pop: `<strong class="mk-pop-title">🏠 ${escapeHtml(st.label)} 풀빌라 ${st.n}채</strong><br><span class="mk-pop-sub">동네 중심 위치(실제 집 위치 아님)</span><br><a href="${st.url}" target="_blank" rel="noopener">이 동네 풀빌라 보기 →</a><br><a href="${golfComboPath}">⛳ 숙소와 골프 한 번에 견적 →</a>` }));
  const data = { areas, golf, stays, startAll: true, sideKm: 150 };
  const approxN = golf.filter((g) => g.approx).length;
  const panel = ({ area, list }) => `<section class="map-panel" id="region-${area.key}" data-area="region-${area.key}" aria-labelledby="region-${area.key}-title"><h3 id="region-${area.key}-title">⛳ ${escapeHtml(area.name)} <small>골프장 ${list.length}곳</small></h3><p class="map-facts">공항 기준: ${escapeHtml(area.airport)}. 시간은 골프장 상세의 평소 교통 기준, 숙소 거리는 풀빌라 동네 중심까지 직선거리입니다.</p><ul class="map-villas">${list.map((course) => {
    const f = mapCourseFacts(course);
    const approx = mapCoordOf(course).precision === "approx";
    return `<li class="map-villa map-course"><div class="map-villa-text"><strong>${escapeHtml(course.name)}${approx ? " <small>(지도는 대략 위치)</small>" : ""}</strong><span class="map-course-meta">${escapeHtml(course.region)} · ${escapeHtml(course.holes)}</span><span class="map-course-meta">${f.air}</span><span class="map-course-meta">${f.stay}</span><span class="map-villa-btns"><a href="/golf/${course.slug}.html" class="map-btn">자세히</a><a href="/golf/${course.slug}.html#quick-quote" class="map-btn map-btn-qq">빠른 견적</a></span></div></li>`;
  }).join("")}</ul></section>`;
  const villaMapUrl = "https://hochiminhpoolvilla.com/map/hochiminh-pool-villa-map.html";
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">지도로 보기</p><h1>지도로 보는 베트남 골프장 ${courses.length}곳</h1><p>골프장을 누르면 공항에서 걸리는 시간과 가까운 풀빌라 동네가 나옵니다. 지역 단추를 누르면 그 지역 골프장만 모아 보여 드립니다.</p></div></section>
<div class="map-page"><div class="map-main">
<div class="map-wrap"><div id="villaMap" class="map-canvas" role="region" aria-label="베트남 골프장과 풀빌라 동네 지도"><noscript><p class="map-noscript">지도는 자바스크립트가 켜져 있어야 보입니다. 아래 지역 목록으로도 모두 보실 수 있습니다.</p></noscript></div>
<div class="map-layers" role="group" aria-label="지도에 보일 것"><button type="button" class="map-chip" aria-pressed="true" data-layer="golf-hcm">⛳ 호치민권 골프장</button><button type="button" class="map-chip" aria-pressed="true" data-layer="golf-all">⛳ 다른 지역 골프장</button><button type="button" class="map-chip" aria-pressed="true" data-layer="stay">🏠 풀빌라 동네</button></div></div>
<div class="map-side"><nav class="map-areas" aria-label="지역 고르기">${regionsOnMap.map(({ area, list }) => `<a href="#region-${area.key}" class="map-area-btn" data-area-btn="region-${area.key}">${escapeHtml(area.name)} <b>${list.length}</b></a>`).join("")}</nav>
<div class="map-panels" id="mapPanels">${regionsOnMap.map(panel).join("\n")}</div>
<div class="map-actions"><a href="${golfComboPath}" class="button button-kakao">⛳ 골프·숙소·차량 한 번에 견적</a><a href="${villaMapUrl}" class="button button-quiet" target="_blank" rel="noopener">풀빌라 지도 보기</a></div>
<p class="map-note">골프장 ${courses.length}곳 중 ${approxN}곳은 지도 자료에 골프장 자리가 없어 그 지역 중심에 놓았습니다(점선 표시). 풀빌라는 동네 중심 위치만 보여 드립니다. 지도 © OpenStreetMap 기여자.</p></div>
</div></div>
<script type="application/json" id="mapData">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>
<script src="/assets/vendor/leaflet/leaflet.js"></script><script src="/assets/js/site-map.js"></script>`;
  return layout({ title: `지도로 보는 베트남 골프장 ${courses.length}곳`, description: `베트남 골프장 ${courses.length}곳을 한 지도에서 봅니다. 골프장을 누르면 공항에서 걸리는 시간과 가까운 풀빌라 동네가 나오고, 상세와 빠른 견적으로 바로 갑니다.`, pathname, active: "golf", content, keywords: ["베트남 골프장 지도", "호치민 골프장 지도", "하노이 골프장 지도", "다낭 골프장 위치", "골프장 가까운 숙소"], schema: [breadcrumbSchema([["홈", "/"], ["지도로 보기", pathname]])] }).replace("</head>", `<link rel="stylesheet" href="/assets/vendor/leaflet/leaflet.css">\n</head>`);
}
function regionsPage() {
  const boardCards = regionBoards.map((board) => `<li><a href="/regions/${board.key}.html"><strong>${board.name} 골프 게시판 <em>${regionBoardItems(board).length}개 글</em></strong><span>${board.lead}</span></a></li>`).join("");
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">베트남 골프</p><h1>지역별 베트남 골프 상담</h1><p>호치민을 중심으로 붕따우, 하노이, 다낭·호이안, 나트랑, 푸꾸옥, 달랏 골프 일정도 상담합니다. 지역을 누르면 그 지역 골프 글만 모아 볼 수 있습니다.</p><div class="guide-jump"><a class="button button-quiet" href="/map">🗺️ 지도로 보기</a>${regionBoards.map((board) => `<a class="button button-quiet" href="/regions/${board.key}.html">${board.name}</a>`).join("")}</div></div></section><section class="section shell"><section class="guide-group"><h2>지역별 골프 게시판</h2><ul class="guide-list">${boardCards}</ul></section><div class="region-list">${regions.map((region, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><p class="eyebrow">${region.emphasis}</p><h2>${region.name}</h2><p>${region.text}</p></div><button class="button button-quiet js-consult" type="button" data-interest="${region.name} 골프 상담">상담하기</button></article>`).join("")}</div></section>`;
  return layout({ title: "지역별 베트남 골프 상담", description: "호치민, 붕따우, 하노이, 다낭·호이안, 나트랑, 푸꾸옥, 달랏 지역별 골프장 예약과 일정 글을 모아 보고, 숙소·차량 연결까지 한국어로 상담합니다.", pathname: "/regions", active: "regions", content });
}

function servicesPage() {
  // 숙소(아파트·풀빌라) 목록은 자매 사이트 호치민풀빌라로 바로 연결(새 탭). 차량만 사이트 안 자료로 간다.
  const links = {
    apartment: `<a class="button" href="${poolvilla.apartmentList}" target="_blank" rel="noopener">${poolvilla.name}에서 아파트 보기</a>`,
    villa: `<a class="button" href="${poolvilla.villaList}" target="_blank" rel="noopener">${poolvilla.name}에서 풀빌라 보기</a>`,
    vehicle: `<a class="button" href="/rent">상황별 차량 렌트 보기</a><a class="button button-outline" href="/services/vehicle.html">차량 종류 보기</a>`,
  };
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">숙소·차량</p><h1>골프 숙소·차량 상담</h1><p>골프 일정에 맞는 숙소와 차량을 함께 잡아 드립니다. 라운드 시간과 인원을 알려 주시면 이동까지 한 번에 맞춰 드립니다. 아파트·풀빌라 목록은 자매 사이트 ${poolvilla.name}에서 안내합니다.</p></div></section><section class="section shell"><div class="service-list">${services.map((service) => `<article id="${service.slug}"><img src="/assets/images/${service.image}" width="1200" height="700" loading="lazy" decoding="async" alt="${service.name} 상담"><div><p class="eyebrow">연계 서비스</p><h2>${service.name}</h2><p>${service.text}</p><p class="muted">인원, 이용 날짜와 골프 일정을 알려주시면 적합한 조건을 함께 확인합니다.</p><div class="inline-actions">${links[service.slug]}<button class="button button-outline js-consult" type="button" data-interest="${service.name} 상담">상담하기</button></div></div></article>`).join("")}</div></section>`;
  return layout({ title: "호치민 골프 숙소와 차량 상담", description: "호치민 골프여행에 필요한 아파트, 풀빌라, 차량을 라운드 일정과 인원에 맞춰 한국어로 함께 상담하세요. 숙소와 이동을 한 번에 정리합니다.", pathname: "/services", active: "services", content });
}

// 숙소 목록 2쪽은 짧은 소개 + 자매 사이트 호치민풀빌라 목록 연결만 남긴다(2026-11-20). 상세 19쪽은 풀빌라 사이트로 308.
function lodgingIntroPage({ eyebrow, heading, kind, listUrl, title, description, pathname }) {
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1><p>골프 일정에 맞는 ${kind}는 자매 사이트 ${poolvilla.name}에서 안내합니다. 사진과 객실 구성은 아래 버튼으로 호치민풀빌라 목록을 열어 보시고, 골프장·차량과 함께 잡을 날짜와 인원은 카카오톡으로 알려 주세요.</p></div></section><section class="section shell"><div class="compact-copy"><p class="eyebrow">자매 사이트 안내</p><h2>${poolvilla.name}의 ${kind} 목록</h2><p>${kind} 정보는 ${poolvilla.name}에서 한곳에 모아 관리합니다. 가능 여부와 조건은 이용 날짜와 인원에 따라 달라 상담 시 확인합니다.</p><div class="inline-actions"><a class="button" href="${listUrl}" target="_blank" rel="noopener">${poolvilla.name}에서 ${kind} 목록 보기</a><button class="button button-outline js-consult" type="button" data-interest="골프 일정 ${kind} 상담">카카오톡으로 상담하기</button></div></div></section>`;
  return layout({ title, description, pathname, active: "services", content });
}

function apartmentsPage() {
  return lodgingIntroPage({ eyebrow: "아파트", heading: "호치민 아파트 안내", kind: "아파트", listUrl: poolvilla.apartmentList, title: "호치민 골프 아파트 안내", description: `호치민 골프여행 아파트 목록은 자매 사이트 ${poolvilla.name}에서 안내합니다. 골프장·차량과 함께 잡을 숙소는 카카오톡으로 상담합니다.`, pathname: "/services/apartments.html" });
}

function villasPage() {
  return lodgingIntroPage({ eyebrow: "풀빌라", heading: "호치민 풀빌라 안내", kind: "풀빌라", listUrl: poolvilla.villaList, title: "호치민 골프 풀빌라 안내", description: `호치민 단체 골프여행 풀빌라 목록은 자매 사이트 ${poolvilla.name}에서 안내합니다. 골프장·차량과 함께 잡을 숙소는 카카오톡으로 상담합니다.`, pathname: "/services/villas.html" });
}

// ── 요청서 카드(2026-11-23 총괄: 공항 픽업·패스트트랙 / 묶음 견적) ───────────────────
// public/assets/js/req-card.js가 고른 칩을 요약해 복사하고 data-go(카톡 /go/)로 보낸다. 견적기·가격은 건드리지 않는다.
const reqChip = (attrs, label, pressed = false) => `<button type="button" class="qq-chip" aria-pressed="${pressed}" ${attrs}>${label}</button>`;
const reqGroup = (field, legend, chips, { multi = false, required = false, input = "" } = {}) => `<fieldset class="qq-group" data-field="${field}"${multi ? " data-multi" : ""}${required ? " data-required" : ""}><legend>${legend}</legend><div class="qq-chips">${chips}</div>${input}</fieldset>`;
const reqDate = (extra = "") => reqGroup("날짜", "날짜", `${reqChip('data-date="sat0"', "이번 주 토")}${reqChip('data-date="sat1"', "다음 주 토")}${extra}${reqChip("data-pick", "직접 고르기")}`, { required: true, input: `<input class="qq-input" type="date" hidden aria-label="날짜 직접 고르기">` });
const reqPeople = (list) => reqGroup("인원", "인원", `${list.map((n) => reqChip(`data-v="${n}명"`, `${n}명`)).join("")}${reqChip("data-pick", "직접")}`, { required: true, input: `<input class="qq-input" type="number" min="1" max="99" inputmode="numeric" placeholder="인원 수" hidden aria-label="인원 직접 입력">` });
const reqFoot = (label) => `<button class="button button-kakao button-lg req-send" type="button">${label}</button><p class="qq-status" role="status" aria-live="polite"></p><textarea class="qq-fallback" readonly hidden aria-label="요청 요약"></textarea>`;

const airportGo = "/go/airport-pickup";
function airportReqCard() {
  return `<section class="req-card shell" id="req" aria-labelledby="req-title" data-go="${airportGo}" data-head="[신짜오골프 공항 픽업·패스트트랙 요청]">
      <div class="qq-head"><p class="eyebrow">1분 요청서</p><h2 id="req-title">누르기만 하면 카톡으로 요청 끝</h2><p>로그인·결제 없이, 고른 내용이 요약돼 카톡 입력창에 붙습니다.</p></div>
      ${reqGroup("필요한 것", "필요한 것 <small>(여러 개 가능)</small>", [["공항 픽업(도착)", "공항 픽업", true], ["공항 샌딩(출국)", "공항 샌딩"], ["입국 패스트트랙", "입국 패스트트랙"], ["출국 패스트트랙", "출국 패스트트랙"]].map(([v, label, on]) => reqChip(`data-v="${v}"`, label, !!on)).join(""), { multi: true, required: true })}
      ${reqDate()}
      ${reqPeople([1, 2, 3, 4, 8])}
      ${reqGroup("짐", "짐 <small>(선택)</small>", [["골프백 있음", "골프백"], ["캐리어 3개 이상", "캐리어 많음"], ["유모차·어린이 동반", "유모차·어린이"]].map(([v, label]) => reqChip(`data-v="${v}"`, label)).join(""), { multi: true })}
      ${reqGroup("도착 후 가는 곳", "도착 후 가는 곳 <small>(선택)</small>", ["시내 호텔·아파트", "풀빌라", "바로 골프장", "아직 모름"].map((v) => reqChip(`data-v="${v}"`, v)).join(""))}
      <label class="req-text">편명·도착 시각 <small>(알면)</small><input class="qq-input" type="text" data-field="편명·시각" placeholder="예: VJ861 22:40 도착" autocomplete="off"></label>
      ${reqFoot("카톡으로 요청 보내기")}
      <p class="qq-note">차량·패스트트랙 가능 여부와 요금은 날짜·인원·짐에 따라 달라 견적으로 안내합니다. 홈페이지에서는 결제하지 않습니다.</p>
    </section>`;
}

function comboReqCard() {
  return `<section class="req-card shell combo-card" id="combo" aria-labelledby="combo-title" data-go="${golfComboPath}" data-head="[신짜오골프 골프·숙소·차량 한 번에 견적]">
      <div class="qq-head"><p class="eyebrow">12월 성수기 · 연말 티타임은 먼저 찹니다</p><h2 id="combo-title">골프·숙소·차량, 한 장의 견적으로</h2><p>골프장·숙소·공항 차량을 따로 알아보지 마세요. 날짜·인원만 누르면 세 가지를 묶어 카톡으로 견적 드립니다.</p></div>
      ${reqDate(reqChip('data-v="12월 중(날짜 상담)"', "12월 중"))}
      ${reqPeople([2, 4, 8, 12])}
      ${reqGroup("라운드", "라운드 수", ["1회", "2회", "3회", "4회 이상"].map((v) => reqChip(`data-v="${v}"`, v)).join(""))}
      ${reqGroup("숙소", "숙소", [["풀빌라", "풀빌라"], ["아파트", "아파트"], ["호텔", "호텔"], ["숙소 필요 없음", "필요 없음"]].map(([v, label]) => reqChip(`data-v="${v}"`, label)).join(""))}
      ${reqGroup("차량", "차량 <small>(기본 포함, 빼려면 누르기)</small>", [["공항 픽업·샌딩", "공항 픽업·샌딩", true], ["숙소↔골프장 왕복", "골프장 왕복", true], ["입국 패스트트랙", "입국 패스트트랙"]].map(([v, label, on]) => reqChip(`data-v="${v}"`, label, !!on)).join(""), { multi: true })}
      <label class="req-text">희망 골프장 <small>(알면)</small><input class="qq-input" type="text" data-field="희망 골프장" placeholder="예: 롱탄, 트윈도브 / 아직 모름" autocomplete="off"></label>
      ${reqFoot("카톡으로 묶음 견적 받기")}
      <p class="qq-note">티오프·숙소·차량 가능 여부와 요금은 상담 때 확인합니다. <a href="/airport">공항 픽업·패스트트랙만 필요하면 →</a></p>
    </section>`;
}

function airportPage() {
  const faqs = [
    ["비행기가 늦게 도착하면 기사는 어떻게 하나요?", "편명을 함께 보내 주시면 실제 도착 시각에 맞춰 기사 일정을 잡습니다. 지연 때 대기 조건은 예약할 때 미리 안내해 드립니다."],
    ["밤늦게·새벽에 도착해도 픽업되나요?", "네. 늦은 밤·새벽 도착도 상담합니다. 시간대에 따라 요금이 달라질 수 있어 편명과 도착 시각을 보내 주시면 견적으로 안내합니다."],
    ["패스트트랙은 무엇이고 언제까지 신청해야 하나요?", "공항 담당 직원이 이름 피켓으로 맞이해 입국(또는 출국) 심사를 전용 줄로 안내하는 서비스입니다. 여권 이름과 편명이 필요해 미리 신청할수록 확실합니다. 맞이하는 위치와 끝나는 지점은 예약 때 안내합니다."],
    ["골프백이 있으면 어떤 차가 맞나요?", "2~3명과 골프백 2~3개는 7인승, 4~8명이거나 골프백·캐리어가 많으면 16인승을 권합니다. 인원과 골프백·캐리어 수를 함께 알려 주세요."],
    ["공항에서 바로 골프장으로 갈 수 있나요?", "네. 도착일 라운드는 입국 심사·짐 찾기 시간과 공항→골프장 이동시간을 더해 티오프를 잡습니다. 골프장마다 공항 이동시간을 표로 정리해 두었습니다."],
  ];
  const services = [
    ["공항 픽업", "도착", "출구에서 기사가 이름 피켓으로 맞이하고 숙소·골프장까지 모십니다.", "편명·도착 시각, 인원, 골프백·캐리어 수, 숙소 주소"],
    ["공항 샌딩", "출국", "숙소·골프장에서 짐을 싣고 출국 시간에 맞춰 공항으로 모십니다.", "출국 편명·시각, 출발 장소, 인원·짐 수"],
    ["입국 패스트트랙", "도착", "공항 직원이 맞이해 입국 심사를 전용 줄로 안내합니다. 부모님·아이 동반, 단체에 많이 씁니다.", "여권 영문 이름, 편명, 인원(성인·아동)"],
    ["출국 패스트트랙", "출국", "체크인 뒤 출국 심사·보안 검색을 전용 줄로 안내합니다.", "여권 영문 이름, 출국 편명, 인원"],
  ];
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><span aria-current="page">공항 픽업·패스트트랙</span></nav>
    <section class="page-hero page-hero-photo" style="--hero-img:url('/assets/images/service-vehicle.webp')"><div class="shell"><p class="eyebrow">공항 픽업·샌딩 · 패스트트랙</p><h1>호치민 공항 픽업·패스트트랙,<br>카톡 한 번에 예약</h1><p>탄손녓(떤선녓) 공항 도착부터 숙소·골프장까지. 편명·인원·짐만 보내 주시면 차량과 패스트트랙을 함께 잡아 드립니다.</p><div class="hero-x-actions"><a class="button button-kakao" href="#req">1분 요청서 쓰기</a><a class="button button-glass" href="${airportGo}">카톡 바로 문의</a></div></div></section>
    ${airportReqCard()}
    <section class="section shell"><div class="section-heading"><div><p class="eyebrow">도착하는 날</p><h2>비행기에서 숙소까지 이렇게 진행됩니다</h2></div></div>
      <ol class="airport-steps"><li><strong>예약 확정</strong><span>편명·인원·짐을 보내 주시면 차량과 패스트트랙을 확정하고 기사 정보를 카톡으로 보내 드립니다.</span></li><li><strong>입국 패스트트랙 <small>(신청 시)</small></strong><span>공항 직원이 이름 피켓으로 맞이해 입국 심사를 전용 줄로 안내합니다.</span></li><li><strong>짐 찾기</strong><span>골프백·캐리어를 모두 받은 뒤 출구로 나옵니다.</span></li><li><strong>기사 미팅</strong><span>출구에서 이름 피켓을 든 기사를 만납니다. 손님 단톡방에서 기사가 실시간 위치를 알려 드립니다.</span></li><li><strong>숙소·골프장 도착</strong><span>시내 숙소, 풀빌라, 또는 바로 골프장으로 이동합니다.</span></li></ol>
    </section>
    <section class="section section-tint"><div class="shell"><div class="section-heading"><div><p class="eyebrow">맡길 수 있는 것</p><h2>네 가지를 한 번에 또는 따로</h2></div></div>
      <div class="option-grid">${services.map(([name, tag, text, need]) => `<article><span>${tag}</span><h3>${name}</h3><p>${text}</p><p class="airport-need"><b>보내 주실 것</b> ${need}</p></article>`).join("")}</div>
    </div></section>
    <section class="ops-section" aria-labelledby="ops-title"><div class="shell ops-inner">
      <figure class="ops-shot"><img src="/assets/images/ops/zalo-pickup.webp" alt="손님 전용 단톡방 실제 운영 화면(이름·사진·지도는 가림)" width="440" height="905" loading="lazy"><figcaption>실제 공항 픽업 단톡방(개인정보 가림)</figcaption></figure>
      <div class="ops-copy"><p class="eyebrow">신짜오만의 방식</p><h2 id="ops-title">"어디세요?" 할 필요 없이</h2>
        <ol class="ops-list"><li><strong>손님 한 팀마다 기사와 전용 단톡방</strong><span>도착 전에 기사 이름·차량 정보를 받고, 같은 방에서 바로 연락합니다.</span></li><li><strong>기사가 실시간 위치 공유</strong><span>출구에 나오기 전부터 기사가 지금 어디쯤인지 보입니다.</span></li><li><strong>픽업부터 귀국 샌딩까지 한 방에서</strong><span>골프장 이동·숙소 연락도 같은 단톡방에서 이어집니다.</span></li></ol></div></div></section>
    <section class="section shell"><div class="section-heading"><div><p class="eyebrow">차량 고르기</p><h2>인원과 골프백 수로 고르세요</h2></div><a class="text-link" href="/rent">상황별 차량 전체 →</a></div>${chooseTable("인원·짐별 공항 차량")}</section>
    <section class="section shell"><div class="section-heading"><div><p class="eyebrow">공항에서 바로 골프</p><h2>도착일 라운드, 이동시간부터 보세요</h2></div></div>
      <div class="guide-jump"><a class="button button-quiet" href="/golf#airport-times">공항→골프장 시간표</a><a class="button button-quiet" href="/guide/arrival-day-airport-hotel-golfbag-plan.html">도착일 공항·숙소·골프백 순서</a><a class="button button-quiet" href="/rent/family-luggage.html">짐 많은 일정 차량</a><a class="button button-quiet" href="/#combo">골프·숙소·차량 한 번에 견적</a></div>
    </section>
    <section class="section shell"><div class="section-heading"><div><p class="eyebrow">자주 묻는 질문</p><h2>공항 픽업·패스트트랙 FAQ</h2></div></div><dl class="home-faq-list">${faqs.map(([q, a]) => `<div><dt>${escapeHtml(q)}</dt><dd>${escapeHtml(a)}</dd></div>`).join("")}</dl></section>
    <section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">편명·인원·짐만</p><h2>공항부터 숙소까지,<br>카톡 한 번으로 맡기세요</h2><p>요금은 날짜·차량·시간대에 따라 달라 견적으로 안내합니다. 홈페이지에서는 결제하지 않습니다.</p></div><a class="button button-kakao button-lg" href="#req">1분 요청서 쓰기</a></div></section>`;
  return layout({ title: "호치민 공항 픽업·샌딩·패스트트랙 예약 | 탄손녓 공항", description: "호치민 탄손녓 공항 픽업·샌딩 차량과 입국·출국 패스트트랙을 카카오톡 한 번에 요청하세요. 편명·인원·골프백 수에 맞춰 7인승·16인승 차량과 패스트트랙을 함께 잡아 드립니다.", pathname: "/airport", active: "airport", image: "service-vehicle.webp", keywords: ["호치민 공항 픽업", "탄손녓 공항 픽업", "호치민 패스트트랙", "탄손녓 패스트트랙", "호치민 공항 샌딩", "호치민 골프 공항 픽업"], schema: [faqSchema(faqs), breadcrumbSchema([["홈", "/"], ["공항 픽업·패스트트랙", "/airport"]])], content });
}

function vehiclePage() {
  const options = [
    ["골프장 왕복", "호텔·아파트·풀빌라에서 골프장까지 일정에 맞춰 상담합니다.", "/rent/golf-transfer.html", "골프장별 차량 보기"],
    ["공항 픽업·샌딩", "항공편 시간과 인원, 짐 수량에 맞는 차량과 입국 패스트트랙을 확인합니다.", "/airport", "공항 픽업·패스트트랙 보기"],
    ["당일 전용 차량", "골프와 식사·관광 일정을 함께 이동할 때 상담합니다.", "/rent/city-full-day.html", "종일 전용 차량 보기"],
    ["시외·장거리", "호치민에서 붕따우·호트람·무이네 등 장거리 이동을 확인합니다.", "/rent/vungtau-day-trip.html", "붕따우 당일 차량 보기"],
  ];
  const content = `<section class="page-hero page-hero-photo" style="--hero-img:url('/assets/images/service-vehicle.webp')"><div class="shell"><p class="eyebrow">골프 차량</p><h1>호치민 골프 차량 상담</h1><p>4·7·16인승과 리무진 등 인원과 골프백 수량에 맞는 차량을 상담합니다. 인승별·골프장별·당일 여행별 안내는 상황별 차량 렌트에 모았습니다.</p><div class="hero-x-actions"><button class="button js-consult" type="button" data-interest="호치민 골프 차량 상담">차량 상담하기</button><a class="button button-glass" href="/rent">상황별 차량 보기</a></div></div></section><section class="section shell"><div class="option-grid">${options.map(([name, text, href, label]) => `<article><span>차량 서비스</span><h2>${name}</h2><p>${text}</p><a class="text-link" href="${href}">${label} →</a></article>`).join("")}</div></section><section class="section section-tint"><div class="shell"><div class="section-heading"><div><p class="eyebrow">차량 종류</p><h2>인원과 골프백에 맞춰 고르세요</h2></div><a class="text-link" href="/rent">상황별 차량 전체 →</a></div><div class="vehicle-grid">${vehicleTypes.map((type) => `<article class="vehicle-card"><a href="${type.page}"><img src="/assets/images/${type.image}" width="1200" height="900" loading="lazy" decoding="async" alt="${type.alt}"></a><div><h3><a href="${type.page}">${type.name}</a></h3><p>${type.text}</p></div></article>`).join("")}</div><p class="vehicle-note">사진은 차량 종류 예시입니다. 실제 배정 차량은 날짜와 인원에 따라 달라질 수 있습니다.</p></div></section><section class="section"><div class="shell compact-copy"><p class="eyebrow">상담 전에 확인</p><h2>인원뿐 아니라 골프백 수량도 중요합니다</h2><p>이용 날짜, 탑승 인원, 골프백과 캐리어 수량, 출발지와 도착지를 알려주시면 차량 확인이 빨라집니다.</p></div></section>`;
  return layout({ title: "호치민 골프 차량 상담", description: "호치민 골프장 왕복, 공항 픽업, 당일 전용, 시외 이동 차량을 인원과 골프백 수에 맞춰 한국어로 상담합니다.", pathname: "/services/vehicle.html", active: "services", image: "service-vehicle.webp", content });
}

// ── 차량 렌트 상황별 페이지(/rent) ──────────────────────────────────────────
// 공통 틀: 누구에게 맞는지 · 차량 고르는 기준 · 일정 예시 · 함께 묶으면 좋은 것 · FAQ 3개(화면=FAQPage) · 카톡 /go/rent-*.
const faqSchema = (faqs) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) });
const rentPageTitle = (pathname) => {
  const course = courses.find((item) => golfRentPath(item) === pathname);
  if (course) return `${courseLabel(course)}까지 차량`;
  return rentPages.find((page) => `/rent/${page.slug}.html` === pathname).h1;
};
const bamItem = (key) => `<li><a href="${vietnambam[key].url}" target="_blank" rel="noopener">${escapeHtml(vietnambam[key].label)}</a></li>`;
const stayItems = () => `<li>숙소: 자매 사이트 ${poolvilla.name}에서 ${poolvilla.villaRooms} 풀빌라를 룸 수로 골라 볼 수 있습니다. <a href="${poolvilla.villaList}" target="_blank" rel="noopener">룸 수별 풀빌라 목록</a> · <a href="${poolvilla.apartmentList}" target="_blank" rel="noopener">아파트 목록</a></li>`;
const chooseTable = (caption) => `<div class="table-scroll"><table class="airport-table rent-choose"><caption>${escapeHtml(caption)}</caption><thead><tr><th scope="col">인원·짐</th><th scope="col">차량</th></tr></thead><tbody>${chooseRows.map(([who, name, href]) => `<tr><th scope="row">${escapeHtml(who)}</th><td><a href="${href}">${escapeHtml(name)}</a></td></tr>`).join("")}</tbody></table></div><p>${escapeHtml(luggageNote)} 사진은 차량 종류 예시이며, 실제 배정 차량은 날짜와 인원에 따라 달라질 수 있습니다.</p>`;
const golfTimeTable = (caption) => `<div class="table-scroll"><table class="airport-table"><caption>${caption}</caption><thead><tr><th scope="col">골프장</th><th scope="col">방면</th><th scope="col">공항에서</th></tr></thead><tbody>${hcmCourses.map((course) => `<tr><th scope="row"><a href="${golfRentPath(course)}">${escapeHtml(course.name)}까지 차량</a></th><td>${escapeHtml(directionOf(course) || course.location)}</td><td><strong>${escapeHtml(course.drive)}</strong>${course.driveKm ? ` <small>(${escapeHtml(course.driveKm)})</small>` : ""}</td></tr>`).join("")}</tbody></table></div>`;

function rentShell({ pathname, title, description, image, eyebrow, h1, lead, go, body, faqs, ctaText }) {
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/rent">차량 렌트</a><span>›</span><span aria-current="page">${escapeHtml(h1)}</span></nav>
    <section class="page-hero page-hero-photo" style="--hero-img:url('/assets/images/${image}')"><div class="shell"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(h1)}</h1><p>${lead}</p><div class="hero-x-actions"><a class="button button-kakao" href="${rentGo(go)}" data-rent="${go}">카카오톡으로 차량 상담</a><a class="button button-glass" href="/rent">상황별 차량 전체</a></div></div></section>
    <section class="section shell"><div class="course-guide rent-body">${body}
      <section class="rent-faq" aria-labelledby="rent-faq-title"><h2 id="rent-faq-title">자주 묻는 질문</h2><dl class="home-faq-list">${faqs.map(([question, answer]) => `<div><dt>${escapeHtml(question)}</dt><dd>${escapeHtml(answer)}</dd></div>`).join("")}</dl></section>
      <div class="stay-combo-box rent-cta"><p class="eyebrow">차량 상담</p><h2>날짜·인원·골프백·캐리어 수를 보내 주세요</h2><p>${escapeHtml(ctaText || "출발지와 도착지, 일정 시작·종료 시간을 함께 알려 주시면 맞는 차량을 확인합니다. 요금은 날짜·차량·일정에 따라 달라 견적으로 안내합니다.")}</p><a class="button button-kakao button-lg" href="${rentGo(go)}" data-rent="${go}">카카오톡으로 차량 상담</a></div>
    </div></section>`;
  return layout({ title, description, pathname, active: "rent", image, content, schema: [breadcrumbSchema([["홈", "/"], ["차량 렌트", "/rent"], [h1, pathname]]), faqSchema(faqs)] });
}

// 받침 있으면 a(은·과), 없으면 b(는·와). 끝 글자가 한글이 아니면(CC 등) 받침 없음으로 읽는다.
const josa = (word, a, b) => { const code = word.trim().slice(-1).charCodeAt(0) - 0xac00; return code >= 0 && code <= 11171 && code % 28 ? a : b; };
const rentLinks = (paths) => paths.map((href) => `<a href="${href}">${escapeHtml(rentPageTitle(href))}</a>`).join(" · ");

function rentSituationPage(page) {
  const pathname = `/rent/${page.slug}.html`;
  const list = page.courses.map((slug) => courses.find((course) => course.slug === slug));
  const route = page.trip ? dayTripRoutes[page.trip] : null;
  const body = `
      <h2>이런 분께 맞습니다</h2><ul>${page.fit.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      ${route ? `<h2>이동시간</h2><p>호치민 1군(벤탄 시장)에서 ${escapeHtml(route.to)}까지 공개 도로 경로 계산으로 ${escapeHtml(route.km)}, ${escapeHtml(route.time)}입니다(교통 상황에 따라 다름). 막힘 없는 경우의 계산이라 출퇴근·주말에는 더 걸립니다. ${escapeHtml(page.tripNote)}</p>` : ""}
      ${page.slug === "golf-transfer" ? `<h2>골프장까지 이동시간</h2>${golfTimeTable("떤선녓 국제공항(SGN) 기준 평소 교통 시간입니다. 숙소에서 출발하면 숙소 위치에 따라 달라지고, 출퇴근·주말·비 오는 날에는 더 걸릴 수 있습니다.")}` : ""}
      <h2>차량 고르는 기준</h2>${chooseTable("인원과 골프백·캐리어 수로 고르는 기준입니다.")}
      <h2>일정 예시</h2><ol>${page.schedule.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      <h2>함께 묶으면 좋은 것</h2><ul>${list.map((course) => `<li>골프: <a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a> — ${escapeHtml(airportShort(course))}에서 약 ${escapeHtml(course.drive)}${course.area === "hcm" ? ` · <a href="${golfRentPath(course)}">이 골프장까지 차량</a>` : ""}</li>`).join("")}${stayItems()}${page.bam ? bamItem("hcm") : ""}<li>다른 차량 안내: ${rentLinks(page.related)}</li></ul>`;
  return rentShell({ pathname, title: page.title, description: page.description, image: page.image, eyebrow: `차량 렌트 · ${page.group}`, h1: page.h1, lead: escapeHtml(page.lead), go: page.go, body, faqs: page.faq });
}

function golfRentPage(course) {
  const pathname = golfRentPath(course);
  const airport = course.airport || areaOf(course).airport;
  const direction = directionOf(course);
  const siblings = direction ? hcmCourses.filter((item) => item !== course && directionOf(item) === direction) : [];
  const km = course.driveKm ? ` (${escapeHtml(course.driveKm)})` : "";
  const reads = courseGuides[course.slug].related.map((file) => {
    const post = file.startsWith("guide/") ? guides.find((item) => `guide/${item.slug}.html` === file) : blogPosts.find((item) => item.file === file);
    return post ? `<a href="${relatedHref(file)}">${escapeHtml(post.title)}</a>` : "";
  }).filter(Boolean);
  const first = course.slug === "tan-son-nhat-golf-course"
    ? `공항 도착 뒤 바로, 또는 출국 전 마지막 라운드 — 공항에서 약 ${course.drive}`
    : `숙소 출발 — ${airportShort(course)} 기준 약 ${course.drive} 거리라 숙소 위치에 맞춰 출발 시간을 정합니다`;
  const after = longDistance(course) && / 숙박 일정과 함께 추천$/.test(course.access)
    ? `라운드 뒤 ${course.access.replace(/ 일정과 함께 추천$/, "")}, 또는 호치민 숙소로 복귀`
    : "라운드 뒤 숙소 복귀, 또는 저녁 식사·시내 일정으로 이동";
  const schedule = [first, "티오프 전에 접수·환복·골프백 하차 시간을 넣어 도착", after, ...(siblings.length ? [`다음 날 같은 ${direction} ${siblings.map(courseLabel).join("·")}${josa(courseLabel(siblings.at(-1)), "과", "와")} 연속 라운드로 묶기`] : [])];
  const body = `
      <h2>${escapeHtml(courseLabel(course))} 이동 정보</h2><ul><li>위치: ${escapeHtml(course.location)} (${escapeHtml(course.province)})</li><li>공항에서: ${escapeHtml(airport)} 기준 평소 교통 약 ${escapeHtml(course.drive)}${km} — 공항 기준이라 숙소에서 출발하면 숙소 위치에 따라 달라집니다</li><li>이동 안내: ${escapeHtml(course.access)}</li>${direction ? `<li>방면: ${escapeHtml(direction)}${siblings.length ? ` — 같은 방면 ${siblings.map((item) => `<a href="${golfRentPath(item)}">${escapeHtml(courseLabel(item))}</a>`).join(" · ")}` : ""}</li>` : ""}</ul><p class="drive-note">출퇴근·주말·비 오는 날에는 더 걸릴 수 있습니다.</p>
      <h2>몇 인승을 고를까</h2>${chooseTable(`${courseLabel(course)} 일정에 맞는 차량을 인원과 골프백·캐리어 수로 고르는 기준입니다.`)}${longDistance(course) ? `<p>${escapeHtml(courseLabel(course))}${josa(courseLabel(course), "은", "는")} 호치민에서 이동이 길어 <a href="/rent/limousine-van.html">9인승 리무진 밴</a>도 편합니다. 당일 왕복이면 <a href="/rent/vungtau-day-trip.html">붕따우 당일 차량</a>도 함께 보세요.</p>` : ""}
      <h2>일정 예시</h2><ol>${schedule.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      <h2>함께 묶으면 좋은 것</h2><ul><li>골프: <a href="/golf/${course.slug}.html">${escapeHtml(course.name)} 골프장 안내</a> — ${escapeHtml(course.holes)}, 예약 가능 날짜 상담</li>${stayItems()}${bamItem("hcm")}${reads.length ? `<li>이동·예약 글: ${reads.join(" · ")}</li>` : ""}<li>다른 골프장 차량: <a href="/rent/golf-transfer.html">호치민 골프장 ${hcmCourses.length}곳 이동시간</a></li></ul>`;
  return rentShell({
    pathname,
    title: `${course.name}까지 차량 렌트 — 공항 이동시간·인승 고르기`,
    description: `${course.name}까지 차량 안내. ${airportShort(course)} 기준 약 ${course.drive}${course.driveKm ? `(${course.driveKm})` : ""} 이동, 인원·골프백에 맞는 인승과 숙소·골프 일정을 함께 한국어로 상담합니다.`,
    image: course.image && !course.aiStaged ? course.image : "service-vehicle.webp", // AI 연출 사진은 차량 쪽에 쓰지 않는다
    eyebrow: `차량 렌트 · ${course.region} 골프장`,
    h1: `${courseLabel(course)}까지 차량`,
    lead: `${escapeHtml(course.name)}(${escapeHtml(course.location)})까지 차량을 상담합니다. ${escapeHtml(airportShort(course))}에서 평소 교통 약 ${escapeHtml(course.drive)}${km}입니다.`,
    go: "golf",
    body,
    faqs: golfRentFaqs(course, airport),
    ctaText: `${courseLabel(course)} 날짜·티오프와 숙소 위치를 함께 알려 주시면 출발 시간과 차량을 맞춰 드립니다. 요금은 날짜·차량·일정에 따라 달라 견적으로 안내합니다.`,
  });
}

function rentHubPage() {
  const groups = ["당일 여행", "호치민 시내", "짐 많은 가족"];
  const card = (page) => `<li><a href="/rent/${page.slug}.html"><em>${escapeHtml(page.group)}</em><strong>${escapeHtml(page.h1)}</strong><span>${escapeHtml(page.lead)}</span></a></li>`;
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/services">숙소·차량</a><span>›</span><span aria-current="page">차량 렌트</span></nav>
    <section class="page-hero page-hero-photo" style="--hero-img:url('/assets/images/service-vehicle.webp')"><div class="shell"><p class="eyebrow">차량 렌트</p><h1>호치민 차량 렌트, 상황별로 고르기</h1><p>인승별, 골프장별, 붕따우·무이네·껀저 당일, 시내 반나절·종일, 짐 많은 가족까지. 낮엔 골프, 저녁엔 숙소, 그 사이 이동을 한 번에 맞춰 드립니다.</p><div class="hero-x-actions"><button class="button button-kakao js-consult" type="button" data-interest="차량 렌트 상담">카카오톡으로 차량 상담</button><a class="button button-glass" href="#rent-golf">골프장별 차량</a></div></div></section>
    <section class="section shell"><section class="guide-group" id="rent-vehicles"><h2>차량 종류별 <span>${vehicleTypes.length}</span></h2><div class="vehicle-grid">${vehicleTypes.map((type) => `<article class="vehicle-card"><a href="${type.page}"><img src="/assets/images/${type.image}" width="1200" height="900" loading="lazy" decoding="async" alt="${type.alt}"></a><div><h3><a href="${type.page}">${type.name}</a></h3><p>${type.text}</p></div></article>`).join("")}</div><p class="vehicle-note">사진은 차량 종류 예시입니다. 실제 배정 차량은 날짜와 인원에 따라 달라질 수 있습니다.</p></section>
    <section class="guide-group" id="rent-golf"><h2>골프장까지 차량 <span>${hcmCourses.length}곳</span></h2>${golfTimeTable("떤선녓 국제공항(SGN) 기준 평소 교통 시간입니다. 출퇴근 시간·주말·비 오는 날에는 더 걸릴 수 있습니다.")}<p class="hub-more"><a href="/rent/golf-transfer.html">골프장 이동 차량 안내 전체 →</a></p></section>
    ${groups.map((group) => `<section class="guide-group"><h2>${group}</h2><ul class="guide-list">${rentPages.filter((page) => page.group === group).map(card).join("")}</ul></section>`).join("")}
    <section class="guide-group"><h2>숙소·저녁 일정과 함께</h2><ul class="guide-list"><li><a href="${poolvilla.villaList}" target="_blank" rel="noopener"><em>숙소</em><strong>${poolvilla.name} 풀빌라 목록</strong><span>${poolvilla.villaRooms} 풀빌라를 룸 수로 골라 보고, 골프장·차량과 함께 견적 받으세요.</span></a></li><li><a href="${vietnambam.hcm.url}" target="_blank" rel="noopener"><em>저녁 일정</em><strong>${escapeHtml(vietnambam.hcm.label)}</strong><span>라운드 뒤 저녁 일정은 자매 사이트 베트남밤에서 볼 수 있습니다.</span></a></li></ul></section></section>
    <section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">날짜와 인원만 알려주세요</p><h2>골프·숙소·차량, 한 번에 견적</h2><p>차량은 기본으로 넣어 드리고 필요 없으면 빼 드립니다. 홈페이지에서는 결제하지 않습니다.</p></div><a class="button button-kakao button-lg" href="/go/golf-combo" data-combo="rent-hub">골프·숙소·차량 한 번에 견적</a></div></section>`;
  const itemUrls = [...vehicleTypes.map((type) => type.page), "/rent/golf-transfer.html", ...hcmCourses.map(golfRentPath), ...rentPages.filter((page) => groups.includes(page.group)).map((page) => `/rent/${page.slug}.html`)];
  const itemList = { "@context": "https://schema.org", "@type": "ItemList", name: "호치민 차량 렌트 상황별 안내", itemListElement: itemUrls.map((url, index) => ({ "@type": "ListItem", position: index + 1, url: `${site.siteUrl}${url}` })) };
  return layout({ title: "호치민 차량 렌트 상황별 안내", description: `호치민 차량 렌트를 7인승·9인승 리무진·16인승(17명 이상은 여러 대), 골프장 ${hcmCourses.length}곳, 붕따우·무이네·껀저 당일, 시내 반나절·종일, 짐 많은 가족 상황별로 비교하고 한국어로 상담하세요.`, pathname: "/rent", active: "rent", image: "service-vehicle.webp", content, schema: [itemList, breadcrumbSchema([["홈", "/"], ["숙소·차량", "/services"], ["차량 렌트", "/rent"]])] });
}

function guideIndexPage() {
  const sections = guideCategories.map((category) => {
    const items = guides.filter((guide) => guide.category === category);
    return `<section class="guide-group" id="guide-${guideCategories.indexOf(category) + 1}"><h2>${category} <span>${items.length}</span></h2><ul class="guide-list">${items.map((guide) => `<li><a href="/guide/${guide.slug}.html"><strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.sub)}</span></a></li>`).join("")}</ul></section>`;
  }).join("");
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">예약 가이드</p><h1>베트남 골프 예약 가이드</h1><p>예약 준비, 일정 짜기, 비용 확인까지 상담 전에 알아두면 좋은 내용을 모았습니다.</p><div class="guide-jump">${guideCategories.map((category, index) => `<a class="button button-quiet" href="#guide-${index + 1}">${category}</a>`).join("")}</div></div></section><section class="section shell"><section class="guide-group"><h2>주제별로 모아 보기</h2><ul class="guide-list">${topicHubs.map((hub) => `<li><a href="${hub.path}"><em>${hub.category} ${guides.filter((guide) => guide.category === hub.category).length}개 글</em><strong>${escapeHtml(hub.title)}</strong><span>${escapeHtml(hub.lead)}</span></a></li>`).join("")}</ul></section>${sections}</section><section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">찾는 내용이 없나요?</p><h2>날짜와 인원만 알려주세요</h2><p>골프장과 차량·숙소를 함께 확인합니다.</p></div><button class="button button-light js-consult" type="button" data-interest="골프 예약 가이드 상담">상담하기</button></div></section>`;
  return layout({ title: "베트남 골프 예약 가이드", description: "베트남 골프 예약 준비, 항공·라운드 일정 짜기, 견적 포함 항목 확인까지 상담 전에 알아둘 내용을 정리했습니다.", pathname: "/guide", active: "guide", content });
}

function guidePage(guide) {
  const related = guides.filter((item) => item.category === guide.category && item.slug !== guide.slug).slice(0, 4);
  const hub = hubForCategory(guide.category);
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/guide">예약 가이드</a><span>›</span>${hub ? `<a href="${hub.path}">${escapeHtml(hub.label)}</a><span>›</span>` : ""}<span aria-current="page">${escapeHtml(guide.title)}</span></nav><section class="article-hero shell"><p class="eyebrow">${guide.category}</p><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.sub)}</p><div><time datetime="${guide.date}">${guide.date}</time><span>신짜오골프 편집부</span></div></section><div class="article-layout shell"><div class="article-body guide-article">${guide.body}${related.length ? `<h2>같이 보면 좋은 글</h2><ul>${related.map((item) => `<li><a href="/guide/${item.slug}.html">${escapeHtml(item.title)}</a></li>`).join("")}</ul>` : ""}</div><aside class="side-consult"><strong>예약 상담</strong><p>날짜·인원·희망 골프장을 알려주시면 가능 여부를 확인해드립니다.</p>${hub ? `<a class="side-link" href="${hub.path}">${escapeHtml(hub.label)} 글 모아 보기 →</a>` : ""}<a class="side-link" href="/guide">예약 가이드 전체 →</a><button class="button button-block js-consult" type="button" data-interest="${escapeHtml(guide.title)} 관련 상담">상담하기</button></aside></div>`;
  const schema = [{
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.date,
    dateModified: guide.date,
    author: { "@id": `${site.siteUrl}/#organization` },
    publisher: { "@id": `${site.siteUrl}/#organization` },
    mainEntityOfPage: `${site.siteUrl}/guide/${guide.slug}.html`,
    inLanguage: "ko-KR",
  }, breadcrumbSchema([["홈", "/"], ["예약 가이드", "/guide"], ...(hub ? [[hub.label, hub.path]] : []), [guide.title, `/guide/${guide.slug}.html`]])];
  if (Array.isArray(guide.faq) && guide.faq.length) {
    schema.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: guide.faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) });
  }
  return layout({ title: guide.title, description: guide.description, pathname: `/guide/${guide.slug}.html`, active: "guide", schema, content, pageType: "article", publishedTime: guide.date, modifiedTime: guide.date });
}

// 주제별 모음(골프장별 가격·예약 방법·일정 짜기). 그린피 금액은 적지 않는다(요금 구성은 src/pricing-guide.mjs).
function topicHubPage(hub) {
  const items = guides.filter((guide) => guide.category === hub.category);
  const stepGuides = hub.steps.map((slug) => {
    const found = guides.find((item) => item.slug === slug);
    if (!found || found.category !== hub.category) throw new Error(`주제 모음 단계 글 누락: ${hub.key}/${slug}`);
    return found;
  });
  const courseRows = courses.map((course) => ({ course, list: items.filter((guide) => coursesForGuide(guide, courses).includes(course)) })).filter((row) => row.list.length);
  const others = topicHubs.filter((item) => item.key !== hub.key);
  const guideItem = (guide, tag) => `<li><a href="/guide/${guide.slug}.html">${tag ? `<em>${tag}</em>` : ""}<strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.sub)}</span></a></li>`;
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/guide">예약 가이드</a><span>›</span><span aria-current="page">${escapeHtml(hub.label)}</span></nav>
<section class="page-hero"><div class="shell"><p class="eyebrow">${escapeHtml(hub.category)}</p><h1>${escapeHtml(hub.title)}</h1><p>${escapeHtml(hub.lead)}</p><div class="guide-jump">${others.map((item) => `<a class="button button-quiet" href="${item.path}">${escapeHtml(item.title)}</a>`).join("")}<a class="button button-quiet" href="/guide">예약 가이드 전체</a></div></div></section>
<section class="section shell">
<p class="hub-notice">${escapeHtml(hub.notice)}</p>
<section class="guide-group"><h2>${escapeHtml(hub.stepsTitle)}</h2><ol class="guide-list">${stepGuides.map((guide, index) => guideItem(guide, String(index + 1).padStart(2, "0"))).join("")}</ol>${hub.key === "itinerary" ? `<p class="hub-more"><a href="/golf#airport-times">공항→골프장 이동시간표</a> · <a href="/services/vehicle.html">골프장 왕복 차량 상담</a></p>` : ""}</section>
${courseRows.length ? `<section class="guide-group"><h2>${escapeHtml(hub.courseTitle)} <span>${courseRows.length}곳</span></h2><div class="table-scroll"><table class="airport-table"><caption>골프장 이름을 누르면 위치·홀 수·공항 이동시간을, 글 제목을 누르면 확인 순서를 볼 수 있습니다.</caption><thead><tr><th scope="col">골프장</th><th scope="col">지역</th><th scope="col">관련 글</th></tr></thead><tbody>${courseRows.map(({ course, list }) => `<tr><th scope="row"><a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a></th><td>${escapeHtml(areaOf(course).name)}</td><td>${list.map((guide) => `<a href="/guide/${guide.slug}.html">${escapeHtml(guide.title)}</a>`).join("<br>")}</td></tr>`).join("")}</tbody></table></div></section>` : ""}
<section class="guide-group"><h2>${escapeHtml(hub.category)} 글 전체 <span>${items.length}</span></h2><ul class="guide-list">${items.map((guide) => guideItem(guide)).join("")}</ul></section>
<section class="guide-group hub-faq"><h2>자주 묻는 질문</h2>${hub.faq.map(([question, answer]) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join("")}</section>
</section>
<section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">날짜와 인원만 알려주세요</p><h2>같은 조건으로 확인해 드립니다</h2><p>골프장·티타임·차량·숙소를 한국어로 상담합니다. 홈페이지에서는 결제하지 않습니다.</p></div><button class="button button-light js-consult" type="button" data-interest="${escapeHtml(hub.title)} 상담">상담하기</button></div></section>`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: hub.title,
      numberOfItems: items.length,
      itemListElement: items.map((guide, index) => ({ "@type": "ListItem", position: index + 1, url: `${site.siteUrl}/guide/${guide.slug}.html`, name: guide.title })),
    },
    breadcrumbSchema([["홈", "/"], ["예약 가이드", "/guide"], [hub.label, hub.path]]),
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: hub.faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
  ];
  return layout({ title: hub.title, description: hub.description, pathname: hub.path, active: "guide", content, schema, keywords: hub.keywords });
}

function blogPage() {
  const cards = blogPosts.map((post) => `<article class="post-card"><a href="/blog/${post.file}"><img src="/assets/blog/${post.cover}" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(post.title)}"></a><div><span>${post.category}</span><h2><a href="/blog/${post.file}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.description)}</p><a class="text-link" href="/blog/${post.file}">내용 보기 →</a></div></article>`).join("");
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">골프·숙소 정보</p><h1>베트남 골프·숙소 정보</h1><p>골프장 고르기, 숙소 이용, 이동과 일정 준비까지 베트남 골프여행 전에 알아 두면 좋은 정보를 모았습니다.</p></div></section><section class="section shell"><div class="post-grid">${cards}</div></section><section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">찾는 정보가 없나요?</p><h2>날짜와 인원만 알려주세요</h2><p>골프장과 숙소·차량을 함께 확인합니다.</p></div><button class="button button-light js-consult" type="button" data-interest="골프 및 숙소 상담">상담하기</button></div></section>`;
  return layout({ title: "베트남 골프·숙소 정보", description: "호치민을 중심으로 베트남 골프장 선택, 풀빌라와 아파트 이용, 이동과 일정 짜기에 필요한 정보를 한국어로 정리했습니다.", pathname: "/blog", active: "blog", content });
}

async function blogPostPage(post) {
  let article;
  if (post.sourceType === "markdown") {
    article = post.articleHtml;
  } else {
    const source = await readFile(path.join(root, "src/legacy-blog", post.file), "utf8");
    const rawArticle = source.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0];
    if (!rawArticle) throw new Error(`${post.file}: article 영역을 찾을 수 없습니다.`);
    article = rawArticle
      .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, "")
      .replace(/<p\s+class="villa-detail-address">[\s\S]*?<\/p>/i, "")
      .replaceAll("신짜오호치민", site.name)
      .replaceAll("숙소 / 가이드 / 가라오케 / 로컬가라오케 / 풀빌라", "골프 / 차량 / 아파트 / 풀빌라")
      .replaceAll("카페 예약 문의 (카카오톡 채널)", "카카오톡 상담")
      .replace(/\/picter\/blog\/([^"']+)\.jpg/gi, "/assets/blog/$1.webp")
      .replace(/<figure\b[^>]*>[\s\S]*?src="\/assets\/blog\/y4\/5\.webp"[\s\S]*?<\/figure>/gi, "")
      .replace(/<img\b[^>]*src="\/assets\/blog\/lexington\/facility\/[^"]+"[^>]*>/gi, "")
      .replace(/<div class="villa-detail-section">\s*<h2[^>]*>[^<]*객실 요금 안내[^<]*<\/h2>[\s\S]*?<\/div>/gi, `<div class="article-note"><h2>객실 조건 안내</h2><p>기존 가격표는 현재 조건과 다를 수 있어 노출하지 않습니다. 이용 날짜와 인원에 따른 가능 여부와 조건은 상담 시 확인합니다.</p></div>`)
      .replace(/<img\b(?![^>]*\bloading=)([^>]*?)>/gi, '<img loading="lazy" decoding="async" width="1200" height="800"$1>');
  }

  const relatedUrl = post.category === "아파트" ? "/services/apartments.html" : "/services/villas.html";
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/blog">골프·숙소 정보</a><span>›</span><span aria-current="page">${escapeHtml(post.title)}</span></nav><section class="article-hero shell"><p class="eyebrow">${post.category}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.description)}</p><div><time datetime="${post.date}">${post.date}</time><span>신짜오골프 편집부</span></div></section><div class="article-layout shell"><div class="article-body">${article}</div><aside class="side-consult"><strong>관련 상담</strong><p>골프 일정과 숙소·차량을 함께 확인해드립니다.</p><a class="side-link" href="${relatedUrl}">${post.category} 자료 보기 →</a><button class="button button-block js-consult" type="button" data-interest="${escapeHtml(post.title)} 관련 상담">상담하기</button></aside></div>`;
  const schema = [{
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.modified || site.lastUpdated,
    author: { "@id": `${site.siteUrl}/#organization` },
    publisher: { "@id": `${site.siteUrl}/#organization` },
    mainEntityOfPage: `${site.siteUrl}/blog/${post.file}`,
    image: `${site.siteUrl}/assets/blog/${post.cover}`,
    inLanguage: "ko-KR",
  }, breadcrumbSchema([
    ["홈", "/"],
    ["골프·숙소 정보", "/blog"],
    [post.title, `/blog/${post.file}`],
  ]), ...(post.faq?.length ? [{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }] : [])];
  return layout({ title: post.title, description: post.description, pathname: `/blog/${post.file}`, active: "blog", image: `blog/${post.cover}`, schema, content, pageType: "article", publishedTime: post.date, modifiedTime: post.modified || site.lastUpdated, keywords: post.keywords });
}

function notFoundPage() {
  const content = `<section class="page-hero error-page"><div class="shell"><p class="eyebrow">404 ERROR</p><h1>페이지를 찾을 수 없습니다</h1><p>주소가 변경됐거나 존재하지 않는 페이지입니다. 골프장 목록으로 이동하거나 바로 상담할 수 있습니다.</p><div class="hero-actions"><a class="button" href="/golf">베트남 골프장 보기</a><button class="button button-outline js-consult" type="button" data-interest="페이지를 찾지 못한 고객 상담">상담하기</button></div></div></section>`;
  return layout({ title: "페이지를 찾을 수 없습니다", description: "요청한 페이지를 찾을 수 없습니다. 신짜오골프 주요 메뉴를 이용해 주세요.", pathname: "/404.html", content, robots: "noindex,nofollow" });
}

function trustPage({ title, description, pathname, content }) {
  return layout({
    title,
    description,
    pathname,
    schema: [breadcrumbSchema([["홈", "/"], [title, pathname]])],
    content: `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><span aria-current="page">${escapeHtml(title)}</span></nav><article class="section shell compact-copy"><p class="eyebrow">XIN CHAO GOLF</p><h1>${escapeHtml(title)}</h1>${content}</article>`,
  });
}

async function write(relativePath, html) {
  const target = path.join(dist, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

// llms.txt (llmstxt.org 형식): 사이트맵 주소 목록과 dist에 쓴 각 페이지의 <title>·설명으로 만든다.
async function llmsTxt(urls) {
  const decode = (value) => value.replaceAll("&quot;", '"').replaceAll("&#039;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
  const fileFor = (url) => url === "/" ? "index.html" : url.endsWith(".html") ? url.slice(1) : `${url.slice(1)}/index.html`;
  const pages = await Promise.all(urls.map(async (url) => {
    const html = await readFile(path.join(dist, fileFor(url)), "utf8");
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] || url).replace(new RegExp(`\\s*\\|\\s*${site.name}$`), "").trim();
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "").replace(/\s+/g, " ").trim();
    return { url, line: `- [${title}](${site.siteUrl}${url})${description ? `: ${description}` : ""}` };
  }));
  const core = ["/", "/golf", "/regions", "/services", "/guide", "/blog"];
  const groups = [
    ["핵심 페이지", (url) => core.includes(url)],
    ["주제별 모음", (url) => topicHubs.some((hub) => hub.path === url)],
    ["골프장", (url) => url.startsWith("/golf/")],
    ["지역별 골프장", (url) => url.startsWith("/regions/")],
    ["차량·숙소 서비스", (url) => /^\/services\/[^/]+\.html$/.test(url)],
    ["차량 렌트", (url) => url === "/rent" || url.startsWith("/rent/")],
    ["예약 가이드", (url) => url.startsWith("/guide/")],
    ["블로그", (url) => url.startsWith("/blog/")],
    ["운영 원칙", (url) => ["/about.html", "/editorial-policy.html", "/source-policy.html"].includes(url)],
  ];
  const sections = groups.map(([name, test]) => {
    const lines = pages.filter((page) => test(page.url)).map((page) => page.line);
    if (!lines.length) return "";
    return `## ${name}${name === "핵심 페이지" ? "" : ` (${lines.length}${name === "골프장" ? "곳" : "편"})`}\n\n${lines.join("\n")}\n\n`;
  }).join("");
  return `# ${site.name}\n\n> ${site.description}입니다. 베트남 골프장 ${courses.length}곳의 위치와 공항 이동시간을 비교하고, 골프장 예약·차량·숙소를 카카오톡으로 상담합니다.\n\n- 상담 채널: 카카오톡 ${site.kakaoUrl}\n- 지역: ${golfAreas.map((area) => area.name).join(", ")}\n- 홈페이지에서는 상품을 판매하거나 결제받지 않습니다.\n- 요금 구성: ${pricingSummary}\n- 티오프, 포함 항목, 휴장과 차량 가능 여부는 수시로 달라질 수 있어 상담으로 확인합니다.\n\n${sections}## Optional\n\n- [사이트맵](${site.siteUrl}/sitemap.xml): 전체 공개 페이지 목록과 마지막 수정일\n`;
}

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(path.join(root, "public"), dist, { recursive: true });
  await write("index.html", homePage());
  await write("golf/index.html", golfIndexPage());
  for (const course of courses) await write(`golf/${course.slug}.html`, courseDetailPage(course));
  await write("regions/index.html", regionsPage());
  await write("map/index.html", mapPage());
  for (const board of regionBoards) await write(`regions/${board.key}.html`, regionBoardPage(board));
  await write("services/index.html", servicesPage());
  await write("services/apartments.html", apartmentsPage());
  await write("services/villas.html", villasPage());
  await write("services/vehicle.html", vehiclePage());
  await write("airport/index.html", airportPage());
  await write("rent/index.html", rentHubPage());
  for (const page of rentPages) await write(`rent/${page.slug}.html`, rentSituationPage(page));
  for (const course of hcmCourses) await write(golfRentPath(course).slice(1), golfRentPage(course));
  await write("guide/index.html", guideIndexPage());
  for (const guide of guides) await write(`guide/${guide.slug}.html`, guidePage(guide));
  for (const hub of topicHubs) await write(`${hub.path.slice(1)}/index.html`, topicHubPage(hub));
  await write("blog/index.html", blogPage());
  for (const post of blogPosts) await write(`blog/${post.file}`, await blogPostPage(post));
  await write("about.html", trustPage({
    title: "신짜오골프 소개: 베트남 골프장 예약·차량·숙소 한국어 상담",
    description: "신짜오골프가 제공하는 베트남 골프장·차량·숙소 한국어 상담 범위와 운영 원칙을 안내합니다.",
    pathname: "/about.html",
    content: `<h2>한국어로 확인하는 베트남 골프 일정</h2><p>신짜오골프는 호치민을 중심으로 베트남 골프장 정보와 차량·숙소 준비 정보를 정리하고 한국어 상담으로 연결합니다.</p><h2>서비스 범위</h2><p>사이트의 정보는 후보를 비교하고 문의를 준비하기 위한 안내입니다. 티오프, 포함 항목과 이용 가능 여부는 날짜와 인원에 따라 달라질 수 있어 상담 시점에 다시 확인합니다.</p><h2 id="payment">결제 안내</h2><p>이 홈페이지 안에서는 상품을 판매하거나 결제를 받지 않습니다. 상담과 결제 안내는 공식 카카오톡 연결을 통해 진행합니다.</p>${pricingGuideHtml({ kakaoUrl: site.kakaoUrl })}`,
  }));
  await write("editorial-policy.html", trustPage({
    title: "편집 원칙",
    description: "신짜오골프가 골프장·숙소·차량 글을 쓸 때 지키는 작성 원칙과 사실 확인, 수정 요청 처리, 최신 정보 관리 방법을 안내합니다.",
    pathname: "/editorial-policy.html",
    content: "<h2>검색 질문에 먼저 답합니다</h2><p>각 글은 골프장 선택, 이동 동선, 예약 준비처럼 실제 고객 질문에 직접 답하도록 작성합니다. 같은 키워드를 반복해 분량을 늘리지 않습니다.</p><h2>확인되지 않은 경험은 쓰지 않습니다</h2><p>직접 확인하지 않은 체험을 실제 이용 후기처럼 표현하지 않으며, 변동 가능한 가격·티오프·운영 조건은 확정 사실처럼 안내하지 않습니다.</p><h2>수정과 최신성</h2><p>출처가 바뀌거나 운영 조건이 달라진 사실을 확인하면 해당 내용을 다시 검토합니다. 중요한 예약 조건은 게시 날짜와 무관하게 상담 시점에 재확인합니다.</p>",
  }));
  await write("source-policy.html", trustPage({
    title: "출처 원칙",
    description: "신짜오골프가 골프장·차량·숙소 정보를 어디서 확인하고 어떻게 표시하는지, 정보가 바뀌었을 때 고치는 기준을 안내합니다.",
    pathname: "/source-policy.html",
    content: "<h2>출처 우선순위</h2><p>골프장과 서비스 운영 주체가 제공하는 공식 안내처럼 원정보에 가까운 출처를 우선합니다. 제3자 자료는 비교와 발견을 돕는 보조 자료로 사용합니다.</p><h2>변동 정보</h2><p>가격, 티오프, 포함 항목, 휴장과 차량 가능 여부는 수시로 달라질 수 있습니다. 확인 시점이 오래됐거나 출처가 서로 다르면 확정 정보로 표시하지 않고 상담 시점에 다시 확인합니다.</p><h2>표시하지 않는 정보</h2><p>근거가 부족한 최저가, 보장되지 않은 예약 가능 여부, 검증되지 않은 평점과 후기는 구조화 데이터나 본문에 넣지 않습니다.</p>",
  }));
  await write("404.html", notFoundPage());

  for (const course of courses.filter((item) => item.legacy)) {
    await write(course.legacy, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/golf/${course.slug}.html"><link rel="canonical" href="${site.siteUrl}/golf/${course.slug}.html"><title>${course.name} 이동</title><a href="/golf/${course.slug}.html">${course.name} 새 페이지로 이동</a>`);
  }
  // 숙소 상세 19쪽과 그 옛 주소(apartment-detail_N·villa-detail_hcm_N)는 만들지 않는다. vercel redirects가 풀빌라 사이트로 바로 308.
  const legacyRedirects = {
    "home.html": "/",
    "golf.html": "/golf",
    "apartment.html": "/services/apartments.html",
    "villa.html": "/services/villas.html",
    "car-rental.html": "/services/vehicle.html",
    "blog.html": "/blog",
    ...Object.fromEntries(blogPosts.map((post) => [post.file, `/blog/${post.file}`])),
  };
  for (const [file, target] of Object.entries(legacyRedirects)) {
    await write(file, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${site.siteUrl}${target}"><title>신짜오골프 이동</title><a href="${target}">새 페이지로 이동</a>`);
  }

  const urls = [
    "/", "/golf", "/map", "/regions", ...regionBoards.map((board) => `/regions/${board.key}.html`), "/services", "/services/apartments.html", "/services/villas.html", "/services/vehicle.html", "/airport", "/rent", ...rentPages.map((page) => `/rent/${page.slug}.html`), ...hcmCourses.map(golfRentPath), "/blog", "/about.html", "/editorial-policy.html", "/source-policy.html",
    ...courses.map((course) => `/golf/${course.slug}.html`),
    ...blogPosts.map((post) => `/blog/${post.file}`),
    "/guide",
    ...topicHubs.map((hub) => hub.path),
    ...guides.map((guide) => `/guide/${guide.slug}.html`),
  ];
  const blogLastModified = new Map(blogPosts.map((post) => [`/blog/${post.file}`, post.modified || post.date]));
  for (const guide of guides) blogLastModified.set(`/guide/${guide.slug}.html`, guide.date);
  for (const hub of topicHubs) blogLastModified.set(hub.path, guides.filter((guide) => guide.category === hub.category).map((guide) => guide.date).sort().at(-1));
  for (const course of courses) blogLastModified.set(`/golf/${course.slug}.html`, courseGuides[course.slug].checkedAt);
  await writeFile(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${site.siteUrl}${url}</loc><lastmod>${blogLastModified.get(url) || site.lastUpdated}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  await writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
  await writeFile(path.join(dist, "llms.txt"), await llmsTxt(urls));
  // RSS 2.0 (네이버 서치어드바이저 RSS 제출용): 예약 가이드·블로그 글 중 최신 50개.
  const feedItems = [
    ...guides.map((guide) => ({ url: `/guide/${guide.slug}.html`, title: guide.title, description: guide.description, date: guide.date })),
    ...blogPosts.map((post) => ({ url: `/blog/${post.file}`, title: post.title, description: post.description, date: post.date })),
  ].filter((item) => urls.includes(item.url)).sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url)).slice(0, 50);
  const rssDate = (date) => new Date(`${String(date).slice(0, 10)}T09:00:00+07:00`).toUTCString();
  const rssItems = feedItems.map((item) => [
    "<item>",
    `<title>${escapeHtml(item.title)}</title>`,
    `<link>${site.siteUrl}${item.url}</link>`,
    `<guid isPermaLink="true">${site.siteUrl}${item.url}</guid>`,
    `<description>${escapeHtml(item.description)}</description>`,
    `<pubDate>${rssDate(item.date)}</pubDate>`,
    "</item>",
  ].join("\n"));
  await writeFile(path.join(dist, "rss.xml"), [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeHtml(site.name)}</title>`,
    `<link>${site.siteUrl}/</link>`,
    `<description>${escapeHtml(site.description)}</description>`,
    "<language>ko</language>",
    `<lastBuildDate>${rssDate(feedItems[0]?.date || site.lastUpdated)}</lastBuildDate>`,
    `<atom:link href="${site.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...rssItems,
    "</channel>",
    "</rss>",
    "",
  ].join("\n"));
  await writeFile(path.join(dist, "manifest.webmanifest"), `${JSON.stringify({
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f5138",
    icons: [
      { src: "/assets/images/xinchao-golf-logo-192.webp", sizes: "192x192", type: "image/webp" },
      { src: "/assets/images/xinchao-golf-logo-512.webp", sizes: "512x512", type: "image/webp" },
    ],
  }, null, 2)}\n`);

  // 옛 주소(xinchao-golf.vercel.app)로 온 요청은 같은 경로의 새 .com 주소로 308(2026-11-20 xinchaogolf.com 이전).
  // 구글·네이버 인증 파일과 IndexNow 키 파일은 옛 주소에서도 그대로 열리게 뺀다. 맨 앞에 둬야 다른 규칙보다 먼저 걸린다.
  const legacyHostRules = [{ type: "host", value: legacyHost }];
  const keepOnLegacyHost = ["google42ff51d2f339800e\\.html", "google9dfe2426ca118753\\.html", "naveracfd10be671c96cdfb93a6b8dadd8e45\\.html", "d5b83e4cf4084a38b2b71a6f9a62c7de\\.txt"];
  const redirects = [
    { source: "/", has: legacyHostRules, destination: `${site.siteUrl}/`, permanent: true },
    { source: `/:path((?!(?:${keepOnLegacyHost.join("|")})$).+)`, has: legacyHostRules, destination: `${site.siteUrl}/:path`, permanent: true },
    { source: "/golf/compare-regions", destination: "/regions", permanent: true },
    { source: "/blog/vietnam-golf-caddie-tip-checklist.html", destination: "/blog/hochiminh-golf-stay-selection-checklist.html", permanent: true },
    { source: "/vietnam-golf-caddie-tip-checklist.html", destination: "/blog/hochiminh-golf-stay-selection-checklist.html", permanent: true },
    ...Object.entries(legacyRedirects).map(([source, destination]) => ({ source: `/${source}`, destination, permanent: true })),
    ...courses.filter((course) => course.legacy).map((course) => ({ source: `/${course.legacy}`, destination: `/golf/${course.slug}.html`, permanent: true })),
    // 숙소 상세 19쪽(빌라 15·아파트 4)과 옛 주소 → 호치민풀빌라 최종 주소로 한 번에 308(골프 상세를 거치지 않음, 2026-11-20)
    ...[...apartments.map((item) => ["apartment", item]), ...villas.map((item) => ["villa", item])].flatMap(([type, item]) => [
      { source: `/services/${type}/${item.slug}.html`, destination: item.moved, permanent: true },
      { source: `/${item.legacy}`, destination: item.moved, permanent: true },
    ]),
    // 닫힌 골프 사이트 3곳의 골프장 상세 /golf/<지역>/<옛slug> → 새 상세 또는 지역 골프장 목록(대응표: src/legacy-golf-paths.mjs). 끝 / 는 trailingSlash:false가 먼저 떼고 308하므로 규칙은 / 없는 것 하나면 된다
    ...legacyGolfPaths.map((entry) => ({ source: `/golf/${entry.from}`, destination: legacyGolfDestination(entry), permanent: true })),
  ];
  if (redirects.length > 1024) throw new Error(`Vercel redirects 한도 1024개 초과: ${redirects.length}개`);
  const headers = [
    { source: "/assets/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    { source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] },
  ];
  const vercelConfig = {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    // 빌드 뒤 IndexNow 제출(운영 배포에서만, 실패해도 배포는 성공): scripts/indexnow.mjs
    buildCommand: "npm run build && (node scripts/indexnow.mjs --build || true)",
    outputDirectory: "dist",
    cleanUrls: false,
    trailingSlash: false,
    redirects,
    // /go/<코드> 상담 링크(00_운영본부/상담링크/make_go_pages.py가 public/go/<코드>.html 생성)
    // /zh/price: 위챗으로 보내는 중국어 가격 안내(public/zh/price.html, noindex·사이트맵 제외, 생성기 사업부/신짜오/사이트/도구/make_zh_price.py)
    rewrites: [{ source: "/go/:code", destination: "/go/:code.html" }, { source: "/zh/price", destination: "/zh/price.html" }],
    headers,
  };
  await writeFile(path.join(root, "vercel.json"), `${JSON.stringify(vercelConfig, null, 2)}\n`);
  const clientDirectory = path.join(dist, "client");
  await mkdir(clientDirectory, { recursive: true });
  for (const entry of await readdir(dist, { withFileTypes: true })) {
    if (["client", "server", ".openai"].includes(entry.name)) continue;
    await cp(path.join(dist, entry.name), path.join(clientDirectory, entry.name), { recursive: entry.isDirectory() });
  }
  await mkdir(path.join(dist, ".openai"), { recursive: true });
  await cp(path.join(root, ".openai", "hosting.json"), path.join(dist, ".openai", "hosting.json"));
  await mkdir(path.join(dist, "server"), { recursive: true });
  await writeFile(path.join(dist, "server", "index.js"), `const app = {\n  async fetch(request, env) {\n    if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {\n      return new Response("Static asset binding is unavailable.", { status: 503 });\n    }\n    let response = await env.ASSETS.fetch(request);\n    if (response.status === 404) {\n      const fallbackUrl = new URL(request.url);\n      fallbackUrl.pathname = \`/client\${fallbackUrl.pathname}\`;\n      response = await env.ASSETS.fetch(new Request(fallbackUrl, request));\n    }\n    return response;\n  },\n};\n\nexport default app;\n`);
}

await build();

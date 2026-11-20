import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarkdownPosts } from "./blog-content.mjs";
import { apartments, courses, golfAreas, legacyHost, poolvilla, regions, services, site, villas } from "./site-data.mjs";
import { courseFaqs, courseGuides } from "./course-guides.mjs";
import { coursesForGuide, hubForCategory, topicHubs } from "./topic-hubs.mjs";
import { legacyGolfDestination, legacyGolfPaths } from "./legacy-golf-paths.mjs";
import { pricingGuideHtml, pricingSummary } from "./pricing-guide.mjs";

const areaOf = (course) => golfAreas.find((area) => area.key === course.area);
const airportShort = (course) => (course.airport || areaOf(course).airport).replace(/\s*\(.*\)$/, "");
const courseVisual = (course, className, loading = "lazy") => course.image
  ? `<img src="/assets/images/${course.image}" width="1200" height="800" ${loading === "eager" ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} alt="${escapeHtml(course.name)} 골프장 전경">`
  : `<span class="course-plate ${className}" data-area="${course.area}" role="img" aria-label="${escapeHtml(course.name)} 안내 카드"><small>${escapeHtml(areaOf(course).name)}</small><strong>${escapeHtml(course.englishName)}</strong><em>✈ ${escapeHtml(airportShort(course))}에서 차량 약 ${escapeHtml(course.drive)}</em></span>`;
const relatedHref = (file) => file.startsWith("guide/") ? `/${file}` : `/blog/${file}`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const assetVersion = async (relative) => createHash("sha256")
  .update(await readFile(path.join(root, "public/assets", relative)))
  .digest("hex").slice(0, 12);
const styleVersion = await assetVersion("css/site.css");
const scriptVersion = await assetVersion("js/site.js");

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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="preload" as="style" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&display=swap" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&display=swap"></noscript>
    <link rel="stylesheet" href="/assets/css/site.css?v=${styleVersion}">
    ${schema.map(jsonLd).join("\n")}`;
}

function header(active = "") {
  const items = [
    ["golf", "/golf", "베트남 골프장"],
    ["regions", "/regions", "지역별 골프"],
    ["guide", "/guide", "예약 가이드"],
    ["services", "/services", "숙소·차량"],
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

function footer() {
  return `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div><strong>${site.name}</strong><p>베트남 골프장·차량·숙소 한국어 상담</p><p>상담 채널: 카카오톡 「신짜오베트남 골프예약」</p></div>
        <div><p>홈페이지에서는 상품을 판매하거나 결제받지 않습니다.</p><p><a href="/about.html">브랜드 소개</a> · <a href="/editorial-policy.html">편집 원칙</a> · <a href="/source-policy.html">출처 원칙</a></p><button class="text-button js-consult" type="button" data-interest="홈페이지 상담">카카오톡 상담하기 →</button></div>
      </div>
      <div class="shell copyright">© ${new Date().getFullYear()} ${site.englishName}. All rights reserved.</div>
    </footer>
    <button class="floating-consult js-consult" type="button" data-interest="빠른 상담" aria-label="카카오톡 빠른 상담">상담</button>
    <div class="mobile-cta-bar"><a class="mobile-cta-golf" href="/golf">골프장 ${courses.length}곳</a><button class="mobile-cta-kakao js-consult" type="button" data-interest="모바일 하단 상담">카카오톡 예약 문의</button></div>
    <script src="/assets/js/site.js?v=${scriptVersion}" defer></script>
    <script src="https://company-site-monitor.vercel.app/tracker.js?site=xinchao-golf" defer></script>`;
}

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
  const collectionPaths = ["/golf", "/regions", "/guide", "/services", "/services/apartments.html", "/services/villas.html", "/blog", ...topicHubs.map((hub) => hub.path)];
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
  <body class="${pathname === "/" ? "home-page" : ""}${pathname === "/golf" ? " golf-index-page" : ""}">${header(active)}<main id="main">${content}</main>${footer()}</body>
</html>`);
}

function courseCard(course) {
  return `
    <article class="course-card">
      <a class="card-image" href="/golf/${course.slug}.html" aria-label="${escapeHtml(course.name)} 상세보기">
        ${courseVisual(course, "course-plate-card")}
        <span class="card-badges"><span>${escapeHtml(course.holes.split(" ")[0])}</span><span>공항에서 ${escapeHtml(course.drive)}</span></span>
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
      <div class="hero-slides" aria-hidden="true"><span class="hero-slide" style="--hero-img:url('/assets/images/courses/golf-novaworld-phan-thiet-golf.webp')"></span><span class="hero-slide" style="--hero-img:url('/assets/images/courses/golf-hoiana-shores-golf-club.webp')"></span><span class="hero-slide" style="--hero-img:url('/assets/images/courses/golf-ba-na-hills-golf-club.webp')"></span><span class="hero-slide" style="--hero-img:url('/assets/images/courses/golf-dalat-at-1200.webp')"></span></div>
      <div class="shell hero-x-inner">
        <p class="hero-x-kicker">XIN CHAO GOLF <span class="hero-x-kicker-ko">베트남의 골프를 가장 정확하게</span></p>
        <h1>베트남 골프장 예약,<br>카톡 한 번으로</h1>
        <p class="hero-x-lead">베트남 골프장 ${courses.length}곳의 위치와 공항 이동시간을 비교하고, 골프장 예약·차량·숙소를 카카오톡으로 한 번에 상담하세요.</p>
        <div class="hero-x-actions">
          <a class="button button-kakao button-lg" href="${site.kakaoUrl}" target="_blank" rel="noopener noreferrer">카카오톡으로 예약 문의</a>
          <a class="button button-glass button-lg" href="/golf">골프장 ${courses.length}곳 보기</a>
        </div>
        <ul class="hero-x-stats" aria-label="신짜오골프 안내 범위">
          <li><strong>${courses.length}곳</strong><span>베트남 골프장</span></li>
          <li><strong>${golfAreas.length}개 지역</strong><span>북부·중부·남부</span></li>
          <li><strong>공항 시간</strong><span>골프장마다 표시</span></li>
          <li><strong>한국어</strong><span>예약·차량·숙소 상담</span></li>
        </ul>
      </div>
    </section>
    <section class="area-strip" aria-label="지역별 골프장">
      <div class="shell">
        <div class="section-heading"><div><p class="eyebrow">어디로 가시나요?</p><h2>지역을 고르면 골프장과 공항 시간이 바로 나옵니다</h2></div><a class="text-link" href="/golf">전체 보기 →</a></div>
        <div class="area-tiles">${golfAreas.map((area) => `<a class="area-tile" href="/golf#area-${area.key}" style="--tile-img:url('/assets/images/${area.image}')"><span class="area-tile-count">${courses.filter((course) => course.area === area.key).length}곳</span><strong>${escapeHtml(area.name)}</strong><em>✈ ${escapeHtml(area.airport.replace(/\s*\(.*\)$/, ""))} 기준</em></a>`).join("")}</div>
      </div>
    </section>
    <section class="signature" aria-labelledby="signature-title">
      <div class="shell">
        <div class="section-heading"><div><p class="eyebrow">Signature Courses</p><h2 id="signature-title">한 번은 꼭 쳐봐야 할 베트남 대표 코스</h2></div><a class="text-link" href="/golf">${courses.length}곳 모두 보기 →</a></div>
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
    <section class="section shell pay-guide-section" id="pricing" aria-labelledby="pricing-title"><div class="section-heading"><div><p class="eyebrow">요금과 결제</p><h2 id="pricing-title">요금 구성·결제·변경/취소, 견적 받는 법</h2></div><a class="text-link" href="/golf-price">가격 확인 가이드 →</a></div>${pricingGuideHtml({ kakaoUrl: site.kakaoUrl })}</section>
    <section class="section shell home-faq" id="faq" aria-labelledby="faq-title"><div class="section-heading"><div><p class="eyebrow">자주 묻는 질문</p><h2 id="faq-title">예약 전에 많이 묻는 질문</h2></div><a class="text-link" href="/golf#airport-times">공항→골프장 시간표 →</a></div><dl class="home-faq-list">${faqs.map(([question, answer]) => `<div><dt>${escapeHtml(question)}</dt><dd>${escapeHtml(answer)}</dd></div>`).join("")}</dl></section>
    <section class="cta-section cta-photo" style="--hero-img:url('/assets/images/courses/golf-hoiana-shores-golf-club.webp')"><div class="shell cta-inner"><div><p class="eyebrow">날짜와 인원만 알려주세요</p><h2>베트남 어디든,<br>골프 일정부터 카톡으로 상담하세요</h2><p>골프장·티타임·공항 차량·숙소까지 한국어로 한 번에 맞춰 드립니다. 홈페이지에서는 결제하지 않습니다.</p></div><button class="button button-kakao button-lg js-consult" type="button" data-interest="베트남 골프 빠른 상담">카카오톡 예약 문의</button></div></section>`;
  return layout({
    title: "베트남 골프장 상담 전문 신짜오골프",
    description: "호치민·하노이·다낭·하롱·나트랑·달랏·푸꾸옥 베트남 골프장 정보와 공항 이동시간. 골프장 예약과 차량, 아파트, 풀빌라를 한국어로 한 번에 상담하세요.",
    pathname: "/",
    content: deferHomeBackgrounds(content),
    preloadImage: "/assets/images/courses/golf-novaworld-phan-thiet-golf.webp",
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
    <h3>예약 준비에 이어서 읽기</h3><ul>${related}</ul><p>${topicHubs.map((hub) => `<a href="${hub.path}">${escapeHtml(hub.title)}</a>`).join(" · ")} · <a href="/services/vehicle.html">골프장 왕복 차량 상담</a> · ${areaOf(course).board ? `<a href="/regions/${areaOf(course).board}.html">${escapeHtml(areaOf(course).name)} 골프 글 모음</a>` : `<a href="/regions">지역별 골프 글</a>`} · <a href="/golf#airport-times">공항→골프장 시간표</a></p>
    <aside class="course-sources" aria-label="공식 출처"><h3>공식 출처</h3><p>자료 확인: <time datetime="${guide.checkedAt}">${guide.checkedAt}</time></p><ul>${guide.sources.map(([title, url]) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></li>`).join("")}</ul><p>${escapeHtml(guide.sourceNote || "공식 안내를 기준으로 골프장 이름과 코스 구성을 정리했습니다. 요금·티타임과 당일 운영·교통은 상담 때 그날 기준으로 확인해 드립니다.")}</p><a href="/source-policy.html">정보 출처 원칙</a></aside>
  </section>`;
}

function courseDetailPage(course) {
  const guide = courseGuides[course.slug];
  const content = `
    <nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/golf">베트남 골프장</a><span>›</span><a href="/golf#area-${course.area}">${escapeHtml(areaOf(course).name)}</a><span>›</span><span aria-current="page">${course.shortName}</span></nav>
    <section class="detail-hero shell">
      <div class="detail-media">${courseVisual(course, "course-plate-detail", "eager")}${course.gallery?.length ? `<div class="detail-gallery" aria-label="${escapeHtml(course.name)} 사진">${course.gallery.map((file, index) => `<a href="/assets/images/${file}" target="_blank" rel="noopener"><img src="/assets/images/${file}" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(course.name)} 코스 사진 ${index + 2}"></a>`).join("")}</div>` : ""}</div>
      <div class="detail-summary"><p class="eyebrow">${course.region} 골프장</p><h1>${course.name}</h1><p class="english-name large">${course.englishName}</p><p class="detail-lead">${course.summary}</p><dl class="fact-list"><div><dt>지역</dt><dd>${course.location}</dd></div><div><dt>규모</dt><dd>${course.holes}</dd></div><div><dt>공항</dt><dd>${escapeHtml(course.airport || areaOf(course).airport)}에서 차량 약 ${escapeHtml(course.drive)}${course.driveKm ? ` (${escapeHtml(course.driveKm)})` : ""}</dd></div><div><dt>이동</dt><dd>${course.access}</dd></div></dl><p class="drive-note">공항 시간은 평소 교통 기준입니다. 출퇴근·주말·우천 시 더 걸릴 수 있습니다.</p><button class="button button-kakao button-block button-lg js-consult" type="button" data-interest="${course.name} 상담">카카오톡으로 예약 가능 날짜 묻기</button><ul class="detail-steps"><li>날짜·인원 보내기</li><li>티타임·조건 확인</li><li>확정 후 바우처</li></ul>${pricingGuideHtml({ variant: "compact" })}<small>홈페이지에서는 결제나 온라인 예약을 진행하지 않습니다.</small></div>
    </section>
    <section class="section shell detail-content">
      <article><p class="eyebrow">선택 포인트</p><h2>${course.shortName}, 이런 일정에 검토하세요</h2><ul class="point-list">${course.points.map((point) => `<li>${point}</li>`).join("")}</ul>${courseGuideContent(course, guide)}</article>
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
    ...(course.image ? { image: `${site.siteUrl}/assets/images/${course.image}` } : {}),
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
    title: `${course.name} 위치·공항 이동시간·예약 상담`,
    description: `${course.name}(${course.englishName}) 위치·규모와 ${airportShort(course)}에서 차량 약 ${course.drive} 이동 정보, 한국어 골프 일정 상담 안내.`,
    pathname: `/golf/${course.slug}.html`,
    active: "golf",
    ...(course.image ? { image: course.image } : {}),
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
  { key: "hochiminh", name: "호치민", lead: "호치민 시내와 동나이·빈즈엉·롱안·붕따우·호트람 골프장 예약, 일정, 이동 글을 모았습니다.", words: ["호치민", "롱탄", "송베", "동나이", "빈즈엉", "붕따우", "호트람", "탄손넛", "투득", "트윈도브", "롱안", "떠이닌", "에메랄드", "정산", "하모니", "블러프스", "레만", "웨스트레이크", "로얄롱안", "판티엣", "무이네", "쩌우득"] },
  { key: "hanoi", name: "하노이", lead: "하노이와 근교 골프장 예약, 단체 조편성, 공항·숙소 차량 연결 글을 모았습니다.", words: ["하노이", "하이퐁", "하롱", "도선", "찌린", "속선", "호아빈", "몬타나", "다이라이", "땀다오", "킹스아일랜드", "탄라인", "롱비엔", "스카이레이크", "반찌", "땀다오", "탐다오", "하롱"] },
  { key: "danang", name: "다낭·호이안", lead: "다낭·호이안 골프장 예약과 티오프 확인, 가족·단체 일정 글을 모았습니다.", words: ["다낭", "호이안", "호이아나", "몽고메리", "바나힐"] },
  { key: "nhatrang", name: "나트랑", lead: "나트랑·캄란 리조트 골프 예약과 일정 글을 모았습니다.", words: ["나트랑", "캄란"] },
  { key: "phuquoc", name: "푸꾸옥", lead: "푸꾸옥 골프 예약, 항공 도착과 티오프 연결, 포함 항목 확인 글을 모았습니다.", words: ["푸꾸옥"] },
  { key: "dalat", name: "달랏", lead: "달랏 골프장 예약과 일정 글을 모았습니다.", words: ["달랏"] },
];

function regionBoardItems(board) {
  const hit = (text) => board.words.some((word) => text.includes(word));
  const items = [
    ...guides.filter((guide) => hit(`${guide.title} ${guide.description}`)).map((guide) => ({ href: `/guide/${guide.slug}.html`, title: guide.title, text: guide.sub || guide.description, date: guide.date })),
    ...blogPosts.filter((post) => hit(`${post.title} ${post.description}`)).map((post) => ({ href: `/blog/${post.file}`, title: post.title, text: post.description, date: post.date })),
  ];
  return items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function regionBoardPage(board) {
  const items = regionBoardItems(board);
  const others = regionBoards.filter((item) => item.key !== board.key).map((item) => `<a class="button button-quiet" href="/regions/${item.key}.html">${item.name}</a>`).join("");
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/regions">지역별 골프</a><span>›</span><span aria-current="page">${board.name}</span></nav><section class="page-hero"><div class="shell"><p class="eyebrow">지역별 골프 게시판</p><h1>${board.name} 골프 예약·일정 안내</h1><p>${board.lead}</p><div class="guide-jump">${others}</div></div></section><section class="section shell"><section class="guide-group"><h2>${board.name} 골프 글 <span>${items.length}</span></h2>${items.length ? `<ul class="guide-list">${items.map((item) => `<li><a href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text || "")}</span></a></li>`).join("")}</ul>` : `<p>아직 이 지역 글을 준비 중입니다. 원하는 골프장과 날짜를 알려주시면 상담으로 먼저 안내해 드립니다.</p>`}</section></section><section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">${board.name} 골프 상담</p><h2>날짜·인원·희망 골프장을 알려주세요</h2><p>골프장 예약과 숙소·차량까지 일정에 맞춰 한 번에 안내해 드립니다.</p></div><button class="button js-consult" type="button" data-interest="${board.name} 골프 상담">${board.name} 골프 상담하기</button></div></section>`;
  return layout({ title: `${board.name} 골프 예약·일정 안내`, description: `${board.lead} 날짜·인원·희망 골프장을 알려주시면 골프장 예약과 숙소·차량까지 한국어로 상담합니다.`, pathname: `/regions/${board.key}.html`, active: "regions", content, schema: [breadcrumbSchema([["홈", "/"], ["지역별 골프", "/regions"], [board.name, `/regions/${board.key}.html`]])] });
}

function regionsPage() {
  const boardCards = regionBoards.map((board) => `<li><a href="/regions/${board.key}.html"><strong>${board.name} 골프 게시판 <em>${regionBoardItems(board).length}개 글</em></strong><span>${board.lead}</span></a></li>`).join("");
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">베트남 골프</p><h1>지역별 베트남 골프 상담</h1><p>호치민을 중심으로 하노이, 다낭·호이안, 나트랑, 푸꾸옥, 달랏 골프 일정도 상담합니다. 지역을 누르면 그 지역 골프 글만 모아 볼 수 있습니다.</p><div class="guide-jump">${regionBoards.map((board) => `<a class="button button-quiet" href="/regions/${board.key}.html">${board.name}</a>`).join("")}</div></div></section><section class="section shell"><section class="guide-group"><h2>지역별 골프 게시판</h2><ul class="guide-list">${boardCards}</ul></section><div class="region-list">${regions.map((region, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><p class="eyebrow">${region.emphasis}</p><h2>${region.name}</h2><p>${region.text}</p></div><button class="button button-quiet js-consult" type="button" data-interest="${region.name} 골프 상담">상담하기</button></article>`).join("")}</div></section>`;
  return layout({ title: "지역별 베트남 골프 상담", description: "호치민, 하노이, 다낭·호이안, 나트랑, 푸꾸옥, 달랏 지역별 골프장 예약과 일정 글을 모아 보고, 숙소·차량 연결까지 한국어로 상담합니다.", pathname: "/regions", active: "regions", content });
}

function servicesPage() {
  // 숙소(아파트·풀빌라) 목록은 자매 사이트 호치민풀빌라로 바로 연결(새 탭). 차량만 사이트 안 자료로 간다.
  const links = {
    apartment: `<a class="button" href="${poolvilla.apartmentList}" target="_blank" rel="noopener">${poolvilla.name}에서 아파트 보기</a>`,
    villa: `<a class="button" href="${poolvilla.villaList}" target="_blank" rel="noopener">${poolvilla.name}에서 풀빌라 보기</a>`,
    vehicle: `<a class="button" href="/services/vehicle.html">자료 보기</a>`,
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

function vehiclePage() {
  const options = [
    ["골프장 왕복", "호텔·아파트·풀빌라에서 골프장까지 일정에 맞춰 상담합니다."],
    ["공항 픽업·샌딩", "항공편 시간과 인원, 짐 수량에 맞는 차량을 확인합니다."],
    ["당일 전용 차량", "골프와 식사·관광 일정을 함께 이동할 때 상담합니다."],
    ["시외·장거리", "호치민에서 붕따우·호트람·무이네 등 장거리 이동을 확인합니다."],
  ];
  const vehicleTypes = [
    ["vehicle-7seat.webp", "7인승 (카니발급)", "2~3명과 골프백 2~3개. 공항 픽업과 골프장 왕복에 가장 많이 씁니다.", "흰색 7인승 카니발 차량 옆모습"],
    ["vehicle-16seat.webp", "16인승 밴", "4~8명 단체와 골프백·캐리어가 많을 때 짐 공간이 넉넉합니다.", "흰색 16인승 솔라티 밴"],
    ["vehicle-limousine.webp", "리무진 밴", "가죽 독립 좌석의 리무진 밴. 장거리 이동이나 붕따우·호트람 일정에 편합니다.", "리무진 밴 내부 가죽 독립 좌석"],
    ["vehicle-bus.webp", "대형 버스", "골프 모임·단체 행사처럼 인원이 많을 때 상담합니다.", "흰색 대형 관광버스 앞모습"],
  ];
  const content = `<section class="page-hero page-hero-photo" style="--hero-img:url('/assets/images/service-vehicle.webp')"><div class="shell"><p class="eyebrow">골프 차량</p><h1>호치민 골프 차량 상담</h1><p>4·7·16인승과 리무진 등 인원과 골프백 수량에 맞는 차량을 상담합니다.</p><button class="button js-consult" type="button" data-interest="호치민 골프 차량 상담">차량 상담하기</button></div></section><section class="section shell"><div class="option-grid">${options.map(([name, text]) => `<article><span>차량 서비스</span><h2>${name}</h2><p>${text}</p><button class="text-button js-consult" type="button" data-interest="${name} 차량 상담">상담하기 →</button></article>`).join("")}</div></section><section class="section section-tint"><div class="shell"><div class="section-heading"><div><p class="eyebrow">차량 종류</p><h2>인원과 골프백에 맞춰 고르세요</h2></div></div><div class="vehicle-grid">${vehicleTypes.map(([img, name, text, alt]) => `<article class="vehicle-card"><img src="/assets/images/${img}" width="1200" height="900" loading="lazy" decoding="async" alt="${alt}"><div><h3>${name}</h3><p>${text}</p></div></article>`).join("")}</div><p class="vehicle-note">사진은 차량 종류 예시입니다. 실제 배정 차량은 날짜와 인원에 따라 달라질 수 있습니다.</p></div></section><section class="section"><div class="shell compact-copy"><p class="eyebrow">상담 전에 확인</p><h2>인원뿐 아니라 골프백 수량도 중요합니다</h2><p>이용 날짜, 탑승 인원, 골프백과 캐리어 수량, 출발지와 도착지를 알려주시면 차량 확인이 빨라집니다.</p></div></section>`;
  return layout({ title: "호치민 골프 차량 상담", description: "호치민 골프장 왕복, 공항 픽업, 당일 전용, 시외 이동 차량을 인원과 골프백 수에 맞춰 한국어로 상담합니다.", pathname: "/services/vehicle.html", active: "services", image: "service-vehicle.webp", content });
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
  for (const board of regionBoards) await write(`regions/${board.key}.html`, regionBoardPage(board));
  await write("services/index.html", servicesPage());
  await write("services/apartments.html", apartmentsPage());
  await write("services/villas.html", villasPage());
  await write("services/vehicle.html", vehiclePage());
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
    "/", "/golf", "/regions", ...regionBoards.map((board) => `/regions/${board.key}.html`), "/services", "/services/apartments.html", "/services/villas.html", "/services/vehicle.html", "/blog", "/about.html", "/editorial-policy.html", "/source-policy.html",
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
    buildCommand: "npm run build",
    outputDirectory: "dist",
    cleanUrls: false,
    trailingSlash: false,
    redirects,
    // /go/<코드> 상담 링크(00_운영본부/상담링크/make_go_pages.py가 public/go/<코드>.html 생성)
    rewrites: [{ source: "/go/:code", destination: "/go/:code.html" }],
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

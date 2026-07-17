import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarkdownPosts } from "./blog-content.mjs";
import { apartments, courses, regions, services, site, villas } from "./site-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const legacyBlogPosts = [
  {
    file: "ho-chi-minh-4-room-pool-villa-guide.html",
    title: "호치민 4룸 풀빌라 예약 전 확인사항",
    description: "호치민 4룸 풀빌라를 알아볼 때 확인해야 할 임시 거주자 등록, 숙소 구조와 상담 안내.",
    category: "풀빌라",
    date: "2025-12-18",
    cover: "18_12_1/1 (1).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-8-room-pool-villa-guide.html",
    title: "호치민 8룸 꿈 풀빌라 안내",
    description: "호치민 단체여행을 위한 8룸 꿈 풀빌라 공간 구성과 예약 전 확인사항.",
    category: "풀빌라",
    date: "2025-12-18",
    cover: "18_12_2/1 (7).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-lexington-apartment-guide.html",
    title: "호치민 렉싱턴 아파트 안내",
    description: "호치민 2군 렉싱턴 아파트의 객실 구성과 체류 전 확인사항.",
    category: "아파트",
    date: "2025-12-18",
    cover: "19_12_2/p1 (1).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-the-sun-avenue-q2-apartment-guide.html",
    title: "호치민 더 썬 에비뉴 Q2 아파트 안내",
    description: "호치민 2군 더 썬 에비뉴 아파트 객실 유형과 체류 전 확인사항.",
    category: "아파트",
    date: "2025-12-18",
    cover: "19_12_1/tn (1).webp",
    sourceType: "legacy",
  },
  {
    file: "ho-chi-minh-y4-6-room-pool-villa.html",
    title: "호치민 Y4 6룸 풀빌라 안내",
    description: "타오디엔 Y4 6룸 풀빌라의 객실, 수영장과 단체여행 상담 안내.",
    category: "풀빌라",
    date: "2025-12-18",
    cover: "18_12_3/z7300994846764_e68cccb1267513b8c1f894d22df62f5d.webp",
    sourceType: "legacy",
  },
];

const markdownBlogPosts = await loadMarkdownPosts(path.join(root, "src/content/blog"));
const blogPosts = [...legacyBlogPosts, ...markdownBlogPosts].sort((a, b) => b.date.localeCompare(a.date));
const duplicatePostFiles = blogPosts.filter((post, index) => blogPosts.findIndex((item) => item.file === post.file) !== index);
if (duplicatePostFiles.length) throw new Error(`중복 블로그 주소: ${[...new Set(duplicatePostFiles.map((post) => post.file))].join(", ")}`);

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

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

function head({ title, description, pathname, image = "hero-golf.webp", schema = [], robots = "index,follow,max-image-preview:large", pageType = "website", publishedTime, modifiedTime, keywords = [] }) {
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
    <link rel="icon" href="/assets/images/xinchao-golf-logo-192.webp" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/images/xinchao-golf-logo-192.webp">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="stylesheet" href="/assets/css/site.css">
    ${schema.map(jsonLd).join("\n")}`;
}

function header(active = "") {
  const items = [
    ["golf", "/golf/", "호치민 골프"],
    ["regions", "/regions/", "지역별 골프"],
    ["services", "/services/", "숙소·차량"],
    ["blog", "/blog/", "골프정보"],
  ];
  return `
    <a class="skip-link" href="#main">본문 바로가기</a>
    <header class="site-header">
      <div class="shell header-inner">
        <a class="brand" href="/" aria-label="신짜오골프 홈">
          <span class="brand-mark" aria-hidden="true">XG</span>
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

function consultationDialog() {
  return `
    <dialog class="consult-dialog" id="consult-dialog" aria-labelledby="consult-title" aria-describedby="consult-description">
      <form method="dialog" class="dialog-close-row">
        <button class="icon-button" type="submit" value="cancel" aria-label="상담창 닫기">×</button>
      </form>
      <div class="dialog-body">
        <p class="eyebrow">빠른 상담</p>
        <h2 id="consult-title">필요한 내용만 알려주세요</h2>
        <p class="muted" id="consult-description">결제나 온라인 예약은 진행하지 않습니다. 입력 내용은 상담 메시지 작성에만 사용됩니다.</p>
        <form id="consult-form">
          <label>문의 내용<input id="consult-interest" name="interest" autocomplete="off" required></label>
          <div class="form-grid">
            <label>방문 예정일<input name="date" type="date"></label>
            <label>인원<input name="people" inputmode="numeric" placeholder="예: 4명"></label>
          </div>
          <label>추가 요청<textarea name="note" rows="3" placeholder="희망 티오프, 차량, 숙소 등"></textarea></label>
          <button class="button button-block" type="submit">문의 복사 후 카카오톡 열기</button>
          <p class="form-status" id="consult-status" aria-live="polite"></p>
        </form>
        <div class="consult-result" id="consult-result" hidden>
          <label for="consult-summary">전달할 문의 내용</label>
          <textarea id="consult-summary" rows="7" readonly></textarea>
          <div class="consult-result-actions">
            <button class="button button-outline" id="consult-copy" type="button">문의 다시 복사</button>
            <a class="button" id="consult-kakao" href="${site.kakaoUrl}" target="_blank" rel="noopener noreferrer">카카오톡 직접 열기</a>
          </div>
        </div>
      </div>
    </dialog>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div><strong>${site.name}</strong><p>베트남 골프장·차량·숙소 한국어 상담</p></div>
        <div><p>홈페이지에서는 상품을 판매하거나 결제받지 않습니다.</p><button class="text-button js-consult" type="button" data-interest="홈페이지 상담">카카오톡 상담하기 →</button></div>
      </div>
      <div class="shell copyright">© ${new Date().getFullYear()} ${site.englishName}. All rights reserved.</div>
    </footer>
    <button class="floating-consult js-consult" type="button" data-interest="빠른 상담" aria-label="카카오톡 빠른 상담">상담</button>
    ${consultationDialog()}
    <script>window.XINCHAO_KAKAO_URL=${JSON.stringify(site.kakaoUrl)};</script>
    <script src="/assets/js/site.js" defer></script>`;
}

function layout({ title, description, pathname, active, content, image, schema = [], robots, pageType, publishedTime, modifiedTime, keywords = [] }) {
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
  const pageSchema = pathname === "/" ? [organization, website, ...schema] : schema;
  return `<!doctype html>
<html lang="ko">
  <head>${head({ title, description, pathname, image, schema: pageSchema, robots, pageType, publishedTime, modifiedTime, keywords })}</head>
  <body>${header(active)}<main id="main">${content}</main>${footer()}</body>
</html>`;
}

function courseCard(course) {
  return `
    <article class="course-card">
      <a class="card-image" href="/golf/${course.slug}.html" aria-label="${escapeHtml(course.name)} 상세보기">
        <img src="/assets/images/${course.image}" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(course.name)} 골프장 전경">
      </a>
      <div class="card-body">
        <div class="card-meta"><span>${escapeHtml(course.region)}</span><span>${escapeHtml(course.holes)}</span></div>
        <h3><a href="/golf/${course.slug}.html">${escapeHtml(course.name)}</a></h3>
        <p class="english-name">${escapeHtml(course.englishName)}</p>
        <p>${escapeHtml(course.summary)}</p>
        <div class="card-actions">
          <a class="text-link" href="/golf/${course.slug}.html">정보 보기</a>
          <button class="button button-quiet js-consult" type="button" data-interest="${escapeHtml(course.name)} 상담">상담하기</button>
        </div>
      </div>
    </article>`;
}

function homePage() {
  const featured = courses.filter((course) => ["호치민", "호치민 근교", "동나이"].includes(course.region)).slice(0, 6);
  const content = `
    <section class="hero">
      <div class="shell hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">호치민 골프 상담 중심</p>
          <h1>베트남 골프장 예약,<br><span>현지 확인부터 정확하게</span></h1>
          <p class="hero-lead">호치민 골프장을 중심으로 일정에 맞는 차량과 숙소까지 한국어로 상담합니다.</p>
          <div class="hero-actions">
            <a class="button" href="/golf/">호치민 골프장 보기</a>
            <button class="button button-outline js-consult" type="button" data-interest="호치민 골프 일정 상담">일정 상담하기</button>
          </div>
          <ul class="trust-list" aria-label="상담 서비스 특징"><li>한국어 상담</li><li>현지 일정 확인</li><li>부킹 후 바우처 안내</li></ul>
        </div>
        <figure class="hero-media">
          <img src="/assets/images/hero-golf.webp" width="1600" height="914" fetchpriority="high" alt="베트남 호치민 골프장 풍경">
          <figcaption><strong>HO CHI MINH</strong><span>골프장·차량·숙소 상담</span></figcaption>
        </figure>
      </div>
    </section>
    <section class="quick-paths" aria-label="빠른 메뉴">
      <div class="shell quick-grid">
        <a href="/golf/"><strong>골프장 찾기</strong><span>호치민 중심 골프장 정보</span></a>
        <button class="js-consult" type="button" data-interest="골프 일정 상담"><strong>일정 상담</strong><span>날짜와 인원부터 간단히</span></button>
        <a href="/services/"><strong>차량·숙소</strong><span>골프 일정과 함께 상담</span></a>
      </div>
    </section>
    <section class="section shell">
      <div class="section-heading"><div><p class="eyebrow">가장 많이 찾는 지역</p><h2>호치민 골프장부터 확인하세요</h2></div><a class="text-link" href="/golf/">전체 골프장 보기 →</a></div>
      <div class="course-grid">${featured.map(courseCard).join("")}</div>
    </section>
    <section class="section section-tint">
      <div class="shell">
        <div class="section-heading"><div><p class="eyebrow">지역별 상담</p><h2>베트남 주요 골프 지역</h2></div></div>
        <div class="region-grid">${regions.map((region, index) => `<button class="region-card js-consult${index === 0 ? " primary" : ""}" type="button" data-interest="${region.name} 골프 상담"><span>${region.emphasis}</span><strong>${region.name}</strong><p>${region.text}</p><em>상담하기 →</em></button>`).join("")}</div>
      </div>
    </section>
    <section class="section shell">
      <div class="section-heading"><div><p class="eyebrow">함께 준비하기</p><h2>숙소와 차량도 따로 찾지 마세요</h2></div><a class="text-link" href="/services/">서비스 전체 보기 →</a></div>
      <div class="service-grid">${services.map((service) => `<article class="service-card"><img src="/assets/images/${service.image}" width="1200" height="700" loading="lazy" decoding="async" alt="${service.name} 상담"><div><h3>${service.name}</h3><p>${service.text}</p><button class="text-button js-consult" type="button" data-interest="${service.name} 상담">${service.name} 상담하기 →</button></div></article>`).join("")}</div>
    </section>
    <section class="section process-section"><div class="shell"><div class="section-heading"><div><p class="eyebrow">진행 과정</p><h2>상담부터 바우처까지</h2></div></div><ol class="process-list"><li><span>01</span><strong>일정 상담</strong><p>날짜·인원·희망 지역을 확인합니다.</p></li><li><span>02</span><strong>가능 여부 확인</strong><p>골프장과 차량·숙소 일정을 확인합니다.</p></li><li><span>03</span><strong>예약 진행</strong><p>안내된 조건을 확인한 뒤 예약을 진행합니다.</p></li><li><span>04</span><strong>바우처 안내</strong><p>부킹 완료 후 필요한 내용을 전달합니다.</p></li></ol></div></section>
    <section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">복잡하게 찾지 마세요</p><h2>호치민 골프 일정부터 상담해보세요</h2><p>홈페이지에서 결제하지 않습니다. 필요한 내용만 확인하고 상담으로 연결합니다.</p></div><button class="button button-light js-consult" type="button" data-interest="호치민 골프 빠른 상담">빠른 상담 시작</button></div></section>`;
  return layout({
    title: "베트남 골프장 상담 전문 신짜오골프",
    description: "호치민 골프장 중심 한국어 상담. 베트남 골프장 일정과 차량, 아파트, 풀빌라를 한 번에 상담하세요.",
    pathname: "/",
    content,
  });
}

function golfIndexPage() {
  const content = `
    <section class="page-hero"><div class="shell"><p class="eyebrow">HO CHI MINH GOLF</p><h1>호치민 골프장 안내</h1><p>호치민 도심과 근교 골프장을 비교하고, 원하는 골프장 페이지에서 바로 상담하세요.</p><button class="button js-consult" type="button" data-interest="호치민 골프장 추천 상담">골프장 추천받기</button></div></section>
    <section class="section shell">
      <div class="filter-bar" role="group" aria-label="골프장 지역 필터">
        <button class="filter-button is-active" type="button" data-filter="all">전체</button>
        ${[...new Set(courses.map((course) => course.region))].map((region) => `<button class="filter-button" type="button" data-filter="${region}">${region}</button>`).join("")}
      </div>
      <div class="course-grid course-grid-wide" id="course-list">${courses.map((course) => `<div data-region="${course.region}">${courseCard(course)}</div>`).join("")}</div>
    </section>
    <section class="notice-section"><div class="shell notice-grid"><strong>표시된 정보는 선택을 돕기 위한 안내입니다.</strong><p>티오프 가능 여부와 실제 조건은 날짜·인원에 따라 달라질 수 있으므로 상담 시 다시 확인합니다.</p><button class="button button-small js-consult" type="button" data-interest="골프장 가능 여부 확인">가능 여부 상담</button></div></section>`;
  return layout({
    title: "호치민 골프장 안내와 상담",
    description: "투득, 탄손넛, 트윈도브, 롱탄 등 호치민과 근교 골프장 정보를 비교하고 한국어로 상담하세요.",
    pathname: "/golf/",
    active: "golf",
    content,
  });
}

function courseDetailPage(course) {
  const content = `
    <nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/golf/">호치민 골프</a><span>›</span><span aria-current="page">${course.shortName}</span></nav>
    <section class="detail-hero shell">
      <div class="detail-media"><img src="/assets/images/${course.image}" width="1200" height="800" fetchpriority="high" alt="${course.name} 골프장 전경"></div>
      <div class="detail-summary"><p class="eyebrow">${course.region} 골프장</p><h1>${course.name}</h1><p class="english-name large">${course.englishName}</p><p class="detail-lead">${course.summary}</p><dl class="fact-list"><div><dt>지역</dt><dd>${course.location}</dd></div><div><dt>규모</dt><dd>${course.holes}</dd></div><div><dt>이동</dt><dd>${course.access}</dd></div></dl><button class="button button-block js-consult" type="button" data-interest="${course.name} 상담">이 골프장 상담하기</button><small>홈페이지에서는 결제나 온라인 예약을 진행하지 않습니다.</small></div>
    </section>
    <section class="section shell detail-content">
      <article><p class="eyebrow">선택 포인트</p><h2>${course.shortName}, 이런 일정에 검토하세요</h2><ul class="point-list">${course.points.map((point) => `<li>${point}</li>`).join("")}</ul><h2>상담 전에 알려주시면 좋은 내용</h2><p>희망 날짜, 인원, 선호 티오프 시간과 함께 차량·숙소 필요 여부를 알려주시면 일정 확인이 빨라집니다.</p></article>
      <aside class="side-consult"><strong>빠른 상담</strong><p>${course.shortName} 가능 여부와 이동 일정을 확인해드립니다.</p><button class="button button-block js-consult" type="button" data-interest="${course.name} 티오프 및 차량 상담">일정 확인하기</button></aside>
    </section>
    <section class="section section-tint"><div class="shell"><div class="section-heading"><div><p class="eyebrow">함께 보기</p><h2>다른 호치민 골프장</h2></div><a class="text-link" href="/golf/">전체 보기 →</a></div><div class="course-grid">${courses.filter((item) => item.slug !== course.slug).slice(0, 3).map(courseCard).join("")}</div></div></section>`;
  const schema = [{
    "@context": "https://schema.org",
    "@type": "GolfCourse",
    name: course.name,
    alternateName: course.englishName,
    description: course.summary,
    url: `${site.siteUrl}/golf/${course.slug}.html`,
    image: `${site.siteUrl}/assets/images/${course.image}`,
    address: { "@type": "PostalAddress", addressCountry: "VN", addressRegion: course.region },
    mainEntityOfPage: `${site.siteUrl}/golf/${course.slug}.html`,
  }, breadcrumbSchema([
    ["홈", "/"],
    ["호치민 골프", "/golf/"],
    [course.shortName, `/golf/${course.slug}.html`],
  ])];
  return layout({
    title: `${course.name} 정보와 상담`,
    description: `${course.name}(${course.englishName}) 위치, 규모, 이동 정보와 한국어 골프 일정 상담 안내.`,
    pathname: `/golf/${course.slug}.html`,
    active: "golf",
    image: course.image,
    schema,
    keywords: [
      course.name,
      `${course.name} 예약`,
      `${course.name} 가격`,
      `${course.name} 후기`,
      `${course.name} 위치`,
      `${course.name} 골프여행`,
      `${course.name} 티오프`,
      `${course.name} 한국인 예약`,
    ],
    content,
  });
}

function regionsPage() {
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">VIETNAM GOLF</p><h1>지역별 베트남 골프 상담</h1><p>호치민을 중심으로 하노이, 다낭, 나트랑, 푸꾸옥 일정도 상담합니다.</p></div></section><section class="section shell"><div class="region-list">${regions.map((region, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><p class="eyebrow">${region.emphasis}</p><h2>${region.name}</h2><p>${region.text}</p></div><button class="button button-quiet js-consult" type="button" data-interest="${region.name} 골프 상담">상담하기</button></article>`).join("")}</div></section>`;
  return layout({ title: "지역별 베트남 골프 상담", description: "호치민, 하노이, 다낭, 나트랑, 푸꾸옥 골프 일정 한국어 상담.", pathname: "/regions/", active: "regions", content });
}

function servicesPage() {
  const links = { apartment: "/services/apartments.html", villa: "/services/villas.html", vehicle: "/services/vehicle.html" };
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">STAY & TRANSPORT</p><h1>골프 숙소·차량 상담</h1><p>기존 아파트·풀빌라·차량 자료를 유지하고 골프 일정과 함께 상담합니다.</p></div></section><section class="section shell"><div class="service-list">${services.map((service) => `<article id="${service.slug}"><img src="/assets/images/${service.image}" width="1200" height="700" loading="lazy" decoding="async" alt="${service.name} 상담"><div><p class="eyebrow">연계 서비스</p><h2>${service.name}</h2><p>${service.text}</p><p class="muted">인원, 이용 날짜와 골프 일정을 알려주시면 적합한 조건을 함께 확인합니다.</p><div class="inline-actions"><a class="button" href="${links[service.slug]}">자료 보기</a><button class="button button-outline js-consult" type="button" data-interest="${service.name} 상담">상담하기</button></div></div></article>`).join("")}</div></section>`;
  return layout({ title: "호치민 골프 숙소와 차량 상담", description: "호치민 골프여행에 필요한 아파트, 풀빌라, 차량을 일정과 함께 한국어로 상담하세요.", pathname: "/services/", active: "services", content });
}

function propertyCard(item, type) {
  const href = `/services/${type}/${item.slug}.html`;
  const meta = type === "apartment" ? item.area : item.spec;
  return `<article class="property-card"><a href="${href}"><img src="/assets/images/${item.image}" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(item.name)}"></a><div><span>${escapeHtml(meta)}</span><h2><a href="${href}">${escapeHtml(item.name)}</a></h2>${item.englishName ? `<p class="english-name">${escapeHtml(item.englishName)}</p>` : ""}${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}<div class="card-actions"><a class="text-link" href="${href}">정보 보기</a><button class="button button-quiet js-consult" type="button" data-interest="${escapeHtml(item.name)} 상담">상담하기</button></div></div></article>`;
}

function apartmentsPage() {
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">APARTMENT</p><h1>호치민 아파트 안내</h1><p>골프 인원과 체류 일정에 맞춰 기존 아파트 자료를 확인하고 상담하세요.</p></div></section><section class="section shell"><div class="property-grid">${apartments.map((item) => propertyCard(item, "apartment")).join("")}</div></section>`;
  return layout({ title: "호치민 골프 아파트 안내", description: "빈홈 센트럴파크, 루미에르 리버사이드, 메트로폴 투티엠, 선라이즈 시티 아파트 상담.", pathname: "/services/apartments.html", active: "services", content });
}

function villasPage() {
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">POOL VILLA</p><h1>호치민 풀빌라 안내</h1><p>단체 골프여행 인원과 객실 수에 맞춰 기존 풀빌라 자료를 확인하고 상담하세요.</p></div></section><section class="section shell"><div class="property-grid">${villas.map((item) => propertyCard(item, "villa")).join("")}</div></section>`;
  return layout({ title: "호치민 골프 풀빌라 안내", description: "호치민 단체 골프여행을 위한 4룸부터 7룸 풀빌라 자료와 한국어 상담.", pathname: "/services/villas.html", active: "services", content });
}

function propertyDetailPage(item, type) {
  const isApartment = type === "apartment";
  const category = isApartment ? "아파트" : "풀빌라";
  const facts = isApartment
    ? [["지역", item.area], ["영문명", item.englishName], ["상담", "날짜·인원 확인 필요"]]
    : [["구성", item.spec], ["지역", "호치민"], ["상담", "날짜·인원 확인 필요"]];
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/services/">숙소·차량</a><span>›</span><span aria-current="page">${item.name}</span></nav><section class="detail-hero shell"><div class="detail-media"><img src="/assets/images/${item.image}" width="1200" height="800" fetchpriority="high" alt="${escapeHtml(item.name)}"></div><div class="detail-summary"><p class="eyebrow">호치민 ${category}</p><h1>${escapeHtml(item.name)}</h1>${item.englishName ? `<p class="english-name large">${escapeHtml(item.englishName)}</p>` : ""}<p class="detail-lead">${escapeHtml(item.text || `${item.spec} 구성의 호치민 풀빌라입니다. 골프 인원과 숙박 일정에 맞춰 상담합니다.`)}</p><dl class="fact-list">${facts.map(([key, value]) => `<div><dt>${key}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><button class="button button-block js-consult" type="button" data-interest="${escapeHtml(item.name)} 상담">이 숙소 상담하기</button><small>홈페이지에서는 결제나 온라인 예약을 진행하지 않습니다.</small></div></section><section class="section section-tint"><div class="shell compact-copy"><p class="eyebrow">상담 안내</p><h2>골프 일정과 함께 확인하세요</h2><p>숙소 가능 여부는 이용 날짜와 인원에 따라 달라집니다. 골프장, 차량, 공항 이동이 함께 필요하면 한 번에 알려주세요.</p><button class="button js-consult" type="button" data-interest="${escapeHtml(item.name)} 및 골프 일정 상담">일정 상담하기</button></div></section>`;
  const pathname = `/services/${type}/${item.slug}.html`;
  const schema = [breadcrumbSchema([
    ["홈", "/"],
    ["숙소·차량", "/services/"],
    [item.name, pathname],
  ])];
  return layout({ title: `${item.name} 골프여행 숙소 상담`, description: `${item.name} ${isApartment ? item.englishName : item.spec} 정보와 호치민 골프여행 숙소 한국어 상담.`, pathname, active: "services", image: item.image, schema, content });
}

function vehiclePage() {
  const options = [
    ["골프장 왕복", "호텔·아파트·풀빌라에서 골프장까지 일정에 맞춰 상담합니다."],
    ["공항 픽업·샌딩", "항공편 시간과 인원, 짐 수량에 맞는 차량을 확인합니다."],
    ["당일 전용 차량", "골프와 식사·관광 일정을 함께 이동할 때 상담합니다."],
    ["시외·장거리", "호치민에서 붕따우·호트람·무이네 등 장거리 이동을 확인합니다."],
  ];
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">GOLF TRANSPORT</p><h1>호치민 골프 차량 상담</h1><p>4·7·16인승과 리무진 등 인원과 골프백 수량에 맞는 차량을 상담합니다.</p><button class="button js-consult" type="button" data-interest="호치민 골프 차량 상담">차량 상담하기</button></div></section><section class="section shell"><div class="option-grid">${options.map(([name, text]) => `<article><span>차량 서비스</span><h2>${name}</h2><p>${text}</p><button class="text-button js-consult" type="button" data-interest="${name} 차량 상담">상담하기 →</button></article>`).join("")}</div></section><section class="section section-tint"><div class="shell compact-copy"><p class="eyebrow">상담 전에 확인</p><h2>인원뿐 아니라 골프백 수량도 중요합니다</h2><p>이용 날짜, 탑승 인원, 골프백과 캐리어 수량, 출발지와 도착지를 알려주시면 차량 확인이 빨라집니다.</p></div></section>`;
  return layout({ title: "호치민 골프 차량 상담", description: "호치민 골프장 왕복, 공항 픽업, 당일 전용, 시외 이동 차량 한국어 상담.", pathname: "/services/vehicle.html", active: "services", image: "service-vehicle.webp", content });
}

function blogPage() {
  const cards = blogPosts.map((post) => `<article class="post-card"><a href="/blog/${post.file}"><img src="/assets/blog/${post.cover}" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(post.title)}"></a><div><span>${post.category}</span><h2><a href="/blog/${post.file}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.description)}</p><a class="text-link" href="/blog/${post.file}">내용 보기 →</a></div></article>`).join("");
  const content = `<section class="page-hero"><div class="shell"><p class="eyebrow">GOLF & STAY GUIDE</p><h1>베트남 골프·숙소 정보</h1><p>기존 숙소 자료를 보존하면서 앞으로 골프장 선택과 일정 준비에 필요한 정보를 함께 정리합니다.</p></div></section><section class="section shell"><div class="post-grid">${cards}</div></section><section class="cta-section"><div class="shell cta-inner"><div><p class="eyebrow">찾는 정보가 없나요?</p><h2>날짜와 인원만 알려주세요</h2><p>골프장과 숙소·차량을 함께 확인합니다.</p></div><button class="button button-light js-consult" type="button" data-interest="골프 및 숙소 상담">상담하기</button></div></section>`;
  return layout({ title: "베트남 골프·숙소 정보", description: "호치민을 중심으로 베트남 골프장 선택, 풀빌라와 아파트 이용에 필요한 정보를 제공합니다.", pathname: "/blog/", active: "blog", content });
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
  const content = `<nav class="breadcrumb shell" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/blog/">골프·숙소 정보</a><span>›</span><span aria-current="page">${escapeHtml(post.title)}</span></nav><section class="article-hero shell"><p class="eyebrow">${post.category}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.description)}</p><div><time datetime="${post.date}">${post.date}</time><span>신짜오골프 편집부</span></div></section><div class="article-layout shell"><div class="article-body">${article}</div><aside class="side-consult"><strong>관련 상담</strong><p>골프 일정과 숙소·차량을 함께 확인해드립니다.</p><a class="side-link" href="${relatedUrl}">${post.category} 자료 보기 →</a><button class="button button-block js-consult" type="button" data-interest="${escapeHtml(post.title)} 관련 상담">상담하기</button></aside></div>`;
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
    ["골프·숙소 정보", "/blog/"],
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
  const content = `<section class="page-hero error-page"><div class="shell"><p class="eyebrow">404 ERROR</p><h1>페이지를 찾을 수 없습니다</h1><p>주소가 변경됐거나 존재하지 않는 페이지입니다. 골프장 목록으로 이동하거나 바로 상담할 수 있습니다.</p><div class="hero-actions"><a class="button" href="/golf/">호치민 골프장 보기</a><button class="button button-outline js-consult" type="button" data-interest="페이지를 찾지 못한 고객 상담">상담하기</button></div></div></section>`;
  return layout({ title: "페이지를 찾을 수 없습니다", description: "요청한 페이지를 찾을 수 없습니다. 신짜오골프 주요 메뉴를 이용해 주세요.", pathname: "/404.html", content, robots: "noindex,nofollow" });
}

async function write(relativePath, html) {
  const target = path.join(dist, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(path.join(root, "public"), dist, { recursive: true });
  await write("index.html", homePage());
  await write("golf/index.html", golfIndexPage());
  for (const course of courses) await write(`golf/${course.slug}.html`, courseDetailPage(course));
  await write("regions/index.html", regionsPage());
  await write("services/index.html", servicesPage());
  await write("services/apartments.html", apartmentsPage());
  await write("services/villas.html", villasPage());
  await write("services/vehicle.html", vehiclePage());
  for (const apartment of apartments) await write(`services/apartment/${apartment.slug}.html`, propertyDetailPage(apartment, "apartment"));
  for (const villa of villas) await write(`services/villa/${villa.slug}.html`, propertyDetailPage(villa, "villa"));
  await write("blog/index.html", blogPage());
  for (const post of blogPosts) await write(`blog/${post.file}`, await blogPostPage(post));
  await write("404.html", notFoundPage());

  for (const course of courses) {
    await write(course.legacy, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/golf/${course.slug}.html"><link rel="canonical" href="${site.siteUrl}/golf/${course.slug}.html"><title>${course.name} 이동</title><a href="/golf/${course.slug}.html">${course.name} 새 페이지로 이동</a>`);
  }
  for (const apartment of apartments) {
    await write(apartment.legacy, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/services/apartment/${apartment.slug}.html"><link rel="canonical" href="${site.siteUrl}/services/apartment/${apartment.slug}.html"><title>${apartment.name} 이동</title><a href="/services/apartment/${apartment.slug}.html">${apartment.name} 새 페이지로 이동</a>`);
  }
  for (const villa of villas) {
    await write(villa.legacy, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/services/villa/${villa.slug}.html"><link rel="canonical" href="${site.siteUrl}/services/villa/${villa.slug}.html"><title>${villa.name} 이동</title><a href="/services/villa/${villa.slug}.html">${villa.name} 새 페이지로 이동</a>`);
  }
  const legacyRedirects = {
    "home.html": "/",
    "golf.html": "/golf/",
    "apartment.html": "/services/apartments.html",
    "villa.html": "/services/villas.html",
    "car-rental.html": "/services/vehicle.html",
    "blog.html": "/blog/",
    ...Object.fromEntries(blogPosts.map((post) => [post.file, `/blog/${post.file}`])),
  };
  for (const [file, target] of Object.entries(legacyRedirects)) {
    await write(file, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${site.siteUrl}${target}"><title>신짜오골프 이동</title><a href="${target}">새 페이지로 이동</a>`);
  }

  const urls = [
    "/", "/golf/", "/regions/", "/services/", "/services/apartments.html", "/services/villas.html", "/services/vehicle.html", "/blog/",
    ...courses.map((course) => `/golf/${course.slug}.html`),
    ...apartments.map((item) => `/services/apartment/${item.slug}.html`),
    ...villas.map((item) => `/services/villa/${item.slug}.html`),
    ...blogPosts.map((post) => `/blog/${post.file}`),
  ];
  const blogLastModified = new Map(blogPosts.map((post) => [`/blog/${post.file}`, post.modified || post.date]));
  await writeFile(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${site.siteUrl}${url}</loc><lastmod>${blogLastModified.get(url) || site.lastUpdated}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  await writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
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

  const redirects = [
    ...Object.entries(legacyRedirects).map(([source, destination]) => ({ source: `/${source}`, destination, permanent: true })),
    ...courses.map((course) => ({ source: `/${course.legacy}`, destination: `/golf/${course.slug}.html`, permanent: true })),
    ...apartments.map((item) => ({ source: `/${item.legacy}`, destination: `/services/apartment/${item.slug}.html`, permanent: true })),
    ...villas.map((item) => ({ source: `/${item.legacy}`, destination: `/services/villa/${item.slug}.html`, permanent: true })),
  ];
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

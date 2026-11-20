(() => {
  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const menuButton = document.querySelector(".menu-button");
  const menu = document.querySelector(".site-nav");
  const homePrepForm = document.querySelector("#home-prep-form");
  const homePrepResult = document.querySelector("#home-prep-result");

  const closeMenu = () => {
    menu?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  };

  menuButton?.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      closeMenu();
      menuButton?.focus();
    }
  });

  // 상담 준비 요약을 클립보드에 복사한다. 안 되면 직접 복사하도록 안내한다.
  const copyStatus = document.querySelector("#home-prep-copy-status");
  const legacyCopy = (text) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    return ok;
  };
  const copyPrepSummary = async (text) => {
    if (!copyStatus) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; }
      else ok = legacyCopy(text);
    } catch { ok = legacyCopy(text); }
    copyStatus.textContent = ok
      ? "복사됐어요. 아래 버튼으로 카카오톡을 열고 붙여 넣으세요."
      : "자동 복사가 되지 않았어요. 위 요약을 길게 눌러 복사한 뒤 카카오톡에 붙여 넣어 주세요.";
  };

  homePrepForm?.addEventListener("input", () => { if (homePrepResult) homePrepResult.hidden = true; });
  homePrepForm?.addEventListener("change", () => { if (homePrepResult) homePrepResult.hidden = true; });
  homePrepForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(homePrepForm);
    const region = String(data.get("region") || "");
    const date = String(data.get("date") || "");
    const people = Number(data.get("people"));
    const purpose = String(data.get("purpose") || "");
    const regionOptions = [...homePrepForm.querySelectorAll('select[name="region"] option')].map((option) => option.value).filter(Boolean);
    if (!homePrepForm.reportValidity() || !regionOptions.includes(region) || !Number.isInteger(people) || people < 1 || people > 40) return;
    // 화면에 보이는 요약과 복사되는 문장을 같게 한다(복사가 안 되면 화면 요약을 직접 복사).
    const summaryText = `[신짜오골프 상담 준비] 희망 지역: ${region} / 날짜: ${date} / 인원: ${people}명 / 목적: ${purpose}`;
    document.querySelector("#home-prep-summary").textContent = summaryText;
    copyPrepSummary(summaryText);
    const lists = document.querySelectorAll("#home-prep-candidates ul[data-region]");
    let found = false;
    lists.forEach((list) => { list.hidden = list.dataset.region !== region; if (!list.hidden) found = true; });
    document.querySelector("#home-prep-candidates").hidden = !found;
    document.querySelector("#home-prep-other-region").hidden = found;
    if (homePrepResult) homePrepResult.hidden = false;
  });

  const filterButtons = document.querySelectorAll(".filter-button");
  const areaSections = document.querySelectorAll("#course-list > [data-area]");
  const applyFilter = (filter) => {
    filterButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.filter === filter));
    areaSections.forEach((section) => { section.hidden = filter !== "all" && section.dataset.area !== filter; });
  };
  filterButtons.forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  const hashArea = location.hash.match(/^#area-([a-z]+)$/)?.[1];
  if (hashArea && [...filterButtons].some((button) => button.dataset.filter === hashArea)) applyFilter(hashArea);

  // 홈 첫 화면 밖 배경 사진: 화면 가까이 오면 붙인다.
  const applyStyle = (element, key) => {
    const value = element.dataset[key];
    if (!value) return;
    const current = element.getAttribute("style");
    element.setAttribute("style", current ? `${current};${value}` : value);
    delete element.dataset[key];
  };
  const lazyBackgrounds = document.querySelectorAll("[data-lazy-style]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      applyStyle(entry.target, "lazyStyle");
    }), { rootMargin: "600px 0px" });
    lazyBackgrounds.forEach((element) => observer.observe(element));
  } else {
    lazyBackgrounds.forEach((element) => applyStyle(element, "lazyStyle"));
  }
  const applyDeferred = () => document.querySelectorAll("[data-deferred-style]").forEach((element) => applyStyle(element, "deferredStyle"));
  if (document.readyState === "complete") applyDeferred();
  else window.addEventListener("load", applyDeferred, { once: true });
})();

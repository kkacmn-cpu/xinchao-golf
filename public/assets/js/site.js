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

  // 빠른 견적 카드(골프 상세): 날짜·인원 칩 → 요약 복사 → /go/quick-golf(카톡). 11-21
  const qq = document.querySelector(".quick-quote");
  if (qq) {
    const state = { date: "", people: "", extras: new Set(), arrival: "" };
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}(${days[d.getDay()]})`;
    const base = new Date(); base.setHours(12, 0, 0, 0);
    const sat0 = new Date(base); sat0.setDate(base.getDate() + ((6 - base.getDay() + 7) % 7));
    const pick = { sat0, sun0: new Date(sat0.getTime() + 864e5), sat1: new Date(sat0.getTime() + 7 * 864e5) };
    const press = (group, btn) => { group.querySelectorAll(".qq-chip").forEach((c) => { if (!c.hasAttribute("data-extra") && !c.hasAttribute("data-arrival")) c.setAttribute("aria-pressed", String(c === btn)); }); };
    const dateInput = qq.querySelector(".qq-date");
    const peopleInput = qq.querySelector(".qq-people");
    const status = qq.querySelector(".qq-status");
    const arrivalBox = qq.querySelector(".qq-arrival");
    const arrivalResult = qq.querySelector(".qq-arrival-result");
    const driveMax = Number(qq.dataset.driveMax) || 0;
    const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const calcArrival = () => {
      const v = qq.querySelector(".qq-time").value;
      if (!v) { state.arrival = ""; arrivalResult.textContent = ""; return; }
      const [h, m] = v.split(":").map(Number);
      const tee = Math.ceil((h * 60 + m + 60 + driveMax + 20) / 10) * 10; // 입국·짐 60분 + 공항 최대 이동 + 접수 20분
      const text = tee <= 13 * 60 ? `도착일 18홀 가능해요: 티오프 ${hhmm(tee)} 이후로 잡으면 됩니다(추정).`
        : tee <= 14 * 60 + 30 ? `18홀은 빠듯해요: 티오프 ${hhmm(tee)} 이후, 9홀이나 다음 날을 권해요(추정).`
        : `도착일 라운드는 어려워요(티오프 ${hhmm(tee)} 이후). 다음 날 라운드를 권해요(추정).`;
      arrivalResult.textContent = `${qq.dataset.airport} ${v} 도착 기준 — ${text}`;
      state.arrival = `${v} 도착 → ${text}`;
    };
    qq.addEventListener("click", (event) => {
      const btn = event.target.closest(".qq-chip");
      if (!btn) return;
      const group = btn.closest(".qq-group");
      if (btn.dataset.date) { press(group, btn); dateInput.hidden = true; state.date = fmt(pick[btn.dataset.date]); }
      else if (btn.hasAttribute("data-date-pick")) { press(group, btn); dateInput.hidden = false; dateInput.focus(); state.date = dateInput.value ? fmt(new Date(dateInput.value + "T12:00")) : ""; }
      else if (btn.dataset.people) { press(group, btn); peopleInput.hidden = true; state.people = `${btn.dataset.people}명`; }
      else if (btn.hasAttribute("data-people-pick")) { press(group, btn); peopleInput.hidden = false; peopleInput.focus(); state.people = peopleInput.value ? `${peopleInput.value}명` : ""; }
      else if (btn.dataset.extra) { const on = btn.getAttribute("aria-pressed") !== "true"; btn.setAttribute("aria-pressed", String(on)); on ? state.extras.add(btn.dataset.extra) : state.extras.delete(btn.dataset.extra); }
      else if (btn.hasAttribute("data-arrival")) { const on = btn.getAttribute("aria-pressed") !== "true"; btn.setAttribute("aria-pressed", String(on)); arrivalBox.hidden = !on; if (on) qq.querySelector(".qq-time").focus(); else { state.arrival = ""; } }
      status.textContent = "";
    });
    dateInput.addEventListener("change", () => { state.date = dateInput.value ? fmt(new Date(dateInput.value + "T12:00")) : ""; });
    peopleInput.addEventListener("input", () => { state.people = peopleInput.value ? `${peopleInput.value}명` : ""; });
    qq.querySelector(".qq-time").addEventListener("input", calcArrival);
    qq.querySelector(".qq-send").addEventListener("click", async () => {
      if (!state.date || !state.people) { status.textContent = !state.date ? "날짜를 골라 주세요." : "인원을 골라 주세요."; return; }
      const lines = [
        "[신짜오골프 빠른 견적]",
        `골프장: ${qq.dataset.name}`,
        `날짜: ${state.date}`,
        `인원: ${state.people}`,
        ...(state.extras.size ? [`같이: ${[...state.extras].join(" · ")}`] : []),
        ...(state.arrival ? [`도착일: ${state.arrival}`] : []),
        `보낸 쪽: ${location.origin}${location.pathname}`,
        "이대로 보내 주시면 견적을 드립니다.",
      ];
      const text = lines.join("\n");
      let ok = false;
      try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } else ok = legacyCopy(text); } catch { ok = legacyCopy(text); }
      if (ok) {
        status.textContent = "요약이 복사됐어요. 카톡이 열리면 입력창을 길게 눌러 붙여넣고 보내 주세요.";
        setTimeout(() => { location.href = `/go/quick-golf?from=${encodeURIComponent(qq.dataset.slug)}`; }, 700);
      } else {
        const box = qq.querySelector(".qq-fallback"); box.hidden = false; box.value = text; box.select();
        status.innerHTML = '자동 복사가 안 됐어요. 위 요약을 길게 눌러 복사한 뒤 <a href="/go/quick-golf">카톡 열기</a>를 눌러 붙여넣어 주세요.';
      }
    });
  }
})();
// 상세 하단 "이 골프장으로 견적"(2026-11-22): 한 번 누르면 골프장 이름이 든 요약을 복사하고 카톡(/go/quick-golf)으로 간다.
document.querySelectorAll("[data-one-tap]").forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const text = `${link.dataset.oneTap}\n${location.href.split("#")[0]}`;
    try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text); } catch {}
    setTimeout(() => { location.href = link.href; }, 250);
  });
});

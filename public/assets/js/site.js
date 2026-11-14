(() => {
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
    document.querySelector("#home-prep-summary").textContent = `${region} · ${date} · ${people}명 · ${purpose}. 티오프와 예약 가능 여부는 상담 시 확인합니다.`;
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
})();

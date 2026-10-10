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
    if (!homePrepForm.reportValidity() || !["호치민", "하노이", "다낭", "나트랑", "푸꾸옥"].includes(region) || !Number.isInteger(people) || people < 1 || people > 40) return;
    document.querySelector("#home-prep-summary").textContent = `${region} · ${date} · ${people}명 · ${purpose}. 티오프와 예약 가능 여부는 상담 시 확인합니다.`;
    document.querySelector("#home-prep-candidates").hidden = region !== "호치민";
    document.querySelector("#home-prep-other-region").hidden = region === "호치민";
    if (homePrepResult) homePrepResult.hidden = false;
  });

  const filterButtons = document.querySelectorAll(".filter-button");
  const courseItems = document.querySelectorAll("#course-list > [data-region]");
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    const filter = button.dataset.filter;
    courseItems.forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.region !== filter;
    });
  }));
})();

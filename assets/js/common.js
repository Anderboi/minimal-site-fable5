/* минимал® — общий код для всех страниц */
(function () {
  "use strict";

  const M = (window.MINIMAL = window.MINIMAL || {});

  M.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  M.hasGsap = typeof window.gsap !== "undefined";
  M.isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (M.reducedMotion) document.documentElement.classList.add("reduced-motion");

  if (M.hasGsap) {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  }

  /* ---------- плавный скролл (Lenis) ---------- */
  M.lenis = null;
  if (typeof window.Lenis !== "undefined" && !M.reducedMotion && !M.isTouch) {
    M.lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    M.lenis.on("scroll", () => { if (M.hasGsap) ScrollTrigger.update(); });
    if (M.hasGsap) {
      gsap.ticker.add((t) => M.lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { M.lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- якорные ссылки ---------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-scroll]");
    if (!link) return;
    const hash = link.getAttribute("href");
    if (!hash || !hash.startsWith("#")) return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    document.body.classList.remove("menu-open");
    syncBurger();
    if (M.lenis) M.lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView({ behavior: M.reducedMotion ? "auto" : "smooth" });
  });

  /* ---------- бургер-меню ---------- */
  const burger = document.querySelector(".header__burger");
  function syncBurger() {
    if (!burger) return;
    const open = document.body.classList.contains("menu-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    document.querySelector(".menu")?.setAttribute("aria-hidden", String(!open));
  }
  burger?.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    syncBurger();
  });
  document.querySelectorAll(".menu a").forEach((a) =>
    a.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      syncBurger();
    })
  );

  /* ---------- кастомный курсор ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && M.hasGsap && !M.isTouch && !M.reducedMotion) {
    const label = cursor.querySelector(".cursor__label");
    const toX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const toY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    gsap.set(cursor, { opacity: 0 }); // не показываем точку, пока мышь не сдвинулась
    window.addEventListener("pointermove", (e) => {
      gsap.set(cursor, { opacity: 1 });
      toX(e.clientX); toY(e.clientY);
    });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) {
        label.textContent = t.dataset.cursor || "";
        cursor.classList.add("is-hover");
      }
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest("[data-cursor]")) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- данные проектов ---------- */
  let cache = null;
  M.loadProjects = async function () {
    if (cache) return cache;
    const res = await fetch("data/projects.json");
    if (!res.ok) throw new Error("projects.json: " + res.status);
    cache = (await res.json()).projects;
    return cache;
  };

  /* ---------- утилиты ---------- */
  M.pad2 = (n) => String(n + 1).padStart(2, "0");
  M.esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
})();

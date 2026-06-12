/* минимал® — общий код для всех страниц */
(function () {
  "use strict";

  const M = (window.MINIMAL = window.MINIMAL || {});

  M.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  M.hasGsap = typeof window.gsap !== "undefined";
  M.isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  M.anim = M.hasGsap && !M.reducedMotion;

  if (M.reducedMotion) document.documentElement.classList.add("reduced-motion");
  if (!M.anim) document.documentElement.classList.add("no-anim");

  if (M.hasGsap) gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* ---------- плавный скролл (Lenis) ---------- */
  M.lenis = null;
  if (typeof window.Lenis !== "undefined" && !M.reducedMotion && !M.isTouch) {
    M.lenis = new Lenis({ duration: 1.15, smoothWheel: true });
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

  /* ---------- курсор: точка + кольцо ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && M.anim && !M.isTouch) {
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    const label = cursor.querySelector(".cursor__label");
    gsap.set(cursor, { opacity: 0 });
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("pointermove", (e) => {
      gsap.set(cursor, { opacity: 1 });
      dx(e.clientX); dy(e.clientY);
      rx(e.clientX); ry(e.clientY);
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

  /* ---------- индикатор прокрутки ---------- */
  const progress = document.querySelector(".progress");
  if (progress && M.anim) {
    gsap.to(progress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 0.3 },
    });
  }

  /* ---------- разбиение текста ---------- */
  // каждую букву — в спан с маской (.ch > .ch__in)
  M.splitChars = function (el) {
    const text = el.textContent.replace(/­/g, "").trim();
    el.setAttribute("aria-label", el.getAttribute("aria-label") || text);
    el.innerHTML = [...text]
      .map((c) => (c === " " ? " " : `<span class="ch" aria-hidden="true"><span class="ch__in">${c}</span></span>`))
      .join("");
    return el.querySelectorAll(".ch__in");
  };

  // текст — на реальные строки (по позициям слов) с масками (.ln > .ln__in)
  M.splitLines = function (el) {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.innerHTML = text.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ");
    const words = [...el.querySelectorAll(".w")];
    const lines = [];
    let top = null, current = [];
    for (const w of words) {
      if (top === null || Math.abs(w.offsetTop - top) > 4) {
        if (current.length) lines.push(current);
        current = [];
        top = w.offsetTop;
      }
      current.push(w.textContent);
    }
    if (current.length) lines.push(current);
    el.innerHTML = lines
      .map((ws) => `<span class="ln"><span class="ln__in">${ws.join(" ")}</span></span>`)
      .join("");
    return el.querySelectorAll(".ln__in");
  };

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

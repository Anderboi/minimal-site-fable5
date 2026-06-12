/* минимал® — главная страница (v2) */
(function () {
  "use strict";
  const M = window.MINIMAL;

  // вертикальный режим проектов: тач, узкий экран или выключенные анимации
  const verticalProjects = () => !M.anim || M.isTouch || window.innerWidth < 1024;

  /* ---------- рендер карточек проектов ---------- */
  async function renderProjects() {
    const track = document.querySelector("[data-projects-track]");
    const outro = track.querySelector(".hpanel--outro");
    const countEl = document.querySelector("[data-projects-count]");
    try {
      const projects = await M.loadProjects();
      countEl.textContent = String(projects.length).padStart(2, "0");
      const rv = verticalProjects() ? " rv" : "";
      const html = projects
        .map(
          (p, i) => `
        <a class="hcard${rv}" href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="смотреть">
          <div class="hcard__media">
            <span class="hcard__index">${M.pad2(i)} / ${String(projects.length).padStart(2, "0")}</span>
            <img src="${M.esc(p.cover)}" alt="${M.esc(p.name)} — ${M.esc(p.type)}, ${M.esc(p.location)}" loading="${i < 2 ? "eager" : "lazy"}">
          </div>
          <h3 class="hcard__name">${M.esc(p.name)}<span class="serif">${M.esc(p.type.toLowerCase())}</span></h3>
          <p class="hcard__meta">${M.esc(p.location.split(",")[0])} — ${M.esc(p.area)} — ${M.esc(p.year)}</p>
        </a>`
        )
        .join("");
      outro.insertAdjacentHTML("beforebegin", html);
      return projects;
    } catch (err) {
      console.error(err);
      outro.insertAdjacentHTML(
        "beforebegin",
        '<p style="color:var(--smoke);max-width:30em">Не удалось загрузить проекты. Откройте сайт через локальный сервер, например: <code>npx serve</code></p>'
      );
      return [];
    }
  }

  /* ---------- прелоадер и интро hero ---------- */
  function intro() {
    const pre = document.querySelector(".preloader");
    const title = document.querySelector(".hero__title");
    const chars = M.hasGsap ? M.splitChars(title) : null;

    if (!M.anim) {
      pre?.remove();
      return;
    }

    gsap.set(chars, { yPercent: 112 });
    gsap.set(".hero__top, .hero__bottom", { opacity: 0, y: 14 });

    const words = pre.querySelectorAll(".preloader__words span");
    const countEl = pre.querySelector(".preloader__count");
    const count = { v: 0 };

    const tl = gsap.timeline();
    words.forEach((w, i) => {
      const last = i === words.length - 1;
      tl.fromTo(w, { opacity: 0, yPercent: 30 }, { opacity: 1, yPercent: 0, duration: 0.22, ease: "power2.out" }, i * 0.34);
      if (!last) tl.to(w, { opacity: 0, yPercent: -30, duration: 0.18, ease: "power2.in" }, i * 0.34 + 0.24);
    });
    tl.to(count, {
      v: 100,
      duration: words.length * 0.34 + 0.25,
      ease: "power2.inOut",
      onUpdate: () => (countEl.textContent = String(Math.round(count.v)).padStart(2, "0")),
    }, 0);
    tl.to(pre, {
      yPercent: -100,
      duration: 0.85,
      ease: "power4.inOut",
      onComplete: () => pre.remove(),
    }, "+=0.2");
    tl.to(chars, {
      yPercent: 0,
      duration: 1.15,
      stagger: { each: 0.045, from: "random" },
      ease: "power4.out",
    }, "-=0.4");
    tl.to(".hero__top, .hero__bottom", {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
    }, "-=0.7");

    // лёгкий параллакс hero при уходе вниз
    gsap.to(title, {
      yPercent: -16,
      opacity: 0.25,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "bottom bottom", end: "bottom 30%", scrub: true },
    });
  }

  /* ---------- горизонтальный скролл проектов ---------- */
  function horizontal() {
    if (verticalProjects()) return;
    const wrap = document.querySelector(".hscroll");
    const track = document.querySelector("[data-projects-track]");
    const dist = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: () => "+=" + dist(),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    gsap.to("[data-progress]", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: wrap, start: "top top", end: () => "+=" + dist(), scrub: 0.3 },
    });

    // параллакс внутри карточек, привязанный к горизонтальному движению
    document.querySelectorAll(".hcard__media img").forEach((img) => {
      gsap.fromTo(
        img,
        { xPercent: -5 },
        {
          xPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: img.closest(".hcard"),
            containerAnimation: tween,
            start: "left right",
            end: "right left",
            scrub: true,
          },
        }
      );
    });
  }

  /* ---------- студия: шлейф картинок за курсором ---------- */
  function imageTrail(projects) {
    if (!M.anim || M.isTouch || !projects.length) return;
    const zone = document.querySelector(".studio");
    const layer = document.querySelector(".studio__trail");
    const sources = projects.map((p) => p.cover);
    let last = { x: -1e4, y: -1e4 }, n = 0;

    zone.addEventListener("pointermove", (e) => {
      const r = zone.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (Math.hypot(x - last.x, y - last.y) < 130) return;
      last = { x, y };
      if (layer.children.length > 7) layer.firstChild.remove();

      const img = document.createElement("img");
      img.src = sources[n++ % sources.length];
      img.alt = "";
      layer.appendChild(img);
      gsap.set(img, { left: x, top: y, rotation: gsap.utils.random(-9, 9) });
      gsap.fromTo(
        img,
        { opacity: 0, scale: 0.55 },
        { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }
      );
      gsap.to(img, {
        opacity: 0, scale: 0.92, yPercent: 18,
        duration: 0.7, delay: 0.45, ease: "power2.in",
        onComplete: () => img.remove(),
      });
    });
  }

  /* ---------- аккордеон принципов ---------- */
  function accordion() {
    const items = document.querySelectorAll("[data-accordion] .acc__item");
    items.forEach((item) => {
      item.querySelector(".acc__head").addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        items.forEach((i) => {
          i.classList.remove("is-open");
          i.querySelector(".acc__head").setAttribute("aria-expanded", "false");
        });
        if (!open) {
          item.classList.add("is-open");
          item.querySelector(".acc__head").setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------- скролл-анимации ---------- */
  function scrollFx() {
    if (!M.anim) return;

    // построчные маски заголовков
    document.querySelectorAll("[data-lines]").forEach((el) => {
      const lines = M.splitLines(el);
      gsap.set(lines, { yPercent: 112 });
      gsap.to(lines, {
        yPercent: 0,
        duration: 1.1,
        stagger: 0.09,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 82%" },
      });
    });

    // гигантское «поговорим?» — побуквенно
    const word = document.querySelector(".contacts__word");
    if (word) {
      const chars = M.splitChars(word);
      gsap.set(chars, { yPercent: 112 });
      gsap.to(chars, {
        yPercent: 0,
        duration: 1,
        stagger: { each: 0.04, from: "center" },
        ease: "power4.out",
        scrollTrigger: { trigger: word, start: "top 85%" },
      });
    }

    // общие reveal-блоки
    document.querySelectorAll(".rv").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // счётчики
    document.querySelectorAll("[data-counter]").forEach((el) => {
      const target = parseInt(el.dataset.counter, 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.7, ease: "power2.out",
        onUpdate: () => (el.textContent = String(Math.round(obj.v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")),
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // тикер
    const ticker = document.querySelector(".ticker__track");
    if (ticker) gsap.to(ticker, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });

    ScrollTrigger.refresh();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    intro();
    const projects = await renderProjects();
    horizontal();
    imageTrail(projects);
    accordion();
    scrollFx();
  });
})();

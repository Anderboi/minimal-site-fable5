/* минимал® — главная страница */
(function () {
  "use strict";
  const M = window.MINIMAL;

  /* ---------- рендер списка проектов из JSON ---------- */
  async function renderProjects() {
    const list = document.querySelector("[data-projects-list]");
    const countEl = document.querySelector("[data-projects-count]");
    try {
      const projects = await M.loadProjects();
      countEl.textContent = "(" + String(projects.length).padStart(2, "0") + ")";
      list.innerHTML = projects
        .map(
          (p, i) => `
        <a class="pcard reveal" href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="смотреть">
          <div class="pcard__media"><img src="${M.esc(p.cover)}" alt="${M.esc(p.name)} — ${M.esc(p.type)}, ${M.esc(p.location)}" loading="${i < 2 ? "eager" : "lazy"}"></div>
          <div class="pcard__info">
            <span class="pcard__index">${M.pad2(i)}</span>
            <h3 class="pcard__name">${M.esc(p.name)}<i>${M.esc(p.type.toLowerCase())}</i></h3>
            <p class="pcard__meta">${M.esc(p.location.split(",")[0])} · ${M.esc(p.area)} · ${M.esc(p.year)}</p>
          </div>
        </a>`
        )
        .join("");
    } catch (err) {
      console.error(err);
      list.innerHTML =
        '<p style="color:var(--muted)">Не удалось загрузить проекты. Откройте сайт через локальный сервер, например: <code>npx serve</code></p>';
    }
  }

  /* ---------- прелоадер и интро ---------- */
  function intro() {
    const pre = document.querySelector(".preloader");
    if (!M.hasGsap || M.reducedMotion) {
      pre?.remove();
      document.querySelectorAll(".reveal").forEach((el) => el.classList.remove("reveal"));
      return;
    }

    const heroLines = document.querySelectorAll(".hero .hero__line > span");
    gsap.set(heroLines, { yPercent: 110 });

    const count = { v: 0 };
    const countEl = document.querySelector(".preloader__count");
    const tl = gsap.timeline();
    tl.to(count, {
      v: 100,
      duration: 1.1,
      ease: "power2.inOut",
      onUpdate: () => (countEl.textContent = String(Math.round(count.v)).padStart(2, "0")),
    })
      .to(pre, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.9,
        ease: "power4.inOut",
        onComplete: () => pre.remove(),
      }, "+=0.15")
      .to(heroLines, {
        yPercent: 0,
        duration: 1.2,
        stagger: 0.09,
        ease: "power4.out",
      }, "-=0.45")
      .from(".hero__eyebrow, .hero__meta", {
        opacity: 0,
        y: 16,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      }, "-=0.7");
  }

  /* ---------- скролл-анимации ---------- */
  function scrollFx() {
    if (!M.hasGsap || M.reducedMotion) return;

    // плавное появление карточек и блоков
    document.querySelectorAll(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // параллакс картинок в карточках
    document.querySelectorAll(".pcard__media img").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: img.closest(".pcard"), start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    // заголовки секций — лёгкий сдвиг
    document.querySelectorAll(".section__head").forEach((head) => {
      gsap.from(head, {
        opacity: 0,
        y: 32,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: head, start: "top 90%" },
      });
    });

    // манифест — проявление по словам
    const manifesto = document.querySelector("[data-split]");
    if (manifesto) {
      const words = manifesto.textContent.trim().split(/\s+/);
      manifesto.innerHTML = words.map((w) => `<span class="w">${M.esc(w)}</span>`).join(" ");
      gsap.from(manifesto.querySelectorAll(".w"), {
        opacity: 0.12,
        stagger: 0.02,
        ease: "none",
        scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 55%", scrub: true },
      });
    }

    // счётчики студии
    document.querySelectorAll("[data-counter]").forEach((el) => {
      const target = parseInt(el.dataset.counter, 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("ru-RU")),
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // бегущая строка
    const track = document.querySelector(".marquee__track");
    if (track) gsap.to(track, { xPercent: -50, duration: 22, ease: "none", repeat: -1 });

    // строки CTA в контактах
    document.querySelectorAll(".contacts__cta-line > span").forEach((line, i) => {
      gsap.from(line, {
        yPercent: 110,
        duration: 1.1,
        delay: i * 0.08,
        ease: "power4.out",
        scrollTrigger: { trigger: ".contacts__cta", start: "top 85%" },
      });
    });

    ScrollTrigger.refresh();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    intro();
    await renderProjects();
    scrollFx();
  });
})();

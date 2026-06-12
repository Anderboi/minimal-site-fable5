/* минимал® — страница проекта (наполняется из data/projects.json) */
(function () {
  "use strict";
  const M = window.MINIMAL;
  const esc = M.esc;

  function render(p, index, total, next) {
    document.title = p.name.toLowerCase() + " — минимал";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", `${p.name} — ${p.type.toLowerCase()}, ${p.location}, ${p.area}. ${p.tagline}`);

    const meta = [
      ["тип", p.type],
      ["место", p.location.split(",")[0]],
      ["год", p.year],
      ["площадь", p.area],
      ["срок", p.duration],
    ];

    return `
      <section class="phero">
        <p class="phero__kicker rv">проект ${M.pad2(index)} / ${String(total).padStart(2, "0")} — ${esc(p.type.toLowerCase())}</p>
        <h1 class="phero__title" data-chars>${esc(p.name)}</h1>
        <p class="phero__tagline rv">${esc(p.tagline)}</p>
        <ul class="phero__meta rv">
          ${meta.map(([k, v]) => `<li><span>${k}</span><b>${esc(v)}</b></li>`).join("")}
        </ul>
      </section>

      <figure class="pcover">
        <div class="pcover__frame"><img src="${esc(p.cover)}" alt="${esc(p.name)} — главное фото проекта"></div>
      </figure>

      <section class="pbody">
        <div class="pblock rv">
          <h2>задача</h2>
          <div><p>${esc(p.task)}</p></div>
        </div>
        <div class="pblock rv">
          <h2>решение</h2>
          <div>${p.description.map((par) => `<p>${esc(par)}</p>`).join("")}</div>
        </div>
      </section>

      <section class="pgallery">
        ${p.images
          .map(
            (src, i) =>
              `<figure class="rv"><img src="${esc(src)}" alt="${esc(p.name)} — фото ${i + 1}" loading="lazy"></figure>`
          )
          .join("")}
      </section>

      <section class="pfacts">
        ${p.facts.map((f) => `<div class="rv"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join("")}
      </section>

      <a class="pnext" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="перейти">
        <em>следующий проект</em>
        <b>${esc(next.name)}</b>
      </a>`;
  }

  function animate() {
    if (!M.anim) {
      document.querySelectorAll(".rv").forEach((el) => el.classList.remove("rv"));
      return;
    }

    const chars = M.splitChars(document.querySelector(".phero__title"));
    gsap.set(chars, { yPercent: 112 });
    gsap.to(chars, {
      yPercent: 0,
      duration: 1.15,
      stagger: { each: 0.05, from: "random" },
      ease: "power4.out",
      delay: 0.15,
    });

    document.querySelectorAll(".rv").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });

    // параллакс обложки и фотографий галереи
    document.querySelectorAll(".pcover img, .pgallery img").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -5, scale: 1.12 },
        {
          yPercent: 5,
          scale: 1.12,
          ease: "none",
          scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    ScrollTrigger.refresh();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.querySelector("[data-project-root]");
    const slug = new URLSearchParams(location.search).get("p");
    try {
      const projects = await M.loadProjects();
      const index = projects.findIndex((p) => p.slug === slug);
      if (index === -1) {
        location.replace("index.html#projects");
        return;
      }
      const next = projects[(index + 1) % projects.length];
      root.innerHTML = render(projects[index], index, projects.length, next);
      animate();
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      root.innerHTML =
        '<p class="project__loading">Не удалось загрузить проект. Откройте сайт через локальный сервер (например, <code>npx serve</code>).</p>';
    }
  });
})();

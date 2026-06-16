/* минимал® — лёгкий «фонарь» в hero: тёплый свет, плавно следующий за
   курсором. Только transform на одном слое (GPU), обновление не чаще одного
   раза за кадр — без перерисовки по пикселям, в отличие от прежнего шейдера.
   Отключается при reduced-motion и на тач-устройствах. */
(function () {
  "use strict";
  const M = window.MINIMAL || {};
  const hero = document.querySelector(".hero");
  const torch = hero && hero.querySelector(".hero__torch");
  if (!hero || !torch || M.reducedMotion || M.isTouch) return;

  // стартовая точка — верх-право, чтобы совпасть с ключевым светом
  let tx = window.innerWidth * 0.74, ty = window.innerHeight * 0.18;
  let x = tx, y = ty;
  let raf = null, lit = false;

  function loop() {
    // лёгкое сглаживание — свет «догоняет» курсор
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    torch.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null; // дошли до цели — останавливаемся, не жжём кадры
    }
  }
  function kick() { if (raf === null) raf = requestAnimationFrame(loop); }

  hero.addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!lit) { lit = true; hero.classList.add("is-lit"); }
    kick();
  });
  hero.addEventListener("pointerleave", () => {
    lit = false;
    hero.classList.remove("is-lit");
  });

  // первый кадр позиционирования
  torch.style.transform = `translate3d(${x}px, ${y}px, 0)`;
})();

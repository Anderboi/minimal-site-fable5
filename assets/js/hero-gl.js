/* минимал® — WebGL-фон hero: тёплый свет, медленно плывущий сквозь темноту.
   Чистый WebGL без зависимостей; при ошибке или reduced-motion остаётся
   статичный CSS-градиент под канвасом. */
(function () {
  "use strict";
  const M = window.MINIMAL || {};
  const canvas = document.querySelector(".hero__gl");
  if (!canvas || M.reducedMotion) return;

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const VERT = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

  const FRAG = `
    precision mediump float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.05 + vec2(13.7, 7.1);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 q = uv;
      q.x *= uRes.x / uRes.y;

      float t = uTime * 0.045;

      // диагональный луч, чуть реагирующий на мышь
      vec2 dir = normalize(vec2(0.78 + uMouse.x * 0.18, 0.62 + uMouse.y * 0.14));
      float band = dot(q - vec2(0.62, 0.85), vec2(-dir.y, dir.x));
      float beam = exp(-band * band * 5.5);

      // дым/пыль внутри луча
      float smoke = fbm(q * 2.1 + vec2(t * 0.8, -t * 0.5));
      smoke = smoothstep(0.25, 0.95, smoke);

      float light = beam * (0.4 + 0.75 * smoke);
      // второй, слабый широкий отсвет снизу
      float glow = exp(-pow(length(q - vec2(0.15, -0.1)) * 1.4, 2.0)) * 0.35
                 * (0.5 + 0.5 * fbm(q * 1.5 - vec2(t * 0.4, t * 0.3)));

      vec3 ink   = vec3(0.055, 0.051, 0.043);
      vec3 amber = vec3(0.79, 0.56, 0.32);
      vec3 ember = vec3(0.84, 0.29, 0.12);

      vec3 col = ink;
      col += amber * light * 0.85;
      col += ember * glow;

      // виньетка и зерно
      float vig = smoothstep(1.45, 0.45, length(uv - 0.5) * 1.6);
      col *= vig;
      col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.035;

      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");

  const dpr = Math.min(window.devicePixelRatio || 1, M.isTouch ? 1 : 1.5);
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (!M.isTouch) {
    window.addEventListener("pointermove", (e) => {
      tmx = (e.clientX / window.innerWidth) * 2 - 1;
      tmy = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  // рисуем только пока hero на экране и вкладка активна
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const start = performance.now();
  (function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  })(start);
})();

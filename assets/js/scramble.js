(function () {
  const canvas = document.getElementById("scramble");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const N = 61, R = 90, X0 = 30, TMAX = 30, V = 1;
  const PAD = { l: 44, r: 12, t: 16, b: 34 };
  const DURATION = 7000, HOLD = 1800;

  let gamma = 0, progress = 0, hold = 0, running = false, last = 0;
  let W = 0, H = 0;
  const col = {};

  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const noise = new Float32Array(N * R);
  for (let r = 0; r < R; r++) for (let c = 0; c < N; c++) noise[r * N + c] = 0.75 + 0.25 * hash(c, r);

  function erf(x) {
    const s = Math.sign(x); x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return s * (1 - poly * Math.exp(-x * x));
  }

  function intensity(c, r) {
    const t = (r / (R - 1)) * TMAX;
    const s = (Math.abs(c - X0) - V * t) / (0.9 * Math.sqrt(t + 1));
    const front = 0.5 * (1 - erf(s));
    const v = front * noise[r * N + c] * 0.75 + 0.35 * Math.exp(-s * s);
    return Math.min(1, v) * Math.exp(-gamma * t);
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    ["link", "fg", "muted", "border"].forEach((k) => (col[k] = cs.getPropertyValue("--" + k).trim()));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const px = PAD.l, py = PAD.t, pw = W - PAD.l - PAD.r, ph = H - PAD.t - PAD.b;
    const cw = pw / N, rh = ph / R;
    const rows = Math.min(R - 1, Math.floor(progress * R));

    ctx.fillStyle = col.link;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < N; c++) {
        const a = intensity(c, r);
        if (a < 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillRect(px + c * cw, py + r * rh, cw + 0.5, rh + 0.5);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = col.border; ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);

    // light cone
    const cx = px + (X0 + 0.5) * cw;
    ctx.setLineDash([5, 5]); ctx.strokeStyle = col.muted;
    ctx.beginPath();
    ctx.moveTo(cx, py); ctx.lineTo(cx - V * TMAX * cw, py + ph);
    ctx.moveTo(cx, py); ctx.lineTo(cx + V * TMAX * cw, py + ph);
    ctx.stroke();
    ctx.setLineDash([]);

    // scan line
    if (progress > 0 && progress < 1) {
      const y = py + progress * ph;
      ctx.strokeStyle = col.link; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // source marker + labels
    ctx.fillStyle = col.fg;
    ctx.beginPath(); ctx.arc(cx, py, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = col.muted;
    ctx.textAlign = "left";
    ctx.fillText("local perturbation", cx + 9, py + 13);
    ctx.textAlign = "center";
    ctx.fillText("lattice site j", px + pw / 2, H - 10);
    ctx.save();
    ctx.translate(14, py + ph / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText("time t →", 0, 0);
    ctx.restore();
  }

  function frame(ts) {
    if (!running) return;
    const dt = ts - last; last = ts;
    if (progress < 1) progress = Math.min(1, progress + dt / DURATION);
    else { hold += dt; if (hold > HOLD) { progress = 0; hold = 0; } }
    draw();
    requestAnimationFrame(frame);
  }
  const start = () => { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
  const stop = () => { running = false; };
  const replay = () => { progress = reduce ? 1 : 0; hold = 0; if (reduce) draw(); else start(); };

  // controls
  const buttons = document.querySelectorAll("[data-mode]");
  buttons.forEach((b) => b.addEventListener("click", () => {
    gamma = b.dataset.mode === "open" ? 0.09 : 0;
    buttons.forEach((x) => x.classList.toggle("active", x === b));
    replay();
  }));
  const rp = document.getElementById("replay");
  if (rp) rp.addEventListener("click", replay);

  window.addEventListener("themechange", () => { readColors(); draw(); });
  window.addEventListener("resize", resize);

  document.addEventListener("DOMContentLoaded", () => {
    readColors();
    if (reduce) progress = 1;
    resize();
    if ("IntersectionObserver" in window && !reduce) {
      new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { threshold: 0.2 }).observe(canvas);
    } else start();
  });
})();

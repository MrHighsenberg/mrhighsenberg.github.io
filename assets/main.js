(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = location.pathname.split("/").pop() || "index.html";

  const nav = (href, label) =>
    `<a href="${href}" class="${page === href ? "active" : ""}">${label}</a>`;
  const icon = (href, title, d) =>
    `<a href="${href}" title="${title}" aria-label="${title}" rel="noopener" ${href.startsWith("mailto") ? "" : 'target="_blank"'}><svg viewBox="0 0 24 24"><path fill="currentColor" d="${d}"/></svg></a>`;

  const header = `
  <header><div class="container nav">
    <div class="top-icons" aria-label="Quick links">
      ${icon("mailto:matthias.pawlik@tum.de", "Email", "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5")}
      ${icon("https://github.com/MrHighsenberg", "GitHub", "M12 .5A11.5 11.5 0 0 0 .5 12 11.5 11.5 0 0 0 8.36 22.93c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.39-3.87-1.39-.53-1.36-1.3-1.73-1.3-1.73-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.22 1.78 1.22 1.04 1.77 2.74 1.26 3.41.96.1-.77.4-1.26.72-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.19a11.1 11.1 0 0 1 5.83 0c2.22-1.5 3.2-1.19 3.2-1.19.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.42-2.7 5.41-5.27 5.69.41.36.76 1.07.76 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z")}
      ${icon("https://www.linkedin.com/in/matthias-pawlik", "LinkedIn", "M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.5 8.5h4V23h-4V8.5Zm8 0h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.75 2.63 4.75 6.05V23h-4v-6.5c0-1.55-.03-3.55-2.17-3.55-2.17 0-2.5 1.7-2.5 3.45V23h-4V8.5Z")}
    </div>
    <nav class="menu">
      ${nav("index.html", "Home")}
      ${nav("cv.html", "CV")}
      <button class="toggle" id="themeToggle" aria-label="Toggle night mode"></button>
    </nav>
  </div></header>`;

  const footer = `<footer><p>Design inspired by <a href="https://mauricedhanisch.github.io/" target="_blank" rel="noopener">mauricedhanisch.github.io</a></p></footer>`;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("afterbegin", header);
    document.body.insertAdjacentHTML("beforeend", footer);

    // Night mode
    const btn = document.getElementById("themeToggle");
    const sync = () => { btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙"; };
    sync();
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
      window.dispatchEvent(new Event("themechange"));
    });

    // Header shadow on scroll
    const hdr = document.querySelector("header");
    const onScroll = () => hdr.classList.toggle("scrolled", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Click to copy email
    const mail = document.getElementById("emailCopy");
    if (mail) mail.addEventListener("click", () => {
      const t = mail.textContent;
      navigator.clipboard.writeText(t).then(() => {
        mail.textContent = "Copied!";
        setTimeout(() => (mail.textContent = t), 1200);
      });
    });

    // Scroll reveal
    const items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.15 });
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("in"));
    }

    // Rotating keywords
    const rot = document.getElementById("rotator");
    if (rot && !reduce) {
      const words = JSON.parse(rot.dataset.words);
      let i = 0;
      setInterval(() => {
        rot.classList.add("out");
        setTimeout(() => { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove("out"); }, 350);
      }, 2800);
    }

    // Math (KaTeX)
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    }

    // CV: invert PDF in night mode
    const inv = document.getElementById("pdfInvert");
    if (inv) inv.addEventListener("click", () => {
      const on = document.querySelector(".pdf-wrap").classList.toggle("invert");
      inv.classList.toggle("active", on);
    });
  });
})();

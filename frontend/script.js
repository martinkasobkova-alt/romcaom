/* ============================================
   BEYOND LIMITS — Shared JS
   EN / CS — nav, footer, language switch
   ============================================ */

(function () {
  const activePage = document.body.dataset.page || "";
  const isCs = document.body.dataset.lang === "cs";

  const T = {
    en: {
      home: "Home",
      services: "Services",
      program: "40-Day Program",
      about: "About",
      pricing: "Pricing",
      blog: "Blog",
      contact: "Contact",
      footerH: "Let's connect",
      footerBtn: "Write to me",
      footerInfo:
        "Czech Republic · Worldwide online<br><strong>Email:</strong> beyondlimitscz@gmail.com<br><strong>Original blog:</strong> ",
      footerBottom: "Contact",
      formThanks: "Thank you! I will get back to you soon.",
    },
    cs: {
      home: "Úvod",
      services: "Služby",
      program: "Program 40 dní",
      about: "O mně",
      pricing: "Ceník",
      blog: "Blog",
      contact: "Kontakt",
      footerH: "Napište si",
      footerBtn: "Napište mi",
      footerInfo:
        "Česká republika · online po celém světě<br><strong>E-mail:</strong> beyondlimitscz@gmail.com<br><strong>Původní blog:</strong> ",
      footerBottom: "Kontakt",
      formThanks: "Děkujeme! Ozveme se vám v co nejkratší době (obvykle do 48 hodin).",
    },
  };
  const t = isCs ? T.cs : T.en;
  const lang = isCs ? "cs" : "en";

  function homeHref() {
    return isCs ? "/cs/" : "/";
  }

  function pageHref(name) {
    if (!name || name === "home" || name === "index.html") return homeHref();
    return isCs ? "/cs/" + name : "/" + name;
  }

  /** Same page, other language (preserve query) */
  function toEnglishPath() {
    const path = location.pathname;
    const q = location.search;
    if (!path.startsWith("/cs/") && path !== "/cs") return path + q;
    const rest = path.replace(/^\/cs\/?/, "");
    if (!rest) return "/" + q;
    return (rest.startsWith("blog/") && !rest.endsWith(".html")
      ? "/" + rest
      : "/" + rest) + q;
  }

  function toCzechPath() {
    const path = location.pathname;
    const q = location.search;
    if (path.startsWith("/cs/") || path === "/cs") return path + q;
    if (path === "/" || path === "/index.html") return "/cs/" + q;
    const p = path.startsWith("/") ? path : "/" + path;
    return "/cs" + p + q;
  }

  const switchEn = toEnglishPath();
  const switchCs = toCzechPath();

  const flagUk =
    isCs
      ? `<a href="${switchEn}" class="nav-lang__opt" title="English" hreflang="en" aria-label="English">` +
        `<span class="nav-lang__f" aria-hidden="true">` +
        `<svg class="nav-lang__svg" viewBox="0 0 60 40" width="24" height="16"><rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="6"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" stroke-width="3.5"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="8"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="5"/></svg></span>UK</a>`
      : `<span class="nav-lang__opt is-active" title="English" aria-current="true">` +
        `<span class="nav-lang__f" aria-hidden="true">` +
        `<svg class="nav-lang__svg" viewBox="0 0 60 40" width="24" height="16"><rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="6"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" stroke-width="3.5"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="8"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="5"/></svg></span>UK</span>`;

  const flagCz = !isCs
      ? `<a href="${switchCs}" class="nav-lang__opt" title="Čeština" hreflang="cs" aria-label="Čeština">` +
        `<span class="nav-lang__f" aria-hidden="true">` +
        `<svg class="nav-lang__svg" viewBox="0 0 60 40" width="24" height="16"><rect width="30" height="40" x="0" y="0" fill="#fff"/><rect width="30" height="40" x="30" y="0" fill="#D7141A"/><path d="M0 0 L60 0 L30 20 Z" fill="#11457E"/></svg></span>CS</a>`
      : `<span class="nav-lang__opt is-active" title="Čeština" aria-current="true">` +
        `<span class="nav-lang__f" aria-hidden="true">` +
        `<svg class="nav-lang__svg" viewBox="0 0 60 40" width="24" height="16"><rect width="30" height="40" x="0" y="0" fill="#fff"/><rect width="30" height="40" x="30" y="0" fill="#D7141A"/><path d="M0 0 L60 0 L30 20 Z" fill="#11457E"/></svg></span>CS</span>`;

  const nav = (active) => {
    const isHome = active === "home";
    const navClass = isHome
      ? "nav nav--on-hero"
      : "nav nav--subpage nav--scrolled";
    return `
    <nav class="${navClass}" id="siteNav" lang="${lang}">
      <div class="nav-inner">
        <a href="${homeHref()}" class="nav-logo">
          <span class="nav-logo-star" aria-hidden="true">✦</span>
          <span class="nav-logo-mark">Beyond Limits</span>
          <span class="nav-logo-sub">By Anuradha</span>
        </a>
        <ul class="nav-links" id="navLinks">
          <li><a href="${pageHref("home")}" ${active === "home" ? ' class="active"' : ""}>${t.home}</a></li>
          <li><a href="${pageHref("services.html")}" ${active === "services" ? ' class="active"' : ""}>${t.services}</a></li>
          <li><a href="${pageHref("program.html")}" class="nav-item-program${active === "program" ? " active" : ""}">${t.program}</a></li>
          <li><a href="${pageHref("about.html")}" ${active === "about" ? ' class="active"' : ""}>${t.about}</a></li>
          <li><a href="${pageHref("pricing.html")}" ${active === "pricing" ? ' class="active"' : ""}>${t.pricing}</a></li>
          <li><a href="${pageHref("blog.html")}" class="nav-blog${active === "blog" ? " active" : ""}">${t.blog}</a></li>
          <li><a href="${pageHref("contact.html")}" class="nav-cta">${t.contact}</a></li>
        </ul>
        <div class="nav-end">
        <div class="nav-lang" role="group" aria-label="${isCs ? "Jazyk" : "Language"}">
          ${flagUk}
          <span class="nav-lang__sep" aria-hidden="true">|</span>
          ${flagCz}
        </div>
        <button class="nav-burger" id="navBurger" type="button" aria-label="Menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        </div>
      </div>
    </nav>
  `;
  };

  const footer = () => `
    <footer class="footer" lang="${lang}">
      <div class="footer-content">
        <div class="footer-slab">
          <div class="footer-slab__brand">
            <a href="${homeHref()}" class="footer-logo-block">
              <span class="footer-logo-star" aria-hidden="true">✦</span>
              <span class="footer-logo-mark">Beyond Limits</span>
              <span class="footer-logo-sub">By Anuradha</span>
            </a>
            <p class="footer-tagline">${t.footerH}</p>
          </div>
          <div class="footer-slab__info footer-info">
            <strong>Romana Ezrová (Anuradha dasi)</strong><br>
            ${t.footerInfo}
            <a href="https://anuradha.blog" target="_blank" rel="noopener" class="footer-blog-link">anuradha.blog</a>
          </div>
          <div class="footer-slab__aside">
            <a href="${pageHref("contact.html")}" class="btn btn-primary btn-small footer-cta">${t.footerBtn}</a>
            <div class="footer-social">
              <a href="https://www.facebook.com/share/19h5EKDq7U/" aria-label="Facebook" target="_blank" rel="noopener">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/romanaanuradha_travel_art" aria-label="Instagram" target="_blank" rel="noopener">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://youtube.com/@romanaanuradhadasi3916" aria-label="YouTube" target="_blank" rel="noopener">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="mailto:beyondlimitscz@gmail.com" aria-label="Email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} Beyond Limits · Created with love by Romana Anuradha ·
      <a href="${pageHref("contact.html")}">${t.footerBottom}</a>
    </div>
  `;

  const navSlot = document.getElementById("nav-slot");
  const footerSlot = document.getElementById("footer-slot");
  if (navSlot) navSlot.innerHTML = nav(activePage);
  if (footerSlot) footerSlot.innerHTML = footer();

  const siteNav = document.getElementById("siteNav");
  if (siteNav && activePage === "home") {
    const onScroll = () => {
      if (window.scrollY > 40) {
        siteNav.classList.add("nav--scrolled");
      } else {
        siteNav.classList.remove("nav--scrolled");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const burger = document.getElementById("navBurger");
  const links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  requestAnimationFrame(() => {
    document.documentElement.classList.add("is-ready");
  });

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px",
      }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.classList.contains("newsletter-form") || form.classList.contains("contact-form")) {
      e.preventDefault();
      const thanks = form.querySelector(".form-thanks");
      if (thanks) {
        thanks.style.display = "block";
        form.querySelectorAll("input, textarea, button").forEach((el) => (el.disabled = true));
        if (thanks.dataset.msg) thanks.textContent = thanks.dataset.msg;
        else if (isCs) thanks.textContent = "✦ Děkujeme. Brzy vás budu kontaktovat (obvykle do 48 hodin).";
        else thanks.textContent = "✦ Thank you. I'll get back to you within 48 hours.";
      } else {
        alert(isCs ? t.formThanks : T.en.formThanks);
        form.reset();
      }
    }
  });
})();

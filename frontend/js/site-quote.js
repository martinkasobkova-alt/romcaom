/** Sdílený citát — footer, blog, O mně */
export const SITE_QUOTE_TEXT =
  "❤️ Love is infinite, Love is beyond any limit, and this is who you are, and when you identify yourself with that Love, you become that Love itself. ❤️";

export const SITE_QUOTE_AUTHOR = "Paramahamsa Vishwanada";

export function siteQuoteBlock({ tag = "blockquote", extraClass = "" } = {}) {
  const cls = ["site-quote", extraClass].filter(Boolean).join(" ");
  return `<${tag} class="${cls}">
    <p>${SITE_QUOTE_TEXT}</p>
    <cite>${SITE_QUOTE_AUTHOR}</cite>
  </${tag}>`;
}

export function siteQuoteSection() {
  return `<section class="site-quote-section reveal" aria-label="Quote">
    <div class="container">
      ${siteQuoteBlock()}
    </div>
  </section>`;
}

export function siteQuoteFooterBar() {
  return `<div class="site-quote-bar">
    ${siteQuoteBlock({ tag: "div", extraClass: "site-quote--footer" })}
  </div>`;
}

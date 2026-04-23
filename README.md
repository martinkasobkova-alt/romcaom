# Beyond Limits — Romana Anuradha

Static website built from authentic content from anuradha.blog.

**Struktura repa:** `frontend/` = HTML, CSS, JS, `vercel.json` (pro nasazení na Vercel). `backend/` = Node server (`server.mjs`), API, `data/`, `uploads/`. V kořeni spusťte `npm install` a pak `npm start` (Express servíruje i statiku z `frontend/`).

## Pages

```
/                  Home
/services.html     Services overview (Consultation, Meditation, Travel Guide)
/program.html      40-Day Beyond Limits Program
/about.html        Anuradha's story + Teacher's Assistant + 2 e-books
/pricing.html      All prices in one place
/blog.html         Latest writings (on-site from API) + anuradha.blog archive
/contact.html      Contact form
/admin.html        **Blog admin** (run `npm start` + see `BLOG-ADMIN.md`)
/post.html         Post shell (routed as `/blog/:slug` when using the Node server)
```

## Blog: admin + API (Node)

1. In the repo **root:** `npm install` and copy `backend/.env.example` → `backend/.env` (set `JWT_SECRET` and `ADMIN_PASSWORD_HASH` — see `BLOG-ADMIN.md` in Czech).
2. `npm start` → open [http://localhost:3000/admin.html](http://localhost:3000/admin.html) to log in and write posts (title, subtitle, body with bold/italic, hero image, gallery, uploads).
3. Data is stored in `backend/data/posts.json` and `backend/uploads/`.

**Static “python http.server” alone** will not load dynamic posts; you need the Node server (or a future hosted API).

## Adding a new blog post (legacy static template)

To add a hand-written static HTML file instead of using the admin:

- Copy `/blog/_template.html` (or adjust `welcome.html` pattern), add a card manually to `blog.html` if the API is not in use.

## Images

All images currently load directly from Romana's existing blog at:
- `https://anuradha.blog/wp-content/uploads/...`
- `https://beyondlimitscz-akptb.wordpress.com/wp-content/uploads/...`

This means images stay in sync with what Romana already manages on WordPress.

## DEPLOY (Vercel frontend + Render backend)

- **`frontend/`** = čistá statika (HTML/CSS/JS) — Vercel nesmí hledat Node `server.mjs` ani `package.json` s buildy (proto ve `frontend/` není `package.json`).
- **`backend/server.mjs`** = Express API, data, `uploads/` — Render nebo jiný Node host.

### Vercel (jen statický web)

1. Připojte GitHub repozitář a u projektu nastavte **Root Directory: `frontend`** (ne kořen monorepa — jinak Vercel prohlíží `package.json` v kořeni a může hledat neexistující entrypoint).
2. **Framework / Build:** „Other“ / „Other (Static)“. **Build Command** ponechte prázdné, nebo jeden řádek, který nic nedělá (když to UI dovolí) — není třeba `npm run build`.
3. **Output** / Install: bez výstupní složky mimo `frontend`; stačí, že prohlédnutý kořen deploye je právě `frontend/`.
4. V **`frontend/vercel.json`**: `cleanUrls`, `rewrites` (blog slugs + **proxy** `/api` a `/uploads` na váš **Render** URL). Oba řádku s `https://…onrender.com` doplňte o **přesnou** URL z Render dashboardu, commitněte, redeploy.
5. Volitelné: custom doména v nastavení projektu. Po nasazení přidejte tuto doménu do **`CORS_ORIGIN`** na Renderu (včetně `https://`).

### Render (Node backend)

1. New **Web Service** z tohoto repa, branch `main`.
2. **Root Directory** (Render): buď nechte **prázdné** a použijte příkazy z kořene, nebo nastavte **`backend`** a pak místo níže uvedených použijte v kořeni `backend` přístup; jednodušší je:
   - **Root Directory:** (prázdno) = celý monorepozitář
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`  
   (v kořeni `npm start` spouští workspace `backend` — viz `package.json` v rootu)
3. **Environment** (minimální): `JWT_SECRET`, `ADMIN_PASSWORD_HASH` (nebo pro vývoj `ADMIN_PASSWORD`), volitelně `PORT` (Render dává `PORT` sám).
4. **CORS** když blog na Vercelu volá API jinou cestou: nastavte `CORS_ORIGIN` na původ vašeho Vercel webu, např. `https://vase-domena.vercel.app` (u více domén víc hodnot oddělujte **čárkou**).
5. **Lokální prohlížeč mimo stejný port API** (např. jiný port než backend): můžete v `.env` na dev zkusit `CORS_ALLOW_LOCALHOST=1` a seznam původů doplňuje server pro porty 3000, 5173, 8000. Na produkčním Renderu to typicky nenechávejte zapnuté, pokud to nepotřebujete.
6. Po deploy ověřte `https://VÁŠ-RENDER-SERVICE.onrender.com/api/health` v prohlížeči (`ok: true`).

### Chování API z prohlížeče (shrnutí)

- **Doporučeno:** Nechejte `window.__ROMCA_API_BASE__` **nenastavené**; `frontend/js/api-config.js` volá **relativní** `/api/...`. Na Vercelu tomu odpovídá proxy v `vercel.json` na Render. Admin i blog tedy chodí na stejnou doménu, proxy přepošle na backend.
- **Alternativa:** Přímé volání Renderu z prohlížeče — v `admin.html` odkomentujte a nastavte `__ROMCA_API_BASE__` na `https://vas-backend.onrender.com` a na Renderu nalaďte `CORS_ORIGIN` na Vercel doménu (proxy v `vercel.json` pak můžete vypnout, pokud vše půjde přímo na API).

### Test čisté statiky lokálně (bez Node API)

```bash
cd frontend
python3 -m http.server 8000
# http://localhost:8000 — blog API bez backendu nenačte data
```

### Plný web + admin lokálně

V kořeni: `npm install`, `backend/.env`, pak `npm start` → otevřete `http://localhost:3000/admin.html`.

## Content sources (everything is real, from Romana's blog)

| Page | Source on anuradha.blog |
|---|---|
| About — story | /about-me |
| About — teacher's assistant | /asistent-pedagoga |
| About — e-books | /e-book-call-of-universe |
| Services — consultation | /consultation |
| Services — meditation 1:1 | /personal-meditation-sessions |
| Services — mentor / OM | /mentor-meditation |
| Services — travel | /about (Travel Guide) |
| Pricing — all numbers | /consultation + /personal-meditation-sessions |
| Blog cards | All articles on anuradha.blog |

## Pricing (current)

- 1:1 Guided meditation (60 min): **$39**
- 30-min grounding session: **$19**
- Monthly guidance package: **$101 / month**
- Personal consultation: **By inquiry**
- 40-day program: **By inquiry**
- E-book Call of Universe: **Free** (EN + CZ PDF)

To change prices, edit `pricing.html` and `services.html`.

## What to set up after deploy

1. **Contact form** → connect to [Formspree](https://formspree.io/) or [Web3Forms](https://web3forms.com/) so messages reach beyondlimitscz@gmail.com
2. **Newsletter form** → connect to Mailchimp / Buttondown / Substack
3. **Custom domain** → add in Vercel dashboard (e.g. beyondlimits.cz)
4. **Optional: download images** — currently loaded from anuradha.blog. For full independence, download them to `/images/` folder and update paths

## Colors & fonts

All in `styles.css` at the top under `:root`. Change once, updates everywhere.

- Lavender: `#E5D4F5`
- Sky blue: `#C9DEFC`
- Lime: `#D5F378` / `#C8F24A`
- Cream: `#F7F2EC`
- Display font: **Fraunces** (serif)
- Body font: **Inter Tight**

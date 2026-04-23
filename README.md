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

## Deploy on Vercel

The static site for Vercel lives under **`frontend/`**. Set **Root Directory** to `frontend` in the Vercel project so build picks up `frontend/vercel.json` and the HTML/CSS/JS.

### Via GitHub (recommended)
1. Push the repo to GitHub
2. Vercel.com → Add New Project → Import; set **Root Directory** = `frontend`
3. Framework Preset: "Other" (or leave default with `build` in `package.json` there)
4. Deploy

### Test locally
```bash
cd beyond-limits
python3 -m http.server 8000
# open http://localhost:8000
```

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

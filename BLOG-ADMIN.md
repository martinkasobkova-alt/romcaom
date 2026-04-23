# Blog — přihlášení a psaní článků

Na tomto webu je jednoduchá **administrace blogu** (jako pro jednoho autora / správce). Funguje přes **Node.js server** ve složce `backend/`, který ukládá články do `backend/data/posts.json` a nahrávané fotky do `backend/uploads/`.

## 1) První spuštění

1. Nainstalujte závislosti (jednou, v **kořeni** repozitáře — npm workspaces):

   ```bash
   cd cesta/k/projektu
   npm install
   ```

2. Vytvořte soubor **`backend/.env`** (zkopírujte z `backend/.env.example`):

   ```env
   PORT=3000
   JWT_SECRET=sem-dejte-dlouhy-nahodny-retezec
   ```

   **Heslo administrátorky** — volíte jeden ze způsobů:

   - **Doporučeno (produkc):** vytvořte **hash hesla** a vložte do `.env`:

     ```bash
     npm run hash-password -- "Vase_Silne_Heslo"
     ```

     Výstup vložte do:

     ```env
     ADMIN_PASSWORD_HASH=$2a$12$....
     ```

   - **Jen na zkoušku u sebe (ne pro produkci):** můžete v `.env` nastavit

     ```env
     ADMIN_PASSWORD=moje-heslo
     ```

3. Spusťte server:

   ```bash
   npm start
   ```

4. Otevřete v prohlížeči:

   - **Web:** [http://localhost:3000](http://localhost:3000)  
   - **Admin blogu:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

5. Přihlaste se zadaným heslem, pište články, ukládejte. Úvodní stránka blogu a články **vyžadují běžící server** (API u `/api/...`).

## 2) Co v editoru najdete

- **Titulek, podtitulek, rubrika** (zobrazí se v metadatech).
- **URL slug** (část adresy `/blog/vas-clanek`); můžete nechat doplnit z titulku.
- **Úvodní fotka** — náhled u článku a v seznamu.
- **Galerie** — více fotek (vhodné na cestování), zobrazí se pod textem.
- **Text** — píšete s formátováním: **tučné**, *kurzíva*, odstavce, nadpis H2, odkaz, obrázek vložený v textu (nahráním z počítače).
- **Publikováno** — pokud vypnete, článek uvidíte jen v administraci, ne ve veřejném seznamu.

Uložené **HTML** se vykreslí v článku — pište jen z této administrace (ne vkládejte cizí skripty z internetu).

## 3) Adresy článků

- Seznam: `/blog.html`
- Konkrétní článek: `/blog/např-welcome` (slug podle toho, co uvidíte v adminu a v `backend/data/posts.json`)

## 4) Nasazení na produkci (Vercel atd.)

- **Pouhé nahrání statických HTML na Vercel** nestačí — chybí API a ukládání. Možnosti:

  1. **Nejjednodušší:** celý web i Node server na **Render** (nebo jiný Node host) — Vercel vůbec nepotřebujete.
  2. **Rozděleně:** Vercel = statika z `frontend/`, **Render** běží `backend/server.mjs` s `/api/…` a `uploads/`. V `frontend/vercel.json` je **proxy** z `/api/:path*` a `/uploads/:path*` na váš URL na Renderu (příklad `romca-om.onrender.com` — pokud Render ukazuje jinou subdoménu, upravte oba řádky v `frontend/vercel.json` a znovu deploy). Na Renderu nastavte **Root** na `backend` (nebo ekvivalent) a start `npm start`.
  3. Časem přejít na databázi (např. Supabase) a serverless API.

**Když Vercel píše „No entrypoint“ nebo stránka „Not found“:** u projektu musí být **Root Directory = `frontend`** (ne monorepový root). Statika ve `frontend/` záměrně **nemá** vlastní `package.json` (žádný falešný build), aby Vercel nehledal Node entrypoint. **Build Command** u statiky můžete nechat prázdný. Proxy na Render: `frontend/vercel.json` (upravte URL na `onrender.com` podle vaší služby). Na **Renderu** ponechte root repa, `npm install` + `npm start` (viz README „DEPLOY“), nebo jen složka `backend` a tam `node server.mjs` po `npm install` v `backend/`.

Na Vercelu jsou dál **rewrites** z `/blog/:slug` na `post.html` a z `/cs/…` na `cs/post.html` — blogové URL fungují až tehdy, když se nasazená statika vůbec načte.

## 5) Zálohování

- Zálohujte: `backend/data/posts.json` a složku `backend/uploads/`.

## 6) Odeslání kolegovi

Adresa administrace: **`/admin.html`**. Heslo a `JWT_SECRET` nikomu neposílejte e-mailem v otevřené podobě; předejte je bezpečným kanálem a po nasazení hesla v produkci změňte.

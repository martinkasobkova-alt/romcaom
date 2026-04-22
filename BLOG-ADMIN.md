# Blog — přihlášení a psaní článků

Na tomto webu je jednoduchá **administrace blogu** (jako pro jednoho autora / správce). Funguje přes **Node.js server**, který ukládá články do souboru `data/posts.json` a nahrávané fotky do `uploads/`.

## 1) První spuštění

1. Nainstalujte závislosti (jednou):

   ```bash
   cd cesta/k/projektu
   npm install
   ```

2. Vytvořte soubor **`.env`** (zkopírujte z `.env.example`):

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
- Konkrétní článek: `/blog/např-welcome` (slug podle toho, co uvidíte v adminu a v `data/posts.json`)

## 4) Nasazení na produkci (Vercel atd.)

- **Pouhé nahrání statických HTML na Vercel** nestačí — chybí API a ukládání. Možnosti:

  1. Hostovat tento repozitář na službě, která umí **Node** (Render, Railway, VPS, Node hosting), nebo
  2. Časem přejít na databázi (např. Supabase) a serverless API — to můžeme doprojektovat, až bude jasné, kde bude weby bydlet.

Na Vercelu je v `vercel.json` **rewrite** z `/blog/:slug` na `post.html`, aby šablona článku fungovala, ale **data** stejně musí být dostupná z backendu, pokud chcete ukládat z administrace v prohlížeči.

## 5) Zálohování

- Zálohujte: `data/posts.json` a složku `uploads/`.

## 6) Odeslání kolegovi

Adresa administrace: **`/admin.html`**. Heslo a `JWT_SECRET` nikomu neposílejte e-mailem v otevřené podobě; předejte je bezpečným kanálem a po nasazení hesla v produkci změňte.

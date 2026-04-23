import { apiUrl } from "./api-config.js";

const TOKEN_KEY = "bl_blog_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function api(path, options = {}) {
  const url = apiUrl(path);
  const h = { ...authHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers: h });
  if (res.status === 401) {
    setToken("");
    showLogin();
    throw new Error("auth");
  }
  return res;
}

const loginView = document.getElementById("loginView");
const editorView = document.getElementById("editorView");
const changePasswordView = document.getElementById("changePasswordView");
const loginError = document.getElementById("loginError");
const loginForm = document.getElementById("loginForm");
const adminTopActions = document.getElementById("adminTopActions");

let postsCache = [];
let currentId = null;
let galleryUrls = [];

const el = (id) => document.getElementById(id);
const bodyEditor = el("bodyEditor");
const fTitle = el("fTitle");
const fSubtitle = el("fSubtitle");
const fCategory = el("fCategory");
const fSlug = el("fSlug");
const fHero = el("fHero");
const fPublished = el("fPublished");
const postList = el("postList");
const saveStatus = el("saveStatus");
const viewPublic = el("viewPublic");

function showLogin() {
  loginView.classList.remove("admin-hidden");
  editorView.classList.add("admin-hidden");
  changePasswordView?.classList.add("admin-hidden");
  adminTopActions.innerHTML = "";
}

function showEditor() {
  loginView.classList.add("admin-hidden");
  changePasswordView?.classList.add("admin-hidden");
  editorView.classList.remove("admin-hidden");
  adminTopActions.innerHTML = `
    <button type="button" class="admin-btn admin-btn-ghost" id="changePwBtn">Změnit heslo</button>
    <button type="button" class="admin-btn admin-btn-ghost" id="logoutBtn">Odhlásit</button>
    <a href="/blog.html" class="admin-btn admin-btn-ghost" style="text-decoration:none">← Blog (veřejnost)</a>`;
  document.getElementById("logoutBtn").addEventListener("click", () => {
    setToken("");
    showLogin();
  });
  document.getElementById("changePwBtn").addEventListener("click", showChangePassword);
}

function showChangePassword() {
  if (!changePasswordView) return;
  editorView.classList.add("admin-hidden");
  loginView.classList.add("admin-hidden");
  changePasswordView.classList.remove("admin-hidden");
  const err = el("cpError");
  const ok = el("cpSuccess");
  if (err) { err.style.display = "none"; err.textContent = ""; }
  if (ok) ok.style.display = "none";
  ["cpCurrent", "cpNew", "cpConfirm"].forEach((id) => {
    const n = el(id);
    if (n) n.value = "";
  });
  el("cpCurrent")?.focus();
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderList() {
  postList.innerHTML = "";
  postsCache.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "admin-list-item" + (p.id === currentId ? " is-active" : "");
    b.innerHTML = `<span>${escapeHtml(p.title || "(bez názvu)")}</span><small>${escapeHtml(p.slug)}${p.published ? "" : " — koncept"}</small>`;
    b.addEventListener("click", () => loadPost(p.id));
    postList.appendChild(b);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadPost(id) {
  const p = postsCache.find((x) => x.id === id);
  if (!p) return;
  currentId = p.id;
  fTitle.value = p.title || "";
  fSubtitle.value = p.subtitle || "";
  fCategory.value = p.category || "Journal";
  fSlug.value = p.slug || "";
  fHero.value = p.heroImage || "";
  fPublished.checked = p.published !== false;
  bodyEditor.innerHTML = p.bodyHtml || "";
  galleryUrls = Array.isArray(p.gallery) ? [...p.gallery] : [];
  updateHeroPreview();
  renderGalleryThumbs();
  updateViewLink();
  renderList();
  saveStatus.textContent = "";
}

function newPost() {
  currentId = null;
  fTitle.value = "";
  fSubtitle.value = "";
  fCategory.value = "Journal";
  fSlug.value = "";
  fHero.value = "";
  fPublished.checked = true;
  bodyEditor.innerHTML = "<p></p>";
  galleryUrls = [];
  el("heroPreview").classList.add("admin-hidden");
  renderGalleryThumbs();
  el("viewPublic").removeAttribute("href");
  updateViewLink();
  renderList();
  saveStatus.textContent = "Nový článek — veřejná adresa: /blog?slug=…";
}

function updateHeroPreview() {
  const url = fHero.value;
  const img = el("heroPreview");
  if (url) {
    img.src = url;
    img.classList.remove("admin-hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("admin-hidden");
  }
}

function updateViewLink() {
  if (!fSlug.value.trim() && fTitle.value) {
    fSlug.value = slugify(fTitle.value);
  }
  const slug = fSlug.value.trim() || (fTitle.value ? slugify(fTitle.value) : "");
  if (slug) {
    viewPublic.href = `${location.origin}/blog?slug=${encodeURIComponent(slug)}`;
  } else {
    viewPublic.removeAttribute("href");
  }
}

function renderGalleryThumbs() {
  const wrap = el("galleryThumbs");
  wrap.innerHTML = "";
  galleryUrls.forEach((u, i) => {
    const d = document.createElement("div");
    d.className = "g-item";
    d.innerHTML = `<img src="${escapeHtml(u)}" alt=""/><button type="button" class="x" aria-label="Odebrat">×</button>`;
    d.querySelector("button.x").addEventListener("click", () => {
      galleryUrls.splice(i, 1);
      renderGalleryThumbs();
    });
    wrap.appendChild(d);
  });
}

el("newPost").addEventListener("click", newPost);

document.querySelectorAll(".admin-toolbar [data-cmd]").forEach((btn) => {
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => {
    const cmd = btn.getAttribute("data-cmd");
    const val = btn.getAttribute("data-val");
    bodyEditor.focus();
    if (cmd === "formatBlock" && val) {
      document.execCommand("formatBlock", false, val === "h2" ? "h2" : "p");
    } else {
      document.execCommand(cmd, false, null);
    }
  });
});

el("btnLink").addEventListener("click", () => {
  const u = window.prompt("Adresa odkazu (https://…):", "https://");
  if (u) {
    bodyEditor.focus();
    document.execCommand("createLink", false, u);
  }
});

el("btnImgBody").addEventListener("click", () => {
  el("bodyImgFile").click();
});

el("btnVideoBody").addEventListener("click", () => {
  el("bodyVideoFile").click();
});

el("btnAudioBody").addEventListener("click", () => {
  el("bodyAudioFile").click();
});

function insertNodeAtCursor(node) {
  bodyEditor.focus();
  const sel = window.getSelection();
  if (sel && sel.rangeCount) {
    const r = sel.getRangeAt(0);
    r.collapse(false);
    r.insertNode(node);
    r.setStartAfter(node);
    r.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(r);
  } else {
    bodyEditor.appendChild(node);
  }
  const br = document.createElement("p");
  br.innerHTML = "<br>";
  node.parentNode?.insertBefore(br, node.nextSibling);
}

fTitle.addEventListener("input", () => {
  if (!currentId) {
    fSlug.value = slugify(fTitle.value);
  }
  updateViewLink();
});
fSlug.addEventListener("input", updateViewLink);

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl("/api/upload"), { method: "POST", body: fd, headers: authHeaders() });
  if (res.status === 401) {
    setToken("");
    showLogin();
    throw new Error("auth");
  }
  if (!res.ok) throw new Error("upload");
  return res.json();
}

el("heroFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;
  try {
    saveStatus.textContent = "Nahrávám…";
    const { url } = await uploadFile(f);
    fHero.value = url;
    updateHeroPreview();
    saveStatus.textContent = "";
  } catch {
    saveStatus.textContent = "Nahrání selhalo.";
  }
});

el("galleryFiles").addEventListener("change", async (e) => {
  const files = e.target.files;
  e.target.value = "";
  if (!files?.length) return;
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  try {
    saveStatus.textContent = "Nahrávám galerii…";
    const res = await fetch(apiUrl("/api/upload/gallery"), { method: "POST", body: fd, headers: authHeaders() });
    if (res.status === 401) {
      setToken("");
      showLogin();
      return;
    }
    const data = await res.json();
    galleryUrls = galleryUrls.concat(data.urls || []);
    renderGalleryThumbs();
    saveStatus.textContent = "";
  } catch {
    saveStatus.textContent = "Galerie se nepovedla nahrát.";
  }
});

el("bodyImgFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;
  try {
    saveStatus.textContent = "Nahrávám obrázek…";
    const { url } = await uploadFile(f);
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    insertNodeAtCursor(img);
    saveStatus.textContent = "";
  } catch {
    saveStatus.textContent = "Obrázek se nepovedlo nahrát.";
  }
});

el("bodyVideoFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;
  try {
    saveStatus.textContent = "Nahrávám video (může chvíli trvat)…";
    const { url } = await uploadFile(f);
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.setAttribute("playsinline", "");
    video.style.maxWidth = "100%";
    insertNodeAtCursor(video);
    saveStatus.textContent = "";
  } catch {
    saveStatus.textContent = "Video se nepovedlo nahrát (max. 50 MB).";
  }
});

el("bodyAudioFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;
  try {
    saveStatus.textContent = "Nahrávám audio…";
    const { url } = await uploadFile(f);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    audio.style.width = "100%";
    insertNodeAtCursor(audio);
    saveStatus.textContent = "";
  } catch {
    saveStatus.textContent = "Audio se nepovedlo nahrát (max. 50 MB).";
  }
});

el("savePost").addEventListener("click", async () => {
  const title = fTitle.value.trim();
  if (!title) {
    saveStatus.textContent = "Zadejte titulek.";
    return;
  }
  const payload = {
    title,
    subtitle: fSubtitle.value.trim(),
    category: fCategory.value.trim() || "Journal",
    bodyHtml: bodyEditor.innerHTML,
    heroImage: fHero.value.trim(),
    gallery: galleryUrls,
    published: fPublished.checked,
  };
  const slug = fSlug.value.trim() || slugify(title);
  try {
    saveStatus.textContent = "Ukládám…";
    if (currentId) {
      const r = await api(`/api/posts/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, slug }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "save");
      }
    } else {
      const r = await api("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, slug }),
      });
      if (!r.ok) throw new Error("save");
      const p = await r.json();
      currentId = p.id;
    }
    await refreshList();
    loadPost(currentId);
    saveStatus.textContent = "Uloženo.";
    setTimeout(() => {
      saveStatus.textContent = "";
    }, 2500);
  } catch (e) {
    if (e.message === "auth") return;
    saveStatus.textContent = "Uložení se nezdařilo. Zkontrolujte konzoli serveru.";
  }
});

el("deletePost").addEventListener("click", async () => {
  if (!currentId) {
    newPost();
    return;
  }
  if (!window.confirm("Opravdu smazat tento článek?")) return;
  try {
    const r = await api(`/api/posts/${currentId}`, { method: "DELETE" });
    if (!r.ok) return;
    currentId = null;
    await refreshList();
    newPost();
  } catch (e) {
    if (e.message !== "auth") saveStatus.textContent = "Smazání se nepovedlo.";
  }
});

async function refreshList() {
  const res = await api("/api/posts");
  if (!res.ok) return;
  postsCache = await res.json();
  renderList();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.style.display = "none";
  const password = el("loginPassword").value;
  try {
    const r = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) {
      loginError.style.display = "block";
      return;
    }
    const { token } = await r.json();
    setToken(token);
    await refreshList();
    showEditor();
    if (postsCache.length) loadPost(postsCache[0].id);
    else newPost();
  } catch {
    loginError.textContent = "Připojení k serveru se nezdařilo. Spouštíte `npm start`?";
    loginError.style.display = "block";
  }
});

const cpForm = document.getElementById("changePasswordForm");
if (cpForm) {
  cpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = el("cpError");
    const ok = el("cpSuccess");
    if (err) { err.style.display = "none"; err.textContent = ""; }
    if (ok) ok.style.display = "none";
    const currentPassword = el("cpCurrent").value;
    const newPassword = el("cpNew").value;
    const confirmPassword = el("cpConfirm").value;
    if (newPassword !== confirmPassword) {
      if (err) { err.textContent = "Nová hesla se neshodují."; err.style.display = "block"; }
      return;
    }
    if (newPassword.length < 8) {
      if (err) { err.textContent = "Nové heslo musí mít aspoň 8 znaků."; err.style.display = "block"; }
      return;
    }
    try {
      const r = await api("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (err) {
          err.textContent = data.error || "Změna hesla selhala.";
          err.style.display = "block";
        }
        return;
      }
      if (ok) ok.style.display = "block";
      ["cpCurrent", "cpNew", "cpConfirm"].forEach((id) => {
        const n = el(id);
        if (n) n.value = "";
      });
    } catch (e2) {
      if (e2.message === "auth") return;
      if (err) { err.textContent = "Spojení se serverem selhalo."; err.style.display = "block"; }
    }
  });
}
document.getElementById("cpCancel")?.addEventListener("click", () => {
  showEditor();
});

async function trySession() {
  const t = getToken();
  if (!t) {
    showLogin();
    return;
  }
  try {
    const r = await api("/api/auth/verify");
    if (!r.ok) throw new Error();
    await refreshList();
    showEditor();
    if (postsCache.length) loadPost(postsCache[0].id);
    else newPost();
  } catch {
    setToken("");
    showLogin();
  }
}

trySession();

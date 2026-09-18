(() => {
  "use strict";
  const labels = { DEVELOPMENT: "Em andamento", REVIEW: "Em revisão", COMPLETED: "Concluída", PAUSED: "Em pausa", ARCHIVED: "Arquivada" };
  const stateLabels = { ALL: "Todas", DEVELOPMENT: "Em andamento", COMPLETED: "Concluídas" };
  const P = window.PageZone, progress = window.PageZoneProgress;
  const state = { query: new URLSearchParams(location.search).get("q") || "", status: "ALL", genre: "" };
  const byId = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);
  const plural = (count, noun) => count === 1 ? noun : noun + "s";
  const detailsRoute = book => "book.html?book=" + encodeURIComponent(book.id);

  function savedState(book) {
    const saved = progress.read(book.id);
    const chapter = saved && P.selectChapter(book.chapterList || [], saved);
    if (!chapter) return null;
    const fallbackPosition = (book.chapterList || []).findIndex(item => item.chapterId === chapter.chapterId || item.number === chapter.number);
    const position = Number.isInteger(saved.position) && saved.position >= 0 ? saved.position : fallbackPosition;
    const count = (book.chapterList || []).length;
    return { chapter, position, percent: count ? Math.min(100, Math.round((position + 1) / count * 100)) : null };
  }

  function readingRoute(book) {
    const saved = savedState(book);
    return saved ? P.route(book.id, saved.chapter.number) : book.url;
  }

  function readingLabel(book) {
    const saved = savedState(book);
    return saved ? "Continuar — Capítulo " + saved.chapter.number : "Começar a ler";
  }

  function progressBar(saved) {
    return saved && Number.isInteger(saved.percent) ? '<div class="reading-progress" aria-label="' + saved.percent + '% lido"><span style="width:' + saved.percent + '%"></span></div>' : "";
  }

  function card(book) {
    const saved = savedState(book);
    return '<article class="book-card" data-book-id="' + escapeHTML(book.id) + '">' +
      '<a class="cover-link" href="' + escapeHTML(detailsRoute(book)) + '" aria-label="Ver obra ' + escapeHTML(book.title) + '">' +
      '<span class="cover-wrap"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '" loading="lazy" decoding="async">' +
      '<span class="card-status">' + escapeHTML(labels[book.status] || book.status) + '</span></span></a>' +
      '<div class="card-copy"><h3><a href="' + escapeHTML(detailsRoute(book)) + '">' + escapeHTML(book.title) + '</a></h3>' +
      '<p class="card-subtitle">' + escapeHTML((book.genres || []).slice(0, 2).join(" · ")) + '</p>' +
      (saved ? '<p class="chapter-note">Capítulo ' + saved.chapter.number + ' · ' + saved.percent + '%</p>' + progressBar(saved) : '<p class="chapter-note">' + escapeHTML(book.chapterCount + " " + plural(book.chapterCount, "capítulo")) + '</p>') +
      '<a class="reading-link" href="' + escapeHTML(readingRoute(book)) + '">' + escapeHTML(readingLabel(book)) + '<span class="sr-only">: ' + escapeHTML(book.title) + '</span></a></div></article>';
  }

  function continueCard(book) {
    const saved = savedState(book);
    if (!saved) return "";
    return '<article class="continue-card"><a class="continue-cover" href="' + escapeHTML(detailsRoute(book)) + '"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '" loading="lazy"></a>' +
      '<div><p class="eyebrow">Capítulo ' + saved.chapter.number + '</p><h3>' + escapeHTML(book.title) + '</h3>' + progressBar(saved) +
      '<p class="progress-copy">' + saved.percent + '% da obra</p><a class="button small" href="' + escapeHTML(P.route(book.id, saved.chapter.number)) + '">Continuar lendo</a></div></article>';
  }

  function renderShelf(element, books) {
    const section = element.closest("section");
    if (!books.length) { section.hidden = true; return; }
    section.hidden = false;
    element.innerHTML = books.map(card).join("");
  }

  function renderContinue(books) {
    const reading = books.filter(book => savedState(book)).sort((a, b) => {
      const left = progress.read(a.id)?.updatedAt || 0, right = progress.read(b.id)?.updatedAt || 0;
      return right - left;
    });
    const section = byId("continue-shelf").closest("section");
    section.hidden = reading.length === 0;
    byId("continue-shelf").innerHTML = reading.map(continueCard).join("");
  }

  function renderHero(book) {
    const element = byId("hero-preview");
    element.innerHTML = '<a href="' + escapeHTML(detailsRoute(book)) + '" aria-label="Ver destaque ' + escapeHTML(book.title) + '"><span class="hero-cover"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '"></span>' +
      '<span class="hero-preview-copy"><small>Em destaque</small><strong>' + escapeHTML(book.title) + '</strong><span>' + escapeHTML((book.genres || []).slice(0, 2).join(" · ")) + '</span></span></a>';
  }

  function renderFeatured(book) {
    const element = byId("featured-book"), saved = savedState(book);
    element.innerHTML = '<article class="featured-card"><div class="featured-art"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '"></div>' +
      '<div class="featured-copy"><span class="status-badge" data-status="' + escapeHTML(book.status) + '">' + escapeHTML(labels[book.status] || book.status) + '</span>' +
      '<h3>' + escapeHTML(book.title) + '</h3><p>' + escapeHTML(book.description) + '</p><p class="feature-meta">' + escapeHTML((book.genres || []).slice(0, 3).join(" · ")) + ' · ' + book.chapterCount + ' capítulos</p>' +
      (saved ? progressBar(saved) : "") + '<div class="button-row"><a class="button" href="' + escapeHTML(readingRoute(book)) + '">' + escapeHTML(readingLabel(book)) + '</a>' +
      '<a class="button secondary" href="' + escapeHTML(detailsRoute(book)) + '">Ver obra</a></div></div></article>';
  }

  function populateGenres(books) {
    const select = byId("genre-filter");
    [...new Set(books.flatMap(book => book.genres || []))].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach(genre => {
      const option = document.createElement("option"); option.value = genre; option.textContent = genre; select.appendChild(option);
    });
  }

  function populateStatuses() {
    const container = byId("status-filters");
    Object.entries(stateLabels).forEach(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "filter-button"; button.dataset.status = key;
      button.setAttribute("aria-pressed", String(key === state.status)); button.textContent = label; container.appendChild(button);
    });
  }

  function matches(book) {
    const haystack = [book.title, book.slug, book.id, book.author, book.description, book.series, ...(book.genres || [])].filter(Boolean).join(" ");
    return (!state.query || P.normalize(haystack).includes(P.normalize(state.query))) &&
      (state.status === "ALL" || book.status === state.status) && (!state.genre || (book.genres || []).includes(state.genre));
  }

  function renderCatalog(books) {
    const visible = books.filter(matches);
    byId("catalog-heading").textContent = state.query ? 'Resultados para "' + state.query + '"' : "Explorar biblioteca";
    byId("empty-state").querySelector("h3").textContent = state.query ? 'Nenhuma história encontrada para "' + state.query + '"' : "Nenhuma história encontrada";
    byId("catalog-grid").innerHTML = visible.map(card).join("");
    byId("empty-state").hidden = visible.length !== 0;
    byId("catalog-count").textContent = visible.length + " " + plural(visible.length, "obra") + (visible.length === books.length ? "" : " encontrada" + (visible.length === 1 ? "" : "s"));
  }

  function wireShelves() {
    document.querySelectorAll(".shelf-shell").forEach(shell => {
      const track = shell.querySelector(".shelf-track");
      shell.querySelectorAll("[data-shelf-direction]").forEach(button => button.addEventListener("click", () => {
        track.scrollBy({ left: (button.dataset.shelfDirection === "next" ? 1 : -1) * Math.max(260, track.clientWidth * .78), behavior: "smooth" });
      }));
    });
  }

  async function init() {
    try {
      const response = await fetch("books.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");
      const payload = await response.json();
      const books = (payload.books || []).filter(book => book.id && book.title && book.cover && book.url).sort((a, b) => (a.order || 999) - (b.order || 999));
      if (!books.length) throw new Error("O catálogo está vazio.");
      const featured = books.find(book => book.featured) || books[0];
      renderHero(featured); renderFeatured(featured); renderContinue(books);
      renderShelf(byId("development-shelf"), books.filter(book => book.status === "DEVELOPMENT"));
      renderShelf(byId("completed-shelf"), books.filter(book => book.status === "COMPLETED"));
      populateGenres(books); populateStatuses(); renderCatalog(books); wireShelves();
      byId("catalog-loading").hidden = true; byId("search-input").value = state.query;
      if (state.query) byId("catalog-heading").scrollIntoView();

      function updateURL(replace = false) {
        const url = new URL(location.href); if (state.query) url.searchParams.set("q", state.query); else url.searchParams.delete("q");
        history[replace ? "replaceState" : "pushState"](null, "", url);
      }
      byId("search-form").addEventListener("submit", event => {
        event.preventDefault(); state.query = byId("search-input").value.trim(); updateURL(); renderCatalog(books);
        byId("catalog-heading").focus(); byId("catalog-heading").scrollIntoView();
      });
      byId("search-input").addEventListener("input", event => { state.query = event.target.value.trim(); renderCatalog(books); });
      byId("status-filters").addEventListener("click", event => {
        const filter = event.target.closest("[data-status]"); if (!filter) return;
        state.status = filter.dataset.status;
        document.querySelectorAll(".filter-button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.status === state.status)));
        renderCatalog(books);
      });
      byId("genre-filter").addEventListener("change", event => { state.genre = event.target.value; renderCatalog(books); });
      byId("clear-filters").addEventListener("click", () => {
        state.query = ""; state.status = "ALL"; state.genre = ""; byId("search-input").value = ""; byId("genre-filter").value = "";
        document.querySelectorAll(".filter-button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.status === "ALL")));
        updateURL(); renderCatalog(books); byId("search-input").focus();
      });
      window.addEventListener("popstate", () => { state.query = new URLSearchParams(location.search).get("q") || ""; byId("search-input").value = state.query; renderCatalog(books); });
      const refresh = () => { renderFeatured(featured); renderContinue(books); renderCatalog(books); };
      window.addEventListener("pageshow", refresh); window.addEventListener("storage", refresh);
    } catch (error) {
      byId("catalog-loading").innerHTML = 'Não foi possível carregar a biblioteca agora. <a href="">Tentar novamente</a>';
      byId("featured-book").textContent = "Biblioteca indisponível temporariamente."; console.error(error);
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();

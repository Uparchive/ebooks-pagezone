(() => {
  "use strict";
  const labels = { DEVELOPMENT: "Em desenvolvimento", REVIEW: "Em revisão", COMPLETED: "Concluído", PAUSED: "Em pausa", ARCHIVED: "Arquivado" };
  const stateLabels = { ALL: "Todos", DEVELOPMENT: "Em desenvolvimento", COMPLETED: "Concluídos" };
  const state = { query: "", status: "ALL", genre: "" };
  const byId = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);
  const plural = (count, noun) => count === 1 ? noun : noun + "s";

  function genres(book) {
    return (book.genres || []).map((genre) => '<span class="genre">' + escapeHTML(genre) + "</span>").join("");
  }

  function chapterNote(book) {
    if (!Number.isInteger(book.currentChapter)) return "";
    const label = "Capítulo " + book.currentChapter + " disponível";
    if (Number.isInteger(book.estimatedChapters) && book.estimatedChapters > 0) {
      const progress = Math.min(100, Math.round(book.currentChapter / book.estimatedChapters * 100));
      return label + " · " + progress + "%";
    }
    return label;
  }

  function card(book) {
    const chapter = chapterNote(book);
    return '<article class="book-card">' +
      '<button type="button" data-book-id="' + escapeHTML(book.id) + '" aria-label="Ver detalhes de ' + escapeHTML(book.title) + '">' +
      '<span class="cover-wrap"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '" loading="lazy" decoding="async">' +
      '<span class="card-status">' + escapeHTML(labels[book.status] || book.status) + "</span></span>" +
      "</button><h3>" + escapeHTML(book.title) + "</h3>" +
      '<p class="card-subtitle">' + escapeHTML((book.genres || []).slice(0, 2).join(" · ")) + "</p>" +
      (chapter ? '<p class="chapter-note">' + escapeHTML(chapter) + "</p>" : "") +
      "</article>";
  }

  function renderShelf(element, books) {
    const section = element.closest("section");
    if (!books.length) { section.hidden = true; return; }
    section.hidden = false;
    element.innerHTML = books.map(card).join("");
  }

  function renderFeatured(book) {
    const element = byId("featured-book");
    if (!book) { element.closest("section").hidden = true; return; }
    element.innerHTML = '<article class="featured-card"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '">' +
      '<div><span class="book-type">Destaque</span><h2>' + escapeHTML(book.title) + "</h2>" +
      '<p class="book-copy">' + escapeHTML(book.description) + "</p>" +
      '<div class="meta"><span class="status-badge" data-status="' + escapeHTML(book.status) + '">' + escapeHTML(labels[book.status] || book.status) + "</span>" + genres(book) + "</div>" +
      '<div class="button-row"><a class="button" href="' + escapeHTML(book.url) + '" target="_blank" rel="noopener">Ler agora <span class="sr-only">: ' + escapeHTML(book.title) + '</span></a>' +
      '<button class="button secondary" type="button" data-book-id="' + escapeHTML(book.id) + '">Detalhes</button></div></div></article>';
  }

  function populateGenres(books) {
    const select = byId("genre-filter");
    const list = [...new Set(books.flatMap((book) => book.genres || []))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    list.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre; option.textContent = genre; select.appendChild(option);
    });
  }

  function populateStatuses() {
    const container = byId("status-filters");
    Object.entries(stateLabels).forEach(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "filter-button"; button.dataset.status = key;
      button.setAttribute("aria-pressed", key === state.status ? "true" : "false"); button.textContent = label;
      container.appendChild(button);
    });
  }

  function matches(book) {
    const haystack = [book.title, book.description, book.series, ...(book.genres || [])].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return (!state.query || haystack.includes(state.query)) &&
      (state.status === "ALL" || book.status === state.status) &&
      (!state.genre || (book.genres || []).includes(state.genre));
  }

  function renderCatalog(books) {
    const visible = books.filter(matches);
    byId("catalog-grid").innerHTML = visible.map(card).join("");
    byId("empty-state").hidden = visible.length !== 0;
    byId("catalog-count").textContent = visible.length + " " + plural(visible.length, "obra") + (visible.length === books.length ? "" : " encontrada" + (visible.length === 1 ? "" : "s"));
  }

  function openDialog(book) {
    const dialog = byId("book-dialog"), content = byId("dialog-content");
    content.innerHTML = '<article class="dialog-book"><img src="' + escapeHTML(book.cover) + '" alt="Capa de ' + escapeHTML(book.title) + '">' +
      '<div><span class="status-badge" data-status="' + escapeHTML(book.status) + '">' + escapeHTML(labels[book.status] || book.status) + "</span>" +
      '<h2 id="dialog-title">' + escapeHTML(book.title) + '</h2><div class="meta">' + genres(book) + "</div>" +
      '<p>' + escapeHTML(book.description) + "</p>" +
      (chapterNote(book) ? '<p class="chapter-note">' + escapeHTML(chapterNote(book)) + "</p>" : "") +
      '<a class="button" href="' + escapeHTML(book.url) + '" target="_blank" rel="noopener">Ler agora</a></div></article>';
    if (typeof dialog.showModal === "function") dialog.showModal(); else window.open(book.url, "_blank", "noopener");
  }

  async function init() {
    try {
      const response = await fetch("books.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");
      const payload = await response.json();
      const books = (payload.books || []).filter((book) => book.id && book.title && book.cover && book.url)
        .sort((a, b) => (a.order || 999) - (b.order || 999));
      if (!books.length) throw new Error("O catálogo está vazio.");
      renderFeatured(books.find((book) => book.featured) || books[0]);
      renderShelf(byId("development-shelf"), books.filter((book) => book.status === "DEVELOPMENT"));
      renderShelf(byId("completed-shelf"), books.filter((book) => book.status === "COMPLETED"));
      populateGenres(books); populateStatuses(); renderCatalog(books);

      document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-book-id]");
        if (trigger) { const book = books.find((item) => item.id === trigger.dataset.bookId); if (book) openDialog(book); }
        const filter = event.target.closest("[data-status]");
        if (filter && filter.classList.contains("filter-button")) {
          state.status = filter.dataset.status;
          document.querySelectorAll(".filter-button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.status === state.status)));
          renderCatalog(books);
        }
      });
      byId("search-input").addEventListener("input", (event) => { state.query = event.target.value.trim().toLocaleLowerCase("pt-BR"); renderCatalog(books); });
      byId("genre-filter").addEventListener("change", (event) => { state.genre = event.target.value; renderCatalog(books); });
      byId("clear-filters").addEventListener("click", () => {
        state.query = ""; state.status = "ALL"; state.genre = "";
        byId("search-input").value = ""; byId("genre-filter").value = "";
        document.querySelectorAll(".filter-button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.status === "ALL")));
        renderCatalog(books);
      });
      document.querySelector(".dialog-close").addEventListener("click", () => byId("book-dialog").close());
    } catch (error) {
      byId("featured-book").innerHTML = '<p class="load-error">Não foi possível carregar a biblioteca agora.</p>';
      console.error(error);
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
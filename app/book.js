(() => {
  "use strict";
  const P = window.PageZone, progress = window.PageZoneProgress;
  const byId = id => document.getElementById(id);
  const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);
  const labels = { DEVELOPMENT: "Em andamento", REVIEW: "Em revisão", COMPLETED: "Concluída", PAUSED: "Em pausa", ARCHIVED: "Arquivada" };

  async function json(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error("Não foi possível carregar a obra.");
    return response.json();
  }

  async function init() {
    try {
      const id = new URLSearchParams(location.search).get("book");
      if (!id) throw new Error("Escolha uma obra na biblioteca.");
      const catalog = await json("books.json");
      const book = (catalog.books || []).find(item => item.id === id || item.slug === id);
      if (!book) throw new Error("Obra não encontrada.");
      const data = await json(book.chaptersUrl || P.asset(book, book.chapters.path));
      const chapters = P.chapters(data.chapters || []);
      if (!chapters.length) throw new Error("Esta obra ainda não possui capítulos publicados.");
      const saved = progress.read(book.id);
      const current = saved && P.selectChapter(chapters, saved);
      const position = current ? chapters.findIndex(chapter => chapter.chapterId === current.chapterId) : -1;
      const percent = position >= 0 ? Math.min(100, Math.round((position + 1) / chapters.length * 100)) : 0;

      document.title = book.title + " — PageZone";
      byId("detail-cover").src = book.cover; byId("detail-cover").alt = "Capa de " + book.title;
      byId("detail-status").textContent = labels[book.status] || book.status;
      byId("detail-title").textContent = book.title; byId("detail-description").textContent = book.description || "";
      byId("detail-genres").innerHTML = (book.genres || []).map(genre => "<span>" + safe(genre) + "</span>").join("");
      byId("detail-meta").textContent = chapters.length + (chapters.length === 1 ? " capítulo" : " capítulos") + " · " + (labels[book.status] || book.status);
      const action = byId("primary-reading-action");
      action.href = current ? P.route(book.id, current.number) : P.route(book.id, chapters[0].number);
      action.textContent = current ? "Continuar no capítulo " + current.number : "Começar a ler";
      if (current) {
        byId("detail-progress").hidden = false; byId("progress-label").textContent = "Capítulo " + current.number;
        byId("progress-percent").textContent = percent + "%"; byId("progress-bar").style.width = percent + "%";
      }
      byId("chapters-count").textContent = chapters.length + (chapters.length === 1 ? " capítulo" : " capítulos");
      byId("chapters-list").innerHTML = chapters.map(chapter => '<a class="chapter-item" href="' + safe(P.route(book.id, chapter.number)) + '"' +
        (current && current.chapterId === chapter.chapterId ? ' aria-current="page"' : '') + '><span class="chapter-number">' + safe(chapter.displayNumber || "Capítulo " + chapter.number) + '</span>' +
        '<span class="chapter-title">' + safe(chapter.title || "Sem título") + '</span><span class="chapter-action">Ler capítulo →</span></a>').join("");
      byId("book-loading").hidden = true; byId("book-details").hidden = false;
    } catch (error) {
      byId("book-loading").textContent = error.message; byId("book-recovery").hidden = false; console.error(error);
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();

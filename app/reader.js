(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const $ = id => document.getElementById(id);
  const P = window.PageZone, progress = window.PageZoneProgress;
  const safe = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[c]);
  function notice(message) { $("reader-notice").textContent = message; $("reader-notice").hidden = false; }
  function storageNotice() { notice("Seu navegador não permite salvar o progresso. Você pode continuar lendo nesta sessão."); }
  document.addEventListener("pagezone:storage-unavailable", storageNotice);
  function setNav(element, book, chapter) {
    element.hidden = !chapter;
    if (chapter) element.href = P.route(book.id, chapter.number);
  }
  async function json(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error("Não foi possível carregar a obra. Tente novamente ou volte à biblioteca.");
    return response.json();
  }
  async function init() {
    try {
      const id = params.get("book");
      if (!id) throw new Error("Escolha uma obra na biblioteca.");
      const catalog = await json("books.json");
      const book = catalog.books.find(b => b.id === id || b.slug === id);
      if (!book) throw new Error("Obra não encontrada. Escolha outro livro na biblioteca.");
      const data = await json(book.chaptersUrl || P.asset(book, book.chapters.path));
      const chapters = P.chapters(data.chapters || []);
      if (!chapters.length) throw new Error("Esta obra ainda não possui capítulos publicados.");
      const requested = params.get("chapter");
      const explicit = requested !== null;
      const target = explicit ? { chapterId: requested, chapterNumber: /^\d+$/.test(requested) ? Number(requested) : NaN } : progress.read(book.id);
      const chapter = P.selectChapter(chapters, target);
      if (target && !chapters.some(c => c.chapterId === target.chapterId || c.number === target.chapterNumber)) {
        notice("O capítulo solicitado não está disponível. Abrimos o capítulo válido mais próximo.");
      }
      // Canonicalize invalid/alias URLs without adding an extra Back entry.
      history.replaceState(null, "", P.route(book.id, chapter.number) + location.hash);
      document.title = book.title + " — " + (chapter.displayNumber || "Capítulo " + chapter.number) + " — PageZone";
      $("book-cover").src = book.cover;
      $("book-cover").alt = "Capa de " + book.title;
      $("book-title").textContent = book.title;
      $("book-status").textContent = ({ DEVELOPMENT:"Em desenvolvimento", REVIEW:"Em revisão", COMPLETED:"Concluído", PAUSED:"Em pausa", ARCHIVED:"Arquivado" })[book.status] || book.status;
      $("chapter-label").textContent = chapter.displayNumber || "Capítulo " + chapter.number;
      $("chapter-title").textContent = chapter.title || "";
      // Resolve assets while detached, before the browser starts image requests.
      const template = document.createElement("template");
      template.innerHTML = chapter.bodyHtml;
      template.content.querySelectorAll("img").forEach(image => {
        image.setAttribute("src", P.asset(book, image.getAttribute("src")));
        if (!image.hasAttribute("alt")) image.alt = "Ilustração de " + book.title;
      });
      $("chapter-content").replaceChildren(template.content);
      const position = chapters.findIndex(c => c.chapterId === chapter.chapterId);
      setNav($("previous-chapter"), book, chapters[position - 1]);
      setNav($("next-chapter"), book, chapters[position + 1]);
      $("continues").hidden = !(book.status === "DEVELOPMENT" && position === chapters.length - 1);
      $("chapter-index").innerHTML = chapters.map(c => '<a href="' + safe(P.route(book.id, c.number)) + '"' +
        (c.chapterId === chapter.chapterId ? ' aria-current="page"' : '') + '>' + safe(c.displayNumber || "Capítulo " + c.number) +
        (c.title ? " — " + safe(c.title) : "") + "</a>").join("");
      const closeIndex = () => { $("chapter-index").hidden = true; $("index-toggle").setAttribute("aria-expanded", "false"); };
      $("index-toggle").disabled = false;
      $("index-toggle").addEventListener("click", () => {
        const open = $("chapter-index").hidden;
        $("chapter-index").hidden = !open;
        $("index-toggle").setAttribute("aria-expanded", String(open));
        if (open) $("chapter-index").querySelector('[aria-current="page"]').focus();
      });
      document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("chapter-index").hidden) { closeIndex(); $("index-toggle").focus(); } });
      document.addEventListener("click", event => { if (!event.target.closest("#chapter-index, #index-toggle")) closeIndex(); });
      $("reader-loading").hidden = true;
      $("reader").hidden = false;
      progress.save(book.id, chapter, position);
      if (progress.unavailable) storageNotice();
    } catch (error) {
      $("reader-loading").textContent = error.message;
      $("reader-recovery").hidden = false;
      console.error(error);
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();

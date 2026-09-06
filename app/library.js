/* Shared catalog, URL and chapter rules: keep the existing static routes. */
(function (root) {
  "use strict";
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  function chapters(items) {
    return items.map(c => ({ ...c, chapterId: String(c.chapterId || c.id || `chapter-${c.number}`) }))
      .sort((a, b) => a.number - b.number);
  }
  function selectChapter(items, progress) {
    if (!progress) return items[0];
    return items.find(c => c.chapterId === progress.chapterId) ||
      items.find(c => c.number === progress.chapterNumber) ||
      [...items].reverse().find(c => c.number < progress.chapterNumber) || items[0];
  }
  function route(id, chapter) {
    const params = new URLSearchParams({ book: id });
    if (chapter !== undefined) params.set("chapter", chapter);
    return "reader.html?" + params;
  }
  function asset(book, source) {
    const value = String(source || "");
    // Published HTML can still reference a cover's pre-migration filename.
    const legacy = book.coverLegacyUrl || book.cover?.legacyUrl;
    const filename = value.replace(/^\.\//, "");
    if (legacy && decodeURIComponent(legacy.split("/").pop()) === filename) {
      return typeof book.cover === "string" ? book.cover : asset({ id: book.id }, book.cover.path);
    }
    if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
    return "livros/" + encodeURIComponent(book.id) + "/" + value.split("/").map(encodeURIComponent).join("/");
  }
  const api = { normalize, chapters, selectChapter, route, asset };
  if (typeof module !== "undefined") module.exports = api;
  else root.PageZone = api;
})(globalThis);

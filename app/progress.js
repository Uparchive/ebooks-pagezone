(() => {
  "use strict";
  const KEY = "pagezone_reading_progress", READER_KEY = "pagezone_reader_id";
  const memory = new Map();
  let unavailable = false;
  function report() {
    if (!unavailable) console.warn("PageZone: armazenamento local indisponível; o progresso desta sessão não será persistido.");
    unavailable = true;
    document.dispatchEvent(new Event("pagezone:storage-unavailable"));
  }
  function get(key) {
    try { return localStorage.getItem(key) ?? memory.get(key) ?? null; }
    catch { report(); return memory.get(key) ?? null; }
  }
  function put(key, value) {
    memory.set(key, value);
    try { localStorage.setItem(key, value); } catch { report(); }
  }
  function all() {
    try {
      const data = JSON.parse(get(KEY) || "{}");
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch { return {}; }
  }
  function read(bookId) {
    const data = all()[bookId];
    if (data && Number.isInteger(data.chapterNumber) && data.chapterNumber >= 0) return data;
    const legacy = get("pagezone:progress:" + bookId);
    if (legacy !== null && /^\d+$/.test(legacy)) {
      return { chapterId: "chapter-" + Number(legacy), chapterNumber: Number(legacy), updatedAt: 0 };
    }
    return null;
  }
  function readerId() {
    let id = get(READER_KEY);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || "reader-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      put(READER_KEY, id);
    }
    return id;
  }
  function save(bookId, chapter, position) {
    const data = all();
    data[bookId] = { bookId, readerId: readerId(), chapterId: chapter.chapterId,
      chapterNumber: chapter.number, position, updatedAt: Date.now() };
    put(KEY, JSON.stringify(data));
  }
  window.PageZoneProgress = { read, save, readerId, get unavailable() { return unavailable; } };
  readerId();
})();

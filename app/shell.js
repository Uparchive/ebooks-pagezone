(() => {
  "use strict";
  const root = document.documentElement;
  const sidebar = document.getElementById("app-sidebar");
  const menuButton = document.getElementById("mobile-menu-toggle");
  const overlay = document.getElementById("sidebar-overlay");
  const collapseButton = document.getElementById("sidebar-toggle");
  const desktop = matchMedia("(min-width: 801px)");
  if (!sidebar) return;

  function savedSidebar() {
    try { return localStorage.getItem("pagezone-sidebar") === "expanded" ? "expanded" : "compact"; }
    catch { return "compact"; }
  }

  function applyDesktop(state, persist = false) {
    const selected = state === "expanded" ? "expanded" : "compact";
    root.dataset.sidebar = selected;
    collapseButton?.setAttribute("aria-expanded", String(selected === "expanded"));
    collapseButton?.setAttribute("aria-label", selected === "expanded" ? "Recolher menu lateral" : "Expandir menu lateral");
    if (persist) {
      try { localStorage.setItem("pagezone-sidebar", selected); } catch (_) {}
    }
  }

  function setDrawer(open) {
    root.dataset.drawer = open ? "open" : "closed";
    menuButton?.setAttribute("aria-expanded", String(open));
    sidebar.setAttribute("aria-hidden", String(!desktop.matches && !open));
    if (overlay) overlay.hidden = !open;
  }

  function syncMode() {
    if (desktop.matches) {
      setDrawer(false);
      sidebar.removeAttribute("aria-hidden");
      applyDesktop(savedSidebar());
    } else {
      root.dataset.sidebar = "expanded";
      setDrawer(false);
    }
  }

  function markCurrent() {
    const current = document.body.dataset.current || "home";
    document.querySelectorAll("[data-nav]").forEach(link => {
      if (link.dataset.nav === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  collapseButton?.addEventListener("click", () => applyDesktop(root.dataset.sidebar === "expanded" ? "compact" : "expanded", true));
  menuButton?.addEventListener("click", () => setDrawer(root.dataset.drawer !== "open"));
  overlay?.addEventListener("click", () => setDrawer(false));
  sidebar.addEventListener("click", event => { if (!desktop.matches && event.target.closest("a")) setDrawer(false); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && root.dataset.drawer === "open") { setDrawer(false); menuButton?.focus(); }
  });
  desktop.addEventListener?.("change", syncMode);
  syncMode();
  markCurrent();
})();

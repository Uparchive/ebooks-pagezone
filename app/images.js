(() => {
  "use strict";
  const fallback = new URL("../assets/cover-unavailable.svg", document.currentScript.src).href;
  document.addEventListener("error", event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallback) return;
    console.warn("PageZone: imagem indisponível", image.getAttribute("src"));
    image.dataset.fallback = "true";
    image.alt = (image.alt || "Imagem") + " — imagem indisponível";
    image.title = image.alt;
    image.removeAttribute("srcset");
    image.src = fallback;
  }, true);
})();

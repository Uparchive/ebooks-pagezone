(() => {
  let deferredPrompt = null;
  const installButton = document.getElementById('install-app');

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isAppleDevice = /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent);

  function updateButton() {
    if (!installButton) return;
    installButton.hidden = isStandalone();
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    updateButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    updateButton();
  });

  installButton?.addEventListener('click', async () => {
    if (isStandalone()) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      updateButton();
      return;
    }

    if (isAppleDevice) {
      alert('Para instalar a PageZone neste dispositivo, abra o menu Compartilhar do navegador e escolha “Adicionar à Tela de Início” ou “Adicionar ao Dock”.');
      return;
    }

    alert('Para instalar a PageZone, abra o menu do navegador e escolha “Instalar app”, “Adicionar à tela inicial” ou opção equivalente.');
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }

  updateButton();
})();

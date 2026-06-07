function setupBackButton(buttonId, url, message) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (confirm(message)) {
      window.location.href = url;
    }
  });
}

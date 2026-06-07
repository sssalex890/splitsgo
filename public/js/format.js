function formatRupiah(amount) {
  return 'Rp' + amount.toLocaleString('id-ID');
}

function formatPriceInput(value) {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

function parsePriceInput(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function bindPriceInput(input) {
  input.addEventListener('input', () => {
    const formatted = formatPriceInput(input.value);
    input.value = formatted;
  });
}

function buildCopyText(data) {
  let text = '=== SPLITGO ===';
  if (data.tripName) text += `\n${data.tripName}`;
  text += '\n\n';

  for (const entry of data.breakdown) {
    text += `${entry.name}\n`;
    for (const item of entry.items) {
      text += `${item.name} : ${formatRupiah(item.amount)}\n`;
    }
    text += `Total : ${formatRupiah(entry.total)}\n\n`;
  }

  return text.trimEnd();
}

function buildWhatsAppUrl(text) {
  return 'https://wa.me/?text=' + encodeURIComponent(text);
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast--show');
  setTimeout(() => toast.classList.remove('toast--show'), 2500);
}

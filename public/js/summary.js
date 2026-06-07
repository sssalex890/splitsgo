const tripId = getTripId();
const summaryGrid = document.getElementById('summary-grid');
const tripNameEl = document.getElementById('trip-name');
const copyBtn = document.getElementById('copy-summary');
const whatsappBtn = document.getElementById('send-whatsapp');
const totalBanner = document.getElementById('total-banner');
const grandTotalEl = document.getElementById('grand-total');

let summaryData = null;

if (!tripId) {
  window.location.href = '/create-trip.html';
}

function renderSummary(data) {
  summaryData = data;
  tripNameEl.textContent = '📍 ' + data.tripName;
  summaryGrid.innerHTML = '';

  const grandTotal = data.totals.reduce((sum, t) => sum + t.total, 0);
  grandTotalEl.textContent = formatRupiah(grandTotal);
  totalBanner.hidden = false;

  for (const entry of data.breakdown) {
    const card = document.createElement('div');
    card.className = 'summary-card';

    const header = document.createElement('div');
    header.className = 'summary-card__header';

    const nameBlock = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'summary-card__label';
    label.textContent = 'Harus bayar';
    const name = document.createElement('div');
    name.className = 'summary-card__name';
    name.textContent = entry.name;
    nameBlock.appendChild(label);
    nameBlock.appendChild(name);

    const total = document.createElement('div');
    total.className = 'summary-card__total';
    total.textContent = formatRupiah(entry.total);

    header.appendChild(nameBlock);
    header.appendChild(total);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'summary-card__toggle summary-card__toggle--open';
    toggle.innerHTML = '<span>Tutup rincian</span><span class="summary-card__toggle-icon">▼</span>';

    const breakdown = document.createElement('div');
    breakdown.className = 'breakdown breakdown--open';

    const heading = document.createElement('div');
    heading.className = 'breakdown__heading';
    heading.textContent = 'Rincian';
    breakdown.appendChild(heading);

    for (const item of entry.items) {
      const row = document.createElement('div');
      row.className = 'breakdown__item';

      const itemName = document.createElement('span');
      itemName.className = 'breakdown__item-name';
      itemName.textContent = item.name;

      const itemAmount = document.createElement('span');
      itemAmount.textContent = formatRupiah(item.amount);

      row.appendChild(itemName);
      row.appendChild(itemAmount);
      breakdown.appendChild(row);
    }

    const totalRow = document.createElement('div');
    totalRow.className = 'breakdown__total';
    totalRow.innerHTML = `<span>Total</span><span>${formatRupiah(entry.total)}</span>`;
    breakdown.appendChild(totalRow);

    toggle.addEventListener('click', () => {
      const isOpen = breakdown.classList.toggle('breakdown--open');
      toggle.classList.toggle('summary-card__toggle--open', isOpen);
      toggle.querySelector('span:first-child').textContent = isOpen
        ? 'Tutup rincian'
        : 'Lihat rincian per barang';
    });

    card.appendChild(header);
    card.appendChild(toggle);
    card.appendChild(breakdown);
    summaryGrid.appendChild(card);
  }

  whatsappBtn.href = buildWhatsAppUrl(buildCopyText(data));
}

copyBtn.addEventListener('click', async () => {
  if (!summaryData) return;
  const text = buildCopyText(summaryData);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Teks berhasil disalin!');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Teks berhasil disalin!');
  }
});

async function init() {
  try {
    const data = await apiRequest(`/api/trips/${tripId}/summary`);
    renderSummary(data);
  } catch {
    window.location.href = `/add-items.html?tripId=${tripId}`;
  }
}

init();

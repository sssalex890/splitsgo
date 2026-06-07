const tripId = getTripId();
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const calculateBtn = document.getElementById('calculate-split');
const formError = document.getElementById('form-error');
const tripNameEl = document.getElementById('trip-name');

let participants = [];
let cardCounter = 0;

if (!tripId) {
  window.location.href = '/create-trip.html';
}

function updateCardNumbers() {
  itemsContainer.querySelectorAll('.card').forEach((card, i) => {
    card.querySelector('.card__badge').textContent = i + 1;
  });
}

function createItemCard() {
  cardCounter += 1;
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.cardId = cardCounter;

  const header = document.createElement('div');
  header.className = 'card__header';

  const title = document.createElement('span');
  title.className = 'card__title';
  const badge = document.createElement('span');
  badge.className = 'card__badge';
  badge.textContent = '1';
  title.appendChild(badge);
  title.appendChild(document.createTextNode(' Barang Sewaan'));

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-ghost btn-icon';
  removeBtn.innerHTML = '&times;';
  removeBtn.title = 'Hapus barang';
  removeBtn.setAttribute('aria-label', 'Hapus barang');
  removeBtn.addEventListener('click', () => {
    if (itemsContainer.children.length > 1) {
      card.remove();
      updateCardNumbers();
    }
  });

  header.appendChild(title);
  header.appendChild(removeBtn);

  const nameGroup = document.createElement('div');
  nameGroup.className = 'form-group';
  const nameLabel = document.createElement('label');
  nameLabel.className = 'form-label';
  nameLabel.textContent = 'Nama barang';
  const nameHint = document.createElement('p');
  nameHint.className = 'form-hint';
  nameHint.textContent = 'Contoh: Tenda, Carrier, Tracking Pole, Sleeping Bag';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-input item-name';
  nameInput.placeholder = 'Tulis nama barang';
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameHint);
  nameGroup.appendChild(nameInput);

  const priceGroup = document.createElement('div');
  priceGroup.className = 'form-group';
  const priceLabel = document.createElement('label');
  priceLabel.className = 'form-label';
  priceLabel.textContent = 'Harga sewa';
  const priceHint = document.createElement('p');
  priceHint.className = 'form-hint';
  priceHint.textContent = 'Total harga sewa barang ini (bukan per orang).';
  const priceWrap = document.createElement('div');
  priceWrap.className = 'input-prefix';
  const pricePrefix = document.createElement('span');
  pricePrefix.className = 'input-prefix__label';
  pricePrefix.textContent = 'Rp';
  const priceInput = document.createElement('input');
  priceInput.type = 'text';
  priceInput.inputMode = 'numeric';
  priceInput.className = 'form-input item-price';
  priceInput.placeholder = '60.000';
  priceInput.autocomplete = 'off';
  bindPriceInput(priceInput);
  priceWrap.appendChild(pricePrefix);
  priceWrap.appendChild(priceInput);
  priceGroup.appendChild(priceLabel);
  priceGroup.appendChild(priceHint);
  priceGroup.appendChild(priceWrap);

  const usersGroup = document.createElement('div');
  usersGroup.className = 'form-group';
  const chipsLabel = document.createElement('div');
  chipsLabel.className = 'chips-label';
  const usersLabel = document.createElement('span');
  usersLabel.className = 'form-label';
  usersLabel.textContent = 'Siapa yang memakai?';
  const chipsHint = document.createElement('span');
  chipsHint.className = 'chips-hint';
  chipsHint.textContent = 'Ketuk nama untuk memilih';
  chipsLabel.appendChild(usersLabel);
  chipsLabel.appendChild(chipsHint);
  const chips = document.createElement('div');
  chips.className = 'chips item-chips';

  participants.forEach((p) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = p.name;
    chip.dataset.participantId = p.id;
    chip.addEventListener('click', () => {
      chip.classList.toggle('chip--active');
    });
    chips.appendChild(chip);
  });

  usersGroup.appendChild(chipsLabel);
  usersGroup.appendChild(chips);

  card.appendChild(header);
  card.appendChild(nameGroup);
  card.appendChild(priceGroup);
  card.appendChild(usersGroup);

  return card;
}

function addItemCard() {
  itemsContainer.appendChild(createItemCard());
  updateCardNumbers();
}

addItemBtn.addEventListener('click', addItemCard);

calculateBtn.addEventListener('click', async () => {
  formError.hidden = true;

  const cards = itemsContainer.querySelectorAll('.card');
  const items = [];

  for (const card of cards) {
    const name = card.querySelector('.item-name').value.trim();
    const price = parsePriceInput(card.querySelector('.item-price').value);
    const activeChips = card.querySelectorAll('.chip--active');
    const participantIds = [...activeChips].map((c) => c.dataset.participantId);

    if (!name) {
      formError.textContent = 'Setiap barang harus punya nama.';
      formError.hidden = false;
      return;
    }
    if (!price || price <= 0) {
      formError.textContent = 'Isi harga sewa yang benar untuk setiap barang.';
      formError.hidden = false;
      return;
    }
    if (participantIds.length === 0) {
      formError.textContent = 'Pilih minimal 1 orang yang memakai setiap barang.';
      formError.hidden = false;
      return;
    }

    items.push({ name, price, participantIds });
  }

  if (items.length === 0) {
    formError.textContent = 'Tambahkan minimal 1 barang sewaan.';
    formError.hidden = false;
    return;
  }

  try {
    await apiRequest(`/api/trips/${tripId}/items`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
    window.location.href = `/summary.html?tripId=${tripId}`;
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
  }
});

async function init() {
  try {
    const trip = await apiRequest(`/api/trips/${tripId}`);
    participants = trip.participants;
    tripNameEl.textContent = '📍 ' + trip.name;

    if (trip.items.length > 0) {
      for (const item of trip.items) {
        const card = createItemCard();
        card.querySelector('.item-name').value = item.name;
        card.querySelector('.item-price').value = formatPriceInput(item.price);
        for (const pid of item.participantIds) {
          const chip = card.querySelector(`[data-participant-id="${pid}"]`);
          if (chip) chip.classList.add('chip--active');
        }
        itemsContainer.appendChild(card);
      }
      updateCardNumbers();
    } else {
      addItemCard();
    }
  } catch {
    window.location.href = '/create-trip.html';
  }
}

init();

const participantList = document.getElementById('participant-list');
const addBtn = document.getElementById('add-participant');
const form = document.getElementById('create-trip-form');
const formError = document.getElementById('form-error');

function updateParticipantNumbers() {
  participantList.querySelectorAll('.participant-row').forEach((row, i) => {
    row.querySelector('.participant-row__num').textContent = i + 1;
  });
}

function createParticipantRow(value = '') {
  const row = document.createElement('div');
  row.className = 'participant-row';

  const num = document.createElement('span');
  num.className = 'participant-row__num';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input';
  input.placeholder = 'Contoh: Samuel';
  input.value = value;
  input.required = true;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-ghost btn-icon';
  removeBtn.innerHTML = '&times;';
  removeBtn.title = 'Hapus peserta';
  removeBtn.setAttribute('aria-label', 'Hapus peserta');
  removeBtn.addEventListener('click', () => {
    if (participantList.children.length > 1) {
      row.remove();
      updateParticipantNumbers();
    }
  });

  row.appendChild(num);
  row.appendChild(input);
  row.appendChild(removeBtn);
  return row;
}

function addParticipant(value = '') {
  participantList.appendChild(createParticipantRow(value));
  updateParticipantNumbers();
}

addBtn.addEventListener('click', () => addParticipant());

addParticipant();
addParticipant();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const name = document.getElementById('trip-name').value.trim();
  const inputs = participantList.querySelectorAll('.participant-row .form-input');
  const participants = [...inputs].map((i) => i.value.trim()).filter(Boolean);

  if (participants.length === 0) {
    formError.textContent = 'Tambahkan minimal 1 peserta.';
    formError.hidden = false;
    return;
  }

  const lower = participants.map((p) => p.toLowerCase());
  if (new Set(lower).size !== lower.length) {
    formError.textContent = 'Nama peserta tidak boleh sama.';
    formError.hidden = false;
    return;
  }

  try {
    const { tripId } = await apiRequest('/api/trips', {
      method: 'POST',
      body: JSON.stringify({ name, participants }),
    });
    window.location.href = `/add-items.html?tripId=${tripId}`;
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
  }
});

const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/database');
const { calculateSplit } = require('./lib/splitCalculator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getTripOr404(tripId, res) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return null;
  }
  return trip;
}

app.post('/api/trips', (req, res) => {
  const { name, participants } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Trip name is required' });
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'At least one participant is required' });
  }

  const trimmed = participants.map((p) => p.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'At least one participant is required' });
  }

  const unique = new Set(trimmed.map((p) => p.toLowerCase()));
  if (unique.size !== trimmed.length) {
    return res.status(400).json({ error: 'Participant names must be unique' });
  }

  const tripId = uuidv4();
  const insertTrip = db.prepare('INSERT INTO trips (id, name) VALUES (?, ?)');
  const insertParticipant = db.prepare(
    'INSERT INTO participants (id, trip_id, name, sort_order) VALUES (?, ?, ?, ?)'
  );

  const createTrip = db.transaction(() => {
    insertTrip.run(tripId, name.trim());
    trimmed.forEach((pName, index) => {
      insertParticipant.run(uuidv4(), tripId, pName, index);
    });
  });

  createTrip();
  res.status(201).json({ tripId });
});

app.get('/api/trips/:id', (req, res) => {
  const trip = getTripOr404(req.params.id, res);
  if (!trip) return;

  const participants = db
    .prepare('SELECT id, name, sort_order FROM participants WHERE trip_id = ? ORDER BY sort_order')
    .all(trip.id);

  const items = db
    .prepare('SELECT id, name, price FROM items WHERE trip_id = ? ORDER BY rowid')
    .all(trip.id);

  const getUsers = db.prepare(
    'SELECT participant_id FROM item_users WHERE item_id = ?'
  );

  const itemsWithUsers = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    participantIds: getUsers.all(item.id).map((u) => u.participant_id),
  }));

  res.json({
    id: trip.id,
    name: trip.name,
    participants,
    items: itemsWithUsers,
  });
});

app.put('/api/trips/:id/items', (req, res) => {
  const trip = getTripOr404(req.params.id, res);
  if (!trip) return;

  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  const participants = db
    .prepare('SELECT id FROM participants WHERE trip_id = ?')
    .all(trip.id);
  const participantIds = new Set(participants.map((p) => p.id));

  for (const item of items) {
    if (!item.name || !item.name.trim()) {
      return res.status(400).json({ error: 'Each item must have a name' });
    }
    if (!item.price || item.price <= 0) {
      return res.status(400).json({ error: 'Each item must have a price greater than 0' });
    }
    if (!Array.isArray(item.participantIds) || item.participantIds.length === 0) {
      return res.status(400).json({ error: 'Each item must have at least one user' });
    }
    for (const pid of item.participantIds) {
      if (!participantIds.has(pid)) {
        return res.status(400).json({ error: 'Invalid participant for item' });
      }
    }
  }

  const deleteItems = db.prepare('DELETE FROM items WHERE trip_id = ?');
  const insertItem = db.prepare(
    'INSERT INTO items (id, trip_id, name, price) VALUES (?, ?, ?, ?)'
  );
  const insertItemUser = db.prepare(
    'INSERT INTO item_users (item_id, participant_id) VALUES (?, ?)'
  );

  const saveItems = db.transaction(() => {
    deleteItems.run(trip.id);
    for (const item of items) {
      const itemId = uuidv4();
      insertItem.run(itemId, trip.id, item.name.trim(), Math.round(item.price));
      for (const pid of item.participantIds) {
        insertItemUser.run(itemId, pid);
      }
    }
  });

  saveItems();
  res.json({ success: true });
});

app.get('/api/trips/:id/summary', (req, res) => {
  const trip = getTripOr404(req.params.id, res);
  if (!trip) return;

  const participants = db
    .prepare('SELECT id, name, sort_order as sortOrder FROM participants WHERE trip_id = ? ORDER BY sort_order')
    .all(trip.id);

  const rawItems = db
    .prepare('SELECT id, name, price FROM items WHERE trip_id = ? ORDER BY rowid')
    .all(trip.id);

  if (rawItems.length === 0) {
    return res.status(400).json({ error: 'No items found for this trip' });
  }

  const getUsers = db.prepare(`
    SELECT p.id, p.name, p.sort_order as sortOrder
    FROM item_users iu
    JOIN participants p ON p.id = iu.participant_id
    WHERE iu.item_id = ?
    ORDER BY p.sort_order
  `);

  const items = rawItems.map((item) => ({
    name: item.name,
    price: item.price,
    users: getUsers.all(item.id),
  }));

  const result = calculateSplit(participants, items);

  res.json({
    tripName: trip.name,
    ...result,
  });
});

app.listen(PORT, () => {
  console.log(`SplitGo running at http://localhost:${PORT}`);
});

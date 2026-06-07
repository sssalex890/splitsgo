function calculateSplit(participants, items) {
  const totals = new Map();
  const breakdown = new Map();

  for (const p of participants) {
    totals.set(p.id, 0);
    breakdown.set(p.id, { participantId: p.id, name: p.name, items: [], total: 0 });
  }

  for (const item of items) {
    const users = item.users;
    if (!users || users.length === 0) continue;

    const baseShare = Math.floor(item.price / users.length);
    const remainder = item.price % users.length;

    const sortedUsers = [...users].sort((a, b) => a.sortOrder - b.sortOrder);

    sortedUsers.forEach((user, index) => {
      const amount = baseShare + (index < remainder ? 1 : 0);
      totals.set(user.id, (totals.get(user.id) || 0) + amount);

      const entry = breakdown.get(user.id);
      if (entry) {
        entry.items.push({ name: item.name, amount });
        entry.total += amount;
      }
    });
  }

  const participantOrder = [...participants].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    totals: participantOrder.map((p) => ({
      participantId: p.id,
      name: p.name,
      total: totals.get(p.id) || 0,
    })),
    breakdown: participantOrder.map((p) => breakdown.get(p.id)),
  };
}

module.exports = { calculateSplit };

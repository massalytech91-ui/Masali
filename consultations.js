/* ===== Service CONSULTATIONS / DOSSIER MĆ‰DICAL ===== */
const Consultations = (() => {
  async function save(data, id) {
    if (!data.patientId) throw new Error('required');
    const base = id ? await DB.get('consultations', id) : null;
    const c = Object.assign({
      id: id || DB.uuid(),
      createdAt: base ? base.createdAt : DB.now(),
      deleted: false
    }, base, {
      patientId: data.patientId,
      date: data.date || DB.now().slice(0, 10),
      reason: (data.reason || '').trim(),
      observations: (data.observations || '').trim(),
      diagnosis: (data.diagnosis || '').trim(),
      updatedAt: DB.now(), syncStatus: 'pending'
    });
    await DB.put('consultations', c);
    await Sync.enqueue('consultation', 'upsert', c);
    return c;
  }

  async function forPatient(patientId) {
    const list = await DB.byIndex('consultations', 'patientId', patientId);
    return list.filter(c => !c.deleted)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  async function get(id) { return DB.get('consultations', id); }

  return { save, forPatient, get };
})();

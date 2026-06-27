/* ===== Service ORDONNANCES ===== */
const Prescriptions = (() => {
  async function save(data, id) {
    if (!data.consultationId || !data.patientId) throw new Error('required');
    const items = (data.items || []).filter(i => (i.name || '').trim());
    if (!items.length) throw new Error('no_meds');
    const base = id ? await DB.get('prescriptions', id) : null;
    const p = Object.assign({
      id: id || DB.uuid(),
      createdAt: base ? base.createdAt : DB.now(),
      deleted: false
    }, base, {
      consultationId: data.consultationId,
      patientId: data.patientId,
      date: data.date || DB.now().slice(0, 10),
      items: items.map(i => ({
        name: i.name.trim(), dosage: (i.dosage || '').trim(),
        duration: (i.duration || '').trim(), instructions: (i.instructions || '').trim()
      })),
      notes: (data.notes || '').trim(),
      updatedAt: DB.now(), syncStatus: 'pending'
    });
    await DB.put('prescriptions', p);
    await Sync.enqueue('prescription', 'upsert', p);
    return p;
  }

  async function forConsultation(consultationId) {
    const list = await DB.byIndex('prescriptions', 'consultationId', consultationId);
    return list.filter(p => !p.deleted)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  async function get(id) { return DB.get('prescriptions', id); }

  return { save, forConsultation, get };
})();

/* ===== Service PATIENTS (logique mĆ©tier) =====
   Validation + normalisation + recherche rapide.
   La recherche s'appuie sur un searchKey prĆ©-calculĆ© (sans accents) :
   reste rapide sur quelques milliers de fiches car on filtre en mĆ©moire
   une fois, et l'index pourra passer cĆ´tĆ© serveur plus tard. */
const Patients = (() => {
  const strip = (s) => (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function searchKey(p) {
    return [p.firstName, p.lastName, (p.phone || '').replace(/\s/g, '')]
      .map(strip).join(' ');
  }

  async function save(data, id) {
    if (!data.firstName || !data.lastName)
      throw new Error('required');
    const base = id ? await DB.get('patients', id) : null;
    const p = Object.assign({
      id: id || DB.uuid(),
      createdAt: base ? base.createdAt : DB.now(),
      deleted: false, syncStatus: 'pending'
    }, base, {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: (data.phone || '').trim(),
      birthDate: data.birthDate || '',
      approxAge: data.approxAge ? Number(data.approxAge) : null,
      sex: data.sex || '',
      address: (data.address || '').trim(),
      history: (data.history || '').trim(),
      updatedAt: DB.now(), syncStatus: 'pending'
    });
    p.searchKey = searchKey(p);
    await DB.put('patients', p);
    await Sync.enqueue('patient', 'upsert', p);
    return p;
  }

  async function remove(id) {
    const p = await DB.get('patients', id);
    if (!p) return;
    p.deleted = true; p.updatedAt = DB.now(); p.syncStatus = 'pending';
    await DB.put('patients', p);
    await Sync.enqueue('patient', 'delete', { id });
  }

  async function get(id) { return DB.get('patients', id); }

  async function search(query) {
    const all = (await DB.all('patients')).filter(p => !p.deleted);
    all.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    if (!query) return all;
    const q = strip(query);
    return all.filter(p => p.searchKey.includes(q));
  }

  function ageLabel(p) {
    if (p.birthDate) {
      const d = new Date(p.birthDate);
      const a = Math.floor((Date.now() - d) / 31557600000);
      return `${a} ${t('years')}`;
    }
    if (p.approxAge) return `~${p.approxAge} ${t('years')}`;
    return t('unknown');
  }

  return { save, remove, get, search, ageLabel };
})();

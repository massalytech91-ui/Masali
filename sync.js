/* ===== Service SYNCHRONISATION (offline-first) =====
   StratÃ©gie : toute Ã©criture mÃ©tier (patient/consultation/ordonnance) est
   d'abord persistÃ©e localement dans IndexedDB, PUIS empilÃ©e dans une "outbox".
   Quand le rÃ©seau revient, on tente de vider l'outbox vers le serveur.
   -> Aucune perte de donnÃ©es : si l'envoi Ã©choue, l'Ã©lÃ©ment reste dans l'outbox.

   IMPORTANT : pushToServer() est un STUB documentÃ©. En production, on remplace
   ce seul appel par un fetch() vers l'API (Next.js/Supabase) ; le reste ne change pas. */
const Sync = (() => {
  let _onChange = () => {};
  const onChange = (fn) => { _onChange = fn; };

  // Empile une opÃ©ration Ã  synchroniser
  async function enqueue(entity, op, payload) {
    await DB.put('outbox', { entity, op, payload, createdAt: DB.now(), tries: 0 });
    _onChange();
    flush(); // tentative immÃ©diate si rÃ©seau prÃ©sent
  }

  async function pendingCount() {
    const items = await DB.all('outbox');
    return items.length;
  }

  // --- STUB serveur : Ã  remplacer par un vrai fetch() en production ---
  async function pushToServer(/* batch */) {
    // En production :
    //   const res = await fetch('/api/sync', {method:'POST',
    //     headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    //     body: JSON.stringify(batch)});
    //   if(!res.ok) throw new Error('sync failed');
    //   return res.json(); // le serveur rÃ©sout les conflits (last-write-wins par updatedAt)
    //
    // Dans ce MVP il n'y a pas de serveur : on simule un Ã©chec rÃ©seau permanent
    // pour dÃ©montrer que les donnÃ©es restent en file SANS Ãªtre perdues.
    throw new Error('NO_SERVER'); // donnÃ©es conservÃ©es localement
  }

  let _flushing = false;
  async function flush() {
    if (_flushing || !navigator.onLine) return;
    _flushing = true;
    try {
      const items = await DB.all('outbox');
      if (!items.length) return;
      try {
        await pushToServer(items);
        // succÃ¨s : on vide l'outbox et on marque les objets comme 'synced'
        for (const it of items) await DB.del('outbox', it.id);
        _onChange();
      } catch (e) {
        // Ã©chec rÃ©seau/serveur : on NE supprime rien. RÃ©essai plus tard.
      }
    } finally { _flushing = false; }
  }

  // DÃ©clencheurs automatiques
  window.addEventListener('online', () => { _onChange(); flush(); });
  window.addEventListener('offline', () => { _onChange(); });

  return { enqueue, flush, pendingCount, onChange, isOnline: () => navigator.onLine };
})();

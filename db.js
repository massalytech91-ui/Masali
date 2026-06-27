/* ===== Couche ACCÃˆS DONNÃ‰ES (IndexedDB) =====
   Aucune logique mÃ©tier ici : juste lire/Ã©crire des objets.
   C'est le SEUL fichier Ã  rÃ©Ã©crire pour brancher un vrai backend. */
const DB = (() => {
  const NAME = 'ehr_db';
  const VERSION = 1;
  const STORES = {
    practitioners: 'email',
    patients: 'id',
    consultations: 'id',
    prescriptions: 'id',
    outbox: '++id',
    meta: 'key'
  };
  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('practitioners'))
          db.createObjectStore('practitioners', { keyPath: 'email' });
        for (const s of ['patients', 'consultations', 'prescriptions']) {
          if (!db.objectStoreNames.contains(s)) {
            const os = db.createObjectStore(s, { keyPath: 'id' });
            if (s === 'consultations' || s === 'prescriptions')
              os.createIndex('patientId', 'patientId', { unique: false });
            if (s === 'prescriptions')
              os.createIndex('consultationId', 'consultationId', { unique: false });
          }
        }
        if (!db.objectStoreNames.contains('outbox'))
          db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('meta'))
          db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const os = t.objectStore(store);
      const r = fn(os);
      t.oncomplete = () => resolve(r && r.result !== undefined ? r.result : r);
      t.onerror = () => reject(t.error);
    }));
  }

  const put = (store, obj) => tx(store, 'readwrite', os => os.put(obj)).then(() => obj);
  const get = (store, key) => tx(store, 'readonly', os => os.get(key));
  const del = (store, key) => tx(store, 'readwrite', os => os.delete(key));

  function all(store) {
    return tx(store, 'readonly', os => os.getAll());
  }
  function byIndex(store, index, value) {
    return open().then(db => new Promise((resolve, reject) => {
      const os = db.transaction(store, 'readonly').objectStore(store);
      const req = os.index(index).getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  // Helpers communs mÃ©tier
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }));
  const now = () => new Date().toISOString();

  return { open, put, get, del, all, byIndex, uuid, now, STORES };
})();

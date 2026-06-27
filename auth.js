/* ===== Service AUTHENTIFICATION =====
   Auth locale MVP : mot de passe hashé en PBKDF2 (jamais stocké en clair).
   Pas de vérification serveur dans ce MVP (voir notes production).
   La session courante est gardée en mémoire + clé 'meta' pour la persistance. */
const Auth = (() => {
  const enc = new TextEncoder();
  let _current = null;

  async function hash(password, saltHex) {
    const salt = saltHex
      ? Uint8Array.from(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)))
      : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', enc.encode(password),
      'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
    const hex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
    const saltOut = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash: hex, salt: saltOut };
  }

  async function register({ clinicName, fullName, email, password }) {
    email = email.trim().toLowerCase();
    const existing = await DB.get('practitioners', email);
    if (existing) throw new Error('email_used');
    const { hash: h, salt } = await hash(password);
    const rec = { id: DB.uuid(), clinicName, fullName, email,
      passwordHash: h, passwordSalt: salt, createdAt: DB.now() };
    await DB.put('practitioners', rec);
    return login({ email, password });
  }

  async function login({ email, password }) {
    email = email.trim().toLowerCase();
    const rec = await DB.get('practitioners', email);
    if (!rec) throw new Error('bad_login');
    const { hash: h } = await hash(password, rec.passwordSalt);
    if (h !== rec.passwordHash) throw new Error('bad_login');
    _current = { email: rec.email, clinicName: rec.clinicName, fullName: rec.fullName };
    await DB.put('meta', { key: 'session', value: _current });
    return _current;
  }

  async function restore() {
    const s = await DB.get('meta', 'session');
    _current = s ? s.value : null;
    return _current;
  }
  async function logout() { _current = null; await DB.del('meta', 'session'); }
  const current = () => _current;

  // Reset password locally (MVP). Replaces the stored hash+salt for the given email.
  // Returns true on success, throws 'not_found' if user missing.
  async function resetPassword({ email, newPassword }) {
    email = email.trim().toLowerCase();
    const rec = await DB.get('practitioners', email);
    if (!rec) throw new Error('not_found');
    const { hash: h, salt } = await hash(newPassword);
    rec.passwordHash = h;
    rec.passwordSalt = salt;
    await DB.put('practitioners', rec);
    return true;
  }

  return { register, login, restore, logout, current, resetPassword };
})();

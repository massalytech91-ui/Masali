/* ===== Couche UI (rendu + navigation) =====
   Vanilla JS, rendu par Ã©crans. Aucun texte codÃ© en dur -> t(). */
const UI = (() => {
  const app = document.getElementById('app');
  const h = (s) => (s || '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let state = { screen: 'login', patientId: null, consultationId: null };

  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function netBadge() {
    const on = Sync.isOnline();
    const n = await Sync.pendingCount();
    return `<span class="netdot"><span class="dot ${on ? 'on' : 'off'}"></span>
      ${on ? t('online') : t('offline')}${n ? ' Â· ' + n + ' ' + t('pending_sync') : ''}</span>`;
  }

  function topbar(title, back) {
    return `<div class="topbar">
      ${back ? `<button class="back" data-act="${back}">â€¹</button>` : ''}
      <h1>${h(title)}</h1><span id="net"></span></div>`;
  }
  async function paintNet() { const e = document.getElementById('net'); if (e) e.innerHTML = await netBadge(); }

  // ---------- AUTH ----------
  function loginScreen(mode = 'login') {
    const reg = mode === 'register';
    app.innerHTML = `${topbar(t('app_title'))}
    <div class="content">
      <div class="logo">ðŸ©º</div>
      <p class="center muted">${t('login_subtitle')}</p>
      <div class="card">
        ${reg ? field('clinic_name', 'clinicName') + field('practitioner_name', 'fullName') : ''}
        ${field('email', 'email', 'email')}
        ${field('password', 'password', 'password')}
        <button class="btn" data-act="${reg ? 'doRegister' : 'doLogin'}">
          ${reg ? t('register') : t('login')}</button>
        <p class="center" style="margin-top:14px">
          <a class="link" data-act="${reg ? 'toLogin' : 'toRegister'}">
          ${reg ? t('have_account') : t('no_account')}</a></p>
      </div>
    </div>`;
  }
  const field = (label, name, type = 'text', val = '') =>
    `<label>${t(label)}</label><input id="f_${name}" type="${type}" value="${h(val)}">`;
  const fieldArea = (label, name, val = '') =>
    `<label>${t(label)}</label><textarea id="f_${name}">${h(val)}</textarea>`;
  const v = (name) => (document.getElementById('f_' + name) || {}).value || '';

  // ---------- PATIENTS LIST ----------
  async function patientsScreen(query = '') {
    const list = await Patients.search(query);
    app.innerHTML = `${topbar(Auth.current().clinicName || t('patients'))}
    <div class="content">
      <div class="search"><input id="q" placeholder="${t('search_patient')}" value="${h(query)}"></div>
      <div class="sectiontitle">${t('patients')} (${list.length})</div>
      <ul class="list">${list.map(patientItem).join('') ||
        `<div class="empty"><div class="big">ðŸ‘¥</div>${t('no_patients')}<br>
         <small>${t('no_patients_hint')}</small></div>`}</ul>
      <p class="center"><a class="link" data-act="logout">${t('logout')}</a></p>
    </div>
    <button class="fab" data-act="newPatient">+</button>`;
    const q = document.getElementById('q');
    q.oninput = () => patientsScreen(q.value).then(() => {
      const nq = document.getElementById('q'); nq.focus();
      nq.setSelectionRange(nq.value.length, nq.value.length);
    });
    paintNet();
  }
  function patientItem(p) {
    const init = (p.firstName[0] || '') + (p.lastName[0] || '');
    const pend = p.syncStatus === 'pending' ? `<span class="pill pending">${t('pending_sync')}</span>` : '';
    return `<li class="item" data-act="openPatient" data-id="${p.id}">
      <span class="av">${h(init.toUpperCase())}</span>
      <span class="meta"><strong>${h(p.firstName)} ${h(p.lastName)}</strong>
        <small>${Patients.ageLabel(p)}${p.phone ? ' Â· ' + h(p.phone) : ''} ${pend}</small></span>
      <span class="chev">â€º</span></li>`;
  }

  // ---------- PATIENT FORM ----------
  async function patientForm(id) {
    const p = id ? await Patients.get(id) : {};
    app.innerHTML = `${topbar(id ? t('edit') : t('new_patient'), id ? 'back2patient' : 'back2list')}
    <div class="content"><div class="card">
      <div class="row">${field('first_name', 'firstName', 'text', p.firstName)}
        ${field('last_name', 'lastName', 'text', p.lastName)}</div>
      ${field('phone', 'phone', 'tel', p.phone)}
      <div class="row">${field('birthdate', 'birthDate', 'date', p.birthDate)}
        ${field('approx_age', 'approxAge', 'number', p.approxAge || '')}</div>
      <label>${t('sex')}</label><select id="f_sex">
        <option value="">â€”</option>
        <option value="M" ${p.sex === 'M' ? 'selected' : ''}>${t('male')}</option>
        <option value="F" ${p.sex === 'F' ? 'selected' : ''}>${t('female')}</option>
        <option value="autre" ${p.sex === 'autre' ? 'selected' : ''}>${t('other')}</option></select>
      ${field('address', 'address', 'text', p.address)}
      ${fieldArea('history', 'history', p.history)}
      <button class="btn" data-act="savePatient" data-id="${id || ''}">${t('save')}</button>
      ${id ? `<button class="btn danger" data-act="delPatient" data-id="${id}">${t('delete')}</button>` : ''}
    </div></div>`;
  }

  // ---------- PATIENT DETAIL + RECORD ----------
  async function patientDetail(id) {
    const p = await Patients.get(id);
    const cons = await Consultations.forPatient(id);
    app.innerHTML = `${topbar(p.firstName + ' ' + p.lastName, 'back2list')}
    <div class="content">
      <div class="card"><h2>${h(p.firstName)} ${h(p.lastName)}</h2>
        <p class="muted">${Patients.ageLabel(p)}${p.sex ? ' Â· ' + h(sexLabel(p.sex)) : ''}${p.phone ? ' Â· ' + h(p.phone) : ''}</p>
        ${p.address ? `<p class="muted">ðŸ“ ${h(p.address)}</p>` : ''}
        ${p.history ? `<p><strong>${t('history')} :</strong> ${h(p.history)}</p>` : ''}
        <button class="btn sec inline" data-act="editPatient" data-id="${id}">${t('edit')}</button></div>
      <div class="sectiontitle">${t('consultations')} (${cons.length})</div>
      <ul class="list">${cons.map(consItem).join('') ||
        `<div class="empty">${t('no_consultations')}</div>`}</ul>
      <button class="btn" data-act="newConsultation" data-id="${id}">+ ${t('new_consultation')}</button>
    </div>`;
    paintNet();
  }
  const sexLabel = (s) => ({ M: t('male'), F: t('female'), autre: t('other') }[s] || s);
  function consItem(c) {
    return `<li class="item" data-act="openConsultation" data-id="${c.id}">
      <span class="av">ðŸ“‹</span><span class="meta">
      <strong>${h(new Date(c.date).toLocaleDateString('fr-FR'))}</strong>
      <small>${h(c.reason || c.diagnosis || 'â€”')}</small></span><span class="chev">â€º</span></li>`;
  }

  // ---------- CONSULTATION FORM ----------
  async function consultationForm(patientId) {
    app.innerHTML = `${topbar(t('new_consultation'), 'back2patient')}
    <div class="content"><div class="card">
      ${field('date', 'date', 'date', DB.now().slice(0, 10))}
      ${field('reason', 'reason')}
      ${fieldArea('observations', 'observations')}
      ${fieldArea('diagnosis', 'diagnosis')}
      <button class="btn" data-act="saveConsultation" data-id="${patientId}">${t('save')}</button>
    </div></div>`;
  }

  // ---------- CONSULTATION DETAIL + PRESCRIPTIONS ----------
  async function consultationDetail(id) {
    const c = await Consultations.get(id);
    const rx = await Prescriptions.forConsultation(id);
    app.innerHTML = `${topbar(t('medical_record'), 'back2patientFromCons')}
    <div class="content">
      <div class="card">
        <p class="muted">${h(new Date(c.date).toLocaleDateString('fr-FR'))}</p>
        <p><strong>${t('reason')} :</strong> ${h(c.reason || 'â€”')}</p>
        ${c.observations ? `<p><strong>${t('observations')} :</strong> ${h(c.observations)}</p>` : ''}
        <p><strong>${t('diagnosis')} :</strong> ${h(c.diagnosis || 'â€”')}</p></div>
      <div class="sectiontitle">${t('prescriptions')} (${rx.length})</div>
      <ul class="list">${rx.map(r => `<li class="item" data-act="openRx" data-id="${r.id}">
        <span class="av">â„ž</span><span class="meta"><strong>${r.items.length} ${t('medication')}(s)</strong>
        <small>${h(new Date(r.date).toLocaleDateString('fr-FR'))}</small></span>
        <span class="chev">â€º</span></li>`).join('') || `<div class="empty">â€”</div>`}</ul>
      <button class="btn" data-act="newRx" data-cid="${id}" data-pid="${c.patientId}">+ ${t('new_prescription')}</button>
    </div>`;
    paintNet();
  }

  // ---------- PRESCRIPTION FORM ----------
  let rxItems = [{}];
  function rxForm(consultationId, patientId) {
    rxItems = [{}];
    renderRx(consultationId, patientId);
  }
  function medRow(m, i) {
    return `<div class="med-item">
      ${rxItems.length > 1 ? `<button class="rm" data-act="rmMed" data-i="${i}">âœ•</button>` : ''}
      <input data-med="${i}" data-k="name" placeholder="${t('medication')}" value="${h(m.name || '')}">
      <div class="row" style="margin-top:8px">
        <input data-med="${i}" data-k="dosage" placeholder="${t('dosage')}" value="${h(m.dosage || '')}">
        <input data-med="${i}" data-k="duration" placeholder="${t('duration')}" value="${h(m.duration || '')}"></div>
      <input data-med="${i}" data-k="instructions" placeholder="${t('instructions')}" value="${h(m.instructions || '')}" style="margin-top:8px">
    </div>`;
  }
  function renderRx(cid, pid) {
    app.innerHTML = `${topbar(t('new_prescription'), 'back2cons')}
    <div class="content"><div class="card">
      <div id="meds">${rxItems.map(medRow).join('')}</div>
      <button class="btn sec" data-act="addMed">+ ${t('add_medication')}</button>
      ${fieldArea('advice', 'notes')}
      <button class="btn" data-act="saveRx" data-cid="${cid}" data-pid="${pid}">${t('save')} + ${t('generate_pdf')}</button>
    </div></div>`;
    document.querySelectorAll('[data-med]').forEach(inp => inp.oninput = () => {
      rxItems[+inp.dataset.med][inp.dataset.k] = inp.value;
    });
  }

  // ---------- PRESCRIPTION DETAIL ----------
  async function rxDetail(id) {
    const r = await Prescriptions.get(id);
    const p = await Patients.get(r.patientId);
    app.innerHTML = `${topbar(t('prescription'), 'back2consFromRx')}
    <div class="content"><div class="card">
      <p class="muted">${h(new Date(r.date).toLocaleDateString('fr-FR'))} Â· ${h(p.firstName)} ${h(p.lastName)}</p>
      ${r.items.map(m => `<div class="med-item"><strong>${h(m.name)}</strong> ${h(m.dosage)}
        <div class="muted">${h(m.instructions)}${m.duration ? ' Â· ' + h(m.duration) : ''}</div></div>`).join('')}
      ${r.notes ? `<p class="muted">${h(r.notes)}</p>` : ''}
      <button class="btn" data-act="printRx" data-id="${id}">ðŸ–¨ï¸ ${t('print_pdf')}</button>
    </div></div>`;
    window._lastRxId = id;
  }

  // ---------- ROUTER / ACTIONS ----------
  app.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    try {
      switch (act) {
        case 'toRegister': loginScreen('register'); break;
        case 'toLogin': loginScreen('login'); break;
        case 'doLogin':
          await Auth.login({ email: v('email'), password: v('password') });
          state.screen = 'patients'; patientsScreen(); break;
        case 'doRegister':
          await Auth.register({ clinicName: v('clinicName'), fullName: v('fullName'),
            email: v('email'), password: v('password') });
          patientsScreen(); break;
        case 'logout': await Auth.logout(); loginScreen(); break;
        case 'back2list': patientsScreen(); break;
        case 'newPatient': patientForm(); break;
        case 'openPatient': state.patientId = id; patientDetail(id); break;
        case 'editPatient': patientForm(id); break;
        case 'back2patient': patientDetail(state.patientId); break;
        case 'savePatient': {
          await Patients.save({ firstName: v('firstName'), lastName: v('lastName'),
            phone: v('phone'), birthDate: v('birthDate'), approxAge: v('approxAge'),
            sex: v('sex'), address: v('address'), history: v('history') }, id || null);
          toast(Sync.isOnline() ? t('saved') : t('saved_offline'));
          patientsScreen(); break; }
        case 'delPatient':
          if (confirm(t('confirm_delete'))) { await Patients.remove(id); patientsScreen(); } break;
        case 'newConsultation': consultationForm(id); break;
        case 'saveConsultation':
          await Consultations.save({ patientId: id, date: v('date'), reason: v('reason'),
            observations: v('observations'), diagnosis: v('diagnosis') });
          toast(Sync.isOnline() ? t('saved') : t('saved_offline'));
          patientDetail(id); break;
        case 'openConsultation': state.consultationId = id; consultationDetail(id); break;
        case 'back2patientFromCons': patientDetail(state.patientId); break;
        case 'newRx': rxForm(el.dataset.cid, el.dataset.pid); break;
        case 'addMed': rxItems.push({}); renderRx(el.closest('.content') && state.consultationId, state.patientId);
          // re-render keeps cid/pid via saveRx button below
          break;
        case 'rmMed': rxItems.splice(+el.dataset.i, 1); renderRx(state.consultationId, state.patientId); break;
        case 'saveRx': {
          const r = await Prescriptions.save({ consultationId: el.dataset.cid,
            patientId: el.dataset.pid, items: rxItems, notes: v('notes') });
          toast(Sync.isOnline() ? t('saved') : t('saved_offline'));
          const p = await Patients.get(el.dataset.pid);
          PDFOrdonnance.open(r, p, Auth.current());
          consultationDetail(el.dataset.cid); break; }
        case 'openRx': rxDetail(id); break;
        case 'back2cons': consultationDetail(state.consultationId); break;
        case 'back2consFromRx': consultationDetail(state.consultationId); break;
        case 'printRx': {
          const r = await Prescriptions.get(id);
          const p = await Patients.get(r.patientId);
          PDFOrdonnance.open(r, p, Auth.current()); break; }
      }
    } catch (err) { toast(t(err.message) || 'Erreur'); }
  });

  Sync.onChange(paintNet);
  setInterval(paintNet, 4000);

  async function start() {
    await DB.open();
    const s = await Auth.restore();
    if (s) patientsScreen(); else loginScreen();
  }
  return { start };
})();
UI.start();

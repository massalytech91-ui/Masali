/* ===== GÃ©nÃ©ration ORDONNANCE imprimable =====
   Approche volontairement SANS librairie lourde : on ouvre une fenÃªtre
   d'impression HTML que le navigateur convertit en PDF natif via window.print().
   -> Fonctionne sur vieux tÃ©lÃ©phones/PC, imprimable directement,
      "Enregistrer en PDF" ou partage selon l'appareil.

   NOTE CONFORMITÃ‰ : l'en-tÃªte (clinique/praticien) et la zone signature sont
   configurables. La conformitÃ© rÃ©glementaire de l'ordonnance au SÃ©nÃ©gal
   (mentions obligatoires, nÂ° d'ordre du praticien, cachet) RESTE Ã€ VALIDER. */
const PDFOrdonnance = (() => {
  const esc = (s) => (s || '').replace(/[&<>]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function build(prescription, patient, practitioner) {
    const d = new Date(prescription.date).toLocaleDateString('fr-FR');
    const rows = prescription.items.map((m, i) => `
      <div class="med">
        <div class="num">${i + 1}</div>
        <div>
          <strong>${esc(m.name)}</strong> ${m.dosage ? 'â€” ' + esc(m.dosage) : ''}
          <div class="sub">${esc(m.instructions)}${m.duration ? ' â€¢ ' + esc(m.duration) : ''}</div>
        </div>
      </div>`).join('');
    const age = patient.birthDate
      ? Math.floor((Date.now() - new Date(patient.birthDate)) / 31557600000) + ' ans'
      : (patient.approxAge ? '~' + patient.approxAge + ' ans' : '');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
    <title>Ordonnance</title><style>
      *{font-family:Georgia,serif;color:#1a2421}
      body{margin:0;padding:32px 36px}
      .head{display:flex;justify-content:space-between;border-bottom:2px solid #0a7d5a;padding-bottom:10px}
      .clinic{font-size:20px;font-weight:bold;color:#0a7d5a}
      .doc{font-size:13px;text-align:right;color:#444}
      h1{font-size:18px;letter-spacing:3px;text-align:center;margin:22px 0 4px}
      .pt{background:#f4f6f5;border-radius:8px;padding:10px 14px;font-size:14px;margin:14px 0}
      .med{display:flex;gap:12px;padding:10px 0;border-bottom:1px dashed #ccc}
      .num{width:24px;height:24px;border-radius:50%;background:#0a7d5a;color:#fff;
        display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
      .sub{font-size:13px;color:#555;margin-top:2px}
      .notes{margin-top:16px;font-size:13px;font-style:italic}
      .sign{margin-top:46px;text-align:right;font-size:13px}
      .sign .line{display:inline-block;border-top:1px solid #333;width:200px;padding-top:4px}
      @media print{body{padding:18px}}
    </style></head><body>
      <div class="head">
        <div><div class="clinic">${esc(practitioner.clinicName || 'Clinique')}</div></div>
        <div class="doc">Dr ${esc(practitioner.fullName || '')}<br>${d}</div>
      </div>
      <h1>ORDONNANCE</h1>
      <div class="pt"><strong>${esc(patient.firstName)} ${esc(patient.lastName)}</strong>
        &nbsp; ${age} &nbsp; ${patient.sex ? 'â€¢ ' + esc(patient.sex) : ''}
        ${patient.phone ? 'â€¢ ' + esc(patient.phone) : ''}</div>
      ${rows}
      ${prescription.notes ? `<div class="notes">Conseils : ${esc(prescription.notes)}</div>` : ''}
      <div class="sign"><span class="line">Signature et cachet</span></div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
    </body></html>`;
  }

  function open(prescription, patient, practitioner) {
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les pop-ups pour gÃ©nÃ©rer le PDF.'); return; }
    w.document.write(build(prescription, patient, practitioner));
    w.document.close();
  }

  return { open, build };
})();

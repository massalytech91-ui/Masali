/* ===== i18n : structure prÃªte pour le wolof =====
   Pour ajouter le wolof : crÃ©er I18N.wo = {...} et changer I18N.lang.
   Aucun texte ne doit Ãªtre codÃ© en dur dans l'UI : tout passe par t(). */
const I18N = {
  lang: 'fr',
  fr: {
    app_title: 'Dossier MÃ©dical',
    // Auth
    login: 'Se connecter', register: 'CrÃ©er un compte', logout: 'DÃ©connexion',
    email: 'Email', password: 'Mot de passe', clinic_name: 'Nom de la clinique',
    practitioner_name: 'Nom du praticien', no_account: 'Pas de compte ? CrÃ©er',
    have_account: 'DÃ©jÃ  un compte ? Se connecter',
    bad_login: 'Email ou mot de passe incorrect', email_used: 'Cet email existe dÃ©jÃ ',
    welcome: 'Bienvenue', login_subtitle: 'AccÃ©dez Ã  vos dossiers patients',
    // Patients
    patients: 'Patients', search_patient: 'Rechercher (nom ou tÃ©lÃ©phone)',
    new_patient: 'Nouveau patient', no_patients: 'Aucun patient',
    no_patients_hint: 'Touchez + pour crÃ©er une fiche',
    first_name: 'PrÃ©nom', last_name: 'Nom', phone: 'TÃ©lÃ©phone',
    birthdate: 'Date de naissance', approx_age: 'Ã‚ge approximatif (si date inconnue)',
    sex: 'Sexe', male: 'Homme', female: 'Femme', other: 'Autre',
    address: 'Adresse', history: 'AntÃ©cÃ©dents mÃ©dicaux',
    save: 'Enregistrer', cancel: 'Annuler', edit: 'Modifier', delete: 'Supprimer',
    confirm_delete: 'Supprimer dÃ©finitivement ?',
    years: 'ans', age: 'Ã‚ge', unknown: 'Non renseignÃ©',
    // Consultations
    consultations: 'Consultations', new_consultation: 'Nouvelle consultation',
    no_consultations: 'Aucune consultation', date: 'Date', reason: 'Motif',
    observations: 'Observations', diagnosis: 'Diagnostic',
    medical_record: 'Dossier mÃ©dical',
    // Prescriptions
    prescriptions: 'Ordonnances', new_prescription: 'Nouvelle ordonnance',
    prescription: 'Ordonnance', medication: 'MÃ©dicament', dosage: 'Dosage',
    duration: 'DurÃ©e', instructions: 'Posologie / instructions',
    add_medication: 'Ajouter un mÃ©dicament', advice: 'Conseils',
    generate_pdf: 'GÃ©nÃ©rer le PDF', print_pdf: 'Imprimer / Partager',
    no_meds: 'Ajoutez au moins un mÃ©dicament',
    // Sync / net
    online: 'En ligne', offline: 'Hors ligne',
    pending_sync: 'Ã  synchroniser', saved: 'EnregistrÃ©',
    saved_offline: 'EnregistrÃ© (hors ligne)',
    sync_now: 'Synchroniser maintenant', synced: 'SynchronisÃ©',
    required: 'Champ obligatoire'
  }
};
function t(key) { return (I18N[I18N.lang] && I18N[I18N.lang][key]) || key; }

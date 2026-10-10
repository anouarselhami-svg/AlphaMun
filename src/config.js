export const config = {
  eventDate: '2027-01-22T00:00:00+01:00',
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  committeeLanguages: [], // Only confirmed event languages.
  staffFormUrl: import.meta.env.VITE_STAFF_FORM_URL || '',
  committees: [], // [{ name: 'Nom officiel', description: 'Sujet', level: 'Niveau' }]
};

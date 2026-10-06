export const config = {
  eventDate: null, // Année et heure à confirmer : '2027-01-22T09:00:00+01:00'
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  committees: [], // [{ name: 'Nom officiel', description: 'Sujet', level: 'Niveau' }]
};

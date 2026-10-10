export const config = {
  registrationSiteUrl: import.meta.env.VITE_REGISTRATION_SITE_URL || 'https://inscription.youthglobalclub.com/',
  mainSiteUrl: import.meta.env.VITE_MAIN_SITE_URL || 'https://youthglobalclub.com/',
  eventDate: '2027-01-22T00:00:00+01:00',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  committeeLanguages: [], // Only confirmed event languages.
  staffFormUrl: import.meta.env.VITE_STAFF_FORM_URL || '',
  committees: [], // [{ name: 'Nom officiel', description: 'Sujet', level: 'Niveau' }]
};

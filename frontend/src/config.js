export const config = {
  registrationSiteUrl: import.meta.env.VITE_REGISTRATION_SITE_URL || 'https://inscription.youthglobalclub.com/',
  mainSiteUrl: import.meta.env.VITE_MAIN_SITE_URL || 'https://youthglobalclub.com/',
  eventDate: edition.start,
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  committeeLanguages: Object.keys(debateLanguages),
  staffFormUrl: import.meta.env.VITE_STAFF_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLScH2jcymagfW1dYNYi83K5RaKmUtsBTVpvejbeVgcehAsQkMQ/viewform?usp=header',
  committees: committeeCatalogue,
};
import {edition} from '../../shared/edition.js';
import {committeeCatalogue, debateLanguages} from '../../shared/edition.js';

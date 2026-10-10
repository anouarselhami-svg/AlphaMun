
export class RegistrationError extends Error {
  constructor(code, message, diagnostics = {}) {
    super(message);
    this.name = 'RegistrationError';
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

export async function submitRegistration(data) {
  const body = new URLSearchParams();
  for (const field of ['nom','prenom','email','age','telephone','contact_parent','etablissement','niveau','ville','langue_comite','experience','experience_details','motivation_comite','attentes','hebergement','restrictions_alimentaires','besoins_particuliers','code_conduite','exactitude','consentement','comite_choix_1','comite_choix_2','comite_choix_3','pack','motivation','confirmation_pack']) {
    body.set(field, data[field] ?? '');
  }
  body.set('type', 'registration');
  let response;
  try {
    // Simple form POST, no custom headers, no automatic resubmission.
    response = await fetch('/api/registration', { method: 'POST', body, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    throw new RegistrationError(timedOut ? 'TIMEOUT' : 'RESPONSE_INACCESSIBLE',
      timedOut ? 'Le délai de réponse est dépassé. L’inscription a peut-être été enregistrée.'
        : 'La réponse est inaccessible au navigateur (réseau, accès au déploiement ou CORS). L’inscription a peut-être été enregistrée.');
  }
  const diagnostics = {
    status: response.status,
    redirected: response.redirected,
    responseHost: response.url ? new URL(response.url).host : '',
    contentType: response.headers.get('content-type') || '',
  };
  if (response.type === 'opaque' || response.type === 'opaqueredirect') {
    throw new RegistrationError('RESPONSE_INACCESSIBLE', 'La réponse ne peut pas être lue. L’inscription a peut-être été enregistrée.', diagnostics);
  }
  if (!response.ok) {
    throw new RegistrationError('HTTP_ERROR', `Le serveur a répondu avec une erreur HTTP ${response.status}. La réception n’est pas confirmée.`, diagnostics);
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new RegistrationError(error instanceof SyntaxError ? 'INVALID_JSON' : 'RESPONSE_INACCESSIBLE',
      'La réponse du serveur n’est pas un JSON lisible. La réception n’est pas confirmée.', diagnostics);
  }
  if (result?.ok === false) {
    if (typeof result.requestId === 'string') diagnostics.requestId = result.requestId;
    if (typeof result.code === 'string') diagnostics.scriptCode = result.code;
    const reference = diagnostics.requestId ? ` Référence : ${diagnostics.requestId}.` : '';
    throw new RegistrationError('SCRIPT_REJECTED',
      `Le script a répondu ok:false : l’inscription n’a pas été confirmée. Le club doit consulter les journaux Apps Script.${reference}`, diagnostics);
  }
  if (result?.ok !== true) {
    throw new RegistrationError('UNCONFIRMED_JSON', 'Le JSON reçu ne contient pas ok:true. La réception n’est pas confirmée.', diagnostics);
  }
}

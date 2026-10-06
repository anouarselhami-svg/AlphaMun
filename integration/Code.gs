// Lier au Sheets cible, ou définir SPREADSHEET_ID dans les propriétés du script.
// Redéployer une nouvelle version après modification de ce fichier.
function doGet() {
  // Vérification du déploiement uniquement, sans accès aux inscriptions.
  return registrationJson_({ ok: true, service: 'alpha-mun-registration', version: '2' });
}
function registrationJson_(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  const requestId = Utilities.getUuid();
  const lock = LockService.getScriptLock();
  let locked = false;
  let phase = 'validation';
  try {
    const p = e && e.parameter || {};
    const required = ['nom', 'prenom', 'email', 'etablissement', 'experience'];
    const missing = required.filter(field => !String(p[field] || '').trim());
    if (missing.length || !['550', '1550'].includes(p.pack) || p.type !== 'registration') {
      console.warn(JSON.stringify({ requestId, phase, code: 'INVALID_FIELDS', missing }));
      return registrationJson_({ ok: false, code: 'INVALID_FIELDS', requestId });
    }
    phase = 'lock';
    lock.waitLock(10000);
    locked = true;
    phase = 'spreadsheet';
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    const spreadsheet = spreadsheetId
      ? SpreadsheetApp.openById(spreadsheetId.trim())
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      console.error(JSON.stringify({ requestId, phase, code: 'SPREADSHEET_NOT_CONFIGURED' }));
      return registrationJson_({ ok: false, code: 'SPREADSHEET_NOT_CONFIGURED', requestId });
    }
    phase = 'sheet';
    let sheet = spreadsheet.getSheetByName('Inscriptions');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Inscriptions');
      sheet.appendRow(['Date', 'Prénom', 'Nom', 'Email', 'Établissement', 'Expérience MUN', 'Comité', 'Pack DH']);
    }
    sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    const safe = value => /^[=+@\-]/.test(String(value || '')) ? "'" + value : String(value || '');
    phase = 'append';
    sheet.appendRow([new Date(), ...[p.prenom, p.nom, p.email, p.etablissement, p.experience, p.comite, p.pack].map(safe)]);
    phase = 'flush';
    SpreadsheetApp.flush();
    console.info(JSON.stringify({ requestId, phase: 'complete', code: 'REGISTRATION_SAVED' }));
    return registrationJson_({ ok: true, requestId });
  } catch (err) {
    // Do not log the submitted form or return internal details publicly.
    console.error(JSON.stringify({ requestId, phase, code: 'SCRIPT_ERROR', message: String(err.message || err), stack: String(err.stack || '') }));
    return registrationJson_({ ok: false, code: 'SCRIPT_ERROR', requestId });
  } finally {
    if (locked) lock.releaseLock();
  }
}

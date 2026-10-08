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
    const required = ['nom', 'prenom', 'email', 'etablissement', 'ville', 'experience', 'confirmation_pack'];
    const missing = required.filter(field => !String(p[field] || '').trim());
    const committeeChoices = ['comite_choix_1', 'comite_choix_2', 'comite_choix_3']
      .map(field => String(p[field] || '').trim())
      .filter(Boolean);
    const duplicateChoices = new Set(committeeChoices).size !== committeeChoices.length;
    if (duplicateChoices) {
      console.warn(JSON.stringify({ requestId, phase, code: 'DUPLICATE_COMMITTEE_CHOICES' }));
      return registrationJson_({ ok: false, code: 'DUPLICATE_COMMITTEE_CHOICES', requestId });
    }
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
    let cityColumn;
    let motivationColumn;
    let packConfirmationColumn;
    let committeeChoiceColumns;
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Inscriptions');
      sheet.appendRow(['Date', 'Prénom', 'Nom', 'Email', 'Établissement', 'Expérience MUN', 'Comité', 'Pack DH', 'Ville', 'Motivation', 'Pack assumé', 'Comité — choix 1', 'Comité — choix 2', 'Comité — choix 3']);
      cityColumn = 9;
      motivationColumn = 10;
      packConfirmationColumn = 11;
      committeeChoiceColumns = [12, 13, 14];
    } else {
      const lastColumn = sheet.getLastColumn();
      const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      let nextColumn = lastColumn + 1;
      const ensureColumn = header => {
        const existingColumn = headers.indexOf(header);
        if (existingColumn >= 0) return existingColumn + 1;
        const column = nextColumn++;
        sheet.getRange(1, column).setValue(header);
        headers.push(header);
        return column;
      };
      cityColumn = ensureColumn('Ville');
      motivationColumn = ensureColumn('Motivation');
      packConfirmationColumn = ensureColumn('Pack assumé');
      committeeChoiceColumns = [
        ensureColumn('Comité — choix 1'),
        ensureColumn('Comité — choix 2'),
        ensureColumn('Comité — choix 3'),
      ];
    }
    sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    const safe = value => /^[=+@\-]/.test(String(value || '')) ? "'" + value : String(value || '');
    phase = 'append';
    const row = [new Date(), ...[p.prenom, p.nom, p.email, p.etablissement, p.experience, p.comite, p.pack].map(safe)];
    row[cityColumn - 1] = safe(p.ville);
    row[motivationColumn - 1] = safe(p.motivation);
    row[packConfirmationColumn - 1] = safe(p.confirmation_pack);
    committeeChoiceColumns.forEach((column, index) => {
      row[column - 1] = safe(p[`comite_choix_${index + 1}`]);
    });
    sheet.appendRow(row);
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

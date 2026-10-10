const CONFIRMED_COMMITTEES = []; // Noms officiels, synchronisés avec src/config.js
const COMMITTEE_LANGUAGES = []; // Langues confirmées uniquement
const REGISTRATION_HEADERS = [
  'Date',
  'Prénom',
  'Nom',
  'Email',
  'Établissement',
  'Expérience MUN',
  'Comité',
  'Pack DH',
  'Ville',
  'Pack assumé',
  'Comité — choix 1',
  'Comité — choix 2',
  'Comité — choix 3',
  "Âge",
  "Téléphone",
  "Contact parent / tuteur",
  "Niveau scolaire",
  "Langue des comités",
  "Détails expérience MUN",
  "Motivation premier comité",
  "Attentes",
  "Hébergement",
  "Restrictions alimentaires",
  "Besoins particuliers",
  "Code de conduite accepté",
  "Informations exactes",
  "Consentement",
  'Motivation'
];

function doGet() {
  // Vérifie le déploiement sans modifier le fichier.
  return registrationJson_({
    ok: true,
    service: 'alpha-mun-registration',
    version: '5'
  });
}

function registrationJson_(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function registrationSpreadsheet_() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const spreadsheet = id && id.trim()
    ? SpreadsheetApp.openById(id.trim())
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Configurez la propriété SPREADSHEET_ID.');
  }

  return spreadsheet;
}

function registrationHeaders_(sheet) {
  const count = sheet.getLastColumn();

  return count > 0
    ? sheet.getRange(1, 1, 1, count).getValues()[0]
        .map(header => String(header).trim())
    : [];
}

function registrationSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Inscriptions')
    || spreadsheet.insertSheet('Inscriptions');

  let headers = registrationHeaders_(sheet);

  // Refuser les titres en double pour éviter une écriture ambiguë.
  const namedHeaders = headers.filter(Boolean);
  if (new Set(namedHeaders).size !== namedHeaders.length) {
    throw new Error('La ligne des titres contient des doublons.');
  }

  // Ajouter les titres manquants sans écraser les données.
  for (const header of REGISTRATION_HEADERS) {
    if (!headers.includes(header)) {
      headers.push(header);
      const column = headers.length;

      if (column > sheet.getMaxColumns()) {
        sheet.insertColumnsAfter(
          sheet.getMaxColumns(),
          column - sheet.getMaxColumns()
        );
      }

      sheet.getRange(1, column).setValue(header);
    }
  }

  // Déplacer toute la colonne Motivation après les autres.
  // Les valeurs existantes se déplacent avec la colonne.
  headers = registrationHeaders_(sheet);
  const motivationColumn = headers.indexOf('Motivation') + 1;
  const lastColumn = sheet.getLastColumn();

  if (motivationColumn > 0 && motivationColumn < lastColumn) {
    // Créer une position de destination après la dernière colonne.
    if (sheet.getMaxColumns() < lastColumn + 1) {
      sheet.insertColumnAfter(sheet.getMaxColumns());
    }

    sheet.moveColumns(
      sheet.getRange(1, motivationColumn, sheet.getMaxRows(), 1),
      lastColumn + 1
    );
  }

  return sheet;
}

function registrationSafe_(input) {
  const text = String(input == null ? '' : input).trim();
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

// À sélectionner puis exécuter manuellement dans Apps Script.
// Cette fonction ne crée aucune inscription.
function preparerColonnes() {
  const lock = LockService.getScriptLock();
  let locked = false;

  try {
    lock.waitLock(10000);
    locked = true;

    const spreadsheet = registrationSpreadsheet_();
    registrationSheet_(spreadsheet);

    SpreadsheetApp.flush();
    console.log('Colonnes préparées : ' + spreadsheet.getUrl());
  } finally {
    if (locked) lock.releaseLock();
  }
}

// Appelée par le formulaire du site, pas par le bouton Exécuter.
function doPost(e) {
  const requestId = Utilities.getUuid();
  const lock = LockService.getScriptLock();
  let locked = false;
  let phase = 'validation';

  try {
    const parameters = (e && e.parameter) || {};
    const value = field => String(parameters[field] || '').trim();

    const required = [
      'prenom',
      'nom',
      'email',
      'etablissement',
      'ville',
      'experience',
      'age', 'telephone', 'niveau', 'attentes', 'hebergement', 'code_conduite', 'exactitude', 'consentement', 'confirmation_pack'
    ];

    const missing = required.filter(field => !value(field));

    if (
      missing.length > 0 ||
      !['500', '1500'].includes(value('pack')) ||
      value('type') !== 'registration'
    ) {
      return registrationJson_({
        ok: false,
        code: 'INVALID_FIELDS',
        missing,
        requestId
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) {
      return registrationJson_({
        ok: false,
        code: 'INVALID_EMAIL',
        requestId
      });
    }

    const accepted = ['confirmation_pack','code_conduite','exactitude','consentement'].every(field => value(field) === 'on');
    const phone = text => /^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g, '').length >= 7 && text.replace(/\D/g, '').length <= 15;
    if (!accepted || !/^\d+$/.test(value('age')) || !Number.isSafeInteger(Number(value('age'))) || Number(value('age')) <= 0 || !phone(value('telephone')) || (Number(value('age')) < 18 && !phone(value('contact_parent'))) || (value('contact_parent') && !phone(value('contact_parent'))) || !['oui','non'].includes(value('experience')) || !['oui','non','a_confirmer'].includes(value('hebergement')) || (COMMITTEE_LANGUAGES.length ? !COMMITTEE_LANGUAGES.includes(value('langue_comite')) : !!value('langue_comite'))) {
      return registrationJson_({ok:false,code:'INVALID_FIELDS',requestId});
    }
    const choices = [
      value('comite_choix_1') || value('comite'),
      value('comite_choix_2'),
      value('comite_choix_3')
    ];

    const selected = choices
      .filter(Boolean)
      .map(choice => choice.toLocaleLowerCase());

    if (new Set(selected).size !== selected.length) {
      return registrationJson_({
        ok: false,
        code: 'DUPLICATE_COMMITTEE_CHOICES',
        requestId
      });
    }

    if (choices.some((choice,index) => index < Math.min(3,CONFIRMED_COMMITTEES.length) ? !CONFIRMED_COMMITTEES.includes(choice) : !!choice) || (choices[0] && !value('motivation_comite'))) {
      return registrationJson_({ok:false,code:'INVALID_COMMITTEES',requestId});
    }

    phase = 'lock';
    lock.waitLock(10000);
    locked = true;

    phase = 'spreadsheet';
    const spreadsheet = registrationSpreadsheet_();

    phase = 'headers';
    const sheet = registrationSheet_(spreadsheet);
    const headers = registrationHeaders_(sheet);
    const safe = registrationSafe_;

    const data = {
      'Date': new Date(),
      'Prénom': safe(value('prenom')),
      'Nom': safe(value('nom')),
      'Email': safe(value('email')),
      'Établissement': safe(value('etablissement')),
      'Expérience MUN': safe(value('experience')),
      'Comité': safe(choices[0]),
      'Pack DH': safe(value('pack')),
      'Ville': safe(value('ville')),
      'Pack assumé': safe(value('confirmation_pack')),
      'Comité — choix 1': safe(choices[0]),
      'Comité — choix 2': safe(choices[1]),
      'Comité — choix 3': safe(choices[2]),
      "Âge": safe(value("age")),
      "Téléphone": safe(value("telephone")),
      "Contact parent / tuteur": safe(value("contact_parent")),
      "Niveau scolaire": safe(value("niveau")),
      "Langue des comités": safe(value("langue_comite")),
      "Détails expérience MUN": safe(value("experience_details")),
      "Motivation premier comité": safe(value("motivation_comite")),
      "Attentes": safe(value("attentes")),
      "Hébergement": safe(value("hebergement")),
      "Restrictions alimentaires": safe(value("restrictions_alimentaires")),
      "Besoins particuliers": safe(value("besoins_particuliers")),
      "Code de conduite accepté": safe(value("code_conduite")),
      "Informations exactes": safe(value("exactitude")),
      "Consentement": safe(value("consentement")),
      'Motivation': safe(value('motivation'))
    };

    // Suivre l'ordre réel des colonnes dans Google Sheets.
    const row = headers.map(header =>
      Object.prototype.hasOwnProperty.call(data, header)
        ? data[header]
        : ''
    );

    phase = 'append';
    const nextRow = Math.max(sheet.getLastRow() + 1, 2);

    if (nextRow > sheet.getMaxRows()) {
      sheet.insertRowsAfter(
        sheet.getMaxRows(),
        nextRow - sheet.getMaxRows()
      );
    }

    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    const dateColumn = headers.indexOf('Date') + 1;
    sheet.getRange(nextRow, dateColumn)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');

    phase = 'flush';
    SpreadsheetApp.flush();

    console.info(JSON.stringify({
      requestId,
      code: 'REGISTRATION_SAVED'
    }));

    return registrationJson_({
      ok: true,
      requestId
    });

  } catch (error) {
    console.error(JSON.stringify({
      requestId,
      phase,
      code: 'SCRIPT_ERROR',
      message: String(error.message || error)
    }));

    return registrationJson_({
      ok: false,
      code: 'SCRIPT_ERROR',
      requestId
    });

  } finally {
    if (locked) lock.releaseLock();
  }
}



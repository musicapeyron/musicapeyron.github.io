/* =========================================================================
   TEST D'INGRESSO — raccolta risultati e generazione schede di classe
   =========================================================================

   COME SI USA (riassunto — le istruzioni complete sono a parte):
   1. Crea un nuovo Google Sheet vuoto.
   2. Estensioni → Apps Script, cancella il contenuto di default e incolla
      TUTTO questo file al suo posto.
   3. Distribuisci come "App web": esecuzione "Io", accesso "Chiunque".
   4. Copia l'URL che ti viene dato e incollalo nel gioco HTML al posto di
      APPS_SCRIPT_URL_QUI (cerca quella scritta nel file del gioco).
   5. Ricarica il Google Sheet: comparirà un nuovo menu "Report classi" da
      cui generare le schede Word quando vuoi.

   Ogni tentativo di un alunno viene registrato come UNA riga a parte
   (i tentativi ripetuti non sovrascrivono i precedenti).
========================================================================= */

const SHEET_NAME = "Risultati";

const HEADERS = [
    "Data e ora", "Classe", "Sezione", "Numero",
    "Acuto/grave - domande", "Acuto/grave - corrette", "Acuto/grave - errori", "Acuto/grave - accuratezza",
    "Tastiera - domande", "Tastiera - corrette", "Tastiera - errori", "Tastiera - accuratezza",
    "Figure ritmiche - domande", "Figure ritmiche - corrette", "Figure ritmiche - errori", "Figure ritmiche - accuratezza",
    "Leggi la nota - domande", "Leggi la nota - corrette", "Leggi la nota - errori", "Leggi la nota - accuratezza",
    "Globale - domande", "Globale - corrette", "Globale - errori", "Globale - accuratezza"
];

const GAME_KEYS = ["acuto", "tastiera", "figure", "leggi", "globale"];
const GAME_LABELS = {
    acuto: "Acuto/grave",
    tastiera: "Tastiera",
    figure: "Figure ritmiche",
    leggi: "Leggi la nota",
    globale: "Globale"
};

/* =========================================================================
   RICEZIONE DI UN RISULTATO (chiamato dal gioco HTML)
========================================================================= */
function doPost(e) {
    let result = { ok: false };
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = getOrCreateSheet_();

        const row = [new Date(), String(data.classe || ""), String(data.sezione || ""), Number(data.numero) || ""];
        GAME_KEYS.forEach(key => {
            const g = data[key] || {};
            row.push(
                numOrBlank_(g.total),
                numOrBlank_(g.correct),
                numOrBlank_(g.errors),
                numOrBlank_(g.accuracy)
            );
        });

        sheet.appendRow(row);
        result = { ok: true };
    } catch (err) {
        result = { ok: false, error: String(err) };
    }
    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function numOrBlank_(v) {
    return (v === undefined || v === null || v === "") ? "" : Number(v);
}

function getOrCreateSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }
    return sheet;
}

/* =========================================================================
   MENU NELLO SHEET
========================================================================= */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("Report classi")
        .addItem("Genera schede di classe (Word)", "generateClassReports")
        .addToUi();
}

/* =========================================================================
   GENERAZIONE DELLE SCHEDE WORD, UNA PER CLASSE/SEZIONE
========================================================================= */
function generateClassReports() {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
        ui.alert("Non ci sono ancora risultati registrati.");
        return;
    }

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();

    // raggruppa le righe per "classe sezione"
    const groups = {};
    values.forEach(row => {
        const classe = String(row[1]).trim();
        const sezione = String(row[2]).trim();
        const key = classe + "|" + sezione;
        if (!groups[key]) groups[key] = { classe, sezione, rows: [] };
        groups[key].rows.push(row);
    });

    const folderName = "Schede test d'ingresso - " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    const folder = DriveApp.createFolder(folderName);

    Object.values(groups).forEach(group => {
        createClassDoc_(group, folder);
    });

    ui.alert("Fatto! Trovi le schede Word nella cartella Drive:\n\"" + folderName + "\"");
}

function createClassDoc_(group, folder) {
    const title = "Classe " + group.classe + " sez. " + group.sezione;

    // raggruppa per numero alunno, mantenendo l'ordine cronologico dei
    // tentativi (necessario per numerarli "Tentativo 1", "Tentativo 2", ...)
    const byNumero = {};
    group.rows.forEach(row => {
        const numero = row[3];
        if (!byNumero[numero]) byNumero[numero] = [];
        byNumero[numero].push(row);
    });
    Object.values(byNumero).forEach(list => {
        list.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    });

    const numeri = Object.keys(byNumero)
        .map(Number)
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    const doc = DocumentApp.create(title);
    const body = doc.getBody();
    // margini ridotti e impaginazione compatta, per stare tutto
    // (o quasi) su un'unica pagina anche con molti alunni
    body.setMarginTop(15).setMarginBottom(15).setMarginLeft(20).setMarginRight(20);

    const heading = body.appendParagraph("Test d'ingresso — " + title);
    heading.setBold(true).setFontSize(12).setSpacingAfter(1);

    body.appendParagraph("Generato il " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"))
        .setFontSize(7)
        .setForegroundColor("#666666")
        .setSpacingAfter(3);

    numeri.forEach(numero => {
        appendStudentBlock_(body, numero, byNumero[numero]);
    });

    doc.saveAndClose();

    // esporta come .docx e mette il file nella cartella, eliminando il
    // Google Doc intermedio (resta solo il file Word)
    const docFile = DriveApp.getFileById(doc.getId());
    const docxBlob = docFile.getAs("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    docxBlob.setName(title + ".docx");
    folder.createFile(docxBlob);
    docFile.setTrashed(true);
}

// numero di tabelle vuote (identiche a quella dei risultati) da
// lasciare sotto ad ogni alunno per registrare a mano i risultati
// di future verifiche
const FUTURE_BLANK_TABLES = 1;

function appendStudentBlock_(body, numero, attempts) {
    const studentTitle = body.appendParagraph(
        "Alunno n. " + numero + "   Nome e cognome: " + "_".repeat(30));
    studentTitle.setBold(true).setFontSize(7).setSpacingBefore(4).setSpacingAfter(1);
    // evita che l'intestazione dell'alunno resti isolata a fine
    // pagina, separata dalla propria tabella
    studentTitle.setKeepWithNext(true);

    // intestazione tabella: un tentativo per riga, una colonna per gioco
    const header = ["Tentativo", "Data"];
    GAME_KEYS.forEach(key => header.push(GAME_LABELS[key]));

    const tableData = [header];
    attempts.forEach((row, index) => {
        const data = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "dd/MM/yy HH:mm");
        const line = ["T" + (index + 1), data];
        GAME_KEYS.forEach((key, gIndex) => {
            const base = 4 + gIndex * 4; // indice della prima colonna del gioco nella riga dello sheet
            const total = row[base];
            const correct = row[base + 1];
            const accuracy = row[base + 3];
            const cell = (total === "" ? "-" : correct + "/" + total + " (" + accuracy + "%)");
            line.push(cell);
        });
        tableData.push(line);
    });

    appendCompactTable_(body, tableData);

    // una copia vuota della stessa tabella, pronta per annotare a
    // mano i risultati di una futura verifica
    const blankHeader = header;
    for (let i = 0; i < FUTURE_BLANK_TABLES; i++) {
        const blankRow = blankHeader.map(() => "");
        blankRow[0] = "T" + (attempts.length + i + 1);
        appendCompactTable_(body, [blankHeader, blankRow]);
    }
}

function appendCompactTable_(body, tableData) {
    const table = body.appendTable(tableData);
    table.setBorderWidth(0.5);
    const headerRow = table.getRow(0);
    for (let c = 0; c < headerRow.getNumCells(); c++) {
        headerRow.getCell(c).setBackgroundColor("#ececec");
        headerRow.getCell(c).editAsText().setBold(true).setFontSize(5.5);
        headerRow.getCell(c).setPaddingTop(0.5).setPaddingBottom(0.5).setPaddingLeft(1.5).setPaddingRight(1.5);
    }
    for (let r = 1; r < table.getNumRows(); r++) {
        for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
            const tc = table.getRow(r).getCell(c);
            tc.editAsText().setFontSize(6.5);
            tc.setPaddingTop(0.5).setPaddingBottom(0.5).setPaddingLeft(1.5).setPaddingRight(1.5);
        }
    }
    return table;
}

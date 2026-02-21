const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/google-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1P9g7oq68e9H2wYjjD-FDswbD4-3cG-mK2sXBTpYuHrQ"; // paste from sheet URL
const SHEET_NAME = "affiliate-email"; // tab name

async function appendToSheet(rows) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows,
    },
  });
}

module.exports = appendToSheet;
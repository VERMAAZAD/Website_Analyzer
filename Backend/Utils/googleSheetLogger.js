const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/google-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1P9g7oq68e9H2wYjjD-FDswbD4-3cG-mK2sXBTpYuHrQ"; // paste from sheet URL
const SHEET_NAME = "affiliate-email"; // tab name

async function appendToSheet(rows) {
  try {
    if (!rows || rows.length === 0) {
      console.log('No rows to append');
      return;
    }
 
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
 
    // First, check if headers exist and create them if needed
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:E1`,
      });
    } catch (err) {
      // Headers don't exist, create them
      console.log('Creating sheet headers...');
      const headers = [['Timestamp', 'Email', 'Category', 'Status', 'Issue']];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: headers,
        },
      });
    }
 
    // Append the rows
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });
 
    console.log(`✅ Appended ${rows.length} rows to Google Sheets`);
 
  } catch (err) {
    console.error('❌ Google Sheets operation failed:', {
      error: err.message,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME
    });
    throw err;
  }
}
 
module.exports = appendToSheet;
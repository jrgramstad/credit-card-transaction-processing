// Google Apps Script Backend for Credit Card Transaction Processing System
// This file should be copied to Google Apps Script and deployed as a Web App

// ============================================================================
// CONFIGURATION
// ============================================================================

// IMPORTANT: Replace this with your actual Google Sheet ID
const SHEET_ID = '1p-lPdwil2XkJSBxDyZHbqVUe0laX0iyFFzM0pJ6WTVg';

// Sheet names
const SHEETS = {
  TRANSACTIONS: 'Transactions_Master',
  PROPERTIES: 'Properties',
  CATEGORIES: 'Categories',
  CARDHOLDERS: 'Cardholders'
};

// ============================================================================
// WEB APP HANDLERS
// ============================================================================

/**
 * Handle GET requests
 * @param {Object} e - Event object with request parameters
 * @returns {ContentService.TextOutput} JSON response
 */
function doGet(e) {
  const action = e.parameter.action;

  try {
    switch(action) {
      case 'getProperties':
        return jsonResponse(getProperties());

      case 'getCategories':
        return jsonResponse(getCategories());

      case 'getCardholders':
        return jsonResponse(getCardholders());

      case 'getTransactions':
        return jsonResponse(getTransactions(e.parameter.startDate, e.parameter.endDate));

      default:
        return jsonResponse({error: 'Invalid action'}, 400);
    }
  } catch(error) {
    Logger.log('Error in doGet: ' + error.toString());
    return jsonResponse({error: error.toString()}, 500);
  }
}

/**
 * Handle POST requests
 * @param {Object} e - Event object with request parameters and data
 * @returns {ContentService.TextOutput} JSON response
 */
function doPost(e) {
  const action = e.parameter.action;

  try {
    const data = JSON.parse(e.postData.contents);

    switch(action) {
      case 'saveTransactions':
        return jsonResponse(saveTransactions(data));

      case 'addProperty':
        return jsonResponse(addProperty(data.name));

      case 'addCategory':
        return jsonResponse(addCategory(data.name));

      default:
        return jsonResponse({error: 'Invalid action'}, 400);
    }
  } catch(error) {
    Logger.log('Error in doPost: ' + error.toString());
    return jsonResponse({error: error.toString()}, 500);
  }
}

/**
 * Create JSON response
 * @param {Object} data - Data to return
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {ContentService.TextOutput} JSON response
 */
function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// SPREADSHEET ACCESS
// ============================================================================

/**
 * Get spreadsheet object
 * @returns {Spreadsheet} Spreadsheet object
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

// ============================================================================
// PROPERTIES
// ============================================================================

/**
 * Get list of active properties
 * @returns {Array} Array of property names
 */
function getProperties() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PROPERTIES);
  const data = sheet.getDataRange().getValues();

  // Skip header row, filter active, sort by order, return names
  return data.slice(1)
    .filter(row => row[1] === true)
    .sort((a, b) => a[2] - b[2])
    .map(row => row[0]);
}

/**
 * Add new property
 * @param {string} name - Property name
 * @returns {Object} Success result
 */
function addProperty(name) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PROPERTIES);
  const lastRow = sheet.getLastRow();

  // Add new property: Name, Active=true, SortOrder=lastRow
  sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[name, true, lastRow]]);

  return {success: true, message: 'Property added successfully'};
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Get list of active categories
 * @returns {Array} Array of category names
 */
function getCategories() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  const data = sheet.getDataRange().getValues();

  // Skip header row, filter active, sort by order, return names
  return data.slice(1)
    .filter(row => row[1] === true)
    .sort((a, b) => a[2] - b[2])
    .map(row => row[0]);
}

/**
 * Add new category
 * @param {string} name - Category name
 * @returns {Object} Success result
 */
function addCategory(name) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  const lastRow = sheet.getLastRow();

  // Add new category: Name, Active=true, SortOrder=lastRow
  sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[name, true, lastRow]]);

  return {success: true, message: 'Category added successfully'};
}

// ============================================================================
// CARDHOLDERS
// ============================================================================

/**
 * Get list of active cardholders
 * @returns {Array} Array of cardholder objects
 */
function getCardholders() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CARDHOLDERS);
  const data = sheet.getDataRange().getValues();

  // Skip header row, filter active, return objects
  return data.slice(1)
    .filter(row => row[3] === true)
    .map(row => ({
      name: row[0],
      cardLast4: String(row[1]).padStart(4, '0'),
      role: row[2]
    }));
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Get transactions (optionally filtered by date range)
 * @param {string} startDate - Start date (optional)
 * @param {string} endDate - End date (optional)
 * @returns {Array} Array of transaction objects
 */
function getTransactions(startDate, endDate) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
  const data = sheet.getDataRange().getValues();

  // Skip header row
  const transactions = data.slice(1).map(row => ({
    reportDate: row[0],
    postedDate: row[1],
    transactionDate: row[2],
    source: row[3],
    description: row[4],
    amount: row[5],
    property: row[6],
    category: row[7],
    cardholderName: row[8],
    cardLast4: row[9],
    orderNumber: row[10],
    storeLocation: row[11],
    notes: row[12],
    createdTimestamp: row[13]
  }));

  // Filter by date range if provided
  if (startDate || endDate) {
    return transactions.filter(txn => {
      const txnDate = new Date(txn.transactionDate);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return txnDate >= start && txnDate <= end;
    });
  }

  return transactions;
}

/**
 * Save transactions to sheet
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Success result with row count
 */
function saveTransactions(transactions) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TRANSACTIONS);

  // Prepare rows for insertion
  const rows = transactions.map(t => [
    new Date(),                              // Report_Date
    t.postedDate || '',                      // Posted_Date
    t.transactionDate || '',                 // Transaction_Date
    t.source || '',                          // Source
    t.description || '',                     // Description
    parseFloat(t.amount) || 0,               // Amount
    t.property || '',                        // Property
    t.category || '',                        // Category
    t.cardholderName || '',                  // Cardholder_Name
    String(t.cardLast4).padStart(4, '0'),    // Card_Last_4
    t.orderNumber || '',                     // Order_Number
    t.storeLocation || '',                   // Store_Location
    t.notes || '',                           // Notes
    new Date()                               // Created_Timestamp
  ]);

  // Insert rows if any
  if (rows.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, 14).setValues(rows);

    // Format amount column as currency
    sheet.getRange(startRow, 6, rows.length, 1).setNumberFormat('$#,##0.00');

    // Format date columns
    sheet.getRange(startRow, 1, rows.length, 1).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(startRow, 3, rows.length, 1).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(startRow, 14, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }

  return {
    success: true,
    rowsAdded: rows.length,
    message: `${rows.length} transaction(s) saved successfully`
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test function to verify API is working
 * Can be called from Apps Script editor to test
 */
function testAPI() {
  Logger.log('Testing API...');

  Logger.log('Properties: ' + JSON.stringify(getProperties()));
  Logger.log('Categories: ' + JSON.stringify(getCategories()));
  Logger.log('Cardholders: ' + JSON.stringify(getCardholders()));

  Logger.log('API test completed successfully');
}

/**
 * Initialize sheet structure (run once to set up sheets)
 * This function creates the necessary sheets and headers if they don't exist
 */
function initializeSheets() {
  const ss = getSpreadsheet();

  // Create Transactions_Master sheet
  let sheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.TRANSACTIONS);
    sheet.getRange(1, 1, 1, 14).setValues([[
      'Report_Date',
      'Posted_Date',
      'Transaction_Date',
      'Source',
      'Description',
      'Amount',
      'Property',
      'Category',
      'Cardholder_Name',
      'Card_Last_4',
      'Order_Number',
      'Store_Location',
      'Notes',
      'Created_Timestamp'
    ]]);
    sheet.getRange(1, 1, 1, 14).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Create Properties sheet
  sheet = ss.getSheetByName(SHEETS.PROPERTIES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.PROPERTIES);
    sheet.getRange(1, 1, 1, 3).setValues([['Property_Name', 'Active', 'Sort_Order']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Create Categories sheet
  sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CATEGORIES);
    sheet.getRange(1, 1, 1, 3).setValues([['Category_Name', 'Active', 'Sort_Order']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Create Cardholders sheet
  sheet = ss.getSheetByName(SHEETS.CARDHOLDERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CARDHOLDERS);
    sheet.getRange(1, 1, 1, 4).setValues([['Full_Name', 'Card_Last_4', 'Role', 'Active']]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  Logger.log('Sheets initialized successfully');
}

// ============================================================================
// DEPLOYMENT INSTRUCTIONS
// ============================================================================

/*
DEPLOYMENT STEPS:

1. Replace SHEET_ID constant with your Google Sheet ID

2. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Select type: "Web app"
   - Description: "CC Transaction API"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"

3. Copy the Web App URL and paste it into frontend/config.js

4. Test the API:
   - Run the testAPI() function from the Apps Script editor
   - Check the logs to verify data is being retrieved

5. If sheets don't exist, run initializeSheets() to create them

IMPORTANT SECURITY NOTES:
- This API is set to "Anyone" access for simplicity
- For production use, consider implementing authentication
- Never commit your SHEET_ID to public repositories
- Regularly review Apps Script execution logs for suspicious activity
*/

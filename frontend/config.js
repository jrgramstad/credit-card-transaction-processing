// Configuration file for Credit Card Transaction Processing System

const CONFIG = {
  // Google Apps Script Web App URL
  // IMPORTANT: Replace this with your actual deployed Web App URL from Google Apps Script
  API_URL: 'https://script.google.com/macros/s/AKfycbx5p3URYCHUTjDHxT-Vs7DWLugPqLmHtWbUP5i1dwJlJ6MGZnn2bXrCUnLtv23DgRvwVA/exec',

  // API Endpoints (appended to API_URL as query parameters)
  ENDPOINTS: {
    GET_PROPERTIES: '?action=getProperties',
    GET_CATEGORIES: '?action=getCategories',
    GET_CARDHOLDERS: '?action=getCardholders',
    GET_TRANSACTIONS: '?action=getTransactions',
    SAVE_TRANSACTIONS: '?action=saveTransactions',
    ADD_PROPERTY: '?action=addProperty',
    ADD_CATEGORY: '?action=addCategory'
  },

  // LocalStorage keys for saving progress
  STORAGE_KEYS: {
    TRANSACTIONS: 'cc_transactions_in_progress',
    CAPITAL_ONE_FILE: 'cc_capital_one_file',
    HOME_DEPOT_FILE: 'cc_home_depot_file',
    LAST_SAVED: 'cc_last_saved_timestamp'
  },

  // CSV File formats
  CSV_FORMATS: {
    CAPITAL_ONE: {
      SOURCE_NAME: 'Capital One',
      REQUIRED_COLUMNS: [
        'Transaction Date',
        'Posted Date',
        'Card No.',
        'Description',
        'Category',
        'Debit',
        'Credit'
      ]
    },
    HOME_DEPOT: {
      SOURCE_NAME: 'Home Depot',
      REQUIRED_COLUMNS: [
        'Date',
        'Receipt Added Date',
        'Order Origin',
        'Job Name',
        'Total Amount Paid',
        'Order Number',
        'Payment',
        'Card/Account Nickname',
        'Purchaser/Buyer Name-ID'
      ]
    }
  },

  // Deduplication settings
  DEDUPLICATION: {
    AMOUNT_TOLERANCE: 1.00,  // Match amounts within $1
    DATE_TOLERANCE_DAYS: 1,  // Match dates within 1 day
    HOME_DEPOT_KEYWORDS: ['HOME DEPOT', 'HOMEDEPOT', 'HD SUPPLY']
  },

  // Auto-assignment rules for Home Depot
  HOME_DEPOT_RULES: {
    DEFAULT_CATEGORY: 'Job Supplies',
    SUPPLY_ROOM_PROPERTY: 'Office',
    SUPPLY_ROOM_CATEGORY: 'Office Supplies',
    SUPPLY_ROOM_KEYWORDS: ['Supply Room', 'SUPPLY ROOM', 'supply room'],
    FRAUDULENT_KEYWORDS: ['Fraudulent charge', 'FRAUDULENT CHARGE', 'fraudulent charge']
  },

  // Report generation settings
  REPORTS: {
    EXCEL: {
      FILENAME_PREFIX: 'CC_Transactions_',
      SHEET_NAME: 'Transactions',
      COLUMNS: [
        'Date',
        'Description',
        'Amount',
        'Category',
        'Property',
        'Cardholder Name',
        'Card Last 4'
      ]
    },
    PDF: {
      FILENAME_PREFIX: 'CC_Summary_',
      TITLE: 'Credit Card Transaction Summary',
      ORIENTATION: 'portrait',
      UNIT: 'pt',
      FORMAT: 'letter'
    }
  },

  // UI Settings
  UI: {
    AUTO_SAVE_INTERVAL: 30000,  // Auto-save every 30 seconds
    MAX_FILE_SIZE: 5242880,     // 5MB max file size
    TOAST_DURATION: 3000,       // Toast notification duration (ms)
    COLORS: {
      AUTO_ASSIGNED: '#d4edda',  // Light green
      NEEDS_ASSIGNMENT: '#fff3cd', // Light yellow
      ERROR: '#f8d7da',          // Light red
      SUCCESS: '#d1ecf1'         // Light blue
    }
  },

  // Validation settings
  VALIDATION: {
    REQUIRED_FIELDS: ['transactionDate', 'description', 'amount', 'property', 'category'],
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 99999.99
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

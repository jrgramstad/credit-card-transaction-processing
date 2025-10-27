// CSV Parser Module for Credit Card Transaction Processing System
// Handles parsing of Capital One and Home Depot CSV files

const CSVParser = {
  /**
   * Parse CSV text into array of objects
   * @param {string} csvText - Raw CSV text
   * @returns {Array} Array of objects with headers as keys
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index].trim();
        });
        rows.push(row);
      }
    }

    return rows;
  },

  /**
   * Parse a single CSV line, handling quoted fields
   * @param {string} line - Single line from CSV
   * @returns {Array} Array of field values
   */
  parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // End of field
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Add last field
    fields.push(currentField);
    return fields;
  },

  /**
   * Parse Capital One CSV file
   * @param {string} csvText - Raw CSV text from Capital One
   * @returns {Array} Array of transaction objects
   */
  parseCapitalOne(csvText) {
    const rows = this.parseCSV(csvText);
    const transactions = [];

    rows.forEach((row, index) => {
      try {
        const transaction = {
          id: `CO_${Date.now()}_${index}`,
          source: 'Capital One',
          transactionDate: this.parseDate(row['Transaction Date']),
          postedDate: this.parseDate(row['Posted Date']),
          cardLast4: this.extractLast4(row['Card No.']),
          description: row['Description'] || '',
          originalCategory: row['Category'] || '',
          amount: this.parseAmount(row['Debit'], row['Credit']),
          property: '', // To be assigned by user
          category: '', // To be assigned by user
          cardholderName: '', // To be matched based on card number
          orderNumber: '',
          storeLocation: '',
          notes: '',
          autoAssigned: false,
          isDuplicate: false,
          needsAssignment: true
        };

        // Only add if we have valid data
        if (transaction.description && transaction.amount !== 0) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Error parsing Capital One row ${index}:`, error);
      }
    });

    return transactions;
  },

  /**
   * Parse Home Depot CSV file
   * @param {string} csvText - Raw CSV text from Home Depot
   * @returns {Array} Array of transaction objects
   */
  parseHomeDepot(csvText) {
    const rows = this.parseCSV(csvText);
    const transactions = [];

    rows.forEach((row, index) => {
      try {
        const jobName = row['Job Name'] || '';
        const { property, category } = this.applyHomeDepotRules(jobName);

        const transaction = {
          id: `HD_${Date.now()}_${index}`,
          source: 'Home Depot',
          transactionDate: this.parseDate(row['Date']),
          postedDate: this.parseDate(row['Receipt Added Date']),
          cardLast4: this.extractCardFromPayment(row['Payment']),
          description: `Home Depot - ${row['Order Origin'] || 'Store'}`,
          originalCategory: 'Home Depot',
          amount: this.parseHomeDepotAmount(row['Total Amount Paid']),
          property: property || jobName,
          category: category,
          cardholderName: row['Card/Account Nickname'] || row['Purchaser/Buyer Name-ID'] || '',
          orderNumber: row['Order Number'] || '',
          storeLocation: row['Order Origin'] || '',
          notes: `Job: ${jobName}`,
          autoAssigned: true,
          isDuplicate: false,
          needsAssignment: false
        };

        // Only add if we have valid data
        if (transaction.amount !== 0) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Error parsing Home Depot row ${index}:`, error);
      }
    });

    return transactions;
  },

  /**
   * Apply Home Depot auto-assignment rules
   * @param {string} jobName - Job name from Home Depot CSV
   * @returns {Object} Object with property and category
   */
  applyHomeDepotRules(jobName) {
    const rules = CONFIG.HOME_DEPOT_RULES;

    // Check for fraudulent charge
    if (rules.FRAUDULENT_KEYWORDS.some(keyword =>
      jobName.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return {
        property: 'Other',
        category: 'Fraudulent charge'
      };
    }

    // Check for supply room
    if (rules.SUPPLY_ROOM_KEYWORDS.some(keyword =>
      jobName.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return {
        property: rules.SUPPLY_ROOM_PROPERTY,
        category: rules.SUPPLY_ROOM_CATEGORY
      };
    }

    // Default assignment
    return {
      property: jobName,
      category: rules.DEFAULT_CATEGORY
    };
  },

  /**
   * Deduplicate Home Depot transactions from Capital One list
   * @param {Array} capitalOneTransactions - Capital One transactions
   * @param {Array} homeDepotTransactions - Home Depot transactions
   * @returns {Object} Object with deduplicated arrays
   */
  deduplicateTransactions(capitalOneTransactions, homeDepotTransactions) {
    const dedupeSettings = CONFIG.DEDUPLICATION;
    const deduplicatedCapitalOne = [];

    capitalOneTransactions.forEach(coTxn => {
      let isDuplicate = false;

      // Check if this Capital One transaction is a Home Depot purchase
      const isHomeDepotTransaction = dedupeSettings.HOME_DEPOT_KEYWORDS.some(keyword =>
        coTxn.description.toUpperCase().includes(keyword.toUpperCase())
      );

      if (isHomeDepotTransaction) {
        // Look for matching Home Depot transaction
        homeDepotTransactions.forEach(hdTxn => {
          if (this.isMatchingTransaction(coTxn, hdTxn, dedupeSettings)) {
            isDuplicate = true;
            // Add note to Home Depot transaction about the match
            hdTxn.notes += ` | Matched with Capital One txn on ${coTxn.transactionDate}`;
          }
        });
      }

      if (isDuplicate) {
        coTxn.isDuplicate = true;
        // Still add it but mark as duplicate (we'll filter or gray it out in UI)
      }

      deduplicatedCapitalOne.push(coTxn);
    });

    return {
      capitalOne: deduplicatedCapitalOne,
      homeDepot: homeDepotTransactions
    };
  },

  /**
   * Check if two transactions match (for deduplication)
   * @param {Object} txn1 - First transaction
   * @param {Object} txn2 - Second transaction
   * @param {Object} settings - Deduplication settings
   * @returns {boolean} True if transactions match
   */
  isMatchingTransaction(txn1, txn2, settings) {
    // Check amount match (within tolerance)
    const amountMatch = Math.abs(txn1.amount - txn2.amount) <= settings.AMOUNT_TOLERANCE;

    // Check date match (within tolerance)
    const date1 = new Date(txn1.transactionDate);
    const date2 = new Date(txn2.transactionDate);
    const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
    const dateMatch = daysDiff <= settings.DATE_TOLERANCE_DAYS;

    return amountMatch && dateMatch;
  },

  /**
   * Process both CSV files and return unified transaction list
   * @param {string} capitalOneCSV - Capital One CSV text
   * @param {string} homeDepotCSV - Home Depot CSV text
   * @returns {Array} Combined and deduplicated transaction list
   */
  processCSVFiles(capitalOneCSV, homeDepotCSV) {
    // Parse both files
    const capitalOneTransactions = capitalOneCSV ? this.parseCapitalOne(capitalOneCSV) : [];
    const homeDepotTransactions = homeDepotCSV ? this.parseHomeDepot(homeDepotCSV) : [];

    // Deduplicate
    const deduplicated = this.deduplicateTransactions(
      capitalOneTransactions,
      homeDepotTransactions
    );

    // Combine lists (Home Depot first, then non-duplicate Capital One)
    const allTransactions = [
      ...deduplicated.homeDepot,
      ...deduplicated.capitalOne.filter(txn => !txn.isDuplicate)
    ];

    // Sort by transaction date (newest first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);
      return dateB - dateA;
    });

    return allTransactions;
  },

  /**
   * Parse date string to ISO format
   * @param {string} dateStr - Date string from CSV
   * @returns {string} ISO date string
   */
  parseDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      console.warn('Error parsing date:', dateStr);
      return dateStr;
    }
  },

  /**
   * Parse amount from Capital One Debit/Credit columns
   * @param {string} debit - Debit column value
   * @param {string} credit - Credit column value
   * @returns {number} Transaction amount (positive for debits, negative for credits)
   */
  parseAmount(debit, credit) {
    const debitAmount = parseFloat(debit?.replace(/[^0-9.-]/g, '') || 0);
    const creditAmount = parseFloat(credit?.replace(/[^0-9.-]/g, '') || 0);

    if (debitAmount > 0) {
      return debitAmount;
    } else if (creditAmount > 0) {
      return -creditAmount; // Credits are negative
    }
    return 0;
  },

  /**
   * Parse amount from Home Depot Total Amount Paid column
   * @param {string} amountStr - Amount string
   * @returns {number} Transaction amount
   */
  parseHomeDepotAmount(amountStr) {
    if (!amountStr) return 0;
    return parseFloat(amountStr.replace(/[^0-9.-]/g, '') || 0);
  },

  /**
   * Extract last 4 digits from card number
   * @param {string} cardNo - Card number string
   * @returns {string} Last 4 digits
   */
  extractLast4(cardNo) {
    if (!cardNo) return '';
    const digits = cardNo.replace(/\D/g, '');
    return digits.slice(-4).padStart(4, '0');
  },

  /**
   * Extract card last 4 from Home Depot Payment column (e.g., "X-6101" -> "6101")
   * @param {string} payment - Payment string
   * @returns {string} Last 4 digits
   */
  extractCardFromPayment(payment) {
    if (!payment) return '';
    const match = payment.match(/X-(\d{4})/);
    return match ? match[1] : payment.replace(/\D/g, '').slice(-4).padStart(4, '0');
  },

  /**
   * Validate CSV file format
   * @param {string} csvText - CSV text
   * @param {string} fileType - 'CAPITAL_ONE' or 'HOME_DEPOT'
   * @returns {Object} Validation result {valid: boolean, message: string}
   */
  validateCSVFormat(csvText, fileType) {
    try {
      const rows = this.parseCSV(csvText);
      if (rows.length === 0) {
        return { valid: false, message: 'CSV file is empty' };
      }

      const headers = Object.keys(rows[0]);
      const requiredColumns = CONFIG.CSV_FORMATS[fileType].REQUIRED_COLUMNS;

      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        return {
          valid: false,
          message: `Missing required columns: ${missingColumns.join(', ')}`
        };
      }

      return { valid: true, message: 'CSV format is valid' };
    } catch (error) {
      return { valid: false, message: `Error parsing CSV: ${error.message}` };
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSVParser;
}

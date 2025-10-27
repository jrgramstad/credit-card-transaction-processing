// Report Generator Module for Credit Card Transaction Processing System
// Generates Excel and PDF reports from transaction data

const ReportGenerator = {
  /**
   * Generate Excel file from transactions
   * @param {Array} transactions - Array of transaction objects
   * @returns {Blob} Excel file blob
   */
  generateExcel(transactions) {
    if (!window.XLSX) {
      throw new Error('SheetJS library not loaded. Please include XLSX library.');
    }

    // Prepare data for Excel
    const excelData = this.prepareExcelData(transactions);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 40 }, // Description
      { wch: 12 }, // Amount
      { wch: 20 }, // Category
      { wch: 20 }, // Property
      { wch: 20 }, // Cardholder Name
      { wch: 12 }  // Card Last 4
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, CONFIG.REPORTS.EXCEL.SHEET_NAME);

    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return blob;
  },

  /**
   * Prepare data for Excel export
   * @param {Array} transactions - Array of transaction objects
   * @returns {Array} 2D array for Excel
   */
  prepareExcelData(transactions) {
    const data = [];

    // Add header row
    data.push(CONFIG.REPORTS.EXCEL.COLUMNS);

    // Add data rows
    transactions.forEach(txn => {
      // Skip duplicate transactions
      if (txn.isDuplicate) return;

      data.push([
        txn.transactionDate,
        txn.description,
        this.formatAmount(txn.amount),
        txn.category,
        txn.property,
        txn.cardholderName,
        txn.cardLast4
      ]);
    });

    return data;
  },

  /**
   * Generate PDF report from transactions
   * @param {Array} transactions - Array of transaction objects
   * @returns {Blob} PDF file blob
   */
  generatePDF(transactions) {
    if (!window.jspdf) {
      throw new Error('jsPDF library not loaded. Please include jsPDF library.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(
      CONFIG.REPORTS.PDF.ORIENTATION,
      CONFIG.REPORTS.PDF.UNIT,
      CONFIG.REPORTS.PDF.FORMAT
    );

    // Generate PDF content
    this.addPDFHeader(doc);
    this.addPDFSummary(doc, transactions);
    this.addPDFTransactionTable(doc, transactions);
    this.addPDFFooter(doc);

    // Convert to blob
    const blob = doc.output('blob');
    return blob;
  },

  /**
   * Add header to PDF
   * @param {jsPDF} doc - jsPDF document instance
   */
  addPDFHeader(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(CONFIG.REPORTS.PDF.TITLE, pageWidth / 2, 40, { align: 'center' });

    // Date range
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Report Generated: ${today}`, pageWidth / 2, 60, { align: 'center' });

    // Line separator
    doc.setLineWidth(1);
    doc.line(40, 70, pageWidth - 40, 70);
  },

  /**
   * Add summary section to PDF
   * @param {jsPDF} doc - jsPDF document instance
   * @param {Array} transactions - Array of transaction objects
   */
  addPDFSummary(doc, transactions) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 90;

    // Calculate summary statistics
    const validTransactions = transactions.filter(txn => !txn.isDuplicate);
    const totalTransactions = validTransactions.length;
    const totalAmount = validTransactions.reduce((sum, txn) => sum + txn.amount, 0);

    // Summary by category
    const categoryTotals = this.calculateCategoryTotals(validTransactions);
    const propertyTotals = this.calculatePropertyTotals(validTransactions);

    // Summary title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary', 40, yPosition);
    yPosition += 20;

    // Overall totals
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Transactions: ${totalTransactions}`, 40, yPosition);
    yPosition += 15;
    doc.text(`Total Amount: ${this.formatCurrency(totalAmount)}`, 40, yPosition);
    yPosition += 25;

    // Category breakdown
    doc.setFont(undefined, 'bold');
    doc.text('By Category:', 40, yPosition);
    yPosition += 15;
    doc.setFont(undefined, 'normal');

    Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        doc.text(`  ${category}: ${this.formatCurrency(amount)}`, 50, yPosition);
        yPosition += 12;
      });

    yPosition += 10;

    // Property breakdown
    doc.setFont(undefined, 'bold');
    doc.text('By Property:', 40, yPosition);
    yPosition += 15;
    doc.setFont(undefined, 'normal');

    Object.entries(propertyTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([property, amount]) => {
        doc.text(`  ${property}: ${this.formatCurrency(amount)}`, 50, yPosition);
        yPosition += 12;
      });
  },

  /**
   * Add transaction table to PDF
   * @param {jsPDF} doc - jsPDF document instance
   * @param {Array} transactions - Array of transaction objects
   */
  addPDFTransactionTable(doc, transactions) {
    // Add new page for transaction details
    doc.addPage();
    let yPosition = 40;

    // Table title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Transaction Details', 40, yPosition);
    yPosition += 20;

    // Table header
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const columns = {
      date: { x: 40, width: 60, label: 'Date' },
      description: { x: 100, width: 150, label: 'Description' },
      amount: { x: 250, width: 60, label: 'Amount' },
      category: { x: 310, width: 80, label: 'Category' },
      property: { x: 390, width: 80, label: 'Property' }
    };

    Object.values(columns).forEach(col => {
      doc.text(col.label, col.x, yPosition);
    });

    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(40, yPosition, 570, yPosition);
    yPosition += 10;

    // Table rows
    doc.setFont(undefined, 'normal');
    const validTransactions = transactions.filter(txn => !txn.isDuplicate);

    validTransactions.forEach(txn => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 40;
      }

      // Truncate description if too long
      let description = txn.description;
      if (description.length > 30) {
        description = description.substring(0, 27) + '...';
      }

      doc.text(txn.transactionDate, columns.date.x, yPosition);
      doc.text(description, columns.description.x, yPosition);
      doc.text(this.formatCurrency(txn.amount), columns.amount.x, yPosition);
      doc.text(txn.category, columns.category.x, yPosition);
      doc.text(txn.property, columns.property.x, yPosition);

      yPosition += 12;
    });
  },

  /**
   * Add footer to PDF
   * @param {jsPDF} doc - jsPDF document instance
   */
  addPDFFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' }
      );
    }
  },

  /**
   * Calculate totals by category
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Object with category totals
   */
  calculateCategoryTotals(transactions) {
    const totals = {};
    transactions.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      totals[category] = (totals[category] || 0) + txn.amount;
    });
    return totals;
  },

  /**
   * Calculate totals by property
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Object with property totals
   */
  calculatePropertyTotals(transactions) {
    const totals = {};
    transactions.forEach(txn => {
      const property = txn.property || 'Unassigned';
      totals[property] = (totals[property] || 0) + txn.amount;
    });
    return totals;
  },

  /**
   * Download file to user's computer
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Generate and download Excel report
   * @param {Array} transactions - Array of transaction objects
   */
  downloadExcelReport(transactions) {
    try {
      const blob = this.generateExcel(transactions);
      const filename = `${CONFIG.REPORTS.EXCEL.FILENAME_PREFIX}${this.getDateString()}.xlsx`;
      this.downloadFile(blob, filename);
      return { success: true, message: 'Excel report downloaded successfully' };
    } catch (error) {
      console.error('Error generating Excel report:', error);
      return { success: false, message: `Error generating Excel report: ${error.message}` };
    }
  },

  /**
   * Generate and download PDF report
   * @param {Array} transactions - Array of transaction objects
   */
  downloadPDFReport(transactions) {
    try {
      const blob = this.generatePDF(transactions);
      const filename = `${CONFIG.REPORTS.PDF.FILENAME_PREFIX}${this.getDateString()}.pdf`;
      this.downloadFile(blob, filename);
      return { success: true, message: 'PDF report downloaded successfully' };
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return { success: false, message: `Error generating PDF report: ${error.message}` };
    }
  },

  /**
   * Format amount for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    return amount.toFixed(2);
  },

  /**
   * Format amount as currency
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  /**
   * Get current date as string for filename
   * @returns {string} Date string YYYY-MM-DD
   */
  getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportGenerator;
}

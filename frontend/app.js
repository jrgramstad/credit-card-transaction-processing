// Main Application Logic for Credit Card Transaction Processing System

// Initialize Supabase client
const supabaseClient = supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

const App = {
  // Application state
  state: {
    transactions: [],
    properties: [],
    categories: [],
    cardholders: [],
    capitalOneFile: null,
    homeDepotFile: null,
    isLoading: false,
    lastSaved: null
  },

  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing Credit Card Transaction Processing System...');

    // Load configuration and master data
    await this.loadMasterData();

    // Set up event listeners
    this.setupEventListeners();

    // Load saved progress from localStorage
    this.loadProgress();

    // Set up auto-save
    this.setupAutoSave();

    console.log('Application initialized successfully');
  },

  /**
   * Load master data from Supabase
   */
  async loadMasterData() {
    try {
      this.showLoading('Loading master data from Supabase...');

      // Load properties
      const { data: propertiesData, error: propError } = await supabaseClient
        .from('properties')
        .select('name')
        .eq('active', true)
        .order('sort_order');

      if (propError) throw propError;
      this.state.properties = propertiesData.map(p => p.name);

      // Load categories
      const { data: categoriesData, error: catError } = await supabaseClient
        .from('categories')
        .select('name')
        .eq('active', true)
        .order('sort_order');

      if (catError) throw catError;
      this.state.categories = categoriesData.map(c => c.name);

      // Load cardholders
      const { data: cardholdersData, error: cardError } = await supabaseClient
        .from('cardholders')
        .select('*')
        .eq('active', true);

      if (cardError) throw cardError;

      // Transform cardholders to match expected format
      this.state.cardholders = cardholdersData.map(ch => ({
        name: ch.full_name,
        cardLast4: ch.card_last_4,
        role: ch.role
      }));

      console.log('Master data loaded from Supabase:', {
        properties: this.state.properties.length,
        categories: this.state.categories.length,
        cardholders: this.state.cardholders.length
      });

      this.hideLoading();
    } catch (error) {
      console.error('Error loading master data:', error);
      this.showError('Failed to load master data from Supabase. Please check your database configuration.');
      this.hideLoading();
    }
  },

  /**
   * Set up event listeners for UI elements
   */
  setupEventListeners() {
    // File upload listeners
    document.getElementById('capitalOneFile').addEventListener('change', (e) => {
      this.handleFileUpload(e, 'capitalOne');
    });

    document.getElementById('homeDepotFile').addEventListener('change', (e) => {
      this.handleFileUpload(e, 'homeDepot');
    });

    // Button listeners
    document.getElementById('processBtn').addEventListener('click', () => {
      this.processFiles();
    });

    document.getElementById('saveProgressBtn').addEventListener('click', () => {
      this.saveProgress();
    });

    document.getElementById('generateReportsBtn').addEventListener('click', () => {
      this.generateReports();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearAll();
    });

    // Download report listeners
    document.getElementById('downloadExcelBtn').addEventListener('click', () => {
      this.downloadExcel();
    });

    document.getElementById('downloadPDFBtn').addEventListener('click', () => {
      this.downloadPDF();
    });
  },

  /**
   * Handle file upload
   */
  async handleFileUpload(event, fileType) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`Uploading ${fileType} file:`, file.name);

    // Validate file size
    if (file.size > CONFIG.UI.MAX_FILE_SIZE) {
      this.showError(`File size exceeds ${CONFIG.UI.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return;
    }

    // Validate file extension
    if (!file.name.endsWith('.csv')) {
      this.showError('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();

      // Validate CSV format
      const formatType = fileType === 'capitalOne' ? 'CAPITAL_ONE' : 'HOME_DEPOT';
      const validation = CSVParser.validateCSVFormat(text, formatType);

      if (!validation.valid) {
        this.showError(`Invalid CSV format: ${validation.message}`);
        return;
      }

      // Store file content
      if (fileType === 'capitalOne') {
        this.state.capitalOneFile = text;
      } else {
        this.state.homeDepotFile = text;
      }

      this.showSuccess(`${fileType === 'capitalOne' ? 'Capital One' : 'Home Depot'} file uploaded successfully`);

      // Enable process button if both files are uploaded
      if (this.state.capitalOneFile || this.state.homeDepotFile) {
        document.getElementById('processBtn').disabled = false;
      }
    } catch (error) {
      console.error('Error reading file:', error);
      this.showError('Error reading file. Please try again.');
    }
  },

  /**
   * Process uploaded CSV files
   */
  processFiles() {
    if (!this.state.capitalOneFile && !this.state.homeDepotFile) {
      this.showError('Please upload at least one CSV file');
      return;
    }

    try {
      this.showLoading('Processing transactions...');

      // Parse and process CSV files
      const transactions = CSVParser.processCSVFiles(
        this.state.capitalOneFile,
        this.state.homeDepotFile
      );

      // Match cardholders based on card last 4
      transactions.forEach(txn => {
        if (!txn.cardholderName) {
          const cardholder = this.state.cardholders.find(ch => ch.cardLast4 === txn.cardLast4);
          if (cardholder) {
            txn.cardholderName = cardholder.name;
          }
        }
      });

      this.state.transactions = transactions;

      console.log(`Processed ${transactions.length} transactions`);

      // Display transactions in table
      this.renderTransactionTable();

      // Show categorization section
      document.getElementById('categorizationSection').style.display = 'block';
      document.getElementById('reportsSection').style.display = 'none';

      this.hideLoading();
      this.showSuccess(`Processed ${transactions.length} transactions successfully`);
    } catch (error) {
      console.error('Error processing files:', error);
      this.showError(`Error processing files: ${error.message}`);
      this.hideLoading();
    }
  },

  /**
   * Render transaction table
   */
  renderTransactionTable() {
    const tbody = document.getElementById('transactionTableBody');
    tbody.innerHTML = '';

    this.state.transactions.forEach((txn, index) => {
      const row = document.createElement('tr');

      // Apply row styling based on status
      if (txn.isDuplicate) {
        row.style.display = 'none'; // Hide duplicates
        return;
      }

      if (txn.autoAssigned) {
        row.style.backgroundColor = CONFIG.UI.COLORS.AUTO_ASSIGNED;
      } else if (txn.needsAssignment) {
        row.style.backgroundColor = CONFIG.UI.COLORS.NEEDS_ASSIGNMENT;
      }

      // Date
      const dateCell = document.createElement('td');
      dateCell.textContent = txn.transactionDate;
      row.appendChild(dateCell);

      // Description
      const descCell = document.createElement('td');
      descCell.textContent = txn.description;
      descCell.title = txn.description; // Show full description on hover
      row.appendChild(descCell);

      // Amount
      const amountCell = document.createElement('td');
      amountCell.textContent = ReportGenerator.formatCurrency(txn.amount);
      amountCell.style.textAlign = 'right';
      row.appendChild(amountCell);

      // Property dropdown
      const propertyCell = document.createElement('td');
      const propertySelect = this.createDropdown(
        `property_${index}`,
        this.state.properties,
        txn.property,
        !txn.autoAssigned
      );
      propertySelect.addEventListener('change', (e) => {
        txn.property = e.target.value;
        this.markAsModified();
      });
      propertyCell.appendChild(propertySelect);
      row.appendChild(propertyCell);

      // Category dropdown
      const categoryCell = document.createElement('td');
      const categorySelect = this.createDropdown(
        `category_${index}`,
        this.state.categories,
        txn.category,
        !txn.autoAssigned
      );
      categorySelect.addEventListener('change', (e) => {
        txn.category = e.target.value;
        this.markAsModified();
      });
      categoryCell.appendChild(categorySelect);
      row.appendChild(categoryCell);

      // Cardholder
      const cardholderCell = document.createElement('td');
      cardholderCell.textContent = txn.cardholderName || 'Unknown';
      row.appendChild(cardholderCell);

      // Card Last 4
      const cardCell = document.createElement('td');
      cardCell.textContent = txn.cardLast4;
      row.appendChild(cardCell);

      // Notes
      const notesCell = document.createElement('td');
      const notesInput = document.createElement('input');
      notesInput.type = 'text';
      notesInput.value = txn.notes || '';
      notesInput.placeholder = 'Add notes...';
      notesInput.style.width = '100%';
      notesInput.addEventListener('change', (e) => {
        txn.notes = e.target.value;
        this.markAsModified();
      });
      notesCell.appendChild(notesInput);
      row.appendChild(notesCell);

      tbody.appendChild(row);
    });

    // Update transaction count
    const visibleCount = this.state.transactions.filter(txn => !txn.isDuplicate).length;
    document.getElementById('transactionCount').textContent = visibleCount;
  },

  /**
   * Create dropdown select element
   */
  createDropdown(id, options, selectedValue, editable) {
    const select = document.createElement('select');
    select.id = id;
    select.className = 'form-control';

    if (!editable) {
      select.disabled = true;
    }

    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select --';
    select.appendChild(emptyOption);

    // Add options
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      if (option === selectedValue) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });

    return select;
  },

  /**
   * Mark as modified (for tracking unsaved changes)
   */
  markAsModified() {
    document.getElementById('saveProgressBtn').classList.add('btn-warning');
    document.getElementById('saveProgressBtn').textContent = 'Save Progress *';
  },

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.state.transactions));
      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SAVED, new Date().toISOString());

      this.state.lastSaved = new Date();

      document.getElementById('saveProgressBtn').classList.remove('btn-warning');
      document.getElementById('saveProgressBtn').classList.add('btn-success');
      document.getElementById('saveProgressBtn').textContent = 'Progress Saved';

      this.showSuccess('Progress saved successfully');

      // Reset button after 2 seconds
      setTimeout(() => {
        document.getElementById('saveProgressBtn').classList.remove('btn-success');
        document.getElementById('saveProgressBtn').textContent = 'Save Progress';
      }, 2000);
    } catch (error) {
      console.error('Error saving progress:', error);
      this.showError('Failed to save progress');
    }
  },

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const savedTransactions = localStorage.getItem(CONFIG.STORAGE_KEYS.TRANSACTIONS);
      const lastSaved = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SAVED);

      if (savedTransactions && lastSaved) {
        const shouldRestore = confirm(
          `Found saved progress from ${new Date(lastSaved).toLocaleString()}. Would you like to restore it?`
        );

        if (shouldRestore) {
          this.state.transactions = JSON.parse(savedTransactions);
          this.state.lastSaved = new Date(lastSaved);

          if (this.state.transactions.length > 0) {
            this.renderTransactionTable();
            document.getElementById('categorizationSection').style.display = 'block';
            this.showSuccess('Progress restored successfully');
          }
        } else {
          this.clearProgress();
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  },

  /**
   * Clear progress from localStorage
   */
  clearProgress() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_SAVED);
  },

  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    setInterval(() => {
      if (this.state.transactions.length > 0) {
        this.saveProgress();
      }
    }, CONFIG.UI.AUTO_SAVE_INTERVAL);
  },

  /**
   * Generate reports
   */
  async generateReports() {
    // Validate that all transactions are properly categorized
    const uncategorized = this.state.transactions.filter(txn =>
      !txn.isDuplicate && (!txn.property || !txn.category)
    );

    if (uncategorized.length > 0) {
      const proceed = confirm(
        `${uncategorized.length} transaction(s) are not fully categorized. Generate reports anyway?`
      );
      if (!proceed) return;
    }

    try {
      this.showLoading('Generating reports...');

      // Save transactions to Google Sheets
      await this.saveTransactionsToSheet();

      // Show reports section
      document.getElementById('reportsSection').style.display = 'block';
      document.getElementById('downloadExcelBtn').disabled = false;
      document.getElementById('downloadPDFBtn').disabled = false;

      this.hideLoading();
      this.showSuccess('Reports generated successfully. Click download buttons to save.');
    } catch (error) {
      console.error('Error generating reports:', error);
      this.showError(`Error generating reports: ${error.message}`);
      this.hideLoading();
    }
  },

  /**
   * Save transactions to Supabase
   */
  async saveTransactionsToSheet() {
    // Filter out duplicates
    const transactionsToSave = this.state.transactions
      .filter(txn => !txn.isDuplicate)
      .map(t => ({
        report_date: new Date().toISOString().split('T')[0],
        posted_date: t.postedDate,
        transaction_date: t.transactionDate || null,
        source: t.source,
        description: t.description,
        amount: parseFloat(t.amount),
        property: t.property,
        category: t.category,
        cardholder_name: t.cardholderName,
        card_last_4: t.cardLast4,
        order_number: t.orderNumber || null,
        store_location: t.storeLocation || null,
        notes: t.notes || null
      }));

    const { data, error } = await supabaseClient
      .from('transactions')
      .insert(transactionsToSave);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save transactions to Supabase: ' + error.message);
    }

    console.log('Transactions saved to Supabase successfully');
    return { success: true };
  },

  /**
   * Download Excel report
   */
  downloadExcel() {
    const result = ReportGenerator.downloadExcelReport(this.state.transactions);
    if (result.success) {
      this.showSuccess(result.message);
    } else {
      this.showError(result.message);
    }
  },

  /**
   * Download PDF report
   */
  downloadPDF() {
    const result = ReportGenerator.downloadPDFReport(this.state.transactions);
    if (result.success) {
      this.showSuccess(result.message);
    } else {
      this.showError(result.message);
    }
  },

  /**
   * Clear all data and reset application
   */
  clearAll() {
    const confirmed = confirm('Are you sure you want to clear all data? This cannot be undone.');
    if (!confirmed) return;

    this.state.transactions = [];
    this.state.capitalOneFile = null;
    this.state.homeDepotFile = null;

    document.getElementById('capitalOneFile').value = '';
    document.getElementById('homeDepotFile').value = '';
    document.getElementById('transactionTableBody').innerHTML = '';
    document.getElementById('categorizationSection').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'none';
    document.getElementById('processBtn').disabled = true;

    this.clearProgress();

    this.showSuccess('All data cleared');
  },

  /**
   * Show loading overlay
   */
  showLoading(message) {
    this.state.isLoading = true;
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('loadingMessage').textContent = message || 'Loading...';
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    this.state.isLoading = false;
    document.getElementById('loadingOverlay').style.display = 'none';
  },

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  },

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, 'error');
  },

  /**
   * Show toast notification
   */
  showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    setTimeout(() => {
      toast.className = 'toast';
    }, CONFIG.UI.TOAST_DURATION);
  },

  /**
   * Open modal
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');

    // Focus the input field
    setTimeout(() => {
      const input = modal.querySelector('.modal-input');
      if (input) input.focus();
    }, 100);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modalId);
      }
    });

    // Close on ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modalId);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  /**
   * Close modal
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');

    // Clear input
    const input = modal.querySelector('.modal-input');
    if (input) input.value = '';
  },

  /**
   * Save new property to Supabase
   */
  async saveNewProperty() {
    const input = document.getElementById('propertyNameInput');
    const propertyName = input.value.trim();

    // Validation
    if (!propertyName) {
      this.showError('Property name cannot be empty');
      return;
    }

    // Check for duplicates
    if (this.state.properties.includes(propertyName)) {
      this.showError('Error: Property already exists');
      return;
    }

    try {
      this.showLoading('Adding property...');

      // Get max sort_order
      const { data: maxData, error: maxError } = await supabaseClient
        .from('properties')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      if (maxError) throw maxError;

      const maxSortOrder = maxData.length > 0 ? maxData[0].sort_order : 0;

      // Insert new property
      const { data, error } = await supabaseClient
        .from('properties')
        .insert({
          name: propertyName,
          active: true,
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;

      // Add to local state
      this.state.properties.push(propertyName);

      // Refresh transaction table to include new property in dropdowns
      this.renderTransactionTable();

      this.hideLoading();
      this.closeModal('addPropertyModal');
      this.showSuccess('Property added successfully!');
    } catch (error) {
      console.error('Error adding property:', error);
      this.hideLoading();
      this.showError(`Failed to add property: ${error.message}`);
    }
  },

  /**
   * Save new category to Supabase
   */
  async saveNewCategory() {
    const input = document.getElementById('categoryNameInput');
    const categoryName = input.value.trim();

    // Validation
    if (!categoryName) {
      this.showError('Category name cannot be empty');
      return;
    }

    // Check for duplicates
    if (this.state.categories.includes(categoryName)) {
      this.showError('Error: Category already exists');
      return;
    }

    try {
      this.showLoading('Adding category...');

      // Get max sort_order
      const { data: maxData, error: maxError } = await supabaseClient
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      if (maxError) throw maxError;

      const maxSortOrder = maxData.length > 0 ? maxData[0].sort_order : 0;

      // Insert new category
      const { data, error } = await supabaseClient
        .from('categories')
        .insert({
          name: categoryName,
          active: true,
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;

      // Add to local state
      this.state.categories.push(categoryName);

      // Refresh transaction table to include new category in dropdowns
      this.renderTransactionTable();

      this.hideLoading();
      this.closeModal('addCategoryModal');
      this.showSuccess('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      this.hideLoading();
      this.showError(`Failed to add category: ${error.message}`);
    }
  }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

# Credit Card Transaction Processing System

A web-based application for processing daily credit card transactions from multiple sources (Capital One and Home Depot), with automatic categorization, deduplication, and report generation.

## Overview

This system helps process 3-5 daily credit card transactions by:
- Uploading CSV files from Capital One and Home Depot
- Automatically deduplicating transactions that appear in both sources
- Auto-assigning properties and categories for Home Depot transactions
- Providing an interface for manual categorization of Capital One transactions
- Generating Excel and PDF reports
- Saving progress locally for resuming later

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Google Apps Script (API layer)
- **Database**: Google Sheets
- **Deployment**: Netlify
- **Libraries**: SheetJS (Excel), jsPDF (PDF generation)

## Project Structure

```
credit-card-transactions/
├── README.md
├── frontend/                 # Frontend web application
│   ├── index.html           # Main page with upload and categorization UI
│   ├── styles.css           # Tablet-friendly styling
│   ├── app.js               # Main application logic
│   ├── csvParser.js         # CSV parsing and deduplication
│   ├── reportGenerator.js   # Excel and PDF generation
│   └── config.js            # API endpoint configuration
├── backend/                 # Google Apps Script code
│   └── Code.gs             # API endpoints for Google Sheets
└── docs/                   # Documentation
    └── BUILD_SPEC.md       # Detailed build specifications
```

## Setup Instructions

### 1. Google Sheet Setup

Create a Google Sheet named "CC_Transaction_Database" with 4 sheets:

**Transactions_Master:**
- Columns: Report_Date, Posted_Date, Transaction_Date, Source, Description, Amount, Property, Category, Cardholder_Name, Card_Last_4, Order_Number, Store_Location, Notes, Created_Timestamp

**Properties:**
- Columns: Property_Name, Active, Sort_Order
- Prepopulate with properties (Chatham Forney, Emerson Forney, Grove Richardson, Nelson Denison, Angelina, Pemrose, Office, Maintenance, Other)

**Categories:**
- Columns: Category_Name, Active, Sort_Order
- Prepopulate with categories (Gas/Automotive, Job Supplies, Storage, Utilities, Fraudulent charge, Office Supplies, Cleaning, Pest Control, Other)

**Cardholders:**
- Columns: Full_Name, Card_Last_4, Role, Active
- Prepopulate with cardholder information

### 2. Google Apps Script Deployment

1. Go to script.google.com
2. Create new project: "CC_Transaction_API"
3. Copy code from `backend/Code.gs`
4. Replace `SHEET_ID` with your Google Sheet ID
5. Deploy as Web App (Execute as: Me, Access: Anyone)
6. Copy the Web App URL

### 3. Frontend Configuration

1. Edit `frontend/config.js`
2. Replace `YOUR_APPS_SCRIPT_URL` with your Web App URL from step 2

### 4. Deployment to Netlify

1. Connect this GitHub repository to Netlify
2. Set build directory to `frontend/`
3. Deploy

## Usage

1. Open the application
2. Upload Capital One CSV file
3. Upload Home Depot CSV file
4. Review auto-assigned transactions (Home Depot)
5. Manually categorize Capital One transactions using dropdowns
6. Click "Save Progress" to save work
7. Click "Generate Reports" to create Excel and PDF files
8. Download reports

## CSV File Formats

### Capital One CSV
```
Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit
2025-10-23,2025-10-24,5453,EXXON SCOTTIES,Gas/Automotive,6.04,
```

### Home Depot CSV
```
Date,Receipt Added Date,Order Origin,Purchaser/Buyer Name-ID,Transaction ID,Register Number,Job Name,Program Disc Amt,Other Disc,Pre-tax Amount,Total Amount Paid,Order Number,Payment,Text2Confirm,Card/Account Nickname,Invoice Number
2025-10-25,2025-10-25,"#542, Fort Worth",,25354,90,4329 Gorman DR,$0.00,-$2.16,$49.67,$53.77,H0542-508664,X-6101,N,,
```

## Processing Rules

### Home Depot Auto-Assignment
- Property = Job Name column value
- Category = "Job Supplies" (default)
- Special rules:
  - If Job Name contains "Supply Room" → Property="Office", Category="Office Supplies"
  - If Job Name = "Fraudulent charge" → Category="Fraudulent charge"
- Card Last 4 = Extract from Payment column (strip "X-" prefix)
- Cardholder = Card/Account Nickname or Purchaser/Buyer Name-ID

### Deduplication Logic
- Match transactions by: amount (±$1) AND date (±1 day) AND "HOME DEPOT" in description
- Keep Home Depot version (has property assigned)
- Remove duplicate from Capital One list

## Development Phases

### Phase 1 (Current)
- Basic file upload and parsing
- Manual categorization interface
- Report generation (Excel + PDF)
- Progress saving (localStorage)

### Phase 2 (Future)
- Auto-categorization rules based on historical data
- Monthly aggregation and summaries
- Enhanced reporting features

## License

Private project - All rights reserved

## Support

For issues or questions, contact the development team.

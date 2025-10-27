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
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify
- **Libraries**: SheetJS (Excel), jsPDF (PDF generation), Supabase JS Client

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
│   └── config.js            # Supabase configuration
├── database/                # Database schema
│   └── schema.sql          # Supabase database schema and seed data
└── docs/                   # Documentation
    └── BUILD_SPEC.md       # Detailed build specifications
```

## Setup Instructions

### 1. Supabase Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project (or use existing)

2. **Run Database Schema**
   - Go to your Supabase dashboard
   - Click "SQL Editor" in left sidebar
   - Click "New query"
   - Copy the entire contents of `database/schema.sql`
   - Paste into SQL Editor and click "Run" (or press Cmd/Ctrl + Enter)
   - Verify tables created: Click "Table Editor" - you should see `properties`, `categories`, `cardholders`, `transactions` tables

3. **Get Supabase Credentials**
   - In Supabase dashboard, go to Settings > API
   - Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy your **anon/public key** (the `anon` key under "Project API keys")

### 2. Frontend Configuration

1. Edit `frontend/config.js`
2. Update the Supabase configuration with your credentials:
   ```javascript
   supabase: {
     url: 'YOUR_SUPABASE_PROJECT_URL',
     anonKey: 'YOUR_SUPABASE_ANON_KEY'
   }
   ```

### 3. Deployment to Netlify

1. Connect this GitHub repository to Netlify
2. Set build directory to `frontend/`
3. Deploy

**Note:** No CORS configuration needed! Supabase handles cross-origin requests automatically.

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

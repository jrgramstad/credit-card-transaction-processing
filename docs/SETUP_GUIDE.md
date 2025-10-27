# Setup Guide - Credit Card Transaction Processing System

This guide will walk you through setting up the complete system from scratch.

## Overview

This system consists of three main components:
1. **Google Sheet** - Database for storing transactions and master data
2. **Google Apps Script** - Backend API for accessing Google Sheets
3. **Netlify Frontend** - Web application for processing transactions

## Step-by-Step Setup

### Step 1: Create Google Sheet Database

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named: **CC_Transaction_Database**
3. Get the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
   ```
4. Save this Sheet ID - you'll need it later

#### Sheet 1: Transactions_Master

Create a sheet named **Transactions_Master** with these column headers (Row 1):

```
Report_Date | Posted_Date | Transaction_Date | Source | Description | Amount | Property | Category | Cardholder_Name | Card_Last_4 | Order_Number | Store_Location | Notes | Created_Timestamp
```

**Column Details:**
- **Report_Date**: Date the transaction was reported/uploaded
- **Posted_Date**: Date the transaction posted to the account
- **Transaction_Date**: Date the transaction occurred
- **Source**: Capital One or Home Depot
- **Description**: Transaction description
- **Amount**: Transaction amount (positive for debits)
- **Property**: Assigned property (e.g., Chatham Forney)
- **Category**: Assigned category (e.g., Job Supplies)
- **Cardholder_Name**: Name of the cardholder
- **Card_Last_4**: Last 4 digits of the card
- **Order_Number**: Order number (for Home Depot)
- **Store_Location**: Store location (for Home Depot)
- **Notes**: Additional notes
- **Created_Timestamp**: Timestamp when record was created

#### Sheet 2: Properties

Create a sheet named **Properties** with these column headers (Row 1):

```
Property_Name | Active | Sort_Order
```

Add these properties (starting in Row 2):

| Property_Name      | Active | Sort_Order |
|--------------------|--------|------------|
| Chatham Forney     | TRUE   | 1          |
| Emerson Forney     | TRUE   | 2          |
| Grove Richardson   | TRUE   | 3          |
| Nelson Denison     | TRUE   | 4          |
| Angelina           | TRUE   | 5          |
| Pemrose            | TRUE   | 6          |
| Office             | TRUE   | 7          |
| Maintenance        | TRUE   | 8          |
| Other              | TRUE   | 99         |

**Note:** Format the Active column as Checkbox

#### Sheet 3: Categories

Create a sheet named **Categories** with these column headers (Row 1):

```
Category_Name | Active | Sort_Order
```

Add these categories (starting in Row 2):

| Category_Name        | Active | Sort_Order |
|---------------------|--------|------------|
| Gas/Automotive      | TRUE   | 1          |
| Job Supplies        | TRUE   | 2          |
| Storage             | TRUE   | 3          |
| Utilities           | TRUE   | 4          |
| Fraudulent charge   | TRUE   | 5          |
| Office Supplies     | TRUE   | 6          |
| Cleaning            | TRUE   | 7          |
| Pest Control        | TRUE   | 8          |
| Other               | TRUE   | 99         |

**Note:** Format the Active column as Checkbox

#### Sheet 4: Cardholders

Create a sheet named **Cardholders** with these column headers (Row 1):

```
Full_Name | Card_Last_4 | Role | Active
```

Add these cardholders (starting in Row 2):

| Full_Name         | Card_Last_4 | Role            | Active |
|-------------------|-------------|-----------------|--------|
| Ashley Gramstad   | 5757        | Owner           | TRUE   |
| Jessica           | 8622        | Back Office     | TRUE   |
| Thomas Tolbert    | 6101        | Project Manager | TRUE   |
| Christian Rojas   | 3891        | Operations      | TRUE   |
| Elijah            | 3876        | Staff           | TRUE   |

**IMPORTANT:** Format the Card_Last_4 column as **Plain Text** (not number) to preserve leading zeros.

**Note:** Format the Active column as Checkbox

---

### Step 2: Deploy Google Apps Script Backend

1. Open [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Name it: **CC_Transaction_API**
4. Delete any default code
5. Copy the entire contents of `backend/Code.gs` from this repository
6. Paste it into the Apps Script editor
7. **IMPORTANT:** Replace `YOUR_SHEET_ID_HERE` with your actual Sheet ID from Step 1
8. Click the disk icon to save

#### Deploy as Web App:

1. Click **Deploy** > **New deployment**
2. Click the gear icon and select **Web app**
3. Fill in the deployment settings:
   - **Description**: CC Transaction API v1
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. Review permissions:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** > **Go to CC_Transaction_API (unsafe)**
   - Click **Allow**
6. **IMPORTANT:** Copy the **Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
7. Save this URL - you'll need it for the frontend

#### Test the API (Optional):

1. In the Apps Script editor, select the `testAPI` function from the dropdown
2. Click the **Run** button
3. Check the **Execution log** - you should see your properties, categories, and cardholders

---

### Step 3: Configure Frontend

1. Open `frontend/config.js` in your code editor
2. Find this line:
   ```javascript
   API_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
   ```
3. Replace `YOUR_APPS_SCRIPT_URL_HERE` with your Web App URL from Step 2
4. Save the file

Example:
```javascript
API_URL: 'https://script.google.com/macros/s/AKfycbz.../exec',
```

---

### Step 4: Test Locally

1. Open `frontend/index.html` in your web browser
2. You should see the Credit Card Transaction Processing interface
3. Check the browser console for any errors (F12)
4. If you see "Master data loaded" in the console, the API is working!

**Troubleshooting:**
- If you see CORS errors, make sure the Apps Script is deployed as "Anyone" access
- If properties/categories don't load, verify your Sheet ID and Web App URL
- Check the Apps Script execution logs for any errors

---

### Step 5: Deploy to Netlify

#### Option A: Connect GitHub Repository

1. Go to [Netlify](https://netlify.com)
2. Click **Add new site** > **Import an existing project**
3. Choose **GitHub** and authorize Netlify
4. Select your repository: `credit-card-transaction-processing`
5. Configure build settings:
   - **Base directory**: Leave empty or use `frontend`
   - **Build command**: Leave empty (no build needed)
   - **Publish directory**: `frontend`
6. Click **Deploy site**
7. Wait for deployment to complete
8. Your site will be live at: `https://[random-name].netlify.app`

#### Option B: Drag and Drop

1. Go to [Netlify](https://netlify.com)
2. Drag the `frontend` folder directly onto the Netlify dashboard
3. Your site will be deployed instantly

#### Custom Domain (Optional):

1. In Netlify, go to **Site settings** > **Domain management**
2. Click **Add custom domain**
3. Follow the instructions to configure your DNS

---

### Step 6: Prepare CSV Files

#### Capital One CSV Format:

Export transactions from Capital One in this format:

```csv
Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit
2025-10-23,2025-10-24,5453,EXXON SCOTTIES,Gas/Automotive,6.04,
2025-10-24,2025-10-25,8622,WALMART,Merchandise,45.67,
```

#### Home Depot CSV Format:

Export purchases from Home Depot in this format:

```csv
Date,Receipt Added Date,Order Origin,Purchaser/Buyer Name-ID,Transaction ID,Register Number,Job Name,Program Disc Amt,Other Disc,Pre-tax Amount,Total Amount Paid,Order Number,Payment,Text2Confirm,Card/Account Nickname,Invoice Number
2025-10-25,2025-10-25,"#542, Fort Worth",,25354,90,4329 Gorman DR,$0.00,-$2.16,$49.67,$53.77,H0542-508664,X-6101,N,,
```

---

## Daily Usage

### Processing Transactions:

1. **Upload Files**:
   - Navigate to your deployed Netlify site
   - Upload Capital One CSV
   - Upload Home Depot CSV
   - Click **Process Transactions**

2. **Review & Categorize**:
   - Home Depot transactions will be auto-assigned (green rows)
   - Capital One transactions need manual assignment (yellow rows)
   - Use dropdowns to assign Property and Category
   - Add notes if needed
   - Click **Save Progress** to save your work

3. **Generate Reports**:
   - Click **Generate Reports** when all transactions are categorized
   - Transactions will be saved to Google Sheets
   - Click **Download Excel** for detailed transaction list
   - Click **Download PDF** for executive summary

4. **Verify in Google Sheets**:
   - Open your Google Sheet
   - Check the Transactions_Master sheet
   - Verify all transactions were saved correctly

---

## Maintenance

### Adding New Properties:

1. Open your Google Sheet
2. Go to the **Properties** sheet
3. Add a new row with: Property Name, TRUE, Sort Order
4. The new property will appear in dropdowns on next page load

### Adding New Categories:

1. Open your Google Sheet
2. Go to the **Categories** sheet
3. Add a new row with: Category Name, TRUE, Sort Order
4. The new category will appear in dropdowns on next page load

### Adding New Cardholders:

1. Open your Google Sheet
2. Go to the **Cardholders** sheet
3. Add a new row with: Full Name, Card Last 4, Role, TRUE
4. Format Card_Last_4 as Plain Text
5. The new cardholder will be auto-matched on next upload

---

## Security Considerations

### Current Setup (Simplicity):
- Apps Script is set to "Anyone" access
- No authentication required
- Suitable for internal use

### Recommended for Production:
1. Implement authentication in Apps Script
2. Use environment variables for sensitive data
3. Restrict access by IP address or domain
4. Add API keys for frontend requests
5. Enable Apps Script execution logging
6. Regularly review access logs

---

## Troubleshooting

### Common Issues:

**Problem:** Properties/categories don't load
- **Solution**: Verify Sheet ID in Code.gs matches your actual sheet
- **Solution**: Check that sheets are named exactly: Properties, Categories, Cardholders
- **Solution**: Verify Apps Script is deployed with "Anyone" access

**Problem:** CORS errors in browser console
- **Solution**: Make sure Apps Script is deployed as Web App with "Anyone" access
- **Solution**: Clear browser cache and refresh

**Problem:** Transactions don't save to Google Sheets
- **Solution**: Check Apps Script execution logs for errors
- **Solution**: Verify you have edit permissions on the Google Sheet
- **Solution**: Re-deploy the Apps Script Web App

**Problem:** CSV parsing errors
- **Solution**: Verify CSV format matches expected structure
- **Solution**: Check for special characters or encoding issues
- **Solution**: Open CSV in text editor to verify format

**Problem:** Duplicate transactions not detected
- **Solution**: Verify Home Depot description includes "HOME DEPOT"
- **Solution**: Check amount and date tolerance settings in config.js

---

## Support

For issues or questions:
1. Check the browser console for error messages (F12)
2. Check Apps Script execution logs for backend errors
3. Review this setup guide for missing steps
4. Contact the development team

---

## Next Steps (Phase 2)

Future enhancements to consider:
1. Auto-categorization based on historical data
2. Monthly aggregation and trend reports
3. Budget tracking and alerts
4. Mobile app version
5. Receipt attachment uploads
6. Multi-user access with authentication
7. Advanced reporting and analytics

---

**Setup Complete!** You're ready to start processing credit card transactions efficiently.

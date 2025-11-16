# Multi-Year Document Records Management

## Overview
Documents now support organizing records by year. Perfect for tracking renewals and historical records of documents like:
- Vehicle Insurance (renews yearly)
- Vehicle Registration
- Driving License Renewal
- Passport Validity
- Any recurring documentation

## How It Works

### Year-Based Organization
```
Document: Vehicle Insurance
├── 2025
│   ├── Current Policy (Jan 2025)
│   ├── Renewal Reminder (Jun 2025)
│   └── Premium Receipt
├── 2024
│   ├── Annual Policy
│   ├── Claim Form
│   └── Renewal Documents
├── 2023
│   ├── Previous Year Policy
│   └── Old Renewal Form
└── 2022
    └── Archive Policy
```

### Firestore Structure
```
users/
  {userId}/
    documents/
      {documentId}/
        documentNumber: "DL123456"
        issuedDate: "2024-01-15"
        expiryDate: "2029-01-15"
        notes: "..."
        years/
          2025/
            files/
              {fileName1}
              {fileName2}
          2024/
            files/
              {fileName3}
              {fileName4}
          2023/
            files/
              {fileName5}
```

## Features

### Year Selector UI
- **Quick Year Buttons**: Click to instantly view records from any year
- **Available Years**: Shows all years with records
- **Add Year Dropdown**: Add new years (2024, 2023, 2022, etc.)
- **Year Counter**: Shows "3 years with records"
- **Current Selection**: Highlights the selected year in blue

### Multi-Year Capabilities
✅ **Create records for any year**: Choose year before uploading files
✅ **View historical records**: Click year button to see all files
✅ **Organize by year**: Automatically grouped in Firestore
✅ **Search across years**: See all records in file explorer
✅ **No year limit**: Store unlimited years of records
✅ **Separate upload/download**: Each year is independent

## Usage Examples

### Example 1: Vehicle Insurance Renewal
1. Go to "Vehicle Insurance" document
2. Select **2025** (current year)
3. Click "Add Record"
4. Upload current insurance policy PDF
5. Previous years visible in year selector

### Example 2: Viewing Last Year's Record
1. Go to "Vehicle Insurance" document
2. Click **2024** button
3. All 2024 insurance files appear
4. Download any previous policy
5. Switch back to 2025 by clicking the button

### Example 3: Adding Multiple Years
1. New document "Vehicle Registration"
2. Select 2025 → Upload current registration
3. Click "+ Add Year" → Select 2024 → Upload old registration
4. Repeat for 2023, 2022, etc.

## File Organization by Year

### Upload to Specific Year
- Select year in year selector
- Click "Add Record"
- Choose files
- Files automatically saved to selected year

### Files Stored Per Year
```
2025: 
  - License_2025.pdf
  - Renewal_Notice_2025.pdf

2024:
  - License_2024.pdf
  - Insurance_Policy_2024.pdf
  - Claim_Form_2024.pdf

2023:
  - License_2023.pdf
```

### Download/Delete by Year
- View year → See all files for that year
- Download: Get original file with original name
- Delete: Remove from specific year only
- Other years unaffected

## Benefits

### Organization
- Clear separation of yearly records
- No mixing of documents across years
- Easy to find specific year's document

### Compliance
- Keep audit trail of changes
- Maintain historical records
- Track renewal cycles

### Efficiency
- Quick access to current year
- Navigate 10 years of history
- Bulk upload by year

### Space
- Organized storage structure
- Easy to archive old years
- Efficient Firestore usage

## Firestore Limits

### Spark Plan (Free)
- **Reads**: Unlimited (per query)
- **Writes**: 20,000/day
- **Document size**: 1 MB max
- **Collection depth**: Unlimited

### Storage Per Document
- Per year: ~5-10 MB recommended
- Across all years: ~100 MB per document (safe limit)
- Base64 files: 33% larger than originals

## Best Practices

### Naming Conventions
✅ DO:
- "Insurance_2025.pdf"
- "Renewal_Notice_Jan2025.pdf"
- "Policy_Active_2025.pdf"

❌ DON'T:
- "file1.pdf"
- "document.pdf"
- "policy.pdf" (without year)

### File Management
✅ Keep per year: 3-10 files (manageable)
✅ Archive old years: Keep last 5 years active
✅ Delete duplicates: Remove old versions within year
✅ Tag dates: Include month/date in filename

### Yearly Workflow
```
Jan 2025: Upload new insurance policy
Jun 2025: Upload renewal reminder
Oct 2025: Archive 2022 records
Dec 2025: Prepare 2024 archival

(Then in 2026, repeat for 2026 vs 2025 historical)
```

## Example Use Cases

### Vehicle Insurance
- 2025: Current policy + renewal notices
- 2024: Last year policy + claims
- 2023: Archive year policy
- 2022: Old records (optional)

### Driving License
- 2025: Current license
- 2023: Previous renewal copy
- 2018: Original issue copy

### Passport
- 2025: Current valid passport
- 2015: Expired passport (record)
- Keep historical for visa applications

### Medical Records
- 2025: Current year reports
- 2024: Yearly checkup records
- 2023: Historical medical history

## Technical Details

### Year Format
- Stored as string: "2025", "2024", etc.
- Sorted descending: 2025 → 2024 → 2023
- Latest year selected by default

### File Path Pattern
```
users/{userId}/documents/{documentId}/years/{year}/files/{fileName}
```

### Available Years List
- Automatically discovered from Firestore
- Sorted newest first
- Updated when new year added
- Dropdown shows only years without records

## Future Enhancements
- Date range filtering (Jan 2024 - Dec 2024)
- Year-over-year comparison
- Automatic yearly archival
- Batch export by year
- Year-based statistics/insights

## FAQ

**Q: Can I upload to multiple years at once?**
A: No, but you can quickly switch years and upload multiple batches.

**Q: Will old years still work?**
A: Yes! All files from 2020, 2015, etc. are accessible.

**Q: Can I move files between years?**
A: Not directly, but you can download and re-upload to another year.

**Q: How many years can I store?**
A: Unlimited! Firestore supports unlimited collection depth.

**Q: What if I don't select a year?**
A: Current year (2025) is selected by default.

**Q: Can I see all files across all years?**
A: Yes, the `listFiles()` function returns files grouped by year.

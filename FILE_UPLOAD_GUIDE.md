# File Upload Feature - Firestore Implementation

## Summary
Converted the file upload feature to use **Firestore instead of Firebase Storage**. This approach:
- ✅ Works with the FREE Spark plan
- ✅ No CORS configuration needed
- ✅ Files stored as base64 in Firestore
- ✅ Full file upload, download, and delete functionality
- ✅ Works locally and on GitHub Pages

## How It Works

### Upload Process
1. User selects a file (image or PDF)
2. File is converted to base64 string
3. File data stored in Firestore subcollection:
   - `users/{userId}/documents/{documentId}/files/{fileName}`
4. Metadata stored: fileName, size, type, uploadedAt, originalName

### Download Process
1. Base64 data retrieved from Firestore
2. Click download button → file downloads to user's device
3. Original file name preserved

### Delete Process
1. Confirmation dialog
2. File document deleted from Firestore
3. UI updates immediately

## Storage Breakdown

### What's Stored Where
| Data | Location |
|------|----------|
| File content (base64) | Firestore |
| File metadata | Firestore |
| Document info | Firestore |
| User tasks | Firestore |

### Firestore Collection Structure
```
users/
  {userId}/
    documents/
      {documentId}/
        - documentNumber: "DL123456"
        - issuedDate: "2024-01-15"
        - expiryDate: "2029-01-15"
        - issuedBy: "RTO"
        - notes: "..."
        - fileUrl: "..."
        files/
          {fileName}/
            - fileName: "1234567890_photo.jpg"
            - fileContent: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            - size: 245000
            - type: "image/jpeg"
            - uploadedAt: "2025-11-15T18:30:00Z"
            - originalName: "photo.jpg"
```

## Firestore Write Limits

### Spark Plan Limits
- **Reads**: Unlimited
- **Writes**: 20,000 per day
- **Document size**: 1 MB max
- **Total data stored**: 1 GB

### File Size Considerations
Since files are stored as base64, size increases by ~33%:
- 1 MB file → ~1.33 MB in Firestore
- 5 MB file → ~6.65 MB in Firestore

### Recommendations
- **Small files recommended**: PDFs, documents, scans (< 1 MB each)
- **Large files**: Consider upgrading plan or external storage
- **Max file per upload**: ~750 KB recommended (stays under 1 MB limit with base64)

## Usage

### Upload a File
1. Navigate to any Document section (e.g., "Driving Licence")
2. Click "Add Record" button (accordion opens)
3. Select a file (image or PDF)
4. File uploads automatically
5. Accordion closes, file appears in list

### Download a File
1. Find file in "Uploaded Records" section
2. Click "Download" button
3. File downloads to your device

### Delete a File
1. Find file in "Uploaded Records" section
2. Click delete button (trash icon)
3. Confirm deletion
4. File removed from Firestore

## Features
- 📁 Multiple files per document
- 📅 Upload date displayed (formatted nicely)
- 📊 File size shown (B, KB, MB, GB)
- 🔄 Newest files shown first
- 🗑️ Delete with confirmation
- 📝 Original file names preserved
- 🖼️ Supports: Images (JPG, PNG, GIF), PDFs
- 📱 Mobile responsive
- 🌓 Dark mode compatible

## Performance
- **Upload speed**: Fast (depends on file size and network)
- **Download speed**: Very fast (base64 string retrieval)
- **List loading**: Instant (reads from Firestore cache)
- **Zero CORS issues**: Uses Firestore API exclusively

## Migration from Firebase Storage

If you upgrade to Blaze plan later and want to use Firebase Storage:
1. The infrastructure is ready
2. Just swap storage.js with Storage SDK
3. Files need to be re-uploaded to Storage
4. Consider building a migration script

## Troubleshooting

### File uploads are slow
- Check network speed
- Files > 500KB will take longer
- Consider splitting large files

### File not downloading
- Check browser console for errors
- Try a different browser
- Clear cache and retry

### Firestore quota exceeded
- Upgrade to Blaze plan
- Implement file size limits
- Archive old files to external storage

## Next Steps (Optional)
1. Add file upload progress bar
2. Add file type icons (PDF vs Image)
3. Add year/date filtering
4. Add file search/filter capability
5. Implement file compression before upload

## Code Changes
- `src/firebase/storage.js` - Rewritten to use Firestore + base64
- `src/pages/DocumentPage.jsx` - Updated download handler for base64
- Removed Firebase Storage imports
- Added FileReader API for base64 conversion

## Links
- [Firestore Limits](https://firebase.google.com/docs/firestore/quotas)
- [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [Base64 Encoding](https://developer.mozilla.org/en-US/docs/Glossary/Base64)

# Firebase Storage CORS Configuration

## Problem
Firebase Storage is blocking file uploads from localhost due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution Options

### Option 1: Using Google Cloud SDK (Recommended) ⭐

#### Prerequisites
1. Download Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. After installation, verify: `gcloud --version`

#### Steps
```powershell
# Initialize gcloud (one-time setup)
gcloud init

# Configure CORS for your storage bucket
gsutil cors set cors.json gs://onenote-6836a.firebasestorage.app

# Verify configuration
gsutil cors get gs://onenote-6836a.firebasestorage.app
```

### Option 2: Using Firebase Console (GUI) 

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `onenote-6836a`
3. Storage → Settings (gear icon)
4. Go to "CORS Configuration" tab
5. Click "Edit CORS Configuration"
6. Paste this JSON:
```json
[
  {
    "origin": ["http://localhost:5174", "http://localhost:3000", "http://localhost:5173", "https://praveenmp.github.io"],
    "method": ["GET", "HEAD", "DELETE", "POST", "PUT"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```
7. Save changes

### Option 3: Using Cloud Console (Alternative)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `onenote-6836a`
3. Search for "Cloud Storage"
4. Click your bucket: `onenote-6836a.firebasestorage.app`
5. Settings → CORS Configuration
6. Add the same JSON as above

## What Each Origin Does

| Origin | Purpose |
|--------|---------|
| `http://localhost:5174` | Your local development server |
| `http://localhost:3000` | Alternative local dev port |
| `http://localhost:5173` | Vite default port |
| `https://praveenmp.github.io` | GitHub Pages deployment |

## After Configuration

1. **Clear browser cache**: Press `Ctrl+Shift+Delete`
2. **Restart dev server**: Stop and run `npm run dev`
3. **Test file upload**: Try uploading a file again

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "gsutil command not found" | Reinstall Google Cloud SDK and restart terminal |
| Still getting CORS errors | Wait 5-10 minutes for config to propagate, then try again |
| "Permission denied" with gsutil | Make sure you're logged in with `gcloud auth login` |
| Works locally but fails on GitHub Pages | Make sure `https://praveenmp.github.io` is in the origins list |

## More Information
- [Firebase Storage CORS Guide](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Google Cloud CORS Docs](https://cloud.google.com/storage/docs/configuring-cors)
- [gsutil cors Documentation](https://cloud.google.com/storage/docs/gsutil/commands/cors)


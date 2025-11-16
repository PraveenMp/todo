// This is a Node.js script to configure CORS on Firebase Storage
// Run this with: node setup-cors.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');

// You need to download your Firebase service account key first:
// 1. Go to Firebase Console
// 2. Project Settings → Service Accounts
// 3. Click "Generate New Private Key"
// 4. Save it as serviceAccountKey.json in your project root

async function setupCORS() {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'onenote-6836a.firebasestorage.app'
    });

    const bucket = getStorage().bucket();
    
    const corsConfiguration = [
      {
        origin: ['http://localhost:5174', 'http://localhost:3000', 'http://localhost:5173', 'https://praveenmp.github.io'],
        method: ['GET', 'HEAD', 'DELETE', 'POST', 'PUT'],
        responseHeader: ['Content-Type', 'Authorization'],
        maxAgeSeconds: 3600
      }
    ];

    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configuration set successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting CORS:', error);
    process.exit(1);
  }
}

setupCORS();

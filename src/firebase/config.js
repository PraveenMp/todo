import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyAXrdNXBaMIXG44JNqvftgYyMLb91inKLE",
  authDomain: "onenote-6836a.firebaseapp.com",
  projectId: "onenote-6836a",
  storageBucket: "onenote-6836a.firebasestorage.app",
  messagingSenderId: "418036027770",
  appId: "1:418036027770:web:1a2ddfd87e5bda3fe246c3",
  measurementId: "G-6BLGL5EXM1"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app

import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

// Your web app's Firebase configuration from the screenshot
const firebaseConfig = {
  apiKey: "AIzaSyBwgIWwdsfVWITwki_ybq32FqWQLZLFYyQ",
  authDomain: "restaurant-app-d0826.firebaseapp.com",
  projectId: "restaurant-app-d0826",
  storageBucket: "restaurant-app-d0826.firebasestorage.app",
  messagingSenderId: "228102201175",
  appId: "1:228102201175:web:a3466ab2027efd42442812",
  measurementId: "G-CTZC3PEK6K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with persistence enabled using the new recommended API
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});


export { db };

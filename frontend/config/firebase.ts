import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAAMKrOFFvC5AxrT5LpvdQGfAHzKFIPWlA",
  authDomain: "barbershop-app-83c6c.firebaseapp.com",
  projectId: "barbershop-app-83c6c",
  storageBucket: "barbershop-app-83c6c.firebasestorage.app",
  messagingSenderId: "291595952010",
  appId: "1:291595952010:web:39577489982bed3994b273"
};

// Initialize Firebase
let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Set persistence for web
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting persistence:', error);
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };

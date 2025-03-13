
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase (normalement ces valeurs devraient venir des variables d'environnement)
const firebaseConfig = {
  apiKey: "AIzaSyD93kReFJm_XleMDUX0bJ5pFBOnPIOfC1o",
  authDomain: "mindful-noise-app.firebaseapp.com",
  projectId: "mindful-noise-app",
  storageBucket: "mindful-noise-app.appspot.com",
  messagingSenderId: "644007370876",
  appId: "1:644007370876:web:5a62bd71a7e0d16a6b95cb"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };

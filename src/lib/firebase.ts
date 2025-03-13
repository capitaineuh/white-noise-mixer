
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase (normalement ces valeurs devraient venir des variables d'environnement)
const firebaseConfig = {
  apiKey: "AIzaSyCskAgi6vEzKA2MuMSWLsAKHOOW7naUgRs",
  authDomain: "whitenoises-548eb.firebaseapp.com",
  databaseURL: "https://whitenoises-548eb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whitenoises-548eb",
  storageBucket: "whitenoises-548eb.firebasestorage.app",
  messagingSenderId: "346886479256",
  appId: "1:346886479256:web:97e2d22de3ee54494b1fed"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };

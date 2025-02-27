import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDL6ewrUgqR1JAOUNnQ675J29Jny1qsan4",
  authDomain: "safepass.fr",
  projectId: "safe-pass-5ebef",
  storageBucket: "safe-pass-5ebef.firebasestorage.app",
  messagingSenderId: "977260058877",
  appId: "1:977260058877:android:9d1443dcf8f709ff4e0694",
};

// Initialisation unique de Firebase
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

// Initialize Auth with configured language
const auth = getAuth();
auth.languageCode = "fr";

// Initialize Firestore
const db = getFirestore();

// if (__DEV__) {
//   connectAuthEmulator(auth, "http://127.0.0.1:9099");
// }

export { auth, db, RecaptchaVerifier };

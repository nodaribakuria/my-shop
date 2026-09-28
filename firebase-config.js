// Firebase-ის დაკავშირება (მოდულური SDK, CDN-იდან, npm არ სჭირდება)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqqc0aFRQW5D66jIEexR402OEMnzkMH-4",
  authDomain: "new-shop-59d7e.firebaseapp.com",
  projectId: "new-shop-59d7e",
  storageBucket: "new-shop-59d7e.firebasestorage.app",
  messagingSenderId: "752591782345",
  appId: "1:752591782345:web:94e84703e6f4a2445d6818"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

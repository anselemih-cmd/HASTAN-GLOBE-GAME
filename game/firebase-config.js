import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyASDYB3K-t4dmonzQtho0x_RAnvrYJTfUs",
  authDomain: "hastan-globe-abcea.firebaseapp.com",
  projectId: "hastan-globe-abcea",
  storageBucket: "hastan-globe-abcea.firebasestorage.app",
  messagingSenderId: "475733099865",
  appId: "1:475733099865:web:8916935cbe86577df9f848"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
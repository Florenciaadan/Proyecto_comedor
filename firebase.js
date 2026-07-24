import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBeKyXVIc3DTLe4ZBDhgakn-kjlmsTEMDs",
  authDomain: "proyecto-comedor-842ed.firebaseapp.com",
  projectId: "proyecto-comedor-842ed",
  storageBucket: "proyecto-comedor-842ed.firebasestorage.app",
  messagingSenderId: "864442006934",
  appId: "1:864442006934:web:f544c442a7f939c2b4b1b7"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };
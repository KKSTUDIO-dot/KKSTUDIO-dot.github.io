// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQECyI2wLqHF0BzletUPiG3ryOqWROPOE",
    databaseURL: "https://ds-studio-app-default-rtdb.firebaseio.com",
    projectId: "ds-studio-app",
    storageBucket: "ds-studio-app.appspot.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
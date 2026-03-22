import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQECyI2wLqHF0BzletUPiG3ryOqWROPOE",
    databaseURL: "https://ds-studio-app-default-rtdb.firebaseio.com",
    projectId: "ds-studio-app",
    storageBucket: "ds-studio-app.appspot.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
export { ref, set, push, onValue };

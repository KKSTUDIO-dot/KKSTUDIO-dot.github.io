import { db } from "./firebase-config.js";
import { ref, set, get, push, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export function getTelegramUser() {
    const tg = window.Telegram.WebApp;
    return tg.initDataUnsafe?.user || null;
}

export async function ensureUserProfile() {
    const user = getTelegramUser();
    if (!user) return null;
    const userId = user.id.toString();
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
        const userData = {
            id: userId,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            username: user.username || "",
            photoUrl: user.photo_url || "",
            createdAt: Date.now()
        };
        await set(userRef, userData);
        return userData;
    }
    return snapshot.val();
}

export async function getUserById(userId) {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        return snapshot.val();
    }
    return null;
}

export async function createAd(adData) {
    const adsRef = ref(db, 'ads');
    const newAdRef = push(adsRef);
    const adWithMeta = {
        ...adData,
        id: newAdRef.key,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    await set(newAdRef, adWithMeta);
    return adWithMeta;
}

export async function moderateAd(adId, newStatus, adminId) {
    const adRef = ref(db, `ads/${adId}`);
    await update(adRef, {
        status: newStatus,
        moderatedBy: adminId,
        moderatedAt: Date.now()
    });
}
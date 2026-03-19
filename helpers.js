import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getCurrentUser() {
    const userId = localStorage.getItem('userId');
    const userNick = localStorage.getItem('userNick');
    return userId ? { userId, userNick } : null;
}

export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        alert('Необходимо войти');
        window.location.href = 'login.html';
    }
    return user;
}

export function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userNick');
    localStorage.removeItem('favorites');
    localStorage.removeItem('history');
    window.location.href = 'index.html';
}

export async function isAdmin(userId) {
    const db = getDatabase();
    const snap = await get(ref(db, `users/${userId}/role`));
    return snap.val() === 'admin';
}

// ------ Избранное (localStorage) ------
export function getFavorites() {
    const fav = localStorage.getItem('favorites');
    return fav ? JSON.parse(fav) : [];
}

export function addFavorite(itemId) {
    const fav = getFavorites();
    if (!fav.includes(itemId)) {
        fav.push(itemId);
        localStorage.setItem('favorites', JSON.stringify(fav));
    }
}

export function removeFavorite(itemId) {
    let fav = getFavorites();
    fav = fav.filter(id => id !== itemId);
    localStorage.setItem('favorites', JSON.stringify(fav));
}

export function isFavorite(itemId) {
    return getFavorites().includes(itemId);
}

// ------ История просмотров (localStorage) ------
export function addToHistory(itemId) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    // Убираем дубликаты и сохраняем последние 20
    history = history.filter(id => id !== itemId);
    history.unshift(itemId);
    if (history.length > 20) history.pop();
    localStorage.setItem('history', JSON.stringify(history));
}

export function getHistory() {
    return JSON.parse(localStorage.getItem('history')) || [];
}
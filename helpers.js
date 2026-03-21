import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from './firebase-config.js';

// ===== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ (из localStorage) =====
export function getCurrentUser() {
    const userId = localStorage.getItem('userId');
    const userNick = localStorage.getItem('userNick');
    return userId ? { userId, userNick } : null;
}

// ===== ПРОВЕРКА, ОТКРЫТО ЛИ ПРИЛОЖЕНИЕ В TELEGRAM =====
export function isTelegramWebApp() {
    return window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe;
}

// ===== ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ИЗ TELEGRAM =====
export function getTelegramUser() {
    if (!isTelegramWebApp()) return null;
    return Telegram.WebApp.initDataUnsafe.user || null;
}

// ===== АВТОРИЗАЦИЯ ЧЕРЕЗ TELEGRAM =====
export async function telegramAuth() {
    const tgUser = getTelegramUser();
    if (!tgUser) return null;

    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};

    let foundUser = null;
    let foundKey = null;
    for (let key in users) {
        if (users[key].telegramId === tgUser.id) {
            foundUser = users[key];
            foundKey = key;
            break;
        }
    }

    if (foundUser) {
        localStorage.setItem('userId', foundKey);
        localStorage.setItem('userNick', foundUser.nick);
        return foundUser;
    } else {
        const nick = tgUser.username || (tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''));
        const newUserRef = push(usersRef);
        const newUser = {
            nick: nick,
            telegramId: tgUser.id,
            telegramUsername: tgUser.username || null,
            role: 'user',
            registered: Date.now(),
        };
        await set(newUserRef, newUser);
        localStorage.setItem('userId', newUserRef.key);
        localStorage.setItem('userNick', nick);
        return newUser;
    }
}

// ===== ПРОВЕРКА ПРАВ АДМИНИСТРАТОРА =====
export async function isAdmin(userId) {
    const snap = await get(ref(db, `users/${userId}/role`));
    return snap.val() === 'admin';
}

// ===== ПОЛУЧИТЬ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (ник, telegram) =====
export async function getUserData(userId) {
    const snap = await get(ref(db, `users/${userId}`));
    return snap.val();
}

// ===== ИЗБРАННОЕ =====
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

// ===== ИСТОРИЯ ПРОСМОТРОВ =====
export function addToHistory(itemId) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    history = history.filter(id => id !== itemId);
    history.unshift(itemId);
    if (history.length > 20) history.pop();
    localStorage.setItem('history', JSON.stringify(history));
}

export function getHistory() {
    return JSON.parse(localStorage.getItem('history')) || [];
}

// ===== ТРЕБОВАТЬ АВТОРИЗАЦИЮ (перенаправляет на главную, если нет) =====
export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        alert('Для этого действия необходимо открыть приложение в Telegram');
        window.location.href = 'index.html';
        return null;
    }
    return user;
}
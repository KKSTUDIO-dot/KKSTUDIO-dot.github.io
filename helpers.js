import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from './firebase-config.js'; // <-- импортируем готовую БД

// ===== Хэширование пароля =====
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== Текущий пользователь (из localStorage) =====
export function getCurrentUser() {
    const userId = localStorage.getItem('userId');
    const userNick = localStorage.getItem('userNick');
    return userId ? { userId, userNick } : null;
}

// ===== Требовать авторизацию (редирект, если нет) =====
export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        alert('Необходимо войти');
        window.location.href = 'login.html';
    }
    return user;
}

// ===== Выход =====
export function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userNick');
    localStorage.removeItem('favorites');
    localStorage.removeItem('history');
    window.location.href = 'index.html';
}

// ===== Проверка прав администратора =====
export async function isAdmin(userId) {
    const snap = await get(ref(db, `users/${userId}/role`)); // используем db
    return snap.val() === 'admin';
}

// ===== Получить данные пользователя (ник, telegram) =====
export async function getUserData(userId) {
    const snap = await get(ref(db, `users/${userId}`)); // используем db
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

// ===== TELEGRAM AUTH =====

/**
 * Проверяет, открыто ли приложение в Telegram Web App
 */
export function isTelegramWebApp() {
    return window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe;
}

/**
 * Получает данные пользователя из Telegram Web App
 * @returns {Object|null} user {id, first_name, last_name, username, photo_url}
 */
export function getTelegramUser() {
    if (!isTelegramWebApp()) return null;
    return Telegram.WebApp.initDataUnsafe.user || null;
}

/**
 * Авторизация через Telegram
 * Ищет пользователя по telegramId, если нет — создаёт нового.
 * @returns {Promise<Object|null>} объект пользователя или null, если ошибка
 */
export async function telegramAuth() {
    const tgUser = getTelegramUser();
    if (!tgUser) return null;

    const usersRef = ref(db, 'users'); // используем db

    // Пытаемся найти пользователя с таким telegramId
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
        // Пользователь уже есть — авторизуем
        localStorage.setItem('userId', foundKey);
        localStorage.setItem('userNick', foundUser.nick);
        return foundUser;
    } else {
        // Создаём нового пользователя
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
import { db, storage } from './firebase-config.js';
import { ref, push, update, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Получение данных пользователя из Telegram (или гостя)
export function getUserData() {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    let userId, userName, userPhoto;

    if (user?.id) {
        userId = user.id.toString();
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        userName = [firstName, lastName].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : 'Пользователь');
        userPhoto = user.photo_url || null;
    } else {
        userId = localStorage.getItem('guestId');
        if (!userId) {
            userId = 'guest_' + Date.now();
            localStorage.setItem('guestId', userId);
        }
        userName = 'Гость';
        userPhoto = null;
    }
    return { userId, userName, userPhoto, tg, user };
}

// Публикация объявления
export async function publishAd(text, file, userId, userName, category = 'sale') {
    if (!text && !file) {
        throw new Error('Введите текст или выберите фото');
    }
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Можно загружать только JPEG, PNG или WEBP');
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Файл не должен превышать 5 МБ');
        }
    }

    let imageUrl = null;
    let storagePath = null;
    if (file) {
        const fileName = `ads/${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, fileName);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
        storagePath = fileName;
    }

    const adsRef = ref(db, 'ads');
    const newAdRef = push(adsRef);
    const adData = {
        text: text || '',
        imageUrl,
        storagePath,
        authorId: userId,
        authorName: userName,
        createdAt: Date.now(),
        category
    };
    await update(newAdRef, adData);

    const userAdRef = ref(db, `users/${userId}/ads/${newAdRef.key}`);
    await update(userAdRef, {
        text: text || '',
        imageUrl,
        storagePath,
        createdAt: Date.now(),
        category
    });
    return newAdRef.key;
}

// Удаление объявления
export async function deleteAd(adId, storagePath, userId) {
    if (storagePath) {
        const fileRef = storageRef(storage, storagePath);
        await deleteObject(fileRef).catch(console.warn);
    }
    await remove(ref(db, `ads/${adId}`));
    await remove(ref(db, `users/${userId}/ads/${adId}`));
}

export async function getUserRole(userId) {
    const userRef = ref(db, `users/${userId}/role`);
    const snapshot = await get(userRef);
    return snapshot.val() || 'user';
}
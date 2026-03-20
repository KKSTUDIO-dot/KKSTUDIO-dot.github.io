import { db } from './firebase-config.js';
import { ref, onValue, update, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getUserData } from './utils.js';

const { userId, tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

let pendingListDiv, usersListDiv;
let currentUserRole = null;

// Проверяем роль текущего пользователя
async function checkAdmin() {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    currentUserRole = userData?.role || 'user';
    if (currentUserRole !== 'admin' && currentUserRole !== 'superadmin') {
        tg.showAlert('Доступ запрещён. Вы не администратор.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function initAdminPage() {
    pendingListDiv = document.getElementById('pending-list');
    usersListDiv = document.getElementById('users-list');
    document.getElementById('tab-pending').addEventListener('click', () => showTab('pending'));
    document.getElementById('tab-users').addEventListener('click', () => showTab('users'));
    
    loadPendingAds();
    if (currentUserRole === 'superadmin') {
        loadUsers();
    } else {
        document.getElementById('tab-users').style.display = 'none';
    }
}

function showTab(tab) {
    document.getElementById('tab-pending').classList.toggle('active', tab === 'pending');
    document.getElementById('tab-users').classList.toggle('active', tab === 'users');
    pendingListDiv.classList.toggle('hidden', tab !== 'pending');
    usersListDiv.classList.toggle('hidden', tab !== 'users');
    if (tab === 'users') loadUsers();
}

function loadPendingAds() {
    pendingListDiv.innerHTML = '<div class="loading">Загрузка...</div>';
    const adsRef = ref(db, 'ads');
    onValue(adsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            pendingListDiv.innerHTML = '<div class="empty">Нет объявлений на модерации</div>';
            return;
        }
        const pendingAds = Object.entries(data).filter(([id, ad]) => ad.status === 'pending');
        if (pendingAds.length === 0) {
            pendingListDiv.innerHTML = '<div class="empty">Нет объявлений на модерации</div>';
            return;
        }
        pendingListDiv.innerHTML = '';
        pendingAds.forEach(([id, ad]) => {
            const card = document.createElement('div');
            card.className = 'good-card admin-card';
            card.innerHTML = `
                <h3>${ad.title || 'Без названия'}</h3>
                <p>${ad.description || ad.text || ''}</p>
                ${ad.imageUrl ? `<img src="${ad.imageUrl}" style="max-width:100%; border-radius:12px;">` : ''}
                <div class="author">Автор: ${ad.authorName || ad.authorId}</div>
                <div class="admin-buttons">
                    <button class="approve-btn" data-id="${id}">✅ Одобрить</button>
                    <button class="reject-btn" data-id="${id}">❌ Отклонить</button>
                </div>
            `;
            pendingListDiv.appendChild(card);
        });
        // Добавляем обработчики
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => moderateAd(btn.dataset.id, 'approved'));
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => moderateAd(btn.dataset.id, 'rejected'));
        });
    });
}

async function moderateAd(adId, newStatus) {
    try {
        await update(ref(db, `ads/${adId}`), { status: newStatus });
        // Также обновляем в профиле пользователя (нужно знать authorId)
        const adSnap = await get(ref(db, `ads/${adId}`));
        const ad = adSnap.val();
        if (ad && ad.authorId) {
            await update(ref(db, `users/${ad.authorId}/ads/${adId}`), { status: newStatus });
        }
        tg.showAlert(`Объявление ${newStatus === 'approved' ? 'одобрено' : 'отклонено'}`);
    } catch (error) {
        console.error(error);
        tg.showAlert('Ошибка');
    }
}

async function loadUsers() {
    usersListDiv.innerHTML = '<div class="loading">Загрузка...</div>';
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            usersListDiv.innerHTML = '<div class="empty">Нет пользователей</div>';
            return;
        }
        usersListDiv.innerHTML = '';
        for (let uid in data) {
            const user = data[uid];
            const role = user.role || 'user';
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div><strong>ID:</strong> ${uid}</div>
                <div><strong>Имя:</strong> ${user.nick || user.authorName || 'Неизвестно'}</div>
                <div><strong>Роль:</strong> ${role}</div>
                ${currentUserRole === 'superadmin' && uid !== userId ? `
                    <select class="role-select" data-uid="${uid}">
                        <option value="user" ${role === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Администратор</option>
                        <option value="superadmin" ${role === 'superadmin' ? 'selected' : ''}>Супер-админ</option>
                    </select>
                    <button class="save-role-btn" data-uid="${uid}">Сохранить</button>
                ` : ''}
            `;
            usersListDiv.appendChild(card);
        }
        if (currentUserRole === 'superadmin') {
            document.querySelectorAll('.save-role-btn').forEach(btn => {
                btn.addEventListener('click', () => changeRole(btn.dataset.uid));
            });
        }
    });
}

async function changeRole(uid) {
    const select = document.querySelector(`.role-select[data-uid="${uid}"]`);
    const newRole = select.value;
    try {
        await update(ref(db, `users/${uid}`), { role: newRole });
        tg.showAlert('Роль обновлена');
        loadUsers(); // перезагружаем
    } catch (error) {
        console.error(error);
        tg.showAlert('Ошибка');
    }
}

// Запуск
checkAdmin().then(isAdmin => {
    if (isAdmin) initAdminPage();
});
import { db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getUserData, deleteAd } from './utils.js';

const { userId, userName, userPhoto, tg, user } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

let profileInfo, profileAdsList, statsElement;

function initProfilePage() {
    profileInfo = document.querySelector('.profile-info');
    profileAdsList = document.querySelector('.profile-ads-list');
    if (!profileInfo) {
        console.error('Элемент .profile-info не найден на странице');
        return;
    }
    loadProfile();
}

function loadProfile() {
    try {
        if (!user?.id) {
            console.log('Гостевой режим, user.id отсутствует');
            // ... (гостевой код)
            return;
        }

        // Данные пользователя Telegram
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь';
        const username = user.username ? `@${user.username}` : '';
        const photoUrl = user.photo_url;

        console.log('Загружаем профиль для:', fullName, userId);

        profileInfo.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    ${photoUrl ? `<img src="${photoUrl}" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                </div>
                <div class="profile-name">
                    <h2>${escapeHtml(fullName)}</h2>
                    ${username ? `<p class="profile-username">${escapeHtml(username)}</p>` : ''}
                </div>
            </div>
            <div class="profile-stats" id="profile-stats">
                <div class="stat-item">
                    <div class="stat-value" id="ads-count">0</div>
                    <div class="stat-label">Объявлений</div>
                </div>
            </div>
        `;
        statsElement = document.getElementById('profile-stats');

        // Загружаем объявления
        profileAdsList.innerHTML = '<div class="loading">Загрузка объявлений...</div>';
        const userAdsRef = ref(db, `users/${userId}/ads`);
        onValue(userAdsRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Получены объявления:', data);
            const adsArray = data ? Object.entries(data).map(([id, ad]) => ({ id, ...ad })) : [];
            adsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            const adsCountSpan = document.getElementById('ads-count');
            if (adsCountSpan) adsCountSpan.textContent = adsArray.length;

            if (adsArray.length === 0) {
                profileAdsList.innerHTML = '<div class="empty">У вас пока нет объявлений</div>';
                return;
            }

            profileAdsList.innerHTML = '';
            for (const ad of adsArray) {
                const card = document.createElement('div');
                card.className = 'good-card';
                const textDiv = document.createElement('div');
                textDiv.className = 'good-text';
                textDiv.textContent = ad.text;
                card.appendChild(textDiv);
                if (ad.imageUrl) {
                    const img = document.createElement('img');
                    img.src = ad.imageUrl;
                    card.appendChild(img);
                }
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Удалить';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', async () => {
                    const confirmed = await tg.showConfirm('Удалить объявление?');
                    if (!confirmed) return;
                    try {
                        await deleteAd(ad.id, ad.storagePath, userId);
                        tg.showAlert('Объявление удалено');
                    } catch (err) {
                        console.error(err);
                        tg.showAlert('Ошибка удаления');
                    }
                });
                card.appendChild(deleteBtn);
                profileAdsList.appendChild(card);
            }
        }, (error) => {
            console.error('Ошибка загрузки объявлений:', error);
            profileAdsList.innerHTML = '<div class="empty">Ошибка загрузки объявлений. Проверьте подключение.</div>';
        });
    } catch (error) {
        console.error('Ошибка в loadProfile:', error);
        if (profileInfo) profileInfo.innerHTML = '<div class="empty">Произошла ошибка при загрузке профиля.</div>';
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

initProfilePage();
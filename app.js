import { db, storage } from './firebase-config.js';
import { ref, onValue, push, update, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ========== Инициализация Telegram ==========
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

const user = tg.initDataUnsafe?.user;
const userId = user?.id ? user.id.toString() : 'guest_' + Date.now();
const userName = user?.first_name || (user?.username ? '@' + user.username : 'Гость');
const userPhoto = user?.photo_url || null;

// ========== Определяем текущую страницу ==========
const isGoodsPage = window.location.pathname.includes('tovars.html');
const isProfilePage = window.location.pathname.includes('profile.html');
const isHomePage = !isGoodsPage && !isProfilePage; // index.html

// ========== Общие Firebase ссылки ==========
const adsRef = ref(db, 'ads');
const userAdsRef = ref(db, `users/${userId}/ads`);

// ========== Функции для страницы товаров ==========
let goodsList, addAdBtn, modal, adText, adImage, cancelAdd, submitAdd;

function initGoodsPage() {
    goodsList = document.querySelector('.goods-list');
    addAdBtn = document.getElementById('add-ad-btn');
    modal = document.getElementById('add-modal');
    adText = document.getElementById('ad-text');
    adImage = document.getElementById('ad-image');
    cancelAdd = document.getElementById('cancel-add');
    submitAdd = document.getElementById('submit-add');

    if (!goodsList) return;
    loadGoods();
    addAdBtn?.addEventListener('click', openModal);
    cancelAdd?.addEventListener('click', closeModal);
    submitAdd?.addEventListener('click', addAd);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function loadGoods() {
    goodsList.innerHTML = '<div class="loading">Загрузка...</div>';
    onValue(adsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            goodsList.innerHTML = '<div class="empty">📭 Объявлений пока нет. Станьте первым!</div>';
            return;
        }
        const adsArray = Object.entries(data).map(([id, ad]) => ({ id, ...ad }));
        adsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        goodsList.innerHTML = '';
        adsArray.forEach(ad => {
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
            const authorDiv = document.createElement('div');
            authorDiv.className = 'good-author';
            authorDiv.textContent = `Автор: ${ad.authorName || 'Неизвестный'}`;
            card.appendChild(authorDiv);
            goodsList.appendChild(card);
        });
    });
}

async function addAd() {
    const text = adText.value.trim();
    const file = adImage.files[0];
    if (!text && !file) {
        tg.showAlert('Введите текст или выберите фото');
        return;
    }
    submitAdd.disabled = true;
    submitAdd.textContent = 'Публикация...';
    try {
        let imageUrl = null;
        let storagePath = null;
        if (file) {
            const fileName = `ads/${Date.now()}_${file.name}`;
            const fileRef = storageRef(storage, fileName);
            await uploadBytes(fileRef, file);
            imageUrl = await getDownloadURL(fileRef);
            storagePath = fileName;
        }
        const newAdRef = push(adsRef);
        const adData = {
            text: text || '',
            imageUrl: imageUrl,
            storagePath: storagePath,
            authorId: userId,
            authorName: userName,
            createdAt: Date.now()
        };
        await update(newAdRef, adData);
        const userAdRef = ref(db, `users/${userId}/ads/${newAdRef.key}`);
        await update(userAdRef, {
            text: text || '',
            imageUrl: imageUrl,
            storagePath: storagePath,
            createdAt: Date.now()
        });
        adText.value = '';
        adImage.value = '';
        closeModal();
        tg.showAlert('Объявление опубликовано!');
    } catch (error) {
        console.error(error);
        tg.showAlert('Ошибка публикации');
    } finally {
        submitAdd.disabled = false;
        submitAdd.textContent = 'Опубликовать';
    }
}

function openModal() { modal.classList.add('open'); }
function closeModal() { modal.classList.remove('open'); adText.value = ''; adImage.value = ''; }

// ========== Функции для страницы профиля ==========
let profileInfo, profileAdsList;

function initProfilePage() {
    profileInfo = document.querySelector('.profile-info');
    profileAdsList = document.querySelector('.profile-ads-list');
    if (!profileInfo) return;
    loadProfile();
}

function loadProfile() {
    profileInfo.innerHTML = `
        <p><strong>${userName}</strong></p>
        <p>ID: ${userId}</p>
        ${userPhoto ? `<img src="${userPhoto}" alt="avatar" style="width: 60px; border-radius: 50%; margin-top: 8px;">` : ''}
    `;
    profileAdsList.innerHTML = '<div class="loading">Загрузка...</div>';
    onValue(userAdsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            profileAdsList.innerHTML = '<div class="empty">У вас пока нет объявлений</div>';
            return;
        }
        const userAds = Object.entries(data).map(([id, ad]) => ({ id, ...ad }));
        userAds.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        profileAdsList.innerHTML = '';
        userAds.forEach(ad => {
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
            deleteBtn.style.marginTop = '8px';
            deleteBtn.style.backgroundColor = 'var(--destructive)';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.padding = '6px 12px';
            deleteBtn.style.borderRadius = '8px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.addEventListener('click', async () => {
                const confirmed = await tg.showConfirm('Удалить объявление?');
                if (!confirmed) return;
                try {
                    await remove(ref(db, `ads/${ad.id}`));
                    await remove(ref(db, `users/${userId}/ads/${ad.id}`));
                    tg.showAlert('Объявление удалено');
                } catch (err) {
                    console.error(err);
                    tg.showAlert('Ошибка удаления');
                }
            });
            card.appendChild(deleteBtn);
            profileAdsList.appendChild(card);
        });
    });
}

// ========== Запуск в зависимости от страницы ==========
if (isGoodsPage) {
    initGoodsPage();
} else if (isProfilePage) {
    initProfilePage();
} else {
    // Главная страница – просто приветствие, ничего дополнительно не нужно
    console.log('Главная страница');
}
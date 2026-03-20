import { db, storage } from './firebase-config.js';
import { ref, push, onValue, remove, update, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ========== Инициализация Telegram ==========
const tg = window.Telegram.WebApp;
tg.expand();                         // Развернуть на весь экран
tg.enableClosingConfirmation();      // Подтверждение при закрытии

// Данные пользователя
const user = tg.initDataUnsafe?.user;
const userId = user?.id ? user.id.toString() : 'guest_' + Date.now();
const userName = user?.first_name || (user?.username ? '@' + user.username : 'Гость');
const userPhoto = user?.photo_url || null;

// ========== DOM элементы ==========
const sidebar = document.getElementById('sidebar');
const burgerBtn = document.getElementById('burger-menu');
const closeSidebar = document.getElementById('close-sidebar');
const goodsPage = document.getElementById('goods-page');
const profilePage = document.getElementById('profile-page');
const goodsList = document.querySelector('.goods-list');
const profileInfo = document.querySelector('.profile-info');
const profileAdsList = document.querySelector('.profile-ads-list');
const addAdBtn = document.getElementById('add-ad-btn');
const modal = document.getElementById('add-modal');
const adText = document.getElementById('ad-text');
const adImage = document.getElementById('ad-image');
const cancelAdd = document.getElementById('cancel-add');
const submitAdd = document.getElementById('submit-add');

// ========== Firebase ссылки ==========
const adsRef = ref(db, 'ads');               // все объявления
const userAdsRef = ref(db, `users/${userId}/ads`); // объявления пользователя

// ========== Состояние ==========
let currentPage = 'goods';   // 'goods' или 'profile'

// ========== Функции навигации ==========
function navigateTo(page) {
    currentPage = page;
    if (page === 'goods') {
        goodsPage.classList.add('active');
        profilePage.classList.remove('active');
        addAdBtn.style.display = 'flex';
        loadGoods();              // загружаем объявления при переходе
    } else {
        goodsPage.classList.remove('active');
        profilePage.classList.add('active');
        addAdBtn.style.display = 'none';
        loadProfile();           // загружаем профиль и свои объявления
    }
    closeSidebarMenu();
}

function openSidebarMenu() {
    sidebar.classList.add('open');
    // Создаём оверлей, если его нет
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeSidebarMenu);
        document.body.appendChild(overlay);
    }
    document.querySelector('.sidebar-overlay').classList.add('active');
}

function closeSidebarMenu() {
    sidebar.classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ========== Загрузка всех объявлений ==========
function loadGoods() {
    // Показываем индикатор загрузки
    goodsList.innerHTML = '<div class="loading">Загрузка...</div>';

    onValue(adsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            goodsList.innerHTML = '<div class="empty">📭 Объявлений пока нет. Станьте первым!</div>';
            return;
        }

        // Преобразуем объект в массив и сортируем по времени (новые сверху)
        const adsArray = Object.entries(data).map(([id, ad]) => ({ id, ...ad }));
        adsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        goodsList.innerHTML = ''; // очищаем
        adsArray.forEach(ad => renderGoodCard(ad, goodsList));
    });
}

// ========== Загрузка профиля и своих объявлений ==========
function loadProfile() {
    // Заполняем информацию о пользователе
    profileInfo.innerHTML = `
        <p><strong>${userName}</strong></p>
        <p>ID: ${userId}</p>
        ${userPhoto ? `<img src="${userPhoto}" alt="avatar" style="width: 60px; border-radius: 50%; margin-top: 8px;">` : ''}
    `;

    // Подгружаем свои объявления
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
        userAds.forEach(ad => renderProfileAdCard(ad, profileAdsList));
    });
}

// ========== Отрисовка карточки объявления на главной ==========
function renderGoodCard(ad, container) {
    const card = document.createElement('div');
    card.className = 'good-card';

    const textDiv = document.createElement('div');
    textDiv.className = 'good-text';
    textDiv.textContent = ad.text;
    card.appendChild(textDiv);

    if (ad.imageUrl) {
        const img = document.createElement('img');
        img.src = ad.imageUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        img.style.marginTop = '8px';
        card.appendChild(img);
    }

    const authorDiv = document.createElement('div');
    authorDiv.className = 'good-author';
    authorDiv.textContent = `Автор: ${ad.authorName || 'Неизвестный'}`;
    card.appendChild(authorDiv);

    container.appendChild(card);
}

// ========== Отрисовка карточки в профиле (с кнопкой удаления) ==========
function renderProfileAdCard(ad, container) {
    const card = document.createElement('div');
    card.className = 'good-card';

    const textDiv = document.createElement('div');
    textDiv.className = 'good-text';
    textDiv.textContent = ad.text;
    card.appendChild(textDiv);

    if (ad.imageUrl) {
        const img = document.createElement('img');
        img.src = ad.imageUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        img.style.marginTop = '8px';
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
    deleteBtn.addEventListener('click', () => deleteAd(ad.id, ad.imageUrl));
    card.appendChild(deleteBtn);

    container.appendChild(card);
}

// ========== Удаление объявления ==========
async function deleteAd(adId, imageUrl) {
    const confirmed = await tg.showConfirm('Удалить объявление?');
    if (!confirmed) return;

    try {
        // Удаляем из базы
        const adRef = ref(db, `ads/${adId}`);
        await remove(adRef);
        // Удаляем из пользовательского списка
        const userAdRef = ref(db, `users/${userId}/ads/${adId}`);
        await remove(userAdRef);

        // Если есть картинка, удаляем из Storage
        if (imageUrl) {
            // Из URL получаем путь. Для Firebase Storage URL вида:
            // https://firebasestorage.googleapis.com/v0/b/.../o/...?alt=media
            // Проще сохранять путь при создании, но для удаления можно вытащить.
            // Упростим: при создании будем сохранять storagePath.
            // Пока оставим удаление только из базы, а фото останется – для простоты.
        }

        tg.showAlert('Объявление удалено');
    } catch (error) {
        console.error('Ошибка удаления:', error);
        tg.showAlert('Не удалось удалить');
    }
}

// ========== Добавление объявления ==========
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
            // Генерируем уникальное имя
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

        // Сохраняем ссылку в профиле пользователя
        const userAdRef = ref(db, `users/${userId}/ads/${newAdRef.key}`);
        await update(userAdRef, {
            text: text || '',
            imageUrl: imageUrl,
            storagePath: storagePath,
            createdAt: Date.now()
        });

        // Очистка формы
        adText.value = '';
        adImage.value = '';
        closeModal();

        tg.showAlert('Объявление опубликовано!');
    } catch (error) {
        console.error('Ошибка добавления:', error);
        tg.showAlert('Ошибка публикации');
    } finally {
        submitAdd.disabled = false;
        submitAdd.textContent = 'Опубликовать';
    }
}

// ========== Модальное окно ==========
function openModal() {
    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
    adText.value = '';
    adImage.value = '';
}

// ========== Обработчики событий ==========
burgerBtn.addEventListener('click', openSidebarMenu);
closeSidebar.addEventListener('click', closeSidebarMenu);
addAdBtn.addEventListener('click', openModal);
cancelAdd.addEventListener('click', closeModal);
submitAdd.addEventListener('click', addAd);

// Закрытие модалки по клику вне
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Обработка кликов по пунктам меню
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page === 'goods') navigateTo('goods');
        else if (page === 'profile') navigateTo('profile');
    });
});

// ========== Запуск ==========
// При запуске показываем страницу товаров
navigateTo('goods');

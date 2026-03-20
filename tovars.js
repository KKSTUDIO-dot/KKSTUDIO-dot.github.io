import { db } from './firebase-config.js';
import { ref, onValue, push, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getUserData } from './utils.js';

const { userId, userName, tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

let goodsList, showAddBtn, addForm, adCategory, adTitle, adDesc, adImageUrl, cancelBtn, submitBtn, statusDiv;
let allAds = [];
let currentCategory = 'sale';

function initGoodsPage() {
    goodsList = document.querySelector('.goods-list');
    showAddBtn = document.getElementById('show-add-form');
    addForm = document.getElementById('add-form');
    adCategory = document.getElementById('ad-category');
    adTitle = document.getElementById('ad-title');
    adDesc = document.getElementById('ad-description');
    adImageUrl = document.getElementById('ad-image-url');
    cancelBtn = document.getElementById('cancel-add');
    submitBtn = document.getElementById('submit-add');
    statusDiv = document.getElementById('add-status');

    if (!goodsList) return;

    // Табы
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            filterAds();
        });
    });

    // Показать/скрыть форму
    showAddBtn.addEventListener('click', () => {
        addForm.classList.toggle('hidden');
    });
    cancelBtn.addEventListener('click', () => {
        addForm.classList.add('hidden');
        resetForm();
    });
    submitBtn.addEventListener('click', handleAddAd);

    loadGoods();
}

function resetForm() {
    adCategory.value = 'sale';
    adTitle.value = '';
    adDesc.value = '';
    adImageUrl.value = '';
    statusDiv.innerHTML = '';
}

function loadGoods() {
    goodsList.innerHTML = '<div class="loading">Загрузка...</div>';
    const adsRef = ref(db, 'ads');
    onValue(adsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            allAds = [];
            filterAds();
            return;
        }
        allAds = Object.entries(data)
            .map(([id, ad]) => ({ id, ...ad }))
            .filter(ad => ad.status === 'approved'); // только одобренные
        allAds.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        filterAds();
    }, (error) => {
        console.error('Ошибка загрузки объявлений:', error);
        goodsList.innerHTML = '<div class="empty">Ошибка загрузки объявлений.</div>';
    });
}

function filterAds() {
    const filtered = allAds.filter(ad => (ad.category || 'sale') === currentCategory);
    if (filtered.length === 0) {
        goodsList.innerHTML = '<div class="empty">📭 В этой категории пока нет объявлений.</div>';
        return;
    }
    goodsList.innerHTML = '';
    filtered.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'good-card';
        
        // Заголовок
        const titleEl = document.createElement('h3');
        titleEl.textContent = ad.title || 'Без названия';
        card.appendChild(titleEl);
        
        // Текст (описание)
        const descEl = document.createElement('div');
        descEl.className = 'good-text';
        descEl.textContent = ad.description || ad.text; // совместимость со старыми
        card.appendChild(descEl);
        
        // Фото
        if (ad.imageUrl) {
            const img = document.createElement('img');
            img.src = ad.imageUrl;
            card.appendChild(img);
        }
        
        // Автор
        const authorDiv = document.createElement('div');
        authorDiv.className = 'good-author';
        authorDiv.textContent = `Автор: ${ad.authorName || 'Неизвестный'}`;
        card.appendChild(authorDiv);
        
        goodsList.appendChild(card);
    });
}

async function handleAddAd() {
    const category = adCategory.value;
    const title = adTitle.value.trim();
    const description = adDesc.value.trim();
    const imageUrl = adImageUrl.value.trim();

    if (!title && !description) {
        statusDiv.innerHTML = '<div class="error">Введите название или описание</div>';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    statusDiv.innerHTML = '<div class="info">Отправляем на модерацию...</div>';

    try {
        const adsRef = ref(db, 'ads');
        const newAdRef = push(adsRef);
        const adData = {
            title: title || '',
            description: description || '',
            text: description || '', // для совместимости со старыми полями
            imageUrl: imageUrl || null,
            storagePath: null,
            authorId: userId,
            authorName: userName,
            createdAt: Date.now(),
            category,
            status: 'pending'  // на модерации
        };
        await update(newAdRef, adData);

        // Сохраняем в профиле пользователя
        const userAdRef = ref(db, `users/${userId}/ads/${newAdRef.key}`);
        await update(userAdRef, {
            title: title || '',
            description: description || '',
            text: description || '',
            imageUrl: imageUrl || null,
            createdAt: Date.now(),
            category,
            status: 'pending'
        });

        statusDiv.innerHTML = '<div class="success">✅ Объявление отправлено на модерацию!</div>';
        resetForm();
        addForm.classList.add('hidden');
        tg.showAlert('Объявление отправлено на модерацию. Оно появится после проверки.');
    } catch (error) {
        console.error(error);
        statusDiv.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить на модерацию';
    }
}

initGoodsPage();
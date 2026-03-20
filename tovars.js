import { db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getUserData, publishAd } from './utils.js';

const { userId, userName, tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

let goodsList, addAdBtn, modal, adCategory, adText, adImage, cancelAdd, submitAdd;
let allAds = [];
let currentCategory = 'sale';

function initGoodsPage() {
    goodsList = document.querySelector('.goods-list');
    addAdBtn = document.getElementById('add-ad-btn');
    modal = document.getElementById('add-modal');
    adCategory = document.getElementById('ad-category');
    adText = document.getElementById('ad-text');
    adImage = document.getElementById('ad-image');
    cancelAdd = document.getElementById('cancel-add');
    submitAdd = document.getElementById('submit-add');

    if (!goodsList) return;

    // Инициализация табов
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            filterAds();
        });
    });

    loadGoods();
    addAdBtn?.addEventListener('click', openModal);
    cancelAdd?.addEventListener('click', closeModal);
    submitAdd?.addEventListener('click', handleAddAd);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
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
        allAds = Object.entries(data).map(([id, ad]) => ({ id, ...ad }));
        allAds.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        filterAds();
    }, (error) => {
        console.error('Ошибка загрузки объявлений:', error);
        goodsList.innerHTML = '<div class="empty">Ошибка загрузки объявлений. Проверьте подключение.</div>';
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
}

async function handleAddAd() {
    const category = adCategory.value;
    const text = adText.value.trim();
    const file = adImage.files[0];
    
    if (!text && !file) {
        tg.showAlert('Введите текст или выберите фото');
        return;
    }
    
    submitAdd.disabled = true;
    submitAdd.textContent = 'Публикация...';
    try {
        await publishAd(text, file, userId, userName, category);
        adText.value = '';
        adImage.value = '';
        adCategory.value = 'sale';
        closeModal();
        tg.showAlert('Объявление опубликовано!');
    } catch (error) {
        console.error(error);
        tg.showAlert(error.message || 'Ошибка публикации');
    } finally {
        submitAdd.disabled = false;
        submitAdd.textContent = 'Опубликовать';
    }
}

function openModal() {
    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
    adText.value = '';
    adImage.value = '';
    adCategory.value = 'sale';
}

initGoodsPage();
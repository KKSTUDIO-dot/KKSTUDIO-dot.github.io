import { db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getUserData } from './utils.js';

const { tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

let goodsList;
let allAds = [];
let currentCategory = 'sale';

function initGoodsPage() {
    goodsList = document.querySelector('.goods-list');
    if (!goodsList) return;

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

initGoodsPage();
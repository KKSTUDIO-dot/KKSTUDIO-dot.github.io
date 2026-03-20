import { db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getUserData, publishAd } from './utils.js';

const { userId, userName, tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

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
    submitAdd?.addEventListener('click', handleAddAd);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function loadGoods() {
    goodsList.innerHTML = '<div class="loading">Загрузка...</div>';
    const adsRef = ref(db, 'ads');
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

async function handleAddAd() {
    const text = adText.value.trim();
    const file = adImage.files[0];
    submitAdd.disabled = true;
    submitAdd.textContent = 'Публикация...';
    try {
        await publishAd(text, file, userId, userName);
        adText.value = '';
        adImage.value = '';
        closeModal();
        tg.showAlert('Объявление опубликовано!');
    } catch (error) {
        tg.showAlert(error.message);
    } finally {
        submitAdd.disabled = false;
        submitAdd.textContent = 'Опубликовать';
    }
}

function openModal() { modal.classList.add('open'); }
function closeModal() { modal.classList.remove('open'); adText.value = ''; adImage.value = ''; }

initGoodsPage();
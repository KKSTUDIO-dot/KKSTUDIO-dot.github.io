import { getUserData, publishAd } from './utils.js';

const { userId, userName, tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

const form = document.getElementById('publish-form');
const categorySelect = document.getElementById('pub-category');
const textarea = document.getElementById('pub-text');
const imageInput = document.getElementById('pub-image');
const imagePreview = document.getElementById('image-preview');
const cancelBtn = document.getElementById('cancel-publish');
const submitBtn = document.getElementById('submit-publish');
const statusDiv = document.getElementById('publish-status');

// Предпросмотр фото
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            imagePreview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
});

// Отмена – закрыть WebApp или вернуться назад
cancelBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        tg.close();
    }
});

// Публикация
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const category = categorySelect.value;
    const text = textarea.value.trim();
    const file = imageInput.files[0];
    
    if (!text && !file) {
        statusDiv.innerHTML = '<div class="error">Введите текст или выберите фото</div>';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Публикация...';
    statusDiv.innerHTML = '<div class="info">Публикуем...</div>';
    
    try {
        await publishAd(text, file, userId, userName, category);
        statusDiv.innerHTML = '<div class="success">✅ Объявление опубликовано!</div>';
        form.reset();
        imagePreview.innerHTML = '';
        setTimeout(() => {
            window.location.href = 'tovars.html';
        }, 2000);
    } catch (error) {
        console.error(error);
        statusDiv.innerHTML = `<div class="error">❌ Ошибка: ${error.message}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Опубликовать';
    }
});
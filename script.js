const tg = window.Telegram.WebApp;

// Расширяем приложение на весь экран ТГ
tg.expand();

// Анимация логотипа при старте
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.body.classList.add('shifted');
    }, 1200);
});

// Открыть полноэкранную страницу
function openPage(id) {
    const page = document.getElementById(id);
    page.style.display = 'flex';
    
    // Вибрация при нажатии
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// Закрыть страницу
function closePage(id) {
    const page = document.getElementById(id);
    page.style.display = 'none';
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

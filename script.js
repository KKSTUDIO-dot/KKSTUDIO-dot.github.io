const tg = window.Telegram.WebApp;
tg.expand();

// Запуск анимации при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.body.classList.add('shifted');
    }, 1200);
});

// Открыть вкладку
function openPage(id) {
    document.getElementById(id).style.display = 'flex';
    tg.HapticFeedback.impactOccurred('medium');
}

// Закрыть вкладку
function closePage(id) {
    document.getElementById(id).style.display = 'none';
    tg.HapticFeedback.impactOccurred('light');
}

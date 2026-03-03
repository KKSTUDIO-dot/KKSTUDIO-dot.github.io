const tg = window.Telegram.WebApp;

// Сообщаем Telegram, что приложение готово
tg.ready();
tg.expand();

// Имитация загрузки
window.addEventListener('load', () => {
    const fill = document.getElementById('fill');
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 30;
        if (width >= 100) {
            width = 100;
            clearInterval(interval);
            
            setTimeout(() => {
                splash.style.opacity = '0';
                app.classList.remove('hidden');
                setTimeout(() => splash.remove(), 500);
            }, 300);
        }
        fill.style.width = width + '%';
    }, 200);

    // Подставляем реальное имя из Telegram
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('user-greeting').innerText = `Привет, ${user.first_name}!`;
        document.getElementById('user-avatar').innerText = user.first_name[0];
    }
});

// Проверяем, есть ли сохранённая тема в localStorage
if (localStorage.getItem("theme") === "gray") {
    document.body.classList.add("gray-mode");
    document.getElementById("theme-toggle").textContent = "☀️ Светлая тема"; // меняем текст кнопки
} else {
    document.getElementById("theme-toggle").textContent = "🌙 Серая тема"; // начальный текст кнопки
}

// Переключение серой темы
document.getElementById("theme-toggle").addEventListener("click", function() {
    document.body.classList.toggle("gray-mode");

    // Сохраняем состояние темы в localStorage
    if (document.body.classList.contains("gray-mode")) {
        localStorage.setItem("theme", "gray");
        document.getElementById("theme-toggle").textContent = "☀️ Светлая тема"; // меняем текст на "Светлая тема"
    } else {
        localStorage.setItem("theme", "light");
        document.getElementById("theme-toggle").textContent = "🌙 Серая тема"; // меняем текст на "Серая тема"
    }
});

// Анимированные частички на фоне
particlesJS("particles-js", {
    particles: {
        number: { value: 50 },
        size: { value: 3 },
        move: { speed: 2 }
    }
});

// Скрытие сплеша
window.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash');
    const mainApp = document.getElementById('mainApp');
    setTimeout(() => {
        if (splash) {
            splash.classList.add('hide');
            setTimeout(() => {
                splash.style.display = 'none';
                if (mainApp) mainApp.style.display = 'flex';
                renderCurrentTab();
            }, 800);
        } else {
            if (mainApp) mainApp.style.display = 'flex';
            renderCurrentTab();
        }
    }, 2000);
});

let currentTab = 'feed'; // 'entity', 'feed', 'chats', 'profile'

// Заглушки для чатов и профиля (пока без базы)
const mockChats = [
    { id: 1, name: 'Анна', lastMsg: 'Привет!', avatar: '👩' },
    { id: 2, name: 'Денис', lastMsg: 'Смотри новый пост', avatar: '👨' }
];
const mockProfile = {
    name: 'Алексей',
    nick: '@alex_design',
    bio: 'Дизайнер, разработчик, люблю тёмные темы',
    postsCount: 12,
    followers: 156,
    following: 89
};

// Рендер постов из localStorage
function renderPosts(type) {
    const allPosts = JSON.parse(localStorage.getItem('social_posts')) || [];
    const filtered = allPosts.filter(p => p.type === type);
    if (filtered.length === 0) {
        return `<div style="text-align:center; padding:40px; color:#9ca3b5;">
                    <i class="fas fa-feather-alt" style="font-size:48px; margin-bottom:12px; display:block;"></i>
                    Пока нет постов. Нажмите «+», чтобы создать первый!
                </div>`;
    }
    return filtered.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar"><i class="fas fa-user-circle"></i></div>
                <div>
                    <div class="post-author">Пользователь</div>
                    <div class="post-time">${new Date(post.date).toLocaleString()}</div>
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.text)}</div>
            ${post.image ? `<img src="${post.image}" class="post-image" alt="фото">` : ''}
            <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${post.likes}</span>
                <span><i class="fas fa-comment"></i> ${post.comments.length}</span>
            </div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\n\r]/g, '<br>');
}

function renderEntityFeed() {
    return `
        <h2 style="margin-bottom:16px;"><i class="fas fa-shapes"></i> Сущность — сладость или гадость?</h2>
        <div id="entityPostsContainer">${renderPosts('entity')}</div>
    `;
}

function renderRegularFeed() {
    return `
        <h2 style="margin-bottom:16px;"><i class="fas fa-newspaper"></i> Лента новостей</h2>
        <div id="feedPostsContainer">${renderPosts('feed')}</div>
    `;
}

function renderChats() {
    return `
        <h2><i class="fas fa-comments"></i> Чаты</h2>
        ${mockChats.map(chat => `
            <div class="post-card" style="display:flex; align-items:center; gap:12px;">
                <div class="post-avatar">${chat.avatar}</div>
                <div style="flex:1">
                    <b>${chat.name}</b><br>
                    <small>${chat.lastMsg}</small>
                </div>
                <i class="fas fa-chevron-right" style="color:#9ca3b5"></i>
            </div>
        `).join('')}
        <div class="post-card" style="text-align:center; color:#9ca3b5;">
            <i class="fas fa-comment-dots"></i> Скоро здесь будет настоящий мессенджер
        </div>
    `;
}

function renderProfile() {
    return `
        <div style="text-align:center;">
            <div class="post-avatar" style="width:100px;height:100px;font-size:60px;margin:0 auto 16px;">
                <i class="fas fa-user-circle"></i>
            </div>
            <h2>${mockProfile.name}</h2>
            <p style="color:#9ca3b5">${mockProfile.nick}</p>
            <p style="margin:16px 0;">${mockProfile.bio}</p>
            <div style="display:flex; justify-content:space-around; background:#0f131c; padding:16px; border-radius:28px; margin:20px 0;">
                <div><span style="display:block; font-weight:bold; font-size:20px;">${mockProfile.postsCount}</span> постов</div>
                <div><span style="display:block; font-weight:bold; font-size:20px;">${mockProfile.followers}</span> подписчиков</div>
                <div><span style="display:block; font-weight:bold; font-size:20px;">${mockProfile.following}</span> подписок</div>
            </div>
            <button id="editProfileBtn" style="background:#3b82f6; border:none; padding:12px 24px; border-radius:40px; color:white;">Редактировать профиль</button>
        </div>
    `;
}

function renderCurrentTab() {
    const container = document.getElementById('mainContent');
    if (!container) return;
    if (currentTab === 'entity') {
        container.innerHTML = renderEntityFeed();
    } else if (currentTab === 'feed') {
        container.innerHTML = renderRegularFeed();
    } else if (currentTab === 'chats') {
        container.innerHTML = renderChats();
    } else if (currentTab === 'profile') {
        container.innerHTML = renderProfile();
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) editBtn.onclick = () => alert('Редактирование профиля будет позже');
    }
}

// Навигация
function setActiveTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.dataset.tab === tabId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab) {
            currentTab = tab;
            setActiveTab(tab);
            renderCurrentTab();
            // ripple эффект
            createRipple(e, btn);
        }
    });
});

// Кнопка "+" -> переход на post.html
const createBtn = document.getElementById('createPostBtn');
if (createBtn) {
    createBtn.addEventListener('click', (e) => {
        createRipple(e, createBtn);
        window.location.href = 'post.html';
    });
}

// Ripple effect
function createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size/2;
    const y = event.clientY - rect.top - size/2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab === 'profile') {
            createRipple(e, btn);
            window.location.href = 'profile.html';   // переход на страницу профиля
            return;
        }
        // для остальных вкладок — обычное переключение
        if (tab) {
            currentTab = tab;
            setActiveTab(tab);
            renderCurrentTab();
            createRipple(e, btn);
        }
    });
});

// Установить активную вкладку по умолчанию (Лента)
setActiveTab('feed'); 

import { getDatabase, ref, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getCurrentUser, logout, isAdmin, getFavorites, addFavorite, removeFavorite, isFavorite, addToHistory } from './helpers.js';
import { db } from './firebase-config.js';

// Пользовательское меню
const user = getCurrentUser();
if (user) {
    document.getElementById('guestMenu').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userNickDisplay').textContent = user.userNick;
    document.getElementById('logoutBtn').addEventListener('click', logout);
    isAdmin(user.userId).then(admin => {
        if (admin) document.getElementById('adminLink').style.display = 'inline-flex';
    });
}

// Элементы
const container = document.getElementById('itemsContainer');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Состояние
let currentType = 'all';
let currentCategory = 'all';
let currentSort = 'dateDesc';
let currentPage = 1;
let allItems = [];
const pageSize = 6;

// Подписка на изменения базы
const itemsRef = ref(db, 'items');
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    const now = Date.now();
    allItems = [];
    if (data) {
        for (let id in data) {
            const item = data[id];
            const isExpired = (item.timestamp + 3 * 24 * 60 * 60 * 1000) < now;
            if (item.status === 'approved' && !isExpired) {
                allItems.push({ id, ...item });
            }
        }
    }
    renderPage();
});

// Фильтрация и сортировка
function getFiltered() {
    let filtered = allItems;
    if (currentType !== 'all') filtered = filtered.filter(i => i.type === currentType);
    if (currentCategory !== 'all') filtered = filtered.filter(i => i.category === currentCategory);
    const search = searchInput.value.toLowerCase().trim();
    if (search) filtered = filtered.filter(i => i.name.toLowerCase().includes(search));
    
    filtered.sort((a, b) => {
        if (currentSort === 'dateDesc') return b.timestamp - a.timestamp;
        if (currentSort === 'dateAsc') return a.timestamp - b.timestamp;
        if (currentSort === 'priceAsc') return a.price - b.price;
        if (currentSort === 'priceDesc') return b.price - a.price;
        if (currentSort === 'viewsDesc') return (b.views || 0) - (a.views || 0);
        return 0;
    });
    return filtered;
}

function renderPage() {
    const filtered = getFiltered();
    const total = filtered.length;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    if (pageItems.length === 0) {
        container.innerHTML = '<div class="no-items"><i class="fas fa-box-open"></i><br>Ничего не найдено</div>';
    } else {
        let html = '';
        pageItems.forEach(item => {
            const price = item.price.toLocaleString();
            const desc = item.description || 'Нет описания';
            const date = new Date(item.timestamp).toLocaleDateString();
            const fav = user ? isFavorite(item.id) : false;

            let typeClass, typeIcon, typeLabel;
            switch (item.type) {
                case 'sale': typeClass = 'type-sale'; typeIcon = 'fa-tag'; typeLabel = 'Продажа'; break;
                case 'buy': typeClass = 'type-buy'; typeIcon = 'fa-cart-shopping'; typeLabel = 'Покупка'; break;
                case 'rent': typeClass = 'type-rent'; typeIcon = 'fa-hand-holding-dollar'; typeLabel = 'Аренда'; break;
                case 'ad': typeClass = 'type-ad'; typeIcon = 'fa-bullhorn'; typeLabel = 'Реклама'; break;
                default: typeClass = ''; typeIcon = 'fa-question'; typeLabel = item.type;
            }

            let categoryLabel = '';
            switch (item.category) {
                case 'accessories': categoryLabel = 'Аксессуары'; break;
                case 'resources': categoryLabel = 'Ресурсы'; break;
                case 'realty': categoryLabel = 'Недвижимость'; break;
                case 'transport': categoryLabel = 'Транспорт'; break;
                default: categoryLabel = item.category;
            }

            let imagesHtml = '';
            if (item.images && item.images.length) {
                imagesHtml = '<div class="item-images">' + item.images.slice(0,3).map(url => `<img src="${url}">`).join('') + '</div>';
            }

            html += `
                <div class="item-card" data-id="${item.id}">
                    ${imagesHtml}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="item-type ${typeClass}"><i class="fas ${typeIcon}"></i> ${typeLabel}</span>
                        ${user ? `<button class="favorite-btn ${fav ? 'active' : ''}" data-id="${item.id}"><i class="fa${fav ? 's' : 'r'} fa-heart"></i></button>` : ''}
                    </div>
                    <h3 class="item-title">${escapeHtml(item.name)}</h3>
                    <div class="item-price"><i class="fas fa-coins"></i> ${price}</div>
                    <div class="item-category"><i class="fas fa-tags"></i> ${categoryLabel}</div>
                    <div class="item-description">${escapeHtml(desc)}</div>
                    <div class="item-footer">
                        <span class="views"><i class="far fa-eye"></i> ${item.views || 0}</span>
                        <span><i class="far fa-clock"></i> ${date}</span>
                        ${item.userId === user?.userId ? `<button class="delete-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>` : ''}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // Клик по карточке
        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-btn') || e.target.closest('.delete-btn')) return;
                const id = card.dataset.id;
                addToHistory(id);
                window.location.href = `product.html?id=${id}`;
            });
        });

        // Избранное
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (btn.classList.contains('active')) {
                    removeFavorite(id);
                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="far fa-heart"></i>';
                } else {
                    addFavorite(id);
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-heart"></i>';
                }
            });
        });

        // Удаление (только свои)
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Удалить объявление?')) {
                    await remove(ref(db, `items/${id}`));
                }
            });
        });
    }

    // Пагинация
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = end >= total;
    pageInfo.textContent = `Страница ${currentPage}`;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/[&<>"]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

// Обработчики фильтров
searchInput.addEventListener('input', () => { currentPage = 1; renderPage(); });
categorySelect.addEventListener('change', (e) => { currentCategory = e.target.value; currentPage = 1; renderPage(); });
sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; renderPage(); });
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
        currentPage = 1;
        renderPage();
    });
});

// Пагинация
prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); } });
nextBtn.addEventListener('click', () => { currentPage++; renderPage(); });
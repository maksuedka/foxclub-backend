/* admin-panel.js – универсальная работа и локально, и на Railway */

// ======================= ПРОВЕРКА ПРАВ АДМИНИСТРАТОРА =======================
(function checkAdminAccess() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const user = JSON.parse(userStr);
        if (!user.isAdmin) {
            window.location.href = 'index.html';
            return;
        }
        window.currentAdmin = user;
    } catch (e) {
        window.location.href = 'index.html';
    }
})();

// ======================= АВТООПРЕДЕЛЕНИЕ БАЗОВОГО URL =======================
function getBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    }
    return `${window.location.protocol}//${window.location.hostname}`;
}

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api/dashboard`;
const ADMIN_POSTS_URL = `${BASE_URL}/api/admin/posts`;
const COMMENTS_API = `${BASE_URL}/api/comments`;
const AUTH_API = `${BASE_URL}/api/auth`;

console.log('Admin panel using API base:', BASE_URL);

// ======================= ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =======================
let currentTable = '';
let currentTableLabel = '';
let currentTableElement = null;
let tableHeaders = [];
let tableData = [];
let modal;
let sortOrder = 1;
let commentsModal, photosModal;

let clubsList = [];
let usersList = [];
let abonementsList = [];

// ======================= ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ =======================
function toggleTheme() {
    const body = document.body;
    const label = document.getElementById('themeLabel');
    const icon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    if (isDark) {
        // Тёмная тема → показываем «Светлая тема» и солнце
        if (label) label.textContent = 'Светлая тема';
        if (icon) icon.className = 'fas fa-sun';
    } else {
        // Светлая тема → показываем «Тёмная тема» и луну
        if (label) label.textContent = 'Тёмная тема';
        if (icon) icon.className = 'fas fa-moon';
    }
}

// ======================= ОБНОВЛЕНИЕ ТАБЛИЦЫ =======================
function refreshTable() {
    if (currentTable === 'posts_moderation') {
        showPostsModeration(currentTableElement);
    } else if (currentTable) {
        selectTable(currentTable, currentTableLabel, currentTableElement);
    } else {
        showNotification('warning', 'Нет активной таблицы для обновления');
    }
}

// ======================= ИНИЦИАЛИЗАЦИЯ =======================
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация темы – по умолчанию тёмная
    const body = document.body;
    if (!body.classList.contains('dark-theme')) {
        body.classList.add('dark-theme');
    }
    const label = document.getElementById('themeLabel');
    const icon = document.getElementById('themeIcon');
    if (label) label.textContent = 'Светлая тема';
    if (icon) icon.className = 'fas fa-sun';

    modal = new bootstrap.Modal(document.getElementById('dataModal'));
    commentsModal = new bootstrap.Modal(document.getElementById('commentsModal'));
    photosModal = new bootstrap.Modal(document.getElementById('photosModal'));
    await loadMenu();
});

// ======================= ЗАГРУЗКА СПРАВОЧНЫХ ДАННЫХ =======================
async function loadReferenceData() {
    try {
        const [clubsRes, usersRes, abonementsRes] = await Promise.all([
            fetch(`${API_URL}/data/clubs`),
            fetch(`${API_URL}/data/users`),
            fetch(`${API_URL}/data/abonements`)
        ]);
        if (clubsRes.ok) clubsList = (await clubsRes.json()).data || [];
        if (usersRes.ok) usersList = (await usersRes.json()).data || [];
        if (abonementsRes.ok) abonementsList = (await abonementsRes.json()).data || [];
    } catch (e) {
        console.warn('Ошибка загрузки справочных данных:', e);
    }
}

// ======================= ЗАГРУЗКА МЕНЮ =======================
async function loadMenu() {
    try {
        const res = await fetch(`${API_URL}/tables`);
        if (!res.ok) throw new Error('Сервер недоступен');
        const tables = await res.json();
        const menu = document.getElementById('sidebarMenu');
        menu.innerHTML = '';
        tables.forEach((t, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `<a class="nav-link ${index === 0 ? 'active' : ''}" data-key="${t.key}" data-label="${t.label}" onclick="selectTable('${t.key}', '${t.label}', this)"><i class="fas fa-table"></i> ${t.label}</a>`;
            menu.appendChild(li);
        });

        const postsLi = document.createElement('li');
        postsLi.className = 'nav-item';
        postsLi.innerHTML = `<a class="nav-link" onclick="showPostsModeration(this)"><i class="fas fa-newspaper"></i> Посты (модерация)</a>`;
        menu.appendChild(postsLi);

        const scannerLi = document.createElement('li');
        scannerLi.className = 'nav-item';
        scannerLi.innerHTML = `<a class="nav-link" href="scanner.html"><i class="fas fa-qrcode"></i> Сканер QR</a>`;
        menu.appendChild(scannerLi);

        if (tables.length > 0) {
            const firstTable = tables[0];
            await selectTable(firstTable.key, firstTable.label, menu.querySelector('.nav-link.active'));
        }
    } catch (e) {
        document.getElementById('sidebarMenu').innerHTML = `<li style="padding:20px; text-align:center; color:#f44336;">Сервер недоступен</li>`;
    }
}

// ======================= МОДЕРАЦИЯ ПОСТОВ =======================
async function showPostsModeration(element) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    currentTable = 'posts_moderation';
    currentTableLabel = 'Модерация постов';
    currentTableElement = element;

    document.getElementById('tableTitle').innerText = 'Модерация постов';
    document.getElementById('totalRecords').innerText = '0';
    document.getElementById('tableBody').innerHTML = `<tr><td colspan="10" class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Загрузка постов...</p></td></tr>`;

    try {
        const res = await fetch(ADMIN_POSTS_URL);
        if (!res.ok) throw new Error('Ошибка загрузки');
        const posts = await res.json();
        document.getElementById('totalRecords').innerText = posts.length;
        renderPostsTable(posts);
    } catch (e) {
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="10" class="text-center text-danger">Ошибка загрузки постов: ${e.message}</td></tr>`;
    }
}

async function showPostComments(postId) {
    document.getElementById('commentPostId').innerText = postId;
    const container = document.getElementById('commentsList');
    container.innerHTML = '<p class="text-center">Загрузка...</p>';

    try {
        const res = await fetch(`${COMMENTS_API}/post/${postId}`);
        if (!res.ok) throw new Error();
        const comments = await res.json();
        if (!comments.length) {
            container.innerHTML = '<p class="text-center text-muted">Нет комментариев</p>';
            return;
        }
        container.innerHTML = '';
        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'list-group-item list-group-item-action';
            div.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <strong>${c.authorFirstName || 'Пользователь'} ${c.authorLastName || ''}</strong>
                    <small>${c.createdAt ? new Date(c.createdAt).toLocaleString('ru-RU') : ''}</small>
                </div>
                <p class="mb-1">${(c.text || '').replace(/\n/g, '<br>')}</p>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<p class="text-center text-danger">Ошибка загрузки комментариев</p>';
    }

    commentsModal.show();
}

async function showPostPhotos(postId, images) {
    if (!images || images.length === 0) {
        alert('Нет фотографий');
        return;
    }

    document.getElementById('photosPostId').innerText = postId;
    const container = document.getElementById('photosList');
    container.innerHTML = '';

    images.forEach((img, idx) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6 mb-3';
        col.innerHTML = `
            <div class="card h-100 bg-dark border-secondary">
                <img src="${img}" class="card-img-top" style="height:150px; object-fit:cover; cursor:pointer;" alt="Фото ${idx+1}" onclick="window.open('${img}', '_blank')">
                <div class="card-body p-2 text-center">
                    <small class="text-muted">Фото ${idx+1}</small>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    photosModal.show();
}

function renderPostsTable(posts) {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');

    thead.innerHTML = `<tr>
        <th>ID</th>
        <th>Автор</th>
        <th>Текст</th>
        <th>Фото</th>
        <th>Статус</th>
        <th>Дата</th>
        <th>Действия</th>
        <th>Комментарии</th>
    </tr>`;

    tbody.innerHTML = '';

    if (!posts.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Нет постов для модерации</td></tr>';
        return;
    }

    posts.forEach(post => {
        const tr = document.createElement('tr');
        const statusClass = post.status === 'APPROVED'
            ? 'badge-success'
            : (post.status === 'REJECTED' ? 'badge-danger' : 'badge-pending');
        const statusText = post.status === 'APPROVED'
            ? 'Одобрен'
            : (post.status === 'REJECTED' ? 'Заблокирован' : 'На модерации');
        const createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString('ru-RU') : '—';
        const images = post.images || [];

        let thumbHtml = '';
        if (images.length) {
            thumbHtml = `<div class="post-thumbnails">`;
            images.slice(0, 2).forEach(img => {
                thumbHtml += `<img src="${img}" class="post-thumb" onclick="showPostPhotos(${post.id}, ${JSON.stringify(images).replace(/"/g, '&quot;')})">`;
            });
            if (images.length > 2) thumbHtml += `<span>+${images.length - 2}</span>`;
            thumbHtml += `</div>`;
        } else {
            thumbHtml = '<span class="text-muted">—</span>';
        }

        tr.innerHTML = `
            <td>${post.id}</td>
            <td>${post.authorFirstName || ''} ${post.authorLastName || ''} (ID: ${post.authorId})</td>
            <td style="max-width:250px; word-break:break-word;">${(post.text || '').substring(0, 80)}</td>
            <td>${thumbHtml}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>${createdAt}</td>
            <td>
                <button class="btn-custom btn-approve" onclick="moderatePost(${post.id}, 'APPROVED')" ${post.status === 'APPROVED' ? 'disabled' : ''}>Одобрить</button>
                <button class="btn-custom btn-block" onclick="moderatePost(${post.id}, 'REJECTED')" ${post.status === 'REJECTED' ? 'disabled' : ''}>Заблокировать</button>
                <button class="btn-custom btn-del" onclick="deletePost(${post.id})">Удалить</button>
            </td>
            <td>
                <button class="btn-custom" style="background:#6c757d;" onclick="showPostComments(${post.id})">Комментарии</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function moderatePost(postId, status) {
    try {
        const res = await fetch(`${ADMIN_POSTS_URL}/${postId}/moderate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            showNotification('success', `Пост ${postId} переведён в статус ${status === 'APPROVED' ? 'Одобрен' : 'Заблокирован'}`);
            if (currentTable === 'posts_moderation') await showPostsModeration();
        } else {
            const err = await res.text();
            showNotification('error', `Ошибка: ${err}`);
        }
    } catch (e) {
        showNotification('error', 'Ошибка сети');
    }
}

async function deletePost(postId) {
    if (!confirm('Удалить пост безвозвратно?')) return;

    try {
        const res = await fetch(`${ADMIN_POSTS_URL}/${postId}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('success', `Пост ${postId} удалён`);
            if (currentTable === 'posts_moderation') await showPostsModeration();
        } else {
            const err = await res.text();
            showNotification('error', `Ошибка: ${err}`);
        }
    } catch (e) {
        showNotification('error', 'Ошибка сети');
    }
}

// ======================= ВЫБОР ТАБЛИЦЫ =======================
async function selectTable(key, label, element) {
    if (element) {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }

    currentTable = key;
    currentTableLabel = label;
    currentTableElement = element;

    document.getElementById('tableTitle').innerText = label;
    document.getElementById('tableBody').innerHTML = `<tr><td colspan="10" class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Загрузка данных...</p></td></tr>`;

    try {
        await loadReferenceData();
        const res = await fetch(`${API_URL}/data/${key}`);
        if (!res.ok) throw new Error('Ошибка загрузки данных');

        const response = await res.json();
        tableHeaders = response.headers || [];
        tableData = response.data || [];
        document.getElementById('totalRecords').innerText = tableData.length;
        renderTable(tableData);
    } catch (e) {
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="10" class="text-center text-danger">Ошибка: ${e.message}</td></tr>`;
    }
}

// ======================= ОТРИСОВКА ТАБЛИЦЫ =======================
function renderTable(data) {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');

    let headHtml = '<tr><th style="width:40px"><input type="checkbox" onclick="toggleAll(this)"></th>';
    tableHeaders.forEach(h => {
        headHtml += `<th onclick="sortData('${h.key}')">${h.title} <i class="fas fa-sort small"></i></th>`;
    });
    headHtml += '</tr>';

    thead.innerHTML = headHtml;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${tableHeaders.length + 1}" class="empty-state">Нет записей</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    data.forEach(row => {
        let rowHtml = `<td><input type="checkbox" class="row-check" value="${row.id || ''}" onclick="event.stopPropagation()"></td>`;

        tableHeaders.forEach(h => {
            let value = row[h.key] !== undefined && row[h.key] !== null ? row[h.key] : '';

            // Спецобработка для связанных полей
            if (currentTable === 'users') {
                if (h.key === 'club' && value) {
                    const club = clubsList.find(c => c.id == value);
                    value = club ? club.name || '?' : 'ID: ' + value;
                }
                if (h.key === 'isAdmin') {
                    value = value ? '✅ Да' : '❌ Нет';
                }
            } else if (currentTable === 'admins') {
                if (h.key === 'club' && value) {
                    const club = clubsList.find(c => c.id == value);
                    value = club ? club.name || '?' : 'ID: ' + value;
                }
            } else if (currentTable === 'goals') {
                if (h.key === 'user' && value) {
                    const user = usersList.find(u => u.id == value);
                    if (user) value = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ID: ' + value;
                }
            } else if (currentTable === 'purchased-abonements') {
                if (h.key === 'user' && value) {
                    const user = usersList.find(u => u.id == value);
                    if (user) value = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ID: ' + value;
                } else if (h.key === 'abonement' && value) {
                    const abonement = abonementsList.find(a => a.id == value);
                    value = abonement ? abonement.name || '?' : 'ID: ' + value;
                }
            }

            // Форматирование чисел и дат
            if (h.key === 'price' || h.key === 'targetValue' || h.key === 'currentValue' || h.key === 'priceAtPurchase') {
                value = value ? Number(value).toFixed(2) : '';
            } else if (h.key.includes('date') && value) {
                try { value = new Date(value).toLocaleDateString('ru-RU'); } catch (e) {}
            }

            rowHtml += `<td onclick="openEditModal(${row.id})">${value}</td>`;
        });

        const tr = document.createElement('tr');
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
}

// ======================= ПОИСК В ТАБЛИЦЕ =======================
let searchTimeout;

document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    if (!searchBox) return;

    searchBox.addEventListener('input', (e) => {
        if (currentTable === 'posts_moderation') return;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                renderTable(tableData);
                return;
            }
            const filtered = tableData.filter(row => Object.values(row).some(val => val && String(val).toLowerCase().includes(term)));
            renderTable(filtered);
        }, 300);
    });
});

// ======================= РЕДАКТИРОВАНИЕ ЗАПИСЕЙ =======================
function openAddModal() {
    if (currentTable === 'posts_moderation') return;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>Новая запись';
    generateForm({});
    modal.show();
}

function openEditModal(id) {
    if (currentTable === 'posts_moderation') return;
    const row = tableData.find(r => r.id == id);
    if (!row) return;
    document.getElementById('modalTitle').innerHTML = `<i class="fas fa-edit me-2"></i>Редактирование ID: ${id}`;
    generateForm(row);
    modal.show();
}

function generateForm(data) {
    if (currentTable === 'posts_moderation') return;
    const container = document.getElementById('formFields');
    container.innerHTML = '';

    tableHeaders.forEach(h => {
        if (h.key === 'id') {
            if (data.id) container.innerHTML += `<input type="hidden" name="id" value="${data.id}">`;
            return;
        }

        const col = document.createElement('div');
        col.className = 'col-md-6';

        const div = document.createElement('div');
        div.className = 'mb-3';
        div.innerHTML = `<label class="form-label fw-bold" style="color:var(--primary-color);">${h.title}</label>`;

        if (h.key === 'isAdmin') {
            const select = document.createElement('select');
            select.className = 'form-select';
            select.name = h.key;
            const optNo = document.createElement('option');
            optNo.value = '0';
            optNo.textContent = 'Нет';
            if (data[h.key] == 0 || data[h.key] === false || data[h.key] === null) optNo.selected = true;
            select.appendChild(optNo);
            const optYes = document.createElement('option');
            optYes.value = '1';
            optYes.textContent = 'Да';
            if (data[h.key] == 1 || data[h.key] === true) optYes.selected = true;
            select.appendChild(optYes);
            div.appendChild(select);
        } else if (h.key === 'club') {
            const select = document.createElement('select');
            select.className = 'form-select';
            select.name = h.key;
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '-- Не выбран --';
            select.appendChild(empty);
            clubsList.forEach(club => {
                const opt = document.createElement('option');
                opt.value = club.id;
                opt.textContent = club.name || '?';
                if (data[h.key] == club.id) opt.selected = true;
                select.appendChild(opt);
            });
            div.appendChild(select);
        } else if (h.key === 'user') {
            const select = document.createElement('select');
            select.className = 'form-select';
            select.name = h.key;
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '-- Не выбран --';
            select.appendChild(empty);
            usersList.forEach(user => {
                const opt = document.createElement('option');
                opt.value = user.id;
                opt.textContent = `${user.firstName || ''} ${user.lastName || ''} (${user.email || '?'})`.trim();
                if (data[h.key] == user.id) opt.selected = true;
                select.appendChild(opt);
            });
            div.appendChild(select);
        } else if (h.key === 'abonementId' || h.key === 'abonement') {
            const select = document.createElement('select');
            select.className = 'form-select';
            select.name = h.key;
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '-- Не выбран --';
            select.appendChild(empty);
            abonementsList.forEach(ab => {
                const opt = document.createElement('option');
                opt.value = ab.id;
                opt.textContent = `${ab.name || '?'} (${ab.price || '?'} руб.)`;
                if (data[h.key] == ab.id) opt.selected = true;
                select.appendChild(opt);
            });
            div.appendChild(select);
        } else if (h.key === 'type' && currentTable === 'goals') {
            const select = document.createElement('select');
            select.className = 'form-select';
            select.name = h.key;

            const types = [
                { value: 'weight-loss', label: 'Похудение' },
                { value: 'mass-gain', label: 'Набор массы' },
                { value: 'strength', label: 'Силовые показатели' },
                { value: 'cardio', label: 'Кардионагрузка' }
            ];

            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.value;
                opt.textContent = t.label;
                if (data[h.key] === t.value) opt.selected = true;
                select.appendChild(opt);
            });

            div.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.className = 'form-control';
            input.name = h.key;

            if (h.key.includes('date') || h.key === 'purchaseDate' || h.key === 'startDate' || h.key === 'endDate' || h.key === 'date') {
                input.type = 'date';
                if (data[h.key]) {
                    try {
                        const d = new Date(data[h.key]);
                        input.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    } catch (e) {}
                }
            } else if (h.key === 'email') {
                input.type = 'email';
                input.value = data[h.key] || '';
            } else if (h.key === 'price' || h.key === 'targetValue' || h.key === 'currentValue' || h.key === 'priceAtPurchase') {
                input.type = 'number';
                input.step = '0.01';
                input.value = data[h.key] !== undefined ? data[h.key] : '';
            } else if (h.key === 'duration' || h.key === 'age') {
                input.type = 'number';
                input.step = '1';
                input.min = '0';
                input.value = data[h.key] !== undefined ? data[h.key] : '';
            } else if (h.key === 'password') {
                input.type = 'password';
                input.value = '';
                input.placeholder = 'Оставьте пустым, если не хотите менять';
            } else {
                input.type = 'text';
                input.value = data[h.key] !== undefined ? data[h.key] : '';
            }

            div.appendChild(input);
        }

        col.appendChild(div);
        container.appendChild(col);
    });
}

// ======================= СОХРАНЕНИЕ ДАННЫХ =======================
async function saveData() {
    if (currentTable === 'posts_moderation') return;
    const form = document.getElementById('dataForm');
    const formData = new FormData(form);
    const payload = {};

    for (let [key, value] of formData.entries()) {
        if (key === 'id' && !value) continue;

        if (key === 'club' || key === 'user' || key === 'duration' || key === 'age' || key === 'abonementId' || key === 'abonement') {
            payload[key] = value ? parseInt(value, 10) : null;
        } else if (key === 'price' || key === 'targetValue' || key === 'currentValue' || key === 'priceAtPurchase') {
            payload[key] = value ? parseFloat(value) : null;
        } else if (key === 'isAdmin') {
            payload[key] = value === '1' || value === true;
        } else if (key.includes('date') && value) {
            payload[key] = value;
        } else if (key === 'password' && !value) {
            if (payload.id) continue;
        } else {
            payload[key] = value || null;
        }
    }

    if (formData.has('id') && formData.get('id')) payload.id = parseInt(formData.get('id'), 10);

    const saveBtn = document.querySelector('.modal-footer .btn-primary');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    saveBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/save/${currentTable}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await res.text();
        if (res.ok) {
            modal.hide();
            await selectTable(currentTable, document.getElementById('tableTitle').innerText);
            showNotification('success', 'Данные сохранены');
        } else {
            showNotification('error', 'Ошибка сохранения: ' + responseText);
        }
    } catch (e) {
        showNotification('error', 'Ошибка сети: ' + e.message);
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// ======================= УДАЛЕНИЕ ЗАПИСЕЙ =======================
async function deleteSelected() {
    if (currentTable === 'posts_moderation') return;

    const checkboxes = document.querySelectorAll('.row-check:checked');
    const ids = Array.from(checkboxes)
        .map(c => parseInt(c.value))
        .filter(id => !isNaN(id) && id > 0);

    if (ids.length === 0) {
        showNotification('warning', 'Выберите записи');
        return;
    }
    if (!confirm(`Удалить ${ids.length} записей?`)) return;

    const deleteBtn = document.querySelector('.btn-del');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Удаление...';
    deleteBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/delete/${currentTable}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ids)
        });

        const responseText = await res.text();
        if (res.ok) {
            await selectTable(currentTable, document.getElementById('tableTitle').innerText);
            showNotification('success', `Удалено ${ids.length} записей`);
        } else {
            showNotification('error', 'Ошибка удаления: ' + responseText);
        }
    } catch (e) {
        showNotification('error', 'Ошибка сети: ' + e.message);
    } finally {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    }
}

// ======================= СОРТИРОВКА =======================
function sortData(key) {
    if (currentTable === 'posts_moderation') return;
    sortOrder *= -1;
    tableData.sort((a, b) => {
        const valA = a[key] || '';
        const valB = b[key] || '';
        if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * sortOrder;
        return String(valA).localeCompare(String(valB)) * sortOrder;
    });
    renderTable(tableData);
}

// ======================= ВЫБОР ВСЕХ =======================
function toggleAll(source) {
    if (currentTable === 'posts_moderation') return;
    document.querySelectorAll('.row-check').forEach(c => c.checked = source.checked);
}

// ======================= ЭКСПОРТ В EXCEL =======================
function exportData() {
    if (currentTable === 'posts_moderation') {
        showNotification('warning', 'Экспорт постов не реализован');
        return;
    }
    window.open(`${API_URL}/export/${currentTable}`, '_blank');
}

// ======================= УВЕДОМЛЕНИЯ =======================
function showNotification(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.background = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ff9800';
    alertDiv.style.color = 'white';
    alertDiv.style.border = 'none';
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" style="filter: brightness(0) invert(1);"></button>`;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}
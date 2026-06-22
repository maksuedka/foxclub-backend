/**
 * Основной JavaScript файл для Fitness Club
 * Версия с select вместо datalist и улучшенной модалкой создания цели
 * Исправлена функция "Скорректировать" для всех типов целей
 * Исправлен поиск полей для корректировки (учитывает initialWeight/targetWeight)
 * Добавлена очистка description от JSON-мусора, fallback на тип цели
 * Добавлена отмена корректировки и логика сохранения без повторной валидации
 * Добавлено управление акциями (бесконечная карусель с управлением тачпадом)
 * Добавлен статус "Ожидает активации" для абонементов без startDate
 * Добавлена поддержка вкладки "РАЗОВЫЕ ЗАНЯТИЯ" из БД
 */

// ======================= ДИНАМИЧЕСКОЕ ОПРЕДЕЛЕНИЕ БАЗОВОГО URL =======================
function getBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    }
    return `${window.location.protocol}//${window.location.hostname}`;
}

const API_BASE_URL = getBaseUrl();
console.log('API base URL:', API_BASE_URL);

// ======================= КОНСТАНТЫ И КОНФИГУРАЦИЯ =======================
const CITY_MAPPING = {
    "minsk": "Минск",
    "mogilev": "Могилев",
    "grodno": "Гродно"
};

// Соответствие упражнений и единиц измерения
const EXERCISE_UNITS = {
    'Жим лежа': 'кг',
    'Жим гантелей лежа': 'кг',
    'Разводка гантелей': 'кг',
    'Кроссовер': 'кг',
    'Становая тяга': 'кг',
    'Тяга штанги в наклоне': 'кг',
    'Тяга верхнего блока': 'кг',
    'Тяга гантели к поясу': 'кг',
    'Приседания со штангой': 'кг',
    'Жим ногами': 'кг',
    'Разгибание ног': 'кг',
    'Сгибание ног': 'кг',
    'Жим штанги стоя': 'кг',
    'Жим гантелей сидя': 'кг',
    'Разведение гантелей в стороны': 'кг',
    'Подъем штанги на бицепс': 'кг',
    'Молотки': 'кг',
    'Французский жим': 'кг',
    'Отжимания на брусьях': 'кг',
    'Бег на дорожке': 'км',
    'Бег на улице': 'км',
    'Интервальный бег': 'км',
    'Велотренажер': 'км',
    'Сайкл': 'км',
    'Велосипед на улице': 'км',
    'Эллиптический тренажер': 'км',
    'Степпер': 'шагов',
    'Гребной тренажер': 'м',
    'Скакалка': 'прыжков',
    'Плавание': 'м',
    'Ходьба': 'км',
    'Скандинавская ходьба': 'км',
    'Танцы': 'мин',
    'Бокс/Груша': 'мин'
};

const EXERCISES = {
    'Грудные': ['Жим лежа', 'Жим гантелей лежа', 'Разводка гантелей', 'Кроссовер'],
    'Спина': ['Становая тяга', 'Тяга штанги в наклоне', 'Тяга верхнего блока', 'Тяга гантели к поясу'],
    'Ноги': ['Приседания со штангой', 'Жим ногами', 'Разгибание ног', 'Сгибание ног'],
    'Плечи': ['Жим штанги стоя', 'Жим гантелей сидя', 'Разведение гантелей в стороны'],
    'Руки': ['Подъем штанги на бицепс', 'Молотки', 'Французский жим', 'Отжимания на брусьях']
};

const CARDIO_ACTIVITIES = [
    'Бег на дорожке', 'Бег на улице', 'Интервальный бег',
    'Велотренажер', 'Сайкл', 'Велосипед на улице',
    'Эллиптический тренажер', 'Степпер', 'Гребной тренажер',
    'Скакалка', 'Плавание', 'Ходьба', 'Скандинавская ходьба',
    'Танцы', 'Бокс/Груша'
];

const FITNESS_LEVELS = [
    { value: 'beginner', label: 'Начинающий (0–3 месяца)' },
    { value: 'intermediate', label: 'Средний (3–12 месяцев)' },
    { value: 'advanced', label: 'Продвинутый (1–3 года)' },
    { value: 'professional', label: 'Профессиональный (3+ лет)' }
];

const GOAL_TYPE_CONFIG = {
    'weight-loss': { title: 'Похудение', iconClass: 'icon-bg-weight', unit: 'кг' },
    'mass-gain': { title: 'Набор массы', iconClass: 'icon-bg-mass', unit: 'кг' },
    'strength': { title: 'Силовые показатели', iconClass: 'icon-bg-power', unit: 'кг' },
    'cardio': { title: 'Кардионагрузка', iconClass: 'icon-bg-cardio', unit: 'шагов' }
};

const GOAL_FIELD_CONFIG = {
    'weight-loss': {
        title: 'Похудение',
        iconPath: 'assets/images/icons/weight_loss.png',
        fields: [
            { id: 'initialWeight', label: 'Начальный вес (кг)', type: 'number', placeholder: 'Например: 85', step: '0.1' },
            { id: 'targetWeight', label: 'Желаемый вес (кг)', type: 'number', placeholder: 'Например: 75', step: '0.1' }
        ]
    },
    'mass-gain': {
        title: 'Набор массы',
        iconPath: 'assets/images/icons/weight_gain.png',
        fields: [
            { id: 'initialWeight', label: 'Начальный вес (кг)', type: 'number', placeholder: 'Например: 70', step: '0.1' },
            { id: 'targetWeight', label: 'Желаемый вес (кг)', type: 'number', placeholder: 'Например: 80', step: '0.1' }
        ]
    },
    'strength': {
        title: 'Силовые показатели',
        iconPath: 'assets/images/icons/power.png',
        fields: [
            { id: 'exerciseSelect', label: 'Выберите упражнение', type: 'select', options: EXERCISES },
            { id: 'initialValue', label: 'Начальный результат', type: 'number', placeholder: 'Например: 60', step: '0.5' },
            { id: 'targetValue', label: 'Желаемый результат', type: 'number', placeholder: 'Например: 100', step: '0.5' }
        ]
    },
    'cardio': {
        title: 'Кардионагрузка',
        iconPath: 'assets/images/icons/cardio_load.png',
        fields: [
            { id: 'cardioSelect', label: 'Выберите вид активности', type: 'select', options: CARDIO_ACTIVITIES },
            { id: 'initialValue', label: 'Начальное значение', type: 'number', placeholder: 'Например: 5', step: '0.1' },
            { id: 'targetValue', label: 'Целевое значение', type: 'number', placeholder: 'Например: 10', step: '0.1' }
        ]
    }
};

let goalChart = null;
let goalValidationDone = false;
let goalValidationData = null;
let currentGoalType = 'weight-loss';

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОЧИСТКИ DESCRIPTION ОТ JSON =====
function isJsonDescription(desc) {
    if (!desc) return false;
    return desc.includes('{') && desc.includes('}') && (desc.includes('"initialValue"') || desc.includes('"history"'));
}

// ======================= ОСНОВНЫЕ ФУНКЦИИ =======================
function getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return null;
    }
    return user;
}

function updateUserUI() {
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('profile.html')) {
        return;
    }
    let profileContainer = document.querySelector('.profile-info');
    if (!profileContainer) {
        const header = document.querySelector('.main-header .container, header .container');
        if (header) {
            const profileDiv = document.createElement('div');
            profileDiv.className = 'profile-info';
            header.appendChild(profileDiv);
            profileContainer = profileDiv;
        } else {
            return;
        }
    }
    const originalLoginBtn = document.querySelector('.btn-login, .btn-login-header, .btn.btn-primary.btn-login');
    if (originalLoginBtn) {
        originalLoginBtn.style.display = 'none';
    }
    const user = getCurrentUser();
    profileContainer.innerHTML = '';
    profileContainer.style.display = 'flex';
    profileContainer.style.alignItems = 'center';
    profileContainer.style.marginLeft = 'auto';
    if (user) {
        const avatarLink = document.createElement('a');
        avatarLink.href = 'profile.html';
        avatarLink.style.display = 'flex';
        avatarLink.style.alignItems = 'center';
        avatarLink.style.textDecoration = 'none';
        const avatarImg = document.createElement('img');
        avatarImg.src = user.avatarUrl || 'assets/images/default-avatar.png';
        avatarImg.alt = 'Аватар';
        avatarImg.style.width = '40px';
        avatarImg.style.height = '40px';
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.objectFit = 'cover';
        avatarImg.style.border = '2px solid #ff8c00';
        avatarImg.style.cursor = 'pointer';
        avatarLink.appendChild(avatarImg);
        profileContainer.appendChild(avatarLink);
    } else {
        const loginBtn = document.createElement('a');
        loginBtn.href = 'login.html';
        loginBtn.className = 'btn-login-header';
        loginBtn.textContent = 'ВОЙТИ';
        loginBtn.style.background = '#ff8c00';
        loginBtn.style.padding = '8px 20px';
        loginBtn.style.borderRadius = '30px';
        loginBtn.style.color = 'white';
        loginBtn.style.textDecoration = 'none';
        loginBtn.style.fontWeight = 'bold';
        loginBtn.style.cursor = 'pointer';
        profileContainer.appendChild(loginBtn);
    }
}

// ======================= ФОРМАТИРОВАНИЕ ДАТ =======================
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function formatDisplayDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU');
}

function toJavaDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
}

// ======================= АБОНЕМЕНТЫ =======================
let allPurchasedAbonements = [];
let hideExpiredAbonements = false;

async function loadMyAbonements() {
    const grid = document.getElementById('myAbonementsGrid');
    if (!grid) return;
    const user = getCurrentUser();
    if (!user) {
        grid.innerHTML = '<p class="error-message">Необходимо авторизоваться</p>';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/purchased-abonements/user/${user.id}`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        allPurchasedAbonements = await response.json();
        filterAndDisplayAbonements();
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p class="error-message">Ошибка загрузки</p>';
    }
}

function filterAndDisplayAbonements() {
    const grid = document.getElementById('myAbonementsGrid');
    if (!grid) return;
    if (allPurchasedAbonements.length === 0) {
        grid.innerHTML = '<p class="empty-message">У вас пока нет абонементов</p>';
        return;
    }
    let filteredAbonements = allPurchasedAbonements;
    if (hideExpiredAbonements) {
        const now = new Date();
        filteredAbonements = allPurchasedAbonements.filter(item => {
            if (!item.startDate) return false; // без даты начала считаем неактивным
            const endDate = item.endDate ? new Date(item.endDate) : null;
            return endDate && endDate > now;
        });
    }
    grid.innerHTML = '';
    if (filteredAbonements.length === 0) {
        grid.innerHTML = hideExpiredAbonements ? '<p class="empty-message">Нет активных абонементов</p>' : '<p class="empty-message">У вас пока нет абонементов</p>';
        return;
    }
    filteredAbonements.forEach(item => {
        const card = createPurchasedAbonementCard(item);
        grid.appendChild(card);
    });
}

function toggleExpiredFilter() {
    hideExpiredAbonements = !hideExpiredAbonements;
    const filterBtn = document.getElementById('toggleExpiredFilterBtn');
    if (filterBtn) {
        if (hideExpiredAbonements) {
            filterBtn.classList.add('active');
            filterBtn.innerHTML = '🔍 Показать все абонементы';
        } else {
            filterBtn.classList.remove('active');
            filterBtn.innerHTML = '🔍 Скрыть истекшие';
        }
    }
    filterAndDisplayAbonements();
}

function addExpiredFilterButton() {
    const section = document.querySelector('.my-abonements-section .container');
    if (!section) return;
    if (document.getElementById('toggleExpiredFilterBtn')) return;
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.marginBottom = '20px';
    const title = section.querySelector('h2');
    if (title) {
        title.parentNode.removeChild(title);
        headerContainer.appendChild(title);
    }
    const filterBtn = document.createElement('button');
    filterBtn.id = 'toggleExpiredFilterBtn';
    filterBtn.className = 'expired-filter-btn';
    filterBtn.innerHTML = '🔍 Скрыть истекшие';
    filterBtn.addEventListener('click', toggleExpiredFilter);
    headerContainer.appendChild(filterBtn);
    section.prepend(headerContainer);
}

// ===== ОСНОВНОЕ ИЗМЕНЕНИЕ: статус "Ожидает активации" =====
function createPurchasedAbonementCard(purchased) {
    const card = document.createElement('div');
    card.className = 'price-card purchased-abonement-card';
    card.dataset.id = purchased.id;
    const purchaseDate = purchased.purchaseDate ? new Date(purchased.purchaseDate) : new Date();

    let statusText = '';
    let statusClass = '';

    if (!purchased.startDate) {
        statusText = 'Ожидает активации';
        statusClass = 'status-pending';
    } else {
        const endDate = purchased.endDate ? new Date(purchased.endDate) : new Date();
        const now = new Date();
        if (endDate > now) {
            statusText = 'Активен';
            statusClass = 'status-active';
        } else {
            statusText = 'Истек';
            statusClass = 'status-expired';
        }
    }

    const displayEndDate = purchased.endDate ? formatDisplayDate(new Date(purchased.endDate)) : '—';

    card.innerHTML = `
        <div class="price-card-logo-bg"></div>
        <h3 class="price-card-title">${purchased.abonementName || 'Абонемент'}</h3>
        <p class="price-card-price">${purchased.priceAtPurchase || 0} р.</p>
        <div class="price-card-details">
            <p>Куплен: ${formatDisplayDate(purchaseDate)}</p>
            <p>Действует до: ${displayEndDate}</p>
            <p class="abonement-status ${statusClass}">${statusText}</p>
        </div>
        <button class="btn-show-qr" data-id="${purchased.id}">ПОКАЗАТЬ QR-КОД</button>
    `;
    const qrBtn = card.querySelector('.btn-show-qr');
    qrBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showQrCode(purchased);
    });
    return card;
}

function showQrCode(purchased) {
    const modal = document.getElementById('qrModal');
    if (!modal) return;
    const title = document.getElementById('qrModalTitle');
    const purchaseDateSpan = document.getElementById('qrPurchaseDate');
    const expiryDateSpan = document.getElementById('qrExpiryDate');
    if (title) title.textContent = purchased.abonementName || 'Абонемент';
    if (purchaseDateSpan) purchaseDateSpan.textContent = formatDisplayDate(new Date(purchased.purchaseDate));
    if (expiryDateSpan) expiryDateSpan.textContent = purchased.endDate ? formatDisplayDate(new Date(purchased.endDate)) : '—';
    const qrData = `FC-${purchased.id}-${purchased.userId}`;
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = '';
    const qrDiv = document.createElement('div');
    qrDiv.id = 'qrCode';
    qrDiv.style.margin = '0 auto';
    qrDiv.style.display = 'flex';
    qrDiv.style.justifyContent = 'center';
    qrDiv.style.padding = '10px';
    qrDiv.style.background = 'white';
    qrDiv.style.borderRadius = '12px';
    qrContainer.appendChild(qrDiv);
    new QRCode(qrDiv, {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    modal.style.display = 'flex';
}

function showUserQrCode() {
    const user = getCurrentUser();
    if (!user) return;
    const modal = document.getElementById('userQrModal');
    if (!modal) return;
    const userNameSpan = document.getElementById('userQrName');
    const userEmailSpan = document.getElementById('userQrEmail');
    if (userNameSpan) userNameSpan.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь';
    if (userEmailSpan) userEmailSpan.textContent = user.email || '—';
    const qrData = `USER-${user.id}`;
    const qrContainer = document.getElementById('userQrCodeContainer');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    const qrDiv = document.createElement('div');
    qrDiv.id = 'userQrCode';
    qrDiv.style.margin = '0 auto';
    qrDiv.style.display = 'flex';
    qrDiv.style.justifyContent = 'center';
    qrDiv.style.padding = '10px';
    qrDiv.style.background = 'white';
    qrDiv.style.borderRadius = '12px';
    qrContainer.appendChild(qrDiv);
    new QRCode(qrDiv, {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    modal.style.display = 'flex';
}

// ======================= ЦЕЛИ =======================

function renderGoalHistoryChart(history, unit) {
    const canvas = document.getElementById('goalHistoryChart');
    if (!canvas) return;
    if (!window.Chart) return;
    const ctx = canvas.getContext('2d');
    if (goalChart) goalChart.destroy();
    if (!history || history.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    const sorted = [...history].sort((a,b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(h => {
        const d = new Date(h.date);
        return `${d.getDate()}.${d.getMonth()+1}`;
    });
    const values = sorted.map(h => parseFloat(h.value));
    goalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Прогресс (${unit})`,
                data: values,
                borderColor: '#ff8c00',
                backgroundColor: 'rgba(255, 140, 0, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#ff8c00',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#fff' } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} ${unit}` } }
            },
            scales: {
                y: { grid: { color: '#333' }, ticks: { color: '#fff' } },
                x: { grid: { color: '#333' }, ticks: { color: '#ccc' } }
            }
        }
    });
}

async function loadGoals() {
    const goalsCarousel = document.getElementById('goalsCardsCarousel');
    if (!goalsCarousel) return;
    const user = getCurrentUser();
    if (!user) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        const allGoals = await response.json();
        const myGoals = allGoals.filter(g => g.userId === user.id);
        if (myGoals.length === 0) {
            goalsCarousel.innerHTML = '<p class="empty-message">У вас пока нет целей. Нажмите "+" чтобы создать цель!</p>';
            return;
        }
        goalsCarousel.innerHTML = '';
        myGoals.forEach(goal => renderGoalCard(goal));
    } catch (error) {
        console.error(error);
        goalsCarousel.innerHTML = '<p class="error-message">Ошибка загрузки целей</p>';
    }
}

function renderGoalCard(goal) {
    const goalsCarousel = document.getElementById('goalsCardsCarousel');
    if (!goalsCarousel) return;
    const config = GOAL_TYPE_CONFIG[goal.type] || GOAL_TYPE_CONFIG['weight-loss'];
    let displayTitle;
    if (goal.description && !isJsonDescription(goal.description)) {
        displayTitle = goal.description;
    } else {
        displayTitle = config.title;
    }
    const unit = goal.unit || config.unit;
    const { percentComplete, progressText } = calculateGoalProgress(goal, unit);
    const startDate = goal.startDate ? formatDisplayDate(goal.startDate) : '—';
    const endDate = goal.endDate ? formatDisplayDate(goal.endDate) : '—';
    let progressColor = '#ff8c00';
    if (percentComplete >= 100) progressColor = '#4CAF50';
    else if (percentComplete < 30) progressColor = '#ff4444';
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.dataset.goalId = goal.id;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openGoalDetailModal(goal.id));
    card.innerHTML = `
        <div class="goal-card-icon-bg ${config.iconClass}"></div>
        <h3 class="goal-card-title">${escapeHtml(displayTitle)}</h3>
        <div class="goal-card-values">
            <p>Текущее: <strong>${goal.currentValue || 0} ${unit}</strong></p>
            <p>Цель: <strong>${goal.targetValue || 0} ${unit}</strong></p>
        </div>
        <div class="goal-card-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentComplete}%; background-color: ${progressColor};"></div>
            </div>
            <span class="progress-percent">${percentComplete}%</span>
            ${progressText ? `<p class="progress-text">${progressText}</p>` : ''}
        </div>
        <div class="goal-card-dates">
            <p>${startDate} - ${endDate}</p>
        </div>
    `;
    goalsCarousel.appendChild(card);
}

function calculateGoalProgress(goal, unit) {
    let percentComplete = 0;
    let progressText = '';
    if (!goal.targetValue || goal.targetValue <= 0) {
        return { percentComplete: 0, progressText: 'Цель не задана' };
    }
    const target = parseFloat(goal.targetValue);
    const current = parseFloat(goal.currentValue) || 0;
    const initial = goal.initialValue ? parseFloat(goal.initialValue) : current;
    if (goal.type === 'weight-loss') {
        const start = goal.initialValue ? parseFloat(goal.initialValue) : current * 1.1;
        if (current <= target) {
            percentComplete = 100;
            progressText = 'Цель достигнута! 🎉';
        } else {
            const totalToLose = start - target;
            const lost = start - current;
            percentComplete = Math.min(99, Math.round((lost / totalToLose) * 100));
            const remaining = current - target;
            progressText = `Осталось сбросить ${remaining.toFixed(1)} ${unit}`;
        }
    } else {
        if (current >= target) {
            percentComplete = 100;
            progressText = 'Цель достигнута! 🎉';
        } else {
            const totalToGain = target - initial;
            const gained = current - initial;
            percentComplete = Math.min(99, Math.round((gained / totalToGain) * 100));
            const remaining = target - current;
            progressText = `Осталось ${remaining.toFixed(1)} ${unit}`;
        }
    }
    return { percentComplete, progressText };
}

// ===== ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ ПОЛЕЙ =====
function renderGoalFields(goalType) {
    currentGoalType = goalType;
    const formContainer = document.getElementById('goalDetailsForm');
    if (!formContainer) return;
    const config = GOAL_FIELD_CONFIG[goalType] || GOAL_FIELD_CONFIG['weight-loss'];
    let html = '';
    config.fields.forEach(field => {
        if (field.type === 'select') {
            html += `<div class="modal-input-group">
                <label for="${field.id}">${field.label}</label>
                <select id="${field.id}" class="form-control" onchange="updateUnitForExercise('${field.id}')">
                    ${generateOptionsHtml(field.options)}
                </select>
            </div>`;
        } else {
            html += `
                <div class="modal-input-group">
                    <label for="${field.id}">${field.label}</label>
                    <input type="${field.type}" id="${field.id}" placeholder="${field.placeholder}" ${field.step ? `step="${field.step}"` : ''}>
                    <span id="unitLabel_${field.id}" style="color:#999; font-size:0.85rem; margin-top:2px;"></span>
                </div>
            `;
        }
    });
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const todayStr = formatDate(today);
    const nextMonthStr = formatDate(nextMonth);
    html += `
        <div class="modal-input-group">
            <label for="startDate">Дата начала</label>
            <input type="text" id="startDate" placeholder="ДД.ММ.ГГГГ" value="${todayStr}">
        </div>
        <div class="modal-input-group">
            <label for="endDate">Дата окончания</label>
            <input type="text" id="endDate" placeholder="ДД.ММ.ГГГГ" value="${nextMonthStr}">
        </div>
    `;
    formContainer.innerHTML = html;
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#startDate", { locale: "ru", dateFormat: "d.m.Y", defaultDate: today });
        flatpickr("#endDate", { locale: "ru", dateFormat: "d.m.Y", defaultDate: nextMonth });
    }
    if (goalType === 'strength' || goalType === 'cardio') {
        const selectId = goalType === 'strength' ? 'exerciseSelect' : 'cardioSelect';
        setTimeout(() => updateUnitForExercise(selectId), 100);
    }
}

function generateOptionsHtml(options) {
    if (Array.isArray(options)) {
        return options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    } else if (typeof options === 'object' && !Array.isArray(options)) {
        let html = '';
        for (const [category, items] of Object.entries(options)) {
            html += `<optgroup label="${category}">`;
            items.forEach(item => {
                html += `<option value="${item}">${item}</option>`;
            });
            html += '</optgroup>';
        }
        return html;
    }
    return '';
}

function updateUnitForExercise(selectId) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;
    const exercise = selectEl.value;
    const unit = EXERCISE_UNITS[exercise] || '';
    const initialField = document.getElementById('initialValue');
    const targetField = document.getElementById('targetValue');
    const initialUnitLabel = document.getElementById('unitLabel_initialValue');
    const targetUnitLabel = document.getElementById('unitLabel_targetValue');
    if (initialUnitLabel) initialUnitLabel.textContent = unit ? `Единица: ${unit}` : '';
    if (targetUnitLabel) targetUnitLabel.textContent = unit ? `Единица: ${unit}` : '';
    if (initialField) initialField.placeholder = unit ? `Например: 5 ${unit}` : 'Например: 5';
    if (targetField) targetField.placeholder = unit ? `Например: 10 ${unit}` : 'Например: 10';
    if (initialField) initialField.dataset.unit = unit;
    if (targetField) targetField.dataset.unit = unit;
}

function clearGoalForm() {
    const formContainer = document.getElementById('goalDetailsForm');
    if (formContainer) formContainer.innerHTML = '';
    const tabs = document.querySelectorAll("#modalGoalTabs .modal-tab");
    if (tabs.length > 0) {
        tabs.forEach(t => t.classList.remove('active'));
        tabs[0].classList.add('active');
        renderGoalFields(tabs[0].dataset.goalType);
    }
    document.getElementById('aiRecommendationBlock').style.display = 'none';
    goalValidationDone = false;
    goalValidationData = null;
    const addBtn = document.getElementById('addGoalBtn');
    if (addBtn) {
        addBtn.textContent = 'ДОБАВИТЬ ЦЕЛЬ';
        addBtn.style.background = '';
    }
    // Скрыть кнопку отмены
    const cancelBtn = document.getElementById('cancelAdjustmentBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    // Показать кнопку "Скорректировать" (если была скрыта)
    const adjustBtn = document.getElementById('adjustGoalBtn');
    if (adjustBtn) adjustBtn.style.display = 'none';
}

// ===== ВАЛИДАЦИЯ ЧЕРЕЗ ИИ =====
async function validateGoal(goalData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goalData)
        });
        if (response.ok) {
            const result = await response.json();
            showRecommendations(result);
            return result;
        } else {
            console.error('Ошибка валидации:', response.status);
            document.getElementById('aiRecommendationBlock').style.display = 'none';
            showTemporaryMessage('Не удалось проверить цель через ИИ', 'error');
            return null;
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        document.getElementById('aiRecommendationBlock').style.display = 'none';
        showTemporaryMessage('Ошибка сети при проверке цели', 'error');
        return null;
    }
}

function showRecommendations(result) {
    const block = document.getElementById('aiRecommendationBlock');
    const status = document.getElementById('aiRecommendationStatus');
    const icon = document.getElementById('aiRecommendationIcon');
    const reason = document.getElementById('aiRecommendationReason');
    const advice = document.getElementById('aiRecommendationAdvice');
    const warning = document.getElementById('aiRecommendationWarning');
    const safeChange = document.getElementById('aiRecommendationSafeChange');
    const adjustBtn = document.getElementById('adjustGoalBtn');
    const cancelBtn = document.getElementById('cancelAdjustmentBtn');

    block.style.display = 'block';
    icon.textContent = result.realistic ? '✅' : '⚠️';
    status.textContent = result.realistic ? 'Цель реалистична!' : 'Цель требует корректировки';
    status.style.color = result.realistic ? '#4CAF50' : '#ff6b6b';
    reason.textContent = result.reason || '';
    advice.textContent = result.recommendation || '';
    warning.textContent = result.warning ? `⚠️ ${result.warning}` : '';
    warning.style.display = result.warning ? 'block' : 'none';
    safeChange.textContent = result.safeWeeklyChange ? `Безопасный темп: ${result.safeWeeklyChange} в неделю` : '';
    safeChange.style.display = result.safeWeeklyChange ? 'block' : 'none';

    if (adjustBtn) {
        if (!result.realistic) {
            adjustBtn.style.display = 'inline-block';
            adjustBtn.onclick = () => applyAdjustment(result);
        } else {
            adjustBtn.style.display = 'none';
        }
    }
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

// ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ "СКОРРЕКТИРОВАТЬ" =====
function applyAdjustment(validationResult) {
    const activeTab = document.querySelector("#modalGoalTabs .modal-tab.active");
    const goalType = activeTab ? activeTab.dataset.goalType : 'strength';
    
    let targetFieldId = 'targetValue';
    let currentFieldId = 'initialValue';
    if (goalType === 'weight-loss' || goalType === 'mass-gain') {
        targetFieldId = 'targetWeight';
        currentFieldId = 'initialWeight';
    }
    
    const endDateInput = document.getElementById('endDate');
    const targetInput = document.getElementById(targetFieldId);
    const currentInput = document.getElementById(currentFieldId);
    
    if (!endDateInput || !targetInput || !currentInput) {
        showTemporaryMessage('Не удалось найти поля для корректировки', 'error');
        console.warn('Поля не найдены:', { endDateInput, targetInput, currentInput });
        return;
    }
    
    let currentValue = parseFloat(currentInput.value);
    if (isNaN(currentValue) || currentValue <= 0) {
        showTemporaryMessage('Не удалось определить текущее значение', 'error');
        return;
    }
    
    const originalTarget = targetInput.value;
    
    let safeChange = 0.5;
    if (validationResult.safeWeeklyChange) {
        const match = validationResult.safeWeeklyChange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
        if (match) {
            safeChange = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
        } else {
            const num = parseFloat(validationResult.safeWeeklyChange);
            if (!isNaN(num)) safeChange = num;
        }
    }
    
    let weeks = 4;
    const endDateStr = endDateInput.value;
    if (endDateStr) {
        const parts = endDateStr.split('.');
        if (parts.length === 3) {
            const endDate = new Date(parts[2], parts[1]-1, parts[0]);
            const today = new Date();
            const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                weeks = diffDays / 7;
            }
        }
    }
    
    let newTarget = currentValue;
    
    switch (goalType) {
        case 'weight-loss':
            const loss = safeChange * weeks;
            newTarget = Math.max(30, currentValue - loss);
            if (newTarget >= currentValue) {
                newTarget = currentValue - 0.5;
            }
            break;
            
        case 'mass-gain':
            const gain = safeChange * weeks;
            newTarget = currentValue + gain;
            if (newTarget > currentValue * 2) {
                newTarget = currentValue * 1.5;
            }
            break;
            
        case 'strength':
            let percentPerWeek = 2;
            if (validationResult.safeWeeklyChange && validationResult.safeWeeklyChange.includes('%')) {
                const match = validationResult.safeWeeklyChange.match(/([\d.]+)\s*%/);
                if (match) percentPerWeek = parseFloat(match[1]);
            }
            const totalPercent = percentPerWeek * weeks;
            newTarget = currentValue * (1 + totalPercent / 100);
            if (newTarget > currentValue * 3) {
                newTarget = currentValue * 2;
            }
            break;
            
        case 'cardio':
            const cardioPercent = 5;
            const totalCardioPercent = cardioPercent * weeks;
            newTarget = currentValue * (1 + totalCardioPercent / 100);
            if (newTarget > currentValue * 5) {
                newTarget = currentValue * 3;
            }
            break;
            
        default:
            showTemporaryMessage('Неизвестный тип цели', 'error');
            return;
    }
    
    newTarget = Math.round(newTarget * 10) / 10;
    if (newTarget < 1) newTarget = 1;
    
    if (goalType === 'weight-loss' && newTarget >= currentValue) {
        newTarget = currentValue - 1;
        if (newTarget < 30) newTarget = 30;
    }
    if ((goalType === 'mass-gain' || goalType === 'strength' || goalType === 'cardio') && newTarget <= currentValue) {
        newTarget = currentValue + 1;
    }
    
    targetInput.value = newTarget;
    
    if (goalValidationData) {
        goalValidationData.realistic = true;
        goalValidationData.reason = 'Цель скорректирована до безопасного значения.';
        goalValidationData.recommendation = 'Вы можете изменить значения вручную, если нужно.';
        goalValidationData.warning = '';
        goalValidationData.safeWeeklyChange = validationResult.safeWeeklyChange || '';
    } else {
        goalValidationData = {
            realistic: true,
            reason: 'Цель скорректирована до безопасного значения.',
            recommendation: 'Вы можете изменить значения вручную, если нужно.',
            warning: '',
            safeWeeklyChange: validationResult.safeWeeklyChange || ''
        };
    }
    goalValidationDone = true;
    
    goalValidationData._originalTarget = originalTarget;
    
    const addBtn = document.getElementById('addGoalBtn');
    if (addBtn) {
        addBtn.textContent = 'СОХРАНИТЬ ЦЕЛЬ';
        addBtn.style.background = '#4CAF50';
    }
    
    const cancelBtn = document.getElementById('cancelAdjustmentBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }
    
    const adjustBtn = document.getElementById('adjustGoalBtn');
    if (adjustBtn) {
        adjustBtn.style.display = 'none';
    }
    
    const statusEl = document.getElementById('aiRecommendationStatus');
    if (statusEl) {
        statusEl.textContent = '✅ Цель скорректирована!';
        statusEl.style.color = '#4CAF50';
    }
    const reasonEl = document.getElementById('aiRecommendationReason');
    if (reasonEl) {
        reasonEl.textContent = 'Целевое значение установлено на ' + newTarget + '. Сохраните цель или отмените корректировку.';
    }
    const adviceEl = document.getElementById('aiRecommendationAdvice');
    if (adviceEl) {
        adviceEl.textContent = 'Вы можете изменить значения вручную перед сохранением.';
    }
    
    showTemporaryMessage('Целевое значение скорректировано до ' + newTarget + '. Нажмите "СОХРАНИТЬ ЦЕЛЬ" для создания.', 'success');
}

// ===== ОТМЕНА КОРРЕКТИРОВКИ =====
function cancelAdjustment() {
    const activeTab = document.querySelector("#modalGoalTabs .modal-tab.active");
    const goalType = activeTab ? activeTab.dataset.goalType : 'strength';
    let targetFieldId = 'targetValue';
    if (goalType === 'weight-loss' || goalType === 'mass-gain') {
        targetFieldId = 'targetWeight';
    }
    const targetInput = document.getElementById(targetFieldId);
    if (targetInput && goalValidationData && goalValidationData._originalTarget !== undefined) {
        targetInput.value = goalValidationData._originalTarget;
    }
    
    goalValidationDone = false;
    goalValidationData = null;
    
    const addBtn = document.getElementById('addGoalBtn');
    if (addBtn) {
        addBtn.textContent = 'ДОБАВИТЬ ЦЕЛЬ';
        addBtn.style.background = '';
    }
    const adjustBtn = document.getElementById('adjustGoalBtn');
    if (adjustBtn) {
        adjustBtn.style.display = 'inline-block';
    }
    const cancelBtn = document.getElementById('cancelAdjustmentBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    document.getElementById('aiRecommendationBlock').style.display = 'none';
    
    showTemporaryMessage('Корректировка отменена', 'info');
}

// ===== СОЗДАНИЕ ЦЕЛИ (С ВАЛИДАЦИЕЙ) =====
async function addNewGoal() {
    const user = getCurrentUser();
    if (!user) {
        showTemporaryMessage('Необходимо авторизоваться', 'error');
        window.location.href = 'login.html';
        return;
    }

    if (goalValidationDone && goalValidationData && goalValidationData.realistic) {
        await saveGoalDirectly();
        return;
    }

    if (goalValidationDone && goalValidationData && !goalValidationData.realistic) {
        await saveGoalDirectly();
        return;
    }

    const activeTab = document.querySelector("#modalGoalTabs .modal-tab.active");
    if (!activeTab) {
        showTemporaryMessage('Выберите тип цели', 'error');
        return;
    }
    const goalType = activeTab.dataset.goalType;
    const config = GOAL_FIELD_CONFIG[goalType];
    let targetValue = 0, currentValue = 0, initialValue = 0, description = '';
    let unit = 'кг';
    let exercise = '';

    if (goalType === 'weight-loss') {
        unit = 'кг';
        const initialWeight = document.getElementById('initialWeight');
        const targetWeight = document.getElementById('targetWeight');
        initialValue = initialWeight ? parseFloat(initialWeight.value) || 0 : 0;
        targetValue = targetWeight ? parseFloat(targetWeight.value) || 0 : 0;
        currentValue = initialValue;
        description = `Похудение с ${initialValue}кг до ${targetValue}кг`;
    } else if (goalType === 'mass-gain') {
        unit = 'кг';
        const initialWeight = document.getElementById('initialWeight');
        const targetWeight = document.getElementById('targetWeight');
        initialValue = initialWeight ? parseFloat(initialWeight.value) || 0 : 0;
        targetValue = targetWeight ? parseFloat(targetWeight.value) || 0 : 0;
        currentValue = initialValue;
        description = `Набор массы с ${initialValue}кг до ${targetValue}кг`;
    } else if (goalType === 'strength') {
        const exerciseSelect = document.getElementById('exerciseSelect');
        const initialVal = document.getElementById('initialValue');
        const targetVal = document.getElementById('targetValue');
        exercise = exerciseSelect ? exerciseSelect.value : '';
        unit = EXERCISE_UNITS[exercise] || 'кг';
        initialValue = initialVal ? parseFloat(initialVal.value) || 0 : 0;
        targetValue = targetVal ? parseFloat(targetVal.value) || 0 : 0;
        currentValue = initialValue;
        description = `${exercise}: с ${initialValue} до ${targetValue} ${unit}`;
    } else if (goalType === 'cardio') {
        const cardioSelect = document.getElementById('cardioSelect');
        const initialVal = document.getElementById('initialValue');
        const targetVal = document.getElementById('targetValue');
        exercise = cardioSelect ? cardioSelect.value : '';
        unit = EXERCISE_UNITS[exercise] || 'шагов';
        initialValue = initialVal ? parseFloat(initialVal.value) || 0 : 0;
        targetValue = targetVal ? parseFloat(targetVal.value) || 0 : 0;
        currentValue = initialValue;
        description = `${exercise}: с ${initialValue} до ${targetValue} ${unit}`;
    }

    const userComment = document.getElementById('goalComment')?.value || '';
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const fitnessLevel = document.getElementById('fitnessLevel')?.value || 'intermediate';

    const goalData = {
        type: goalType,
        targetValue: targetValue,
        currentValue: currentValue,
        startDate: toJavaDate(startDateInput ? startDateInput.value : null),
        endDate: toJavaDate(endDateInput ? endDateInput.value : null),
        description: userComment || description || config.title,
        userId: user.id,
        initialValue: initialValue,
        unit: unit,
        history: [{ value: currentValue, date: toJavaDate(startDateInput.value) || new Date().toISOString().split('T')[0] }],
        exercise: exercise,
        fitnessLevel: fitnessLevel,
        userComment: userComment
    };

    const validation = await validateGoal(goalData);
    if (!validation) {
        showTemporaryMessage('Не удалось проверить цель, попробуйте позже', 'error');
        return;
    }

    goalValidationData = validation;

    if (validation.realistic) {
        await saveGoalDirectly(goalData);
        return;
    }

    goalValidationDone = true;
    const addBtn = document.getElementById('addGoalBtn');
    if (addBtn) {
        addBtn.textContent = 'СОХРАНИТЬ ВСЁ РАВНО';
        addBtn.style.background = '#ff6b6b';
    }
    showTemporaryMessage('Цель требует корректировки, но вы можете сохранить её повторным нажатием', 'warning');
}

// ===== СОХРАНЕНИЕ ЦЕЛИ =====
async function saveGoalDirectly(goalData) {
    if (!goalData) {
        const activeTab = document.querySelector("#modalGoalTabs .modal-tab.active");
        if (!activeTab) {
            showTemporaryMessage('Ошибка: не выбран тип цели', 'error');
            return;
        }
        const goalType = activeTab.dataset.goalType;
        const config = GOAL_FIELD_CONFIG[goalType];
        let targetValue = 0, currentValue = 0, initialValue = 0, description = '';
        let unit = 'кг';
        let exercise = '';
        if (goalType === 'weight-loss') {
            unit = 'кг';
            const initialWeight = document.getElementById('initialWeight');
            const targetWeight = document.getElementById('targetWeight');
            initialValue = initialWeight ? parseFloat(initialWeight.value) || 0 : 0;
            targetValue = targetWeight ? parseFloat(targetWeight.value) || 0 : 0;
            currentValue = initialValue;
            description = `Похудение с ${initialValue}кг до ${targetValue}кг`;
        } else if (goalType === 'mass-gain') {
            unit = 'кг';
            const initialWeight = document.getElementById('initialWeight');
            const targetWeight = document.getElementById('targetWeight');
            initialValue = initialWeight ? parseFloat(initialWeight.value) || 0 : 0;
            targetValue = targetWeight ? parseFloat(targetWeight.value) || 0 : 0;
            currentValue = initialValue;
            description = `Набор массы с ${initialValue}кг до ${targetValue}кг`;
        } else if (goalType === 'strength') {
            const exerciseSelect = document.getElementById('exerciseSelect');
            const initialVal = document.getElementById('initialValue');
            const targetVal = document.getElementById('targetValue');
            exercise = exerciseSelect ? exerciseSelect.value : '';
            unit = EXERCISE_UNITS[exercise] || 'кг';
            initialValue = initialVal ? parseFloat(initialVal.value) || 0 : 0;
            targetValue = targetVal ? parseFloat(targetVal.value) || 0 : 0;
            currentValue = initialValue;
            description = `${exercise}: с ${initialValue} до ${targetValue} ${unit}`;
        } else if (goalType === 'cardio') {
            const cardioSelect = document.getElementById('cardioSelect');
            const initialVal = document.getElementById('initialValue');
            const targetVal = document.getElementById('targetValue');
            exercise = cardioSelect ? cardioSelect.value : '';
            unit = EXERCISE_UNITS[exercise] || 'шагов';
            initialValue = initialVal ? parseFloat(initialVal.value) || 0 : 0;
            targetValue = targetVal ? parseFloat(targetVal.value) || 0 : 0;
            currentValue = initialValue;
            description = `${exercise}: с ${initialValue} до ${targetValue} ${unit}`;
        }
        const userComment = document.getElementById('goalComment')?.value || '';
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const fitnessLevel = document.getElementById('fitnessLevel')?.value || 'intermediate';
        goalData = {
            type: goalType,
            targetValue: targetValue,
            currentValue: currentValue,
            startDate: toJavaDate(startDateInput ? startDateInput.value : null),
            endDate: toJavaDate(endDateInput ? endDateInput.value : null),
            description: userComment || description || config.title,
            userId: getCurrentUser().id,
            initialValue: initialValue,
            unit: unit,
            history: [{ value: currentValue, date: toJavaDate(startDateInput.value) || new Date().toISOString().split('T')[0] }],
            exercise: exercise,
            fitnessLevel: fitnessLevel,
            userComment: userComment
        };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goalData)
        });
        if (response.ok) {
            const goalModal = document.getElementById('goalModal');
            if (goalModal) goalModal.style.display = 'none';
            clearGoalForm();
            await loadGoals();
            showTemporaryMessage('Цель успешно создана! 🎉', 'success');
            goalValidationDone = false;
            goalValidationData = null;
            const addBtn = document.getElementById('addGoalBtn');
            if (addBtn) {
                addBtn.textContent = 'ДОБАВИТЬ ЦЕЛЬ';
                addBtn.style.background = '';
            }
        } else {
            const errorText = await response.text();
            showTemporaryMessage('Ошибка при создании цели: ' + (errorText || 'Неизвестная ошибка'), 'error');
        }
    } catch (error) {
        showTemporaryMessage('Ошибка сети: ' + error.message, 'error');
    }
}

// ===== ДЕТАЛИ ЦЕЛИ =====
async function openGoalDetailModal(goalId) {
    const user = getCurrentUser();
    if (!user) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`);
        if (!response.ok) throw new Error('Ошибка загрузки цели');
        const goal = await response.json();
        fillGoalDetailModal(goal);
        const modal = document.getElementById('goalDetailModal');
        if (modal) modal.style.display = 'flex';
    } catch (error) {
        showTemporaryMessage('Ошибка загрузки данных цели', 'error');
    }
}

function fillGoalDetailModal(goal) {
    const titleEl = document.getElementById('goalDetailTitle');
    if (titleEl) {
        const config = GOAL_TYPE_CONFIG[goal.type];
        titleEl.textContent = config ? config.title : goal.type;
    }
    const descEl = document.getElementById('goalDetailDescription');
    if (descEl) {
        let displayDesc;
        if (goal.description && !isJsonDescription(goal.description)) {
            displayDesc = goal.description;
        } else {
            const config = GOAL_TYPE_CONFIG[goal.type];
            displayDesc = config ? config.title : 'Цель';
        }
        descEl.textContent = displayDesc;
    }
    const modal = document.getElementById('goalDetailModal');
    if (modal) modal.dataset.goalId = goal.id;
    updateGoalProgressDisplay(goal);
    const history = goal.history || [];
    const unit = goal.unit || GOAL_TYPE_CONFIG[goal.type]?.unit || '';
    renderGoalHistoryChart(history, unit);

    const motivationMsg = document.getElementById('goalMotivationMessage');
    if (motivationMsg) {
        if (history.length >= 2) {
            const last = parseFloat(history[history.length-1].value);
            const prev = parseFloat(history[history.length-2].value);
            const diff = last - prev;
            const unitLocal = unit;
            let msg = '';
            if (goal.type === 'weight-loss') {
                if (diff < 0) msg = `🎉 Отлично! Вы сбросили ${Math.abs(diff).toFixed(1)} ${unitLocal} с прошлого замера!`;
                else if (diff > 0) msg = `⚠️ Вес увеличился на ${diff.toFixed(1)} ${unitLocal}. Возможно, стоит скорректировать питание.`;
                else msg = `👍 Прогресс стабильный. Продолжайте в том же духе!`;
            } else if (goal.type === 'mass-gain' || goal.type === 'strength') {
                if (diff > 0) msg = `💪 Отличный рост! +${diff.toFixed(1)} ${unitLocal} с прошлого раза!`;
                else if (diff < 0) msg = `📉 Прогресс замедлился. Возможно, нужна смена программы.`;
                else msg = `👍 Стабильно, продолжайте!`;
            } else if (goal.type === 'cardio') {
                if (diff > 0) msg = `🏃‍♂️ Супер! Вы прошли на ${diff.toFixed(0)} ${unitLocal} больше!`;
                else if (diff < 0) msg = `😴 Немного меньше, чем в прошлый раз. Держите темп!`;
                else msg = `✅ Стабильно, так держать!`;
            }
            motivationMsg.innerHTML = msg;
            motivationMsg.style.display = 'block';
        } else {
            motivationMsg.innerHTML = '';
            motivationMsg.style.display = 'none';
        }
    }

    const tipsContent = document.getElementById('goalTipsContent');
    if (tipsContent) {
        let tipsText = '';
        const target = parseFloat(goal.targetValue);
        const current = parseFloat(goal.currentValue) || 0;
        const initial = goal.initialValue !== undefined ? parseFloat(goal.initialValue) : current;
        const weeksLeft = goal.endDate ? Math.max(0, Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))) : null;

        switch (goal.type) {
            case 'weight-loss':
                tipsText = '📉 Для похудения рекомендуется обновлять вес 2–3 раза в неделю (утром натощак).\n' +
                           '📊 Прогресс = снижение веса от начального к целевому.\n' +
                           '⚖️ Безопасный темп: 0.5–1 кг в неделю.';
                if (weeksLeft !== null && target < initial) {
                    const neededLoss = initial - target;
                    const weeklyRate = neededLoss / (weeksLeft || 1);
                    if (weeklyRate > 1) {
                        tipsText += `\n⚠️ Ваш темп (${weeklyRate.toFixed(1)} кг/нед) выше безопасного. Рекомендуем скорректировать цель.`;
                    }
                }
                break;
            case 'mass-gain':
                tipsText = '💪 Для набора массы обновляйте вес раз в неделю в одно и то же время.\n' +
                           '📊 Прогресс = увеличение веса от начального к целевому.\n' +
                           '🏋️ Безопасный темп: 0.2–0.5 кг в неделю.';
                if (weeksLeft !== null && target > initial) {
                    const neededGain = target - initial;
                    const weeklyRate = neededGain / (weeksLeft || 1);
                    if (weeklyRate > 0.5) {
                        tipsText += `\n⚠️ Ваш темп (${weeklyRate.toFixed(1)} кг/нед) выше безопасного. Рекомендуем снизить темп.`;
                    }
                }
                break;
            case 'strength':
                tipsText = '🏋️‍♂️ Для силовых целей обновляйте результат каждую тренировку (или раз в неделю).\n' +
                           '📊 Прогресс = увеличение веса/повторений от начального к целевому.\n' +
                           '📈 Безопасный темп: +2–5% к весу снаряда в неделю.';
                if (weeksLeft !== null && target > current) {
                    const neededGain = target - current;
                    const weeklyRate = (neededGain / (weeksLeft || 1));
                    const currentWeight = current || 1;
                    const percentPerWeek = (weeklyRate / currentWeight) * 100;
                    if (percentPerWeek > 5) {
                        tipsText += `\n⚠️ Ваш темп (${percentPerWeek.toFixed(0)}% в нед) выше рекомендуемого (2–5%). Скорректируйте цель.`;
                    }
                }
                break;
            case 'cardio':
                tipsText = '🏃 Для кардио обновляйте показатели после каждой тренировки.\n' +
                           '📊 Прогресс = увеличение дистанции/времени от начального к целевому.\n' +
                           '📈 Безопасный темп: +5–10% к нагрузке в неделю.';
                if (weeksLeft !== null && target > current) {
                    const neededGain = target - current;
                    const weeklyRate = neededGain / (weeksLeft || 1);
                    const percentPerWeek = (weeklyRate / (current || 1)) * 100;
                    if (percentPerWeek > 10) {
                        tipsText += `\n⚠️ Ваш темп (${percentPerWeek.toFixed(0)}% в нед) выше безопасного (5–10%). Рекомендуем снизить темп.`;
                    }
                }
                break;
            default:
                tipsText = 'Обновляйте прогресс регулярно и следуйте вашей цели.';
        }
        tipsContent.textContent = tipsText;
    }
}

function updateGoalProgressDisplay(goal) {
    const config = GOAL_TYPE_CONFIG[goal.type] || GOAL_TYPE_CONFIG['weight-loss'];
    const unit = goal.unit || config.unit;
    const currentEl = document.getElementById('goalCurrentValue');
    const currentSpan = document.getElementById('goalCurrentSpan');
    const targetSpan = document.getElementById('goalTargetSpan');
    const initialSpan = document.getElementById('goalInitialSpan');
    const currentUnit = document.getElementById('goalCurrentUnit');
    const targetUnit = document.getElementById('goalTargetUnit');
    const initialUnit = document.getElementById('goalInitialUnit');
    if (currentEl) currentEl.value = goal.currentValue || 0;
    if (currentSpan) currentSpan.textContent = goal.currentValue || 0;
    if (targetSpan) targetSpan.textContent = goal.targetValue || 0;
    if (initialSpan) initialSpan.textContent = goal.initialValue !== undefined ? goal.initialValue : (goal.currentValue || 0);
    if (currentUnit) currentUnit.textContent = unit;
    if (targetUnit) targetUnit.textContent = unit;
    if (initialUnit) initialUnit.textContent = unit;
    const startDateEl = document.getElementById('goalStartDate');
    const endDateEl = document.getElementById('goalEndDate');
    const daysLeftEl = document.getElementById('goalDaysLeft');
    if (startDateEl) startDateEl.textContent = goal.startDate ? formatDisplayDate(goal.startDate) : '—';
    if (endDateEl) endDateEl.textContent = goal.endDate ? formatDisplayDate(goal.endDate) : '—';
    if (daysLeftEl && goal.endDate) {
        const endDate = new Date(goal.endDate);
        const today = new Date();
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        daysLeftEl.textContent = diffDays > 0 ? diffDays : 0;
    }
    const { percentComplete, progressText } = calculateGoalProgress(goal, unit);
    const progressFill = document.getElementById('goalProgressFill');
    const progressPercent = document.getElementById('goalProgressPercent');
    const progressMessage = document.getElementById('goalProgressMessage');
    if (progressFill) {
        progressFill.style.width = `${percentComplete}%`;
        if (percentComplete >= 100) progressFill.style.backgroundColor = '#4CAF50';
        else if (percentComplete >= 70) progressFill.style.backgroundColor = '#ff8c00';
        else if (percentComplete >= 30) progressFill.style.backgroundColor = '#ff9900';
        else progressFill.style.backgroundColor = '#ff4444';
    }
    if (progressPercent) progressPercent.textContent = `${percentComplete}%`;
    if (progressMessage) progressMessage.textContent = progressText;
}

async function updateGoalProgress() {
    const user = getCurrentUser();
    if (!user) return;
    const modal = document.getElementById('goalDetailModal');
    const goalId = modal.dataset.goalId;
    const newValueInput = document.getElementById('goalCurrentValue');
    const newValue = newValueInput.value;
    if (!goalId) { showTemporaryMessage('Ошибка: не выбрана цель', 'error'); return; }
    if (!newValue || isNaN(parseFloat(newValue))) { showTemporaryMessage('Введите корректное значение', 'error'); return; }
    try {
        const getResponse = await fetch(`${API_BASE_URL}/api/goals/${goalId}`);
        if (!getResponse.ok) throw new Error('Ошибка загрузки цели');
        const goal = await getResponse.json();
        const oldValue = goal.currentValue;
        goal.currentValue = parseFloat(newValue);
        if (!goal.history) goal.history = [];
        goal.history.push({
            value: goal.currentValue,
            date: new Date().toISOString().split('T')[0]
        });
        if (!goal.initialValue && oldValue > 0 && goal.history.length === 1) {
            goal.initialValue = oldValue;
        }
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });
        if (response.ok) {
            const updatedGoal = await response.json();
            updateGoalProgressDisplay(updatedGoal);
            renderGoalHistoryChart(updatedGoal.history || [], updatedGoal.unit || '');
            loadGoals();
            showTemporaryMessage('Прогресс обновлен!', 'success');
        } else {
            const error = await response.text();
            showTemporaryMessage('Ошибка обновления: ' + error, 'error');
        }
    } catch (error) {
        showTemporaryMessage('Ошибка сети: ' + error.message, 'error');
    }
}

async function deleteGoal() {
    const user = getCurrentUser();
    if (!user) return;
    const modal = document.getElementById('goalDetailModal');
    const goalId = modal.dataset.goalId;
    if (!goalId) { showTemporaryMessage('Ошибка: не выбрана цель', 'error'); return; }
    if (!confirm('Вы уверены, что хотите удалить эту цель?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
        if (response.ok) {
            modal.style.display = 'none';
            await loadGoals();
            showTemporaryMessage('Цель удалена', 'success');
        } else {
            const error = await response.text();
            showTemporaryMessage('Ошибка удаления: ' + error, 'error');
        }
    } catch (error) {
        showTemporaryMessage('Ошибка сети: ' + error.message, 'error');
    }
}

function showTemporaryMessage(text, type) {
    const messageEl = document.getElementById('temporaryMessage');
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `temporary-message ${type}`;
    messageEl.style.display = 'block';
    clearTimeout(messageEl._timeout);
    messageEl._timeout = setTimeout(() => messageEl.style.display = 'none', 4000);
}

// ======================= КЛУБЫ =======================
async function loadClubsByCity(city) {
    const regClubSelect = document.getElementById('regClub');
    if (!regClubSelect) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/clubs?city=${encodeURIComponent(city)}`);
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        const clubs = await response.json();
        if (!Array.isArray(clubs) || clubs.length === 0) {
            regClubSelect.innerHTML = '<option value="">Клубы не найдены</option>';
            return;
        }
        regClubSelect.innerHTML = '<option value="">Выберите клуб</option>';
        clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.id;
            option.textContent = club.address || club.name;
            regClubSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Ошибка загрузки клубов:", error);
        regClubSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
    }
}

// ======================= АДМИН-ПАНЕЛЬ =======================
async function getAllGoals() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals`);
        if (!response.ok) throw new Error('Ошибка загрузки целей');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (!response.ok) throw new Error('Ошибка загрузки пользователей');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getAllAbonements() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/abonements`);
        if (!response.ok) throw new Error('Ошибка загрузки абонементов');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getAllClubs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/clubs`);
        if (!response.ok) throw new Error('Ошибка загрузки клубов');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// ======================= ЗАГРУЗКА АБОНЕМЕНТОВ НА ГЛАВНУЮ =======================
// ===== ИЗМЕНЕНО: добавлена поддержка single =====
function getAbonementsGroupKey(abonement) {
    const d = abonement.duration;
    if (d == null) return 'by-class';
    if (d === 1) return 'single';               // разовые занятия
    if (d <= 30) return 'by-class';             // абонементы по занятиям
    if (d <= 150) return 'unlimited';           // безлимитные
    return 'fitness';                           // фитнес
}

// ===== ИЗМЕНЕНО: добавлена загрузка для single =====
async function loadAbonementsForHome() {
    const singleEl = document.getElementById('abonements-grid-single');
    const byClassEl = document.getElementById('abonements-grid-by-class');
    const unlimitedEl = document.getElementById('abonements-grid-unlimited');
    const fitnessEl = document.getElementById('abonements-grid-fitness');

    if (!singleEl || !byClassEl || !unlimitedEl || !fitnessEl) return;

    // Показываем загрузку
    singleEl.innerHTML = '<div class="price-card" style="padding:30px;">Загрузка...</div>';
    byClassEl.innerHTML = '<div class="price-card" style="padding:30px;">Загрузка...</div>';
    unlimitedEl.innerHTML = '';
    fitnessEl.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/abonements`);
        if (!response.ok) throw new Error('Ошибка загрузки абонементов');
        const abonements = await response.json();

        const groups = { 'single': [], 'by-class': [], 'unlimited': [], 'fitness': [] };
        if (Array.isArray(abonements)) {
            abonements.forEach(a => {
                const key = getAbonementsGroupKey(a);
                if (groups[key]) {
                    groups[key].push(a);
                } else {
                    // fallback
                    groups['by-class'].push(a);
                }
            });
        }

        singleEl.innerHTML = groups['single'].length
            ? groups['single'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Разовых занятий пока нет</p>';

        byClassEl.innerHTML = groups['by-class'].length
            ? groups['by-class'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Абонементов по занятиям пока нет</p>';

        unlimitedEl.innerHTML = groups['unlimited'].length
            ? groups['unlimited'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Безлимитных абонементов пока нет</p>';

        fitnessEl.innerHTML = groups['fitness'].length
            ? groups['fitness'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Фитнес-абонементов пока нет</p>';

    } catch (e) {
        console.error(e);
        singleEl.innerHTML = '<p class="error-message">Ошибка загрузки</p>';
        byClassEl.innerHTML = '<p class="error-message">Ошибка загрузки</p>';
        unlimitedEl.innerHTML = '';
        fitnessEl.innerHTML = '';
    }
}

function renderAbonementCard(abonement) {
    const price = abonement.price != null ? abonement.price : 0;
    const duration = abonement.duration != null ? abonement.duration : 0;
    const date = abonement.date ? formatDisplayDate(abonement.date) : '—';
    return `
        <div class="price-card" data-tab="${escapeHtml(getAbonementsGroupKey(abonement))}">
            <div class="price-card-logo-bg"></div>
            <h3 class="price-card-title">${escapeHtml(abonement.name || 'Абонемент')}</h3>
            <p class="price-card-price">${escapeHtml(price)} р.</p>
            <div class="price-card-details">
                <p>Срок: ${escapeHtml(duration)} дней</p>
                <p>Дата: ${escapeHtml(date)}</p>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ======================= ОСНОВНОЙ ОБРАБОТЧИК СОБЫТИЙ =======================
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM загружен - инициализация...");
    applyAllStyles();
    updateUserUI();
    initMobileMenu();
    const user = getCurrentUser();

    // === АВТОМАТИЧЕСКАЯ ЗАГРУЗКА АБОНЕМЕНТОВ (на любой странице) ===
    if (document.getElementById('abonements-grid-single') ||
        document.getElementById('abonements-grid-by-class') ||
        document.getElementById('abonements-grid-unlimited') ||
        document.getElementById('abonements-grid-fitness')) {
        loadAbonementsForHome();
    }

    // === АВТОМАТИЧЕСКАЯ ЗАГРУЗКА АКЦИЙ (на любой странице) ===
    if (document.getElementById('promotionsCarouselTrack')) {
        loadPromotions();
    }

    // === ПРОФИЛЬ ===
    if (window.location.pathname.includes('profile.html')) {
        const profileName = document.getElementById('profileUserName');
        if (profileName && user) {
            profileName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь';
        }
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        loadMyAbonements();
        loadGoals();
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            updateUserUI();
            window.location.href = 'index.html';
        });
    }

    const showUserQrBtn = document.getElementById('showUserQrBtn');
    if (showUserQrBtn) {
        showUserQrBtn.addEventListener('click', showUserQrCode);
    }
    const closeUserQrModal = document.getElementById('closeUserQrModal');
    if (closeUserQrModal) {
        closeUserQrModal.addEventListener('click', () => {
            document.getElementById('userQrModal').style.display = 'none';
        });
    }
    const closeQrModal = document.getElementById('closeQrModal');
    if (closeQrModal) {
        closeQrModal.addEventListener('click', () => {
            document.getElementById('qrModal').style.display = 'none';
        });
    }

    // ===== ТАБЫ ДЛЯ ЦЕН =====
    const tabs = document.querySelectorAll(".tab-button");
    const cards = document.querySelectorAll(".price-card");
    const singleGrid = document.getElementById('abonements-grid-single');
    const byClassGrid = document.getElementById('abonements-grid-by-class');
    const unlimitedGrid = document.getElementById('abonements-grid-unlimited');
    const fitnessGrid = document.getElementById('abonements-grid-fitness');

    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(btn => btn.classList.remove("active"));
                tab.classList.add("active");
                const target = tab.getAttribute("data-tab");
                // Скрываем статические карточки (если есть)
                cards.forEach(card => {
                    if (card.getAttribute("data-tab") === target) {
                        card.classList.remove("hidden");
                    } else {
                        card.classList.add("hidden");
                    }
                });
                // Управляем контейнерами
                if (singleGrid) singleGrid.style.display = target === 'single' ? '' : 'none';
                if (byClassGrid) byClassGrid.style.display = target === 'by-class' ? '' : 'none';
                if (unlimitedGrid) unlimitedGrid.style.display = target === 'unlimited' ? '' : 'none';
                if (fitnessGrid) fitnessGrid.style.display = target === 'fitness' ? '' : 'none';
            });
        });
    }

    // ===== СТАРАЯ КАРУСЕЛЬ (оставлена для обратной совместимости) =====
    const carousel = document.querySelector(".promotions-carousel");
    const promotionCards = document.querySelectorAll(".promotion-card");
    const indicatorsContainer = document.querySelector(".carousel-indicators");
    if (carousel && promotionCards.length > 0 && indicatorsContainer) {
        let index = 0;
        const total = promotionCards.length;
        const visibleCount = 5;
        const autoSlideDelay = 3000;
        let autoSlideInterval;
        let startX = 0;
        let isDragging = false;
        function renderIndicators() {
            indicatorsContainer.innerHTML = "";
            const maxDots = Math.min(total, visibleCount);
            const start = Math.max(0, Math.min(index, total - visibleCount));
            if (start > 0) {
                const leftFade = document.createElement("span");
                leftFade.className = "indicator-dot";
                leftFade.style.opacity = "0.2";
                indicatorsContainer.appendChild(leftFade);
            }
            for (let i = start; i < start + maxDots && i < total; i++) {
                const dot = document.createElement("span");
                dot.className = "indicator-dot";
                if (i === index) dot.classList.add("active");
                dot.addEventListener("click", () => goToSlide(i));
                indicatorsContainer.appendChild(dot);
            }
            if (start + maxDots < total) {
                const rightFade = document.createElement("span");
                rightFade.className = "indicator-dot";
                rightFade.style.opacity = "0.2";
                indicatorsContainer.appendChild(rightFade);
            }
        }
        function updateCarousel() {
            const offset = -index * (promotionCards[0].offsetWidth + 20);
            carousel.style.transform = `translateX(${offset}px)`;
            carousel.style.transition = "transform 0.6s ease";
            renderIndicators();
        }
        function goToSlide(i) {
            index = i;
            if (index < 0) index = total - 1;
            if (index >= total) index = 0;
            updateCarousel();
            restartAutoSlide();
        }
        function startAutoSlide() {
            autoSlideInterval = setInterval(() => {
                index = (index + 1) % total;
                updateCarousel();
            }, autoSlideDelay);
        }
        function restartAutoSlide() {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }
        carousel.addEventListener("mousedown", (e) => {
            startX = e.clientX;
            isDragging = true;
        });
        carousel.addEventListener("mouseup", (e) => {
            if (!isDragging) return;
            const diff = e.clientX - startX;
            if (diff > 50) goToSlide(index - 1);
            else if (diff < -50) goToSlide(index + 1);
            isDragging = false;
        });
        carousel.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });
        carousel.addEventListener("touchend", (e) => {
            if (!isDragging) return;
            const diff = e.changedTouches[0].clientX - startX;
            if (diff > 50) goToSlide(index - 1);
            else if (diff < -50) goToSlide(index + 1);
            isDragging = false;
        });
        renderIndicators();
        updateCarousel();
        startAutoSlide();
    }

    // ===== ГАЛЕРЕЯ =====
    const strips = document.querySelectorAll(".gallery-strip");
    if (strips.length > 0) {
        const normalDuration = 15;
        const slowDuration = 60;
        strips.forEach(strip => {
            strip.addEventListener("mouseenter", () => {
                strip.style.animationDuration = `${slowDuration}s`;
            });
            strip.addEventListener("mouseleave", () => {
                strip.style.animationDuration = `${normalDuration}s`;
            });
        });
    }
    const lightbox = document.getElementById("galleryLightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    const galleryItems = document.querySelectorAll(".gallery-item img");
    if (lightbox && lightboxImage && galleryItems.length > 0) {
        galleryItems.forEach(img => {
            img.addEventListener("click", () => {
                lightboxImage.src = img.src;
                lightbox.style.display = "flex";
            });
        });
        lightbox.addEventListener("click", () => {
            lightbox.style.display = "none";
        });
    }

    // ===== ЦЕЛИ =====
    const goalModal = document.getElementById("goalModal");
    const openGoalModalBtn = document.getElementById("openGoalModalBtn");
    const addGoalBtn = document.getElementById("addGoalBtn");
    const modalGoalTabs = document.querySelectorAll("#modalGoalTabs .modal-tab");
    if (goalModal && openGoalModalBtn) {
        const closeGoalModalButtons = document.querySelectorAll(".close-goal-modal");
        openGoalModalBtn.addEventListener("click", () => {
            goalModal.style.display = "flex";
            const firstTab = document.querySelector('[data-goal-type="weight-loss"]');
            if (firstTab) {
                modalGoalTabs.forEach(t => t.classList.remove('active'));
                firstTab.classList.add('active');
                renderGoalFields('weight-loss');
            }
            goalValidationDone = false;
            goalValidationData = null;
            const addBtn = document.getElementById('addGoalBtn');
            if (addBtn) {
                addBtn.textContent = 'ДОБАВИТЬ ЦЕЛЬ';
                addBtn.style.background = '';
            }
            document.getElementById('aiRecommendationBlock').style.display = 'none';
            const cancelBtn = document.getElementById('cancelAdjustmentBtn');
            if (cancelBtn) cancelBtn.style.display = 'none';
        });
        closeGoalModalButtons.forEach(button => {
            button.addEventListener("click", () => {
                goalModal.style.display = "none";
                clearGoalForm();
            });
        });
        modalGoalTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                modalGoalTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderGoalFields(tab.dataset.goalType);
            });
        });
        if (addGoalBtn) {
            addGoalBtn.addEventListener("click", addNewGoal);
        }
        window.addEventListener("click", (event) => {
            if (event.target === goalModal) {
                goalModal.style.display = "none";
                clearGoalForm();
            }
        });
    }

    // Привязываем кнопку отмены корректировки
    const cancelAdjustmentBtn = document.getElementById('cancelAdjustmentBtn');
    if (cancelAdjustmentBtn) {
        cancelAdjustmentBtn.addEventListener('click', cancelAdjustment);
    }

    // ===== ВЫПАДАЮЩЕЕ МЕНЮ =====
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            this.parentNode.classList.toggle('active');
        });
    }

    // ===== НАВИГАЦИЯ ПО РАЗДЕЛАМ (СКРОЛЛ) =====
    const navLinks = document.querySelectorAll('.main-nav .nav-link[data-section]');
    const sections = document.querySelectorAll('section[id]');
    const mainHeader = document.querySelector('.main-header');
    if (navLinks.length > 0 && sections.length > 0 && mainHeader) {
        const headerHeight = mainHeader.offsetHeight;
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-section');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    navLinks.forEach(nav => nav.classList.remove('active'));
                    link.classList.add('active');
                    window.scrollTo({
                        top: targetSection.offsetTop - headerHeight - 10,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== РЕГИСТРАЦИЯ / ЛОГИН =====
    const loginBlock = document.getElementById("loginBlock");
    const registerBlock = document.getElementById("registerBlock");
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const showLoginBtn = document.getElementById("showLoginBtn");
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener("click", () => {
            if (loginBlock) loginBlock.classList.add("hidden");
            if (registerBlock) registerBlock.classList.remove("hidden");
        });
    }
    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", () => {
            if (registerBlock) registerBlock.classList.add("hidden");
            if (loginBlock) loginBlock.classList.remove("hidden");
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const regFirstName = document.getElementById('regFirstName');
            const regLastName = document.getElementById('regLastName');
            const regEmail = document.getElementById('regEmail');
            const regPassword = document.getElementById('regPassword');
            const regClub = document.getElementById('regClub');
            if (!regFirstName || !regLastName || !regEmail || !regPassword) {
                showTemporaryMessage("Пожалуйста, заполните все поля", 'error');
                return;
            }
            let clubId = null;
            if (regClub && regClub.value) {
                clubId = parseInt(regClub.value);
            }
            const registerData = {
                firstName: regFirstName.value,
                lastName: regLastName.value,
                email: regEmail.value,
                password: regPassword.value,
                clubId: clubId
            };
            try {
                const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registerData)
                });
                if (!registerResponse.ok) {
                    const errorData = await registerResponse.json();
                    showTemporaryMessage("Ошибка регистрации: " + (errorData.error || "Неизвестная ошибка"), 'error');
                    return;
                }
                const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: regEmail.value, password: regPassword.value })
                });
                if (loginResponse.ok) {
                    const userDto = await loginResponse.json();
                    localStorage.setItem('user', JSON.stringify(userDto));
                    showTemporaryMessage("Регистрация и вход выполнены успешно!", 'success');
                    window.location.href = 'profile.html';
                } else {
                    showTemporaryMessage("Регистрация успешна! Теперь войдите, используя свой email и пароль.", 'success');
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
                showTemporaryMessage("Сервер недоступен", 'error');
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const loginEmail = document.getElementById('loginEmail');
            const loginPassword = document.getElementById('loginPassword');
            if (!loginEmail || !loginPassword) {
                showTemporaryMessage("Пожалуйста, заполните все поля", 'error');
                return;
            }
            const email = loginEmail.value;
            const password = loginPassword.value;
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (response.ok) {
                    const userDto = await response.json();
                    localStorage.setItem('user', JSON.stringify(userDto));
                    updateUserUI();
                    showTemporaryMessage("Вход выполнен успешно!", 'success');
                    window.location.href = 'profile.html';
                } else {
                    showTemporaryMessage("Ошибка входа: Неверный логин или пароль", 'error');
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
                showTemporaryMessage("Сервер недоступен", 'error');
            }
        });
    }

    // ===== КЛУБЫ ПРИ РЕГИСТРАЦИИ =====
    const regClubSelect = document.getElementById('regClub');
    const urlParams = new URLSearchParams(window.location.search);
    let cityParam = urlParams.get('city') ? decodeURIComponent(urlParams.get('city')).trim() : null;
    if (cityParam) {
        const lower = cityParam.toLowerCase();
        cityParam = CITY_MAPPING[lower] || cityParam;
    }
    if (regClubSelect) {
        if (cityParam) {
            loadClubsByCity(cityParam);
        } else {
            loadClubsByCity('');
        }
    }

    // ===== ЗАКРЫТИЕ МОДАЛОК ПО КЛИКУ ВНЕ =====
    window.addEventListener('click', (event) => {
        const isProfilePage = window.location.pathname.includes('profile.html');
        const isIndexPage = window.location.pathname.includes('index.html');
        if (!isProfilePage && !isIndexPage) return;
        const qrModal = document.getElementById('qrModal');
        const goalModalEl = document.getElementById('goalModal');
        const goalDetailModalEl = document.getElementById('goalDetailModal');
        const userQrModal = document.getElementById('userQrModal');
        if (qrModal && event.target === qrModal) qrModal.style.display = 'none';
        if (goalModalEl && event.target === goalModalEl) goalModalEl.style.display = 'none';
        if (goalDetailModalEl && event.target === goalDetailModalEl) goalDetailModalEl.style.display = 'none';
        if (userQrModal && event.target === userQrModal) userQrModal.style.display = 'none';
    });

    // ===== ДЕТАЛИ ЦЕЛИ =====
    const goalDetailModal = document.getElementById('goalDetailModal');
    const closeGoalDetailBtn = document.getElementById('closeGoalDetailModal');
    const updateGoalBtn = document.getElementById('updateGoalBtn');
    const deleteGoalBtn = document.getElementById('deleteGoalBtn');
    if (goalDetailModal) {
        if (closeGoalDetailBtn) {
            closeGoalDetailBtn.addEventListener('click', () => {
                goalDetailModal.style.display = 'none';
            });
        }
        if (updateGoalBtn) {
            updateGoalBtn.addEventListener('click', updateGoalProgress);
        }
        if (deleteGoalBtn) {
            deleteGoalBtn.addEventListener('click', deleteGoal);
        }
        const currentValueInput = document.getElementById('goalCurrentValue');
        if (currentValueInput) {
            currentValueInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    updateGoalProgress();
                }
            });
        }
    }

    // ===== КНОПКА ФИЛЬТРА АБОНЕМЕНТОВ =====
    addExpiredFilterButton();
});

// ======================= БУРГЕР-МЕНЮ =======================
function initMobileMenu() {
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('admin-panel.html') ||
        window.location.pathname.includes('scanner.html')) {
        return;
    }
    if (document.querySelector('.mobile-menu-btn')) return;
    const headerContainers = document.querySelectorAll('.header-container, .profile-header-container');
    headerContainers.forEach(container => {
        const burgerBtn = document.createElement('button');
        burgerBtn.className = 'mobile-menu-btn';
        burgerBtn.innerHTML = '<span></span><span></span><span></span>';
        burgerBtn.setAttribute('aria-label', 'Меню');
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'mobile-dropdown';
        const profileInfo = container.querySelector('.profile-info');
        if (profileInfo) {
            const clonedInfo = profileInfo.cloneNode(true);
            dropdownMenu.appendChild(clonedInfo);
        } else {
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.className = 'btn-login-mobile';
            loginLink.textContent = 'ВОЙТИ';
            dropdownMenu.appendChild(loginLink);
        }
        container.appendChild(burgerBtn);
        container.appendChild(dropdownMenu);
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('open');
            burgerBtn.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!dropdownMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
                dropdownMenu.classList.remove('open');
                burgerBtn.classList.remove('active');
            }
        });
    });
}

// ======================= УПРАВЛЕНИЕ АКЦИЯМИ (БЕСКОНЕЧНАЯ КАРУСЕЛЬ) =======================

let currentPromotions = [];
let animationId = null;
let speed = 1; // базовая скорость (пикселей за кадр)
let direction = 1; // 1 = влево, -1 = вправо
let isPaused = false;

async function loadPromotions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions`);
        if (response.ok) {
            currentPromotions = await response.json();
            renderPromotions();
            return currentPromotions;
        } else {
            console.error('Ошибка загрузки акций');
            return [];
        }
    } catch (error) {
        console.error('Ошибка сети при загрузке акций:', error);
        return [];
    }
}

function renderPromotions() {
    const track = document.getElementById('promotionsCarouselTrack');
    const addBtn = document.getElementById('addPromotionBtn');
    
    if (!track) return;
    
    const user = getCurrentUser();
    const isAdmin = user && user.isAdmin;
    
    if (addBtn) {
        addBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
    
    track.innerHTML = '';
    
    if (!currentPromotions || currentPromotions.length === 0) {
        let emptyMessage = 'Акций пока нет.';
        if (isAdmin) {
            emptyMessage = 'Акций пока нет. Добавьте первую акцию!';
        }
        track.innerHTML = `
            <div class="promotion-card" style="flex:1; text-align:center; padding:40px; background:#2a2a2a; border-radius:20px;">
                <p style="color:#999; font-size:18px;">${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    // Создаём карточки и дублируем их для бесконечного эффекта (3 копии)
    const cardCount = currentPromotions.length;
    const cloneCount = 3; // сколько раз клонировать набор
    const totalCards = cardCount * cloneCount;
    
    for (let i = 0; i < totalCards; i++) {
        const promo = currentPromotions[i % cardCount];
        const card = createPromotionCard(promo, isAdmin);
        track.appendChild(card);
    }
    
    // Запускаем анимацию
    startInfiniteScroll();
}

function createPromotionCard(promo, isAdmin) {
    const card = document.createElement('div');
    card.className = 'promotion-card';
    card.dataset.id = promo.id;
    card.style.background = promo.imageUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${promo.imageUrl}) center/cover` : 'linear-gradient(45deg, #ff8c00, #cc7a00)';
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    
    let deleteBtnHtml = '';
    if (isAdmin) {
        deleteBtnHtml = `<button class="delete-promotion-btn" data-id="${promo.id}" style="position:absolute; top:15px; right:15px; background:rgba(255,68,68,0.9); color:#fff; border:none; border-radius:50%; width:36px; height:36px; font-size:18px; cursor:pointer; z-index:10;">✖</button>`;
    }
    
    card.innerHTML = `
        ${deleteBtnHtml}
        <h3 style="font-size:22px; margin:0 0 8px 0; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${escapeHtml(promo.title)}</h3>
        <p style="font-size:14px; opacity:0.9; margin:0 0 15px 0; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">${escapeHtml(promo.description)}</p>
        ${promo.link && promo.link !== '#' ? `<a href="${promo.link}" class="btn btn-secondary" style="display:inline-block; background:rgba(255,255,255,0.2); color:#fff; padding:10px 25px; border-radius:30px; text-decoration:none; font-weight:600; backdrop-filter:blur(4px);">УЗНАТЬ БОЛЬШЕ</a>` : ''}
    `;
    
    card.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-promotion-btn')) return;
        openPromotionDetails(promo.id);
    });
    
    const deleteBtn = card.querySelector('.delete-promotion-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(promo.id);
        });
    }
    
    return card;
}

function startInfiniteScroll() {
    const track = document.getElementById('promotionsCarouselTrack');
    if (!track) return;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    let position = 0;
    const cardWidth = track.querySelector('.promotion-card')?.offsetWidth || 300;
    const gap = 20;
    const step = cardWidth + gap;
    const totalWidth = track.scrollWidth;
    
    function animate() {
        if (!isPaused) {
            position -= speed * direction;
            // Циклический сброс
            if (position <= -totalWidth / 3) {
                position += totalWidth / 3;
            } else if (position > 0) {
                position -= totalWidth / 3;
            }
            track.style.transform = `translateX(${position}px)`;
        }
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    const wrapper = document.getElementById('promotionsCarouselWrapper');
    if (wrapper) {
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY !== 0) {
                const delta = e.deltaY > 0 ? 1 : -1;
                speed = Math.max(0.1, speed + delta * 0.3);
                if (speed < 0.1) speed = 0.1;
            }
            if (e.deltaX !== 0) {
                direction = e.deltaX > 0 ? -1 : 1;
            }
        }, { passive: false });
    }
    
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => {
            isPaused = true;
        });
        wrapper.addEventListener('mouseleave', () => {
            isPaused = false;
        });
    }
}

// ===== ОТКРЫТИЕ ДЕТАЛЕЙ АКЦИИ =====
function openPromotionDetails(id) {
    const promo = currentPromotions.find(p => p.id === id);
    if (!promo) {
        showTemporaryMessage('Акция не найдена', 'error');
        return;
    }

    const modal = document.getElementById('promotionDetailModal');
    const titleEl = document.getElementById('promoDetailTitle');
    const descEl = document.getElementById('promoDetailDescription');
    const imageEl = document.getElementById('promoDetailImage');
    const linkEl = document.getElementById('promoDetailLink');

    if (titleEl) titleEl.textContent = promo.title;
    if (descEl) descEl.textContent = promo.description || 'Подробности отсутствуют';
    if (imageEl) {
        if (promo.imageUrl) {
            imageEl.src = promo.imageUrl;
            imageEl.style.display = 'block';
        } else {
            imageEl.style.display = 'none';
        }
    }
    if (linkEl) {
        if (promo.link && promo.link !== '#') {
            linkEl.href = promo.link;
            linkEl.style.display = 'inline-block';
        } else {
            linkEl.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
}

// ===== МОДАЛКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ =====
let pendingDeleteId = null;

function showDeleteConfirmation(id) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) modal.style.display = 'flex';
}

function confirmDeletePromotion() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    pendingDeleteId = null;
    deletePromotion(id);
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) modal.style.display = 'none';
}

function cancelDeletePromotion() {
    pendingDeleteId = null;
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) modal.style.display = 'none';
}

// ===== ДОБАВЛЕНИЕ АКЦИИ =====
async function addPromotion(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showTemporaryMessage('Необходимо авторизоваться как администратор', 'error');
        return;
    }
    
    const title = document.getElementById('promoTitle')?.value.trim();
    const description = document.getElementById('promoDescription')?.value.trim();
    const link = document.getElementById('promoLink')?.value.trim() || '#';
    const imageFile = document.getElementById('promoImageFile')?.files[0];
    
    if (!title) {
        showTemporaryMessage('Введите название акции', 'error');
        return;
    }
    
    let imageUrl = '';
    if (imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            const uploadResponse = await fetch(`${API_BASE_URL}/api/promotions/upload`, {
                method: 'POST',
                body: formData
            });
            if (!uploadResponse.ok) {
                const error = await uploadResponse.text();
                showTemporaryMessage('Ошибка загрузки изображения: ' + error, 'error');
                return;
            }
            const uploadResult = await uploadResponse.json();
            imageUrl = uploadResult.imageUrl;
        } catch (error) {
            showTemporaryMessage('Ошибка загрузки изображения: ' + error.message, 'error');
            return;
        }
    }
    
    const newPromotion = {
        title: title,
        description: description || title,
        link: link,
        imageUrl: imageUrl,
        active: true
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions?userId=${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPromotion)
        });
        if (response.ok) {
            showTemporaryMessage('Акция добавлена!', 'success');
            document.getElementById('addPromotionModal').style.display = 'none';
            document.getElementById('addPromotionForm').reset();
            document.getElementById('promoImagePreview').style.display = 'none';
            await loadPromotions();
        } else {
            const error = await response.text();
            showTemporaryMessage('Ошибка добавления: ' + error, 'error');
        }
    } catch (error) {
        showTemporaryMessage('Ошибка сети: ' + error.message, 'error');
    }
}

async function deletePromotion(id) {
    const user = getCurrentUser();
    if (!user) {
        showTemporaryMessage('Необходимо авторизоваться', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions/${id}?userId=${user.id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showTemporaryMessage('Акция удалена', 'success');
            await loadPromotions();
        } else {
            const error = await response.text();
            showTemporaryMessage('Ошибка удаления: ' + error, 'error');
        }
    } catch (error) {
        showTemporaryMessage('Ошибка сети: ' + error.message, 'error');
    }
}

// ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.updateUserUI = updateUserUI;
window.loadMyAbonements = loadMyAbonements;
window.loadGoals = loadGoals;
window.showUserQrCode = showUserQrCode;
window.addNewGoal = addNewGoal;
window.openGoalDetailModal = openGoalDetailModal;
window.updateGoalProgress = updateGoalProgress;
window.deleteGoal = deleteGoal;
window.getAllGoals = getAllGoals;
window.getAllUsers = getAllUsers;
window.getAllAbonements = getAllAbonements;
window.getAllClubs = getAllClubs;
window.validateGoal = validateGoal;
window.showRecommendations = showRecommendations;
window.saveGoalDirectly = saveGoalDirectly;
window.applyAdjustment = applyAdjustment;
window.cancelAdjustment = cancelAdjustment;
window.updateUnitForExercise = updateUnitForExercise;

// Дополнительные экспорты для акций и абонементов
window.loadPromotions = loadPromotions;
window.loadAbonementsForHome = loadAbonementsForHome;
window.renderPromotions = renderPromotions;
window.openPromotionDetails = openPromotionDetails;
window.addPromotion = addPromotion;
window.deletePromotion = deletePromotion;
window.showDeleteConfirmation = showDeleteConfirmation;
window.confirmDeletePromotion = confirmDeletePromotion;
window.cancelDeletePromotion = cancelDeletePromotion;
window.startInfiniteScroll = startInfiniteScroll;

function applyAllStyles() {}
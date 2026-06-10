/**
 * Основной JavaScript файл для Fitness Club
 * Исправления: отображение имени в профиле, устранение дублирования кнопки входа
 * Удалены все функции покупки абонементов (доступно только через админку)
 * Регистрация теперь не требует выбора клуба.
 */

// ======================= КОНСТАНТЫ И КОНФИГУРАЦИЯ =======================
const API_BASE_URL = "";

const CITY_MAPPING = {
    "minsk": "Минск",
    "mogilev": "Могилев",
    "grodno": "Гродно"
};

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
            { id: 'exerciseType', label: 'Упражнение', type: 'text', placeholder: 'Например: Жим лежа' },
            { id: 'initialValue', label: 'Начальный результат (кг)', type: 'number', placeholder: 'Например: 60', step: '0.5' },
            { id: 'targetValue', label: 'Желаемый результат (кг)', type: 'number', placeholder: 'Например: 100', step: '0.5' }
        ]
    },
    'cardio': {
        title: 'Кардионагрузка',
        iconPath: 'assets/images/icons/cardio_load.png',
        fields: [
            { id: 'initialValue', label: 'Начальные шаги/день', type: 'number', placeholder: 'Например: 3000' },
            { id: 'targetValue', label: 'Целевые шаги/день', type: 'number', placeholder: 'Например: 10000' }
        ]
    }
};

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

/**
 * Обновляет интерфейс пользователя в шапке (аватар или кнопка "Войти")
 * На странице профиля не вызывается. Скрывает оригинальную кнопку входа.
 */
function updateUserUI() {
    // Не трогаем страницу логина и страницу профиля
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('profile.html')) {
        return;
    }

    // Находим или создаём контейнер для профиля
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

    // Скрываем оригинальную кнопку входа, чтобы не дублировать
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

// ======================= ФУНКЦИИ ФОРМАТИРОВАНИЯ ДАТ =======================
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

// ======================= ФУНКЦИИ ДЛЯ РАБОТЫ С АБОНЕМЕНТАМИ (только купленные) =======================
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

function createPurchasedAbonementCard(purchased) {
    const card = document.createElement('div');
    card.className = 'price-card purchased-abonement-card';
    card.dataset.id = purchased.id;
    const purchaseDate = purchased.purchaseDate ? new Date(purchased.purchaseDate) : new Date();
    const endDate = purchased.endDate ? new Date(purchased.endDate) : new Date();
    const now = new Date();
    const isActive = endDate > now;
    card.innerHTML = `
        <div class="price-card-logo-bg"></div>
        <h3 class="price-card-title">${purchased.abonementName || 'Абонемент'}</h3>
        <p class="price-card-price">${purchased.priceAtPurchase || 0} р.</p>
        <div class="price-card-details">
            <p>Куплен: ${formatDisplayDate(purchaseDate)}</p>
            <p>Действует до: ${formatDisplayDate(endDate)}</p>
            <p class="abonement-status ${isActive ? 'status-active' : 'status-expired'}">${isActive ? 'Активен' : 'Истек'}</p>
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
    if (expiryDateSpan) expiryDateSpan.textContent = formatDisplayDate(new Date(purchased.endDate));
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

// ======================= ФУНКЦИИ ДЛЯ РАБОТЫ С ЦЕЛЯМИ =======================
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
    const displayTitle = goal.description || config.title;
    const displayUnit = config.unit;
    const { percentComplete, progressText } = calculateGoalProgress(goal, displayUnit);
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
        <h3 class="goal-card-title">${displayTitle}</h3>
        <div class="goal-card-values">
            <p>Текущее: <strong>${goal.currentValue || 0} ${displayUnit}</strong></p>
            <p>Цель: <strong>${goal.targetValue || 0} ${displayUnit}</strong></p>
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
    if (goal.type === 'weight-loss') {
        const initialValue = goal.initialValue || goal.currentValue * 1.1;
        if (goal.currentValue <= goal.targetValue) {
            percentComplete = 100;
            progressText = 'Цель достигнута! 🎉';
        } else {
            const totalToLose = initialValue - goal.targetValue;
            const lost = initialValue - goal.currentValue;
            percentComplete = Math.min(99, Math.round((lost / totalToLose) * 100));
            const remaining = goal.currentValue - goal.targetValue;
            progressText = `Осталось сбросить ${remaining.toFixed(1)} ${unit}`;
        }
    } else {
        if (goal.currentValue >= goal.targetValue) {
            percentComplete = 100;
            progressText = 'Цель достигнута! 🎉';
        } else {
            percentComplete = Math.min(99, Math.round((goal.currentValue / goal.targetValue) * 100));
            const remaining = goal.targetValue - goal.currentValue;
            progressText = `Осталось ${remaining.toFixed(1)} ${unit}`;
        }
    }
    return { percentComplete, progressText };
}

function renderGoalFields(goalType) {
    const formContainer = document.getElementById('goalDetailsForm');
    if (!formContainer) return;
    const config = GOAL_FIELD_CONFIG[goalType] || GOAL_FIELD_CONFIG['weight-loss'];
    let html = '';
    config.fields.forEach(field => {
        html += `
            <div class="modal-input-group">
                <label for="${field.id}">${field.label}</label>
                <input type="${field.type}" id="${field.id}" placeholder="${field.placeholder}" ${field.step ? `step="${field.step}"` : ''}>
            </div>
        `;
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
}

function clearGoalForm() {
    const formContainer = document.getElementById('goalDetailsForm');
    if (formContainer) formContainer.innerHTML = '';
    const commentInput = document.getElementById('goalComment');
    if (commentInput) commentInput.value = '';
    const tabs = document.querySelectorAll("#modalGoalTabs .modal-tab");
    if (tabs.length > 0) {
        tabs.forEach(t => t.classList.remove('active'));
        tabs[0].classList.add('active');
        renderGoalFields(tabs[0].dataset.goalType);
    }
}

async function addNewGoal() {
    const user = getCurrentUser();
    if (!user) {
        alert('Необходимо авторизоваться');
        window.location.href = 'login.html';
        return;
    }
    const activeTab = document.querySelector("#modalGoalTabs .modal-tab.active");
    if (!activeTab) {
        alert('Выберите тип цели');
        return;
    }
    const goalType = activeTab.dataset.goalType;
    const config = GOAL_FIELD_CONFIG[goalType];
    let targetValue = 0, currentValue = 0, initialValue = 0, description = '';
    if (goalType === 'weight-loss' || goalType === 'mass-gain') {
        const initialWeight = document.getElementById('initialWeight');
        const targetWeight = document.getElementById('targetWeight');
        initialValue = initialWeight ? parseFloat(initialWeight.value) || 0 : 0;
        targetValue = targetWeight ? parseFloat(targetWeight.value) || 0 : 0;
        currentValue = initialValue;
        description = goalType === 'weight-loss' ? `Похудение с ${initialValue}кг до ${targetValue}кг` : `Набор массы с ${initialValue}кг до ${targetValue}кг`;
    } else if (goalType === 'strength') {
        const exerciseType = document.getElementById('exerciseType');
        const initialVal = document.getElementById('initialValue');
        const targetVal = document.getElementById('targetValue');
        const exercise = exerciseType ? exerciseType.value : 'силовое упражнение';
        initialValue = initialVal ? parseFloat(initialVal.value) || 0 : 0;
        targetValue = targetVal ? parseFloat(targetVal.value) || 0 : 0;
        currentValue = initialValue;
        description = `${exercise}: с ${initialValue}кг до ${targetValue}кг`;
    } else if (goalType === 'cardio') {
        const initialVal = document.getElementById('initialValue');
        const targetVal = document.getElementById('targetValue');
        initialValue = initialVal ? parseFloat(initialVal.value) || 0 : 0;
        targetValue = targetVal ? parseFloat(targetVal.value) || 0 : 0;
        currentValue = initialValue;
        description = `Шаги/день: с ${initialValue} до ${targetValue}`;
    }
    const commentInput = document.getElementById('goalComment');
    const userComment = commentInput ? commentInput.value : '';
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const goalData = {
        type: goalType,
        targetValue: targetValue,
        currentValue: currentValue,
        initialValue: initialValue,
        startDate: toJavaDate(startDateInput ? startDateInput.value : null),
        endDate: toJavaDate(endDateInput ? endDateInput.value : null),
        description: userComment || description || config.title,
        userId: user.id
    };
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
            alert('Цель успешно создана!');
        } else {
            const errorText = await response.text();
            alert('Ошибка при создании цели: ' + (errorText || 'Неизвестная ошибка'));
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

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
        alert('Ошибка загрузки данных цели');
    }
}

function fillGoalDetailModal(goal) {
    const titleEl = document.getElementById('goalDetailTitle');
    if (titleEl) {
        const config = GOAL_TYPE_CONFIG[goal.type];
        titleEl.textContent = config ? config.title : goal.type;
    }
    const descEl = document.getElementById('goalDetailDescription');
    if (descEl) descEl.textContent = goal.description || 'Нет описания';
    const modal = document.getElementById('goalDetailModal');
    if (modal) modal.dataset.goalId = goal.id;
    updateGoalProgressDisplay(goal);
}

function updateGoalProgressDisplay(goal) {
    const config = GOAL_TYPE_CONFIG[goal.type] || GOAL_TYPE_CONFIG['weight-loss'];
    const unit = config.unit;
    const currentEl = document.getElementById('goalCurrentValue');
    const currentSpan = document.getElementById('goalCurrentSpan');
    const targetSpan = document.getElementById('goalTargetSpan');
    const currentUnit = document.getElementById('goalCurrentUnit');
    const targetUnit = document.getElementById('goalTargetUnit');
    if (currentEl) currentEl.value = goal.currentValue || 0;
    if (currentSpan) currentSpan.textContent = goal.currentValue || 0;
    if (targetSpan) targetSpan.textContent = goal.targetValue || 0;
    if (currentUnit) currentUnit.textContent = unit;
    if (targetUnit) targetUnit.textContent = unit;
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
    const newValue = document.getElementById('goalCurrentValue').value;
    if (!goalId) { alert('Ошибка: не выбрана цель'); return; }
    if (!newValue || isNaN(parseFloat(newValue))) { alert('Введите корректное значение'); return; }
    try {
        const getResponse = await fetch(`${API_BASE_URL}/api/goals/${goalId}`);
        if (!getResponse.ok) throw new Error('Ошибка загрузки цели');
        const goal = await getResponse.json();
        const previousValue = goal.currentValue;
        goal.currentValue = parseFloat(newValue);
        if (!goal.initialValue && previousValue > 0) goal.initialValue = previousValue;
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });
        if (response.ok) {
            const updatedGoal = await response.json();
            updateGoalProgressDisplay(updatedGoal);
            loadGoals();
            showTemporaryMessage('Прогресс обновлен!', 'success');
        } else {
            const error = await response.text();
            alert('Ошибка обновления: ' + error);
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

async function deleteGoal() {
    const user = getCurrentUser();
    if (!user) return;
    const modal = document.getElementById('goalDetailModal');
    const goalId = modal.dataset.goalId;
    if (!goalId) { alert('Ошибка: не выбрана цель'); return; }
    if (!confirm('Вы уверены, что хотите удалить эту цель?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
        if (response.ok) {
            modal.style.display = 'none';
            await loadGoals();
            showTemporaryMessage('Цель удалена', 'success');
        } else {
            const error = await response.text();
            alert('Ошибка удаления: ' + error);
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

function showTemporaryMessage(text, type) {
    const messageEl = document.getElementById('temporaryMessage');
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `temporary-message ${type}`;
    messageEl.style.display = 'block';
    setTimeout(() => messageEl.style.display = 'none', 3000);
}

// ======================= ФУНКЦИИ ДЛЯ РАБОТЫ С КЛУБАМИ =======================
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

// ======================= ИНИЦИАЛИЗАЦИЯ СТИЛЕЙ =======================
function applyAllStyles() {}

// ======================= ФУНКЦИИ ДЛЯ АДМИН-ПАНЕЛИ =======================
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

// ======================= Загрузка абонементов на главную =======================
function getAbonementsGroupKey(abonement) {
    const d = abonement.duration;
    if (d == null) return 'by-class';
    if (d <= 30) return 'by-class';
    if (d <= 150) return 'unlimited';
    return 'fitness';
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

async function loadAbonementsForHome() {
    const byClassEl = document.getElementById('abonements-grid-by-class');
    const unlimitedEl = document.getElementById('abonements-grid-unlimited');
    const fitnessEl = document.getElementById('abonements-grid-fitness');

    if (!byClassEl || !unlimitedEl || !fitnessEl) return;

    byClassEl.innerHTML = '<div class="price-card" style="padding:30px;">Загрузка...</div>';
    unlimitedEl.innerHTML = '';
    fitnessEl.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/abonements`);
        if (!response.ok) throw new Error('Ошибка загрузки абонементов');
        const abonements = await response.json();

        const groups = { 'by-class': [], 'unlimited': [], 'fitness': [] };
        if (Array.isArray(abonements)) {
            abonements.forEach(a => {
                const key = getAbonementsGroupKey(a);
                groups[key].push(a);
            });
        }

        byClassEl.innerHTML = groups['by-class'].length
            ? groups['by-class'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Абонементов пока нет</p>';

        unlimitedEl.innerHTML = groups['unlimited'].length
            ? groups['unlimited'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Абонементов пока нет</p>';

        fitnessEl.innerHTML = groups['fitness'].length
            ? groups['fitness'].map(renderAbonementCard).join('')
            : '<p class="empty-message">Абонементов пока нет</p>';

    } catch (e) {
        console.error(e);
        byClassEl.innerHTML = '<p class="error-message">Ошибка загрузки абонементов</p>';
        unlimitedEl.innerHTML = '';
        fitnessEl.innerHTML = '';
    }
}

// ======================= ОСНОВНОЙ ОБРАБОТЧИК СОБЫТИЙ =======================
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM загружен - инициализация...");
    
    applyAllStyles();
    updateUserUI();
    
    const user = getCurrentUser();

    // Подгружаем абонементы на главной
    if (window.location.pathname.includes('index.html')) {
        loadAbonementsForHome();
    }

    // На странице профиля
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
    
    // Кнопка выхода (только на странице профиля)
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
    
    // Табы для цен (на главной странице)
    const tabs = document.querySelectorAll(".tab-button");
    const cards = document.querySelectorAll(".price-card");
    const byClassGrid = document.getElementById('abonements-grid-by-class');
    const unlimitedGrid = document.getElementById('abonements-grid-unlimited');
    const fitnessGrid = document.getElementById('abonements-grid-fitness');

    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(btn => btn.classList.remove("active"));
                tab.classList.add("active");
                const target = tab.getAttribute("data-tab");

                cards.forEach(card => {
                    if (card.getAttribute("data-tab") === target) {
                        card.classList.remove("hidden");
                    } else {
                        card.classList.add("hidden");
                    }
                });

                if (byClassGrid) byClassGrid.style.display = target === 'by-class' ? '' : 'none';
                if (unlimitedGrid) unlimitedGrid.style.display = target === 'unlimited' ? '' : 'none';
                if (fitnessGrid) fitnessGrid.style.display = target === 'fitness' ? '' : 'none';
            });
        });
    }
    
    // Карусель акций (как была)
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
    
    // Анимация галереи
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
    
    // Lightbox для галереи клубов
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
    
    // Модальное окно целей
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
    
    // Выпадающее меню в шапке
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            this.parentNode.classList.toggle('active');
        });
    }
    
    // Плавная навигация по якорям
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
    
    // Переключение между логином и регистрацией (если есть на странице)
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
    
    // ФОРМА РЕГИСТРАЦИИ (исправлена: клуб не обязателен)
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
                alert("Пожалуйста, заполните все поля");
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
                    alert("Ошибка регистрации: " + (errorData.error || "Неизвестная ошибка"));
                    return;
                }
                // Автоматический вход
                const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: regEmail.value, password: regPassword.value })
                });
                if (loginResponse.ok) {
                    const userDto = await loginResponse.json();
                    localStorage.setItem('user', JSON.stringify(userDto));
                    alert("Регистрация и вход выполнены успешно!");
                    window.location.href = 'profile.html';
                } else {
                    alert("Регистрация успешна! Теперь войдите, используя свой email и пароль.");
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
                alert("Сервер недоступен");
            }
        });
    }
    
    // ФОРМА ВХОДА
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const loginEmail = document.getElementById('loginEmail');
            const loginPassword = document.getElementById('loginPassword');
            if (!loginEmail || !loginPassword) {
                alert("Пожалуйста, заполните все поля");
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
                    window.location.href = 'profile.html';
                } else {
                    alert("Ошибка входа: Неверный логин или пароль");
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
                alert("Сервер недоступен");
            }
        });
    }
    
    // Загрузка клубов по городу на странице регистрации (но только если есть город)
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
            // Если город не выбран, загружаем все клубы (без фильтрации)
            loadClubsByCity('');
        }
    }
    
    // Закрытие модальных окон по клику вне
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
    
    // Модальное окно деталей цели
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
    
    // Фильтр истекших абонементов
    addExpiredFilterButton();
});

// Экспорт в глобальную область
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
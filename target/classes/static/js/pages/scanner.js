// scanner page logic extracted from inline <script> in scanner.html

const API_BASE_URL = 'http://localhost:8080';

let html5QrCode = null;
let currentData = null;
let currentType = null;

function showCameraError() {
    document.getElementById('reader').innerHTML = `
        <div style="padding: 20px; text-align: center; color: #f44336;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
            <p>Не удалось получить доступ к камере.</p>
            <p style="font-size: 14px; color: #999;">Используйте ручной ввод кода</p>
        </div>
    `;
}

function startScanner() {
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;

    readerElement.innerHTML = '';

    try {
        html5QrCode = new Html5Qrcode("reader");

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                console.log('Найден QR-код:', decodedText);
                html5QrCode.stop();
                handleQrCode(decodedText);
            },
            () => {
                // игнорируем ошибки сканирования
            }
        ).catch((error) => {
            console.error('Ошибка запуска камеры:', error);
            showCameraError();
        });

    } catch (error) {
        console.error('Критическая ошибка:', error);
        showCameraError();
    }
}

function handleManualInput() {
    const input = document.getElementById('manualQrInput');
    if (!input) return;
    const value = input.value.trim();
    if (value) {
        handleQrCode(value);
    } else {
        alert('Введите QR-код');
    }
}

async function handleQrCode(qrData) {
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultContent').innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка данных...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/scan/${encodeURIComponent(qrData)}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const data = await response.json();
        currentData = data;
        currentType = data.type;

        if (data.type === 'USER') {
            displayUserResult(data);
        } else {
            displayAbonementResult(data);
        }

    } catch (error) {
        document.getElementById('resultContent').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>${error.message}</p>
            </div>
        `;
        document.getElementById('actionButtons').style.display = 'none';
    }
}

function displayUserResult(data) {
    document.getElementById('statusBadge').textContent = `Пользователь ID: ${data.user.id}`;
    document.getElementById('statusBadge').className = 'status-badge status-active';

    document.getElementById('actionButtons').style.display = 'none';

    let abonementsHtml = '';
    data.abonements.forEach(ab => {
        const status = ab.isActive ? '🟢 Активен' : '🔴 Истек';
        abonementsHtml += `
            <div class="info-card" style="margin-bottom: 15px;">
                <div class="info-row">
                    <span class="info-label">Абонемент:</span>
                    <span class="info-value">${ab.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Статус:</span>
                    <span class="info-value" style="color: ${ab.isActive ? '#4CAF50' : '#f44336'};">${status}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Дней осталось:</span>
                    <span class="info-value">${ab.daysLeft}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Действует до:</span>
                    <span class="info-value">${new Date(ab.endDate).toLocaleDateString('ru-RU')}</span>
                </div>
            </div>
        `;
    });

    document.getElementById('resultContent').innerHTML = `
        <div class="info-grid">
            <div class="info-card">
                <h3><i class="fas fa-user"></i> Пользователь</h3>
                <div class="info-row">
                    <span class="info-label">ID:</span>
                    <span class="info-value">${data.user.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Имя:</span>
                    <span class="info-value">${data.user.firstName} ${data.user.lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${data.user.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Клуб:</span>
                    <span class="info-value">${data.user.club || '—'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Всего абонементов:</span>
                    <span class="info-value">${data.totalAbonements}</span>
                </div>
            </div>
        </div>

        <h3 style="color: var(--primary-color); margin: 20px 0 15px;">📋 Абонементы пользователя</h3>
        ${abonementsHtml}
    `;
}

function displayAbonementResult(data) {
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = data.isActive ? 'Активен' : 'Истек';
    statusBadge.className = `status-badge ${data.isActive ? 'status-active' : 'status-expired'}`;

    document.getElementById('actionButtons').style.display = 'flex';

    document.getElementById('resultContent').innerHTML = `
        <div class="info-grid">
            <div class="info-card">
                <h3><i class="fas fa-user"></i> Пользователь</h3>
                <div class="info-row">
                    <span class="info-label">ID:</span>
                    <span class="info-value">${data.user.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Имя:</span>
                    <span class="info-value">${data.user.firstName} ${data.user.lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${data.user.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Клуб:</span>
                    <span class="info-value">${data.user.club || '—'}</span>
                </div>
            </div>

            <div class="info-card">
                <h3><i class="fas fa-ticket-alt"></i> Абонемент</h3>
                <div class="info-row">
                    <span class="info-label">ID:</span>
                    <span class="info-value">${data.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Название:</span>
                    <span class="info-value">${data.abonement.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Цена:</span>
                    <span class="info-value">${data.abonement.price} р.</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Куплен за:</span>
                    <span class="info-value">${data.priceAtPurchase} р.</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Длительность:</span>
                    <span class="info-value">${data.abonement.duration} дней</span>
                </div>
            </div>

            <div class="info-card">
                <h3><i class="fas fa-calendar"></i> Даты</h3>
                <div class="info-row">
                    <span class="info-label">Дата покупки:</span>
                    <span class="info-value">${new Date(data.purchaseDate).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Дата начала:</span>
                    <span class="info-value">${new Date(data.startDate).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Дата окончания:</span>
                    <span class="info-value">${new Date(data.endDate).toLocaleDateString('ru-RU')}</span>
                </div>
            </div>
        </div>

        <div class="days-left">
            ${data.daysLeft} <small>дней осталось</small>
        </div>
    `;
}

function editAbonement() {
    if (!currentData || currentData.type !== 'ABONEMENT') return;

    document.getElementById('editId').value = currentData.id;

    const startDate = new Date(currentData.startDate);
    const endDate = new Date(currentData.endDate);

    document.getElementById('editStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('editEndDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('editPrice').value = currentData.priceAtPurchase;

    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEdit() {
    const id = document.getElementById('editId').value;
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    const price = document.getElementById('editPrice').value;

    if (!startDate || !endDate || !price) {
        alert('Заполните все поля');
        return;
    }

    const updatedData = {
        ...currentData,
        startDate,
        endDate,
        priceAtPurchase: parseFloat(price)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/purchased-abonements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('✅ Абонемент успешно обновлен');
            closeEditModal();

            currentData = updatedData;
            displayAbonementResult(updatedData);
        } else {
            const error = await response.text();
            alert('❌ Ошибка обновления: ' + error);
        }
    } catch (error) {
        alert('❌ Ошибка сети: ' + error.message);
    }
}

async function deleteAbonement() {
    if (!currentData || currentData.type !== 'ABONEMENT') return;

    if (!confirm('Вы уверены, что хотите удалить этот абонемент?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/purchased-abonements/${currentData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('✅ Абонемент успешно удален');

            document.getElementById('resultSection').style.display = 'none';
            const manual = document.getElementById('manualQrInput');
            if (manual) manual.value = '';

            currentData = null;
            startScanner();
        } else {
            const error = await response.text();
            alert('❌ Ошибка удаления: ' + error);
        }
    } catch (error) {
        alert('❌ Ошибка сети: ' + error.message);
    }
}

function restartScanner() {
    document.getElementById('resultSection').style.display = 'none';
    const manual = document.getElementById('manualQrInput');
    if (manual) manual.value = '';
    currentData = null;

    const readerElement = document.getElementById('reader');
    if (readerElement) readerElement.innerHTML = '';

    startScanner();
}

// expose functions for inline onclick attributes that are still present
window.handleManualInput = handleManualInput;
window.editAbonement = editAbonement;
window.closeEditModal = closeEditModal;
window.saveEdit = saveEdit;
window.deleteAbonement = deleteAbonement;
window.restartScanner = restartScanner;

document.addEventListener('DOMContentLoaded', function () {
    startScanner();
});


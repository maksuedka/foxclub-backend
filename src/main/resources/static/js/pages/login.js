// login page logic extracted from inline <script> in login.html

const CITY_MAPPING = {
    "minsk": "Минск",
    "mogilev": "Могилев",
    "grodno": "Гродно"
};

function getCityFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    let cityParam = urlParams.get('city') ? decodeURIComponent(urlParams.get('city')).trim() : null;
    if (!cityParam) return null;

    const lower = cityParam.toLowerCase();
    return CITY_MAPPING[lower] || cityParam;
}

async function loadClubsByCity(city) {
    const regClubSelect = document.getElementById('regClub');
    if (!regClubSelect) return;

    try {
        regClubSelect.innerHTML = '<option value="" disabled selected>⏳ Загрузка клубов...</option>';

        const response = await fetch(`http://localhost:8080/api/clubs?city=${encodeURIComponent(city)}`);
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

        const clubs = await response.json();
        if (!Array.isArray(clubs) || clubs.length === 0) {
            regClubSelect.innerHTML = '<option value="" disabled>😕 Клубы не найдены</option>';
            return;
        }

        regClubSelect.innerHTML = '<option value="" disabled selected>🏋️‍♂️ Выберите клуб</option>';

        clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.id;

            let displayText = club.address;
            if (club.name && club.address && !club.address.includes(club.name)) {
                displayText = `${club.name} - ${club.address}`;
            }
            option.textContent = displayText;

            option.setAttribute('data-address', club.address || '');
            option.setAttribute('data-city', club.city || city);

            regClubSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Ошибка загрузки клубов:", error);
        regClubSelect.innerHTML = '<option value="" disabled>❌ Ошибка загрузки клубов</option>';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const regClubSelect = document.getElementById('regClub');
    if (!regClubSelect) return;

    const cityParam = getCityFromUrl();

    if (cityParam) {
        loadClubsByCity(cityParam);
    } else {
        regClubSelect.innerHTML = '<option value="" disabled selected>📍 Сначала выберите город на главной</option>';
    }

    regClubSelect.addEventListener('change', function () {
        if (this.value) {
            this.style.borderColor = '#4CAF50';
        } else {
            this.style.borderColor = '#e0e0e0';
        }
    });
});


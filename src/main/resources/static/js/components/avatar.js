// Avatar component logic
(function () {
    function getBaseUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }
        return `${window.location.protocol}//${window.location.hostname}`;
    }
    const BASE_URL = getBaseUrl();
    const API_USERS_URL = `${BASE_URL}/api/users`;
    const DEFAULT_AVATAR_URL = '/assets/images/default-avatar.png';

    function getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
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

    const user = getCurrentUser();
    if (!user) return;

    const avatarThumb = document.getElementById('profileAvatar');
    const modal = document.getElementById('avatarModal');
    const closeBtn = document.getElementById('closeAvatarModal');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    const saveBtn = document.getElementById('saveAvatarBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');
    const fileInput = document.getElementById('avatarFileInput');
    const previewBig = document.getElementById('avatarPreviewBig');
    const cropperContainer = document.getElementById('cropperContainer');
    const cropImage = document.getElementById('cropImage');
    const noImageMsg = document.getElementById('noImageMessage');
    const deleteBtn = document.getElementById('deleteAvatarBtn'); // кнопка в модалке

    let cropper = null;
    let currentFile = null;

    function setAvatarSrc(imgElement, url) {
        const src = url && url.trim() !== '' ? url : DEFAULT_AVATAR_URL;
        imgElement.src = src;
        imgElement.onerror = function() {
            this.src = DEFAULT_AVATAR_URL;
        };
    }

    if (!avatarThumb || !modal) return;

    setAvatarSrc(avatarThumb, user.avatarUrl);
    avatarThumb.addEventListener('click', () => openModal());

    function openModal() {
        modal.style.display = 'flex';
        if (previewBig) {
            setAvatarSrc(previewBig, user.avatarUrl);
            previewBig.style.display = 'block';
        }
        if (cropperContainer) cropperContainer.style.display = 'none';
        if (noImageMsg) noImageMsg.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelCropBtn) cancelCropBtn.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'inline-block';
        destroyCropper();
    }

    function closeModal() {
        modal.style.display = 'none';
        destroyCropper();
        if (previewBig) previewBig.style.display = 'block';
        if (cropperContainer) cropperContainer.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelCropBtn) cancelCropBtn.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'inline-block';
    }

    function destroyCropper() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        if (cropImage) cropImage.src = '';
        currentFile = null;
    }

    function enterCropMode(file) {
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewBig) previewBig.style.display = 'none';
            if (cropperContainer) cropperContainer.style.display = 'block';
            if (!cropImage) return;
            cropImage.src = e.target.result;
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 2,
                dragMode: 'move',
                cropBoxMovable: true,
                cropBoxResizable: true,
                background: false,
                autoCropArea: 0.9,
                minContainerWidth: 300,
                minContainerHeight: 300
            });
            if (uploadBtn) uploadBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'inline-block';
            if (cancelCropBtn) cancelCropBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }

    function cancelCrop() {
        destroyCropper();
        if (previewBig) previewBig.style.display = 'block';
        if (cropperContainer) cropperContainer.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelCropBtn) cancelCropBtn.style.display = 'none';
        currentFile = null;
    }

    async function saveAvatar() {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas({
            width: 500,
            height: 500,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        if (!canvas) {
            showTemporaryMessage('Не удалось обработать изображение', 'error');
            return;
        }
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (!blob) {
            showTemporaryMessage('Ошибка конвертации', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        try {
            const response = await fetch(`${API_USERS_URL}/${user.id}/avatar`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                showTemporaryMessage('Ошибка загрузки на сервер', 'error');
                return;
            }
            const data = await response.json();
            user.avatarUrl = data.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));
            setAvatarSrc(avatarThumb, data.avatarUrl);
            if (previewBig) setAvatarSrc(previewBig, data.avatarUrl);
            showTemporaryMessage('Аватар обновлён!', 'success');
            closeModal();
        } catch (err) {
            console.error(err);
            showTemporaryMessage('Сервер недоступен', 'error');
        }
    }

    // ===== УДАЛЕНИЕ АВАТАРА =====
    async function deleteAvatar() {
        const userNow = getCurrentUser();
        if (!userNow) return;
        if (!confirm('Вы уверены, что хотите удалить аватар?')) return;

        try {
            const response = await fetch(`${API_USERS_URL}/${userNow.id}/avatar`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const err = await response.text();
                showTemporaryMessage('Ошибка удаления: ' + err, 'error');
                return;
            }
            userNow.avatarUrl = null;
            localStorage.setItem('user', JSON.stringify(userNow));
            setAvatarSrc(avatarThumb, null);
            if (previewBig) setAvatarSrc(previewBig, null);
            showTemporaryMessage('Аватар удалён', 'success');
            if (modal.style.display === 'flex') closeModal();
        } catch (error) {
            showTemporaryMessage('Не удалось удалить аватар: ' + error.message, 'error');
        }
    }

    // Привязываем обработчики
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showTemporaryMessage('Только изображения', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showTemporaryMessage('Размер не более 5 МБ', 'error');
                return;
            }
            enterCropMode(file);
            fileInput.value = '';
        });
    }

    if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput && fileInput.click());
    if (saveBtn) saveBtn.addEventListener('click', saveAvatar);
    if (cancelCropBtn) cancelCropBtn.addEventListener('click', cancelCrop);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteAvatar);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
})();
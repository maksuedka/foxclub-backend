// Avatar component logic (extracted from inline script in profile.html)

(function () {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        return;
    }

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

    let cropper = null;
    let currentFile = null;

    if (!avatarThumb || !modal) return;

    avatarThumb.src = user.avatarUrl || '/assets/images/default-avatar.png';
    avatarThumb.addEventListener('click', () => openModal());

    function openModal() {
        modal.style.display = 'flex';

        if (previewBig) {
            previewBig.src = user.avatarUrl || '/assets/images/default-avatar.png';
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

            // Cropper global is expected from CDN script
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
            alert('Не удалось обработать изображение');
            return;
        }

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (!blob) {
            alert('Ошибка конвертации');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        try {
            const response = await fetch(`http://localhost:8080/api/users/${user.id}/avatar`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                alert('Ошибка загрузки на сервер');
                return;
            }

            const data = await response.json();
            user.avatarUrl = data.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));

            if (avatarThumb) avatarThumb.src = data.avatarUrl;
            if (previewBig) previewBig.src = data.avatarUrl;

            alert('Аватар обновлён!');
            closeModal();
        } catch (err) {
            console.error(err);
            alert('Сервер недоступен');
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('Только изображения');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер не более 5 МБ');
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

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
})();


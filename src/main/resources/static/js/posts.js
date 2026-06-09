// posts.js – полная логика постов, комментариев, карусели, лайтбокса и ленты
// Добавлена проверка авторизации для комментариев и красивые сообщения
// На ленте и главной странице скрыт статус "Одобрен / На модерации"
(function() {
    const API_POSTS_URL = "http://localhost:8080/api/posts";
    const API_COMMENTS_URL = "http://localhost:8080/api/comments";

    function getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // ========== ПРЕДПРОСМОТР ФОТО (для создания поста) ==========
    let selectedFiles = [];
    const fileInput = document.getElementById('postImages');
    const previewContainer = document.getElementById('imagePreviewContainer');

    function updatePreview() {
        if (!previewContainer) return;
        previewContainer.innerHTML = '';
        selectedFiles.forEach((file, idx) => {
            const reader = new FileReader();
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'preview-thumb';
            const img = document.createElement('img');
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                selectedFiles.splice(idx, 1);
                updatePreview();
                const dt = new DataTransfer();
                selectedFiles.forEach(f => dt.items.add(f));
                fileInput.files = dt.files;
            };
            thumbDiv.appendChild(img);
            thumbDiv.appendChild(removeBtn);
            reader.onload = (e) => { img.src = e.target.result; };
            reader.readAsDataURL(file);
            previewContainer.appendChild(thumbDiv);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (selectedFiles.length + files.length > 5) {
                alert('Можно загрузить не более 5 фото');
                return;
            }
            selectedFiles = [...selectedFiles, ...files];
            updatePreview();
            fileInput.value = '';
        });
    }

    // ========== КАРУСЕЛЬ В КАРТОЧКЕ ==========
    function setupCardCarousel(card, images) {
        if (!images || images.length <= 1) return;
        const imgContainer = card.querySelector('.post-image-container');
        if (!imgContainer) return;
        const imgElement = imgContainer.querySelector('.post-image');
        let currentIdx = 0;
        const oldPrev = imgContainer.querySelector('.prev');
        const oldNext = imgContainer.querySelector('.next');
        if (oldPrev) oldPrev.remove();
        if (oldNext) oldNext.remove();
        const prevBtn = document.createElement('button');
        prevBtn.className = 'post-image-nav prev';
        prevBtn.innerHTML = '‹';
        const nextBtn = document.createElement('button');
        nextBtn.className = 'post-image-nav next';
        nextBtn.innerHTML = '›';
        imgContainer.appendChild(prevBtn);
        imgContainer.appendChild(nextBtn);
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIdx = (currentIdx - 1 + images.length) % images.length;
            imgElement.src = images[currentIdx];
            card.dataset.carouselIndex = currentIdx;
        });
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIdx = (currentIdx + 1) % images.length;
            imgElement.src = images[currentIdx];
            card.dataset.carouselIndex = currentIdx;
        });
        const newContainer = imgContainer.cloneNode(true);
        imgContainer.parentNode.replaceChild(newContainer, imgContainer);
        const newImg = newContainer.querySelector('.post-image');
        const newPrev = newContainer.querySelector('.prev');
        const newNext = newContainer.querySelector('.next');
        newContainer.addEventListener('click', (e) => {
            if (e.target === newPrev || e.target === newNext) return;
            openLightbox(images, currentIdx);
        });
        if (newPrev) {
            newPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIdx = (currentIdx - 1 + images.length) % images.length;
                newImg.src = images[currentIdx];
            });
        }
        if (newNext) {
            newNext.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIdx = (currentIdx + 1) % images.length;
                newImg.src = images[currentIdx];
            });
        }
    }

    // ========== ЛАЙТБОКС ==========
    let currentLightboxImages = [];
    let currentLightboxIndex = 0;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const lightboxClose = document.querySelector('.lightbox-close');
    const indicatorsContainer = document.querySelector('.lightbox-indicators');

    function openLightbox(images, startIndex) {
        if (!images || images.length === 0) return;
        currentLightboxImages = images;
        currentLightboxIndex = startIndex;
        updateLightboxImage();
        lightbox.style.display = 'flex';
        renderIndicators();
    }

    function updateLightboxImage() {
        lightboxImg.src = currentLightboxImages[currentLightboxIndex];
        const dots = document.querySelectorAll('.indicator-dot');
        dots.forEach((dot, idx) => {
            if (idx === currentLightboxIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    function renderIndicators() {
        indicatorsContainer.innerHTML = '';
        currentLightboxImages.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'indicator-dot';
            if (idx === currentLightboxIndex) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentLightboxIndex = idx;
                updateLightboxImage();
            });
            indicatorsContainer.appendChild(dot);
        });
    }

    function nextImage() { if (currentLightboxImages.length) { currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length; updateLightboxImage(); } }
    function prevImage() { if (currentLightboxImages.length) { currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length; updateLightboxImage(); } }

    if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
    if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
    if (lightboxClose) lightboxClose.addEventListener('click', () => { lightbox.style.display = 'none'; });
    if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.style.display = 'none'; });

    // ========== ОБЩАЯ ФУНКЦИЯ ДЛЯ КАРТОЧКИ ==========
    // Параметр hideStatus: true — не показывать статус (для ленты и главной), false — показывать (для профиля)
    function createPostCard(post, showDelete = false, hideStatus = false) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.postId = post.id;

        const authorHtml = `<div class="post-author"><strong>${post.authorFirstName || ''} ${post.authorLastName || ''}</strong></div>`;
        const deleteBtn = showDelete ? `<button class="delete-post-btn" data-id="${post.id}" title="Удалить пост">🗑️</button>` : '';

        let imagesHtml = '';
        let imagesArray = post.images || [];
        if (imagesArray.length > 0) {
            imagesHtml = `<div class="post-image-container" data-images='${JSON.stringify(imagesArray)}'>
                            <img class="post-image" src="${imagesArray[0]}" alt="Фото">
                          </div>`;
        }

        let commentsHtml = '';
        const commentCount = post.commentCount || 0;
        const firstComment = post.comments && post.comments[0] ? post.comments[0] : null;
        if (commentCount === 0) {
            commentsHtml = `<div class="no-comments">Нет комментариев</div>`;
        } else {
            const commentText = firstComment.text.length > 80 ? firstComment.text.substring(0,80)+'...' : firstComment.text;
            commentsHtml = `<div class="comment-preview" data-post-id="${post.id}" data-comment-count="${commentCount}">
                                <strong>${firstComment.authorFirstName || 'Пользователь'} ${firstComment.authorLastName || ''}</strong>: ${commentText}
                            </div>
                            <div class="show-comments-link" data-post-id="${post.id}" data-comment-count="${commentCount}">Показать все комментарии (${commentCount})</div>`;
        }

        // Блок статуса (выводим только если hideStatus === false)
        let statusHtml = '';
        if (!hideStatus) {
            statusHtml = `<span class="post-status-badge ${post.status === 'APPROVED' ? 'approved' : 'moderation'}">${post.status === 'APPROVED' ? 'Одобрен' : 'На модерации'}</span>`;
        }

        card.innerHTML = `
            <div class="post-header" style="justify-content: space-between;">
                ${authorHtml} ${deleteBtn}
                ${statusHtml}
            </div>
            ${imagesHtml}
            <div class="post-text">${(post.text || '').replace(/\n/g,'<br>')}</div>
            ${commentsHtml}
        `;

        // Обработчики комментариев
        const commentPreview = card.querySelector('.comment-preview');
        if (commentPreview) commentPreview.addEventListener('click', () => openFullCommentsModal(post.id));
        const noCommentsDiv = card.querySelector('.no-comments');
        if (noCommentsDiv) noCommentsDiv.addEventListener('click', () => openFullCommentsModal(post.id));
        const showCommentsLink = card.querySelector('.show-comments-link');
        if (showCommentsLink) showCommentsLink.addEventListener('click', (e) => {
            e.stopPropagation();
            openFullCommentsModal(post.id);
        });

        // Карусель / лайтбокс
        if (imagesArray.length > 1) {
            setupCardCarousel(card, imagesArray);
        } else if (imagesArray.length === 1) {
            const imgContainer = card.querySelector('.post-image-container');
            if (imgContainer) imgContainer.addEventListener('click', () => openLightbox(imagesArray, 0));
        }

        return card;
    }

    // ========== ЗАГРУЗКА ПОСТОВ ПОЛЬЗОВАТЕЛЯ ==========
    let isLoadingPosts = false;
    async function loadMyPosts() {
        if (isLoadingPosts) return;
        isLoadingPosts = true;
        const user = getUser();
        if (!user) { isLoadingPosts = false; return; }
        const grid = document.getElementById('myPostsGrid');
        if (!grid) { isLoadingPosts = false; return; }
        grid.innerHTML = '<p class="loading-message">Загрузка постов...</p>';
        try {
            const res = await fetch(`${API_POSTS_URL}/user/${user.id}`);
            if (!res.ok) throw new Error('Ошибка загрузки');
            let posts = await res.json();
            for (let post of posts) {
                try {
                    const commentsRes = await fetch(`${API_COMMENTS_URL}/post/${post.id}`);
                    post.comments = commentsRes.ok ? await commentsRes.json() : [];
                } catch(e) { post.comments = []; }
                post.commentCount = post.comments.length;
            }
            if (!posts.length) { grid.innerHTML = '<p class="empty-message">У вас нет постов</p>'; return; }
            grid.innerHTML = '';
            posts.forEach(post => {
                // В профиле показываем статус (hideStatus = false)
                const card = createPostCard(post, true, false);
                const delBtn = card.querySelector('.delete-post-btn');
                if (delBtn) {
                    delBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('Удалить пост?')) {
                            try {
                                const res = await fetch(`${API_POSTS_URL}/${post.id}`, { method: 'DELETE' });
                                if (res.ok) { card.remove(); showMessage('Пост удалён', 'success'); }
                                else alert('Ошибка удаления');
                            } catch(e) { alert('Ошибка'); }
                        }
                    });
                }
                grid.appendChild(card);
            });
        } catch(e) {
            grid.innerHTML = '<p class="error-message">Ошибка загрузки постов</p>';
            console.error(e);
        } finally { isLoadingPosts = false; }
    }

    // ========== СОЗДАНИЕ ПОСТА ==========
    let isPosting = false;
    async function createPost() {
        if (isPosting) return;
        isPosting = true;
        const user = getUser();
        if (!user) {
            alert('Пожалуйста, авторизуйтесь, чтобы создавать посты');
            window.location.href = 'login.html';
            isPosting = false;
            return;
        }
        const textEl = document.getElementById('postText');
        const text = textEl ? textEl.value.trim() : '';
        if (!text && selectedFiles.length === 0) { alert('Введите текст или выберите фото'); isPosting = false; return; }
        const currentFiles = [...selectedFiles];
        const currentText = text;
        selectedFiles = [];
        if (textEl) textEl.value = '';
        updatePreview();
        if (fileInput) fileInput.value = '';

        const formData = new FormData();
        formData.append('text', currentText);
        formData.append('userId', String(user.id));
        currentFiles.slice(0, 5).forEach(f => formData.append('images', f, f.name));

        try {
            const res = await fetch(API_POSTS_URL, { method: 'POST', body: formData });
            if (!res.ok) throw new Error(await res.text());
            await loadMyPosts();
            showMessage('Пост отправлен на модерацию', 'success');
        } catch(e) { alert('Ошибка: ' + e.message); }
        finally { isPosting = false; }
    }

    function showMessage(msg, type) {
        const msgDiv = document.getElementById('temporaryMessage');
        if (msgDiv) {
            msgDiv.textContent = msg;
            msgDiv.className = `temporary-message ${type}`;
            msgDiv.style.display = 'block';
            setTimeout(() => msgDiv.style.display = 'none', 3000);
        } else alert(msg);
    }

    // ========== МОДАЛКА КОММЕНТАРИЕВ (с проверкой авторизации) ==========
    let currentFullPostId = null;
    async function openFullCommentsModal(postId) {
        const user = getUser();
        if (!user) {
            if (confirm('Чтобы читать и оставлять комментарии, необходимо войти. Перейти на страницу входа?')) {
                window.location.href = 'login.html';
            }
            return;
        }
        const modal = document.getElementById('commentsModal');
        if (!modal) return;
        currentFullPostId = postId;
        modal.style.display = 'flex';
        const list = document.getElementById('commentsList');
        const textarea = document.getElementById('commentText');
        if (textarea) textarea.value = '';
        list.innerHTML = '<p class="loading-message">Загрузка...</p>';
        try {
            const res = await fetch(`${API_COMMENTS_URL}/post/${postId}`);
            const comments = await res.json();
            list.innerHTML = '';
            if (!comments.length) { list.innerHTML = '<p class="empty-message">Нет комментариев</p>'; return; }
            comments.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment-item';
                div.innerHTML = `
                    <div class="comment-author"><strong>${c.authorFirstName || 'Пользователь'} ${c.authorLastName || ''}</strong></div>
                    <div class="comment-text">${(c.text || '').replace(/\n/g,'<br>')}</div>
                    <div class="comment-created">${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                `;
                list.appendChild(div);
            });
        } catch(e) { list.innerHTML = '<p class="error-message">Ошибка загрузки</p>'; }
    }

    async function sendCommentFromModal() {
        const user = getUser();
        if (!user) {
            alert('Пожалуйста, авторизуйтесь, чтобы оставлять комментарии');
            window.location.href = 'login.html';
            return;
        }
        const textarea = document.getElementById('commentText');
        const text = textarea ? textarea.value.trim() : '';
        if (!text) { alert('Введите комментарий'); return; }
        if (!currentFullPostId) return;
        try {
            await fetch(API_COMMENTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, postId: currentFullPostId, text })
            });
            await openFullCommentsModal(currentFullPostId);
            textarea.value = '';
            if (window.location.pathname.includes('profile.html')) await loadMyPosts();
            if (window.location.pathname.includes('post-feed.html')) await loadFeed(currentPage);
        } catch(e) { alert('Ошибка отправки'); }
    }

    // ========== НОМЕРНАЯ ПАГИНАЦИЯ ДЛЯ ЛЕНТЫ ==========
    let currentPage = 0;
    let totalPages = 1;
    const pageSize = 6;

    async function loadFeed(page = 0) {
        const grid = document.getElementById('feedPosts');
        const paginationContainer = document.getElementById('feedPagination');
        if (!grid) return;

        grid.innerHTML = '<p class="loading-message">Загрузка постов...</p>';
        try {
            const res = await fetch(`${API_POSTS_URL}/feed?page=${page}&size=${pageSize}`);
            if (!res.ok) throw new Error('Ошибка загрузки');
            const data = await res.json();
            const posts = data.content || data;
            totalPages = data.totalPages || 1;
            currentPage = page;

            grid.innerHTML = '';
            if (!posts.length && page === 0) {
                grid.innerHTML = '<p class="empty-message">Постов пока нет</p>';
                if (paginationContainer) paginationContainer.style.display = 'none';
                return;
            }

            for (let post of posts) {
                try {
                    const commentsRes = await fetch(`${API_COMMENTS_URL}/post/${post.id}`);
                    post.comments = commentsRes.ok ? await commentsRes.json() : [];
                } catch(e) { post.comments = []; }
                post.commentCount = post.comments.length;
                // В ленте скрываем статус (hideStatus = true)
                const card = createPostCard(post, false, true);
                grid.appendChild(card);
            }

            renderPaginationControls(paginationContainer);
        } catch(e) {
            console.error(e);
            grid.innerHTML = '<p class="error-message">Ошибка загрузки ленты</p>';
        }
    }

    function renderPaginationControls(container) {
        if (!container) return;
        if (totalPages <= 1) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        container.innerHTML = '';

        const pagesDiv = document.createElement('div');
        pagesDiv.className = 'pagination-controls';
        pagesDiv.style.cssText = 'display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 20px;';

        if (currentPage > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '← Назад';
            prevBtn.className = 'btn-pagination';
            prevBtn.style.cssText = 'background: #ff8c00; border: none; padding: 8px 16px; border-radius: 30px; color: white; cursor: pointer;';
            prevBtn.addEventListener('click', () => loadFeed(currentPage - 1));
            pagesDiv.appendChild(prevBtn);
        }

        for (let i = 0; i < totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i + 1;
            pageBtn.className = 'btn-page';
            pageBtn.style.cssText = `background: ${i === currentPage ? '#ff8c00' : '#333'}; border: none; padding: 8px 16px; border-radius: 30px; color: white; cursor: pointer; margin: 0 5px;`;
            pageBtn.addEventListener('click', () => loadFeed(i));
            pagesDiv.appendChild(pageBtn);
        }

        if (currentPage + 1 < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Вперёд →';
            nextBtn.className = 'btn-pagination';
            nextBtn.style.cssText = 'background: #ff8c00; border: none; padding: 8px 16px; border-radius: 30px; color: white; cursor: pointer;';
            nextBtn.addEventListener('click', () => loadFeed(currentPage + 1));
            pagesDiv.appendChild(nextBtn);
        }

        container.appendChild(pagesDiv);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('myPostsGrid')) {
            loadMyPosts();
            const createBtn = document.getElementById('createPostBtn');
            if (createBtn) createBtn.addEventListener('click', (e) => { e.preventDefault(); createPost(); });
            const label = document.querySelector('.post-images-label');
            if (label && fileInput) label.addEventListener('click', (e) => { e.preventDefault(); fileInput.click(); });
        }
        if (document.getElementById('feedPosts')) {
            loadFeed(0);
        }
        const closeComments = document.getElementById('closeCommentsModal');
        if (closeComments) closeComments.addEventListener('click', () => {
            document.getElementById('commentsModal').style.display = 'none';
        });
        const sendBtn = document.getElementById('sendCommentBtn');
        if (sendBtn) sendBtn.addEventListener('click', sendCommentFromModal);
    });

    window.loadMyPosts = loadMyPosts;
    window.createPost = createPost;
    window.loadFeed = loadFeed;
    window.openFullCommentsModal = openFullCommentsModal;
    window.sendCommentFromModal = sendCommentFromModal;

    // ========== СЛУЧАЙНЫЕ ПОСТЫ ДЛЯ ГЛАВНОЙ (без статуса и без лишней кнопки) ==========
    function pickRandomItems(arr, count) {
        const copy = Array.isArray(arr) ? [...arr] : [];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, count);
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function createHomePostCard(post) {
        const images = post.images || [];
        const firstImg = images && images.length ? images[0] : '';
        const authorName = `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim() || 'Пользователь';
        const text = (post.text || '').replace(/\n/g, ' ');
        const commentCount = post.commentCount || 0;

        const card = document.createElement('div');
        card.className = 'home-post-card';
        card.dataset.postId = post.id;
        // Без статуса, без кнопки "Открыть ленту"
        card.innerHTML = `
            <div class="home-post-image">
                ${firstImg ? `<img src="${firstImg}" alt="Фото">` : `<div style="width:100%;height:100%;background:#2a2a2a;"></div>`}
                <div class="home-post-overlay"></div>
            </div>
            <div class="home-post-body">
                <div class="home-post-author">${escapeHtml(authorName)}</div>
                <div class="home-post-text">${escapeHtml(text)}</div>
            </div>
            <div class="home-post-footer">
                <div class="home-post-comments">${commentCount} коммент.</div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = 'post-feed.html';
        });

        return card;
    }

    async function loadRandomHomePosts({ count = 3, gridEl, loaderEl, emptyEl } = {}) {
        if (!gridEl) return;
        const pageSize = Math.max(12, count * 4);
        if (loaderEl) loaderEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        gridEl.innerHTML = '';
        gridEl.style.display = 'none';

        try {
            const randomPool = [];
            const pagesToFetch = 2;

            for (let p = 0; p < pagesToFetch; p++) {
                const res = await fetch(`${API_POSTS_URL}/feed?page=${p}&size=${pageSize}`);
                if (!res.ok) throw new Error('Ошибка загрузки ленты');
                const data = await res.json();
                const posts = data.content || data;
                randomPool.push(...posts);
                if (randomPool.length >= count * 5) break;
            }

            if (!randomPool.length) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            const picked = pickRandomItems(randomPool, count);
            const withComments = [];

            for (const post of picked) {
                const p = post;
                try {
                    const commentsRes = await fetch(`${API_COMMENTS_URL}/post/${p.id}`);
                    p.comments = commentsRes.ok ? await commentsRes.json() : [];
                    p.commentCount = p.comments.length;
                } catch (e) {
                    p.commentCount = 0;
                }
                withComments.push(p);
            }

            if (!withComments.length) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            withComments.forEach(post => {
                gridEl.appendChild(createHomePostCard(post));
            });

            gridEl.style.display = 'grid';
        } catch (e) {
            console.error(e);
            if (emptyEl) {
                emptyEl.style.display = 'block';
                emptyEl.textContent = 'Не удалось загрузить посты';
            }
        } finally {
            if (loaderEl) loaderEl.style.display = 'none';
        }
    }

    window.loadRandomHomePosts = loadRandomHomePosts;
})();
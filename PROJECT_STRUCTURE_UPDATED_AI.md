# Fox Club — структура проекта (актуальная для ИИ)

Файл предназначен для того, чтобы ИИ быстро понял:
- как устроен проект,
- где лежит фронтенд,
- какие REST API эндпоинты используются,
- какие ключевые “фичи” уже реализованы на текущем состоянии.

---

## 1) Технологии

**Backend**
- Spring Boot (Java)
- REST API
- JPA/Hibernate
- DTO + mapper

**Frontend (статический)**
- HTML/CSS/JS отдается из `src/main/resources/static/`
- фронт напрямую дергает REST API и хранит текущего пользователя в `localStorage.user`.

---

## 2) Общая архитектура (как читать проект)

### 2.1 Backend
- `src/main/java/by/foxclub/entity/` — сущности (Post, Comment, Goal, ...)
- `src/main/java/by/foxclub/repository/` — репозитории
- `src/main/java/by/foxclub/dto/` — DTO
- `src/main/java/by/foxclub/mapper/` — мапперы
- `src/main/java/by/foxclub/controller/` — REST контроллеры
- `src/main/java/by/foxclub/service/` — бизнес-логика и интеграции
- `src/main/java/by/foxclub/config/` — конфигурации (Security, CORS)

### 2.2 Frontend
- `src/main/resources/static/*.html` — страницы
- `src/main/resources/static/css/*.css` — стили (включая `responsive.css`)
- `src/main/resources/static/js/*.js` — логика страниц
- `src/main/resources/static/js/components/*.js` — компоненты (например, `avatar.js`)

---

## 3) Ключевые страницы фронтенда

- `static/index.html` — главная:
  - секция **Посты** (`home-posts-section`)
  - секция **Акции** (бесконечная карусель)
  - загрузка постов делается через `window.loadRandomHomePosts(...)`
  - загрузка промо через `window.loadPromotions()`

- `static/post-feed.html` — страница ленты постов
  - подгрузка страниц ленты: `GET /api/posts/feed?page=&size=`

- `static/profile.html` — личный кабинет
  - показываются абонементы и цели
  - QR-код пользователя
  - также в профиле используется `loadMyPosts()` (из `posts.js`)

- `static/admin-panel.html` — админка
  - модерация постов (смена статуса)

- `static/scanner.html` — QR-сканер

---

## 4) localStorage и “текущий пользователь”

Фронт хранит данные пользователя локально:
- `localStorage.getItem('user')` ожидает JSON.

Многие запросы используют `user.id` из localStorage.

---

## 5) REST API: основные используемые эндпоинты

### Авторизация
- `POST /api/auth/register`
- `POST /api/auth/login`

### Посты
- `POST /api/posts` — создание поста (multipart: `text`, `images`, `userId`)
- `GET /api/posts/user/{userId}` — мои посты
- `GET /api/posts/feed?page=&size=` — лента (только `APPROVED` на backend)
- `DELETE /api/posts/{id}` — удаление поста (в профиле)

### Изображения постов
- управляются на стороне backend (связанные сущности `PostImage`)

### Комментарии
- `POST /api/comments` — создание комментария (`userId`, `postId`, `text`)
- `GET /api/comments/post/{postId}` — список комментариев

### Цели
- `GET/POST/PUT/DELETE /api/goals` (и дополнительно используемый в фронте эндпоинт `POST /api/goals/validate`)

### Абонементы
- `GET /api/abonements` — справочник абонементов
- `GET /api/purchased-abonements/user/{userId}` — купленные абонементы пользователя

### Клубы
- `GET /api/clubs?city=...` — список клубов по городу

### Админ: модерация постов
- `GET /api/admin/posts`
- `PUT /api/admin/posts/{id}/moderate`

---

## 6) Важные изменения фронтенда (уже реализовано)

### 6.1 Лента постов на главной (Random Home Posts)

Файл: `static/js/posts.js`
- реализована функция:
  - `window.loadRandomHomePosts({ count, gridEl, loaderEl, emptyEl })`

Логика:
- подкачиваются посты с ленты: `GET /api/posts/feed` (несколько страниц)
- выбираются случайные `count`
- для каждого поста дополнительно грузятся комментарии:
  - `GET /api/comments/post/{postId}`
- на карточке главной:
  - **нет** бейджа статуса
  - **нет** кнопки “Открыть ленту”
  - клик по карточке ведет на `post-feed.html`

Файл: `static/index.html`
- на странице есть контейнер:
  - `#homePostsGrid`
  - `#homePostsLoader`
  - `#homePostsEmpty`
- вызывается inline-скрипт:
  - `window.loadRandomHomePosts({ count: 3, ... })`

### 6.2 Акции: бесконечная карусель

- Файл: `static/index.html` — разметка карусели (`promotionsCarouselTrack`)
- Фронт дергает `window.loadPromotions()` (вызов из `main.js` и/или inline скрипта)

### 6.3 Управление профилем и QR

Файл: `static/js/components/avatar.js`
- компонент смены аватара:
  - cropper на клиенте
  - загрузка на backend
  - обновление `localStorage.user` после успешной загрузки

Файл: `static/js/main.js`
- реализована функция `showUserQrCode()`
- бургер-меню на mobile содержит “Мой QR”, вызывает `window.showUserQrCode()`

### 6.4 Goals (Цели) + валидация через ИИ

Файл: `static/js/main.js`
- формы целей генерируются динамически в модалке
- добавлена валидация:
  - `POST /api/goals/validate`
- в интерфейсе отображаются рекомендации и кнопка “скорректировать”
- история целей рисуется через Chart.js на `#goalHistoryChart`

---

## 7) Адаптивность

Файл: `src/main/resources/static/css/responsive.css`
- содержит media queries для:
  - меню
  - модальных окон
  - admin-panel
  - lightbox/карусели
  - секций клубов
  - сканера
  - табов и т.д.

Файл: `src/main/resources/static/css/main.css`
- импортирует `responsive.css`

---

## 8) Текущий список файлов фронтенда (для ИИ)

### JS
- `static/js/main.js` — общий код (меню, профиль, goals, абонементы, промо и др.)
- `static/js/posts.js` — посты, комментарии, лента, lightbox, random posts
- `static/js/pages/*.js` — страничная логика (admin/login/scanner)
- `static/js/components/avatar.js` — смена/удаление аватара

### CSS
- `static/css/main.css`
- `static/css/responsive.css`
- `static/css/components/*.css`

### HTML
- `static/*.html` — отдельные страницы (index, профиль, клубы, посты, сканер, админ)

---

## 9) Полная структура репозитория (актуальная основа)

Ниже оставлена базовая структура из `PROJECT_STRUCTURE.md` + важно: не включает все ресурсы `static/assets/*`.

(Если нужно, позже можно расширить файл до полного tree включая `assets/images/...`.)

```text
.
├─ .gitignore
├─ pom.xml
├─ PROJECT_STRUCTURE.md
├─ TODO.md
├─ TODO_POSTS_FILES.md
├─ target/
└─ src/
   ├─ main/
   │  ├─ java/
   │  │  └─ by/
   │  │     └─ foxclub/
   │  │        ├─ FoxclubApplication.java
   │  │        ├─ config/
   │  │        ├─ controller/
   │  │        ├─ dto/
   │  │        ├─ entity/
   │  │        ├─ mapper/
   │  │        └─ repository/
   │  └─ resources/
   │     └─ static/
   │        ├─ index.html
   │        ├─ post-feed.html
   │        ├─ profile.html
   │        ├─ admin-panel.html
   │        ├─ scanner.html
   │        ├─ css/
   │        └─ js/
   └─ test/
      └─ java/
```

---

## 10) Что ИИ должен помнить при работе с проектом

- Всегда сверяй фронтовые вызовы с реальными IDs/контейнерами на странице (много кода завязано на `getElementById`).
- Основной “источник правды” по API — контроллеры в `controller/`.
- Если нужен полный контекст по UI — смотреть связку:
  - HTML (контейнеры/modals)
  - JS (инициализация на `DOMContentLoaded`)
  - CSS (подсказки по классам)

---

## 11) Точки расширения (для дальнейшего улучшения файла)

Этот файл можно дополнить:
- точным перечнем страниц + какие скрипты подключают на каждой странице;
- полным list деревом `src/main/resources/static/assets`;
- краткими заметками по самым важным backend DTO/Entity.


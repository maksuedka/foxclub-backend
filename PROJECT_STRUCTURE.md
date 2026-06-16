# Структура проекта `foxclub-backend`

Ниже — описание функций всего проекта (что делает система и какие сценарии закрывает), затем — полная структура репозитория (актуальная по текущему состоянию).

## Функции проекта (логика приложения)

### 1) Общая концепция
Проект — это Spring Boot backend (REST API) + статический фронтенд (HTML/CSS/JS), который лежит в `src/main/resources/static/`.
Пользователь получает доступ к:
- профилю (личный кабинет)
- созданию постов (текст + до 5 изображений)
- просмотру ленты постов
- просмотру и отправке комментариев к постам
- абонементам (пакеты/покупки)
- QR-сканированию (для привязанных сценариев)

Админ модерирует контент: переводит статус постов из `MODERATION` в `APPROVED`.

### 2) Авторизация и учетные данные
**Ключевая функция:** регистрация и вход.
- `POST /api/auth/register` — регистрация пользователя
- `POST /api/auth/login` — логин

На клиенте учетные данные/текущий пользователь хранятся локально (используется `localStorage.user`), чтобы фронт мог отправлять `userId` в запросах.

### 3) Клубы и справочники
**Ключевая функция:** показывать страницы клубов и справочные данные.
- Сущность `Club` (клуб/филиал)
- Фильтрация по параметрам, в т.ч. по городу

### 4) Цели (Goals)
**Ключевая функция:** хранение и управление целями.
- `GET/POST/PUT/DELETE /api/goals`

### 5) Абонементы (Abonements) и покупки
**Ключевая функция:** управление пакетами и учет купленных абонементов пользователя.
- `GET/POST/PUT/DELETE /api/abonements`
- `GET/POST/PUT ... /api/purchased-abonements` — история покупок и выборки по пользователю

### 6) Личный кабинет (профиль пользователя)
**Ключевая функция:** пользователь видит свои данные и свой контент.
- Страница `profile.html` (в структуре лежит в static) — это UI личного кабинета.
- В рамках лк пользователь может:
  - создавать посты (через отправку на backend)
  - просматривать свои посты
  - просматривать свои абонементы
  - просматривать и управлять целями

### 7) Посты: создание, просмотр своих, просмотр ленты
Контентные сущности:
- `Post` — текст, статус, время создания, ссылки на изображения и комментарии
- `PostImage` — изображения поста
- `PostStatus` — enum статуса поста (`MODERATION`, `APPROVED`)

**Создание поста (пользователем):**
- Backend: `POST /api/posts` (multipart: `text` + `images`, `userId`)
- Логика:
  - формируется `Post` со статусом `MODERATION`
  - изображения ограничиваются максимум 5
  - изображения загружаются во внешнее хранилище через `ImageKitService`

**Просмотр своих постов:**
- `GET /api/posts/user/{userId}`
- Возвращаются посты в статусах: `MODERATION` и `APPROVED`

**Просмотр ленты постов:**
- `GET /api/posts/feed?page=&size=`
- Возвращаются только `APPROVED`
- Фронт реализует пагинацию

### 8) Комментарии к постам
**Ключевая функция:** добавление и просмотр комментариев.
- `POST /api/comments`
  - body: `userId`, `postId`, `text`
  - создается сущность `Comment`
- `GET /api/comments/post/{postId}`
  - фронт отображает комментарии (отсортировано по `createdAt`)

### 9) Модерация постов (админ)
**Ключевая функция:** админ управляет статусами постов.
- `GET /api/admin/posts` — список всех постов для модерации
- `PUT /api/admin/posts/{id}/moderate` — изменение статуса

После перевода в `APPROVED` пост начинает отображаться в общей ленте.

### 10) QR-сканирование
**Ключевая функция:** обработка QR-данных.
- `GET/POST /api/scan/...` (реализация в `ScanController`)

---

## Актуальные изменения UI/фронтенда (важное для ИИ)

### Лента постов на главной
- `src/main/resources/static/index.html`
  - секция `home-posts-section` присутствует на странице.
  - карточки кликабельны и ведут на `post-feed.html`.
- `src/main/resources/static/js/posts.js`
  - реализована функция `loadRandomHomePosts({ count, gridEl, loaderEl, emptyEl })`
  - карточки на главной создаются без бейджа статуса и без кнопки “Открыть ленту”.
  - для выбранных постов подгружаются комментарии и показывается счетчик.
  - базовый URL определяется автоматически (локально/на хостинге).
- `src/main/resources/static/js/main.js`
  - на главной дополнительно загружаются абонементы (`loadAbonementsForHome`).

---

Ниже — полная структура (по фактическим файлам в репозитории).

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
   │  │        │  (точка входа Spring Boot)
   │  │        ├─ config/
   │  │        │  ├─ SecurityConfig.java
   │  │        │  │  (конфигурация безопасности)
   │  │        │  └─ WebConfig.java
   │  │        │     (CORS-конфигурация через WebMvcConfigurer)
   │  │        ├─ controller/
   │  │        │  ├─ AbonementController.java
   │  │        │  ├─ AdminController.java
   │  │        │  ├─ AdminPostsController.java
   │  │        │  ├─ AuthController.java
   │  │        │  ├─ ClubController.java
   │  │        │  ├─ DashboardController.java
   │  │        │  ├─ GoalController.java
   │  │        │  ├─ HomeController.java
   │  │        │  ├─ PostsController.java
   │  │        │  ├─ PurchasedAbonementController.java
   │  │        │  ├─ ScanController.java
   │  │        │  └─ UserController.java
   │  │        ├─ dto/
   │  │        │  ├─ AbonementDto.java
   │  │        │  ├─ AdminDto.java
   │  │        │  ├─ ClubDto.java
   │  │        │  ├─ CommentCreateRequest.java
   │  │        │  ├─ CommentResponse.java
   │  │        │  ├─ GoalDto.java
   │  │        │  ├─ LoginRequest.java
   │  │        │  ├─ PostCreateRequest.java
   │  │        │  ├─ PostResponse.java
   │  │        │  ├─ PurchasedAbonementDto.java
   │  │        │  ├─ RegisterRequest.java
   │  │        │  └─ UserDto.java
   │  │        ├─ entity/
   │  │        │  ├─ Abonement.java
   │  │        │  ├─ Admin.java
   │  │        │  ├─ Club.java
   │  │        │  ├─ Comment.java
   │  │        │  ├─ Goal.java
   │  │        │  ├─ Post.java
   │  │        │  ├─ PostImage.java
   │  │        │  ├─ PostStatus.java
   │  │        │  ├─ PurchasedAbonement.java
   │  │        │  └─ User.java
   │  │        ├─ mapper/
   │  │        │  ├─ AbonementMapper.java
   │  │        │  ├─ AdminMapper.java
   │  │        │  ├─ ClubMapper.java
   │  │        │  ├─ GoalMapper.java
   │  │        │  ├─ PurchasedAbonementMapper.java
   │  │        │  └─ UserMapper.java
   │  │        └─ repository/
   │  │           ├─ AbonementRepository.java
   │  │           ├─ AdminRepository.java
   │  │           ├─ ClubRepository.java
   │  │           ├─ CommentRepository.java
   │  │           ├─ GoalRepository.java
   │  │           ├─ PostImageRepository.java
   │  │           ├─ PostRepository.java
   │  │           ├─ PurchasedAbonementRepository.java
   │  │           └─ UserRepository.java
   │  └─ resources/
   │     ├─ application-local.properties
   │     ├─ application.properties
   │     └─ static/
   │        ├─ admin-panel.html
   │        ├─ dolgobrodskaya-club.html
   │        ├─ grushevskaya-club.html
   │        ├─ index.html
   │        ├─ kazinca-club.html
   │        ├─ kupali-club.html
   │        ├─ login.html
   │        ├─ minsk.html
   │        ├─ mogilev.html
   │        ├─ post-feed.html
   │        ├─ profile.html
   │        ├─ scanner.html
   │        ├─ shmidta-club.html
   │        ├─ css/
   │        │  ├─ main.css
   │        │  ├─ responsive.css
   │        │  ├─ base/
   │        │  ├─ components/
   │        │  ├─ layout/
   │        │  └─ pages/
   │        └─ js/
   │           ├─ main.js
   │           └─ posts.js
   │
   └─ test/
      └─ java/
```

## Что важно из архитектуры

- Backend — Spring Boot (Java 17) + REST API.
- Данные хранятся через JPA/Hibernate (entities в `entity/`, репозитории в `repository/`).
- DTO отделяет API-контракты от сущностей (`dto/`).
- MapStruct используется для маппинга сущностей <-> DTO (`mapper/`).
- Статический фронтенд лежит в `src/main/resources/static/` (HTML, CSS, JS, изображения). Spring будет отдавать эти файлы напрямую.

> Примечание: папка `target/` обычно генерируется сборкой Maven и может меняться между запусками.


# Структура проекта `foxclub-backend`

Ниже — описание функций всего проекта (что делает система и какие сценарии закрывает), затем — полная структура репозитория.

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
- Фильтрация по параметрам, в т.ч. по городу.

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
  - просматривать свои посты (обычно в режимах `MODERATION` и `APPROVED`, в зависимости от логики)

### 7) Посты: создание, просмотр своих, просмотр ленты
Контентные сущности:
- `Post` — текст, статус, время создания, ссылки на изображения и комментарии
- `PostImage` — изображения поста
- `PostStatus` — enum статуса поста (`MODERATION`, `APPROVED`)

**Создание поста (пользователем):**
- Backend: `POST /api/posts` (multipart: `text` + `images`, `userId`)
- Логика:
  - формируется `Post` со статусом `MODERATION`
  - изображения ограничиваются максимум 5 (лишние отсекаются)
  - изображения загружаются во внешнее хранилище через `ImageKitService`

**Просмотр своих постов:**
- `GET /api/posts/user/{userId}`
- Возвращаются посты в статусах: `MODERATION` и `APPROVED`.

**Просмотр ленты постов:**
- `GET /api/posts/feed?page=&size=`
- Возвращаются только `APPROVED`.
- Фронт реализует пагинацию.

### 8) Комментарии к постам
**Ключевая функция:** добавление и просмотр комментариев.
- `POST /api/comments`
  - body: `userId`, `postId`, `text`
  - создается сущность `Comment`
- `GET /api/comments/post/{postId}`
  - фронт отображает комментарии отсортированные по времени (asc по `createdAt`)

### 9) Модерация постов (админ)
**Ключевая функция:** админ управляет статусами постов.
- `GET /api/admin/posts` — список всех постов для модерации
- `PUT /api/admin/posts/{id}/moderate` — изменение статуса
  - принимает `status` строкой, переводит `Post.status` в соответствующий `PostStatus`

После перевода в `APPROVED` пост начинает отображаться в общей ленте.

### 10) QR-сканирование
**Ключевая функция:** обработка QR-данных.
- `GET/POST /api/scan/...` (реализация в `ScanController`)

---

Ниже — полная (на основании текущего содержимого репозитория) структура проекта и назначение основных частей.


```text
.
├─ .gitignore
├─ pom.xml
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
   │  │        │  │  (CRUD для абонементов: `/api/abonements`)
   │  │        │  ├─ AdminController.java
   │  │        │  │  (CRUD для админов: `/api/admins`)
   │  │        │  ├─ AuthController.java
   │  │        │  │  (регистрация/логин: `/api/auth/register`, `/api/auth/login`)
   │  │        │  ├─ ClubController.java
   │  │        │  │  (CRUD для клубов + фильтр по городу: `/api/clubs`)
   │  │        │  ├─ DashboardController.java
   │  │        │  │  (данные/таблицы для админ-панели: `/api/dashboard/...`)
   │  │        │  ├─ GoalController.java
   │  │        │  │  (CRUD для целей: `/api/goals`)
   │  │        │  ├─ PostsController.java
   │  │        │  │  (посты/лента/комментарии: `/api/posts`, `/api/posts/feed`, `/api/comments`)
   │  │        │  ├─ AdminPostsController.java
   │  │        │  │  (модерация постов: `PUT /api/admin/posts/{id}/moderate`)
   │  │        │  ├─ PurchasedAbonementController.java
   │  │        │  │  (CRUD/выборки купленных абонементов: `/api/purchased-abonements`)
   │  │        │  ├─ ScanController.java
   │  │        │  │  (обработка QR: `/api/scan/{qrData}`)
   │  │        │  └─ UserController.java
   │  │        │     (профиль пользователя и эндпоинты, связанные с постами/абонементами)
   │  │        ├─ dto/
   │  │        │  ├─ AbonementDto.java
   │  │        │  ├─ AdminDto.java
   │  │        │  ├─ ClubDto.java
   │  │        │  ├─ GoalDto.java
   │  │        │  ├─ LoginRequest.java
   │  │        │  ├─ PurchasedAbonementDto.java
   │  │        │  ├─ PostResponse.java
   │  │        │  ├─ CommentCreateRequest.java
   │  │        │  └─ CommentResponse.java
   │  │        └─ entity/
   │  │           ├─ Abonement.java
   │  │           ├─ Admin.java
   │  │           ├─ Club.java
   │  │           ├─ Goal.java
   │  │           ├─ Post.java
   │  │           ├─ PostImage.java
   │  │           ├─ PostStatus.java
   │  │           ├─ Comment.java
   │  │           ├─ PurchasedAbonement.java
   │  │           └─ User.java
   │  │        ├─ mapper/
   │  │        │  ├─ AbonementMapper.java
   │  │        │  ├─ AdminMapper.java
   │  │        │  ├─ ClubMapper.java
   │  │        │  ├─ GoalMapper.java
   │  │        │  ├─ PurchasedAbonementMapper.java
   │  │        │  ├─ UserMapper.java
   │  │        │  └─ (мапперы постов/комментариев — если используются)
   │  │        └─ repository/
   │  │           ├─ AbonementRepository.java
   │  │           ├─ AdminRepository.java
   │  │           ├─ ClubRepository.java
   │  │           ├─ GoalRepository.java
   │  │           ├─ PostRepository.java
   │  │           ├─ PostImageRepository.java
   │  │           ├─ CommentRepository.java
   │  │           ├─ PurchasedAbonementRepository.java
   │  │           └─ UserRepository.java
   │  └─ resources/
   │     ├─ application.properties
   │     └─ static/
   │        ├─ admin-panel.html
   │        ├─ post-feed.html
   │        ├─ profile.html
   │        ├─ login.html
   │        ├─ scanner.html
   │        ├─ js/
   │        │  ├─ main.js
   │        │  ├─ posts.js
   │        │  ├─ pages/
   │        │  │  └─ admin-panel.js
   │        │  └─ components/
   │        │     └─ avatar.js
   │        ├─ css/
   │        │  ├─ main.css
   │        │  ├─ components/
   │        │  │  └─ posts.css
   │        │  ├─ pages/
   │        │  │  └─ admin-panel.css
   │        │  └─ sections/
   │        ├─ dolgobrodskaya-club.html
   │        ├─ grushevskaya-club.html
   │        ├─ index.html
   │        ├─ kazinca-club.html
   │        ├─ kupali-club.html
   │        ├─ login.html
   │        ├─ minsk.html
   │        ├─ mogilev.html
   │        ├─ profile.html
   │        ├─ scanner.html
   │        ├─ shmidta-club.html
   │        └─ assets/
   │           ├─ fonts/
   │           ├─ images/
   │           │  ├─ coach.jpg
   │           │  ├─ coach_2.jpg
   │           │  ├─ gradient.png
   │           │  ├─ logo2.png
   │           │  ├─ logo3.png
   │           │  ├─ dolgobrodskaya-43/
   │           │  │  ├─ dolgobrodskaya-43_1.jpeg
   │           │  │  ├─ dolgobrodskaya-43_2.jpeg
   │           │  │  ├─ dolgobrodskaya-43_3.jpeg
   │           │  │  ├─ dolgobrodskaya-43_4.jpeg
   │           │  │  ├─ dolgobrodskaya-43_5.jpeg
   │           │  │  ├─ dolgobrodskaya-43_6.jpeg
   │           │  │  ├─ dolgobrodskaya-43_7.jpeg
   │           │  │  ├─ dolgobrodskaya-43_8.jpeg
   │           │  │  ├─ dolgobrodskaya-43_9.jpeg
   │           │  │  └─ dolgobrodskaya-43_10.jpeg
   │           │  ├─ grushevskaya-83/
   │           │  │  ├─ grushevskaya-83_1.jpeg
   │           │  │  ├─ grushevskaya-83_2.jpeg
   │           │  │  ├─ grushevskaya-83_3.jpeg
   │           │  │  ├─ grushevskaya-83_4.jpeg
   │           │  │  ├─ grushevskaya-83_5.jpeg
   │           │  │  ├─ grushevskaya-83_6.jpeg
   │           │  │  ├─ grushevskaya-83_7.jpeg
   │           │  │  │  ├─ grushevskaya-83_8.jpeg
   │           │  │  │  └─ grushevskaya-83_9.jpeg
   │           │  │  └─ (и т.д. согласно фактическим файлам)
   │           │  ├─ icons/
   │           │  │  ├─ barbell.png
   │           │  │  ├─ cardio.png
   │           │  │  ├─ cardio_load.png
   │           │  │  ├─ facebook.png
   │           │  │  ├─ instagram.png
   │           │  │  ├─ logo.png
   │           │  │  ├─ power.png
   │           │  │  ├─ scales.png
   │           │  │  ├─ vk.png
   │           │  │  ├─ youtube.png
   │           │  │  ├─ weight_gain.png
   │           │  │  └─ weight_loss.png
   │           │  ├─ main-banner/
   │           │  │  ├─ main-banner1.jpeg
   │           │  │  ├─ main-banner2.jpeg
   │           │  │  ├─ main-banner3.jpeg
   │           │  │  ├─ main-banner4.jpeg
   │           │  │  └─ main-banner5.jpeg
   │           │  ├─ pr-shmidta-46/
   │           │  │  ├─ pr-shmidta-46_1.jpeg
   │           │  │  ├─ pr-shmidta-46_2.jpeg
   │           │  │  ├─ pr-shmidta-46_3.jpeg
   │           │  │  ├─ pr-shmidta-46_4.jpeg
   │           │  │  ├─ pr-shmidta-46_5.jpeg
   │           │  │  └─ pr-shmidta-46_6.jpeg
   │           │  ├─ pr-y-kupali-22/
   │           │  │  ├─ pr-y-kupali-22_1.jpeg
   │           │  │  ├─ pr-y-kupali-22_2.jpeg
   │           │  │  ├─ pr-y-kupali-22_3.jpeg
   │           │  │  ├─ pr-y-kupali-22_4.jpeg
   │           │  │  ├─ pr-y-kupali-22_5.jpeg
   │           │  │  ├─ pr-y-kupali-22_6.jpeg
   │           │  │  ├─ pr-y-kupali-22_7.jpeg
   │           │  │  ├─ pr-y-kupali-22_8.jpeg
   │           │  │  ├─ pr-y-kupali-22_9.jpeg
   │           │  │  ├─ pr-y-kupali-22_10.jpeg
   │           │  │  └─ pr-y-kupali-22_11.jpeg
   │           │  └─ (другие папки/файлы картинок и видео согласно списку в `environment_details`)
   │           ├─ videos/
   │           └─ (ещё статические ресурсы согласно перечню)
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
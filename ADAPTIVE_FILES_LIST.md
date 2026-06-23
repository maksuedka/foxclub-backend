# Список файлов, связанных с адаптивностью (responsive/adaptive)

> Файл создан без изменений в проекте — только перечисление.

## 1) Главный адаптивный CSS
- `src/main/resources/static/css/responsive.css`
  - Содержит все основные media queries (`@media`) и правила для мобильной/планшетной/десктоп разметки.
  - Внутри есть разделы:
    - «АДАПТИВНОСТЬ ДЛЯ ПРОЕКТА FOX CLUB»
    - общие правки (`.container`, `body`)
    - бургер-меню и mobile-dropdown
    - адаптация admin-panel (sidebar, table-responsive, modals)
    - модальные окна (z-index + мобильная ширина)
    - lightbox, карусель акций, сетки-карточки
    - футер
    - страница клуба (контакты/галерея/интро)
    - сканер QR
    - табы цен
    - мелкие правки (типографика, сетки, формы)

## 2) Страницы, которые включают/используют адаптивную разметку
Эти HTML-страницы подключают `css/main.css`, который (судя по структуре проекта и наличию импорта в main.css/responsive.css) тянет стили адаптивности.

- `src/main/resources/static/kazinca-club.html`
  - Подключает: `<link rel="stylesheet" href="css/main.css">`
  - Содержит типовые секции клуба: хедер/навигация, intro, features, gallery, контакты + карту.
  - Адаптивность применяется за счет CSS-классов на этой разметке.

- `src/main/resources/static/kupali-club.html`
  - Подключает: `<link rel="stylesheet" href="css/main.css">`
  - Аналогично `kazinca-club.html` по структуре (intro/features/gallery/contacts/footer), адаптивность включается через классы.

## 3) Базовый CSS (точка входа)
- `src/main/resources/static/css/main.css`
  - Включает/импортирует `responsive.css` (через `@import 'responsive.css';`).
  - Поэтому любые media queries из `responsive.css` начинают работать на страницах, где подключен `main.css`.

## 4) Где именно определена логика адаптивности
- `responsive.css`
  - Весь responsive-контент сосредоточен здесь.

## Коротко: кто что делает
- `main.css` — основной CSS (собирает компоненты), подключает `responsive.css`.
- `responsive.css` — набор `@media` правил (реальная адаптивность: меню, админка, модалки, сетки, футер, клуб, сканер, табы и т.д.).
- `kazinca-club.html`, `kupali-club.html` — HTML-разметка страниц; подключают `main.css`, на их разметке применяются классы из `responsive.css`.


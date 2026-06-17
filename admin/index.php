<?php require_once 'api/config.php'; ?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>минимал — администратор</title>
  <meta name="google-client-id" content="<?= htmlspecialchars(GOOGLE_CLIENT_ID) ?>">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230E0D0B'/><rect x='7' y='14' width='18' height='4' fill='%23D6491F'/></svg>">
  <link rel="stylesheet" href="admin.css">
  <script src="https://accounts.google.com/gsi/client" async></script>
</head>
<body>

  <header class="ah">
    <a class="ah__logo" href="../index.html">мини&shy;мал<sup>®</sup></a>
    <span class="ah__sep">/ admin</span>
    <div class="ah__user" id="user-info" hidden>
      <span id="user-name"></span>
      <button id="btn-signout" class="btn">выйти</button>
    </div>
  </header>

  <!-- ЭКРАН: вход -->
  <div id="screen-login" class="screen screen--center">
    <div class="login-box">
      <div class="login-box__logo">мини&shy;мал<sup>®</sup></div>
      <h1>Вход в панель управления</h1>
      <p>Авторизуйтесь через Google для работы с проектами</p>
      <div id="google-btn"></div>
      <p id="login-error" class="msg msg--error" hidden></p>
    </div>
  </div>

  <!-- ЭКРАН: список проектов -->
  <div id="screen-list" class="screen" hidden>
    <div class="toolbar">
      <h2>Проекты <span id="proj-count" class="count"></span></h2>
      <button id="btn-add" class="btn btn--primary">+ Добавить проект</button>
    </div>
    <div id="projects-list"></div>
  </div>

  <!-- ЭКРАН: форма проекта -->
  <div id="screen-form" class="screen" hidden>
    <div class="toolbar">
      <button id="btn-back" class="btn">← Назад</button>
      <h2 id="form-title">Новый проект</h2>
      <button type="submit" form="project-form" class="btn btn--primary" id="btn-save">Сохранить</button>
    </div>

    <form id="project-form" novalidate>

      <section class="fsec">
        <h3 class="fsec__title">Основное</h3>
        <div class="fgrid fgrid--2">
          <label>Название проекта <input type="text" name="name" required placeholder="Квартира на Тверской"></label>
          <label>Slug (URL) <input type="text" name="slug" required placeholder="tverskaya" pattern="[a-z0-9\-]+"></label>
        </div>
        <div class="fgrid fgrid--3">
          <label>Тип объекта <input type="text" name="type" required placeholder="Квартира"></label>
          <label>Местоположение <input type="text" name="location" required placeholder="Москва, Тверская"></label>
          <label>Год <input type="text" name="year" required placeholder="2024"></label>
        </div>
        <div class="fgrid fgrid--2">
          <label>Площадь <input type="text" name="area" required placeholder="120 м²"></label>
          <label>Срок работ <input type="text" name="duration" required placeholder="4 месяца"></label>
        </div>
        <label>Слоган (tagline) <input type="text" name="tagline" required placeholder="Тишина в центре города"></label>
      </section>

      <section class="fsec">
        <h3 class="fsec__title">Задача клиента</h3>
        <textarea name="task" rows="4" required placeholder="Описание задачи и запроса клиента..."></textarea>
      </section>

      <section class="fsec">
        <h3 class="fsec__title">Описание проекта <small>— по параграфам</small></h3>
        <div id="desc-list"></div>
        <button type="button" id="btn-add-desc" class="btn btn--ghost">+ параграф</button>
      </section>

      <section class="fsec">
        <h3 class="fsec__title">Обложка проекта</h3>
        <div id="cover-zone" class="upload-zone">
          <div id="cover-preview" class="upload-zone__preview" hidden></div>
          <div class="upload-zone__cta">
            <button type="button" id="btn-cover" class="btn">Загрузить изображение</button>
            <span class="hint">JPG, PNG или WebP · рекомендуется 1920×1080</span>
          </div>
        </div>
        <input type="file" id="cover-file" accept="image/*" hidden>
        <input type="hidden" name="cover" id="cover-val">
      </section>

      <section class="fsec">
        <h3 class="fsec__title">Галерея <small>— фотографии проекта</small></h3>
        <div id="gallery-grid" class="gal-grid"></div>
        <button type="button" id="btn-gallery" class="btn btn--ghost">+ добавить фотографии</button>
        <input type="file" id="gallery-file" accept="image/*" multiple hidden>
      </section>

      <section class="fsec">
        <h3 class="fsec__title">Факты проекта <small>— цифры и данные</small></h3>
        <div id="facts-list"></div>
        <button type="button" id="btn-add-fact" class="btn btn--ghost">+ факт</button>
      </section>

      <section class="fsec">
        <h3 class="fsec__title">Палитра <small>— необязательно</small></h3>
        <div id="palette-row" class="pal-row"></div>
        <button type="button" id="btn-add-color" class="btn btn--ghost">+ цвет</button>
      </section>

    </form>
  </div>

  <script src="admin.js"></script>
</body>
</html>

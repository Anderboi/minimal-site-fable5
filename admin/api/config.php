<?php
/**
 * минимал® — конфигурация администратора
 *
 * ШАГ 1 — GOOGLE OAUTH
 *   - Откройте https://console.cloud.google.com/
 *   - Создайте проект → APIs & Services → Credentials
 *   - + Create Credentials → OAuth 2.0 Client ID → Web application
 *   - Authorized JavaScript origins: https://minimal-studio.ru
 *   - Скопируйте Client ID и вставьте в GOOGLE_CLIENT_ID ниже
 *
 * ШАГ 2 — РАЗРЕШЁННЫЕ EMAIL
 *   Добавьте ваш Google-аккаунт в ALLOWED_EMAILS
 *
 * ШАГ 3 — ПРАВА НА СЕРВЕРЕ (выполнить через SSH один раз):
 *   chmod 664 /var/www/html/data/projects.json
 *   mkdir -p /var/www/html/assets/images/projects
 *   chmod 755 /var/www/html/assets/images/projects
 *   chown -R www-data:www-data /var/www/html/data /var/www/html/assets/images/projects
 */

define('GOOGLE_CLIENT_ID', '227077269131-nvare3n61db5nrq5apt63h2ol2148dik.apps.googleusercontent.com');

define('ALLOWED_EMAILS', [
    'your@gmail.com', // ← замените на ваш email
]);

// Пути на сервере (менять обычно не нужно)
define('PROJECTS_FILE', realpath(__DIR__ . '/../../data') . '/projects.json');
define('UPLOADS_DIR',   realpath(__DIR__ . '/../../assets') . '/images/projects/');
define('UPLOADS_URL',   '/assets/images/projects/');

<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_ok'])) {
    http_response_code(401);
    echo json_encode(['error' => 'not_authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

$file = $_FILES['file'] ?? null;
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($_POST['slug'] ?? 'project'));

if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    $codes = [1=>'too_large_ini',2=>'too_large_form',3=>'partial',4=>'no_file',6=>'no_tmp_dir',7=>'cant_write',8=>'extension'];
    http_response_code(400);
    echo json_encode(['error' => 'upload_error', 'code' => $codes[$file['error'] ?? 0] ?? 'unknown']);
    exit;
}

// Проверка MIME через fileinfo (не доверяем расширению файла)
if (!function_exists('finfo_open')) {
    http_response_code(500);
    echo json_encode(['error' => 'fileinfo_missing', 'hint' => 'Установите PHP расширение fileinfo']);
    exit;
}
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']);

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_type', 'mime' => $mime, 'allowed' => array_keys($allowed)]);
    exit;
}

$ext      = $allowed[$mime];
$filename = $slug . '-' . substr(uniqid(), -6) . '.' . $ext;
$dest     = UPLOADS_DIR . $filename;

// Создаём директорию если нет
if (!is_dir(UPLOADS_DIR)) {
    if (!mkdir(UPLOADS_DIR, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'mkdir_failed', 'path' => UPLOADS_DIR]);
        exit;
    }
}

if (!is_writable(UPLOADS_DIR)) {
    http_response_code(500);
    echo json_encode(['error' => 'not_writable', 'path' => UPLOADS_DIR, 'hint' => 'chmod 755 ' . UPLOADS_DIR . ' && chown www-data:www-data ' . UPLOADS_DIR]);
    exit;
}

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['error' => 'move_failed']);
    exit;
}

echo json_encode(['ok' => true, 'url' => UPLOADS_URL . $filename, 'filename' => $filename]);

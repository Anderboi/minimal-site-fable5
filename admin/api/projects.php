<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (empty($_SESSION['admin_ok'])) {
    http_response_code(401);
    echo json_encode(['error' => 'not_authenticated']);
    exit;
}

function readProjects(): array {
    if (!file_exists(PROJECTS_FILE)) return [];
    $raw = file_get_contents(PROJECTS_FILE);
    return $raw ? (json_decode($raw, true) ?: []) : [];
}

function writeProjects(array $projects): bool {
    $json = json_encode($projects, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents(PROJECTS_FILE, $json) !== false;
}

function slugify(string $str): string {
    $map = ['а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ё'=>'yo','ж'=>'zh',
        'з'=>'z','и'=>'i','й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n','о'=>'o',
        'п'=>'p','р'=>'r','с'=>'s','т'=>'t','у'=>'u','ф'=>'f','х'=>'kh','ц'=>'ts',
        'ч'=>'ch','ш'=>'sh','щ'=>'shch','ъ'=>'','ы'=>'y','ь'=>'','э'=>'e','ю'=>'yu','я'=>'ya'];
    $str = mb_strtolower($str, 'UTF-8');
    $str = strtr($str, $map);
    $str = preg_replace('/\s+/', '-', $str);
    $str = preg_replace('/[^a-z0-9\-]/', '', $str);
    $str = preg_replace('/-+/', '-', $str);
    return trim($str, '-');
}

$method   = $_SERVER['REQUEST_METHOD'];
$projects = readProjects();

// GET — список проектов
if ($method === 'GET') {
    echo json_encode($projects);
    exit;
}

// POST — создать или обновить проект
if ($method === 'POST') {
    $p = json_decode(file_get_contents('php://input'), true);

    if (!$p || empty($p['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'name_required']);
        exit;
    }

    if (empty($p['slug'])) {
        $p['slug'] = slugify($p['name']);
    }

    // Гарантируем типы массивов
    $p['description'] = array_values(array_filter((array)($p['description'] ?? []), function($v){ return trim($v) !== ''; }));
    $p['images']      = array_values(array_filter((array)($p['images']      ?? []), function($v){ return trim($v) !== ''; }));
    $p['facts']       = array_values(array_filter((array)($p['facts']       ?? []), function($f){ return !empty($f['value']) || !empty($f['label']); }));
    $p['palette']     = array_values(array_filter((array)($p['palette']     ?? []), function($v){ return trim($v) !== ''; }));

    // Найти по slug
    $slugs = array_column($projects, 'slug');
    $idx   = array_search($p['slug'], $slugs, true);

    if ($idx !== false) {
        $projects[$idx] = $p;
    } else {
        $projects[] = $p;
    }

    if (!writeProjects($projects)) {
        http_response_code(500);
        echo json_encode(['error' => 'write_failed', 'hint' => 'Проверьте права на файл ' . PROJECTS_FILE]);
        exit;
    }

    echo json_encode(['ok' => true, 'slug' => $p['slug']]);
    exit;
}

// DELETE — удалить проект по slug
if ($method === 'DELETE') {
    $slug = $_GET['slug'] ?? '';
    if (!$slug) {
        http_response_code(400);
        echo json_encode(['error' => 'slug_required']);
        exit;
    }

    $before   = count($projects);
    $projects = array_values(array_filter($projects, function($p) use ($slug) {
        return $p['slug'] !== $slug;
    }));

    if (count($projects) === $before) {
        http_response_code(404);
        echo json_encode(['error' => 'not_found']);
        exit;
    }

    if (!writeProjects($projects)) {
        http_response_code(500);
        echo json_encode(['error' => 'write_failed']);
        exit;
    }

    echo json_encode(['ok' => true]);
    exit;
}

// PATCH — переупорядочить (принимает массив слагов в новом порядке)
if ($method === 'PATCH') {
    $body  = json_decode(file_get_contents('php://input'), true);
    $order = $body['order'] ?? [];

    if (empty($order) || !is_array($order)) {
        http_response_code(400);
        echo json_encode(['error' => 'order_required']);
        exit;
    }

    $indexed  = [];
    foreach ($projects as $p) { $indexed[$p['slug']] = $p; }

    $reordered = [];
    foreach ($order as $slug) {
        if (isset($indexed[$slug])) $reordered[] = $indexed[$slug];
    }

    if (!writeProjects($reordered)) {
        http_response_code(500);
        echo json_encode(['error' => 'write_failed']);
        exit;
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'method_not_allowed']);

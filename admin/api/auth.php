<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function verifyGoogleToken(string $token, string $clientId): ?array {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true]);
        $resp = curl_exec($ch);
        curl_close($ch);
    } else {
        $resp = @file_get_contents($url);
    }
    if (!$resp) return null;
    $p = json_decode($resp, true);
    if (!$p || isset($p['error'])) return null;
    if (($p['aud'] ?? '') !== $clientId) return null;
    if (($p['exp'] ?? 0) < time()) return null;
    return $p;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — проверить текущую сессию
if ($method === 'GET') {
    echo json_encode([
        'ok'    => !empty($_SESSION['admin_ok']),
        'name'  => $_SESSION['admin_name']  ?? null,
        'email' => $_SESSION['admin_email'] ?? null,
    ]);
    exit;
}

// POST — верифицировать Google токен и создать сессию
if ($method === 'POST') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $token = $data['credential'] ?? '';

    if (!$token) {
        http_response_code(400);
        echo json_encode(['error' => 'no_token']);
        exit;
    }

    $payload = verifyGoogleToken($token, GOOGLE_CLIENT_ID);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid_token']);
        exit;
    }

    $email = $payload['email'] ?? '';
    if (!in_array($email, ALLOWED_EMAILS, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'not_authorized', 'email' => $email]);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['admin_ok']    = true;
    $_SESSION['admin_email'] = $email;
    $_SESSION['admin_name']  = $payload['name'] ?? $email;

    echo json_encode(['ok' => true, 'name' => $_SESSION['admin_name'], 'email' => $email]);
    exit;
}

// DELETE — выход
if ($method === 'DELETE') {
    session_destroy();
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'method_not_allowed']);

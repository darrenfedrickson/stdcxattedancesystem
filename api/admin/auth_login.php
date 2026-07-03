<?php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';

try {
    $stmt = $pdo->query("SELECT password_hash FROM admin_auth LIMIT 1");
    $hash = $stmt->fetchColumn();

    if ($hash && password_verify($password, $hash)) {
        $_SESSION['admin_logged_in'] = true;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Incorrect password']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

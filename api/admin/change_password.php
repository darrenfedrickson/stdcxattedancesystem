<?php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$current_password = $input['current_password'] ?? '';
$new_password = $input['new_password'] ?? '';

try {
    $stmt = $pdo->query("SELECT password_hash FROM admin_auth LIMIT 1");
    $hash = $stmt->fetchColumn();

    if ($hash && password_verify($current_password, $hash)) {
        $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
        $pdo->query("UPDATE admin_auth SET password_hash = " . $pdo->quote($new_hash));
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

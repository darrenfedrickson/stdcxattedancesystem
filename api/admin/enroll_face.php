<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
require_once '../../config/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;
$descriptor = $input['descriptor'] ?? null;

if (!$id || !$descriptor || !is_array($descriptor)) {
    echo json_encode(['success' => false, 'error' => 'Student ID and Face Descriptor are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE students SET face_descriptor = ? WHERE id = ?");
    // Convert array back to JSON for storage
    $stmt->execute([json_encode($descriptor), $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

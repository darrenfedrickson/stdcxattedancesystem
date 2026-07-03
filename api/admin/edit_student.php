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
$full_name = trim($input['full_name'] ?? '');
$batch_id = $input['batch_id'] ?? null;

if (!$id || empty($full_name) || !$batch_id) {
    echo json_encode(['success' => false, 'error' => 'Student ID, Name, and Batch are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE students SET full_name = ?, batch_id = ? WHERE id = ?");
    $stmt->execute([$full_name, $batch_id, $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['success' => false, 'error' => 'A student with this name already exists']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
}
?>

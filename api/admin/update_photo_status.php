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
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['log_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields.']);
    exit;
}

$log_id = (int)$data['log_id'];
$status = $data['status'];

if (!in_array($status, ['approved', 'rejected', 'pending'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid status.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE attendance_logs SET photo_status = ? WHERE id = ?");
    $stmt->execute([$status, $log_id]);
    echo json_encode(['success' => true]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error while updating status.']);
}
?>

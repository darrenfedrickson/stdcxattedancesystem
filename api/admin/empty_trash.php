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
$action = $input['action'] ?? 'auto'; // 'auto' (older than 30 days), 'single' (specific ID), 'all' (purge all trash)
$id = $input['id'] ?? null;

try {
    if ($action === 'single' && $id) {
        $stmt = $pdo->prepare("DELETE FROM batches WHERE id = ? AND deleted_at IS NOT NULL");
        $stmt->execute([$id]);
    } else if ($action === 'all') {
        $pdo->exec("DELETE FROM batches WHERE deleted_at IS NOT NULL");
    } else { // auto cleanup 30 days
        $pdo->exec("DELETE FROM batches WHERE deleted_at < NOW() - INTERVAL 30 DAY AND deleted_at IS NOT NULL");
    }
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

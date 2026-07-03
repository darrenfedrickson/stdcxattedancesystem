<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
require_once '../../config/db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT b.id, b.name, b.deleted_at, COUNT(s.id) as student_count 
                         FROM batches b 
                         LEFT JOIN students s ON b.id = s.batch_id 
                         WHERE b.deleted_at IS NOT NULL
                         GROUP BY b.id ORDER BY b.deleted_at DESC");
    $batches = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $batches]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

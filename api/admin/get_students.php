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
    $stmt = $pdo->query("SELECT s.id, s.full_name, s.batch_id, b.name as batch_name, s.created_at, 
                         (s.face_descriptor IS NOT NULL) as has_face
                         FROM students s 
                         LEFT JOIN batches b ON s.batch_id = b.id
                         WHERE b.deleted_at IS NULL OR b.id IS NULL
                         ORDER BY b.name ASC, s.full_name ASC");
    $students = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $students]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

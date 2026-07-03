<?php
require_once '../config/db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT id, full_name FROM students ORDER BY full_name ASC");
    $students = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $students]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error.']);
}
?>

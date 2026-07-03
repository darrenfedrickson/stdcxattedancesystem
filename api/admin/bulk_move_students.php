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
$student_ids = $input['student_ids'] ?? [];
$target_batch_id = $input['target_batch_id'] ?? null;

if (empty($student_ids) || !$target_batch_id) {
    echo json_encode(['success' => false, 'error' => 'Students and target batch are required']);
    exit;
}

try {
    // Create an array of ? for the IN clause
    $inQuery = implode(',', array_fill(0, count($student_ids), '?'));
    
    $sql = "UPDATE students SET batch_id = ? WHERE id IN ($inQuery)";
    $stmt = $pdo->prepare($sql);
    
    // Merge batch_id with student_ids for execution
    $params = array_merge([$target_batch_id], $student_ids);
    $stmt->execute($params);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

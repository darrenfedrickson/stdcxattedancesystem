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

$input = json_decode(file_get_contents('php://input'), true);
$full_name = trim($input['full_name'] ?? '');
$batch_id = $input['batch_id'] ?? null;

if (empty($full_name) || !$batch_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name and Batch are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO students (full_name, batch_id) VALUES (?, ?)");
    $stmt->execute([$full_name, $batch_id]);
    
    echo json_encode([
        'success' => true, 
        'data' => [
            'id' => $pdo->lastInsertId(),
            'full_name' => $full_name,
            'batch_id' => $batch_id
        ]
    ]);
} catch (\PDOException $e) {
    if ($e->getCode() == 23000 || $pdo->errorCode() == 23000) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Student with this name already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error while adding student.']);
    }
}
?>

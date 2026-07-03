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
$name = trim($input['name'] ?? '');

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Batch name is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO batches (name) VALUES (?)");
    $stmt->execute([$name]);
    echo json_encode(['success' => true, 'data' => ['id' => $pdo->lastInsertId(), 'name' => $name]]);
} catch (Exception $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['success' => false, 'error' => 'A batch with this name already exists']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
}
?>

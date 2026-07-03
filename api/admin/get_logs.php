<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
require_once '../../config/db.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) && $_GET['student_id'] !== '' ? (int)$_GET['student_id'] : null;
$batch_id = isset($_GET['batch_id']) && $_GET['batch_id'] !== '' ? (int)$_GET['batch_id'] : null;
$start_date = isset($_GET['start_date']) && $_GET['start_date'] !== '' ? $_GET['start_date'] : null;
$end_date = isset($_GET['end_date']) && $_GET['end_date'] !== '' ? $_GET['end_date'] : null;
$action_type = isset($_GET['action_type']) && $_GET['action_type'] !== '' ? $_GET['action_type'] : null;

$query = "
    SELECT al.id, al.student_id, s.full_name, al.action_type, al.timestamp, al.ip_address, al.image_path, al.photo_status, al.reason
    FROM attendance_logs al
    JOIN students s ON al.student_id = s.id
    WHERE 1=1
";
$params = [];

if ($student_id) {
    $query .= " AND al.student_id = ?";
    $params[] = $student_id;
}
if ($batch_id) {
    $query .= " AND s.batch_id = ?";
    $params[] = $batch_id;
}
if ($start_date) {
    $query .= " AND DATE(al.timestamp) >= ?";
    $params[] = $start_date;
}
if ($end_date) {
    $query .= " AND DATE(al.timestamp) <= ?";
    $params[] = $end_date;
}
if ($action_type) {
    $query .= " AND al.action_type = ?";
    $params[] = $action_type;
}

$query .= " ORDER BY al.timestamp DESC";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $logs]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error while fetching logs.']);
}
?>

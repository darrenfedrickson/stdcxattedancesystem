<?php
require_once '../config/db.php';
header('Content-Type: application/json');

if (!isset($_GET['student_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing student ID']);
    exit;
}

$student_id = (int)$_GET['student_id'];
$today = date('Y-m-d');

try {
    $stmt = $pdo->prepare("
        SELECT action_type, timestamp 
        FROM attendance_logs 
        WHERE student_id = ? AND DATE(timestamp) = ?
    ");
    $stmt->execute([$student_id, $today]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $has_clocked_in = false;
    $has_clocked_out = false;
    $clock_in_time = null;

    foreach ($logs as $log) {
        if ($log['action_type'] === 'clock_in') {
            $has_clocked_in = true;
            if (!$clock_in_time) $clock_in_time = $log['timestamp'];
        }
        if ($log['action_type'] === 'clock_out') {
            $has_clocked_out = true;
        }
    }

    $stmt = $pdo->prepare("SELECT face_descriptor FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    $face_descriptor = $student['face_descriptor'] ? json_decode($student['face_descriptor']) : null;

    echo json_encode([
        'success' => true, 
        'data' => [
            'has_clocked_in' => $has_clocked_in,
            'has_clocked_out' => $has_clocked_out,
            'clock_in_time' => $clock_in_time,
            'has_face' => $face_descriptor !== null,
            'face_descriptor' => $face_descriptor
        ]
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

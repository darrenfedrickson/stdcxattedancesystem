<?php
require_once '../config/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['student_id'], $data['action_type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields.']);
    exit;
}

$student_id = (int) $data['student_id'];
$action_type = $data['action_type'];

if (!in_array($action_type, ['clock_in', 'clock_out'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid action type.']);
    exit;
}

$timestamp = date('Y-m-d H:i:s'); // Server-side precise timestamp
$ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

try {
    // Validate if student exists
    $stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    if (!$stmt->fetch()) {
         http_response_code(404);
         echo json_encode(['success' => false, 'error' => 'Student not found.']);
         exit;
    }

    $image_path = null;
    if (isset($data['image_base64']) && strpos($data['image_base64'], 'data:image/') === 0) {
        $parts = explode(',', $data['image_base64']);
        if (count($parts) == 2) {
            $image_data = base64_decode($parts[1]);
            $filename = 'attendance_' . $student_id . '_' . time() . '_' . uniqid() . '.jpg';
            $filepath = '../uploads/attendance/' . $filename;
            if (file_put_contents($filepath, $image_data)) {
                $image_path = 'uploads/attendance/' . $filename;
            }
        }
    }

    // Insert attendance log
    $reason = isset($data['reason']) && !empty(trim($data['reason'])) ? trim($data['reason']) : null;

    $stmt = $pdo->prepare("INSERT INTO attendance_logs (student_id, action_type, timestamp, ip_address, image_path, reason) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$student_id, $action_type, $timestamp, $ip_address, $image_path, $reason]);

    echo json_encode([
        'success' => true, 
        'message' => 'Attendance logged successfully.',
        'data' => [
            'action_type' => $action_type,
            'timestamp' => $timestamp
        ]
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error while logging attendance.']);
}
?>

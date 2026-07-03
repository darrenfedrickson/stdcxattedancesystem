<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    die('Unauthorized');
}
require_once '../../config/db.php';

$student_id = isset($_GET['student_id']) && $_GET['student_id'] !== '' ? (int)$_GET['student_id'] : null;
$batch_id = isset($_GET['batch_id']) && $_GET['batch_id'] !== '' ? (int)$_GET['batch_id'] : null;
$start_date = isset($_GET['start_date']) && $_GET['start_date'] !== '' ? $_GET['start_date'] : null;
$end_date = isset($_GET['end_date']) && $_GET['end_date'] !== '' ? $_GET['end_date'] : null;
$action_type = isset($_GET['action_type']) && $_GET['action_type'] !== '' ? $_GET['action_type'] : null;

$query = "
    SELECT s.id as student_id, s.full_name as student_name, al.action_type, al.timestamp, al.reason
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

$query .= " ORDER BY al.timestamp ASC";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group logs by student and date
    $grouped = [];
    foreach ($logs as $log) {
        $logDate = date('Y-m-d', strtotime($log['timestamp']));
        $key = $log['student_id'] . '_' . $logDate;
        
        if (!isset($grouped[$key])) {
            $grouped[$key] = [
                'Date' => $logDate,
                'Student Name' => $log['student_name'],
                'Clock In Time' => '-',
                'Clock In Reason' => '-',
                'Clock Out Time' => '-',
                'Clock Out Reason' => '-',
                'Total Hrs' => '-',
                'Status' => '-',
            ];
            $grouped[$key]['_raw_in'] = null;
            $grouped[$key]['_raw_out'] = null;
        }

        $timeStr = date('H:i:s', strtotime($log['timestamp']));

        if ($log['action_type'] === 'clock_in') {
            // Only take the first clock in
            if ($grouped[$key]['Clock In Time'] === '-') {
                $grouped[$key]['Clock In Time'] = $timeStr;
                $grouped[$key]['Clock In Reason'] = $log['reason'] ? $log['reason'] : '-';
                $grouped[$key]['_raw_in'] = strtotime($log['timestamp']);
            }
        } else if ($log['action_type'] === 'clock_out') {
            // Continually update clock_out so it retains the LAST one of the day
            $grouped[$key]['Clock Out Time'] = $timeStr;
            $grouped[$key]['Clock Out Reason'] = $log['reason'] ? $log['reason'] : '-';
            $grouped[$key]['_raw_out'] = strtotime($log['timestamp']);
        }
    }

    // Process Status logic
    foreach ($grouped as $key => &$row) {
        if ($row['_raw_in']) {
            $inHour = (int)date('H', $row['_raw_in']);
            $inMin = (int)date('i', $row['_raw_in']);
            $isLate = ($inHour > 8) || ($inHour === 8 && $inMin > 30);
            
            if (!$row['_raw_out']) {
                $row['Status'] = $isLate ? 'Late' : 'Pending Out';
            } else {
                $outHour = (int)date('H', $row['_raw_out']);
                $duration = $row['_raw_out'] - $row['_raw_in'];
                
                $hrs = floor($duration / 3600);
                $mins = floor(($duration % 3600) / 60);
                $row['Total Hrs'] = "{$hrs}h {$mins}m";

                // Effective start time logic matching JS
                $effStartTs = $row['_raw_in'];
                if ($inHour < 8) {
                    $effStartTs = strtotime(date('Y-m-d 08:00:00', $row['_raw_in']));
                }
                $expectedOutTs = $effStartTs + (9 * 3600);
                $isEarlyLeave = $row['_raw_out'] < $expectedOutTs;
                
                if ($isLate && $isEarlyLeave) {
                    $row['Status'] = 'Late & Early Leave';
                } else if ($isLate) {
                    $row['Status'] = 'Late';
                } else if ($isEarlyLeave) {
                    $row['Status'] = 'Early Leave';
                } else {
                    $row['Status'] = 'On Time';
                }
            }
        }
        unset($row['_raw_in']);
        unset($row['_raw_out']);
    }
    unset($row);

    // Sort by Date DESC
    usort($grouped, function($a, $b) {
        return strcmp($b['Date'], $a['Date']);
    });

    $filename = "attendance_report_" . date('Ymd_His') . ".csv";

    // Headers for CSV download
    header("Content-Type: text/csv; charset=utf-8");
    header("Content-Disposition: attachment; filename=\"$filename\"");
    header("Pragma: no-cache");
    header("Expires: 0");

    $output = fopen('php://output', 'w');
    // Add BOM for UTF-8
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    if (count($grouped) > 0) {
        // Output column headings
        fputcsv($output, array_keys($grouped[0]));
        
        // Output rows
        foreach ($grouped as $row) {
            fputcsv($output, $row);
        }
    } else {
        fputcsv($output, ['Date', 'Student Name', 'Clock In Time', 'Clock In Reason', 'Clock Out Time', 'Clock Out Reason', 'Total Hrs', 'Status']);
        fputcsv($output, ['No records found matching criteria']);
    }

    fclose($output);
    exit;

} catch (\PDOException $e) {
    http_response_code(500);
    die('Database error while exporting logs.');
}
?>

<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
require_once '../../config/db.php';
header('Content-Type: application/json');

// Get Date Range from GET
$start_date = isset($_GET['start_date']) && $_GET['start_date'] !== '' ? $_GET['start_date'] : date('Y-m-01');
$end_date = isset($_GET['end_date']) && $_GET['end_date'] !== '' ? $_GET['end_date'] : date('Y-m-t');
$student_id = isset($_GET['student_id']) && $_GET['student_id'] !== '' ? (int)$_GET['student_id'] : null;
$batch_id = isset($_GET['batch_id']) && $_GET['batch_id'] !== '' ? (int)$_GET['batch_id'] : null;

try {
    $queryCount = "SELECT COUNT(DISTINCT DATE(al.timestamp)) as total_days 
                   FROM attendance_logs al
                   JOIN students s ON al.student_id = s.id
                   WHERE DATE(al.timestamp) >= ? AND DATE(al.timestamp) <= ?";
    $paramsCount = [$start_date, $end_date];

    if ($student_id) {
        $queryCount .= " AND al.student_id = ?";
        $paramsCount[] = $student_id;
    }
    if ($batch_id) {
        $queryCount .= " AND s.batch_id = ?";
        $paramsCount[] = $batch_id;
    }

    $stmt = $pdo->prepare($queryCount);
    $stmt->execute($paramsCount);
    $totalDataDays = (int)$stmt->fetchColumn();

    if ($totalDataDays === 0) {
        echo json_encode(['success' => true, 'total_days' => 0, 'data' => []]);
        exit;
    }

    $queryLogs = "SELECT a.student_id, s.full_name, a.action_type, a.timestamp 
                  FROM attendance_logs a
                  JOIN students s ON a.student_id = s.id
                  WHERE DATE(a.timestamp) >= ? AND DATE(a.timestamp) <= ?";
    $paramsLogs = [$start_date, $end_date];

    if ($student_id) {
        $queryLogs .= " AND a.student_id = ?";
        $paramsLogs[] = $student_id;
    }
    if ($batch_id) {
        $queryLogs .= " AND s.batch_id = ?";
        $paramsLogs[] = $batch_id;
    }

    $queryLogs .= " ORDER BY a.timestamp ASC";

    $stmt = $pdo->prepare($queryLogs);
    $stmt->execute($paramsLogs);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group logs by student -> date
    $studentData = [];
    $studentNames = [];

    foreach ($logs as $log) {
        $sId = $log['student_id'];
        $date = date('Y-m-d', strtotime($log['timestamp']));
        
        if (!isset($studentData[$sId])) {
            $studentData[$sId] = [];
            $studentNames[$sId] = $log['full_name'];
        }
        if (!isset($studentData[$sId][$date])) {
            $studentData[$sId][$date] = ['in' => null, 'out' => null, 'duplicate' => 0];
        }

        if ($log['action_type'] === 'clock_in') {
            if ($studentData[$sId][$date]['in'] !== null) $studentData[$sId][$date]['duplicate']++;
            else $studentData[$sId][$date]['in'] = $log['timestamp'];
        } else if ($log['action_type'] === 'clock_out') {
            if ($studentData[$sId][$date]['out'] !== null) $studentData[$sId][$date]['duplicate']++;
            else $studentData[$sId][$date]['out'] = $log['timestamp'];
        }
    }

    $results = [];

    // 3. Process each student
    foreach ($studentData as $sId => $dates) {
        $hariHadir = 0; // Days with at least a clock-in
        $hariRekodSah = 0; // Days with valid pairs (in and out) and out > in
        $hariOK = 0; // Full Day (>= 8 hours) AND Punctual (Not late, no early leave)
        $hariLengkap = 0; // Days >= 8 hours
        $lewat = 0; // Clock In > 09:00
        $pulangAwal = 0; // Clock Out < 17:00
        
        $missingIn = 0;
        $missingOut = 0;
        $invalidId = 0; // Out < In
        $duplicate = 0;
        $totalHours = 0;
        
        foreach ($dates as $date => $rec) {
            $duplicate += $rec['duplicate'];
            
            if ($rec['in']) {
                $hariHadir++;
            } else {
                $missingIn++;
            }
            
            if (!$rec['out']) {
                $missingOut++;
            }
            
            if ($rec['in'] && $rec['out']) {
                $tsIn = strtotime($rec['in']);
                $tsOut = strtotime($rec['out']);
                
                if ($tsOut < $tsIn) {
                    $invalidId++;
                } else {
                    $hariRekodSah++;
                    $hrs = ($tsOut - $tsIn) / 3600;
                    $totalHours += $hrs;
                    
                    if ($hrs >= 8) {
                        $hariLengkap++;
                    }
                    
                    $isLate = false;
                    $isEarlyLeave = false;
                    
                    // Late check (09:00)
                    $cutoffIn = strtotime($date . " 09:00:00");
                    if ($tsIn > $cutoffIn) {
                        $lewat++;
                        $isLate = true;
                    }
                    
                    // Early leave check (17:00)
                    $cutoffOut = strtotime($date . " 17:00:00");
                    if ($tsOut < $cutoffOut) {
                        $pulangAwal++;
                        $isEarlyLeave = true;
                    }
                    
                    if ($hrs >= 8 && !$isLate && !$isEarlyLeave) {
                        $hariOK++;
                    }
                }
            }
        }
        
        $missingTotal = $missingIn + $missingOut;
        $dataBermasalah = $missingTotal + $invalidId + $duplicate;
        $dataLengkapPct = $hariRekodSah > 0 ? (($hariRekodSah - $dataBermasalah) / $hariRekodSah) * 100 : 0;
        if ($dataLengkapPct < 0) $dataLengkapPct = 0;
        if ($dataLengkapPct > 100) $dataLengkapPct = 100;

        // FORMULAS
        // Kehadiran (40%) = (Hari lengkap >= 8 jam / total data days) * 40
        $skorKehadiran = ($hariLengkap / $totalDataDays) * 40;
        if ($skorKehadiran > 40) $skorKehadiran = 40;

        // Ketepatan Masa (30%) = 30 * [1 - ((Lewat + Pulang Awal) / (2 * Hari Rekod Sah))]
        if ($hariRekodSah > 0) {
            $penalty = ($lewat + $pulangAwal) / (2 * $hariRekodSah);
            $skorKetepatan = 30 * (1 - $penalty);
        } else {
            $skorKetepatan = 0;
        }
        if ($skorKetepatan < 0) $skorKetepatan = 0;
        if ($skorKetepatan > 30) $skorKetepatan = 30;

        // Kelengkapan Data (30%) = (Hari OK / hari direkodkan) * 30
        // "Hari OK" means >= 8 jam and not late and not early leave.
        // "Hari direkodkan" means $hariHadir
        if ($hariHadir > 0) {
            $skorData = ($hariOK / $hariHadir) * 30;
        } else {
            $skorData = 0;
        }
        if ($skorData > 30) $skorData = 30;

        $totalSkor = $skorKehadiran + $skorKetepatan + $skorData;
        $totalSkor = round($totalSkor, 2);

        if ($totalSkor >= 85) $status = 'Cemerlang';
        else if ($totalSkor >= 70) $status = 'Baik';
        else if ($totalSkor >= 50) $status = 'Sederhana';
        else $status = 'Lemah';

        $results[] = [
            'student_id' => $sId,
            'name' => $studentNames[$sId],
            'hari_hadir' => $hariHadir,
            'hari_rekod_sah' => $hariRekodSah,
            'hari_lengkap' => $hariLengkap,
            'lewat' => $lewat,
            'pulang_awal' => $pulangAwal,
            'missing_in' => $missingIn,
            'missing_out' => $missingOut,
            'invalid_time' => $invalidId,
            'duplicate' => $duplicate,
            'isu_data' => $dataBermasalah > 0,
            'total_jam' => round($totalHours, 2),
            'purata_jam' => $hariRekodSah > 0 ? round($totalHours / $hariRekodSah, 2) : 0,
            'skor' => $totalSkor,
            'skor_kehadiran' => round($skorKehadiran, 2),
            'skor_ketepatan' => round($skorKetepatan, 2),
            'skor_data' => round($skorData, 2),
            'status' => $status
        ];
    }

    // Sort by score descending
    usort($results, function($a, $b) {
        return $b['skor'] <=> $a['skor'];
    });

    echo json_encode([
        'success' => true,
        'total_days' => $totalDataDays,
        'data' => $results
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

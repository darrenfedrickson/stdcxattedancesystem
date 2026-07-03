<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE students ADD COLUMN batch_name VARCHAR(100) DEFAULT 'Unassigned'");
    echo "Migration successful. batch_name added.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>

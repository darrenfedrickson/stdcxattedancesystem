<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE batches ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL");
    echo "Migration successful: added deleted_at to batches.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column deleted_at already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>

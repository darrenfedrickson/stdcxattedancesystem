<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE students ADD COLUMN face_descriptor TEXT NULL DEFAULT NULL");
    echo "Migration successful: added face_descriptor to students.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column face_descriptor already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>

<?php
require_once 'db.php';
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_auth (
            id INT PRIMARY KEY AUTO_INCREMENT,
            password_hash VARCHAR(255) NOT NULL
        )
    ");
    
    // Check if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM admin_auth");
    if ($stmt->fetchColumn() == 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $insert = $pdo->prepare("INSERT INTO admin_auth (password_hash) VALUES (?)");
        $insert->execute([$hash]);
        echo "Migration successful. Default password set to 'admin123'.\n";
    } else {
        echo "Table already exists and has data.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

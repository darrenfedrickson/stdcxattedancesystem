<?php
require_once 'db.php';
try {
    // 1. Create batches table
    $pdo->exec("CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Insert unique batch names
    try {
        $stmt = $pdo->query("SELECT DISTINCT batch_name FROM students WHERE batch_name IS NOT NULL");
        $batchNames = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('Unassigned', $batchNames)) {
            $batchNames[] = 'Unassigned';
        }

        $insertBatch = $pdo->prepare("INSERT IGNORE INTO batches (name) VALUES (?)");
        foreach ($batchNames as $b) {
            $insertBatch->execute([$b]);
        }
    } catch (Exception $e) {
        echo "Note: Could not select batch_name (maybe already dropped?)\n";
    }

    // 3. Add batch_id to students if not exists
    try {
        $pdo->exec("ALTER TABLE students ADD COLUMN batch_id INT NULL");
        $pdo->exec("ALTER TABLE students ADD CONSTRAINT fk_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL");
    } catch (Exception $e) {}

    // 4. Update batch_id
    try {
        $pdo->exec("UPDATE students s JOIN batches b ON s.batch_name = b.name SET s.batch_id = b.id");
    } catch (Exception $e) {}
    
    $pdo->exec("UPDATE students SET batch_id = (SELECT id FROM batches WHERE name = 'Unassigned') WHERE batch_id IS NULL");

    // 5. Drop batch_name
    try {
        $pdo->exec("ALTER TABLE students DROP COLUMN batch_name");
    } catch (Exception $e) {}

    echo "Migration to batches table successful.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

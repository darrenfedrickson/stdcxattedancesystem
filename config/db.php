<?php
// Set default timezone for PHP (Kuala Lumpur, UTC+8)
date_default_timezone_set('Asia/Kuala_Lumpur');

// (Local machine lockout removed to allow network access)

$host = '127.0.0.1';
$db   = 'attendance_system_db';
$user = 'root';
$pass = ''; // Default XAMPP password is empty
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    // Set default timezone for MySQL session (Kuala Lumpur, UTC+8)
    $pdo->exec("SET time_zone = '+08:00'");
} catch (\PDOException $e) {
    die("Database connection failed. Ensure MySQL is running, the database 'attendance_system_db' is created via setup.sql, and credentials are correct. Error: " . $e->getMessage());
}
?>

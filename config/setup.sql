CREATE DATABASE IF NOT EXISTS attendance_system_db;
USE attendance_system_db;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    action_type ENUM('clock_in', 'clock_out') NOT NULL,
    timestamp DATETIME NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

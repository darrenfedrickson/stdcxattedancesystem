<?php
require_once 'db.php';

$students = [
    "ADAM ZULKARNAIN BIN SYAMSUL HAFIZ",
    "ARIENA FARISHA BINTI ABDUL MURAD",
    "AVRIL ILHAM BIN HASNOL HISHAM",
    "NURELISA SHAFIYA BINTI MOHD ZAMRI",
    "AFIQ DANIEL BIN MAJDI",
    "AMI AFINA IZZATY BINTI AMIZAD",
    "DANIEL ISKANDAR BIN ROZAIMAN",
    "EMIR HARITH BIN AMIR NAZER",
    "FARID RIZWA BIN FARIZAL",
    "MUHAMAD ALLYSENDER BIN FAIZAL RIHAN",
    "MUHAMAD MUIZZUDDIN BIN MOHD SUHAIMI",
    "MUHAMMAD IZZAT IKHMAL BIN MOHD IZAMIR",
    "NAZRAN AZRIL BIN MOHD HAMIZI",
    "NUR HANIE AMIRA BINTI MOHD HANIF",
    "AMIRUL IMAN BIN ARIFF SHAFRIZAN",
    "DANIEL HARREZ BIN ZULKARNAIN",
    "HASMAWI BIN HASNAN",
    "MUHAMMAD HAFIZ BIN LATIFF",
    "MUHAMMAD NAZMI BIN MOHD NAZRI",
    "MUHAMMAD UMAR YAZID BIN NORAZAM"
];

try {
    $stmt = $pdo->prepare("INSERT INTO students (full_name) VALUES (?)");
    $added = 0;
    foreach ($students as $name) {
        $check = $pdo->prepare("SELECT id FROM students WHERE full_name = ?");
        $check->execute([$name]);
        if (!$check->fetch()) {
            $stmt->execute([$name]);
            $added++;
        }
    }
    echo "Successfully added $added new students to the registry.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

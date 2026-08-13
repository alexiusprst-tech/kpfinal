<?php
try {
    $db = new PDO('pgsql:host=127.0.0.1;dbname=kpfinal', 'postgres', 'admin123');
    echo 'Connected successfully';
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}

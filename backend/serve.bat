@echo off
echo ============================================
echo   Sistem Informasi Verifikasi Soal
echo   PHP 8.4 Development Server
echo ============================================
echo.
echo Starting server at http://127.0.0.1:8080
echo Press Ctrl+C to stop
echo.
if exist public\hot del /f /q public\hot
php -S 127.0.0.1:8080 -t public server.php

@echo off
echo ========================================
echo    SaraaTEK - Repair Management System
echo ========================================
echo.
echo Starting SaraaTEK...
echo.
cd /d "%~dp0.."
npm run tauri dev
pause

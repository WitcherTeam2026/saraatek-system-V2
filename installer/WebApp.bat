@echo off
echo ========================================
echo    SaraaTEK - Web APK Builder
echo ========================================
echo.
echo This creates a mobile-friendly web app
echo that can be installed as an APK.
echo.
echo Steps:
echo 1. Build the web app
echo 2. Open in browser
echo 3. Use Chrome menu ^> "Install app"
echo.
pause

cd /d "%~dp0.."

echo Building web app...
call npm run build

echo.
echo Starting local server...
echo.
echo OPEN IN CHROME: http://localhost:4173
echo.
echo Then in Chrome:
echo 1. Click 3-dot menu
echo 2. Click "Install app"
echo 3. App will work offline like native!
echo.
start http://localhost:4173
call npm run preview

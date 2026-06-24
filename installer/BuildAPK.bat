@echo off
echo ========================================
echo    SaraaTEK Mobile APK Builder
echo ========================================
echo.
echo This creates an APK from the web app.
echo.
echo Requirements:
echo - Node.js installed
echo - Java JDK 17+ installed
echo - Android SDK installed
echo.

cd /d "d:\opencode\saraaTEK"

:: Step 1: Build web app
echo [1/5] Building web app...
call npm run build
if %errorLevel% neq 0 (
    echo Build failed!
    pause
    exit /b
)
echo Web app built successfully!
echo.

:: Step 2: Create mobile project
echo [2/5] Setting up mobile project...
if not exist "mobile\node_modules" (
    cd mobile
    call npm install
    cd ..
)
echo Mobile project ready!
echo.

:: Step 3: Initialize Capacitor
echo [3/5] Initializing Capacitor...
cd mobile
if not exist "android" (
    call npx cap init saraatek com.saraatek.app --web-dir ../dist
    call npx cap add android
)
echo Capacitor initialized!
echo.

:: Step 4: Sync web app
echo [4/5] Syncing web app...
call npx cap sync android
echo Web app synced!
echo.

:: Step 5: Build APK
echo [5/5] Building APK...
echo This may take 5-10 minutes...
cd android
call gradlew.bat assembleDebug
cd ../..

echo.
echo ========================================
if exist "mobile\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo BUILD SUCCESSFUL!
    echo ========================================
    copy "mobile\android\app\build\outputs\apk\debug\app-debug.apk" "installer\SaraaTEK.apk"
    echo APK saved to: installer\SaraaTEK.apk
    start explorer "d:\opencode\saraaTEK\installer"
) else (
    echo BUILD FAILED - Check errors above
    echo ========================================
)
echo.
pause

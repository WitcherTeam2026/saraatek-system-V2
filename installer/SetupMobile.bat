@echo off
:: Auto-elevate to Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================
echo    SaraaTEK Mobile Setup - Step by Step
echo ========================================
echo.

cd /d "%~dp0.."

:: Step 1: Install Java
echo [Step 1] Checking Java...
java -version 2>nul
if %errorLevel% neq 0 (
    echo Java NOT found. Installing Java JDK 17...
    echo.
    winget install EclipseAdoptium.Temurin.17.JDK --accept-source-agreements --accept-package-agreements
    echo.
    echo IMPORTANT: Close and reopen this script after Java installs!
    echo Or run: refreshenv
    echo.
    pause
    exit /b
)
echo Java OK!
echo.

:: Step 2: Check Rust
echo [Step 2] Checking Rust...
rustc --version 2>nul
if %errorLevel% neq 0 (
    echo Rust NOT found!
    echo Please install Rust from: https://rustup.rs
    echo Download rustup-init.exe and run it
    start https://rustup.rs
    pause
    exit /b
)
echo Rust OK!
echo.

:: Step 3: Add Android targets
echo [Step 3] Adding Android targets...
rustup target add aarch64-linux-android 2>nul
rustup target add armv7-linux-androideabi 2>nul
rustup target add i686-linux-android 2>nul
rustup target add x86_64-linux-android 2>nul
echo Android targets OK!
echo.

:: Step 4: Check Android Studio
echo [Step 4] Checking Android Studio...
if not exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo Android Studio NOT found!
    echo.
    echo Please install Android Studio:
    echo 1. Download from: https://developer.android.com/studio
    echo 2. Run installer with default settings
    echo 3. Open Android Studio and complete setup wizard
    echo 4. Go to Tools ^> SDK Manager and install:
    echo    - Android SDK Platform 33
    echo    - Android SDK Build-Tools 33.0.0
    echo    - Android SDK Command-line Tools
    echo.
    start https://developer.android.com/studio
    pause
    exit /b
)
echo Android Studio OK!
echo.

:: Step 5: Set ANDROID_HOME
echo [Step 5] Setting ANDROID_HOME...
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
if not exist "%ANDROID_HOME%" (
    echo Android SDK not found at %ANDROID_HOME%
    echo Please open Android Studio and install SDK
    pause
    exit /b
)
echo ANDROID_HOME = %ANDROID_HOME%
echo.

:: Step 6: Initialize Tauri Android
echo [Step 6] Initializing Tauri Android...
if not exist "src-tauri\gen\android" (
    call npm run tauri android init
    if %errorLevel% neq 0 (
        echo Tauri init failed!
        pause
        exit /b
    )
) else (
    echo Tauri Android already initialized
)
echo.

:: Step 7: Build APK
echo [Step 7] Building APK...
echo This will take 5-10 minutes...
echo.
call npm run tauri android build -- --release

echo.
echo ========================================
if exist "src-tauri\gen\android\app\build\outputs\apk\release\app-release.apk" (
    echo BUILD SUCCESSFUL!
    echo ========================================
    copy "src-tauri\gen\android\app\build\outputs\apk\release\app-release.apk" "installer\SaraaTEK.apk"
    echo APK saved to: installer\SaraaTEK.apk
    start explorer "%~dp0"
) else (
    echo BUILD FAILED - Check errors above
    echo ========================================
)
echo.
pause

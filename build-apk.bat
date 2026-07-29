@echo off
REM ============================================
REM 健身训练记录 APK 构建脚本
REM ============================================
echo [1/6] 映射 Android SDK 到 X: 盘...
subst X: /d >nul 2>&1
subst X: "E:\C盘迁移\AndroidSDK\Sdk"
if %errorlevel% neq 0 (
    echo 错误：无法映射 Android SDK 盘符
    exit /b 1
)

echo [2/6] 复制项目到临时目录（避免中文路径问题）...
if exist "C:\temp\fitness\" rmdir /s /q "C:\temp\fitness\"
mkdir "C:\temp\fitness\"
xcopy /e /q /h "%~dp0." "C:\temp\fitness\" >nul

echo [3/6] 构建 Web 应用...
cd /d "C:\temp\fitness\"
call npm run build
if %errorlevel% neq 0 (
    echo 错误：Web 构建失败
    exit /b 1
)

echo [4/6] 同步 Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo 错误：Capacitor 同步失败
    exit /b 1
)

echo [5/6] 修复 Java 版本...
powershell -Command "(Get-Content 'C:\temp\fitness\node_modules\@capacitor\android\capacitor\build.gradle') -replace 'JavaVersion.VERSION_21', 'JavaVersion.VERSION_17' | Set-Content 'C:\temp\fitness\node_modules\@capacitor\android\capacitor\build.gradle'"

echo [6/6] 构建 APK...
cd /d "C:\temp\fitness\android\"
echo sdk.dir=X:\\> local.properties
set ANDROID_HOME=X:\
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot
call gradlew --stop >nul 2>&1
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo 错误：APK 构建失败
    exit /b 1
)

echo.
echo ============================================
echo 构建成功！
echo 复制 APK 到桌面...
copy /y "C:\temp\fitness\android\app\build\outputs\apk\debug\app-debug.apk" "C:\Users\LENOVO\Desktop\健身训练记录.apk" >nul
echo APK 已保存到桌面：健身训练记录.apk
echo ============================================

subst X: /d >nul 2>&1
pause

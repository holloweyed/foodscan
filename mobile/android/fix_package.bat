@echo off
set FILE=app\build\generated\rncli\src\main\java\com\facebook\react\PackageList.java
if exist %FILE% (
    powershell -Command "(Get-Content %FILE%) -replace 'import com.mrousavy.camera.example.CameraPackage;', 'import com.mrousavy.camera.CameraPackage;' | Set-Content %FILE%"
    echo Fixed!
) else (
    echo File not found, waiting...
)
gradlew installDebug
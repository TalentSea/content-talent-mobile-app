@echo off
setlocal enabledelayedexpansion
 
set EMULATOR=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe
 
echo Available Emulators:
echo.
 
set count=0
 
for /f "delims=" %%a in ('"%EMULATOR%" -list-avds') do (
    set /a count+=1
    set avd!count!=%%a
    echo !count!. %%a
)
 
echo.
set /p choice=Select emulator number: 
 
set AVD=!avd%choice%!
 
if "!AVD!"=="" (
    echo Invalid selection.
    exit /b 1
)
 
echo Launching !AVD!...
start "" "%EMULATOR%" -avd "!AVD!"
 
exit /b 0
 
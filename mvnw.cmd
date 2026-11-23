@REM ----------------------------------------------------------------------------
@REM ENSTEINSTORE Root Maven Wrapper Script for Windows
@REM Delegating to backend directory pom.xml
@REM ----------------------------------------------------------------------------
@echo off
setlocal

if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Java\jdk-25" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-25"
    )
)

if exist "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" (
    call "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" -f "%~dp0backend\pom.xml" %*
    exit /b %ERRORLEVEL%
)

where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    call mvn -f "%~dp0backend\pom.xml" %*
    exit /b %ERRORLEVEL%
)

echo ERROR: Maven binary not found. Please install Apache Maven or verify NetBeans Maven path.
exit /b 1

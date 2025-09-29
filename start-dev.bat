@echo off
echo Starting My Blog Development Environment...
echo.

REM 启动API服务器
echo Starting API Server...
cd myblog
start "API Server" cmd /k "npm run dev:server"

REM 等待2秒
timeout /t 2 /nobreak > nul

REM 启动前台
echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

REM 等待2秒
timeout /t 2 /nobreak > nul

REM 启动后台管理
echo Starting Admin Panel...
cd ..\myblog-admin
start "Admin Panel" cmd /k "npm run dev"

echo.
echo All services are starting up...
echo Frontend: http://localhost:5173
echo Admin Panel: http://localhost:5174
echo API Server: http://localhost:3001
echo.
pause
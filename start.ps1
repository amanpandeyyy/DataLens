# DataLens PowerShell Launcher
$env:Path = "C:\Users\ap640\.bin;" + $env:Path
$env:PYTHONPATH = (Join-Path $PSScriptRoot "backend")

Write-Host "Starting DataLens Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Users\ap640\.bin;' + `$env:Path; `$env:PYTHONPATH = '$((Join-Path $PSScriptRoot "backend").Replace('\', '/'))'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "Starting DataLens Frontend on http://127.0.0.1:5173..." -ForegroundColor Cyan
$frontendDir = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Users\ap640\.bin;' + `$env:Path; Set-Location '$frontendDir'; node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"

Write-Host "`nDataLens is launching at http://127.0.0.1:5173" -ForegroundColor Green
Start-Process "http://127.0.0.1:5173"


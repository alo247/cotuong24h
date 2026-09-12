@echo off
chcp 65001 > nul
echo ============================================================
echo  TU DONG WATCH & PUSH MA NGUON LEN GITHUB (AUTO-PUSH)
echo  Che do tu dong dong bo code len GitHub dang chay...
echo  (Nhan Ctrl+C de dung script nay)
echo ============================================================

:loop
git status --porcelain | findstr /R "." > nul
if %errorlevel% == 0 (
    echo [%date% %time%] Phat hien thay doi code! Dang push len GitHub...
    git add .
    git commit -m "Auto sync code: %date% %time%"
    git push origin main
    echo [%date% %time%] Da push thanh cong len GitHub!
)
timeout /t 5 /nobreak > nul
goto loop

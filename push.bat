@echo off
chcp 65001 > nul
echo ============================================================
echo  DONG BO MA NGUON LEN GITHUB (cotuong24h)
echo ============================================================
git add .
git commit -m "Auto update: %date% %time%"
git push -u origin main
echo.
echo [THANH CONG] Da cap nhat code len GitHub thanh cong!
pause

@echo off
REM ==============================
REM  SanxiaJCI - 原始碼部署 Cloud Run
REM  不用自己 docker build/push
REM ==============================

REM 基本設定
set PROJECT_ID=sanxiajci
set REGION=asia-east1
set SERVICE_NAME=sanxiajci-web

echo.
echo Project : %PROJECT_ID%
echo Region  : %REGION%
echo Service : %SERVICE_NAME%
echo.

REM 設定 gcloud 專案（只會影響這個 shell）
gcloud config set project %PROJECT_ID%

REM 直接用原始碼部署，Cloud Build 幫你 build image
gcloud run deploy %SERVICE_NAME% ^
  --source=. ^
  --region=%REGION% ^
  --platform=managed ^
  --allow-unauthenticated

IF ERRORLEVEL 1 (
  echo.
  echo [x] 部署失敗，請到 Cloud Logging 看詳細錯誤。
  exit /b 1
)

echo.
echo [✓] 部署完成！
exit /b 0

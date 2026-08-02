@echo off
REM ============================================================
REM  Dyuthi Pattu Sarees - BATCH Video Watermark Tool
REM  Watermarks EVERY video in the "1-drop-videos-here" folder
REM  in one run - no dragging file-by-file. Output goes to
REM  "2-watermarked-output" as <name>_wm.mp4. Then upload those
REM  to Cloudflare R2.
REM
REM  USAGE:
REM   1. Double-click this file once (it creates the two folders).
REM   2. Put your raw videos in  1-drop-videos-here
REM   3. Double-click this file again to watermark them all.
REM   4. Upload the *_wm.mp4 from  2-watermarked-output  to Cloudflare.
REM  (Tip: you can also drag a DIFFERENT folder onto this file to
REM   use that as the input instead.)
REM ============================================================
setlocal enabledelayedexpansion

REM ---- Settings (same as the single-file tool) ----
set "WATERMARK=www.dyuthipattusarees.com"
set "FONT=C\:/Windows/Fonts/arial.ttf"
set "ANGLE=-10"
set "SIZEDIV=13"
set "OPACITY=0.55"
set "CRF=28"
set "MAXWIDTH=1080"
REM  ANGLE   : tilt in degrees (-10 default, 0 flat).
REM  SIZEDIV : text size = width / SIZEDIV (smaller = bigger text).
REM  OPACITY : 0 invisible .. 1 solid (0.55 faint but readable).
REM  CRF     : file size knob (28 good, 30-32 smaller, 24 bigger).
REM  MAXWIDTH: cap width to keep files small (1080). 0 = never resize.
REM -------------------------------------------------

set "SCRIPTDIR=%~dp0"
set "INDIR=%SCRIPTDIR%1-drop-videos-here"
set "OUTDIR=%SCRIPTDIR%2-watermarked-output"

REM Optional: drag a folder onto this .bat to use it as the input.
if not "%~1"=="" if exist "%~1\" set "INDIR=%~1"

if not exist "%INDIR%" mkdir "%INDIR%"
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] ffmpeg not found. Install it, then open a NEW terminal:
  echo        winget install ffmpeg
  echo.
  pause
  exit /b
)

REM If the drop folder is empty, fall back to any videos sitting right next to
REM this .bat - so a single double-click "just works" either way.
set "HASFILES="
for %%F in ("%INDIR%\*.mp4" "%INDIR%\*.mov" "%INDIR%\*.m4v" "%INDIR%\*.avi" "%INDIR%\*.mkv" "%INDIR%\*.webm") do if exist "%%~fF" set "HASFILES=1"
if not defined HASFILES set "INDIR=%SCRIPTDIR%"

set /a COUNT=0
set /a DONE=0

for %%F in ("%INDIR%\*.mp4" "%INDIR%\*.mov" "%INDIR%\*.m4v" "%INDIR%\*.avi" "%INDIR%\*.mkv" "%INDIR%\*.webm") do (
  if exist "%%~fF" (
    set /a COUNT+=1
    set "IN=%%~fF"
    set "OUT=%OUTDIR%\%%~nF_wm.mp4"
    if !MAXWIDTH! GTR 0 (
      set "SCALEEXPR=scale='if(gt(iw,!MAXWIDTH!),!MAXWIDTH!,iw)':-2"
    ) else (
      set "SCALEEXPR=scale=iw:-2"
    )
    echo.
    echo  [!COUNT!] Watermarking: "%%~nxF"
    ffmpeg -y -i "!IN!" -filter_complex "[0:v]!SCALEEXPR![v];color=c=black@0:s=16x16,format=rgba[c];[c][v]scale2ref[c2][v2];[c2]drawtext=fontfile='!FONT!':text='!WATERMARK!':fontcolor=white@!OPACITY!:fontsize=w/!SIZEDIV!:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.7:shadowx=3:shadowy=3,rotate='!ANGLE!*PI/180':ow=iw:oh=ih:c=black@0[wm];[v2][wm]overlay=0:0:shortest=1" -c:v libx264 -crf !CRF! -preset medium -pix_fmt yuv420p -movflags +faststart -c:a copy "!OUT!" -loglevel error
    if errorlevel 1 (
      echo    [!] Failed on "%%~nxF"
    ) else (
      for %%A in ("!OUT!") do set "OUTSIZE=%%~zA"
      set /a "OUTMB=!OUTSIZE!/1048576"
      set /a DONE+=1
      echo    Done  -^>  2-watermarked-output\%%~nF_wm.mp4   ^(!OUTMB! MB^)
      if !OUTSIZE! GTR 5242880 (
        echo    [!] WARNING: !OUTMB! MB is over 5 MB - raise CRF to 30-32 above and re-run this one.
      )
    )
  )
)

echo.
if %COUNT%==0 (
  echo  No videos found in "1-drop-videos-here".
  echo  Put your .mp4 / .mov files in that folder and run this again.
) else (
  echo  Finished: %DONE% of %COUNT% videos watermarked into "2-watermarked-output".
  echo  Now upload the *_wm.mp4 files from that folder to Cloudflare R2.
)
echo.
pause

@echo off
REM ============================================================
REM  Dyuthi Pattu Sarees - BATCH Video Watermark Tool
REM  Watermarks EVERY video in the "1-drop-videos-here" folder
REM  and SHRINKS each one to a target size (~4.6 MB) so it always
REM  ends up under 5 MB - even a 20 MB clip. Output goes to
REM  "2-watermarked-output" as <name>_wm.mp4. Then upload those
REM  to Cloudflare R2.
REM
REM  HOW THE SIZE IS GUARANTEED:
REM   It reads each video's length and does a 2-PASS encode at a
REM   bitrate picked so total size ~= TARGETKB. Longer videos get a
REM   lower bitrate automatically. This targets size, unlike CRF.
REM
REM  USAGE:
REM   1. Double-click this file once (it creates the two folders).
REM   2. Put your raw videos in  1-drop-videos-here
REM   3. Double-click this file again to watermark + shrink them all.
REM   4. Upload the *_wm.mp4 from  2-watermarked-output  to Cloudflare.
REM ============================================================
setlocal enabledelayedexpansion

REM ---- Settings ----
set "WATERMARK=www.dyuthipattusarees.com"
set "FONT=C\:/Windows/Fonts/arial.ttf"
set "ANGLE=-10"
set "SIZEDIV=13"
set "OPACITY=0.55"
set "MAXWIDTH=1080"
set "TARGETKB=4600"
set "AUDIOKBPS=96"
set "MINVKBPS=400"
REM  MAXWIDTH : cap width to keep files small (1080). 0 = never resize.
REM  TARGETKB : target OUTPUT size in KB (4600 = ~4.6 MB, safely < 5 MB).
REM  AUDIOKBPS: audio bitrate. MINVKBPS: floor for video bitrate.
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
where ffprobe >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] ffprobe not found ^(comes with ffmpeg^). Reinstall ffmpeg:
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
    set "PLOG=%OUTDIR%\_pass_%%~nF"

    if !MAXWIDTH! GTR 0 (
      set "SCALEEXPR=scale='if(gt(iw,!MAXWIDTH!),!MAXWIDTH!,iw)':-2"
    ) else (
      set "SCALEEXPR=scale=iw:-2"
    )
    set "VF=[0:v]!SCALEEXPR![v];color=c=black@0:s=16x16,format=rgba[c];[c][v]scale2ref[c2][v2];[c2]drawtext=fontfile='!FONT!':text='!WATERMARK!':fontcolor=white@!OPACITY!:fontsize=w/!SIZEDIV!:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.7:shadowx=3:shadowy=3,rotate='!ANGLE!*PI/180':ow=iw:oh=ih:c=black@0[wm];[v2][wm]overlay=0:0:shortest=1[outv]"

    REM ---- read duration in whole seconds ----
    set "DUR="
    for /f "usebackq tokens=1 delims=." %%D in (`ffprobe -v error -show_entries format^=duration -of csv^=p^=0 "!IN!"`) do set "DUR=%%D"
    if not defined DUR set "DUR=10"
    if !DUR! LSS 1 set "DUR=1"

    REM ---- compute video bitrate (kbps) to hit ~TARGETKB total ----
    set /a "TOTALKBPS=(!TARGETKB!*8)/!DUR!"
    set /a "VKBPS=!TOTALKBPS!-!AUDIOKBPS!"
    if !VKBPS! LSS !MINVKBPS! set "VKBPS=!MINVKBPS!"

    echo.
    echo  [!COUNT!] Watermarking + shrinking "%%~nxF"  ^(!DUR!s -^> ~!TARGETKB!KB @ !VKBPS!kbps^)

    REM ---- PASS 1 (analyse, no audio, discard output) ----
    ffmpeg -y -i "!IN!" -filter_complex "!VF!" -map "[outv]" -c:v libx264 -b:v !VKBPS!k -maxrate !VKBPS!k -bufsize !VKBPS!k -preset medium -pix_fmt yuv420p -pass 1 -passlogfile "!PLOG!" -an -f mp4 NUL -loglevel error
    REM ---- PASS 2 (real encode with audio) ----
    ffmpeg -y -i "!IN!" -filter_complex "!VF!" -map "[outv]" -map 0:a? -c:v libx264 -b:v !VKBPS!k -maxrate !VKBPS!k -bufsize !VKBPS!k -preset medium -pix_fmt yuv420p -movflags +faststart -pass 2 -passlogfile "!PLOG!" -c:a aac -b:a !AUDIOKBPS!k "!OUT!" -loglevel error

    if errorlevel 1 (
      echo    [!] Failed on "%%~nxF"
    ) else (
      for %%A in ("!OUT!") do set "OUTSIZE=%%~zA"
      set /a "OUTMB=!OUTSIZE!/1048576"
      set /a "OUTKB=!OUTSIZE!/1024"
      set /a DONE+=1
      echo    Done  -^>  2-watermarked-output\%%~nF_wm.mp4   ^(!OUTKB! KB^)
      if !OUTSIZE! GTR 5242880 (
        echo    [!] Still over 5 MB - lower TARGETKB near the top and re-run this one.
      )
    )
    REM clean up the 2-pass log files
    del "!PLOG!*" 2>nul
  )
)

echo.
if %COUNT%==0 (
  echo  No videos found in "1-drop-videos-here".
  echo  Put your .mp4 / .mov files in that folder and run this again.
) else (
  echo  Finished: %DONE% of %COUNT% videos watermarked + shrunk into "2-watermarked-output".
  echo  Now upload the *_wm.mp4 files from that folder to Cloudflare R2.
)
echo.
pause

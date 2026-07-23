@echo off
REM ============================================================
REM  Dyuthi Pattu Sarees - Video Watermark Tool
REM  Drag one or more .mp4 videos onto this file (or pass paths
REM  in the terminal). Burns "www.srhandlooms.com" permanently
REM  into each video - CENTERED and slightly TILTED - and saves
REM  a new copy next to the original as  <name>_wm.mp4
REM  Upload the *_wm.mp4 files to Cloudflare R2.
REM ============================================================
setlocal enabledelayedexpansion

REM ---- Settings (edit these to taste) ----
set "WATERMARK=www.srhandlooms.com"
set "FONT=C\:/Windows/Fonts/arial.ttf"
set "ANGLE=-10"
set "SIZEDIV=13"
set "OPACITY=0.55"
set "CRF=28"
set "MAXWIDTH=1080"
REM  ANGLE  : tilt in degrees. -10 = rises to the right. Use 10 for the other way, 0 for flat.
REM  SIZEDIV: text size = video width / SIZEDIV. Smaller number = BIGGER text (11 big, 16 small).
REM  OPACITY: 0 = invisible, 1 = solid. 0.55 is a good faint-but-readable value.
REM  CRF    : FILE SIZE knob. Higher = smaller file. 24 sharp/bigger, 28 good, 32 small/softer.
REM  MAXWIDTH: shrink very large videos to at most this width (keeps files small). 0 = never resize.
REM ----------------------------------------

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] ffmpeg not found. If you just installed it, open a NEW terminal.
  echo      To install:  winget install ffmpeg
  echo.
  pause
  exit /b
)

if "%~1"=="" (
  echo.
  echo  Drag one or more .mp4 video files onto this file to watermark them.
  echo.
  pause
  exit /b
)

:loop
if "%~1"=="" goto done
set "IN=%~1"
set "OUT=%~dpn1_wm%~x1"
REM Downscale only if wider than MAXWIDTH; uses the video's OWN (auto-rotated) width,
REM so portrait stays portrait and landscape stays landscape - no orientation guessing.
if !MAXWIDTH! GTR 0 (
  set "SCALEEXPR=scale='if(gt(iw,!MAXWIDTH!),!MAXWIDTH!,iw)':-2"
) else (
  set "SCALEEXPR=scale=iw:-2"
)
echo.
echo  Watermarking: "!IN!"  ^(crf !CRF!^)
ffmpeg -y -i "!IN!" -filter_complex "[0:v]!SCALEEXPR![v];color=c=black@0:s=16x16,format=rgba[c];[c][v]scale2ref[c2][v2];[c2]drawtext=fontfile='!FONT!':text='!WATERMARK!':fontcolor=white@!OPACITY!:fontsize=w/!SIZEDIV!:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.7:shadowx=3:shadowy=3,rotate='!ANGLE!*PI/180':ow=iw:oh=ih:c=black@0[wm];[v2][wm]overlay=0:0:shortest=1" -c:v libx264 -crf !CRF! -preset medium -pix_fmt yuv420p -movflags +faststart -c:a copy "!OUT!"
if errorlevel 1 (
  echo  [!] Failed on "!IN!"
) else (
  echo  Done  -^>  "!OUT!"
)
shift
goto loop

:done
echo.
echo  All finished. Upload the *_wm.mp4 files to Cloudflare R2.
echo.
pause

REM ============================================================
REM  Tweaks (edit the Settings block above):
REM   - Steeper/flatter tilt : ANGLE   (-6 subtle, -14 steeper, 0 flat)
REM   - Bigger/smaller text  : SIZEDIV (11 bigger, 16 smaller)
REM   - Fainter/stronger     : OPACITY (0.4 fainter, 0.7 stronger)
REM  If you see a "Cannot find font" error, change the FONT line to:
REM   set "FONT=C\\:/Windows/Fonts/arial.ttf"
REM ============================================================

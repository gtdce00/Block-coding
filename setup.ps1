#Requires -Version 5.0
$ErrorActionPreference = "Stop"

$Src = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dest = Join-Path $env:LOCALAPPDATA "RobotMission3D"
$Icon = Join-Path $Dest "assets\ui\icon.ico"
$Launcher = Join-Path $Dest "start-game.bat"
$ShortcutName = "Robot Mission 3D.lnk"

Write-Host ""
Write-Host "  Robot Mission 3D  -  Setup"
Write-Host "  --------------------------"
Write-Host "  From: $Src"
Write-Host "  To:   $Dest"
Write-Host ""

New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$lbDest = Join-Path $Dest "data\leaderboard.json"
$keepLeaderboard = $false
$lbBackup = $null
if (Test-Path -LiteralPath $lbDest) {
  $keepLeaderboard = $true
  $lbBackup = Join-Path $env:TEMP "rm3d-leaderboard.json"
  Copy-Item -LiteralPath $lbDest -Destination $lbBackup -Force
}

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& robocopy $Src $Dest /E /XD .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
$copyCode = $LASTEXITCODE
$ErrorActionPreference = $prevEap
# robocopy exit 0-7 = success
if ($copyCode -ge 8) {
  Write-Host "  [!] Copy failed (robocopy $copyCode)"
  exit 1
}

if ($keepLeaderboard -and (Test-Path -LiteralPath $lbBackup)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $lbDest) | Out-Null
  Copy-Item -LiteralPath $lbBackup -Destination $lbDest -Force
  Remove-Item -LiteralPath $lbBackup -Force -ErrorAction SilentlyContinue
}

function New-GameShortcut([string]$Path) {
  $shell = New-Object -ComObject WScript.Shell
  $sc = $shell.CreateShortcut($Path)
  # Target cmd.exe so Windows shows the custom .ico instead of the .bat glyph.
  $sc.TargetPath = Join-Path $env:SystemRoot "System32\cmd.exe"
  $sc.Arguments = "/c `"$Launcher`""
  $sc.WorkingDirectory = $Dest
  $sc.WindowStyle = 1
  $sc.Description = "Robot Mission 3D - Forest Adventure"
  if (Test-Path -LiteralPath $Icon) {
    $sc.IconLocation = "$Icon,0"
  }
  $sc.Save()
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$PublicDesktop = [Environment]::GetFolderPath("CommonDesktopDirectory")
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"

New-GameShortcut (Join-Path $Desktop $ShortcutName)
if (Test-Path -LiteralPath $PublicDesktop) {
  try { New-GameShortcut (Join-Path $PublicDesktop $ShortcutName) } catch { }
}
New-Item -ItemType Directory -Force -Path $StartMenu | Out-Null
New-GameShortcut (Join-Path $StartMenu $ShortcutName)

$pyOk = $false
foreach ($cmd in @("py", "python", "python3")) {
  $found = Get-Command $cmd -ErrorAction SilentlyContinue
  if ($found) { $pyOk = $true; break }
}

Write-Host "  Created desktop shortcut: $ShortcutName"
Write-Host "  Created Start Menu shortcut"
Write-Host ""
if (-not $pyOk) {
  Write-Host "  [!] Python not found. Install from https://www.python.org/downloads/"
  Write-Host "      Check 'Add python.exe to PATH' during setup."
  Write-Host ""
} else {
  Write-Host "  Python is ready. Double-click the desktop icon to play."
  Write-Host ""
}
Write-Host "  Host PC: keep the server window open."
Write-Host "  Other PCs: open the LAN URL shown in that window."
Write-Host ""

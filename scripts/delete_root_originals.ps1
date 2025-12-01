<#
Deletes specified root blog original files. Intended to be run after a retention period.

Usage:
  - Interactive (confirmation): .\scripts\delete_root_originals.ps1
  - Non-interactive + commit: .\scripts\delete_root_originals.ps1 -Confirm:$true -Commit:$true

This script deletes the root HTML files listed in $targets and writes a log to `backup/delete-log.txt`.
If `-Commit $true` is passed and `git` is available, the script will run `git rm` and commit the deletion. Pushing requires valid Git credentials.
#>

[CmdletBinding()]
param(
  [switch]$Confirm,
  [switch]$Commit
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$targets = @(
  "blog-phonetech-safety-20251115.html",
  "blog-phonetech-20251121.html",
  "blog-phonetech-20251115.html",
  "blog-2025-11-30.html"
)

$logDir = Join-Path $repoRoot 'backup'
if (-not (Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory | Out-Null }
$logFile = Join-Path $logDir "delete-log-$(Get-Date -Format yyyyMMdd-HHmmss).log"

function Write-Log($msg) {
  $line = "$(Get-Date -Format o) - $msg"
  $line | Out-File -FilePath $logFile -Append -Encoding utf8
  Write-Output $msg
}

Write-Log "Starting root originals deletion script"

foreach ($f in $targets) {
  $path = Join-Path $repoRoot $f
  if (Test-Path $path) {
    if ($Confirm) {
      Write-Log "Deleting file: $path"
      Remove-Item -Path $path -Force
    } else {
      # interactive confirmation if stdin attached
      $answer = Read-Host "Delete $f? Type 'yes' to confirm"
      if ($answer -eq 'yes') { Remove-Item -Path $path -Force; Write-Log "Deleted: $path" } else { Write-Log "Skipped: $path" }
    }
  } else {
    Write-Log "Not found (skipped): $path"
  }
}

if ($Commit) {
  try {
    Push-Location $repoRoot
    git --version > $null 2>&1
    Write-Log "Running git rm and commit"
    git rm @($targets) | Out-Null
    git commit -m "chore: remove archived root blog originals after retention" | Out-Null
    Write-Log "Committed deletions. Note: pushing to remote will require credentials; run 'git push' manually if desired."
    Pop-Location
  } catch {
    Write-Log "Git commit failed or git not available: $_"
    Pop-Location
  }
}

Write-Log "Deletion script finished"

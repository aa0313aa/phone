<#
Create a ZIP backup of `backup/` contents.

Usage: Open PowerShell in repo root and run:
  .\scripts\create_backup.ps1

This script creates `backup-YYYYMMDD-HHMMSS.zip` in the repo root.
#>

Param()

$now = Get-Date -Format "yyyyMMdd-HHmmss"
$zipName = "backup-$now.zip"
$backupDir = Join-Path -Path (Get-Location) -ChildPath "backup"

if (-Not (Test-Path -Path $backupDir)) {
    Write-Error "Backup directory not found: $backupDir"
    exit 2
}

$zipPath = Join-Path -Path (Get-Location) -ChildPath $zipName

Write-Output "Creating zip: $zipPath from folder: $backupDir"

if (Test-Path -Path $zipPath) { Remove-Item -Path $zipPath -Force }

Compress-Archive -Path (Join-Path $backupDir '*') -DestinationPath $zipPath -Force

if (Test-Path -Path $zipPath) {
    $size = (Get-Item $zipPath).Length
    Write-Output "Backup created: $zipPath ($([math]::Round($size/1KB,2)) KB)"
    exit 0
} else {
    Write-Error "Failed to create backup zip."
    exit 1
}

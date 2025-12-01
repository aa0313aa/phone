<#
Schedule a one-time task to run `delete_root_originals.ps1` after N days (default 7).

Usage:
  .\scripts\schedule_delete_root_posts.ps1 [-Days 7]

This uses `schtasks` to create a one-time task that executes PowerShell to run the delete script.
Requires appropriate permissions to create scheduled tasks.
#>

param(
  [int]$Days = 7
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$scriptPath = Join-Path $repoRoot 'scripts\delete_root_originals.ps1'

if (-not (Test-Path $scriptPath)) {
  Write-Error "Delete script not found: $scriptPath"
  exit 2
}

$runDate = (Get-Date).AddDays($Days)
$time = '03:00' # time of day to run (03:00)
$schtasksTime = $runDate.ToString('HH:mm')
$schtasksDate = $runDate.ToString('MM/dd/yyyy')

$taskName = "DeleteRootBlogOriginals_$(Get-Date -Format yyyyMMdd_HHmmss)"
$action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Confirm:`$true -Commit:`$true"

Write-Output "Scheduling task '$taskName' to run on $schtasksDate at $schtasksTime"

$cmd = "schtasks /Create /SC ONCE /TN `"$taskName`" /TR `"$action`" /ST $schtasksTime /SD $schtasksDate /F"

Write-Output "Running: $cmd"
try {
  $proc = Start-Process -FilePath schtasks -ArgumentList "/Create","/SC","ONCE","/TN","$taskName","/TR","$action","/ST","$schtasksTime","/SD","$schtasksDate","/F" -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -eq 0) { Write-Output "Scheduled task created: $taskName"; exit 0 } else { Write-Error "schtasks returned exit code $($proc.ExitCode)"; exit $proc.ExitCode }
} catch {
  Write-Error "Failed to create scheduled task: $_"
  exit 1
}

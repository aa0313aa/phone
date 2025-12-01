<#
.SYNOPSIS
  blog 폴더를 ZIP으로 묶어 업로드용 아카이브를 생성합니다.

.PARAMETER Output
  생성할 ZIP 경로(옵션). 지정하지 않으면 repo 루트의 backup 폴더에 타임스탬프ed 파일이 생성됩니다.

.EXAMPLE
  .\package_blog_for_upload.ps1
  .\package_blog_for_upload.ps1 -Output "C:\tmp\blog-upload.zip"
#>

param(
    [string]$Output
)

$RepoRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition | Resolve-Path
$BlogDir = Join-Path $RepoRoot 'blog'
$BackupDir = Join-Path $RepoRoot 'backup'

if (-not (Test-Path $BlogDir)) {
    Write-Error "blog 폴더를 찾을 수 없습니다: $BlogDir"
    exit 1
}

if (-not $Output) {
    if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    $Output = Join-Path $BackupDir "blog-$ts.zip"
}

# Remove existing file if present
if (Test-Path $Output) { Remove-Item $Output -Force }

Write-Output "아카이브 생성중: '$Output' (원본: $BlogDir)"
try {
    Compress-Archive -Path (Join-Path $BlogDir '*') -DestinationPath $Output -Force
    Write-Output "완료: $Output"
    exit 0
} catch {
    Write-Error "압축 실패: $($_.Exception.Message)"
    exit 2
}

# Image conversion script (PNG -> WebP) using ImageMagick
# Usage: Open PowerShell, cd to repo root, then:
#   .\scripts\convert_images.ps1

$images = @(
  "assets/img/og-banner.png",
  "assets/img/blog/2.png",
  "assets/img/blog/3.png",
  "assets/img/blog/4.png"
)

if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
  Write-Host "Error: 'magick' (ImageMagick) not found in PATH. Install ImageMagick and ensure 'magick' is available." -ForegroundColor Red
  exit 1
}

foreach ($img in $images) {
  if (Test-Path $img) {
    $webp = [System.IO.Path]::ChangeExtension($img, ".webp")
    Write-Host "Converting $img -> $webp"
    magick convert $img -quality 85 $webp
    if (Test-Path $webp) { Write-Host "Created $webp" -ForegroundColor Green }
  } else {
    Write-Host "Missing file: $img - skipping" -ForegroundColor Yellow
  }
}

Write-Host "Done. If files were created, commit the new .webp files and push to repo." -ForegroundColor Cyan

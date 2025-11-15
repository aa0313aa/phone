# 이미지 WebP 변환 가이드

이 프로젝트에서 WebP를 우선 제공하도록 `picture` 태그를 적용했습니다. WebP 파일을 생성하려면 로컬에서 ImageMagick을 설치한 뒤 스크립트를 실행하세요.

1) ImageMagick 설치
- Windows: https://imagemagick.org/script/download.php
- 설치 시 'Add to PATH' 옵션을 선택하거나, 설치 후 `magick` 명령을 PATH에서 사용할 수 있도록 설정하세요.

2) 변환 스크립트 실행
- PowerShell에서 프로젝트 루트로 이동한 뒤:

```powershell
cd "C:\Users\<your>\OneDrive\바탕 화면\pone"
.\scripts\convert_images.ps1
```

- 스크립트는 다음 파일들을 변환합니다:
  - `assets/img/og-banner.png` -> `assets/img/og-banner.webp`
  - `assets/img/blog/2.png` -> `assets/img/blog/2.webp`
  - `assets/img/blog/3.png` -> `assets/img/blog/3.webp`
  - `assets/img/blog/4.png` -> `assets/img/blog/4.webp`

3) 커밋 및 푸시
- 변환 후에는 생성된 `.webp` 파일을 git에 추가하고 커밋·푸시하세요.

```powershell
git add assets/img/*.webp
git commit -m "chore(images): add webp versions for blog images"
git push origin main
```

4) 브라우저 캐시 주의
- 새 이미지를 업로드한 뒤 캐시 문제로 오래된 이미지가 보일 수 있습니다. 강력 새로고침(Shift+F5) 또는 캐시 무시 모드로 확인하세요.

5) 자동화(선택)
- CI/CD에서 ImageMagick을 이용해 빌드 중에 변환하도록 설정하면 로컬 변환 단계가 불필요합니다. GitHub Actions 예시는 필요하면 제공해 드립니다.

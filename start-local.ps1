$ErrorActionPreference = 'Stop'
$siteRoot = $PSScriptRoot

$pythonLauncher = Get-Command py -ErrorAction SilentlyContinue
if ($pythonLauncher) {
    Write-Host 'OpoClaro disponible en http://localhost:8000/ (Ctrl+C para detener).'
    & $pythonLauncher.Source -m http.server 8000 --bind 127.0.0.1 --directory $siteRoot
    exit $LASTEXITCODE
}

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python -and $python.Source -notlike '*\Microsoft\WindowsApps\python.exe') {
    Write-Host 'OpoClaro disponible en http://localhost:8000/ (Ctrl+C para detener).'
    & $python.Source -m http.server 8000 --bind 127.0.0.1 --directory $siteRoot
    exit $LASTEXITCODE
}

$python3 = Get-Command python3 -ErrorAction SilentlyContinue
if ($python3) {
    Write-Host 'OpoClaro disponible en http://localhost:8000/ (Ctrl+C para detener).'
    & $python3.Source -m http.server 8000 --bind 127.0.0.1 --directory $siteRoot
    exit $LASTEXITCODE
}

Write-Error 'No se encontró Python. Instala Python 3 o abre index.html directamente en el navegador.'

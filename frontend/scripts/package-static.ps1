$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$projectRoot = Split-Path -Parent $PSScriptRoot
$distRoot = (Resolve-Path -LiteralPath (Join-Path $projectRoot 'dist')).Path
$zipPath = Join-Path $projectRoot 'youthglobalclub.com-static.zip'
$zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
$zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $distRoot -File -Recurse | ForEach-Object {
    $entryName = $_.FullName.Substring($distRoot.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArchive, $_.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally {
  $zipArchive.Dispose()
  $zipStream.Dispose()
}

$verifiedZip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entries = @($verifiedZip.Entries.FullName)
  if (-not ($entries -contains 'index.html')) { throw 'index.html must be at archive root' }
  if ($entries | Where-Object { $_ -match '\\|^dist/|\.env|node_modules|^src/' }) { throw 'Unexpected archive entries' }
  $entries
} finally {
  $verifiedZip.Dispose()
}
Get-Item -LiteralPath $zipPath | Select-Object Name,Length

param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

$content = Get-Content -LiteralPath $Path
$content = $content -replace '^pick 4a7f6fc', 'edit 4a7f6fc'
$content = $content -replace '^pick 6e4d490', 'fixup 6e4d490'
Set-Content -LiteralPath $Path -Value $content

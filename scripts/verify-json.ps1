# Verification pass: JSON-LD parses, one H1 per page, form tags balanced.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Path $root -Filter *.html -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\\.git\\' }

$problems = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
    $rel = $file.FullName.Substring($root.Length + 1)
    $text = [System.IO.File]::ReadAllText($file.FullName, $utf8)

    $h1 = ([regex]::Matches($text, '<h1\b')).Count
    if ($h1 -ne 1) { $problems.Add("$rel : h1 count = $h1") }

    $openForms = ([regex]::Matches($text, '<form\b')).Count
    $closeForms = ([regex]::Matches($text, '</form>')).Count
    if ($openForms -ne $closeForms) { $problems.Add("$rel : form tags $openForms open / $closeForms close") }

    $blocks = [regex]::Matches($text, '(?s)<script type="application/ld\+json">(.*?)</script>')
    $i = 0
    foreach ($block in $blocks) {
        $i++
        try {
            $null = $block.Groups[1].Value | ConvertFrom-Json
        } catch {
            $problems.Add("$rel : JSON-LD block $i failed to parse - $($_.Exception.Message)")
        }
    }
}

if ($problems.Count -eq 0) {
    Write-Output "OK: $($files.Count) HTML files checked, JSON-LD valid, one H1 each, forms balanced."
} else {
    $problems | ForEach-Object { Write-Output "PROBLEM: $_" }
    Write-Output "Total problems: $($problems.Count)"
}

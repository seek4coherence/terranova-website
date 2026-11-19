# Verification pass: internal links, nav/footer entries, email typos.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Path $root -Filter *.html -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\\.git\\' }

$problems = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
    $rel = $file.FullName.Substring($root.Length + 1)
    $text = [System.IO.File]::ReadAllText($file.FullName, $utf8)

    # Nav must contain exactly one Locations link (breadcrumbs are outside <nav>).
    $navMatch = [regex]::Match($text, '(?s)<nav\b.*?</nav>')
    if (-not $navMatch.Success) {
        $problems.Add("$rel : no <nav> block found")
    } else {
        $navCount = ([regex]::Matches($navMatch.Value, 'href="/locations/">Locations</a>')).Count
        if ($navCount -ne 1) { $problems.Add("$rel : nav Locations link count = $navCount") }
    }

    # Pages with a full footer grid must link to the locations hub.
    if ($text -match 'class="footer-grid') {
        $footCount = ([regex]::Matches($text, 'href="/locations/">Service Areas</a>')).Count
        if ($footCount -ne 1) { $problems.Add("$rel : footer Service Areas link count = $footCount") }
    }

    # Email typos
    foreach ($m in [regex]::Matches($text, 'mailto:([^"]+)')) {
        if ($m.Groups[1].Value -ne 'jimmy@terranovaequityllc.com') {
            $problems.Add("$rel : unexpected mailto $($m.Groups[1].Value)")
        }
    }

    # Internal links resolve
    foreach ($m in [regex]::Matches($text, 'href="(/[^"#?]*)"')) {
        $target = $m.Groups[1].Value
        if ($target -eq '/') { continue }
        $candidate = Join-Path $root ($target.TrimStart('/') -replace '/', '\')
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { continue }
        if (Test-Path -LiteralPath $candidate -PathType Container) {
            if (Test-Path -LiteralPath (Join-Path $candidate 'index.html')) { continue }
        }
        $problems.Add("$rel : broken link $target")
    }
}

if ($problems.Count -eq 0) {
    Write-Output "OK: $($files.Count) HTML files checked, no problems found."
} else {
    $problems | ForEach-Object { Write-Output "PROBLEM: $_" }
    Write-Output "Total problems: $($problems.Count)"
}

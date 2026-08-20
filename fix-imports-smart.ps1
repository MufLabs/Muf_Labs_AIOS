$pkgs = @('database','llm','shared','kernel','workflow','agents','tbit-core')

function FixImportsInFile($filePath) {
    $content = Get-Content $filePath -Raw
    if ([string]::IsNullOrWhiteSpace($content)) { return }
    
    $lines = $content -split "`r?`n"
    $modified = $false
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match 'from\s+"(\.{1,2}/[^"]+)"') {
            $importPath = $matches[1]
            if ($importPath -match '\.(js|json)$') { continue }
            $lastPart = $importPath.Split('/')[-1]
            if ($lastPart -notmatch '\.') {
                $resolvedPath = Join-Path (Split-Path $filePath) $importPath
                $resolvedPath = Resolve-Path $resolvedPath -ErrorAction SilentlyContinue
                if ($resolvedPath -and (Test-Path (Join-Path $resolvedPath "index.ts"))) {
                    continue
                }
            }
            $tsPath = Join-Path (Split-Path $filePath) ($importPath + ".ts")
            $tsPath = Resolve-Path $tsPath -ErrorAction SilentlyContinue
            if ($tsPath -and (Test-Path $tsPath)) {
                $oldImport = 'from "' + $importPath + '"'
                $newImport = 'from "' + $importPath + '.js"'
                $lines[$i] = $line -replace [regex]::Escape($oldImport), $newImport
                $modified = $true
            }
        }
    }
    
    if ($modified) {
        $newContent = $lines -join "`n"
        Set-Content $filePath -Value $newContent
        Write-Host "Fixed $filePath"
    }
}

foreach ($p in $pkgs) {
    $dir = "d:\ai_tools\Muf_labs\packages\$p\src"
    if (Test-Path $dir) {
        Get-ChildItem $dir -Recurse -Filter *.ts | Where-Object { 
            $_.Name -notmatch '\.test\.ts$' -and $_.Name -notmatch '\.d\.ts$' 
        } | ForEach-Object { 
            FixImportsInFile $_.FullName
        }
    }
}
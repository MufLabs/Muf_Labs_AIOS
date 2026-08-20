$pkgs = @('database','llm','shared','kernel','workflow','agents','tbit-core')

foreach ($p in $pkgs) {
    $dir = "d:\ai_tools\Muf_labs\packages\$p\src"
    if (Test-Path $dir) {
        Get-ChildItem $dir -Recurse -Filter *.ts | Where-Object { 
            $_.Name -notmatch '\.test\.ts$' -and $_.Name -notmatch '\.d\.ts$' 
        } | ForEach-Object { 
            $content = Get-Content $_.FullName -Raw
            # Only add .js to relative imports that don't already have .js or .json and don't end with / (directory imports)
            $newContent = [regex]::Replace($content, 'from "(\.{1,2}/[^"\\]+?)(?<!\.js)(?<!\.json)(?<!/)"', 'from "$1.js"')
            if ($content -ne $newContent) { 
                Set-Content $_.FullName -Value $newContent
                Write-Host "Fixed $p/$($_.Name)"
            } 
        }
    }
}
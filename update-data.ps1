<#
.SYNOPSIS
    Regenerates the dashboard data file (data/uk-profits-data.js) from the source CSV.

.DESCRIPTION
    Reads data/uk-profits-data.csv, converts the dates from DD/MM/YYYY to ISO
    (YYYY-MM-DD), and writes the JavaScript payload consumed by the dashboard
    (window.UK_PROFITS_DATA). Run this whenever you have refreshed the CSV.

.EXAMPLE
    ./update-data.ps1

    Uses the default CSV/JS paths next to this script.

.EXAMPLE
    ./update-data.ps1 -CsvPath "C:\path\to\new-data.csv"

    Uses a CSV from a custom location.
#>

[CmdletBinding()]
param(
    [string]$CsvPath,
    [string]$JsPath
)

$ErrorActionPreference = "Stop"

# Resolve paths relative to this script so it works regardless of the
# current working directory.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $scriptDir "data"
if (-not $CsvPath) { $CsvPath = Join-Path $dataDir "uk-profits-data.csv" }
if (-not $JsPath)  { $JsPath  = Join-Path $dataDir "uk-profits-data.js" }

if (-not (Test-Path $CsvPath)) {
    throw "CSV file not found: $CsvPath"
}

$rows = Import-Csv -Path $CsvPath
if (-not $rows) {
    throw "CSV contains no data rows: $CsvPath"
}

# Expected columns from the source CSV.
$required = @("date", "quarter", "ls", "ps", "cs", "goss")
$actual = ($rows | Select-Object -First 1).PSObject.Properties.Name
$missing = $required | Where-Object { $_ -notin $actual }
if ($missing) {
    throw "CSV is missing expected column(s): $($missing -join ', '). Found: $($actual -join ', ')"
}

$culture = [System.Globalization.CultureInfo]::InvariantCulture
$sb = New-Object System.Text.StringBuilder

foreach ($r in $rows) {
    # Convert DD/MM/YYYY -> YYYY-MM-DD.
    $parts = $r.date -split '/'
    if ($parts.Count -ne 3) {
        throw "Unexpected date format '$($r.date)'. Expected DD/MM/YYYY."
    }
    $iso = '{0}-{1}-{2}' -f $parts[2], $parts[1], $parts[0]

    # Parse numeric values with the invariant culture so '.' is the decimal point.
    $ls   = [double]::Parse($r.ls,   $culture)
    $ps   = [double]::Parse($r.ps,   $culture)
    $cs   = [double]::Parse($r.cs,   $culture)
    $goss = [double]::Parse($r.goss, $culture)

    [void]$sb.Append(('{{"date":"{0}","quarter":"{1}","ls":{2},"ps":{3},"cs":{4},"goss":{5}}},' -f `
        $iso, $r.quarter,
        $ls.ToString($culture),
        $ps.ToString($culture),
        $cs.ToString($culture),
        $goss.ToString($culture)))
}

$body = $sb.ToString().TrimEnd(',')
$out = "window.UK_PROFITS_DATA = [$body];"

Set-Content -Path $JsPath -Value $out -NoNewline -Encoding UTF8

Write-Host "Updated $JsPath"
Write-Host "  Rows written: $($rows.Count)"
Write-Host "  First quarter: $(($rows | Select-Object -First 1).quarter)"
Write-Host "  Last quarter:  $(($rows | Select-Object -Last 1).quarter)"
Write-Host ""
Write-Host "Remember to update the date-range label in index.html if the last quarter changed."

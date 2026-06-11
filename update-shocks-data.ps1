<#
.SYNOPSIS
    Regenerates the energy-shock data file (data/uk-profits-energy-shocks.js) from the source CSV.

.DESCRIPTION
    Reads data/uk-profits-energy-shocks.csv and writes the JavaScript payload
    consumed by the dashboard (window.UK_ENERGY_SHOCKS_DATA). The cumulative-change
    columns are mapped to the dashboard's share keys as follows:

        cgls   -> ls   (labour share)
        cgps   -> ps   (pure profit share)
        cgcs   -> cs   (capital share)
        cggoss -> goss (gross operating surplus share)

    Run this whenever you have refreshed the CSV.

.EXAMPLE
    ./update-shocks-data.ps1

    Uses the default CSV/JS paths next to this script.

.EXAMPLE
    ./update-shocks-data.ps1 -CsvPath "C:\path\to\new-shocks.csv"

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
if (-not $CsvPath) { $CsvPath = Join-Path $scriptDir "data\uk-profits-energy-shocks.csv" }
if (-not $JsPath)  { $JsPath  = Join-Path $scriptDir "data\uk-profits-energy-shocks.js" }

if (-not (Test-Path $CsvPath)) {
    throw "CSV file not found: $CsvPath"
}

$rows = Import-Csv -Path $CsvPath

# Expected columns from the source CSV.
$required = @("shock", "quarter", "period", "cgls", "cgcs", "cgps", "cggoss")
$actual = ($rows | Select-Object -First 1).PSObject.Properties.Name
$missing = $required | Where-Object { $_ -notin $actual }
if ($missing) {
    throw "CSV is missing expected column(s): $($missing -join ', '). Found: $($actual -join ', ')"
}

$culture = [System.Globalization.CultureInfo]::InvariantCulture
$sb = New-Object System.Text.StringBuilder

foreach ($r in $rows) {
    # Parse numeric values with the invariant culture so '.' is the decimal point.
    # Map cumulative-change columns to the dashboard share keys.
    $period = [int]::Parse($r.period, $culture)
    $ls     = [double]::Parse($r.cgls,   $culture)
    $ps     = [double]::Parse($r.cgps,   $culture)
    $cs     = [double]::Parse($r.cgcs,   $culture)
    $goss   = [double]::Parse($r.cggoss, $culture)

    [void]$sb.Append(('{{"shock":"{0}","quarter":"{1}","period":{2},"ls":{3},"ps":{4},"cs":{5},"goss":{6}}},' -f `
        $r.shock, $r.quarter, $period,
        $ls.ToString($culture),
        $ps.ToString($culture),
        $cs.ToString($culture),
        $goss.ToString($culture)))
}

$body = $sb.ToString().TrimEnd(',')
$out = "window.UK_ENERGY_SHOCKS_DATA = [$body];"

Set-Content -Path $JsPath -Value $out -NoNewline -Encoding UTF8

$shocks = $rows | Select-Object -ExpandProperty shock -Unique

Write-Host "Updated $JsPath"
Write-Host "  Rows written: $($rows.Count)"
Write-Host "  Shocks: $($shocks -join ', ')"

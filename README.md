# UK Profitability Dashboard

An interactive data dashboard visualising UK labour, pure profit, and capital shares in corporate gross value added, from 1970 onwards.

> **Citation:** Manuel, E., S. Piton and I. Yotzov (2024), "Firms' margins behaviour in response to energy shocks: Evidence from the UK", *Economics Letters* 235, 111506.

---

## Getting Started

No build step or server is required — the dashboard is a static HTML/CSS/JS application.

- Open `index.html` in any modern web browser.

---

## Project Structure

```
profit-shares-dashboard/
├── index.html                       # Dashboard layout and markup
├── styles.css                       # Styling and responsive layout
├── app.js                           # Interaction logic and chart rendering
├── update-data.ps1                  # Regenerates the series data file from its CSV
├── update-shocks-data.ps1           # Regenerates the energy-shock data file from its CSV
├── data/
│   ├── uk-profits-data.csv          # Series source data (edit this each update)
│   ├── uk-profits-data.js           # Generated series data consumed by the dashboard
│   ├── uk-profits-energy-shocks.csv # Energy-shock source data (edit this each update)
│   └── uk-profits-energy-shocks.js  # Generated energy-shock data consumed by the dashboard
└── README.md
```

The dashboard reads its data from the generated `.js` files in `data/`, which are **generated** from the matching `.csv` files. Do not edit the `.js` files by hand — update the CSV and regenerate.

---

## Data Format

`data/uk-profits-data.csv` must contain the following columns:

| Column    | Description                              | Example     |
|-----------|------------------------------------------|-------------|
| `date`    | Quarter start date, `DD/MM/YYYY`         | `01/10/2025`|
| `quarter` | Quarter label                            | `2025Q4`    |
| `ls`      | Labour share (%)                         | `69.6823`   |
| `ps`      | Pure profit share (%)                    | `17.1098`   |
| `cs`      | Capital share (%)                        | `13.2078`   |
| `goss`    | Gross operating surplus share (%)        | `30.3177`   |

### Energy-shock data

The **Energy shocks** tab compares how each share evolved after three historical energy shocks (1973Q4, 1979Q4, 2022Q1), aligned so that quarter 0 is the start of each shock.

`data/uk-profits-energy-shocks.csv` must contain the following columns:

| Column    | Description                                                   | Example     |
|-----------|---------------------------------------------------------------|-------------|
| `shock`   | Shock identifier (the quarter the shock began)                | `2022Q1`    |
| `dateq`   | Quarter start date, `DD/MM/YYYY` (not used by the dashboard)   | `01/01/2022`|
| `quarter` | Quarter label                                                 | `2022Q1`    |
| `period`  | Quarters since the shock began (0 = shock quarter)            | `0`         |
| `cgls`    | Cumulative change in labour share (percentage points)         | `1.68`      |
| `cgcs`    | Cumulative change in capital share (percentage points)        | `7.34`      |
| `cgps`    | Cumulative change in pure profit share (percentage points)    | `-9.02`     |
| `cggoss`  | Cumulative change in gross operating surplus share (pp)       | `-1.68`     |

When generating the JS file, the cumulative-change columns are mapped to the dashboard's share keys: `cgls → ls`, `cgps → ps`, `cgcs → cs`, `cggoss → goss`.

## Updating the Dashboard

When new data is released, follow these steps:

1. **Replace the source CSV.** Overwrite `data/uk-profits-data.csv` with the latest export, keeping the same column layout described above. Note that historical values may be revised, so replace the whole file rather than appending only the new rows.

2. **Regenerate the data file.** From the project root, run the script in PowerShell:

   ```powershell
   .\update-data.ps1
   ```

   This reads the CSV, converts the dates to ISO format, and overwrites `data/uk-profits-data.js`. On success it prints the number of rows written and the first and last quarters, for example:

   ```
   Updated ...\data\uk-profits-data.js
     Rows written: 224
     First quarter: 1970Q1
     Last quarter:  2025Q4
   ```

   To use a CSV from a different location:

   ```powershell
   .\update-data.ps1 -CsvPath "C:\path\to\new-data.csv"
   ```

3. **Update the date-range label.** If the last quarter has changed, edit `index.html` and update the underlying-data link text:

   ```html
   <a href="...">Historical Shares, 1970Q1-2025Q4</a>
   ```

   Change `2025Q4` to the new latest quarter.

4. **Check the result.** Open `index.html` in a browser and confirm the chart, range slider, and data table reflect the latest series.

### Updating the energy-shock data

1. **Replace the source CSV.** Overwrite `data/uk-profits-energy-shocks.csv` with the latest data, keeping the same column layout described in [Energy-shock data](#energy-shock-data) above.

2. **Regenerate the data file.** From the project root, run the script in PowerShell:

   ```powershell
   .\update-shocks-data.ps1
   ```

   This reads the CSV and overwrites `data/uk-profits-energy-shocks.js`. On success it prints the number of rows written and the list of shocks found.

   To use a CSV from a different location:

   ```powershell
   .\update-shocks-data.ps1 -CsvPath "C:\path\to\new-shocks.csv"
   ```

3. **Check the result.** Open `index.html`, switch to the **Energy shocks** tab, and confirm the lines reflect the latest data.

> **Note:** If PowerShell reports that *running scripts is disabled on this system*, allow scripts for the current session only before running either script:
>
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
> ```

---

## Notes

- The chart, range slider, and table are generated dynamically from the data file, so no other code changes are needed when the data updates.
- If `update-data.ps1` reports a missing column or an unexpected date format, check that the CSV matches the [Data Format](#data-format) above.

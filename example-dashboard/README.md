# Firm Data on AI — Interactive Dashboard

An interactive data dashboard accompanying the NBER Working Paper **"Firm Data on AI"**. It visualises firm-level survey results on AI adoption, personal AI use, and the employment and productivity impacts of AI across multiple countries.

> **Citation:** Yotzov, I., J. M. Barrero, N. Bloom, P. Bunn, S. J. Davis, K. M. Foster, A. Jalca, B. H. Meyer, P. Mizen, M. A. Navarrete, P. Smietanka, G. Thwaites and B. Z. Wang (2026), "Firm Data on AI", *NBER Working Paper* 34836.

---

## Features

| Tab | Description |
|-----|-------------|
| **Current AI Adoption** | AI technologies currently in use by firms |
| **Expected AI Adoption** | AI technologies firms expect to adopt over the next 3 years |
| **Personal AI Use** | Weekly AI use frequency reported by survey respondents |
| **Employment Impacts** | Distribution and cumulative employment effects of AI (past 3 years / next 3 years) |
| **Productivity Impacts** | Distribution and cumulative productivity effects of AI (past 3 years / next 3 years) |
| **About Us** | Information about the research team and surveys |

- Compare a single technology across countries, or view the full technology mix for a selected country
- Toggle between backward-looking and forward-looking horizons in the impact tabs
- Download the underlying data as CSV directly from the dashboard

---

## Getting Started

No build step or server is required — the dashboard is a static HTML/CSS/JS application.

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/firm-data-ai.git
   ```
2. Open `index.html` in any modern web browser.

---

## Project Structure

```
firm-data-ai/
├── index.html          # Dashboard layout and markup
├── styles.css          # Styling and responsive layout
├── app.js              # Interaction logic and chart rendering
├── data/
│   ├── *-data.js       # JavaScript data modules for each tab
│   └── *.csv           # Flat CSV exports of each dataset
└── README.md
```

---

## Data Coverage

**AI technologies** tracked (Current & Expected Adoption tabs):

- Any AI Technology · Text generation using LLMs · Data processing using ML · Image processing using ML · Visual content creation · Robotics · Autonomous vehicles · Other

**Personal AI use** frequency categories:

- Not at all · Up to 1 hour a week · 1–5 hours a week · >5 hours a week

**Countries:** UK · US · Australia · Germany (plus an all-firms aggregate)

---

## License

Please refer to the terms of the NBER working paper for data usage and citation requirements.

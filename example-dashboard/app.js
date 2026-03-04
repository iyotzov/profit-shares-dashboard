const datasets = [currentAiAdoptionData, expectedAiAdoptionData, personalAiUseData, employmentImpactsData, productivityImpactsData];

const datasetById = Object.fromEntries(datasets.map((dataset) => [dataset.id, dataset]));

function isPersonalAIUseDataset(dataset) {
  return dataset.id === "personal_ai_use";
}

function isEmploymentDataset(dataset) {
  return dataset.id === "employment_impacts" || dataset.id === "productivity_impacts";
}

function usesCountryDistributionSelector(dataset) {
  return isPersonalAIUseDataset(dataset) || isEmploymentDataset(dataset);
}

function buildInitialSelection(dataset) {
  const selection = {
    selectedCountry: "all_firms"
  };

  if (Array.isArray(dataset.technologies) && dataset.technologies.length > 0) {
    selection.selectedTechnology = dataset.technologies[0].name;
  }

  if (isEmploymentDataset(dataset) && Array.isArray(dataset.periods) && dataset.periods.length > 0) {
    selection.selectedPeriod = dataset.defaultPeriod || dataset.periods[0].id;
  }

  return selection;
}

const state = {
  activeFigureId: "home",
  selections: Object.fromEntries(datasets.map((dataset) => [dataset.id, buildInitialSelection(dataset)]))
};

const countryColors = {
  uk: "#0ea5e9",
  us: "#0f766e",
  australia: "#f59e0b",
  germany: "#f97316",
  all_firms: "#334155"
};

const appTitle = document.getElementById("appTitle");
const subtitle = document.getElementById("subtitle");
const homeSection = document.getElementById("homeSection");
const noteText = document.getElementById("noteText");
const technologySelect = document.getElementById("technologySelect");
const countrySelect = document.getElementById("countrySelect");
const controlsSection = document.getElementById("controlsSection");
const countryControl = document.getElementById("countryControl");
const technologyLabel = document.getElementById("technologyLabel");
const chartsSection = document.getElementById("chartsSection");
const comparisonChart = document.getElementById("comparisonChart");
const mixChart = document.getElementById("mixChart");
const comparisonTitle = document.getElementById("comparisonTitle");
const mixTitle = document.getElementById("mixTitle");
const comparisonCaption = document.getElementById("comparisonCaption");
const mixCaption = document.getElementById("mixCaption");
const tableSection = document.getElementById("tableSection");
const dataTable = document.getElementById("dataTable");
const aboutSection = document.getElementById("aboutSection");
const actionsSection = document.getElementById("actionsSection");
const notesSection = document.getElementById("notesSection");
const downloadCsvButton = document.getElementById("downloadCsvButton");
const downloadJsonButton = document.getElementById("downloadJsonButton");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const periodControls = document.getElementById("periodControls");
const periodButtons = document.getElementById("periodButtons");

function getActiveDataset() {
  return datasetById[state.activeFigureId];
}

function isAboutTabActive() {
  return state.activeFigureId === "about";
}

function isHomeTabActive() {
  return state.activeFigureId === "home";
}

function isNonDataTabActive() {
  return isHomeTabActive() || isAboutTabActive();
}

function getActiveSelection() {
  return state.selections[state.activeFigureId];
}

function getActivePeriod(dataset, selection) {
  if (!isEmploymentDataset(dataset)) {
    return null;
  }

  const period = (dataset.periods || []).find((entry) => entry.id === selection.selectedPeriod);
  return period || dataset.periods[0] || null;
}

function findTechnology(dataset, technologyName) {
  return (dataset.technologies || []).find((entry) => entry.name === technologyName);
}

function findCountry(dataset, countryId) {
  return (dataset.countries || []).find((country) => country.id === countryId);
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function formatHours(value) {
  return `${value.toFixed(1)} hrs`;
}

function formatImpact(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pp`;
}

function formatResponseCount(value) {
  return Math.round(value).toLocaleString("en-US");
}

function getSurveyResponses(dataset, selection) {
  if (isEmploymentDataset(dataset)) {
    const period = getActivePeriod(dataset, selection);
    return period ? period.responses || null : null;
  }

  if (!(dataset.countries || []).some((country) => typeof country.responses === "number")) {
    return null;
  }

  return Object.fromEntries(dataset.countries.map((country) => [country.id, country.responses]));
}

function appendSurveyResponsesRow(tbody, dataset, responsesByCountry) {
  if (!responsesByCountry) {
    return;
  }

  const row = document.createElement("tr");
  const nameCell = document.createElement("td");
  nameCell.textContent = "Number of Survey Responses";
  row.append(nameCell);

  dataset.countries.forEach((country) => {
    const valueCell = document.createElement("td");
    const value = responsesByCountry[country.id];
    valueCell.textContent = typeof value === "number" ? formatResponseCount(value) : "";
    row.append(valueCell);
  });

  tbody.append(row);
}

function createBarRow({ label, valueLabel, widthPercent, color }) {
  const row = document.createElement("div");
  row.className = "bar-row";

  const header = document.createElement("div");
  header.className = "bar-header";

  const name = document.createElement("span");
  name.className = "bar-label";
  name.textContent = label;

  const value = document.createElement("span");
  value.textContent = valueLabel;

  header.append(name, value);

  const track = document.createElement("div");
  track.className = "bar-track";

  const fill = document.createElement("div");
  fill.className = "bar-fill";
  fill.style.width = `${Math.max(0, Math.min(widthPercent, 100))}%`;
  fill.style.backgroundColor = color;

  track.append(fill);
  row.append(header, track);
  return row;
}

function createDivergingBarRow({ label, value, maxAbsValue, color }) {
  const row = document.createElement("div");
  row.className = "bar-row";

  const header = document.createElement("div");
  header.className = "bar-header";

  const name = document.createElement("span");
  name.className = "bar-label";
  name.textContent = label;

  const valueText = document.createElement("span");
  valueText.textContent = formatImpact(value);

  header.append(name, valueText);

  const track = document.createElement("div");
  track.className = "bar-track bar-track-diverging";

  const zeroLine = document.createElement("div");
  zeroLine.className = "bar-zero-line";
  track.append(zeroLine);

  const fill = document.createElement("div");
  fill.className = "bar-fill bar-fill-diverging";

  const clampedAbs = Math.max(0, Math.min(Math.abs(value), maxAbsValue));
  const widthPercent = (clampedAbs / maxAbsValue) * 50;
  fill.style.width = `${widthPercent}%`;
  fill.style.backgroundColor = color;

  if (value < 0) {
    fill.classList.add("is-negative");
    fill.style.right = "50%";
  } else {
    fill.classList.add("is-positive");
    fill.style.left = "50%";
  }

  track.append(fill);
  row.append(header, track);
  return row;
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (typeof cell === "number") {
            return cell.toString();
          }
          const escaped = String(cell).replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
}

function datasetToCsv(dataset) {
  const selection = getActiveSelection();
  const header = [dataset.rowLabel || "Technology", ...dataset.countries.map((country) => country.label)];

  if (isEmploymentDataset(dataset)) {
    const period = getActivePeriod(dataset, selection);
    const rows = (period.categories || []).map((category) => [
      category.name,
      ...dataset.countries.map((country) => category.values[country.id])
    ]);
    rows.push([
      period.cumulative.name,
      ...dataset.countries.map((country) => period.cumulative.values[country.id])
    ]);
    return toCsv([header, ...rows]);
  }

  const rows = (dataset.technologies || []).map((technology) => [
    technology.name,
    ...dataset.countries.map((country) => technology.values[country.id])
  ]);

  const additionalRows = (dataset.additionalRows || []).map((row) => [
    row.name,
    ...dataset.countries.map((country) => row.values[country.id])
  ]);

  return toCsv([header, ...rows, ...additionalRows]);
}

function renderComparisonChart() {
  comparisonChart.innerHTML = "";
  const dataset = getActiveDataset();
  const selection = getActiveSelection();

  if (isEmploymentDataset(dataset)) {
    const selectedCountry = findCountry(dataset, selection.selectedCountry) || dataset.countries[0];
    const period = getActivePeriod(dataset, selection);

    comparisonCaption.textContent = `${selectedCountry.label}: ${period.label.toLowerCase()} distribution`;

    (period.categories || []).forEach((category) => {
      const value = category.values[selectedCountry.id];
      const row = createBarRow({
        label: category.name,
        valueLabel: formatPercent(value),
        widthPercent: value,
        color: countryColors[selectedCountry.id]
      });
      comparisonChart.append(row);
    });
    return;
  }

  if (isPersonalAIUseDataset(dataset)) {
    const selectedCountry = findCountry(dataset, selection.selectedCountry) || dataset.countries[0];
    comparisonCaption.textContent = `${selectedCountry.label}: distribution across personal AI use frequency`;

    (dataset.technologies || []).forEach((technology) => {
      const value = technology.values[selectedCountry.id];
      const row = createBarRow({
        label: technology.name,
        valueLabel: formatPercent(value),
        widthPercent: value,
        color: countryColors[selectedCountry.id]
      });
      comparisonChart.append(row);
    });
    return;
  }

  const selectedTechnology = findTechnology(dataset, selection.selectedTechnology);
  comparisonCaption.textContent = `${selectedTechnology.name} by country and overall average`;

  dataset.countries.forEach((country) => {
    const value = selectedTechnology.values[country.id];
    const row = createBarRow({
      label: country.label,
      valueLabel: formatPercent(value),
      widthPercent: value,
      color: countryColors[country.id]
    });
    comparisonChart.append(row);
  });
}

function renderMixChart() {
  mixChart.innerHTML = "";
  const dataset = getActiveDataset();
  const selection = getActiveSelection();

  if (isEmploymentDataset(dataset)) {
    const period = getActivePeriod(dataset, selection);
    mixCaption.textContent = `${period.cumulative.name} by country and overall average`;

    const values = dataset.countries.map((country) => ({
      countryId: country.id,
      countryLabel: country.label,
      value: period.cumulative.values[country.id]
    }));

    const maxAbsValue = Math.max(...values.map((entry) => Math.abs(entry.value)), 1);

    values.forEach((entry) => {
      const color = entry.value < 0 ? "#b91c1c" : entry.value > 0 ? "#15803d" : "#64748b";
      const row = createDivergingBarRow({
        label: entry.countryLabel,
        value: entry.value,
        maxAbsValue,
        color: entry.value === 0 ? "#64748b" : color
      });
      mixChart.append(row);
    });
    return;
  }

  if (isPersonalAIUseDataset(dataset)) {
    const averageRow = (dataset.additionalRows || []).find((row) =>
      row.name.toLowerCase().includes("average use per week")
    );

    if (!averageRow) {
      mixCaption.textContent = "Average use per week (hours) unavailable in this dataset.";
      return;
    }

    mixCaption.textContent = "Average use per week (hours) by country and overall average";

    const values = dataset.countries.map((country) => ({
      countryId: country.id,
      countryLabel: country.label,
      value: averageRow.values[country.id]
    }));
    const maxValue = Math.max(...values.map((entry) => entry.value), 1);

    values.forEach((entry) => {
      const row = createBarRow({
        label: entry.countryLabel,
        valueLabel: formatHours(entry.value),
        widthPercent: (entry.value / maxValue) * 100,
        color: countryColors[entry.countryId]
      });
      mixChart.append(row);
    });
    return;
  }

  const country = findCountry(dataset, selection.selectedCountry);
  mixCaption.textContent = `${country.label}: adoption rate by AI technology`;

  const values = dataset.technologies
    .map((technology) => ({
      name: technology.name,
      value: technology.values[country.id]
    }))
    .sort((a, b) => b.value - a.value);

  values.forEach((entry) => {
    const row = createBarRow({
      label: entry.name,
      valueLabel: formatPercent(entry.value),
      widthPercent: entry.value,
      color: countryColors[country.id]
    });
    mixChart.append(row);
  });
}

function renderTable() {
  const dataset = getActiveDataset();
  const selection = getActiveSelection();
  const responsesByCountry = getSurveyResponses(dataset, selection);
  const headerCells = [dataset.rowLabel || "Technology", ...dataset.countries.map((country) => country.label)];

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerCells.forEach((cellText) => {
    const th = document.createElement("th");
    th.textContent = cellText;
    headerRow.append(th);
  });
  thead.append(headerRow);

  const tbody = document.createElement("tbody");

  if (isEmploymentDataset(dataset)) {
    const period = getActivePeriod(dataset, selection);

    (period.categories || []).forEach((category) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      nameCell.textContent = category.name;
      row.append(nameCell);

      dataset.countries.forEach((country) => {
        const valueCell = document.createElement("td");
        valueCell.textContent = formatPercent(category.values[country.id]);
        row.append(valueCell);
      });

      tbody.append(row);
    });

    const cumulativeRow = document.createElement("tr");
    const cumulativeNameCell = document.createElement("td");
    cumulativeNameCell.textContent = period.cumulative.name;
    cumulativeRow.append(cumulativeNameCell);

    dataset.countries.forEach((country) => {
      const valueCell = document.createElement("td");
      valueCell.textContent = formatImpact(period.cumulative.values[country.id]);
      cumulativeRow.append(valueCell);
    });

    tbody.append(cumulativeRow);
    appendSurveyResponsesRow(tbody, dataset, responsesByCountry);

    dataTable.innerHTML = "";
    dataTable.append(thead, tbody);
    return;
  }

  (dataset.technologies || []).forEach((technology) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = technology.name;
    row.append(nameCell);

    dataset.countries.forEach((country) => {
      const valueCell = document.createElement("td");
      valueCell.textContent = formatPercent(technology.values[country.id]);
      row.append(valueCell);
    });

    tbody.append(row);
  });

  (dataset.additionalRows || []).forEach((extraRow) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = extraRow.name;
    row.append(nameCell);

    dataset.countries.forEach((country) => {
      const valueCell = document.createElement("td");
      const value = extraRow.values[country.id];
      valueCell.textContent = isPersonalAIUseDataset(dataset) ? formatHours(value) : formatPercent(value);
      row.append(valueCell);
    });

    tbody.append(row);
  });

  appendSurveyResponsesRow(tbody, dataset, responsesByCountry);

  dataTable.innerHTML = "";
  dataTable.append(thead, tbody);
}

function syncControls() {
  const dataset = getActiveDataset();
  const selection = getActiveSelection();
  const isCountryDistributionMode = usesCountryDistributionSelector(dataset);

  technologyLabel.textContent = isCountryDistributionMode
    ? "Select country for distribution"
    : "Country comparison for technology";
  countryControl.hidden = isCountryDistributionMode;

  technologySelect.innerHTML = "";
  if (isCountryDistributionMode) {
    dataset.countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.id;
      option.textContent = country.label;
      technologySelect.append(option);
    });
  } else {
    dataset.technologies.forEach((technology) => {
      const option = document.createElement("option");
      option.value = technology.name;
      option.textContent = technology.name;
      technologySelect.append(option);
    });
  }

  countrySelect.innerHTML = "";
  dataset.countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.id;
    option.textContent = country.label;
    countrySelect.append(option);
  });

  technologySelect.value = isCountryDistributionMode ? selection.selectedCountry : selection.selectedTechnology;
  countrySelect.value = selection.selectedCountry;
}

function syncPeriodControls() {
  const dataset = getActiveDataset();
  const selection = getActiveSelection();

  if (!isEmploymentDataset(dataset)) {
    periodControls.hidden = true;
    periodButtons.innerHTML = "";
    return;
  }

  periodControls.hidden = false;
  periodButtons.innerHTML = "";

  (dataset.periods || []).forEach((period) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "period-button";
    if (selection.selectedPeriod === period.id) {
      button.classList.add("is-active");
    }
    button.dataset.periodId = period.id;
    button.textContent = period.label;
    periodButtons.append(button);
  });
}

function updateTabStyles() {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.figureId === state.activeFigureId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function updateChartTitles() {
  const dataset = getActiveDataset();

  if (isEmploymentDataset(dataset)) {
    comparisonTitle.textContent = "Distribution by Country";
    mixTitle.textContent = "Cumulative Impact";
    return;
  }

  if (isPersonalAIUseDataset(dataset)) {
    comparisonTitle.textContent = "Distribution by Country";
    mixTitle.textContent = "Average Use per Week (Hours)";
    return;
  }

  comparisonTitle.textContent = "Country Comparison";
  mixTitle.textContent = "Technology Mix";
}

function renderIntro() {
  const dataset = getActiveDataset();
  const selection = getActiveSelection();

  if (isEmploymentDataset(dataset)) {
    const period = getActivePeriod(dataset, selection);
    subtitle.textContent = `${dataset.title} across the US, UK, Germany, and Australia, plus the all-firms average. View: ${period.label}.`;
  } else {
    subtitle.textContent = `${dataset.title} across the US, UK, Germany, and Australia, plus the all-firms average.`;
  }

  const citation =
    'For further information, see: Yotzov, I, J M Barrero, N Bloom, P Bunn, S J Davis, K M Foster, A Jalca, B H Meyer, P Mizen, M A Navarrete, P Smietanka, G Thwaites and B Z Wang (2026), "Firm Data on AI", NBER Working Paper 34836.';
  noteText.innerHTML = `<p>${dataset.notes}</p><p class="citation">${citation}</p>`;
}

function renderAll() {
  if (isHomeTabActive()) {
    updateTabStyles();
    appTitle.hidden = false;
    subtitle.hidden = true;
    homeSection.hidden = false;
    controlsSection.hidden = true;
    periodControls.hidden = true;
    chartsSection.hidden = true;
    tableSection.hidden = true;
    actionsSection.hidden = true;
    notesSection.hidden = true;
    aboutSection.hidden = true;
    return;
  }

  if (isAboutTabActive()) {
    updateTabStyles();
    appTitle.hidden = false;
    subtitle.hidden = true;
    homeSection.hidden = true;
    controlsSection.hidden = true;
    periodControls.hidden = true;
    chartsSection.hidden = true;
    tableSection.hidden = true;
    actionsSection.hidden = true;
    notesSection.hidden = true;
    aboutSection.hidden = false;
    return;
  }

  appTitle.hidden = false;
  subtitle.hidden = false;
  homeSection.hidden = true;
  controlsSection.hidden = false;
  chartsSection.hidden = false;
  tableSection.hidden = false;
  actionsSection.hidden = false;
  notesSection.hidden = false;
  aboutSection.hidden = true;

  updateTabStyles();
  syncControls();
  syncPeriodControls();
  updateChartTitles();
  renderIntro();
  renderComparisonChart();
  renderMixChart();
  renderTable();
}

function triggerDownload(filename, fileContents, mimeType) {
  const blob = new Blob([fileContents], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function setupDownloads() {
  downloadCsvButton.addEventListener("click", () => {
    if (isNonDataTabActive()) {
      return;
    }

    const dataset = getActiveDataset();
    const selection = getActiveSelection();

    if (isEmploymentDataset(dataset)) {
      const period = getActivePeriod(dataset, selection);
      triggerDownload(
        `${dataset.downloadBase}-${period.id}.csv`,
        datasetToCsv(dataset),
        "text/csv;charset=utf-8"
      );
      return;
    }

    triggerDownload(`${dataset.downloadBase}.csv`, datasetToCsv(dataset), "text/csv;charset=utf-8");
  });

  downloadJsonButton.addEventListener("click", () => {
    if (isNonDataTabActive()) {
      return;
    }

    const dataset = getActiveDataset();
    const selection = getActiveSelection();

    if (isEmploymentDataset(dataset)) {
      const period = getActivePeriod(dataset, selection);
      const payload = {
        id: dataset.id,
        title: dataset.title,
        rowLabel: dataset.rowLabel,
        countries: dataset.countries,
        period
      };
      triggerDownload(
        `${dataset.downloadBase}-${period.id}.json`,
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8"
      );
      return;
    }

    triggerDownload(
      `${dataset.downloadBase}.json`,
      JSON.stringify(dataset, null, 2),
      "application/json;charset=utf-8"
    );
  });
}

function setupControls() {
  technologySelect.addEventListener("change", (event) => {
    if (isNonDataTabActive()) {
      return;
    }

    const dataset = getActiveDataset();
    const selection = getActiveSelection();

    if (usesCountryDistributionSelector(dataset)) {
      selection.selectedCountry = event.target.value;
    } else {
      selection.selectedTechnology = event.target.value;
    }

    renderComparisonChart();
  });

  countrySelect.addEventListener("change", (event) => {
    if (isNonDataTabActive()) {
      return;
    }

    const selection = getActiveSelection();
    selection.selectedCountry = event.target.value;
    renderMixChart();
  });
}

function setupPeriodControls() {
  periodButtons.addEventListener("click", (event) => {
    const button = event.target.closest(".period-button");
    if (!button) {
      return;
    }

    const dataset = getActiveDataset();
    if (!isEmploymentDataset(dataset)) {
      return;
    }

    const selection = getActiveSelection();
    const nextPeriodId = button.dataset.periodId;
    const periodExists = (dataset.periods || []).some((period) => period.id === nextPeriodId);

    if (!periodExists || selection.selectedPeriod === nextPeriodId) {
      return;
    }

    selection.selectedPeriod = nextPeriodId;
    renderAll();
  });
}

function setupTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextId = button.dataset.figureId;
      const isNonDataTab = nextId === "home" || nextId === "about";
      if ((!datasetById[nextId] && !isNonDataTab) || nextId === state.activeFigureId) {
        return;
      }
      state.activeFigureId = nextId;
      renderAll();
    });
  });
}

function init() {
  setupControls();
  setupPeriodControls();
  setupDownloads();
  setupTabs();
  renderAll();
}

init();

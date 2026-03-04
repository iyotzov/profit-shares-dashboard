const SERIES = [
  { key: "ls", label: "Labour share", color: "#60a5fa" },
  { key: "ps", label: "Pure profit share", color: "#f87171" },
  { key: "cs", label: "Capital share", color: "#fbbf24" },
  { key: "goss", label: "Gross operating surplus share", color: "#a78bfa" }
];

const state = {
  activePage: "home",
  rows: [],
  selectedSeries: new Set(SERIES.map((series) => series.key)),
  rangeStart: 0,
  rangeEnd: 0
};

const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const homeSection = document.getElementById("homeSection");
const dataSection = document.getElementById("dataSection");
const seriesControls = document.getElementById("seriesControls");
const chartCaption = document.getElementById("chartCaption");
const timeSeriesChart = document.getElementById("timeSeriesChart");
const chartTooltip = document.getElementById("chartTooltip");
const rangeSliderWrap = document.getElementById("rangeSliderWrap");
const rangeStartInput = document.getElementById("rangeStart");
const rangeEndInput = document.getElementById("rangeEnd");
const rangeStartLabel = document.getElementById("rangeStartLabel");
const rangeEndLabel = document.getElementById("rangeEndLabel");
const rangeResetBtn = document.getElementById("rangeResetBtn");

async function loadData() {
  if (!Array.isArray(window.UK_PROFITS_DATA)) {
    throw new Error("Missing global data payload");
  }
  return window.UK_PROFITS_DATA.map((row) => ({
    date: new Date(`${row.date}T00:00:00`),
    dateLabel: row.date,
    quarter: row.quarter,
    ls: Number(row.ls),
    ps: Number(row.ps),
    cs: Number(row.cs),
    goss: Number(row.goss)
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

function updateTabVisibility() {
  const showHome = state.activePage === "home";
  homeSection.hidden = !showHome;
  dataSection.hidden = showHome;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.pageId === state.activePage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function getActiveSeries() {
  return SERIES.filter((series) => state.selectedSeries.has(series.key));
}

function buildSeriesControls() {
  seriesControls.innerHTML = "";

  SERIES.forEach((series) => {
    const option = document.createElement("label");
    option.className = "series-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = series.key;
    checkbox.checked = state.selectedSeries.has(series.key);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedSeries.add(series.key);
      } else if (state.selectedSeries.size > 1) {
        state.selectedSeries.delete(series.key);
      } else {
        checkbox.checked = true;
      }
      renderDataPage();
    });

    const dot = document.createElement("span");
    dot.className = "series-dot";
    dot.style.backgroundColor = series.color;

    const text = document.createElement("span");
    text.textContent = series.label;

    option.append(checkbox, dot, text);
    seriesControls.append(option);
  });
}

function buildChart(rows, activeSeries) {
  timeSeriesChart.innerHTML = "";

  if (rows.length === 0 || activeSeries.length === 0) {
    return;
  }

  const width = 980;
  const height = 420;
  const margin = { top: 24, right: 26, bottom: 48, left: 58 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const values = rows.flatMap((row) => activeSeries.map((series) => row[series.key]));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = Math.max(1, (maxValue - minValue) * 0.1);
  const domainMin = Math.floor((minValue - padding) * 10) / 10;
  const domainMax = Math.ceil((maxValue + padding) * 10) / 10;

  const xAtIndex = (index) => {
    if (rows.length === 1) {
      return margin.left + plotWidth / 2;
    }
    return margin.left + (index / (rows.length - 1)) * plotWidth;
  };

  const yAtValue = (value) => {
    if (domainMax === domainMin) {
      return margin.top + plotHeight / 2;
    }
    return margin.top + ((domainMax - value) / (domainMax - domainMin)) * plotHeight;
  };

  const plotBackground = createSvgElement("rect", {
    x: margin.left,
    y: margin.top,
    width: plotWidth,
    height: plotHeight,
    fill: "#1e293b"
  });
  timeSeriesChart.append(plotBackground);

  const yTicks = 6;
  for (let tickIndex = 0; tickIndex < yTicks; tickIndex += 1) {
    const tickValue = domainMin + (tickIndex / (yTicks - 1)) * (domainMax - domainMin);
    const y = yAtValue(tickValue);

    const gridLine = createSvgElement("line", {
      x1: margin.left,
      y1: y,
      x2: margin.left + plotWidth,
      y2: y,
      stroke: "#334155",
      "stroke-width": 1
    });
    timeSeriesChart.append(gridLine);

    const label = createSvgElement("text", {
      x: margin.left - 8,
      y: y + 4,
      "text-anchor": "end",
      "font-size": 12,
      fill: "#ffffff"
    });
    label.textContent = `${Math.round(tickValue)}%`;
    timeSeriesChart.append(label);
  }

  const xTickCount = Math.min(8, rows.length);
  for (let tickIndex = 0; tickIndex < xTickCount; tickIndex += 1) {
    const rowIndex = Math.round((tickIndex / Math.max(1, xTickCount - 1)) * (rows.length - 1));
    const x = xAtIndex(rowIndex);

    const tick = createSvgElement("line", {
      x1: x,
      y1: margin.top + plotHeight,
      x2: x,
      y2: margin.top + plotHeight + 6,
      stroke: "#ffffff",
      "stroke-width": 1
    });
    timeSeriesChart.append(tick);

    const label = createSvgElement("text", {
      x,
      y: height - 14,
      "text-anchor": "middle",
      "font-size": 12,
      fill: "#ffffff"
    });
    label.textContent = rows[rowIndex].quarter;
    timeSeriesChart.append(label);
  }

  activeSeries.forEach((series) => {
    const d = rows
      .map((row, index) => {
        const x = xAtIndex(index);
        const y = yAtValue(row[series.key]);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

    const path = createSvgElement("path", {
      d,
      fill: "none",
      stroke: series.color,
      "stroke-width": 2.5,
      "stroke-linejoin": "round",
      "stroke-linecap": "round"
    });
    timeSeriesChart.append(path);
  });

  const axisX = createSvgElement("line", {
    x1: margin.left,
    y1: margin.top + plotHeight,
    x2: margin.left + plotWidth,
    y2: margin.top + plotHeight,
    stroke: "#ffffff",
    "stroke-width": 1.3
  });

  const axisY = createSvgElement("line", {
    x1: margin.left,
    y1: margin.top,
    x2: margin.left,
    y2: margin.top + plotHeight,
    stroke: "#ffffff",
    "stroke-width": 1.3
  });

  const yAxisLabel = createSvgElement("text", {
    x: -(margin.top + plotHeight / 2),
    y: 15,
    transform: "rotate(-90)",
    "text-anchor": "middle",
    "font-size": 12,
    fill: "#ffffff"
  });
  yAxisLabel.textContent = "Percent of corporate gross value added (%)";

  timeSeriesChart.append(axisX, axisY, yAxisLabel);

  const hoverGuide = createSvgElement("line", {
    x1: margin.left,
    y1: margin.top,
    x2: margin.left,
    y2: margin.top + plotHeight,
    stroke: "#94a3b8",
    "stroke-width": 1,
    "stroke-dasharray": "4 4",
    visibility: "hidden"
  });
  timeSeriesChart.append(hoverGuide);

  const overlay = createSvgElement("rect", {
    x: margin.left,
    y: margin.top,
    width: plotWidth,
    height: plotHeight,
    fill: "transparent",
    cursor: "crosshair"
  });

  overlay.addEventListener("mousemove", (event) => {
    const rect = timeSeriesChart.getBoundingClientRect();
    const relX = ((event.clientX - rect.left) / rect.width) * width;
    const relY = ((event.clientY - rect.top) / rect.height) * height;

    const clampedX = Math.min(margin.left + plotWidth, Math.max(margin.left, relX));
    const ratio = plotWidth === 0 ? 0 : (clampedX - margin.left) / plotWidth;
    const index = Math.round(ratio * Math.max(0, rows.length - 1));

    const row = rows[index];
    const x = xAtIndex(index);

    hoverGuide.setAttribute("x1", String(x));
    hoverGuide.setAttribute("x2", String(x));
    hoverGuide.setAttribute("visibility", "visible");

    chartTooltip.hidden = false;
    const tooltipLeftPct = (clampedX / width) * 100;
    const tooltipTopPct = (Math.max(margin.top, Math.min(relY, margin.top + plotHeight)) / height) * 100;
    const nearRightEdge = ratio > 0.75;

    chartTooltip.style.left = `${tooltipLeftPct}%`;
    chartTooltip.style.top = `${tooltipTopPct}%`;
    chartTooltip.style.transform = nearRightEdge
      ? "translate(calc(-100% - 10px), -10px)"
      : "translate(10px, -10px)";

    const rowsHtml = activeSeries.map(
      (series) =>
        `<div class="chart-tooltip-row"><span style="color:${series.color}">${series.label}</span><strong>${formatPercent(row[series.key])}</strong></div>`
    ).join("");

    chartTooltip.innerHTML = `<div class="chart-tooltip-title">${row.quarter}</div>${rowsHtml}`;
  });

  overlay.addEventListener("mouseleave", () => {
    hoverGuide.setAttribute("visibility", "hidden");
    chartTooltip.hidden = true;
  });

  timeSeriesChart.append(overlay);
}

function initRangeSlider() {
  const maxIndex = Math.max(0, state.rows.length - 1);
  rangeStartInput.max = maxIndex;
  rangeEndInput.max = maxIndex;
  rangeStartInput.value = 0;
  rangeEndInput.value = maxIndex;
  state.rangeStart = 0;
  state.rangeEnd = maxIndex;
  updateRangeLabels();
  rangeSliderWrap.hidden = state.rows.length === 0;
}

function updateRangeLabels() {
  if (state.rows.length === 0) return;
  rangeStartLabel.textContent = state.rows[state.rangeStart].quarter;
  rangeEndLabel.textContent = state.rows[state.rangeEnd].quarter;
}

function getVisibleRows() {
  return state.rows.slice(state.rangeStart, state.rangeEnd + 1);
}

function onRangeInput() {
  let start = parseInt(rangeStartInput.value, 10);
  let end = parseInt(rangeEndInput.value, 10);

  if (start > end) {
    // Swap if user drags handles past each other
    const tmp = start;
    start = end;
    end = tmp;
    rangeStartInput.value = start;
    rangeEndInput.value = end;
  }

  state.rangeStart = start;
  state.rangeEnd = end;
  updateRangeLabels();
  renderDataPage();
}

function registerRangeHandlers() {
  rangeStartInput.addEventListener("input", onRangeInput);
  rangeEndInput.addEventListener("input", onRangeInput);
  rangeResetBtn.addEventListener("click", () => {
    initRangeSlider();
    renderDataPage();
  });
}

function renderDataPage() {
  const activeSeries = getActiveSeries();
  const visibleRows = getVisibleRows();

  if (visibleRows.length > 0) {
    chartCaption.textContent = `Range: ${visibleRows[0].quarter} to ${visibleRows[visibleRows.length - 1].quarter}`;
  } else {
    chartCaption.textContent = "No data available.";
  }

  buildChart(visibleRows, activeSeries);
}

function registerTabHandlers() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activePage = button.dataset.pageId;
      updateTabVisibility();
      if (state.activePage === "data") {
        renderDataPage();
      }
    });
  });
}

async function init() {
  registerTabHandlers();
  updateTabVisibility();

  try {
    state.rows = await loadData();
  } catch (error) {
    chartCaption.textContent = "Unable to load dataset.";
    throw error;
  }

  buildSeriesControls();
  initRangeSlider();
  registerRangeHandlers();
  renderDataPage();
}

init().catch((error) => {
  console.error(error);
  if (state.activePage === "data") {
    chartCaption.textContent = "Unable to load dataset.";
  }
});

// Global QM vs Survey tool module
// Displays T3PS4 QM Energy Surfaces vs PDB Survey Distributions

export function getHTML() {
  return `
    <div class="qm-survey-container">
      <div class="qm-survey-header">
        <h2>T3PS4 QM Energy Surfaces vs PDB Survey Distributions</h2>
        <p class="subtitle">Comparing quantum mechanical energy calculations with experimental PDB survey data</p>
      </div>

      <div class="loading-overlay" id="loading-overlay">
        <div class="spinner"></div>
        <p>Loading data and generating plots...</p>
      </div>

      <div class="plots-grid" id="plots-grid">
        <!-- Row 1: α-γ -->
        <div class="plot-container">
          <div id="plot-ag-qm" class="plot"></div>
        </div>
        <div class="plot-container">
          <div id="plot-ag-survey" class="plot"></div>
        </div>

        <!-- Row 2: ε-ζ -->
        <div class="plot-container">
          <div id="plot-ez-qm" class="plot"></div>
        </div>
        <div class="plot-container">
          <div id="plot-ez-survey" class="plot"></div>
        </div>

        <!-- Row 3: ζ-α -->
        <div class="plot-container">
          <div id="plot-za-qm" class="plot"></div>
        </div>
        <div class="plot-container">
          <div id="plot-za-survey" class="plot"></div>
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  console.log('Global QM vs Survey initialized');

  // Load data and create plots
  await loadDataAndPlot();
}

async function loadDataAndPlot() {
  const loadingOverlay = document.getElementById('loading-overlay');

  try {
    // Load all data files
    console.log('Loading QM data...');
    const [agQM, ezQM, zaQM] = await Promise.all([
      loadCSV('assets/global_ag_qm.csv'),
      loadCSV('assets/global_ez_qm.csv'),
      loadCSV('assets/global_za_qm.csv')
    ]);

    console.log('Loading survey histogram data...');
    const [agSurvey, ezSurvey, zaSurvey] = await Promise.all([
      loadJSON('assets/survey_ag_hist.json'),
      loadJSON('assets/survey_ez_hist.json'),
      loadJSON('assets/survey_za_hist.json')
    ]);

    // Hide loading overlay
    loadingOverlay.style.display = 'none';

    // Create all plots
    console.log('Creating plots...');
    createQMPlot(agQM, 'alpha', 'gamma', 'plot-ag-qm',
                 'QM: α-γ CMAP', 'α (degrees)', 'γ (degrees)', 12);
    createSurveyPlot(agSurvey, 'plot-ag-survey',
                     'PDB Survey: α-γ', 'α (degrees)', 'γ (degrees)');

    createQMPlot(ezQM, 'epsilon', 'zeta', 'plot-ez-qm',
                 'QM: ε-ζ CMAP', 'ε (degrees)', 'ζ (degrees)', 9);
    createSurveyPlot(ezSurvey, 'plot-ez-survey',
                     'PDB Survey: ε-ζ', 'ε (degrees)', 'ζ (degrees)');

    createQMPlot(zaQM, 'zeta', 'alpha', 'plot-za-qm',
                 'QM: ζ-α CMAP (intra-residue)', 'ζ (degrees)', 'α (degrees)', 8);
    createSurveyPlot(zaSurvey, 'plot-za-survey',
                     'PDB Survey: ζ-α (cross-residue)', 'ζ (degrees)', 'α (degrees)');

    console.log('All plots created successfully!');

  } catch (error) {
    console.error('Error loading data:', error);
    loadingOverlay.innerHTML = `
      <div style="color: red;">
        <h3>Error Loading Data</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

async function loadCSV(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const text = await response.text();

  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = parseFloat(values[idx]);
    });
    data.push(row);
  }

  return data;
}

async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return await response.json();
}

function createQMPlot(data, angle1Key, angle2Key, divId, title, xlabel, ylabel, vmax) {
  // Extract data points
  const angle1 = data.map(d => d[angle1Key]);
  const angle2 = data.map(d => d[angle2Key]);
  const energies = data.map(d => d.energy_rel);

  // Create grid for interpolation (simple gridding)
  const gridSize = 72;
  const grid = createGrid(angle1, angle2, energies, gridSize);

  // Jet colorscale for QM (dark red -> yellow -> cyan -> dark blue)
  const qmColorscale = [
    [0.0, '#8B0000'],  // Dark red
    [0.1, '#DC143C'],  // Crimson
    [0.2, '#FF4500'],  // Orange red
    [0.3, '#FFA500'],  // Orange
    [0.4, '#FFD700'],  // Gold
    [0.5, '#FFFF00'],  // Yellow
    [0.6, '#00FF00'],  // Green
    [0.7, '#00FFFF'],  // Cyan
    [0.8, '#1E90FF'],  // Dodger blue
    [0.9, '#0000CD'],  // Medium blue
    [1.0, '#00008B']   // Dark blue
  ];

  const trace = {
    type: 'contour',
    x: grid.x,
    y: grid.y,
    z: grid.z,
    colorscale: qmColorscale,
    contours: {
      start: 0,
      end: vmax,
      size: vmax / 20,
      showlabels: true,
      labelfont: {
        size: 8,
        color: 'white'
      }
    },
    colorbar: {
      title: 'kcal/mol',
      titleside: 'right'
    },
    zmin: 0,
    zmax: vmax,
    line: {
      width: 0.5,
      color: 'white',
      smoothing: 0.85
    },
    showscale: true
  };

  const layout = {
    title: {
      text: title,
      font: { size: 14, weight: 'bold' }
    },
    xaxis: {
      title: xlabel,
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(128, 128, 128, 0.3)',
      gridwidth: 0.3
    },
    yaxis: {
      title: ylabel,
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(128, 128, 128, 0.3)',
      gridwidth: 0.3,
      scaleanchor: 'x',
      scaleratio: 1
    },
    plot_bgcolor: '#00008B',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 80, t: 50, b: 60 },
    height: 400
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  };

  Plotly.newPlot(divId, [trace], layout, config);
}

function createSurveyPlot(histData, divId, title, xlabel, ylabel) {
  // Survey colorscale (reversed from QM: dark blue -> cyan -> yellow -> dark red)
  const surveyColorscale = [
    [0.0, '#00008B'],  // Dark blue (low density)
    [0.1, '#0000CD'],  // Medium blue
    [0.2, '#1E90FF'],  // Dodger blue
    [0.3, '#00FFFF'],  // Cyan
    [0.4, '#00FF7F'],  // Spring green
    [0.5, '#ADFF2F'],  // Green yellow
    [0.6, '#FFFF00'],  // Yellow
    [0.7, '#FFD700'],  // Gold
    [0.8, '#FF8C00'],  // Dark orange
    [0.9, '#DC143C'],  // Crimson
    [1.0, '#8B0000']   // Dark red (high density)
  ];

  const trace = {
    type: 'contour',
    x: histData.x_edges,
    y: histData.y_edges,
    z: histData.histogram,
    colorscale: surveyColorscale,
    contours: {
      coloring: 'heatmap',
      showlabels: false
    },
    colorbar: {
      title: 'Density',
      titleside: 'right'
    },
    line: {
      width: 0.5,
      color: 'rgba(128, 128, 128, 0.2)',
      smoothing: 0.85
    },
    showscale: true,
    zauto: false,
    zmin: 0,
    zmax: Math.max(...histData.histogram.flat()) * 0.5
  };

  const layout = {
    title: {
      text: title,
      font: { size: 14, weight: 'bold' }
    },
    xaxis: {
      title: xlabel,
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(255, 255, 255, 0.2)',
      gridwidth: 0.3
    },
    yaxis: {
      title: ylabel,
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(255, 255, 255, 0.2)',
      gridwidth: 0.3,
      scaleanchor: 'x',
      scaleratio: 1
    },
    plot_bgcolor: '#00008B',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 80, t: 50, b: 60 },
    height: 400
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  };

  Plotly.newPlot(divId, [trace], layout, config);
}

function createGrid(x, y, z, size) {
  // Create a regular grid from scattered data
  const grid = {
    x: [],
    y: [],
    z: []
  };

  // Create grid axes
  for (let i = 0; i < size; i++) {
    grid.x.push(i * 360 / (size - 1));
    grid.y.push(i * 360 / (size - 1));
  }

  // Initialize grid
  const gridZ = Array(size).fill(0).map(() => Array(size).fill(0));
  const counts = Array(size).fill(0).map(() => Array(size).fill(0));

  // Bin data points into grid
  for (let i = 0; i < x.length; i++) {
    const xi = Math.floor(x[i] / 360 * (size - 1));
    const yi = Math.floor(y[i] / 360 * (size - 1));

    if (xi >= 0 && xi < size && yi >= 0 && yi < size) {
      gridZ[yi][xi] += z[i];
      counts[yi][xi] += 1;
    }
  }

  // Average values in each bin
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (counts[i][j] > 0) {
        gridZ[i][j] /= counts[i][j];
      }
    }
  }

  // Fill empty cells with nearest neighbor
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (counts[i][j] === 0) {
        // Find nearest non-zero neighbor
        let minDist = Infinity;
        let nearestValue = 0;

        for (let ii = 0; ii < size; ii++) {
          for (let jj = 0; jj < size; jj++) {
            if (counts[ii][jj] > 0) {
              const dist = Math.sqrt((i - ii) ** 2 + (j - jj) ** 2);
              if (dist < minDist) {
                minDist = dist;
                nearestValue = gridZ[ii][jj];
              }
            }
          }
        }

        gridZ[i][j] = nearestValue;
      }
    }
  }

  grid.z = gridZ;
  return grid;
}

// Global QM vs Survey tool module
// Displays T3PS4 QM Energy Surfaces vs PDB Survey Distributions

export function getHTML() {
  return `
    <div class="qm-survey-container">
      <div class="qm-survey-header">
        <h2>T3PS Global Energy Surfaces vs Nucleic Acid Survey Distributions</h2>
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
  // Check if Plotly is available
  if (typeof Plotly === 'undefined') {
    console.error('Plotly.js is not loaded!');
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="color: red;">
          <h3>Error</h3>
          <p>Plotly.js library is not loaded. Please refresh the page.</p>
        </div>
      `;
    }
    return;
  }

  // Load data and create plots
  await loadDataAndPlot();
}

async function loadDataAndPlot() {
  const loadingOverlay = document.getElementById('loading-overlay');

  try {
    // Load all data files
    const [agQM, ezQM, zaQM] = await Promise.all([
      loadCSV('assets/global_ag_qm.csv'),
      loadCSV('assets/global_ez_qm.csv'),
      loadCSV('assets/global_za_qm.csv')
    ]);

    const [agSurvey, ezSurvey, zaSurvey] = await Promise.all([
      loadJSON('assets/survey_ag_hist.json'),
      loadJSON('assets/survey_ez_hist.json'),
      loadJSON('assets/survey_za_hist.json')
    ]);

    // Hide loading overlay
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }

    // Create all plots
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

  } catch (error) {
    console.error('Error loading data:', error);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="color: red; max-width: 500px;">
          <h3>Error Loading Data</h3>
          <p><strong>Message:</strong> ${error.message}</p>
          <p><strong>Stack:</strong></p>
          <pre style="text-align: left; font-size: 11px; overflow-x: auto;">${error.stack || 'No stack trace'}</pre>
          <p style="margin-top: 20px; font-size: 12px;">
            Please check the browser console (F12) for more details.
          </p>
        </div>
      `;
    }
  }
}

async function loadCSV(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();

  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(`CSV file ${url} appears to be empty or invalid`);
  }

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
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return json;
}

function createQMPlot(data, angle1Key, angle2Key, divId, title, xlabel, ylabel, vmax) {
  // Extract data points - use scatter data for better interpolation
  const angle1 = data.map(d => d[angle1Key]);
  const angle2 = data.map(d => d[angle2Key]);
  const energies = data.map(d => d.energy_rel);

  // Add periodic boundary points for smooth wrapping
  const angle1Ext = [...angle1];
  const angle2Ext = [...angle2];
  const energiesExt = [...energies];

  for (let i = 0; i < data.length; i++) {
    const a1 = angle1[i];
    const a2 = angle2[i];
    const e = energies[i];

    // Add points at boundaries
    if (a1 <= 30) {
      angle1Ext.push(a1 + 360);
      angle2Ext.push(a2);
      energiesExt.push(e);
    }
    if (a1 >= 330) {
      angle1Ext.push(a1 - 360);
      angle2Ext.push(a2);
      energiesExt.push(e);
    }
    if (a2 <= 30) {
      angle1Ext.push(a1);
      angle2Ext.push(a2 + 360);
      energiesExt.push(e);
    }
    if (a2 >= 330) {
      angle1Ext.push(a1);
      angle2Ext.push(a2 - 360);
      energiesExt.push(e);
    }
  }

  // Map angle keys to Greek symbols for hover text
  const angle1Name = angle1Key === 'alpha' ? 'α' : (angle1Key === 'epsilon' ? 'ε' : 'ζ');
  const angle2Name = angle2Key === 'gamma' ? 'γ' : (angle2Key === 'zeta' ? 'ζ' : 'α');

  // Jet colorscale for QM (dark red -> yellow -> cyan -> dark blue)
  // Exactly matches Python's colors_list_qm with 20 colors evenly spaced
  const qmColors = [
    '#8B0000', '#B22222', '#DC143C', '#FF0000', '#FF4500',
    '#FF6347', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00',
    '#ADFF2F', '#00FF00', '#00FF7F', '#00FFFF', '#00CED1',
    '#00BFFF', '#1E90FF', '#0000FF', '#0000CD', '#00008B'
  ];
  const qmColorscale = qmColors.map((color, i) => [i / 19, color]);

  const trace = {
    type: 'contour',
    x: angle1Ext,
    y: angle2Ext,
    z: energiesExt,
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
    showscale: true,
    // Enable automatic Delaunay triangulation and interpolation
    ncontours: 30,
    connectgaps: true,
    // Use more grid points for smoother interpolation
    autocontour: false,
    hovertemplate: `${angle1Name}: %{x:.0f}°<br>${angle2Name}: %{y:.0f}°<br>ΔE: %{z:.3f} kcal/mol<extra></extra>`
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
      gridwidth: 0.3,
      constrain: 'domain',
      autorange: false,
      fixedrange: false
    },
    yaxis: {
      title: ylabel,
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(128, 128, 128, 0.3)',
      gridwidth: 0.3,
      scaleanchor: 'x',
      scaleratio: 1,
      constrain: 'domain',
      autorange: false,
      fixedrange: false
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

  // Extract angle symbols from labels for hover text
  const angle1Name = xlabel.split(' ')[0];  // 'α (degrees)' -> 'α'
  const angle2Name = ylabel.split(' ')[0];  // 'γ (degrees)' -> 'γ'

  // Survey colorscale (reversed from QM: dark blue -> cyan -> yellow -> dark red)
  // Exactly matches Python's colors_list with 20 colors evenly spaced
  const surveyColors = [
    '#00008B', '#0000FF', '#4169E1', '#00BFFF', '#00CED1',
    '#00FFFF', '#00FF7F', '#00FF00', '#7FFF00', '#ADFF2F',
    '#FFFF00', '#FFD700', '#FFA500', '#FF8C00', '#FF6347',
    '#FF4500', '#FF0000', '#DC143C', '#B22222', '#8B0000'
  ];
  const surveyColorscale = surveyColors.map((color, i) => [i / 19, color]);

  // Transpose histogram (numpy.histogram2d returns (nx, ny) but contourf needs (ny, nx))
  const histTransposed = transpose2D(histData.histogram);

  // Calculate vmax in original space first (matching Python)
  const histPlusOne = histTransposed.map(row => row.map(val => val + 1));

  // Find max value more efficiently (avoid spreading huge arrays)
  let maxValOriginal = 0;
  for (const row of histPlusOne) {
    const rowMax = Math.max(...row);
    if (rowMax > maxValOriginal) maxValOriginal = rowMax;
  }

  const vmaxOriginal = maxValOriginal * 0.5;  // Python: vmax = np.max(hist_plot) * 0.5
  const vmax = Math.log10(vmaxOriginal);       // Convert to log space

  // Apply log transform to histogram data (add 1 to avoid log(0))
  const histLog = histTransposed.map(row =>
    row.map(val => Math.log10(val + 1))
  );

  const nlevels = 20;  // Number of contour levels (matching Python)

  const trace = {
    type: 'contour',
    x: histData.x_edges,
    y: histData.y_edges,
    z: histLog,
    colorscale: surveyColorscale,
    contours: {
      coloring: 'heatmap',
      showlabels: false,
      start: 0,
      end: vmax,
      size: vmax / nlevels
    },
    colorbar: {
      title: 'Log Density',
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
    zmax: vmax,
    hovertemplate: `${angle1Name}: %{x:.0f}°<br>${angle2Name}: %{y:.0f}°<br>LD: %{z:.3f}<extra></extra>`
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
      gridwidth: 0.3,
      constrain: 'domain',
      autorange: false,
      fixedrange: false
    },
    yaxis: {
      title: ylabel,
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(255, 255, 255, 0.2)',
      gridwidth: 0.3,
      scaleanchor: 'x',
      scaleratio: 1,
      constrain: 'domain',
      autorange: false,
      fixedrange: false
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

// Utility function to transpose a 2D array
function transpose2D(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const transposed = Array(cols).fill(0).map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      transposed[j][i] = matrix[i][j];
    }
  }

  return transposed;
}

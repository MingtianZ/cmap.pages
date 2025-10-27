// Global QM/Survey single plot display tool
// Displays individual plots in larger size with interactive xyz viewer
import { XYZViewer } from '../viewer.js';
import { getAtomName, identifyDihedral } from '../t3ps-config.js';

export function getHTML() {
  return `
    <div class="single-plot-container">
      <div class="single-plot-wrapper" id="single-plot-wrapper"></div>
      <div class="xyz-viewer-panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0;">Structure Viewer</h3>
          <button id="download-xyz-btn" class="download-btn" style="display: none; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">Download XYZ</button>
        </div>
        <div class="viewer-container" id="structure-viewer">
          <div class="loading-message">Click on the plot to load a structure</div>
          <div id="measurePanel">
            <h3>Geometry Measurement</h3>
            <p style="color: #666; margin: 0 0 8px 0;">Click atoms: 2=distance, 3=angle, 4=dihedral</p>
            <div class="atom-list" id="atomList">
              <p style="color: #999; margin: 8px 0;">No atoms selected</p>
            </div>
            <div id="measurementResult"></div>
            <button class="clear-btn" id="clearBtn">Clear Selection</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  // Find the currently active tool panel to avoid duplicate ID issues
  const container = document.querySelector('.tool-panel.active');
  if (!container) {
    console.error('Active tool panel not found');
    return;
  }

  const wrapper = container.querySelector('.single-plot-wrapper');
  if (!wrapper) {
    console.error('Single plot wrapper not found in active panel');
    return;
  }

  // Get configuration from container's data attributes
  const type = container.dataset.plotType;
  const angle1 = container.dataset.angle1;
  const angle2 = container.dataset.angle2;
  const title = container.dataset.plotTitle;

  if (!type || !angle1 || !angle2 || !title) {
    console.error('Missing configuration data attributes');
    wrapper.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: red;">
        <div>
          <h3>Configuration Error</h3>
          <p>Missing data attributes: type=${type}, angle1=${angle1}, angle2=${angle2}</p>
        </div>
      </div>
    `;
    return;
  }

  // Check if Plotly is available
  if (typeof Plotly === 'undefined') {
    console.error('Plotly is not loaded!');
    wrapper.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: red;">
        <div>
          <h3>Error</h3>
          <p>Plotly.js library is not loaded. Please refresh the page.</p>
        </div>
      </div>
    `;
    return;
  }

  // Hide structure viewer for Survey plots (only show for QM)
  const xyzPanel = container.querySelector('.xyz-viewer-panel');
  const plotWrapper = container.querySelector('.single-plot-wrapper');

  if (type === 'survey') {
    if (xyzPanel) xyzPanel.style.display = 'none';
    if (plotWrapper) plotWrapper.style.width = 'calc(100vw - 40px)';
  } else {
    if (xyzPanel) xyzPanel.style.display = 'flex';
    if (plotWrapper) plotWrapper.style.width = 'calc(50vw - 20px)';
  }

  try {
    if (type === 'qm') {
      await loadAndDisplayQM(angle1, angle2, title, container);
    } else if (type === 'survey') {
      await loadAndDisplaySurvey(angle1, angle2, title, container);
    }
  } catch (error) {
    console.error('Error loading plot:', error);
    wrapper.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: red;">
        <div>
          <h3>Error Loading Plot</h3>
          <p><strong>Message:</strong> ${error.message}</p>
          <p><strong>Stack:</strong></p>
          <pre style="text-align: left; font-size: 11px; overflow-x: auto; max-width: 500px;">${error.stack || 'No stack trace'}</pre>
        </div>
      </div>
    `;
  }
}

async function loadAndDisplayQM(angle1, angle2, title, container) {
  // Load QM data
  const csvFile = `assets/global_${angle1}${angle2}_qm.csv`;

  const response = await fetch(csvFile);
  if (!response.ok) throw new Error(`Failed to load ${csvFile}`);
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

  // Create plot container within the active panel
  const wrapper = container.querySelector('.single-plot-wrapper');
  wrapper.innerHTML = '<div class="plot-div" style="width: 100%; height: 100%;"></div>';
  const plotDiv = wrapper.querySelector('.plot-div');

  // Determine angle keys and vmax based on angle pair
  let angle1Key, angle2Key, xlabel, ylabel, vmax;

  if (angle1 === 'a' && angle2 === 'g') {
    angle1Key = 'alpha';
    angle2Key = 'gamma';
    xlabel = 'α (degrees)';
    ylabel = 'γ (degrees)';
    vmax = 12;
  } else if (angle1 === 'e' && angle2 === 'z') {
    angle1Key = 'epsilon';
    angle2Key = 'zeta';
    xlabel = 'ε (degrees)';
    ylabel = 'ζ (degrees)';
    vmax = 9;
  } else if (angle1 === 'z' && angle2 === 'a') {
    angle1Key = 'zeta';
    angle2Key = 'alpha';
    xlabel = 'ζ (degrees)';
    ylabel = 'α (degrees)';
    vmax = 8;
  }

  // Pass DOM element instead of string ID
  createQMPlotLarge(data, angle1Key, angle2Key, plotDiv, title, xlabel, ylabel, vmax);

  // Add click event handler for loading xyz structures
  setupPlotClickHandler(plotDiv, angle1, angle2, container, 'qm', data, angle1Key, angle2Key);
}

async function loadAndDisplaySurvey(angle1, angle2, title, container) {
  // Load survey histogram data
  const jsonFile = `assets/survey_${angle1}${angle2}_hist.json`;

  const response = await fetch(jsonFile);
  if (!response.ok) throw new Error(`Failed to load ${jsonFile}`);
  const histData = await response.json();

  // Create plot container within the active panel
  const wrapper = container.querySelector('.single-plot-wrapper');
  wrapper.innerHTML = '<div class="plot-div" style="width: 100%; height: 100%;"></div>';
  const plotDiv = wrapper.querySelector('.plot-div');

  // Determine labels
  let xlabel, ylabel;

  if (angle1 === 'a' && angle2 === 'g') {
    xlabel = 'α (degrees)';
    ylabel = 'γ (degrees)';
  } else if (angle1 === 'e' && angle2 === 'z') {
    xlabel = 'ε (degrees)';
    ylabel = 'ζ (degrees)';
  } else if (angle1 === 'z' && angle2 === 'a') {
    xlabel = 'ζ (degrees)';
    ylabel = 'α (degrees)';
  }

  // Pass DOM element instead of string ID
  createSurveyPlotLarge(histData, plotDiv, title, xlabel, ylabel);
}

// QM plot function for larger display
function createQMPlotLarge(data, angle1Key, angle2Key, divElement, title, xlabel, ylabel, vmax) {
  const angle1 = data.map(d => d[angle1Key]);
  const angle2 = data.map(d => d[angle2Key]);
  const energies = data.map(d => d.energy_rel);

  const angle1Ext = [...angle1];
  const angle2Ext = [...angle2];
  const energiesExt = [...energies];

  for (let i = 0; i < data.length; i++) {
    const a1 = angle1[i];
    const a2 = angle2[i];
    const e = energies[i];

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
        size: 9,
        color: 'white'
      }
    },
    colorbar: {
      title: 'kcal/mol',
      titleside: 'right',
      len: 0.75,
      x: 1.0,
      xpad: 5
    },
    zmin: 0,
    zmax: vmax,
    line: {
      width: 0.5,
      color: 'white',
      smoothing: 0.85
    },
    showscale: true,
    ncontours: 30,
    connectgaps: true,
    autocontour: false,
    hovertemplate: `${angle1Name}: %{x:.0f}°<br>${angle2Name}: %{y:.0f}°<br>ΔE: %{z:.3f} kcal/mol<extra></extra>`
  };

  const layout = {
    title: {
      text: title,
      font: { size: 16, weight: 'bold' }
    },
    xaxis: {
      title: { text: xlabel, font: { size: 13 } },
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(128, 128, 128, 0.3)',
      gridwidth: 0.3,
      constrain: 'domain',
      autorange: false,
      fixedrange: false
    },
    yaxis: {
      title: { text: ylabel, font: { size: 13 } },
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
    margin: { l: 50, r: 50, t: 40, b: 50 },
    autosize: true
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  };

  Plotly.newPlot(divElement, [trace], layout, config);
}

// Survey plot function for larger display
function createSurveyPlotLarge(histData, divElement, title, xlabel, ylabel) {
  // Extract angle symbols from labels for hover text
  const angle1Name = xlabel.split(' ')[0];  // 'α (degrees)' -> 'α'
  const angle2Name = ylabel.split(' ')[0];  // 'γ (degrees)' -> 'γ'

  const surveyColors = [
    '#00008B', '#0000FF', '#4169E1', '#00BFFF', '#00CED1',
    '#00FFFF', '#00FF7F', '#00FF00', '#7FFF00', '#ADFF2F',
    '#FFFF00', '#FFD700', '#FFA500', '#FF8C00', '#FF6347',
    '#FF4500', '#FF0000', '#DC143C', '#B22222', '#8B0000'
  ];
  const surveyColorscale = surveyColors.map((color, i) => [i / 19, color]);

  const histTransposed = transpose2D(histData.histogram);

  const histPlusOne = histTransposed.map(row => row.map(val => val + 1));

  let maxValOriginal = 0;
  for (const row of histPlusOne) {
    const rowMax = Math.max(...row);
    if (rowMax > maxValOriginal) maxValOriginal = rowMax;
  }

  const vmaxOriginal = maxValOriginal * 0.5;
  const vmax = Math.log10(vmaxOriginal);

  const histLog = histTransposed.map(row =>
    row.map(val => Math.log10(val + 1))
  );

  const nlevels = 20;

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
      titleside: 'right',
      len: 0.75,
      x: 1.0,
      xpad: 5
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
      font: { size: 16, weight: 'bold' }
    },
    xaxis: {
      title: { text: xlabel, font: { size: 13 } },
      range: [0, 360],
      dtick: 60,
      gridcolor: 'rgba(255, 255, 255, 0.2)',
      gridwidth: 0.3,
      constrain: 'domain',
      autorange: false,
      fixedrange: false
    },
    yaxis: {
      title: { text: ylabel, font: { size: 13 } },
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
    margin: { l: 50, r: 50, t: 40, b: 50 },
    autosize: true
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  };

  Plotly.newPlot(divElement, [trace], layout, config);
}

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

// Setup click handler for loading xyz structures from GitHub
function setupPlotClickHandler(plotDiv, angle1, angle2, container, type = 'survey', csvData = null, angle1Key = null, angle2Key = null) {
  // Initialize XYZ viewer in the right panel
  const viewerContainer = container.querySelector('#structure-viewer');
  if (!viewerContainer) {
    console.error('Structure viewer container not found');
    return;
  }

  // Update measurement panel callback
  function updateMeasurePanel(data) {
    const atomList = container.querySelector('#atomList');
    const measurementResult = container.querySelector('#measurementResult');
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];

    if (!atomList || !measurementResult) return;

    if (data.count === 0) {
      atomList.innerHTML = '<p style="color: #999; margin: 8px 0;">No atoms selected</p>';
    } else {
      atomList.innerHTML = data.atoms.map((atom, idx) => {
        const charmmName = getAtomName(atom.serial);
        return `
          <div class="atom-item">
            <span class="atom-color" style="background: ${colors[idx]}"></span>
            <span>${idx + 1}. ${atom.elem} #${atom.serial} (<strong>${charmmName}</strong>)</span>
            <span style="color: #999; font-size: 11px;">
              (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})
            </span>
          </div>
        `;
      }).join('');
    }

    // Display measurement result based on number of selected atoms
    if (data.distance) {
      measurementResult.innerHTML = `
        <div class="dihedral-result">
          <div style="margin-bottom: 4px;">Distance:</div>
          <strong style="font-size: 16px;">${data.distance.angstroms.toFixed(4)} Å</strong>
        </div>
      `;
    } else if (data.angle) {
      measurementResult.innerHTML = `
        <div class="dihedral-result">
          <div style="margin-bottom: 4px;">Angle:</div>
          <strong style="font-size: 16px;">${data.angle.degrees.toFixed(2)}°</strong>
          <div style="color: #666; font-size: 11px; margin-top: 4px;">
            ${data.angle.radians.toFixed(4)} rad
          </div>
        </div>
      `;
    } else if (data.dihedral) {
      // Try to identify the dihedral angle
      const selectedSerials = data.atoms.map(a => a.serial);
      const matches = identifyDihedral(selectedSerials);

      let dihedralInfo = '';
      if (matches.length > 0) {
        // Display all matches (usually just one)
        dihedralInfo = matches.map(match => {
          let typeLabel = '';
          if (match.type === 'backbone') {
            typeLabel = '<span style="color: #2563eb; font-weight: bold;">Backbone Dihedral</span>';
          } else if (match.type === 'sugar1') {
            typeLabel = '<span style="color: #059669; font-weight: bold;">Sugar 1 Pseudorotation</span>';
          } else if (match.type === 'sugar2') {
            typeLabel = '<span style="color: #d97706; font-weight: bold;">Sugar 2 Pseudorotation</span>';
          }

          // Add reverse indicator if atoms were selected in reverse order
          const reverseIndicator = match.isReverse
            ? '<span style="color: #dc2626; font-size: 14px; margin-left: 8px;" title="Atoms selected in reverse order">⇄</span>'
            : '';

          return `
            <div style="margin-bottom: 8px;">
              ${typeLabel}
              <div style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 4px 0;">
                ${match.name}${reverseIndicator}
              </div>
              <div style="color: #666; font-size: 11px;">
                ${match.description}${match.isReverse ? ' (reversed)' : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      measurementResult.innerHTML = `
        <div class="dihedral-result">
          ${dihedralInfo}
          <div style="margin-top: ${matches.length > 0 ? '8px' : '0'}; padding-top: ${matches.length > 0 ? '8px' : '0'}; border-top: ${matches.length > 0 ? '1px solid #e5e7eb' : 'none'};">
            <div style="margin-bottom: 4px;">Dihedral Angle:</div>
            <strong style="font-size: 16px;">${data.dihedral.degrees.toFixed(2)}°</strong>
            <div style="color: #666; font-size: 11px; margin-top: 4px;">
              ${data.dihedral.radians.toFixed(4)} rad
            </div>
          </div>
        </div>
      `;
    } else {
      measurementResult.innerHTML = '';
    }
  }

  // Create XYZViewer instance with measurement callback
  let viewer = null;
  try {
    viewer = new XYZViewer('structure-viewer', {
      backgroundColor: 'white',
      onSelectionChange: updateMeasurePanel
    });
  } catch (error) {
    console.error('Failed to create XYZViewer:', error);
    return;
  }

  // Setup clear button
  const clearBtn = container.querySelector('#clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      viewer.clearSelection();
    });
  }

  // Listen for click events on the plot
  plotDiv.on('plotly_click', async function(data) {
    if (!data.points || data.points.length === 0) return;

    const point = data.points[0];
    const clickedX = point.x; // angle1 value (α, ε, or ζ)
    const clickedY = point.y; // angle2 value (γ, ζ, or α)

    // Round to nearest 15-degree grid point (24x24 grid, 360/24 = 15)
    const gridX = Math.round(clickedX / 15) * 15;
    const gridY = Math.round(clickedY / 15) * 15;

    // Normalize to 0-345 range (wrapping around)
    // All files use 0-345 grid uniformly, no need to check 0/360 equivalence
    const normalizedX = ((gridX % 360) + 360) % 360;
    const normalizedY = ((gridY % 360) + 360) % 360;

    // Construct filename for 0-345 grid
    // Format: global_{angle1}{angle2}_{letter1}{x}_{letter2}{y}.xyz
    // Example: global_ag_a0_g0.xyz for α=0°, γ=0°
    const angle1Letter = angle1 === 'a' ? 'a' : (angle1 === 'e' ? 'e' : 'z');
    const angle2Letter = angle2 === 'g' ? 'g' : (angle2 === 'z' ? 'z' : 'a');
    const xyzFile = `global_${angle1}${angle2}_${angle1Letter}${normalizedX}_${angle2Letter}${normalizedY}.xyz`;
    const githubUrl = `https://raw.githubusercontent.com/MingtianZ/cmap.pages/refs/heads/main/xyz/${xyzFile}`;

    // Show loading message (create if not exists)
    let loadingMsg = viewerContainer.querySelector('.loading-message');
    if (!loadingMsg) {
      loadingMsg = document.createElement('div');
      loadingMsg.className = 'loading-message';
      viewerContainer.appendChild(loadingMsg);
    }
    loadingMsg.style.display = 'block';
    loadingMsg.textContent = `Loading ${xyzFile}...`;

    try {
      // Fetch the xyz file from GitHub (single request, all files exist in 0-345 grid)
      const response = await fetch(githubUrl);
      if (!response.ok) {
        throw new Error(`File not found: ${xyzFile} (${response.status})`);
      }
      const xyzData = await response.text();

      // Load into viewer (this will clear previous model)
      viewer.loadModel(xyzData, 'xyz');
      // Enable clicking for dihedral measurement (T3PS structures are small ~60 atoms)
      viewer._enableAtomClick();

      // Hide loading message
      loadingMsg.style.display = 'none';

      // Find energy data for this point (only for QM plots)
      let energyInfo = '';
      if (type === 'qm' && csvData) {
        // Find the data point matching the clicked coordinates
        // CSV data may use 360° instead of 0° due to calculation conventions
        const dataPoint = csvData.find(d => {
          const d1 = d[angle1Key];
          const d2 = d[angle2Key];
          // Check exact match
          if (d1 === normalizedX && d2 === normalizedY) return true;
          // Check 0/360 equivalence
          const x1 = normalizedX === 0 ? 360 : normalizedX;
          const y1 = normalizedY === 0 ? 360 : normalizedY;
          if (d1 === x1 && d2 === y1) return true;
          return false;
        });

        if (dataPoint && dataPoint.qm_energy !== undefined) {
          const absEnergy = dataPoint.qm_energy; // Hartree
          const relEnergy = dataPoint.energy_rel; // kcal/mol
          energyInfo = ` | E = ${absEnergy.toFixed(6)} Ha, ΔE = ${relEnergy.toFixed(2)} kcal/mol`;
        }
      }

      // Update panel title
      const panelTitle = container.querySelector('.xyz-viewer-panel h3');
      if (panelTitle) {
        const angle1Symbol = angle1 === 'a' ? 'α' : (angle1 === 'e' ? 'ε' : 'ζ');
        const angle2Symbol = angle2 === 'g' ? 'γ' : (angle2 === 'z' ? 'ζ' : 'α');
        panelTitle.textContent = `Structure: ${angle1Symbol}=${normalizedX}°, ${angle2Symbol}=${normalizedY}°${energyInfo}`;
      }

      // Enable download button and set up download
      const downloadBtn = container.querySelector('#download-xyz-btn');
      if (downloadBtn) {
        downloadBtn.style.display = 'block';
        downloadBtn.onclick = function() {
          // Create blob and download
          const blob = new Blob([xyzData], { type: 'chemical/x-xyz' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = xyzFile;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
      }
    } catch (error) {
      console.error('Error loading xyz file:', error);
      loadingMsg.style.display = 'block';
      loadingMsg.textContent = `Error: ${error.message}. Click to try another point.`;
    }
  });
}

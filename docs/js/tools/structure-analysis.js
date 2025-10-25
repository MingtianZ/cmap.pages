// Structure Analysis tool - Analyze DNA/RNA structure and overlay on CMAP
import { XYZViewer } from '../viewer.js';
import { getAtomName, identifyDihedral, BACKBONE_DIHEDRALS } from '../t3ps-config.js';

export function getHTML() {
  return `
    <div class="structure-analysis-container" style="display: flex; height: 100%; gap: 10px;">
      <!-- Left panel: Three CMAP plots -->
      <div class="cmap-panel" style="flex: 0 0 50%; display: flex; flex-direction: column; gap: 10px; overflow-y: auto;">
        <div class="cmap-plot-container" style="height: 33%; min-height: 250px;">
          <div id="plot-ag-survey" style="width: 100%; height: 100%;"></div>
        </div>
        <div class="cmap-plot-container" style="height: 33%; min-height: 250px;">
          <div id="plot-ez-survey" style="width: 100%; height: 100%;"></div>
        </div>
        <div class="cmap-plot-container" style="height: 33%; min-height: 250px;">
          <div id="plot-za-survey" style="width: 100%; height: 100%;"></div>
        </div>
      </div>

      <!-- Right panel: Molecule viewer -->
      <div class="viewer-panel" style="flex: 1; display: flex; flex-direction: column;">
        <div class="tool-header" style="margin-bottom: 10px;">
          <label for="fileInput-analysis" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; margin-right: 6px;">Choose File</label>
          <input id="fileInput-analysis" type="file" accept=".pdb,.cif" style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; overflow: hidden;" />
          <button id="fitBtn-analysis" style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">Fit</button>
          <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; padding: 4px 8px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
            <label for="pdbInput-analysis" style="font-size: 12px; color: #6b7280; font-weight: 500;">PDB ID:</label>
            <input id="pdbInput-analysis" type="text" placeholder="e.g. 1BNA"
                   style="width: 80px; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; text-transform: uppercase;"
                   maxlength="4" />
            <button id="rcsbBtn-analysis" style="padding: 4px 10px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;">
              RCSB
            </button>
          </div>
          <span class="pill" style="font-size: 12px; margin-left: 8px;">📁 DNA/RNA auto-analysis</span>
          <div id="fileInfo-analysis" style="display: none; margin-left: 8px; font-size: 12px; color: #6b7280;">
            <span id="fileName-analysis" style="color: #3b82f6; cursor: pointer; text-decoration: underline;"></span>
            <span style="margin-left: 8px;">Atoms: <span id="atomCount-analysis"></span></span>
            <span style="margin-left: 8px;">Bases: <span id="baseCount-analysis"></span></span>
          </div>
        </div>

        <div id="viewer-analysis" style="flex: 1; position: relative; background: white; border: 1px solid #ddd; border-radius: 4px;">
          <div class="loading-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #999;">
            Load a DNA/RNA structure to analyze
          </div>
        </div>

        <div id="analysis-results" style="margin-top: 10px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; max-height: 150px; overflow-y: auto; display: none;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Dihedral Angles Analysis</h4>
          <div id="results-content"></div>
        </div>
      </div>
    </div>

    <div id="loadingOverlay-analysis" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div id="loadingTitle-analysis" style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Loading...</div>
        <div id="loadingMessage-analysis" style="font-size: 14px; color: #666;"></div>
      </div>
    </div>
  `;
}

export async function init() {
  // Initialize 3Dmol viewer
  const viewer = new XYZViewer('viewer-analysis', {
    backgroundColor: 'white'
  });

  let currentStructure = null; // Store loaded structure data

  // Load and display survey plots
  await loadSurveyPlots();

  // File input handler
  const fileInput = document.getElementById('fileInput-analysis');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadStructure(file, viewer);
  });

  // RCSB loader
  const rcsbBtn = document.getElementById('rcsbBtn-analysis');
  const pdbInput = document.getElementById('pdbInput-analysis');

  pdbInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  pdbInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      rcsbBtn.click();
    }
  });

  rcsbBtn.addEventListener('click', async () => {
    const pdbId = pdbInput.value.trim().toUpperCase();
    if (!pdbId || !/^[0-9A-Z]{4}$/i.test(pdbId)) {
      alert('Invalid PDB ID. Please enter a 4-character code.');
      return;
    }

    const loadingOverlay = document.getElementById('loadingOverlay-analysis');
    loadingOverlay.style.display = 'flex';

    try {
      // Try PDB format first, then CIF
      let format = 'pdb';
      let url = `https://files.rcsb.org/download/${pdbId}.pdb`;
      let response = await fetch(url);

      if (!response.ok && response.status === 404) {
        format = 'cif';
        url = `https://files.rcsb.org/download/${pdbId}.cif`;
        response = await fetch(url);
      }

      if (!response.ok) {
        throw new Error(`${pdbId} not found`);
      }

      const text = await response.text();
      const fileName = `${pdbId}.${format}`;
      currentStructure = { text, format, name: fileName };
      currentFileData = { text, name: fileName };

      viewer.loadModel(text, format);
      viewer.fit();

      pdbInput.value = '';

      const loadingMsg = document.querySelector('#viewer-analysis .loading-message');
      if (loadingMsg) loadingMsg.style.display = 'none';

      // Auto-analyze dihedrals
      setTimeout(() => analyzeDihedrals(viewer, fileName), 100);

    } catch (error) {
      alert(`Failed to load from RCSB: ${error.message}`);
    } finally {
      loadingOverlay.style.display = 'none';
    }
  });

  // Fit button
  document.getElementById('fitBtn-analysis').onclick = () => viewer.fit();
}

async function loadSurveyPlots() {
  try {
    // Load survey data
    const [agSurvey, ezSurvey, zaSurvey] = await Promise.all([
      loadJSON('assets/survey_ag_hist.json'),
      loadJSON('assets/survey_ez_hist.json'),
      loadJSON('assets/survey_za_hist.json')
    ]);

    // Create plots
    createSurveyPlot(agSurvey, 'plot-ag-survey', 'PDB Survey: α-γ', 'α (degrees)', 'γ (degrees)');
    createSurveyPlot(ezSurvey, 'plot-ez-survey', 'PDB Survey: ε-ζ', 'ε (degrees)', 'ζ (degrees)');
    createSurveyPlot(zaSurvey, 'plot-za-survey', 'PDB Survey: ζ-α', 'ζ (degrees)', 'α (degrees)');

  } catch (error) {
    console.error('Error loading survey plots:', error);
  }
}

async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return await response.json();
}

async function loadStructure(file, viewer) {
  const loadingMsg = document.querySelector('#viewer-analysis .loading-message');
  if (loadingMsg) {
    loadingMsg.style.display = 'block';
    loadingMsg.textContent = 'Loading structure...';
  }

  try {
    const text = await file.text();
    const format = detectFormat(file.name);

    currentStructure = { text, format, name: file.name };
    currentFileData = { text, name: file.name };

    viewer.loadModel(text, format);
    viewer.fit();

    if (loadingMsg) loadingMsg.style.display = 'none';

    // Auto-analyze dihedrals
    setTimeout(() => analyzeDihedrals(viewer, file.name), 100);

  } catch (error) {
    console.error('Error loading structure:', error);
    alert(`Failed to load structure: ${error.message}`);
  }
}

function detectFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const formatMap = {
    'pdb': 'pdb',
    'cif': 'cif',
    'mmcif': 'cif'
  };
  return formatMap[ext] || 'pdb';
}

function createSurveyPlot(histData, divId, title, xlabel, ylabel) {
  const angle1Name = xlabel.split(' ')[0];
  const angle2Name = ylabel.split(' ')[0];

  const surveyColors = [
    '#00008B', '#0000CD', '#0000FF', '#1E90FF', '#00BFFF',
    '#00CED1', '#00FFFF', '#00FF7F', '#00FF00', '#ADFF2F',
    '#FFFF00', '#FFD700', '#FFA500', '#FF8C00', '#FF6347',
    '#FF4500', '#FF0000', '#DC143C', '#B22222', '#8B0000'
  ];
  const surveyColorscale = surveyColors.map((color, i) => [i / 19, color]);

  const histTransposed = transpose2D(histData.histogram);

  let maxValOriginal = 0;
  for (const row of histTransposed) {
    const rowMax = Math.max(...row);
    if (rowMax > maxValOriginal) maxValOriginal = rowMax;
  }

  const vmaxOriginal = maxValOriginal * 0.5;
  const vmax = Math.log10(vmaxOriginal);

  const histLog = histTransposed.map(row =>
    row.map(val => Math.log10(val + 1))
  );

  const trace = {
    type: 'contour',
    x: histData.x_edges,
    y: histData.y_edges,
    z: histLog,
    colorscale: surveyColorscale,
    zmin: 0,
    zmax: vmax,
    line: {
      width: 0.5,
      color: 'white',
      smoothing: 0.85
    },
    showscale: true,
    ncontours: 20,
    connectgaps: true,
    autocontour: false,
    hovertemplate: `${angle1Name}: %{x:.0f}°<br>${angle2Name}: %{y:.0f}°<br>Count: %{z:.2f} (log)<extra></extra>`,
    name: 'Survey Data'
  };

  const layout = {
    title: { text: title, font: { size: 14 } },
    xaxis: {
      title: { text: xlabel, font: { size: 11 } },
      range: [0, 360],
      dtick: 90,
      gridcolor: 'rgba(128, 128, 128, 0.3)',
      constrain: 'domain'
    },
    yaxis: {
      title: { text: ylabel, font: { size: 11 } },
      range: [0, 360],
      dtick: 90,
      gridcolor: 'rgba(128, 128, 128, 0.3)',
      scaleanchor: 'x',
      scaleratio: 1,
      constrain: 'domain'
    },
    plot_bgcolor: '#00008B',
    paper_bgcolor: 'white',
    margin: { l: 50, r: 50, t: 40, b: 40 },
    autosize: true
  };

  const config = {
    responsive: true,
    displayModeBar: false,
    displaylogo: false
  };

  Plotly.newPlot(divId, [trace], layout, config);
}

function transpose2D(matrix) {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const transposed = Array(cols).fill(null).map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      transposed[j][i] = matrix[i][j];
    }
  }

  return transposed;
}

function analyzeDihedrals(viewer, fileName = null) {
  if (!viewer.model) {
    alert('No structure loaded');
    return;
  }

  const atoms = viewer.model.selectedAtoms({});

  // Filter for nucleic acid residues
  const naResidues = ['A', 'G', 'C', 'T', 'U', 'DA', 'DG', 'DC', 'DT'];
  const naAtoms = atoms.filter(atom =>
    atom.resn && naResidues.includes(atom.resn.trim().toUpperCase())
  );

  if (naAtoms.length === 0) {
    alert('No DNA/RNA residues found in this structure. Please load a nucleic acid structure.');
    return;
  }

  // Calculate dihedrals for each residue
  const dihedrals = calculateBackboneDihedrals(naAtoms);

  // Update file info
  updateFileInfo(fileName, atoms.length, dihedrals.length);

  // Display results
  displayResults(dihedrals);

  // Plot on CMAPs
  plotDihedralsOnCMAPs(dihedrals, viewer);
}

function calculateBackboneDihedrals(atoms) {
  // Group atoms by residue
  const residues = {};
  atoms.forEach(atom => {
    const key = `${atom.chain}_${atom.resi}`;
    if (!residues[key]) {
      residues[key] = {
        chain: atom.chain,
        resi: atom.resi,
        resn: atom.resn,
        atoms: []
      };
    }
    residues[key].atoms.push(atom);
  });

  const results = [];

  // Sort residues by chain and number
  const sortedKeys = Object.keys(residues).sort((a, b) => {
    const [chainA, resiA] = a.split('_');
    const [chainB, resiB] = b.split('_');
    if (chainA !== chainB) return chainA.localeCompare(chainB);
    return parseInt(resiA) - parseInt(resiB);
  });

  // Build sequential list for accessing neighboring residues
  const resList = sortedKeys.map(k => residues[k]);

  for (let i = 0; i < resList.length; i++) {
    const prevRes = i > 0 ? resList[i - 1] : null;
    const currRes = resList[i];
    const nextRes = i < resList.length - 1 ? resList[i + 1] : null;

    const angles = {};
    const atomGroups = {}; // Store the 4 atoms for each dihedral

    // Calculate α (O3'(i-1) - P(i) - O5'(i) - C5'(i))
    if (prevRes && prevRes.chain === currRes.chain) {
      const o3p = prevRes.atoms.find(a => a.atom === "O3'" || a.atom === "O3*");
      const p = currRes.atoms.find(a => a.atom === 'P');
      const o5p = currRes.atoms.find(a => a.atom === "O5'" || a.atom === "O5*");
      const c5p = currRes.atoms.find(a => a.atom === "C5'" || a.atom === "C5*");

      if (o3p && p && o5p && c5p) {
        angles.alpha = calculateDihedral(o3p, p, o5p, c5p);
        atomGroups.alpha = [o3p, p, o5p, c5p];
      }
    }

    // Calculate β (P(i) - O5'(i) - C5'(i) - C4'(i))
    const p = currRes.atoms.find(a => a.atom === 'P');
    const o5p = currRes.atoms.find(a => a.atom === "O5'" || a.atom === "O5*");
    const c5p = currRes.atoms.find(a => a.atom === "C5'" || a.atom === "C5*");
    const c4p = currRes.atoms.find(a => a.atom === "C4'" || a.atom === "C4*");

    if (p && o5p && c5p && c4p) {
      angles.beta = calculateDihedral(p, o5p, c5p, c4p);
      atomGroups.beta = [p, o5p, c5p, c4p];
    }

    // Calculate γ (O5'(i) - C5'(i) - C4'(i) - C3'(i))
    const c3p = currRes.atoms.find(a => a.atom === "C3'" || a.atom === "C3*");

    if (o5p && c5p && c4p && c3p) {
      angles.gamma = calculateDihedral(o5p, c5p, c4p, c3p);
      atomGroups.gamma = [o5p, c5p, c4p, c3p];
    }

    // Calculate ε (C4'(i) - C3'(i) - O3'(i) - P(i+1))
    const o3p = currRes.atoms.find(a => a.atom === "O3'" || a.atom === "O3*");
    if (nextRes && nextRes.chain === currRes.chain) {
      const pNext = nextRes.atoms.find(a => a.atom === 'P');

      if (c4p && c3p && o3p && pNext) {
        angles.epsilon = calculateDihedral(c4p, c3p, o3p, pNext);
        atomGroups.epsilon = [c4p, c3p, o3p, pNext];
      }
    }

    // Calculate ζ (C3'(i) - O3'(i) - P(i+1) - O5'(i+1))
    if (nextRes && nextRes.chain === currRes.chain) {
      const pNext = nextRes.atoms.find(a => a.atom === 'P');
      const o5pNext = nextRes.atoms.find(a => a.atom === "O5'" || a.atom === "O5*");

      if (c3p && o3p && pNext && o5pNext) {
        angles.zeta = calculateDihedral(c3p, o3p, pNext, o5pNext);
        atomGroups.zeta = [c3p, o3p, pNext, o5pNext];
      }
    }

    if (Object.keys(angles).length > 0) {
      results.push({
        chain: currRes.chain,
        resi: currRes.resi,
        resn: currRes.resn,
        angles,
        atomGroups
      });
    }
  }

  return results;
}

function calculateDihedral(a1, a2, a3, a4) {
  // Vector from a1 to a2
  const v1 = {
    x: a2.x - a1.x,
    y: a2.y - a1.y,
    z: a2.z - a1.z
  };

  // Vector from a2 to a3
  const v2 = {
    x: a3.x - a2.x,
    y: a3.y - a2.y,
    z: a3.z - a2.z
  };

  // Vector from a3 to a4
  const v3 = {
    x: a4.x - a3.x,
    y: a4.y - a3.y,
    z: a4.z - a3.z
  };

  // Cross products
  const n1 = cross(v1, v2);
  const n2 = cross(v2, v3);

  // Normalize
  const n1Norm = normalize(n1);
  const n2Norm = normalize(n2);

  // Calculate angle
  const cosTheta = dot(n1Norm, n2Norm);
  const v2Norm = normalize(v2);
  const sinTheta = dot(cross(n1Norm, n2Norm), v2Norm);

  let angle = Math.atan2(sinTheta, cosTheta) * (180 / Math.PI);

  // Convert to 0-360 range
  if (angle < 0) angle += 360;

  return angle;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : v;
}

function displayResults(dihedrals) {
  const resultsDiv = document.getElementById('analysis-results');
  const contentDiv = document.getElementById('results-content');

  if (dihedrals.length === 0) {
    contentDiv.innerHTML = '<p style="color: #999;">No backbone dihedrals could be calculated.</p>';
    resultsDiv.style.display = 'block';
    return;
  }

  let html = '<table style="width: 100%; font-size: 12px; border-collapse: collapse;">';
  html += '<tr style="background: #f3f4f6; font-weight: bold;">';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">Chain</th>';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">Residue</th>';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">α</th>';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">β</th>';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">γ</th>';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">ε</th>';
  html += '<th style="padding: 4px; border: 1px solid #ddd;">ζ</th>';
  html += '</tr>';

  dihedrals.forEach(d => {
    html += '<tr>';
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.chain}</td>`;
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.resn}${d.resi}</td>`;
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.angles.alpha !== undefined ? d.angles.alpha.toFixed(1) + '°' : '-'}</td>`;
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.angles.beta !== undefined ? d.angles.beta.toFixed(1) + '°' : '-'}</td>`;
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.angles.gamma !== undefined ? d.angles.gamma.toFixed(1) + '°' : '-'}</td>`;
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.angles.epsilon !== undefined ? d.angles.epsilon.toFixed(1) + '°' : '-'}</td>`;
    html += `<td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${d.angles.zeta !== undefined ? d.angles.zeta.toFixed(1) + '°' : '-'}</td>`;
    html += '</tr>';
  });

  html += '</table>';
  contentDiv.innerHTML = html;
  resultsDiv.style.display = 'block';
}

function deduplicateAtoms(atoms) {
  const seen = new Set();
  const unique = [];

  atoms.forEach(atom => {
    if (!seen.has(atom.serial)) {
      seen.add(atom.serial);
      unique.push(atom);
    }
  });

  return unique;
}

function plotDihedralsOnCMAPs(dihedrals, viewer) {
  // Clear old scatter traces first
  clearScatterFromCMAPs();

  // Collect all α-γ, ε-ζ, and ζ-α pairs
  const agPoints = [];
  const ezPoints = [];
  const zaPoints = [];

  dihedrals.forEach((d, i) => {
    const { alpha, gamma, epsilon, zeta } = d.angles;

    // α-γ: same residue (6 atoms after deduplication)
    if (alpha !== undefined && gamma !== undefined) {
      const uniqueAtoms = deduplicateAtoms([...d.atomGroups.alpha, ...d.atomGroups.gamma]);
      agPoints.push({
        x: alpha,
        y: gamma,
        label: `${d.chain}:${d.resn}${d.resi}`,
        atoms: uniqueAtoms
      });
    }

    // ε-ζ: same residue (5 atoms after deduplication)
    if (epsilon !== undefined && zeta !== undefined) {
      const uniqueAtoms = deduplicateAtoms([...d.atomGroups.epsilon, ...d.atomGroups.zeta]);
      ezPoints.push({
        x: epsilon,
        y: zeta,
        label: `${d.chain}:${d.resn}${d.resi}`,
        atoms: uniqueAtoms
      });
    }

    // ζ-α: CROSS-RESIDUE - ζ(i) with α(i+1) (5 atoms after deduplication)
    if (zeta !== undefined && i < dihedrals.length - 1) {
      const nextRes = dihedrals[i + 1];
      // Only pair if next residue is in same chain
      if (nextRes.chain === d.chain && nextRes.angles.alpha !== undefined) {
        const uniqueAtoms = deduplicateAtoms([...d.atomGroups.zeta, ...nextRes.atomGroups.alpha]);
        zaPoints.push({
          x: zeta,
          y: nextRes.angles.alpha,
          label: `${d.chain}:${d.resn}${d.resi}→${nextRes.resn}${nextRes.resi}`,
          atoms: uniqueAtoms
        });
      }
    }
  });

  // Add scatter traces to plots
  if (agPoints.length > 0) {
    addScatterToCMAP('plot-ag-survey', agPoints, 'α', 'γ', viewer);
  }

  if (ezPoints.length > 0) {
    addScatterToCMAP('plot-ez-survey', ezPoints, 'ε', 'ζ', viewer);
  }

  if (zaPoints.length > 0) {
    addScatterToCMAP('plot-za-survey', zaPoints, 'ζ', 'α', viewer);
  }
}

function addScatterToCMAP(divId, points, xLabel, yLabel, viewer) {
  const scatterTrace = {
    type: 'scatter',
    mode: 'markers',
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    text: points.map(p => p.label),
    customdata: points.map(p => p.atoms), // Store atom objects
    marker: {
      color: 'red',
      size: 8,
      symbol: 'circle',
      line: {
        color: 'white',
        width: 1
      }
    },
    hovertemplate: `${xLabel}: %{x:.1f}°<br>${yLabel}: %{y:.1f}°<br>%{text}<extra></extra>`,
    name: 'Structure',
    showlegend: false
  };

  const plotDiv = document.getElementById(divId);
  Plotly.addTraces(plotDiv, scatterTrace);

  // Add click event handler for this plot
  plotDiv.on('plotly_click', function(data) {
    const point = data.points[0];
    if (point.data.type === 'scatter' && point.customdata) {
      highlightAtoms(viewer, point.customdata);
    }
  });
}

function clearScatterFromCMAPs() {
  const plotIds = ['plot-ag-survey', 'plot-ez-survey', 'plot-za-survey'];

  plotIds.forEach(plotId => {
    const plotDiv = document.getElementById(plotId);
    if (!plotDiv || !plotDiv.data) return;

    // Find indices of scatter traces (all traces except the contour)
    const scatterIndices = [];
    plotDiv.data.forEach((trace, i) => {
      if (trace.type === 'scatter') {
        scatterIndices.push(i);
      }
    });

    // Delete all scatter traces
    if (scatterIndices.length > 0) {
      Plotly.deleteTraces(plotDiv, scatterIndices);
    }
  });
}

let currentFileData = null; // Store current file data for download

function updateFileInfo(fileName, atomCount, baseCount) {
  const fileInfoDiv = document.getElementById('fileInfo-analysis');
  const fileNameSpan = document.getElementById('fileName-analysis');
  const atomCountSpan = document.getElementById('atomCount-analysis');
  const baseCountSpan = document.getElementById('baseCount-analysis');

  if (fileName) {
    fileNameSpan.textContent = fileName;
    atomCountSpan.textContent = atomCount;
    baseCountSpan.textContent = baseCount;
    fileInfoDiv.style.display = 'inline-block';

    // Setup download click handler
    fileNameSpan.onclick = () => {
      if (currentFileData) {
        const blob = new Blob([currentFileData.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileData.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
  } else {
    fileInfoDiv.style.display = 'none';
  }
}

function highlightAtoms(viewerWrapper, atoms) {
  if (!viewerWrapper || !viewerWrapper.viewer || !atoms || atoms.length === 0) return;

  const viewer = viewerWrapper.viewer; // Access 3Dmol viewer

  // Clear previous highlights by resetting all atoms to default style
  viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });

  // Highlight the selected atoms (5-6 atoms after deduplication of shared atoms)
  // α-γ: 6 atoms (share O5', C5')
  // ε-ζ: 5 atoms (share C3', O3', P)
  // ζ-α: 5 atoms (share O3', P, O5')
  atoms.forEach(atom => {
    viewer.setStyle(
      { serial: atom.serial },
      {
        stick: { radius: 0.3, color: 'yellow' },
        sphere: { scale: 0.5, color: 'yellow' }
      }
    );
  });

  viewer.render();
}

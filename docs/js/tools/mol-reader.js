// Molecule Reader tool module - supports multiple formats
import { XYZViewer } from '../viewer.js';

export function getHTML() {
  return `
    <div class="tool-header">
      <input id="fileInput" type="file" accept=".pdb,.xyz,.mol2,.sdf,.mol,.cif,.mmcif,.cube" />
      <button id="fitBtn">Fit</button>
      <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; padding: 4px 8px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
        <label for="pdbInput" style="font-size: 12px; color: #6b7280; font-weight: 500;">PDB ID:</label>
        <input id="pdbInput" type="text" placeholder="e.g. 1UBQ"
               style="width: 80px; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; text-transform: uppercase;"
               maxlength="4" />
        <button id="rcsbBtn" style="padding: 4px 10px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;">
          RCSB
        </button>
      </div>
      <select id="styleSelect" style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer;">
        <option value="auto">Auto Style</option>
        <optgroup label="Protein Styles">
          <option value="cartoon">Cartoon</option>
          <option value="ribbon">Ribbon</option>
          <option value="trace">Trace</option>
        </optgroup>
        <optgroup label="Atomic Styles">
          <option value="stick">Stick</option>
          <option value="sphere">Sphere</option>
          <option value="ball-stick">Ball & Stick</option>
          <option value="line">Line</option>
        </optgroup>
        <optgroup label="Surface">
          <option value="surface-vdw">VDW Surface</option>
          <option value="surface-sas">SAS Surface</option>
          <option value="surface-ms">MS Surface</option>
        </optgroup>
      </select>
      <span class="pill" style="font-size: 12px;">📁 Supports: PDB, XYZ, MOL2, SDF, CIF, CUBE</span>
    </div>

    <div id="viewer" aria-label="3Dmol viewer">
      <div id="measurePanel">
        <h3>Geometry Measurement</h3>
        <p style="color: #666; margin: 0 0 8px 0;">Click atoms: 2=distance, 3=angle, 4=dihedral</p>
        <div id="formatInfo" style="margin-bottom: 8px; padding: 6px 10px; background: #f3f4f6; border-radius: 4px; font-size: 12px; display: none;">
          <strong>Format:</strong> <span id="formatName">-</span> |
          <strong>Atoms:</strong> <span id="atomCount">-</span>
        </div>
        <div class="atom-list" id="atomList">
          <p style="color: #999; margin: 8px 0;">No atoms selected</p>
        </div>
        <div id="measurementResult"></div>
        <button class="clear-btn" id="clearBtn">Clear Selection</button>
      </div>
    </div>

    <div id="dropzone">Release to load molecule file</div>

    <!-- Loading notification -->
    <div id="loadingOverlay" style="display: none; position: absolute; top: 16px; right: 16px; z-index: 1000; background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 12px 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); max-width: 280px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
        <div style="flex: 1;">
          <div id="loadingTitle" style="font-size: 13px; color: #1f2937; font-weight: 600; margin-bottom: 4px;">Loading molecule...</div>
          <div id="loadingMessage" style="font-size: 11px; color: #6b7280; line-height: 1.4;">Please don't close the page.</div>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
}

export function init() {
  const viewer = new XYZViewer('viewer', {
    backgroundColor: 'white',
    onSelectionChange: updateMeasurePanel
  });

  let currentFormat = null;
  let currentFileName = null;

  // Update measurement panel
  function updateMeasurePanel(data) {
    const atomList = document.getElementById('atomList');
    const measurementResult = document.getElementById('measurementResult');
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];

    if (data.count === 0) {
      atomList.innerHTML = '<p style="color: #999; margin: 8px 0;">No atoms selected</p>';
    } else {
      atomList.innerHTML = data.atoms.map((atom, idx) => `
        <div class="atom-item">
          <span class="atom-color" style="background: ${colors[idx]}"></span>
          <span>${idx + 1}. ${atom.elem} #${atom.serial}</span>
          <span style="color: #999; font-size: 11px;">
            (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})
          </span>
        </div>
      `).join('');
    }

    // Display measurement result based on number of selected atoms
    if (data.distance) {
      measurementResult.innerHTML = `
        <div class="dihedral-result">
          <div style="margin-bottom: 4px;">Distance:</div>
          <strong>${data.distance.angstroms.toFixed(4)} Å</strong>
        </div>
      `;
    } else if (data.angle) {
      measurementResult.innerHTML = `
        <div class="dihedral-result">
          <div style="margin-bottom: 4px;">Angle:</div>
          <strong>${data.angle.degrees.toFixed(2)}°</strong>
          <div style="color: #666; font-size: 11px; margin-top: 4px;">
            ${data.angle.radians.toFixed(4)} rad
          </div>
        </div>
      `;
    } else if (data.dihedral) {
      measurementResult.innerHTML = `
        <div class="dihedral-result">
          <div style="margin-bottom: 4px;">Dihedral Angle:</div>
          <strong>${data.dihedral.degrees.toFixed(2)}°</strong>
          <div style="color: #666; font-size: 11px; margin-top: 4px;">
            ${data.dihedral.radians.toFixed(4)} rad
          </div>
        </div>
      `;
    } else {
      measurementResult.innerHTML = '';
    }
  }

  // Update loading notification message
  function updateLoadingMessage(atomCount, filename) {
    const loadingMessage = document.getElementById('loadingMessage');
    if (!loadingMessage) return;

    if (atomCount && atomCount > 0) {
      const fileInfo = filename ? `${filename} has ` : '';
      loadingMessage.textContent = `${fileInfo}${atomCount.toLocaleString()} atoms. Large molecules may take time. Don't close the page.`;
    } else {
      loadingMessage.textContent = 'Please don\'t close the page.';
    }
  }

  // Detect file format from extension or content
  function detectFormat(filename, content) {
    if (!filename || typeof filename !== 'string') {
      filename = 'unknown.pdb'; // Default fallback
    }
    const ext = filename.split('.').pop().toLowerCase();

    // Extension-based detection
    const formatMap = {
      'pdb': 'pdb',
      'xyz': 'xyz',
      'mol2': 'mol2',
      'sdf': 'sdf',
      'mol': 'sdf',
      'cif': 'cif',
      'mmcif': 'cif',
      'cube': 'cube'
    };

    if (formatMap[ext]) {
      return formatMap[ext];
    }

    // Content-based detection
    if (content.includes('ATOM') || content.includes('HETATM')) return 'pdb';
    if (content.includes('@<TRIPOS>')) return 'mol2';
    if (content.includes('$$$$')) return 'sdf';
    if (content.match(/^\s*\d+\s*$/m)) return 'xyz'; // First line is atom count

    return 'pdb'; // Default fallback
  }

  // Extract first MODEL from PDB/CIF text (for NMR ensembles)
  function extractFirstModel(text, format) {
    if (format === 'pdb') {
      if (!text.includes('MODEL')) return text;

      const lines = text.split('\n');
      const result = [];
      let inFirstModel = false;
      let foundFirstModel = false;

      for (const line of lines) {
        if (!foundFirstModel && !line.startsWith('MODEL')) {
          if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
            return text;
          }
          result.push(line);
          continue;
        }
        if (line.startsWith('MODEL') && !foundFirstModel) {
          inFirstModel = true;
          foundFirstModel = true;
          result.push(line);
          continue;
        }
        if (line.startsWith('ENDMDL') && inFirstModel) {
          result.push(line);
          inFirstModel = false;
          break;
        }
        if (inFirstModel) result.push(line);
      }
      const resultText = result.join('\n');
      if (!resultText.includes('END')) result.push('END');
      return result.join('\n');
    }

    if (format === 'cif') {
      const lines = text.split(/\r?\n/);
      const out = [];
      let i = 0;
      const isHeader = l => /^_/.test(l);
      const isLoop = l => /^\s*loop_\s*$/.test(l);
      const isAtomSiteHeader = l => /^_atom_site\./i.test(l);
      const tokenize = l => l.match(/'(?:[^']*)'|"(?:[^"]*)"|\S+/g) || [];
      const unquote = v => v?.replace(/^['"]|['"]$/g, '') ?? '';

      while (i < lines.length) {
        const line = lines[i];

        if (isLoop(line) && isAtomSiteHeader(lines[i + 1] || '')) {
          out.push(lines[i]);
          i++;

          const headers = [];
          while (i < lines.length && isAtomSiteHeader(lines[i])) {
            headers.push(lines[i]);
            out.push(lines[i]);
            i++;
          }

          const modelIdx = headers.findIndex(h =>
            /_atom_site\.(pdbx_PDB_model_num|label_model_id|model_id)/i.test(h)
          );

          const rows = [];
          while (
            i < lines.length &&
            !isLoop(lines[i]) &&
            !(isHeader(lines[i]) && !isAtomSiteHeader(lines[i])) &&
            !/^data_/i.test(lines[i])
          ) {
            rows.push(lines[i]);
            i++;
          }

          if (modelIdx === -1) {
            out.push(...rows);
          } else {
            const filtered = rows.filter(r => {
              const t = tokenize(r);
              const v = unquote(t[modelIdx]);
              if (!v || v === '.' || v === '?') return true;
              return v === '1';
            });
            out.push(...filtered);
          }
          continue;
        }

        out.push(line);
        i++;
      }
      return out.join('\n');
    }

    return text;
  }

  // Apply visual style to viewer
  function applyStyleByName(viewer, styleName) {
    if (!viewer.model) return;

    // Remove any existing surfaces to avoid stacking
    viewer.viewer.removeAllSurfaces();

    // Reset styles
    viewer.viewer.setStyle({}, {});

    // Base style to keep for selection highlighting
    let baseStyle = {stick: {}};

    switch(styleName) {
      case 'cartoon':
        baseStyle = {cartoon: {color: 'spectrum'}};
        viewer.viewer.setStyle({}, baseStyle);
        viewer.viewer.setStyle({hetflag: true}, {stick: {}, sphere: {scale: 0.3}});
        break;
      case 'ribbon':
        baseStyle = {ribbon: {color: 'spectrum'}};
        viewer.viewer.setStyle({}, baseStyle);
        viewer.viewer.setStyle({hetflag: true}, {stick: {}, sphere: {scale: 0.3}});
        break;
      case 'trace':
        baseStyle = {line: {color: 'spectrum'}};
        viewer.viewer.setStyle({}, baseStyle);
        break;
      case 'stick':
        baseStyle = {stick: {}};
        viewer.viewer.setStyle({}, baseStyle);
        break;
      case 'sphere':
        baseStyle = {sphere: {}};
        viewer.viewer.setStyle({}, baseStyle);
        break;
      case 'ball-stick':
        baseStyle = {stick: {}, sphere: {scale: 0.3}};
        viewer.viewer.setStyle({}, baseStyle);
        break;
      case 'line':
        baseStyle = {line: {}};
        viewer.viewer.setStyle({}, baseStyle);
        break;
      case 'surface-vdw':
        baseStyle = {cartoon: {color: 'spectrum'}};
        viewer.viewer.setStyle({}, baseStyle);
        viewer.viewer.addSurface('VDW', {opacity: 0.7, color: 'white'});
        break;
      case 'surface-sas':
        baseStyle = {cartoon: {color: 'spectrum'}};
        viewer.viewer.setStyle({}, baseStyle);
        viewer.viewer.addSurface('SAS', {opacity: 0.7, color: 'white'});
        break;
      case 'surface-ms':
        baseStyle = {cartoon: {color: 'spectrum'}};
        viewer.viewer.setStyle({}, baseStyle);
        viewer.viewer.addSurface('MS', {opacity: 0.7, color: 'white'});
        break;
      default:
        baseStyle = {stick: {}};
        viewer.viewer.setStyle({}, baseStyle);
    }

    // Keep the chosen base style so selection highlighting won't override it
    viewer.style = baseStyle;

    // Re-apply selection highlight and render
    viewer._updateAtomStyles();
    viewer.viewer.render();
  }

  // Count unique models in mmCIF atom_site loop
  function countCIFModels(content) {
    if (!/_atom_site\.(pdbx_PDB_model_num|label_model_id|model_id)/i.test(content)) return 1;
    const lines = content.split(/\r?\n/);
    const isHeader = l => /^_/.test(l);
    const isLoop = l => /^\s*loop_\s*$/.test(l);
    const isAtomSiteHeader = l => /^_atom_site\./i.test(l);
    const tokenize = l => l.match(/'(?:[^']*)'|"(?:[^"]*)"|\S+/g) || [];
    const unquote = v => v?.replace(/^['"]|['"]$/g, '') ?? '';

    let i = 0;
    const models = new Set();

    while (i < lines.length) {
      if (isLoop(lines[i]) && isAtomSiteHeader(lines[i + 1] || '')) {
        i++;
        const headers = [];
        while (i < lines.length && isAtomSiteHeader(lines[i])) {
          headers.push(lines[i]); i++;
        }
        const modelIdx = headers.findIndex(h =>
          /_atom_site\.(pdbx_PDB_model_num|label_model_id|model_id)/i.test(h)
        );
        while (
          i < lines.length &&
          !isLoop(lines[i]) &&
          !(isHeader(lines[i]) && !isAtomSiteHeader(lines[i])) &&
          !/^data_/i.test(lines[i])
        ) {
          if (modelIdx !== -1) {
            const t = tokenize(lines[i]);
            const v = unquote(t[modelIdx]);
            if (v && v !== '.' && v !== '?') models.add(v);
          }
          i++;
        }
        break; // first atom_site loop is enough
      }
      i++;
    }
    return models.size || 1;
  }

  // Load file and apply auto style
  async function loadMolecule(file) {
    const loadingOverlay = document.getElementById('loadingOverlay');

    try {
      // Show loading notification
      loadingOverlay.style.display = 'block';

      // Validate file
      if (!file || !file.name) {
        throw new Error('Invalid file');
      }

      const text = await file.text();
      if (!text) {
        throw new Error('File is empty');
      }

      const format = detectFormat(file.name, text);
      currentFormat = format;
      currentFileName = file.name;

      // Count models based on format
      let modelCount = 1;
      if (format === 'pdb') {
        modelCount = (text.match(/^MODEL/gm) || []).length || 1;
      } else if (format === 'cif') {
        modelCount = countCIFModels(text);
      }

      // Extract first model if multi-model file
      const filteredText = extractFirstModel(text, format);

      // Load with format
      viewer.loadModel(filteredText, format);

      // Update format info
      const formatInfo = document.getElementById('formatInfo');
      const formatName = document.getElementById('formatName');
      const atomCount = document.getElementById('atomCount');

      formatInfo.style.display = 'block';

      // Show format and model info
      if (modelCount > 1) {
        formatName.innerHTML = `${format.toUpperCase()} <span style="color: #f59e0b; font-weight: bold;" title="NMR ensemble with ${modelCount} models">(${modelCount} models, showing first)</span>`;
      } else {
        formatName.textContent = format.toUpperCase();
      }

      // Count atoms (fast method for large files)
      let atomCountValue = 0;
      if (format === 'xyz') {
        // For XYZ: first line contains atom count
        const firstLine = text.split('\n')[0];
        atomCountValue = parseInt(firstLine) || 0;
      } else if (format === 'pdb' || format === 'cif') {
        // Use regex count instead of splitting for performance
        const atomMatches = text.match(/^(?:ATOM|HETATM)/gm);
        atomCountValue = atomMatches ? atomMatches.length : 0;
      }
      atomCount.textContent = atomCountValue || 'Unknown';

      // Update loading message with atom count and filename
      updateLoadingMessage(atomCountValue, currentFileName);

      // Defer rendering to let UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      // Auto-apply style based on format and size
      const styleSelect = document.getElementById('styleSelect');
      if (styleSelect.value === 'auto') {
        const autoStyle = getAutoStyle(format, text, atomCountValue);
        applyStyleByName(viewer, autoStyle);
      }
    } catch (error) {
      console.error('Error loading molecule:', error);
      alert(`Failed to load molecule: ${error.message}`);
    } finally {
      // Hide loading overlay
      loadingOverlay.style.display = 'none';
    }
  }

  // Determine auto style based on format and size
  function getAutoStyle(format, content, atomCount = 0) {
    if (format === 'pdb' || format === 'cif') {
      // If atomCount not provided, estimate from content
      if (!atomCount) {
        atomCount = (content.match(/^ATOM/gm) || []).length;
      }

      // Large molecules (>10000 atoms) - use fastest rendering
      if (atomCount > 10000) {
        return 'line';
      }
      // Medium molecules (>5000 atoms) - use simple cartoon
      else if (atomCount > 5000) {
        return 'trace';
      }
      // Small proteins (>50 atoms) - use cartoon
      else if (atomCount > 50) {
        return 'cartoon';
      }
      // Very small molecules
      else {
        return 'stick';
      }
    }

    // For other formats, simplify if large
    if (atomCount > 5000) {
      return 'line';
    }

    return 'stick'; // Default for small molecules
  }

  // Load from URL parameter
  const params = new URLSearchParams(location.search);
  const url = params.get('file');
  if (url) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'block';

    fetch(url)
      .then(res => res.text())
      .then(text => {
        const format = detectFormat(url, text);
        currentFormat = format;

        // Count models based on format
        let modelCount = 1;
        if (format === 'pdb') {
          modelCount = (text.match(/^MODEL/gm) || []).length || 1;
        } else if (format === 'cif') {
          modelCount = countCIFModels(text);
        }

        const filteredText = extractFirstModel(text, format);
        viewer.loadModel(filteredText, format);

        // Update format info
        const formatInfo = document.getElementById('formatInfo');
        const formatName = document.getElementById('formatName');
        formatInfo.style.display = 'block';

        if (modelCount > 1) {
          formatName.innerHTML = `${format.toUpperCase()} <span style="color: #f59e0b; font-weight: bold;" title="NMR ensemble with ${modelCount} models">(${modelCount} models, showing first)</span>`;
        } else {
          formatName.textContent = format.toUpperCase();
        }

        // Count atoms (fast method)
        let atomCountValue = 0;
        if (format === 'xyz') {
          const firstLine = text.split('\n')[0];
          atomCountValue = parseInt(firstLine) || 0;
        } else if (format === 'pdb' || format === 'cif') {
          const atomMatches = text.match(/^(?:ATOM|HETATM)/gm);
          atomCountValue = atomMatches ? atomMatches.length : 0;
        }

        // Extract filename from URL for display
        const filename = url.split('/').pop();
        updateLoadingMessage(atomCountValue, filename);

        // Defer rendering to let UI update
        setTimeout(() => {
          const styleSelect = document.getElementById('styleSelect');
          if (styleSelect.value === 'auto') {
            applyStyleByName(viewer, getAutoStyle(format, text, atomCountValue));
          }
        }, 50);
      })
      .catch(err => {
        alert('Load failed: ' + err);
      })
      .finally(() => {
        loadingOverlay.style.display = 'none';
      });
  }

  // Local file selection
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await loadMolecule(f);
  });

  // Load from RCSB PDB database
  const rcsbBtn = document.getElementById('rcsbBtn');
  const pdbInput = document.getElementById('pdbInput');

  // Auto-convert to uppercase while typing
  pdbInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Allow Enter key to trigger load
  pdbInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      rcsbBtn.click();
    }
  });

  rcsbBtn.addEventListener('click', async () => {
    const pdbId = pdbInput.value.trim().toUpperCase();
    if (!pdbId) {
      alert('Please enter a PDB ID');
      return;
    }

    // Validate PDB ID format (4 characters: letters/numbers)
    if (!/^[0-9A-Z]{4}$/i.test(pdbId)) {
      alert('Invalid PDB ID format. PDB IDs should be 4 characters (e.g., 1UBQ)');
      return;
    }

    const loadingOverlay = document.getElementById('loadingOverlay');

    // Show loading state
    rcsbBtn.disabled = true;
    rcsbBtn.textContent = 'Loading...';
    loadingOverlay.style.display = 'block';

    try {
      const url = `https://files.rcsb.org/download/${pdbId}.pdb`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`PDB ${pdbId} not found (HTTP ${response.status})`);
      }

      const text = await response.text();
      const format = 'pdb';
      currentFormat = format;
      currentFileName = `${pdbId}.pdb`;

      // Count models
      let modelCount = 1;
      if (format === 'pdb') {
        modelCount = (text.match(/^MODEL/gm) || []).length || 1;
      }

      // Extract first model and load structure
      const filteredText = extractFirstModel(text, format);
      viewer.loadModel(filteredText, format);

      // Update format info
      const formatInfo = document.getElementById('formatInfo');
      const formatName = document.getElementById('formatName');
      const atomCount = document.getElementById('atomCount');

      formatInfo.style.display = 'block';

      if (modelCount > 1) {
        formatName.innerHTML = `${format.toUpperCase()} <span style="color: #f59e0b; font-weight: bold;" title="NMR ensemble with ${modelCount} models">(${modelCount} models, showing first)</span>`;
      } else {
        formatName.textContent = format.toUpperCase();
      }

      // Count atoms (fast method using regex)
      const atomMatches = text.match(/^(?:ATOM|HETATM)/gm);
      const atomCountValue = atomMatches ? atomMatches.length : 0;
      atomCount.textContent = atomCountValue || 'Unknown';

      // Update loading message with atom count and filename
      updateLoadingMessage(atomCountValue, currentFileName);

      // Defer rendering to let UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      // Auto-apply style based on size
      const styleSelect = document.getElementById('styleSelect');
      if (styleSelect.value === 'auto') {
        const autoStyle = getAutoStyle(format, text, atomCountValue);
        applyStyleByName(viewer, autoStyle);
      }

      // Clear input after successful load
      pdbInput.value = '';

    } catch (error) {
      alert(`Failed to load PDB: ${error.message}`);
      console.error('RCSB load error:', error);
    } finally {
      rcsbBtn.disabled = false;
      rcsbBtn.textContent = 'RCSB';
      loadingOverlay.style.display = 'none';
    }
  });

  // Style selection change
  const styleSelect = document.getElementById('styleSelect');
  styleSelect.addEventListener('change', (e) => {
    const selectedStyle = e.target.value;
    if (selectedStyle === 'auto' && currentFormat) {
      const autoStyle = getAutoStyle(currentFormat, viewer.model ? 'ATOM' : '');
      applyStyleByName(viewer, autoStyle);
    } else {
      applyStyleByName(viewer, selectedStyle);
    }
  });

  // Drag and drop loading
  const dropzone = document.getElementById('dropzone');
  const viewerEl = document.getElementById('viewer');
  const on = (el, ev, fn) => el.addEventListener(ev, fn);

  on(viewerEl, 'dragenter', e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.display = 'flex';
  });

  on(viewerEl, 'dragover', e => {
    e.preventDefault();
    e.stopPropagation();
  });

  on(viewerEl, 'dragleave', e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === viewerEl) {
      dropzone.style.display = 'none';
    }
  });

  on(viewerEl, 'drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.display = 'none';
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    await loadMolecule(f);
  });

  // Fit button
  document.getElementById('fitBtn').onclick = () => viewer.fit();

  // Clear selection button
  document.getElementById('clearBtn').onclick = () => viewer.clearSelection();

  return viewer;
}

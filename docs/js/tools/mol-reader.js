// Molecule Reader tool module - supports multiple formats
import { XYZViewer } from '../viewer.js';

export function getHTML() {
  return `
    <div class="tool-header">
      <label for="fileInput" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; margin-right: 6px;">Choose File</label>
      <input id="fileInput" type="file" accept=".pdb,.xyz,.mol2,.sdf,.mol,.cif,.mmcif,.cube" style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; overflow: hidden;" />
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
      <span id="fileInfoPill" style="display: none; margin-left: 8px; padding: 6px 10px; background: #f3f4f6; border-radius: 999px; font-size: 12px; color: #374151;">
        <strong id="currentFileNamePill"></strong> • <span id="atomCountPill"></span> atoms
      </span>
    </div>

    <div id="viewer" aria-label="3Dmol viewer">
      <div id="measurePanel">
        <h3>Geometry Measurement</h3>
        <p style="color: #666; margin: 0 0 8px 0;">Click atoms: 2=distance, 3=angle, 4=dihedral</p>

        <!-- Atom clicking status info -->
        <div id="clickStatusInfo" style="margin-bottom: 8px; padding: 6px 10px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; font-size: 11px; line-height: 1.4;">
          <strong>⚠️ Atom Clicking:</strong> Only available in <strong>Stick</strong>, <strong>Ball-Stick</strong>, or <strong>Sphere</strong> styles.
          <span style="display: block; margin-top: 4px; color: #92400e;">
            First-time loading may take 5-10s for large molecules.
          </span>
        </div>

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

  // Reset loading overlay to a neutral message for the new file
  function resetLoadingOverlay(filename) {
    const titleEl = document.getElementById('loadingTitle');
    const msgEl = document.getElementById('loadingMessage');
    if (titleEl) titleEl.textContent = 'Loading molecule...';
    if (msgEl) {
      msgEl.textContent = filename
        ? `Fetching ${filename}. Determining atom count...`
        : 'Fetching file. Determining atom count...';
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

    // Enable atom clicking for detailed styles (where measurement is useful)
    const detailedStyles = ['stick', 'ball-stick', 'sphere'];
    const clickStatusInfo = document.getElementById('clickStatusInfo');

    if (detailedStyles.includes(styleName)) {
      // Show loading message for atom click setup
      const loadingOverlay = document.getElementById('loadingOverlay');
      const loadingTitle = document.getElementById('loadingTitle');
      const loadingMessage = document.getElementById('loadingMessage');

      if (loadingOverlay && loadingTitle && loadingMessage) {
        const atomCount = viewer.model ? viewer.model.selectedAtoms({}).length : 0;
        loadingTitle.textContent = 'Enabling atom selection...';
        loadingMessage.textContent = `Setting up click handlers for ${atomCount.toLocaleString()} atoms. Large molecules may take a few seconds.`;
        loadingOverlay.style.display = 'block';

        // Defer to let UI update before blocking operation
        setTimeout(() => {
          viewer._enableAtomClick();
          loadingOverlay.style.display = 'none';

          // Hide the warning once clicking is enabled
          if (clickStatusInfo) {
            clickStatusInfo.style.display = 'none';
          }
        }, 50);
      } else {
        // Fallback if overlay elements not found
        viewer._enableAtomClick();
        if (clickStatusInfo) {
          clickStatusInfo.style.display = 'none';
        }
      }
    } else {
      // Show warning for non-detailed styles
      if (clickStatusInfo) {
        clickStatusInfo.style.display = 'block';
      }
    }
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
      // Show loading notification and reset to neutral message
      loadingOverlay.style.display = 'block';
      resetLoadingOverlay(file?.name);

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

      // Store format info for display
      let formatDisplay = format.toUpperCase();
      if (modelCount > 1) {
        formatDisplay += ` (${modelCount} models)`;
      }

      // Update loading message with atom count and filename
      updateLoadingMessage(atomCountValue, currentFileName);

      // Defer rendering to let UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      // Always use auto style when loading new files to avoid freezing on large molecules
      const styleSelect = document.getElementById('styleSelect');
      styleSelect.value = 'auto'; // Reset to auto
      const finalStyle = getAutoStyle(format, text, atomCountValue);
      applyStyleByName(viewer, finalStyle);

      // Only hide loading overlay if not using detailed style
      // (detailed styles will show their own loading for click setup)
      const detailedStyles = ['stick', 'ball-stick', 'sphere'];
      if (!detailedStyles.includes(finalStyle)) {
        loadingOverlay.style.display = 'none';
      }

      // Show file info in header pill
      const fileInfoPill = document.getElementById('fileInfoPill');
      const currentFileNamePill = document.getElementById('currentFileNamePill');
      const atomCountPill = document.getElementById('atomCountPill');
      if (fileInfoPill && currentFileNamePill && atomCountPill && currentFileName) {
        currentFileNamePill.textContent = currentFileName;
        atomCountPill.textContent = atomCountValue.toLocaleString();
        fileInfoPill.style.display = 'inline';
      }
    } catch (error) {
      console.error('Error loading molecule:', error);
      alert(`Failed to load molecule: ${error.message}`);
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
    resetLoadingOverlay(url.split('/').pop() || undefined);

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

        // Count atoms (fast method)
        let atomCountValue = 0;
        if (format === 'xyz') {
          const firstLine = text.split('\n')[0];
          atomCountValue = parseInt(firstLine) || 0;
        } else if (format === 'pdb' || format === 'cif') {
          const atomMatches = text.match(/^(?:ATOM|HETATM)/gm);
          atomCountValue = atomMatches ? atomMatches.length : 0;
        }

        // Store format info for display
        let formatDisplay = format.toUpperCase();
        if (modelCount > 1) {
          formatDisplay += ` (${modelCount} models)`;
        }

        // Extract filename from URL for display
        const filename = url.split('/').pop();
        updateLoadingMessage(atomCountValue, filename);

        // Defer rendering to let UI update
        setTimeout(() => {
          // Always use auto style when loading new files
          const styleSelect = document.getElementById('styleSelect');
          styleSelect.value = 'auto';
          const finalStyle = getAutoStyle(format, text, atomCountValue);
          applyStyleByName(viewer, finalStyle);

          // Fit view to center the molecule
          viewer.fit();

          // Only hide loading overlay if not using detailed style
          const detailedStyles = ['stick', 'ball-stick', 'sphere'];
          if (!detailedStyles.includes(finalStyle)) {
            loadingOverlay.style.display = 'none';
          }

          // Show file info in header pill
          const fileInfoPill = document.getElementById('fileInfoPill');
          const currentFileNamePill = document.getElementById('currentFileNamePill');
          const atomCountPill = document.getElementById('atomCountPill');
          if (fileInfoPill && currentFileNamePill && atomCountPill && filename) {
            currentFileNamePill.textContent = filename;
            atomCountPill.textContent = atomCountValue.toLocaleString();
            fileInfoPill.style.display = 'inline';
          }
        }, 50);
      })
      .catch(err => {
        alert('Load failed: ' + err);
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
    resetLoadingOverlay(`${pdbId}.pdb`);

    try {
      // Use PDB format with performance optimizations
      const url = `https://files.rcsb.org/download/${pdbId}.pdb`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`PDB ${pdbId} not found (HTTP ${response.status})`);
      }

      const text = await response.text();
      currentFormat = 'pdb';
      currentFileName = `${pdbId}.pdb`;

      // Extract first model if multi-model file
      const modelCount = (text.match(/^MODEL/gm) || []).length || 1;
      const filteredText = modelCount > 1 ? extractFirstModel(text, 'pdb') : text;

      // Performance parser options for large molecules
      const parserOptions = {
        doAssembly: false,                    // Don't build biological assembly
        duplicateAssemblyAtoms: false,        // Don't duplicate symmetry atoms
        noComputeSecondaryStructure: false,   // Need this for cartoon style
        assignBonds: true                     // Assign bonds for PDB
      };

      // Load with performance options
      viewer.viewer.removeAllModels();
      viewer.selectedAtoms = [];
      viewer.model = viewer.viewer.addModel(filteredText, 'pdb', parserOptions);

      // Count atoms (fast method using regex)
      const atomMatches = text.match(/^(?:ATOM|HETATM)/gm);
      const atomCountValue = atomMatches ? atomMatches.length : 0;

      // Store format info for display
      let formatDisplay = 'PDB';
      if (modelCount > 1) {
        formatDisplay += ` (${modelCount} models)`;
      }

      // Update loading message with atom count and filename
      updateLoadingMessage(atomCountValue, currentFileName);

      // Defer rendering to let UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      // Always use auto style when loading new files from RCSB
      const styleSelect = document.getElementById('styleSelect');
      styleSelect.value = 'auto';
      const finalStyle = getAutoStyle('pdb', '', atomCountValue);
      applyStyleByName(viewer, finalStyle);

      // Fit view to center the molecule
      viewer.fit();

      // Clear input after successful load
      pdbInput.value = '';

      // Only hide loading overlay if not using detailed style
      const detailedStyles = ['stick', 'ball-stick', 'sphere'];
      if (!detailedStyles.includes(finalStyle)) {
        loadingOverlay.style.display = 'none';
      }

      // Show file info in header pill
      const fileInfoPill = document.getElementById('fileInfoPill');
      const currentFileNamePill = document.getElementById('currentFileNamePill');
      const atomCountPill = document.getElementById('atomCountPill');
      if (fileInfoPill && currentFileNamePill && atomCountPill && currentFileName) {
        currentFileNamePill.textContent = currentFileName;
        atomCountPill.textContent = atomCountValue.toLocaleString();
        fileInfoPill.style.display = 'inline';
      }

    } catch (error) {
      alert(`Failed to load PDB: ${error.message}`);
      console.error('RCSB load error:', error);
      loadingOverlay.style.display = 'none';
    } finally {
      rcsbBtn.disabled = false;
      rcsbBtn.textContent = 'RCSB';
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

  // Handle drop event
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.display = 'none';
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    try {
      await loadMolecule(f);
    } catch (error) {
      console.error('Drag&Drop error:', error);
      alert(`Failed to load dropped file: ${error.message}`);
    }
  };

  // Listen on both viewer and dropzone
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

  on(viewerEl, 'drop', handleDrop);

  // Also listen on dropzone itself
  on(dropzone, 'dragenter', e => {
    e.preventDefault();
    e.stopPropagation();
  });

  on(dropzone, 'dragover', e => {
    e.preventDefault();
    e.stopPropagation();
  });

  on(dropzone, 'dragleave', e => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide if leaving the dropzone entirely
    if (!dropzone.contains(e.relatedTarget)) {
      dropzone.style.display = 'none';
    }
  });

  on(dropzone, 'drop', handleDrop);

  // Fit button
  document.getElementById('fitBtn').onclick = () => viewer.fit();

  // Clear selection button
  document.getElementById('clearBtn').onclick = () => viewer.clearSelection();

  return viewer;
}

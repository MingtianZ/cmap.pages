// XYZ Reader tool module
import { XYZViewer } from '../viewer.js';

export function getHTML() {
  return `
    <div class="tool-header">
      <input id="fileInput" type="file" accept=".xyz" />
      <button id="fitBtn">Fit</button>
      <span class="pill">Drag .xyz files here</span>
      <span class="pill">Or use URL param: ?file=assets/demo.xyz</span>
    </div>

    <div id="viewer" aria-label="3Dmol viewer">
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

    <div id="dropzone">Release to load XYZ file</div>
  `;
}

export function init() {
  const viewer = new XYZViewer('viewer', {
    backgroundColor: 'white',
    onSelectionChange: updateMeasurePanel
  });

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

  // Helper: load XYZ text
  function loadXYZ(text) {
    viewer.loadModel(text, 'xyz');
    // Enable clicking for dihedral measurement (XYZ files are always small)
    viewer._enableAtomClick();
  }

  // Load from URL parameter
  const params = new URLSearchParams(location.search);
  const url = params.get('file');
  if (url) {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then(text => loadXYZ(text))
      .catch(err => alert('Load failed: ' + err));
  }

  // Local file selection
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    loadXYZ(text);
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
      const text = await f.text();
      loadXYZ(text);
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

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
        <h3>Dihedral Angle Measurement</h3>
        <p style="color: #666; margin: 0 0 8px 0;">Click 4 atoms to measure dihedral angle</p>
        <div class="atom-list" id="atomList">
          <p style="color: #999; margin: 8px 0;">No atoms selected</p>
        </div>
        <div id="dihedralResult"></div>
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
    const dihedralResult = document.getElementById('dihedralResult');
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

    if (data.dihedral) {
      dihedralResult.innerHTML = `
        <div class="dihedral-result">
          <div style="margin-bottom: 4px;">Dihedral Angle:</div>
          <strong>${data.dihedral.degrees.toFixed(2)}°</strong>
          <div style="color: #666; font-size: 11px; margin-top: 4px;">
            ${data.dihedral.radians.toFixed(4)} rad
          </div>
        </div>
      `;
    } else {
      dihedralResult.innerHTML = '';
    }
  }

  // Load from URL parameter
  const params = new URLSearchParams(location.search);
  const url = params.get('file');
  if (url) {
    viewer.loadURL(url).catch(err => alert('Load failed: ' + err));
  }

  // Local file selection
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    viewer.loadText(text);
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
    const text = await f.text();
    viewer.loadText(text);
  });

  // Fit button
  document.getElementById('fitBtn').onclick = () => viewer.fit();

  // Clear selection button
  document.getElementById('clearBtn').onclick = () => viewer.clearSelection();

  return viewer;
}

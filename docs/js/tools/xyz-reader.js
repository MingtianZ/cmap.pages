// XYZ Reader 工具模块
import { XYZViewer } from '../viewer.js';

export function getHTML() {
  return `
    <div class="tool-header">
      <input id="fileInput" type="file" accept=".xyz" />
      <button id="fitBtn">Fit</button>
      <span class="pill">可拖拽 .xyz 到页面</span>
      <span class="pill">或用 URL 参数：?file=assets/demo.xyz</span>
    </div>

    <div id="viewer" aria-label="3Dmol viewer">
      <div id="measurePanel">
        <h3>二面角测量</h3>
        <p style="color: #666; margin: 0 0 8px 0;">点击4个原子以测量二面角</p>
        <div class="atom-list" id="atomList">
          <p style="color: #999; margin: 8px 0;">未选择原子</p>
        </div>
        <div id="dihedralResult"></div>
        <button class="clear-btn" id="clearBtn">清除选择</button>
      </div>
    </div>

    <div id="dropzone">释放鼠标，加载 XYZ 文件</div>
  `;
}

export function init() {
  const viewer = new XYZViewer('viewer', {
    backgroundColor: 'white',
    onSelectionChange: updateMeasurePanel
  });

  // 更新测量面板
  function updateMeasurePanel(data) {
    const atomList = document.getElementById('atomList');
    const dihedralResult = document.getElementById('dihedralResult');
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];

    if (data.count === 0) {
      atomList.innerHTML = '<p style="color: #999; margin: 8px 0;">未选择原子</p>';
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
          <div style="margin-bottom: 4px;">二面角:</div>
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

  // URL 参数加载
  const params = new URLSearchParams(location.search);
  const url = params.get('file');
  if (url) {
    viewer.loadURL(url).catch(err => alert('加载失败：' + err));
  }

  // 本地选择
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    viewer.loadText(text);
  });

  // 拖拽加载
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

  // Fit 按钮
  document.getElementById('fitBtn').onclick = () => viewer.fit();

  // 清除选择按钮
  document.getElementById('clearBtn').onclick = () => viewer.clearSelection();

  return viewer;
}

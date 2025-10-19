// js/viewer.js
export class XYZViewer {
  /**
   * @param {string} elementId - 容器 div 的 id
   * @param {{backgroundColor?: string, style?: object}} [opts]
   */
  constructor(elementId, opts = {}) {
    const { backgroundColor = 'white', style = { stick:{}, sphere:{scale:0.25} } } = opts;
    if (!window.$3Dmol) {
      throw new Error('3Dmol.js 未加载：请先引入 https://3Dmol.org/build/3Dmol-min.js');
    }
    this.viewer = $3Dmol.createViewer(elementId, { backgroundColor });
    this.style = style;
    this.model = null;
  }

  /** 载入 XYZ 文本 */
  loadText(text) {
    this.viewer.removeAllModels();
    this.model = this.viewer.addModel(text, 'xyz'); // 自动判键
    this.viewer.setStyle({}, this.style);
    this.fit();
  }

  /** 从 URL 拉取文本（同源或允许 CORS）再加载 */
  async loadURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    this.loadText(text);
  }

  /** 视图自适应并渲染 */
  fit() {
    this.viewer.zoomTo();
    this.viewer.render();
  }

  /** 切换渲染风格（可用于加 UI 做多种样式） */
  setStyle(style) {
    this.style = style;
    if (this.model) {
      this.viewer.setStyle({}, style);
      this.fit();
    }
  }

  /** 清空场景 */
  clear() {
    this.viewer.removeAllModels();
    this.viewer.render();
    this.model = null;
  }
}

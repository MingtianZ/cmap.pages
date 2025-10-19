// js/viewer.js
export class XYZViewer {
  /**
   * @param {string} elementId - 容器 div 的 id
   * @param {{backgroundColor?: string, style?: object, onSelectionChange?: function}} [opts]
   */
  constructor(elementId, opts = {}) {
    const { backgroundColor = 'white', style = { stick:{}, sphere:{scale:0.25} }, onSelectionChange } = opts;
    if (!window.$3Dmol) {
      throw new Error('3Dmol.js 未加载：请先引入 https://3Dmol.org/build/3Dmol-min.js');
    }
    this.viewer = $3Dmol.createViewer(elementId, { backgroundColor });
    this.style = style;
    this.model = null;
    this.selectedAtoms = []; // 存储选中的原子 [{serial, elem, x, y, z}, ...]
    this.onSelectionChange = onSelectionChange; // 选择变化回调
  }

  /** 载入 XYZ 文本 */
  loadText(text) {
    this.viewer.removeAllModels();
    this.selectedAtoms = [];
    this.model = this.viewer.addModel(text, 'xyz'); // 自动判键
    this.viewer.setStyle({}, this.style);
    this._enableAtomClick(); // 启用原子点击
    this.fit();
    this._notifyChange();
  }

  /** 从 URL 拉取文本（同源或允许 CORS）再加载 */
  async loadURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    this.loadText(text);
  }

  /** 启用原子点击选择 */
  _enableAtomClick() {
    if (!this.model) return;
    const self = this;
    const atoms = this.model.selectedAtoms({});
    atoms.forEach(atom => {
      self.viewer.setClickable({serial: atom.serial}, true, function(clickedAtom) {
        self._handleAtomClick(clickedAtom);
      });
    });
  }

  /** 处理原子点击 */
  _handleAtomClick(atom) {
    const atomData = {
      serial: atom.serial,
      elem: atom.elem,
      x: atom.x,
      y: atom.y,
      z: atom.z
    };

    // 检查是否已选中
    const idx = this.selectedAtoms.findIndex(a => a.serial === atom.serial);
    if (idx >= 0) {
      // 取消选中
      this.selectedAtoms.splice(idx, 1);
    } else {
      // 添加选中（最多4个）
      if (this.selectedAtoms.length < 4) {
        this.selectedAtoms.push(atomData);
      } else {
        // 移除第一个，添加新的
        this.selectedAtoms.shift();
        this.selectedAtoms.push(atomData);
      }
    }

    this._updateAtomStyles();
    this._notifyChange();
  }

  /** 更新原子样式（高亮选中的原子） */
  _updateAtomStyles() {
    // 重置所有原子样式
    this.viewer.setStyle({}, this.style);

    // 高亮选中的原子
    this.selectedAtoms.forEach((atomData, idx) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];
      this.viewer.setStyle(
        { serial: atomData.serial },
        {
          stick: {},
          sphere: {
            scale: 0.4,
            color: colors[idx]
          }
        }
      );
    });

    this.viewer.render();
  }

  /** 计算二面角（弧度） */
  _calcDihedral(p1, p2, p3, p4) {
    // 向量运算
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
    const v3 = { x: p4.x - p3.x, y: p4.y - p3.y, z: p4.z - p3.z };

    // 法向量 n1 = v1 × v2, n2 = v2 × v3
    const n1 = this._cross(v1, v2);
    const n2 = this._cross(v2, v3);

    // 归一化
    const n1_norm = this._normalize(n1);
    const n2_norm = this._normalize(n2);

    // cos(θ) = n1·n2
    const cosTheta = this._dot(n1_norm, n2_norm);

    // sin(θ) = (n1 × n2)·v2_norm
    const v2_norm = this._normalize(v2);
    const sinTheta = this._dot(this._cross(n1_norm, n2_norm), v2_norm);

    // atan2 得到正确的符号
    return Math.atan2(sinTheta, cosTheta);
  }

  /** 向量叉乘 */
  _cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  /** 向量点乘 */
  _dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /** 向量归一化 */
  _normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : v;
  }

  /** 通知选择变化 */
  _notifyChange() {
    if (!this.onSelectionChange) return;

    let result = {
      count: this.selectedAtoms.length,
      atoms: this.selectedAtoms,
      dihedral: null
    };

    if (this.selectedAtoms.length === 4) {
      const rad = this._calcDihedral(...this.selectedAtoms);
      const deg = rad * (180 / Math.PI);
      result.dihedral = { radians: rad, degrees: deg };
    }

    this.onSelectionChange(result);
  }

  /** 清除选择 */
  clearSelection() {
    this.selectedAtoms = [];
    this._updateAtomStyles();
    this._notifyChange();
  }

  /** 视图自适应并渲染 */
  fit() {
    this.viewer.zoomTo();
    this.viewer.render();
  }

  /** 切换渲染风格 */
  setStyle(style) {
    this.style = style;
    if (this.model) {
      this.viewer.setStyle({}, style);
      this._updateAtomStyles(); // 保持选中状态
    }
  }

  /** 清空场景 */
  clear() {
    this.viewer.removeAllModels();
    this.viewer.render();
    this.model = null;
    this.selectedAtoms = [];
    this._notifyChange();
  }
}

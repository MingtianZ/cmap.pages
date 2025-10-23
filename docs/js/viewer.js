// js/viewer.js
export class XYZViewer {
  /**
   * @param {string} elementId - Container div ID
   * @param {{backgroundColor?: string, style?: object, onSelectionChange?: function}} [opts]
   */
  constructor(elementId, opts = {}) {
    const { backgroundColor = 'white', style = { stick:{}, sphere:{scale:0.25} }, onSelectionChange } = opts;
    if (!window.$3Dmol) {
      throw new Error('3Dmol.js not loaded: please include https://3Dmol.org/build/3Dmol-min.js first');
    }
    this.viewer = $3Dmol.createViewer(elementId, { backgroundColor });
    this.style = style;
    this.model = null;
    this.selectedAtoms = []; // Store selected atoms [{serial, elem, x, y, z}, ...]
    this.onSelectionChange = onSelectionChange; // Selection change callback
  }

  /** Low-level: load model with any 3Dmol-supported format */
  loadModel(text, format = 'xyz') {
    this.viewer.removeAllModels();
    this.selectedAtoms = [];
    this.model = this.viewer.addModel(text, format);
    this.viewer.setStyle({}, this.style);
    this._enableAtomClick();
    this.fit();
    this._notifyChange();
  }

  /** Enable atom click selection */
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

  /** Handle atom click */
  _handleAtomClick(atom) {
    const atomData = {
      serial: atom.serial,
      elem: atom.elem,
      x: atom.x,
      y: atom.y,
      z: atom.z
    };

    // Check if already selected
    const idx = this.selectedAtoms.findIndex(a => a.serial === atom.serial);
    if (idx >= 0) {
      // Deselect
      this.selectedAtoms.splice(idx, 1);
    } else {
      // Add selection (max 4)
      if (this.selectedAtoms.length < 4) {
        this.selectedAtoms.push(atomData);
      } else {
        // Remove first, add new
        this.selectedAtoms.shift();
        this.selectedAtoms.push(atomData);
      }
    }

    this._updateAtomStyles();
    this._notifyChange();
  }

  /** Update atom styles (highlight selected atoms) */
  _updateAtomStyles() {
    // Reset all atom styles
    this.viewer.setStyle({}, this.style);

    // Highlight selected atoms
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

  /** Calculate distance between two points */
  _calcDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** Calculate angle formed by three points (in radians) */
  _calcAngle(p1, p2, p3) {
    // Vectors from p2 to p1 and p2 to p3
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };

    // Normalize vectors
    const v1_norm = this._normalize(v1);
    const v2_norm = this._normalize(v2);

    // cos(θ) = v1·v2
    const cosTheta = this._dot(v1_norm, v2_norm);

    // Clamp to [-1, 1] to avoid numerical errors
    const clampedCos = Math.max(-1, Math.min(1, cosTheta));

    return Math.acos(clampedCos);
  }

  /** Calculate dihedral angle (radians) */
  _calcDihedral(p1, p2, p3, p4) {
    // Vector operations
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
    const v3 = { x: p4.x - p3.x, y: p4.y - p3.y, z: p4.z - p3.z };

    // Normal vectors n1 = v1 × v2, n2 = v2 × v3
    const n1 = this._cross(v1, v2);
    const n2 = this._cross(v2, v3);

    // Normalize
    const n1_norm = this._normalize(n1);
    const n2_norm = this._normalize(n2);

    // cos(θ) = n1·n2
    const cosTheta = this._dot(n1_norm, n2_norm);

    // sin(θ) = (n1 × n2)·v2_norm
    const v2_norm = this._normalize(v2);
    const sinTheta = this._dot(this._cross(n1_norm, n2_norm), v2_norm);

    // atan2 gives correct sign
    return Math.atan2(sinTheta, cosTheta);
  }

  /** Vector cross product */
  _cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  /** Vector dot product */
  _dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /** Vector normalization */
  _normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : v;
  }

  /** Notify selection change */
  _notifyChange() {
    if (!this.onSelectionChange) return;

    let result = {
      count: this.selectedAtoms.length,
      atoms: this.selectedAtoms,
      distance: null,
      angle: null,
      dihedral: null
    };

    if (this.selectedAtoms.length === 2) {
      // Calculate distance between 2 atoms
      const dist = this._calcDistance(this.selectedAtoms[0], this.selectedAtoms[1]);
      result.distance = { angstroms: dist };
    } else if (this.selectedAtoms.length === 3) {
      // Calculate angle formed by 3 atoms
      const rad = this._calcAngle(this.selectedAtoms[0], this.selectedAtoms[1], this.selectedAtoms[2]);
      const deg = rad * (180 / Math.PI);
      result.angle = { radians: rad, degrees: deg };
    } else if (this.selectedAtoms.length === 4) {
      // Calculate dihedral angle for 4 atoms
      const rad = this._calcDihedral(...this.selectedAtoms);
      let deg = rad * (180 / Math.PI);
      // Convert to 0-360 range
      if (deg < 0) deg += 360;
      result.dihedral = { radians: rad, degrees: deg };
    }

    this.onSelectionChange(result);
  }

  /** Clear selection */
  clearSelection() {
    this.selectedAtoms = [];
    this._updateAtomStyles();
    this._notifyChange();
  }

  /** Fit view and render */
  fit() {
    this.viewer.zoomTo();
    this.viewer.render();
  }

  /** Switch rendering style */
  setStyle(style) {
    this.style = style;
    if (this.model) {
      this.viewer.setStyle({}, style);
      this._updateAtomStyles(); // Maintain selection state
    }
  }


  /** Clear scene */
  clear() {
    this.viewer.removeAllModels();
    this.viewer.render();
    this.model = null;
    this.selectedAtoms = [];
    this._notifyChange();
  }
}

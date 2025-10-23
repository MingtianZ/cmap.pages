// T3PS structure configuration and atom naming
// Manages CHARMM atom names and dihedral angle recognition

// XYZ index (0-based) to CHARMM name mapping
export const ATOM_NAMES = [
  // Sugar ring A (5' end) - indices 0-12
  'O4A',   // 0
  'C1A',   // 1
  'H11A',  // 2
  'H12A',  // 3
  'C4A',   // 4
  'H41A',  // 5
  'H42A',  // 6
  'C2A',   // 7
  'H21A',  // 8
  'H22A',  // 9
  'C3A',   // 10
  'H31A',  // 11
  'O3A',   // 12
  // Phosphate bridge - indices 13-16
  'P',     // 13
  'O1P',   // 14
  'O2P',   // 15
  'O5B',   // 16
  // Sugar ring B (3' end) - indices 17-31
  'C5B',   // 17
  'H5B1',  // 18
  'H5B2',  // 19
  'C4B',   // 20
  'H4B1',  // 21
  'O4B',   // 22
  'C1B',   // 23
  'H1B1',  // 24
  'H1B2',  // 25
  'C2B',   // 26
  'H2B1',  // 27
  'H2B2',  // 28
  'C3B',   // 29
  'H3B1',  // 30
  'H3B2'   // 31
];

// Alternative numeric suffix naming (1/2 for sugar rings)
export const ATOM_NAMES_ALT = [
  'O4\'1', 'C1\'1', 'H1\'1a', 'H1\'1b', 'C4\'1', 'H4\'1a', 'H4\'1b',
  'C2\'1', 'H2\'1a', 'H2\'1b', 'C3\'1', 'H3\'1', 'O3\'1',
  'P', 'O1P', 'O2P', 'O5\'2',
  'C5\'2', 'H5\'2a', 'H5\'2b', 'C4\'2', 'H4\'2', 'O4\'2',
  'C1\'2', 'H1\'2a', 'H1\'2b', 'C2\'2', 'H2\'2a', 'H2\'2b',
  'C3\'2', 'H3\'2a', 'H3\'2b'
];

// Backbone dihedral angles (0-based indices)
// Each entry: [name, atoms array, description]
export const BACKBONE_DIHEDRALS = [
  {
    name: 'ε',
    atoms: [4, 10, 12, 13],  // C4'1-C3'1-O3'1-P
    description: 'epsilon: C4\'1-C3\'1-O3\'1-P'
  },
  {
    name: 'ζ',
    atoms: [10, 12, 13, 16],  // C3'1-O3'1-P-O5'2
    description: 'zeta: C3\'1-O3\'1-P-O5\'2'
  },
  {
    name: 'α',
    atoms: [12, 13, 16, 17],  // O3'1-P-O5'2-C5'2
    description: 'alpha: O3\'1-P-O5\'2-C5\'2'
  },
  {
    name: 'β',
    atoms: [13, 16, 17, 20],  // P-O5'2-C5'2-C4'2
    description: 'beta: P-O5\'2-C5\'2-C4\'2'
  },
  {
    name: 'γ',
    atoms: [16, 17, 20, 29],  // O5'2-C5'2-C4'2-C3'2
    description: 'gamma: O5\'2-C5\'2-C4\'2-C3\'2'
  }
];

// Sugar ring pseudorotation angles
// Sugar 1 (5' end): ν0-ν4
export const SUGAR1_PSEUDOROTATION = [
  {
    name: 'ν0',
    atoms: [4, 0, 1, 7],  // C4'1-O4'1-C1'1-C2'1
    description: 'nu0: C4\'1-O4\'1-C1\'1-C2\'1'
  },
  {
    name: 'ν1',
    atoms: [0, 1, 7, 10],  // O4'1-C1'1-C2'1-C3'1
    description: 'nu1: O4\'1-C1\'1-C2\'1-C3\'1'
  },
  {
    name: 'ν2',
    atoms: [1, 7, 10, 4],  // C1'1-C2'1-C3'1-C4'1
    description: 'nu2: C1\'1-C2\'1-C3\'1-C4\'1'
  },
  {
    name: 'ν3',
    atoms: [7, 10, 4, 0],  // C2'1-C3'1-C4'1-O4'1
    description: 'nu3: C2\'1-C3\'1-C4\'1-O4\'1'
  },
  {
    name: 'ν4',
    atoms: [10, 4, 0, 1],  // C3'1-C4'1-O4'1-C1'1
    description: 'nu4: C3\'1-C4\'1-O4\'1-C1\'1'
  }
];

// Sugar 2 (3' end): μ0-μ4
export const SUGAR2_PSEUDOROTATION = [
  {
    name: 'μ0',
    atoms: [20, 22, 23, 26],  // C4'2-O4'2-C1'2-C2'2
    description: 'mu0: C4\'2-O4\'2-C1\'2-C2\'2'
  },
  {
    name: 'μ1',
    atoms: [22, 23, 26, 29],  // O4'2-C1'2-C2'2-C3'2
    description: 'mu1: O4\'2-C1\'2-C2\'2-C3\'2'
  },
  {
    name: 'μ2',
    atoms: [23, 26, 29, 20],  // C1'2-C2'2-C3'2-C4'2
    description: 'mu2: C1\'2-C2\'2-C3\'2-C4\'2'
  },
  {
    name: 'μ3',
    atoms: [26, 29, 20, 22],  // C2'2-C3'2-C4'2-O4'2
    description: 'mu3: C2\'2-C3\'2-C4\'2-O4\'2'
  },
  {
    name: 'μ4',
    atoms: [29, 20, 22, 23],  // C3'2-C4'2-O4'2-C1'2
    description: 'mu4: C3\'2-C4\'2-O4\'2-C1\'2'
  }
];

/**
 * Get CHARMM name for a given 3Dmol atom serial
 * @param {number} serial - 0-based serial number from 3Dmol.js
 * @returns {string} CHARMM atom name
 */
export function getAtomName(serial) {
  if (serial >= 0 && serial < ATOM_NAMES.length) {
    return ATOM_NAMES[serial];
  }
  return `Atom${serial}`;
}

/**
 * Get alternative numeric suffix name for a given 3Dmol atom serial
 * @param {number} serial - 0-based serial number from 3Dmol.js
 * @returns {string} Alternative atom name
 */
export function getAtomNameAlt(serial) {
  if (serial >= 0 && serial < ATOM_NAMES_ALT.length) {
    return ATOM_NAMES_ALT[serial];
  }
  return `Atom${serial}`;
}

/**
 * Check if selected atoms match a dihedral angle pattern
 * Returns array of matches (can be empty)
 * @param {number[]} selectedSerials - Array of 4 serial numbers (0-based from 3Dmol.js)
 * @returns {Array} Array of matching dihedral definitions
 */
export function identifyDihedral(selectedSerials) {
  if (selectedSerials.length !== 4) return [];

  // Serial numbers are already 0-based from 3Dmol.js
  const indices = selectedSerials;
  const indicesReversed = [...indices].reverse();

  const matches = [];

  // Check backbone dihedrals (both forward and reverse)
  for (const dihedral of BACKBONE_DIHEDRALS) {
    if (arraysEqual(indices, dihedral.atoms)) {
      matches.push({ type: 'backbone', isReverse: false, ...dihedral });
    } else if (arraysEqual(indicesReversed, dihedral.atoms)) {
      matches.push({ type: 'backbone', isReverse: true, ...dihedral });
    }
  }

  // Check sugar 1 pseudorotation (both forward and reverse)
  for (const angle of SUGAR1_PSEUDOROTATION) {
    if (arraysEqual(indices, angle.atoms)) {
      matches.push({ type: 'sugar1', isReverse: false, ...angle });
    } else if (arraysEqual(indicesReversed, angle.atoms)) {
      matches.push({ type: 'sugar1', isReverse: true, ...angle });
    }
  }

  // Check sugar 2 pseudorotation (both forward and reverse)
  for (const angle of SUGAR2_PSEUDOROTATION) {
    if (arraysEqual(indices, angle.atoms)) {
      matches.push({ type: 'sugar2', isReverse: false, ...angle });
    } else if (arraysEqual(indicesReversed, angle.atoms)) {
      matches.push({ type: 'sugar2', isReverse: true, ...angle });
    }
  }

  return matches;
}

/**
 * Helper function to check if two arrays are equal
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

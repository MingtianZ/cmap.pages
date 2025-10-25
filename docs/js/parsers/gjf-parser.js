// Gaussian Input File (.gjf / .com) Parser
// Extracts Cartesian coordinates from Gaussian input files

/**
 * Parse Gaussian input file and extract XYZ coordinates
 * @param {string} gjfText - Raw GJF file content
 * @returns {string} - XYZ format string
 */
export function parseGJF(gjfText) {
  const lines = gjfText.split(/\r?\n/);

  let stage = 'link0';  // Stages: link0 -> route -> title -> charge -> coords
  let titleLines = [];
  let chargeMultLine = '';
  let coordLines = [];
  let emptyLineCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip Link1 separator and beyond
    if (trimmed === '--Link1--') {
      break;
    }

    // Stage detection
    if (stage === 'link0') {
      // Link 0 commands start with %
      if (trimmed.startsWith('%')) {
        continue;
      }
      // Route section starts with #
      if (trimmed.startsWith('#')) {
        stage = 'route';
        continue;
      }
    }

    if (stage === 'route') {
      // Route section can span multiple lines until we hit an empty line
      if (trimmed === '') {
        stage = 'title';
        continue;
      }
      // Continue collecting route lines
      continue;
    }

    if (stage === 'title') {
      // Empty line after title marks end of title section
      if (trimmed === '') {
        stage = 'charge';
        continue;
      }
      titleLines.push(trimmed);
      continue;
    }

    if (stage === 'charge') {
      // Charge and multiplicity line (e.g., "0 1" or "-1 1")
      if (trimmed && /^[+-]?\d+\s+\d+/.test(trimmed)) {
        chargeMultLine = trimmed;
        stage = 'coords';
        continue;
      }
    }

    if (stage === 'coords') {
      // Empty line marks end of coordinate section
      if (trimmed === '') {
        break;
      }

      // Parse coordinate line: Element X Y Z (allow leading spaces)
      // Format can be: " O  0.0  0.0  0.0" or "C(fragment=1)  0.0  0.0  0.0"
      const coordMatch = trimmed.match(/^([A-Z][a-z]?)(?:\([^)]*\))?\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/i);

      if (coordMatch) {
        const [, element, x, y, z] = coordMatch;
        coordLines.push(`${element.padEnd(2)}  ${x.padStart(12)}  ${y.padStart(12)}  ${z.padStart(12)}`);
      }
    }
  }

  // Validate we found coordinates
  if (coordLines.length === 0) {
    throw new Error('No valid coordinates found in GJF file');
  }

  // Convert to XYZ format
  const atomCount = coordLines.length;
  const title = titleLines.join(' ') || 'Converted from GJF';

  const xyzContent = [
    atomCount.toString(),
    title,
    ...coordLines
  ].join('\n');

  return xyzContent;
}

/**
 * Extract metadata from GJF file
 * @param {string} gjfText - Raw GJF file content
 * @returns {object} - Metadata including method, basis set, charge, multiplicity
 */
export function extractGJFMetadata(gjfText) {
  const lines = gjfText.split(/\r?\n/);

  let metadata = {
    route: '',
    title: '',
    charge: 0,
    multiplicity: 1,
    memory: '',
    processors: '',
    checkpoint: ''
  };

  let stage = 'link0';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '--Link1--') break;

    // Parse Link 0 commands
    if (trimmed.startsWith('%')) {
      if (trimmed.toLowerCase().startsWith('%mem=')) {
        metadata.memory = trimmed.substring(5);
      } else if (trimmed.toLowerCase().startsWith('%nprocshared=') || trimmed.toLowerCase().startsWith('%nproc=')) {
        metadata.processors = trimmed.split('=')[1];
      } else if (trimmed.toLowerCase().startsWith('%chk=')) {
        metadata.checkpoint = trimmed.substring(5);
      }
      continue;
    }

    // Parse Route section
    if (trimmed.startsWith('#')) {
      metadata.route = trimmed;
      stage = 'route';
      continue;
    }

    if (stage === 'route' && trimmed && !trimmed.startsWith('#')) {
      if (trimmed === '') {
        stage = 'title';
      } else {
        metadata.route += ' ' + trimmed;
      }
      continue;
    }

    if (stage === 'title') {
      if (trimmed === '') {
        stage = 'charge';
        continue;
      }
      metadata.title += (metadata.title ? ' ' : '') + trimmed;
      continue;
    }

    if (stage === 'charge') {
      const chargeMatch = trimmed.match(/^([+-]?\d+)\s+(\d+)/);
      if (chargeMatch) {
        metadata.charge = parseInt(chargeMatch[1]);
        metadata.multiplicity = parseInt(chargeMatch[2]);
        break;
      }
    }
  }

  return metadata;
}

// Main application logic
import * as XYZReader from './tools/xyz-reader.js';
import * as MolReader from './tools/mol-reader.js';
import * as AboutT3PS from './tools/about-t3ps.js';
import * as GlobalQMSurvey from './tools/global-qm-survey.js';
import * as GlobalSingle from './tools/global-single.js';

// Tool registry
const tools = {
  'xyz-reader': XYZReader,
  'mol-reader': MolReader,
  'about-t3ps': AboutT3PS,
  'global-qm-survey': GlobalQMSurvey,
  'global-ag-qm': GlobalSingle,
  'global-ag-survey': GlobalSingle,
  'global-ez-qm': GlobalSingle,
  'global-ez-survey': GlobalSingle,
  'global-za-qm': GlobalSingle,
  'global-za-survey': GlobalSingle
};

let currentTool = null;
let toolInstances = {};

// Initialize application
export function init() {
  setupMenuInteraction();

  // Check URL params, if file param exists, directly open xyz-reader
  const params = new URLSearchParams(location.search);
  if (params.get('file')) {
    showTool('xyz-reader');
  }
}

// Setup menu interaction
function setupMenuInteraction() {
  // Menu click
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other menus
      document.querySelectorAll('.menu-item').forEach(m => {
        if (m !== item) m.classList.remove('active');
      });
      // Toggle current menu
      item.classList.toggle('active');
    });
  });

  // Click elsewhere to close menu
  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  });
}

// Switch tools
export function showTool(toolId) {
  // Hide all tool panels
  document.querySelectorAll('.tool-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Show selected tool
  const toolPanel = document.getElementById(toolId);
  if (toolPanel) {
    toolPanel.classList.add('active');

    // Initialize tool if not already initialized
    if (tools[toolId] && !toolInstances[toolId]) {
      // Set HTML content
      toolPanel.innerHTML = tools[toolId].getHTML();
      // Initialize tool
      toolInstances[toolId] = tools[toolId].init();
    }

    currentTool = toolId;
  }

  // Close menu
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
}

// Export to global for HTML inline event calls
window.showTool = showTool;

// 主应用逻辑
import * as XYZReader from './tools/xyz-reader.js';
import * as GridViewer from './tools/grid-viewer.js';

// 工具注册表
const tools = {
  'xyz-reader': XYZReader,
  'grid-viewer': GridViewer
};

let currentTool = null;
let toolInstances = {};

// 初始化应用
export function init() {
  setupMenuInteraction();

  // 检查 URL 参数，如果有 file 参数，直接打开 xyz-reader
  const params = new URLSearchParams(location.search);
  if (params.get('file')) {
    showTool('xyz-reader');
  }
}

// 设置菜单交互
function setupMenuInteraction() {
  // 菜单点击
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // 关闭其他菜单
      document.querySelectorAll('.menu-item').forEach(m => {
        if (m !== item) m.classList.remove('active');
      });
      // 切换当前菜单
      item.classList.toggle('active');
    });
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  });
}

// 切换工具
export function showTool(toolId) {
  // 隐藏所有工具面板
  document.querySelectorAll('.tool-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // 显示选中的工具
  const toolPanel = document.getElementById(toolId);
  if (toolPanel) {
    toolPanel.classList.add('active');

    // 如果工具还没有初始化，则初始化
    if (tools[toolId] && !toolInstances[toolId]) {
      // 设置 HTML 内容
      toolPanel.innerHTML = tools[toolId].getHTML();
      // 初始化工具
      toolInstances[toolId] = tools[toolId].init();
    }

    currentTool = toolId;
  }

  // 关闭菜单
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
}

// 导出到全局，方便 HTML 内联事件调用
window.showTool = showTool;

/**
 * MCP服务器信息模块
 * 
 * 提供关于MCP Prompt Server的基本信息和协议版本
 */

/**
 * 获取MCP服务器信息
 * @returns {Object} 服务器信息对象
 */
export function getMcpServerInfo() {
  return {
    name: 'MCP Prompt Server',
    version: '1.0.0',
    description: 'AI自动提取和添加提示词的MCP服务器',
    protocolVersion: '1.0.0',
    vendor: 'MCP 团队',
    capabilities: [
      'prompt_management',
      'version_control',
      'performance_analysis'
    ]
  };
}

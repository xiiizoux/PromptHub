/**
 * 智能配置助手
 * 通过对话方式管理MCP服务配置
 */

import { ToolDescription, ToolParameter, MCPToolResponse } from '../../types.js';
import { handleToolError, handleToolSuccess } from '../../shared/error-handler.js';
import { config } from '../../config.js';

/**
 * 配置管理工具定义
 */
export const configManagementTool: ToolDescription = {
  name: 'manage_config',
  description: '通过对话方式管理MCP服务配置，查看和更新系统设置',
  schema_version: 'v1',
  parameters: {
    action: {
      type: 'string',
      description: 'view（查看）、help（帮助）、status（状态）',
      required: true,
    } as ToolParameter,
    category: {
      type: 'string',
      description: '配置分类：ai（AI设置）、storage（存储设置）、server（服务器设置）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 配置助手工具定义
 */
export const configAssistantTool: ToolDescription = {
  name: 'config_assistant',
  description: '智能配置助手，根据使用场景推荐最佳配置',
  schema_version: 'v1',
  parameters: {
    scenario: {
      type: 'string',
      description: '使用场景：personal（个人）、team（团队）、enterprise（企业）、development（开发）',
      required: true,
    } as ToolParameter,
    preferences: {
      type: 'object',
      description: '用户偏好：{speed: "fast|balanced|quality", cost: "low|medium|high"}',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 处理配置管理
 */
export async function handleConfigManagement(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { action, category } = params;

    console.log('[配置管理] 处理请求:', { action, category });

    switch (action) {
      case 'view':
        return handleViewConfig(category);
      
      case 'status':
        return handleConfigStatus();
      
      case 'help':
        return handleConfigHelp();
      
      default:
        return handleToolError('配置管理', new Error(`不支持的操作: ${action}`));
    }

  } catch (error) {
    return handleToolError('配置管理', error);
  }
}

/**
 * 处理配置助手
 */
export async function handleConfigAssistant(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { scenario, preferences = {} } = params;

    console.log('[配置助手] 生成推荐:', { scenario, preferences });

    const recommendations = generateConfigRecommendations(scenario, preferences);
    const currentConfig = getCurrentConfigSummary();

    return {
      content: [{
        type: 'text',
        text: formatConfigRecommendations(scenario, recommendations, currentConfig)
      }]
    };

  } catch (error) {
    return handleToolError('配置助手', error);
  }
}

/**
 * 查看配置
 */
function handleViewConfig(category?: string): MCPToolResponse {
  const configData = getConfigByCategory(category);
  
  return {
    content: [{
      type: 'text',
      text: formatConfigView(configData, category)
    }]
  };
}

/**
 * 配置状态
 */
function handleConfigStatus(): MCPToolResponse {
  const status = {
    storage: config.storage.type,
    ai_service: process.env.OPENAI_API_KEY ? '已配置' : '未配置',
    server_port: config.port,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory_usage: process.memoryUsage()
  };

  return {
    content: [{
      type: 'text',
      text: formatConfigStatus(status)
    }]
  };
}

/**
 * 配置帮助
 */
function handleConfigHelp(): MCPToolResponse {
  const helpContent = `
## 📚 配置管理帮助

### 可用操作：
- **查看配置**: \`manage_config {"action": "view"}\`
- **查看状态**: \`manage_config {"action": "status"}\`
- **分类查看**: \`manage_config {"action": "view", "category": "ai"}\`

### 配置分类：
- **ai**: AI模型和API设置
- **storage**: 数据存储配置
- **server**: 服务器相关设置

### 智能推荐：
- **个人使用**: \`config_assistant {"scenario": "personal"}\`
- **团队使用**: \`config_assistant {"scenario": "team"}\`
- **企业使用**: \`config_assistant {"scenario": "enterprise"}\`

### 性能偏好：
\`\`\`json
{
  "scenario": "personal",
  "preferences": {
    "speed": "balanced",
    "cost": "low"
  }
}
\`\`\`
`;

  return {
    content: [{
      type: 'text',
      text: helpContent
    }]
  };
}

/**
 * 根据分类获取配置
 */
function getConfigByCategory(category?: string) {
  const allConfig = {
    ai: {
      baseURL: process.env.OPENAI_BASE_URL || '未设置',
      model: 'gpt-4o-mini',
      hasApiKey: !!process.env.OPENAI_API_KEY
    },
    storage: {
      type: config.storage.type,
      url: process.env.SUPABASE_URL ? '已设置' : '未设置'
    },
    server: {
      port: config.port,
      version: config.mcp?.version || '1.0.0'
    }
  };

  if (category && allConfig[category as keyof typeof allConfig]) {
    return { [category]: allConfig[category as keyof typeof allConfig] };
  }

  return allConfig;
}

/**
 * 格式化配置视图
 */
function formatConfigView(configData: any, category?: string): string {
  const title = category ? `${category.toUpperCase()} 配置` : '系统配置';
  
  let content = `## 📋 ${title}\n\n`;
  
  for (const [key, value] of Object.entries(configData)) {
    content += `### ${key.toUpperCase()}\n`;
    if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        content += `- **${subKey}**: ${subValue}\n`;
      }
    } else {
      content += `- ${value}\n`;
    }
    content += '\n';
  }

  return content;
}

/**
 * 格式化配置状态
 */
function formatConfigStatus(status: any): string {
  return `
## 🔧 系统状态

### 服务状态
- **存储类型**: ${status.storage}
- **AI服务**: ${status.ai_service}
- **服务端口**: ${status.server_port}
- **运行环境**: ${status.environment}

### 运行统计
- **运行时间**: ${Math.floor(status.uptime / 60)} 分钟
- **内存使用**: ${Math.round(status.memory_usage.heapUsed / 1024 / 1024)} MB

### 健康状态
✅ 服务正常运行
`;
}

/**
 * 生成配置推荐
 */
function generateConfigRecommendations(scenario: string, preferences: any) {
  const templates = {
    personal: {
      ai_model: 'gpt-4o-mini',
      cache_size: '50MB',
      performance: 'balanced',
      features: ['基础搜索', '智能存储', '快速复制']
    },
    team: {
      ai_model: 'gpt-4o',
      cache_size: '100MB',
      performance: 'optimized',
      features: ['协作编辑', '版本控制', '批量操作']
    },
    enterprise: {
      ai_model: 'gpt-4',
      cache_size: '200MB',
      performance: 'high',
      features: ['企业安全', '审计日志', '高级分析']
    },
    development: {
      ai_model: 'gpt-4o-mini',
      cache_size: '30MB',
      performance: 'debug',
      features: ['调试模式', '详细日志', '快速重启']
    }
  };

  return templates[scenario as keyof typeof templates] || templates.personal;
}

/**
 * 获取当前配置摘要
 */
function getCurrentConfigSummary() {
  return {
    ai_model: 'gpt-4o-mini',
    storage: config.storage.type,
    port: config.port,
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * 格式化配置推荐
 */
function formatConfigRecommendations(scenario: string, recommendations: any, currentConfig: any): string {
  return `
## 🎯 ${scenario.toUpperCase()} 场景配置推荐

### 推荐配置
- **AI模型**: ${recommendations.ai_model}
- **缓存大小**: ${recommendations.cache_size}
- **性能模式**: ${recommendations.performance}

### 推荐功能
${recommendations.features.map((f: string) => `- ${f}`).join('\n')}

### 当前配置
- **AI模型**: ${currentConfig.ai_model}
- **存储类型**: ${currentConfig.storage}
- **服务端口**: ${currentConfig.port}
- **运行环境**: ${currentConfig.environment}

### 🚀 快速操作
- 查看详细配置: \`manage_config {"action": "view"}\`
- 查看系统状态: \`manage_config {"action": "status"}\`
- 获取帮助: \`manage_config {"action": "help"}\`
`;
} 
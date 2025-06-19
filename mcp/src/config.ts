import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 简化的参数获取函数
function getParamValue(name: string): string {
  return process.env[name.toUpperCase()] || '';
}

// 配置对象，兼容环境变量
export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '9010'),
  transportType: process.env.TRANSPORT_TYPE || 'stdio',
  
  // MCP 配置
  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'MCP Prompt Server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0'
  },
  
  // API 配置
  apiKey: getParamValue("api_key") || process.env.API_KEY,
  serverKey: getParamValue("server_key") || process.env.SERVER_KEY,
  
  // 存储配置 - 支持多种存储方案
  storage: {
    // 从环境变量读取存储类型，默认为supabase
    // 已预留支持: 'supabase', 'file', 'postgresql', 'mysql' 等
    // 目前只实现了supabase存储适配器
    type: process.env.STORAGE_TYPE || 'supabase',
    
    // 存储路径配置 (用于file类型存储)
    path: process.env.STORAGE_PATH || './data'
  },
  
  // Supabase 配置
  supabase: {
    url: getParamValue("supabase_url") || process.env.SUPABASE_URL || '',
    anonKey: getParamValue("supabase_anon_key") || process.env.SUPABASE_ANON_KEY || '',
  },
  
  // OpenAI配置已移除
  
  // JWT 配置
  jwt: {
    secret: getParamValue("jwt_secret") || process.env.JWT_SECRET,
    expiresIn: getParamValue("jwt_expires_in") || process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // 用户界面配置
  ui: {
    title: 'MCP Prompt Server',
    description: '一个简单的提示词管理服务器',
  },
  
  // 环境检测
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isVercel: process.env.VERCEL === '1',
};

// 验证必需的配置
export function validateConfig(): void {
  const errors: string[] = [];
  
  // 在生产环境中，严格验证关键密钥是否存在
  if (config.isProduction) {
    if (!config.apiKey) {
      errors.push('API_KEY is not configured in production environment.');
    }
    if (!config.serverKey) {
      errors.push('SERVER_KEY is not configured in production environment.');
    }
    if (!config.jwt.secret) {
      errors.push('JWT_SECRET is not configured in production environment.');
    }
    
    // 生产环境还需验证Supabase配置
    if (!config.supabase.url) {
      errors.push('SUPABASE_URL is not configured for production.');
    }
    if (!config.supabase.anonKey) {
      errors.push('SUPABASE_ANON_KEY is not configured for production.');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Critical configuration errors found:\n- ${errors.join('\n- ')}`);
  }
}

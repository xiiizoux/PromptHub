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
  apiKey: getParamValue("api_key") || process.env.API_KEY || 'your-secure-api-key',
  serverKey: getParamValue("server_key") || process.env.SERVER_KEY || 'your-secure-api-key',
  
  // 存储配置 - 只使用Supabase
  storage: {
    type: 'supabase'
  },
  
  // Supabase 配置
  supabase: {
    url: getParamValue("supabase_url") || process.env.SUPABASE_URL || '',
    anonKey: getParamValue("supabase_anon_key") || process.env.SUPABASE_ANON_KEY || '',
  },
  
  // OpenAI配置已移除
  
  // JWT 配置
  jwt: {
    secret: getParamValue("jwt_secret") || process.env.JWT_SECRET || 'your-jwt-secret',
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
  
  // 检查API密钥是否在生产环境中配置
  if (config.isProduction && config.apiKey === 'your-secure-api-key') {
    console.warn('Warning: Using default API key in production environment');
  }
  
  // Vercel部署特定验证
  if (config.isVercel) {
    console.log('Running in Vercel environment');
    
    // 添加Vercel相关的验证，如果需要
    if (!process.env.VERCEL_URL) {
      console.warn('VERCEL_URL environment variable not set');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

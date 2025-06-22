import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 简化的参数获取函数
function getParamValue(name: string): string {
  return process.env[name.toUpperCase()] || '';
}

// 安全的端口解析函数
function parsePort(portStr: string, defaultPort: number): number {
  const port = parseInt(portStr);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.warn(`⚠️  Invalid port "${portStr}", using default: ${defaultPort}`);
    return defaultPort;
  }
  return port;
}

// 智能CORS配置函数
function getCorsOrigin(): string | string[] | boolean {
  const corsOrigin = process.env.CORS_ORIGIN;
  const nodeEnv = process.env.NODE_ENV;

  // 如果明确设置了CORS_ORIGIN，使用设置的值
  if (corsOrigin) {
    if (corsOrigin === '*') {
      return '*';
    }
    // 支持逗号分隔的多个域名
    return corsOrigin.split(',').map(origin => origin.trim());
  }

  // 根据环境智能配置
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    // 开发环境：允许常见的开发端口
    return [
      'http://localhost:3000',
      'http://localhost:9011',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:9011',
      'http://127.0.0.1:8080'
    ];
  } else if (nodeEnv === 'production') {
    // 生产环境：更严格的配置，但仍保持一定灵活性
    const allowedOrigins = [
      'http://localhost:9011', // 本地Web服务
      'http://127.0.0.1:9011'  // 本地Web服务
    ];

    // 如果设置了前端URL，添加到允许列表
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    return allowedOrigins;
  }

  // 默认情况：允许本地访问
  return ['http://localhost:9011', 'http://127.0.0.1:9011'];
}

// 配置对象，兼容环境变量
export const config = {
  // 服务器配置
  port: parsePort(process.env.PORT || '9010', 9010),
  transportType: process.env.TRANSPORT_TYPE || 'stdio',

  // MCP 配置
  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'MCP Prompt Server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0'
  },

  // API 配置 - 支持多种获取方式
  apiKey: getParamValue("api_key") || process.env.API_KEY || '',
  serverKey: getParamValue("server_key") || process.env.SERVER_KEY || '',

  // 存储配置 - 支持多种存储方案
  storage: {
    // 从环境变量读取存储类型，默认为supabase
    // 已预留支持: 'supabase', 'file', 'postgresql', 'mysql' 等
    // 目前只实现了supabase存储适配器
    type: (process.env.STORAGE_TYPE || 'supabase').toLowerCase(),

    // 存储路径配置 (用于file类型存储)
    path: process.env.STORAGE_PATH || './data'
  },

  // Supabase 配置
  supabase: {
    url: getParamValue("supabase_url") || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: getParamValue("supabase_anon_key") || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '' // 新增服务密钥支持
  },

  // JWT 配置
  jwt: {
    secret: getParamValue("jwt_secret") || process.env.JWT_SECRET || '',
    expiresIn: getParamValue("jwt_expires_in") || process.env.JWT_EXPIRES_IN || '7d',
  },

  // 用户界面配置
  ui: {
    title: process.env.UI_TITLE || 'MCP Prompt Server',
    description: process.env.UI_DESCRIPTION || '一个简单的提示词管理服务器',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE !== 'false',
    maxFileSize: parseInt(process.env.LOG_MAX_SIZE || '5242880'), // 5MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5')
  },

  // 安全配置
  security: {
    enableCors: process.env.ENABLE_CORS !== 'false',
    corsOrigin: getCorsOrigin(),
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000') // 15分钟
  },

  // 环境检测
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isVercel: process.env.VERCEL === '1',
  isDocker: process.env.DOCKER === '1' || process.env.DOCKER_CONTAINER === '1',
};

// 生成默认配置值
function generateDefaultValues(): void {
  // 为开发环境生成默认API密钥
  if (config.isDevelopment && !config.apiKey) {
    config.apiKey = 'dev-api-key-' + Math.random().toString(36).substring(2, 15);
    console.warn('⚠️  开发环境：使用自动生成的API密钥');
  }

  // 为开发环境生成默认服务器密钥
  if (config.isDevelopment && !config.serverKey) {
    config.serverKey = config.apiKey; // 开发环境可以使用相同的密钥
  }

  // 为开发环境生成默认JWT密钥
  if (config.isDevelopment && !config.jwt.secret) {
    config.jwt.secret = 'dev-jwt-secret-' + Math.random().toString(36).substring(2, 15);
    console.warn('⚠️  开发环境：使用自动生成的JWT密钥');
  }
}

// 验证必需的配置
export function validateConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 首先生成默认值
  generateDefaultValues();

  // 验证端口配置
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    errors.push(`Invalid port number: ${config.port}. Must be between 1 and 65535.`);
  }

  // 在生产环境中，验证关键配置
  if (config.isProduction) {
    // 🔧 修复: 系统级API密钥现在是可选的
    // 如果设置了系统级密钥，则验证其强度
    if (config.apiKey) {
      if (config.apiKey.includes('dev-') || config.apiKey.length < 16) {
        warnings.push('API_KEY appears to be a development key. Use a strong production key.');
      }
    } else {
      console.log('ℹ️  未设置系统级API_KEY，将完全依赖数据库验证用户密钥');
    }

    if (config.serverKey) {
      if (config.serverKey === config.apiKey && config.apiKey) {
        warnings.push('SERVER_KEY should be different from API_KEY for better security.');
      }
    }

    if (!config.jwt.secret) {
      errors.push('JWT_SECRET is required in production environment.');
    } else if (config.jwt.secret.includes('dev-') || config.jwt.secret.length < 32) {
      warnings.push('JWT_SECRET appears to be weak. Use a strong random string (32+ characters).');
    }

    // 生产环境还需验证Supabase配置
    if (!config.supabase.url) {
      errors.push('SUPABASE_URL is required for production.');
    } else if (!config.supabase.url.startsWith('https://')) {
      warnings.push('SUPABASE_URL should use HTTPS in production.');
    }

    if (!config.supabase.anonKey) {
      errors.push('SUPABASE_ANON_KEY is required for production.');
    }
  } else {
    // 开发环境的警告
    if (!config.supabase.url && config.storage.type === 'supabase') {
      warnings.push('SUPABASE_URL not configured. Supabase storage may not work.');
    }
    if (!config.supabase.anonKey && config.storage.type === 'supabase') {
      warnings.push('SUPABASE_ANON_KEY not configured. Supabase storage may not work.');
    }
  }

  // 验证存储类型
  const validStorageTypes = ['supabase', 'file', 'postgresql', 'mysql'];
  if (!validStorageTypes.includes(config.storage.type)) {
    errors.push(`Invalid storage type: ${config.storage.type}. Valid types: ${validStorageTypes.join(', ')}`);
  }

  // 输出警告
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // 如果有错误，抛出异常
  if (errors.length > 0) {
    throw new Error(`❌ Critical configuration errors found:\n${errors.map(e => `   - ${e}`).join('\n')}`);
  }

  // 输出配置摘要
  console.log('✅ Configuration validated successfully');
  console.log(`   - Environment: ${config.isProduction ? 'production' : 'development'}`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Storage: ${config.storage.type}`);
  console.log(`   - Transport: ${config.transportType}`);
}

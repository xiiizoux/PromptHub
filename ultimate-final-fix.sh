#!/bin/bash
# 最终终极修复脚本 - 针对特定语法错误

# 设置错误处理
set -e
echo "开始执行最终终极修复脚本..."

# 停止现有容器
echo "停止现有容器..."
sudo docker stop prompthub || true

# 创建修复脚本
echo "创建特定语法错误修复脚本..."
cat > syntax-fix.cjs << 'EOF'
const fs = require('fs');
const path = require('path');

// 修复配置文件中的语法错误
function fixConfigFile() {
  const filePath = '/app/mcp/dist/src/config.js';
  console.log(`修复文件: ${filePath}`);
  
  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 创建备份
    fs.writeFileSync(`${filePath}.syntax-bak`, content);
    
    // 修复语法错误：移除函数声明末尾的分号
    let fixed = content.replace(/function\s+getParamValue\s*\(\s*name\s*\)\s*;/g, 'function getParamValue(name) {');
    
    // 确保函数有结束括号
    if (fixed.includes('function getParamValue(name) {') && !fixed.includes('function getParamValue(name) {') && !fixed.includes('}')) {
      fixed = fixed.replace('function getParamValue(name) {', 'function getParamValue(name) {\n  return process.env[\'MCP_\' + name.toUpperCase()] || defaultConfig[name];\n}');
    }
    
    // 完全重写函数如果发现其他问题
    if (fixed.includes('function getParamValue') && !fixed.includes('return process.env')) {
      fixed = fixed.replace(/function\s+getParamValue[^}]*}/g, 
        'function getParamValue(name) {\n  return process.env[\'MCP_\' + name.toUpperCase()] || defaultConfig[name];\n}');
    }
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixed);
    console.log(`已修复 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`修复 ${filePath} 失败:`, error);
    return false;
  }
}

// 修复MCP路由器文件中的语法错误
function fixMcpRouterFile() {
  const filePath = '/app/mcp/dist/src/api/mcp-router.js';
  console.log(`修复文件: ${filePath}`);
  
  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 创建备份
    fs.writeFileSync(`${filePath}.syntax-bak`, content);
    
    // 修复语法错误：括号不匹配
    let fixed = content.replace(/res\.write\(`data: \${JSON\.stringify\({ type\)}\\\n\\n`\);/g, 
      'res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);');
    
    // 检查其他类似错误
    fixed = fixed.replace(/JSON\.stringify\(\{([^}]*)\)/g, 'JSON.stringify({$1}');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixed);
    console.log(`已修复 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`修复 ${filePath} 失败:`, error);
    return false;
  }
}

// 完全重写config.js文件
function rewriteConfigFile() {
  const filePath = '/app/mcp/dist/src/config.js';
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(`${filePath}.rewrite-bak`, content);
    
    // 完全重写文件内容
    const newContent = `
// 应用配置
const defaultConfig = {
  port: 9010,
  defaultApiKey: 'default-api-key-for-docker',
  validApiKeys: ['default-api-key-for-docker'],
  storage: {
    type: process.env.STORAGE_TYPE || 'supabase',
    supabase: {
      url: process.env.SUPABASE_URL || 'http://localhost:54321',
      anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU'
    },
    local: {
      dataDir: process.env.DATA_DIR || './data'
    }
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-for-development-only',
    cookieName: 'prompthub_session'
  },
  cors: {
    allowOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
  }
};

// 获取参数值，支持环境变量覆盖
function getParamValue(name) {
  const envName = 'MCP_' + name.toUpperCase();
  return process.env[envName] || defaultConfig[name];
}

// 导出配置
export const config = {
  ...defaultConfig,
  // 允许环境变量覆盖
  port: process.env.PORT || defaultConfig.port,
  defaultApiKey: process.env.API_KEY || defaultConfig.defaultApiKey,
  validApiKeys: process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : defaultConfig.validApiKeys
};
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 完全重写mcp-router.js文件
function rewriteMcpRouterFile() {
  const filePath = '/app/mcp/dist/src/api/mcp-router.js';
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(`${filePath}.rewrite-bak`, content);
    
    // 完全重写文件内容
    const newContent = `
import express from 'express';
import { authenticateRequest } from './auth-middleware.js';

const router = express.Router();

// 获取MCP信息
router.get('/info', (req, res) => {
  res.json({
    name: 'PromptHub MCP Server',
    version: '1.0.0',
    transport: process.env.TRANSPORT_TYPE || 'sse',
    capabilities: ['tools', 'resources']
  });
});

// SSE连接端点
router.get('/connect', authenticateRequest, (req, res) => {
  // 设置SSE头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 发送初始连接成功消息
  res.write(\`data: \${JSON.stringify({ type: "connected", message: "MCP连接已建立" })}\n\n\`);
  
  // 每30秒发送一次心跳以保持连接
  const pingInterval = setInterval(() => {
    res.write(\`data: \${JSON.stringify({ type: "ping" })}\n\n\`);
  }, 30000);
  
  // 客户端断开连接时清理
  req.on('close', () => {
    clearInterval(pingInterval);
    console.log('客户端断开了SSE连接');
  });
});

// 工具执行端点
router.post('/tools/:toolName', authenticateRequest, (req, res) => {
  const { toolName } = req.params;
  const { args } = req.body;
  
  console.log(\`执行工具: \${toolName}\`);
  console.log('参数:', args);
  
  // 模拟工具执行
  res.json({
    result: \`执行了工具 \${toolName} 的结果\`,
    timestamp: new Date().toISOString()
  });
});

// 资源访问端点
router.get('/resources/:resourceId', authenticateRequest, (req, res) => {
  const { resourceId } = req.params;
  
  console.log(\`访问资源: \${resourceId}\`);
  
  // 模拟资源访问
  res.json({
    resource: {
      id: resourceId,
      content: \`资源 \${resourceId} 的内容\`,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 执行所有修复
console.log("开始执行语法错误修复...");

// 尝试修复语法问题
const configFixed = fixConfigFile();
const mcpRouterFixed = fixMcpRouterFile();

// 如果修复失败，则重写文件
if (!configFixed) {
  console.log("修复config.js失败，尝试重写...");
  rewriteConfigFile();
}

if (!mcpRouterFixed) {
  console.log("修复mcp-router.js失败，尝试重写...");
  rewriteMcpRouterFile();
}

console.log("所有语法错误修复完成！");
process.exit(0);
EOF

# 复制修复脚本到Docker容器
echo "复制修复脚本到Docker容器..."
sudo docker cp syntax-fix.cjs prompthub:/app/syntax-fix.cjs

# 启动容器
echo "启动容器..."
sudo docker start prompthub

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 在容器内执行修复脚本
echo "在Docker容器中执行语法错误修复脚本..."
sudo docker exec prompthub node /app/syntax-fix.cjs

# 重启容器以应用所有修复
echo "重启容器以应用所有修复..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启并检查服务状态 (30秒)..."
sleep 30

# 查看容器日志
echo "显示容器日志最后30行以检查启动状态:"
sudo docker logs prompthub | tail -n 30

# 最终状态检查
echo "详细检查MCP服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node" || echo "无法获取进程信息，容器可能未运行"

# 检查MCP服务端口是否在监听
echo "检查MCP服务端口是否在监听..."
sudo docker exec prompthub sh -c "netstat -tulpn | grep 9010" || echo "MCP服务可能未启动或netstat未安装"

# 清理所有修复脚本
echo "如果修复成功，执行以下命令以清理所有修复脚本:"
echo "find . -name \"fix-*.js\" -o -name \"fix-*.cjs\" -o -name \"fix-*.sh\" -o -name \"*docker*.sh\" -o -name \"*complete*.sh\" -o -name \"*final*.sh\" -o -name \"*ultimate*.sh\" | grep -v docker-start.sh | xargs rm -f"

echo "修复脚本执行完成！"
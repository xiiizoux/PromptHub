const { spawn } = require('child_process');
const path = require('path');

// 设置环境变量 - 严格按照规定的端口
process.env.NODE_ENV = 'production';
const WEB_PORT = process.env.FRONTEND_PORT || 9011;  // Web使用9011
const MCP_PORT = process.env.PORT || 9010;           // MCP使用9010

console.log('🚀 启动生产环境服务器...');
console.log(`📋 端口配置: MCP=${MCP_PORT}, Web=${WEB_PORT}`);

// 启动MCP服务器
const mcpServer = spawn('node', ['mcp/dist/api/index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: MCP_PORT
  }
});

// 启动Web服务器
const webServer = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'web'),
  stdio: 'inherit',
  env: {
    ...process.env,
    FRONTEND_PORT: WEB_PORT
  }
});

// 错误处理
mcpServer.on('error', (err) => {
  console.error('❌ MCP服务器启动失败:', err);
  process.exit(1);
});

webServer.on('error', (err) => {
  console.error('❌ Web服务器启动失败:', err);
  process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('📴 正在关闭服务器...');
  mcpServer.kill();
  webServer.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 正在关闭服务器...');
  mcpServer.kill();
  webServer.kill();
  process.exit(0);
});

console.log(`✅ 服务器启动完成:`);
console.log(`   - Web服务: http://localhost:${WEB_PORT}`);
console.log(`   - MCP API: http://localhost:${MCP_PORT}`); 
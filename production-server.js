const { spawn } = require('child_process');
const path = require('path');

// 设置环境变量
process.env.NODE_ENV = 'production';
const PORT = process.env.PORT || 3000;
const MCP_PORT = process.env.MCP_PORT || 9010;

console.log('🚀 启动生产环境服务器...');

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
    PORT: PORT
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
console.log(`   - Web服务: http://localhost:${PORT}`);
console.log(`   - MCP API: http://localhost:${MCP_PORT}`); 
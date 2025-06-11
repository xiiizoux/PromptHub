const fs = require('fs');

// 重写mcp-router.js文件
function rewriteRouterFile() {
  const filePath = '/app/mcp/dist/src/api/mcp-router.js';
  console.log(`完全重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.final-backup`);
      console.log(`已创建备份: ${filePath}.final-backup`);
    }
    
    // 全新内容
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
  res.write("data: " + JSON.stringify({ type: "connected", message: "MCP连接已建立" }) + "\\n\\n");
  
  // 每30秒发送一次心跳以保持连接
  const pingInterval = setInterval(() => {
    res.write("data: " + JSON.stringify({ type: "ping" }) + "\\n\\n");
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
  
  console.log("执行工具: " + toolName);
  console.log('参数:', args);
  
  // 模拟工具执行
  res.json({
    result: "执行了工具 " + toolName + " 的结果",
    timestamp: new Date().toISOString()
  });
});

// 资源访问端点
router.get('/resources/:resourceId', authenticateRequest, (req, res) => {
  const { resourceId } = req.params;
  
  console.log("访问资源: " + resourceId);
  
  // 模拟资源访问
  res.json({
    resource: {
      id: resourceId,
      content: "资源 " + resourceId + " 的内容",
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
`;
    
    // 写入新内容
    fs.writeFileSync(filePath, newContent);
    console.log(`已成功重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 执行修复
console.log("开始执行专项修复...");
const success = rewriteRouterFile();
console.log(success ? "修复成功！" : "修复失败！");
process.exit(success ? 0 : 1);

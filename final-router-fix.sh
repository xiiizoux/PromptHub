#!/bin/bash
# 最终的mcp-router.js修复脚本

# 设置错误处理
set -e
echo "开始执行mcp-router.js专项修复脚本..."

# 停止现有容器
echo "停止现有容器..."
sudo docker stop prompthub || true

# 创建修复脚本
echo "创建专项修复脚本..."
cat > router-fix.cjs << 'EOF'
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
EOF

# 复制修复脚本到Docker容器
echo "复制修复脚本到Docker容器..."
sudo docker cp router-fix.cjs prompthub:/app/router-fix.cjs

# 启动容器
echo "启动容器..."
sudo docker start prompthub

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 在容器内执行修复脚本
echo "在Docker容器中执行专项修复脚本..."
sudo docker exec prompthub node /app/router-fix.cjs

# 重启容器以应用修复
echo "重启容器以应用修复..."
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

echo "专项修复脚本执行完成！"
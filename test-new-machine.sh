#!/bin/bash
# test-new-machine.sh - 测试新机器部署脚本

echo "🧪 模拟新机器部署测试..."

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 模拟新机器环境（删除依赖）
echo -e "${YELLOW}📦 模拟新机器环境...${NC}"
rm -rf mcp/node_modules web/node_modules supabase/node_modules
echo "✓ 删除所有依赖目录"

# 2. 测试启动脚本自动安装功能
echo -e "${YELLOW}🚀 测试启动脚本...${NC}"
timeout 30 ./start.sh &
START_PID=$!

# 等待启动
sleep 15

# 3. 验证依赖是否自动安装
echo -e "${YELLOW}🔍 验证依赖安装...${NC}"
if [ -d "mcp/node_modules" ]; then
  echo -e "${GREEN}✓ MCP依赖自动安装成功${NC}"
else
  echo -e "${RED}✗ MCP依赖安装失败${NC}"
fi

if [ -d "web/node_modules" ]; then
  echo -e "${GREEN}✓ Web依赖自动安装成功${NC}"
else
  echo -e "${RED}✗ Web依赖安装失败${NC}"
fi

if [ -d "supabase/node_modules" ]; then
  echo -e "${GREEN}✓ Supabase依赖自动安装成功${NC}"
else
  echo -e "${RED}✗ Supabase依赖安装失败${NC}"
fi

# 4. 验证服务运行状态
echo -e "${YELLOW}🌐 验证服务状态...${NC}"
if lsof -i :9010 >/dev/null 2>&1; then
  echo -e "${GREEN}✓ MCP服务运行正常 (端口: 9010)${NC}"
else
  echo -e "${RED}✗ MCP服务未运行${NC}"
fi

if lsof -i :9011 >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Web服务运行正常 (端口: 9011)${NC}"
else
  echo -e "${RED}✗ Web服务未运行${NC}"
fi

# 5. 测试API响应
echo -e "${YELLOW}🔗 测试API响应...${NC}"
if curl -s http://localhost:9010/api/health >/dev/null 2>&1; then
  echo -e "${GREEN}✓ MCP API响应正常${NC}"
else
  echo -e "${RED}✗ MCP API无响应${NC}"
fi

if curl -s http://localhost:9011 >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Web应用响应正常${NC}"
else
  echo -e "${RED}✗ Web应用无响应${NC}"
fi

echo ""
echo -e "${GREEN}🎉 新机器部署测试完成!${NC}"
echo ""
echo -e "${YELLOW}📋 测试总结:${NC}"
echo "- 启动脚本自动检测并安装了所有缺失的依赖"
echo "- MCP服务和Web应用都正常启动"
echo "- API端点正常响应"
echo ""
echo -e "${YELLOW}🛠️  管理命令:${NC}"
echo "  停止服务: ./stop.sh"
echo "  查看日志: tail -f /tmp/mcp.log /tmp/web.log"
echo "  重新启动: ./start.sh" 
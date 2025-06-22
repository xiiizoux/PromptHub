#!/bin/bash

echo "🔧 修复远程服务器配置脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 远程服务器信息
REMOTE_SERVER="mcp.prompt-hub.cc"
REMOTE_USER="root"  # 根据实际情况修改
REMOTE_PORT="22"    # 根据实际情况修改

echo -e "${BLUE}步骤1: 检查远程服务器连接...${NC}"
if ping -c 1 $REMOTE_SERVER &> /dev/null; then
    echo -e "${GREEN}✅ 远程服务器连通${NC}"
else
    echo -e "${RED}❌ 无法连接到远程服务器${NC}"
    exit 1
fi

echo -e "${BLUE}步骤2: 生成远程环境配置文件...${NC}"

# 创建远程环境配置
cat > .env.remote << 'EOF'
# 远程MCP服务器配置
PORT=9010
FRONTEND_PORT=9011

# 传输类型配置 (http用于远程模式)
TRANSPORT_TYPE=http

# 存储类型
STORAGE_TYPE=supabase

# API密钥配置 (用于MCP服务器认证)
API_KEY=mcp-server-key-2024-secure-prompt-hub-cc
SERVER_KEY=mcp-server-key-2024-secure-prompt-hub-cc

# 安全配置
SECURITY_LEVEL=balanced
RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_MAX=10

# Supabase配置 (与本地相同的数据库)
SUPABASE_URL=https://meyzdumdbjiebtnjifcc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZWJ0bmppZmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTAwNjUsImV4cCI6MjA2MzY2NjA2NX0.lU2sJcctRltQja7q17UEDNEJUB0KIyvldzqJz15DBhc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA5MDA2NSwiZXhwIjoyMDYzNjY2MDY1fQ.yBhS-Mf8KE49yuWgbZ5auTA-Xp5G-JBoshwiC6Xz4Q4

# JWT配置
JWT_SECRET=ZTuTVrMASWAI6vNvICNqbY0a4jtLuNNhNlGihe9o+IsniKzk5hzcK+ceDX+tRx7fvainBzPcTFTZ8zXO8E/cGQ==
JWT_EXPIRES_IN=3600

# 生产环境配置
NODE_ENV=production
CORS_ORIGIN=*
EOF

echo -e "${GREEN}✅ 远程配置文件已生成: .env.remote${NC}"

echo -e "${BLUE}步骤3: 生成远程部署脚本...${NC}"

# 创建远程部署脚本
cat > deploy-remote-config.sh << 'EOF'
#!/bin/bash

# 远程服务器部署脚本
REMOTE_SERVER="mcp.prompt-hub.cc"
REMOTE_USER="root"
REMOTE_PATH="/opt/prompthub"  # 根据实际情况修改

echo "🚀 开始部署远程配置..."

# 1. 备份远程现有配置
echo "📦 备份远程现有配置..."
ssh $REMOTE_USER@$REMOTE_SERVER "cd $REMOTE_PATH && cp .env .env.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

# 2. 上传新配置
echo "📤 上传新配置文件..."
scp .env.remote $REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/.env

# 3. 重启远程服务
echo "🔄 重启远程MCP服务..."
ssh $REMOTE_USER@$REMOTE_SERVER "cd $REMOTE_PATH && pm2 restart mcp-server || systemctl restart mcp-server || docker-compose restart"

echo "✅ 远程配置部署完成！"
EOF

chmod +x deploy-remote-config.sh

echo -e "${GREEN}✅ 远程部署脚本已生成: deploy-remote-config.sh${NC}"

echo -e "${BLUE}步骤4: 创建手动修复指南...${NC}"

cat > remote-manual-fix.md << 'EOF'
# 远程服务器手动修复指南

## 🎯 问题诊断
远程服务器API密钥认证失败，返回401错误。原因：
- 远程服务器连接了不同的Supabase数据库实例
- 或者环境变量配置不正确

## 🔧 修复步骤

### 方法1: 使用部署脚本 (推荐)
```bash
# 运行自动部署脚本
./deploy-remote-config.sh
```

### 方法2: 手动登录服务器修复
```bash
# 1. 登录远程服务器
ssh root@mcp.prompt-hub.cc

# 2. 进入项目目录
cd /opt/prompthub  # 根据实际路径调整

# 3. 备份现有配置
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 4. 编辑环境配置
nano .env
```

### 关键配置项
确保以下配置与本地相同：
```env
# Supabase配置 (关键！)
SUPABASE_URL=https://meyzdumdbjiebtnjifcc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTAwNjUsImV4cCI6MjA2MzY2NjA2NX0.lU2sJcctRltQja7q17UEDNEJUB0KIyvldzqJz15DBhc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZWJ0bmppZmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA5MDA2NSwiZXhwIjoyMDYzNjY2MDY1fQ.yBhS-Mf8KE49yuWgbZ5auTA-Xp5G-JBoshwiC6Xz4Q4

# JWT配置
JWT_SECRET=ZTuTVrMASWAI6vNvICNqbY0a4jtLuNNhNlGihe9o+IsniKzk5hzcK+ceDX+tRx7fvainBzPcTFTZ8zXO8E/cGQ==
```

### 重启服务
```bash
# 选择适合的重启方式
pm2 restart mcp-server
# 或
systemctl restart mcp-server  
# 或
docker-compose restart
```

## 🧪 验证修复
```bash
# 测试API密钥认证
curl -H "X-Api-Key: aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653" \
     https://mcp.prompt-hub.cc/tools

# 期望返回: 200状态码和工具列表
```

## 📊 监控
修复后监控以下指标：
- API响应时间
- 认证成功率
- 错误日志
- 数据库连接状态
EOF

echo -e "${GREEN}✅ 手动修复指南已生成: remote-manual-fix.md${NC}"

echo -e "${BLUE}步骤5: 创建验证脚本...${NC}"

cat > verify-remote-fix.sh << 'EOF'
#!/bin/bash

echo "🧪 验证远程服务器修复结果"
echo "=========================="

API_KEY="aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653"
REMOTE_URL="https://mcp.prompt-hub.cc"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "测试1: 服务器健康检查..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" $REMOTE_URL/info)
if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 服务器健康检查通过 (200)${NC}"
else
    echo -e "${RED}❌ 服务器健康检查失败 ($HEALTH_CODE)${NC}"
fi

echo "测试2: API密钥认证..."
TOOLS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $API_KEY" $REMOTE_URL/tools)
if [ "$TOOLS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API密钥认证成功 (200)${NC}"
    
    # 获取工具数量
    TOOLS_COUNT=$(curl -s -H "X-Api-Key: $API_KEY" $REMOTE_URL/tools | jq '.tools | length' 2>/dev/null || echo "N/A")
    echo -e "${GREEN}🔧 可用工具数量: $TOOLS_COUNT${NC}"
else
    echo -e "${RED}❌ API密钥认证失败 ($TOOLS_CODE)${NC}"
fi

echo "测试3: MCP适配器连接..."
if command -v node &> /dev/null; then
    echo "🔄 测试MCP适配器连接..."
    timeout 10s node -e "
    const https = require('https');
    const options = {
        hostname: 'mcp.prompt-hub.cc',
        port: 443,
        path: '/tools',
        method: 'GET',
        headers: {
            'X-Api-Key': '$API_KEY',
            'Content-Type': 'application/json'
        }
    };
    
    const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('✅ MCP适配器连接成功');
        } else {
            console.log('❌ MCP适配器连接失败:', res.statusCode);
        }
    });
    
    req.on('error', (e) => {
        console.log('❌ 连接错误:', e.message);
    });
    
    req.end();
    " 2>/dev/null || echo -e "${YELLOW}⚠️  Node.js不可用，跳过MCP适配器测试${NC}"
fi

echo ""
echo "📋 修复验证完成！"
if [ "$TOOLS_CODE" = "200" ]; then
    echo -e "${GREEN}🎉 远程服务器配置修复成功！${NC}"
    echo "现在可以重启Cursor并测试MCP工具了。"
else
    echo -e "${RED}🔥 远程服务器仍需进一步修复${NC}"
    echo "请参考 remote-manual-fix.md 进行手动修复。"
fi
EOF

chmod +x verify-remote-fix.sh

echo -e "${GREEN}✅ 验证脚本已生成: verify-remote-fix.sh${NC}"

echo ""
echo -e "${YELLOW}📋 修复流程总结:${NC}"
echo "1. 📄 已生成远程配置文件: .env.remote"
echo "2. 🚀 已生成部署脚本: deploy-remote-config.sh"
echo "3. 📖 已生成手动修复指南: remote-manual-fix.md"
echo "4. 🧪 已生成验证脚本: verify-remote-fix.sh"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo "1. 运行: ./deploy-remote-config.sh (如果有SSH访问权限)"
echo "2. 或参考: remote-manual-fix.md 进行手动修复"
echo "3. 验证: ./verify-remote-fix.sh"
echo ""
echo -e "${GREEN}🎯 核心问题: 远程服务器需要连接到相同的Supabase数据库实例${NC}"
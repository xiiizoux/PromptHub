#!/bin/bash

echo "🚀 部署远程服务器配置脚本"
echo "============================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量 (根据实际情况修改)
REMOTE_HOST="mcp.prompt-hub.cc"
REMOTE_USER="root"  # 或实际用户名
REMOTE_PORT="22"
REMOTE_PATH="/opt/prompthub"  # 常见路径，根据实际情况调整

echo -e "${BLUE}📋 部署配置:${NC}"
echo "   服务器: $REMOTE_HOST"
echo "   用户: $REMOTE_USER"
echo "   路径: $REMOTE_PATH"
echo ""

# 检查SSH连接
echo -e "${BLUE}步骤1: 测试SSH连接...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH连接成功${NC}"
else
    echo -e "${RED}❌ SSH连接失败${NC}"
    echo -e "${YELLOW}请确保:${NC}"
    echo "1. SSH密钥配置正确"
    echo "2. 服务器地址和端口正确"
    echo "3. 用户名正确"
    echo ""
    echo -e "${BLUE}手动连接测试:${NC}"
    echo "ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT"
    exit 1
fi

# 检查远程路径
echo -e "${BLUE}步骤2: 检查远程部署路径...${NC}"
REMOTE_PATH_EXISTS=$(ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "test -d $REMOTE_PATH && echo 'exists' || echo 'not_exists'" 2>/dev/null)

if [ "$REMOTE_PATH_EXISTS" = "exists" ]; then
    echo -e "${GREEN}✅ 远程路径存在: $REMOTE_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  路径不存在，尝试常见位置...${NC}"
    
    # 尝试常见路径
    COMMON_PATHS=("/opt/prompthub" "/var/www/prompthub" "/home/app/prompthub" "/root/prompthub" "/home/$REMOTE_USER/prompthub")
    
    for path in "${COMMON_PATHS[@]}"; do
        if ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "test -d $path" 2>/dev/null; then
            REMOTE_PATH="$path"
            echo -e "${GREEN}✅ 找到项目路径: $REMOTE_PATH${NC}"
            break
        fi
    done
    
    # 如果仍未找到，让用户手动指定
    if [ "$REMOTE_PATH_EXISTS" != "exists" ]; then
        echo -e "${RED}❌ 未找到项目路径${NC}"
        echo -e "${YELLOW}请手动查找项目路径:${NC}"
        echo "ssh $REMOTE_USER@$REMOTE_HOST \"find / -name '.env' -path '*mcp*' 2>/dev/null\""
        exit 1
    fi
fi

# 备份远程配置
echo -e "${BLUE}步骤3: 备份远程现有配置...${NC}"
BACKUP_NAME=".env.backup.$(date +%Y%m%d_%H%M%S)"
ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "cd $REMOTE_PATH && cp .env $BACKUP_NAME 2>/dev/null && echo '备份已创建: $BACKUP_NAME' || echo '无现有配置文件或备份失败'"

# 上传新配置
echo -e "${BLUE}步骤4: 上传新配置文件...${NC}"
if scp -P $REMOTE_PORT .env.remote $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/.env; then
    echo -e "${GREEN}✅ 配置文件上传成功${NC}"
else
    echo -e "${RED}❌ 配置文件上传失败${NC}"
    exit 1
fi

# 验证配置
echo -e "${BLUE}步骤5: 验证上传的配置...${NC}"
SUPABASE_URL_REMOTE=$(ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "cd $REMOTE_PATH && grep '^SUPABASE_URL=' .env | cut -d'=' -f2" 2>/dev/null)
if [[ "$SUPABASE_URL_REMOTE" == *"meyzdumdbjiebtnjifcc"* ]]; then
    echo -e "${GREEN}✅ Supabase配置验证通过${NC}"
else
    echo -e "${RED}❌ Supabase配置验证失败${NC}"
    echo "远程配置: $SUPABASE_URL_REMOTE"
fi

# 重启远程服务
echo -e "${BLUE}步骤6: 重启远程服务...${NC}"
echo "尝试不同的重启方式..."

# 尝试PM2
if ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "which pm2 >/dev/null 2>&1"; then
    echo "使用PM2重启..."
    ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "pm2 restart all" && echo -e "${GREEN}✅ PM2重启成功${NC}"
fi

# 尝试Systemctl
if ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "which systemctl >/dev/null 2>&1"; then
    echo "尝试Systemctl重启..."
    ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "systemctl restart mcp-server 2>/dev/null && echo 'Systemctl重启成功' || echo 'Systemctl重启失败或服务名不匹配'"
fi

# 尝试Docker
if ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "which docker-compose >/dev/null 2>&1"; then
    echo "尝试Docker重启..."
    ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT "cd $REMOTE_PATH && docker-compose restart 2>/dev/null && echo 'Docker重启成功' || echo 'Docker重启失败'"
fi

echo -e "${GREEN}✅ 部署完成${NC}"

# 等待服务启动
echo -e "${BLUE}步骤7: 等待服务启动...${NC}"
sleep 5

# 验证部署结果
echo -e "${BLUE}步骤8: 验证部署结果...${NC}"
./verify-remote-fix.sh

echo ""
echo -e "${BLUE}📋 部署总结:${NC}"
echo "1. 配置已上传到: $REMOTE_HOST:$REMOTE_PATH/.env"
echo "2. 备份文件: $BACKUP_NAME"
echo "3. 服务已重启"
echo "4. 验证结果见上方"
echo ""
echo -e "${YELLOW}如果仍有问题，请:${NC}"
echo "1. 检查 remote-manual-fix.md 获取详细指南"
echo "2. 手动登录服务器检查日志"
echo "3. 考虑使用本地服务器作为临时方案"
#!/bin/bash

echo "🧪 验证远程服务器修复结果"
echo "=========================="

API_KEY="aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653"
REMOTE_URL="https://mcp.prompt-hub.cc"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 开始验证远程服务器状态...${NC}"
echo ""

echo "测试1: 服务器健康检查..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" $REMOTE_URL/info)
if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 服务器健康检查通过 (200)${NC}"
    
    # 获取服务器信息
    SERVER_INFO=$(curl -s $REMOTE_URL/info 2>/dev/null)
    if [ -n "$SERVER_INFO" ]; then
        echo -e "${BLUE}   服务器信息: $(echo $SERVER_INFO | jq -r '.name // "N/A"' 2>/dev/null || echo 'N/A')${NC}"
        echo -e "${BLUE}   版本: $(echo $SERVER_INFO | jq -r '.version // "N/A"' 2>/dev/null || echo 'N/A')${NC}"
    fi
else
    echo -e "${RED}❌ 服务器健康检查失败 ($HEALTH_CODE)${NC}"
    echo -e "${YELLOW}⚠️  如果服务器不可访问，请检查网络连接或服务器状态${NC}"
fi

echo ""
echo "测试2: API密钥认证验证..."
TOOLS_RESPONSE=$(curl -s -w "%{http_code}" -H "X-Api-Key: $API_KEY" $REMOTE_URL/tools)
TOOLS_CODE="${TOOLS_RESPONSE: -3}"
TOOLS_BODY="${TOOLS_RESPONSE%???}"

if [ "$TOOLS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API密钥认证成功 (200)${NC}"
    
    # 尝试解析工具数量
    if command -v jq >/dev/null 2>&1; then
        TOOLS_COUNT=$(echo "$TOOLS_BODY" | jq '.tools | length' 2>/dev/null || echo "N/A")
        echo -e "${GREEN}🔧 可用工具数量: $TOOLS_COUNT${NC}"
        
        # 显示前3个工具名称
        echo -e "${BLUE}🛠️  工具预览:${NC}"
        echo "$TOOLS_BODY" | jq -r '.tools[0:3][] | "   - " + .name + ": " + .description' 2>/dev/null || echo "   无法解析工具列表"
    else
        echo -e "${YELLOW}⚠️  jq未安装，无法解析工具数量${NC}"
        echo -e "${BLUE}📄 原始响应: ${TOOLS_BODY:0:200}...${NC}"
    fi
else
    echo -e "${RED}❌ API密钥认证失败 ($TOOLS_CODE)${NC}"
    echo -e "${RED}📄 错误响应: $TOOLS_BODY${NC}"
    
    if [ "$TOOLS_CODE" = "401" ]; then
        echo -e "${YELLOW}💡 这表明远程服务器的数据库配置仍然不正确${NC}"
        echo -e "${YELLOW}   请检查SUPABASE_URL和相关配置是否与本地一致${NC}"
    fi
fi

echo ""
echo "测试3: 本地API密钥验证 (对比测试)..."
if curl -s http://localhost:9010/info >/dev/null 2>&1; then
    LOCAL_TOOLS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $API_KEY" http://localhost:9010/tools)
    if [ "$LOCAL_TOOLS_CODE" = "200" ]; then
        echo -e "${GREEN}✅ 本地API密钥认证成功 (200) - 验证密钥有效${NC}"
    else
        echo -e "${YELLOW}⚠️  本地API密钥认证失败 ($LOCAL_TOOLS_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  本地MCP服务器未运行，跳过对比测试${NC}"
fi

echo ""
echo "测试4: MCP适配器兼容性..."
if command -v node &> /dev/null; then
    echo "🔄 测试MCP协议适配器连接..."
    timeout 10s node -e "
    const https = require('https');
    const options = {
        hostname: 'mcp.prompt-hub.cc',
        port: 443,
        path: '/tools',
        method: 'GET',
        headers: {
            'X-Api-Key': '$API_KEY',
            'Content-Type': 'application/json',
            'User-Agent': 'MCP-Protocol-Adapter/1.0.0'
        }
    };
    
    const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('✅ MCP适配器协议兼容');
        } else {
            console.log('❌ MCP适配器协议不兼容:', res.statusCode);
        }
    });
    
    req.on('error', (e) => {
        console.log('❌ 连接错误:', e.message);
    });
    
    req.setTimeout(5000, () => {
        console.log('⏱️  连接超时');
        req.destroy();
    });
    
    req.end();
    " 2>/dev/null || echo -e "${YELLOW}⚠️  Node.js测试执行失败${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js不可用，跳过MCP适配器测试${NC}"
fi

echo ""
echo "==============================="
echo "📋 验证结果总结:"

if [ "$HEALTH_CODE" = "200" ] && [ "$TOOLS_CODE" = "200" ]; then
    echo -e "${GREEN}🎉 远程服务器配置修复成功！${NC}"
    echo -e "${GREEN}✨ 现在可以重启Cursor并测试MCP工具了${NC}"
    echo ""
    echo -e "${BLUE}下一步操作:${NC}"
    echo "1. 重启Cursor编辑器"
    echo "2. 检查MCP状态 (Cursor > Settings > Features > MCP)"
    echo "3. 应该看到PromptHub服务器显示可用工具"
    
elif [ "$HEALTH_CODE" = "200" ] && [ "$TOOLS_CODE" != "200" ]; then
    echo -e "${YELLOW}⚠️  服务器运行正常，但API认证仍然失败${NC}"
    echo -e "${RED}🔧 需要进一步修复数据库配置${NC}"
    echo ""
    echo -e "${BLUE}建议操作:${NC}"
    echo "1. 检查远程服务器.env文件中的SUPABASE配置"
    echo "2. 确保与本地配置完全一致"
    echo "3. 重启远程MCP服务"
    echo "4. 参考 remote-manual-fix.md 获取详细指南"
    
else
    echo -e "${RED}❌ 远程服务器仍存在问题${NC}"
    echo -e "${RED}🚨 建议使用本地服务器作为临时方案${NC}"
    echo ""
    echo -e "${BLUE}临时方案:${NC}"
    echo "1. 启动本地MCP服务: cd /home/zou/PromptHub/mcp && npm start"
    echo "2. 修改Cursor MCP配置使用本地服务器"
    echo "3. 参考 remote-manual-fix.md 的紧急方案部分"
fi

echo ""
echo -e "${BLUE}📞 需要帮助?${NC}"
echo "- 查看详细修复指南: cat remote-manual-fix.md"
echo "- 检查本地配置文件: cat .env.remote"
echo "- 重新运行验证: ./verify-remote-fix.sh"
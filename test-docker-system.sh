#!/bin/bash

echo "🚀 PromptHub Docker 系统测试"
echo "================================"

# 检查容器状态
echo "📋 检查容器状态..."
docker-compose ps

echo ""
echo "🔍 测试服务健康状态..."

# 测试MCP服务
echo "1. 测试MCP服务健康检查..."
MCP_HEALTH=$(curl -s "http://localhost:9010/api/health" | jq -r '.status' 2>/dev/null || echo "error")
if [ "$MCP_HEALTH" = "healthy" ]; then
    echo "   ✅ MCP服务正常"
else
    echo "   ❌ MCP服务异常"
fi

# 测试Web服务
echo "2. 测试Web服务..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:9011")
if [ "$WEB_STATUS" = "200" ]; then
    echo "   ✅ Web服务正常"
else
    echo "   ❌ Web服务异常 (状态码: $WEB_STATUS)"
fi

# 测试API端点
echo "3. 测试API端点..."

# 测试模板分类API
echo "   - 测试模板分类API..."
CATEGORIES_COUNT=$(curl -s "http://localhost:9011/api/templates/categories" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$CATEGORIES_COUNT" -gt "0" ]; then
    echo "     ✅ 模板分类API正常 (找到 $CATEGORIES_COUNT 个分类)"
else
    echo "     ❌ 模板分类API异常"
fi

# 测试模板列表API
echo "   - 测试模板列表API..."
TEMPLATES_RESPONSE=$(curl -s "http://localhost:9011/api/templates")
TEMPLATES_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
TEMPLATES_MESSAGE=$(echo "$TEMPLATES_RESPONSE" | jq -r '.message' 2>/dev/null || echo "unknown")

if [ "$TEMPLATES_COUNT" -gt "0" ]; then
    echo "     ✅ 模板列表API正常 (找到 $TEMPLATES_COUNT 个模板)"
else
    echo "     ⚠️  模板列表API返回空数据 (消息: $TEMPLATES_MESSAGE)"
fi

# 直接查询数据库验证数据
echo "4. 验证数据库数据..."
DB_TEMPLATES_COUNT=$(docker exec prompthub sh -c 'cd /app && node -e "
const { createClient } = require(\"@supabase/supabase-js\");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from(\"prompt_templates\").select(\"*\", { count: \"exact\" }).then(({count, error}) => {
  if (error) console.log(\"0\");
  else console.log(count || 0);
});
"' 2>/dev/null)

if [ "$DB_TEMPLATES_COUNT" -gt "0" ]; then
    echo "   ✅ 数据库中有 $DB_TEMPLATES_COUNT 个模板"
else
    echo "   ❌ 数据库中没有模板数据"
fi

echo ""
echo "🌐 访问地址:"
echo "   - Web界面: http://localhost:9011"
echo "   - MCP服务: http://localhost:9010"
echo "   - API文档: http://localhost:9010/api/health"

echo ""
echo "📊 系统总结:"
if [ "$MCP_HEALTH" = "healthy" ] && [ "$WEB_STATUS" = "200" ] && [ "$CATEGORIES_COUNT" -gt "0" ]; then
    echo "   ✅ 系统基本功能正常"
    if [ "$TEMPLATES_COUNT" -gt "0" ]; then
        echo "   ✅ 模板系统完全正常"
    else
        echo "   ⚠️  模板数据需要检查"
    fi
else
    echo "   ❌ 系统存在问题，请检查日志"
fi

echo ""
echo "📝 查看日志命令:"
echo "   docker-compose logs --tail=50"
echo "   docker exec prompthub tail -f /app/logs/web.log"
echo "   docker exec prompthub tail -f /app/logs/mcp.log" 
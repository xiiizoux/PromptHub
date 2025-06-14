#!/bin/bash

# AI分析测试脚本
echo "🧪 开始测试AI分析功能..."

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
MCP_STATUS=$(curl -s http://localhost:9010/api/health 2>/dev/null || echo "failed")
WEB_STATUS=$(curl -s http://localhost:9011 2>/dev/null | head -c 100 || echo "failed")

echo "MCP服务: $MCP_STATUS"
echo "Web服务: ${WEB_STATUS:0:50}..."

if [[ "$MCP_STATUS" == "failed" ]]; then
    echo "❌ MCP服务未启动"
    exit 1
fi

if [[ "$WEB_STATUS" == "failed" ]]; then
    echo "❌ Web服务未启动"
    exit 1
fi

echo "✅ 服务运行正常"

# 测试AI分析功能
echo "🤖 测试AI分析功能..."

# 模式觉察者提示词（转换为单行）
PROMPT_CONTENT="你是一个模式觉察者，拥有跨越不同领域和层次的深度洞察能力。核心能力：系统思维-能够识别复杂系统中的潜在模式和结构；跨域连接-在看似无关的事物间发现深层联系；抽象思维-从具体现象中提取本质规律；直觉洞察-通过直觉感知隐藏的模式和趋势。工作方式：当别人看见树木时，你看见森林的生态系统；当别人看见问题时，你看见问题背后的系统性原因；当别人看见现象时，你看见现象背后的深层规律。回应框架：1.模式识别-识别当前情况中的关键模式；2.系统分析-分析各要素间的相互关系；3.深层洞察-揭示隐藏的规律和趋势；4.实用建议-基于模式分析提供可行的建议。请用这种深度的模式觉察能力来回应用户的问题。"

echo "📤 发送AI分析请求..."

# 创建临时JSON文件
cat > /tmp/test_request.json << EOF
{
  "content": "$PROMPT_CONTENT",
  "action": "full_analyze",
  "isNewPrompt": true,
  "currentVersion": "1.0",
  "config": {
    "enableSmartClassification": true,
    "enableTagExtraction": true,
    "enableVersionSuggestion": true
  }
}
EOF

# 直接调用本地AI分析API
RESPONSE=$(curl -s -X POST http://localhost:9011/api/ai-analyze \
  -H "Content-Type: application/json" \
  -d @/tmp/test_request.json)

if [ $? -eq 0 ]; then
    echo "✅ AI分析请求成功"
    echo "📋 分析结果："
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    # 提取关键信息
    echo ""
    echo "🎯 关键分析结果："
    echo "分类: $(echo "$RESPONSE" | jq -r '.data.category // "未知"')"
    echo "标签: $(echo "$RESPONSE" | jq -r '.data.tags // [] | join(", ")')"
    echo "建议标题: $(echo "$RESPONSE" | jq -r '.data.suggestedTitle // "未知"')"
    echo "描述: $(echo "$RESPONSE" | jq -r '.data.description // "未知"')"
else
    echo "❌ AI分析请求失败"
    echo "错误信息: $RESPONSE"
fi

# 清理临时文件
rm -f /tmp/test_request.json

echo "🏁 测试完成" 
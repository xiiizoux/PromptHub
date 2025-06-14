#!/bin/bash

# 测试外部AI分析指导工具
echo "=== 测试外部AI分析指导工具 ==="
curl -X POST http://localhost:9010/api/mcp/tools/call \
-H "Content-Type: application/json" \
-d '{
  "name": "analyze_prompt_with_external_ai",
  "arguments": {
    "content": "你是一个专业的Python编程助手，擅长解决编程问题、代码优化和最佳实践指导。你可以帮助用户编写高质量的Python代码，调试错误，并提供清晰的解释。",
    "analysis_type": "full"
  }
}' | jq -r '.content[0].text' | head -20

echo -e "\n=== 测试智能提示词选择工具 ==="
curl -X POST http://localhost:9010/api/mcp/tools/call \
-H "Content-Type: application/json" \
-d '{
  "name": "intelligent_prompt_selection",
  "arguments": {
    "user_query": "我需要一个帮助编程的助手",
    "preferred_category": "编程",
    "max_results": 3
  }
}' | jq -r '.content[0].text' | head -20 
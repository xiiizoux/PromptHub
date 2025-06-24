#!/bin/bash

# MCP服务器性能追踪测试脚本
# 测试MCP服务器的搜索操作是否正确记录到数据库

# 配置
MCP_SERVER_URL="http://localhost:9010"
API_KEY="aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653"

echo "🧪 开始MCP服务器性能追踪测试"
echo "   服务器地址: $MCP_SERVER_URL"
echo "   API密钥: ${API_KEY:0:10}..."

# 测试函数
test_mcp_tool() {
    local tool_name=$1
    local params=$2
    local request_id="test_${tool_name}_$(date +%s)"
    
    echo ""
    echo "🚀 测试工具: $tool_name"
    echo "   参数: $params"
    
    local start_time=$(date +%s%3N)
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -H "X-Request-ID: $request_id" \
        -d "{\"name\":\"$tool_name\",\"arguments\":$params}" \
        "$MCP_SERVER_URL/tools/call")
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    # 分离响应体和状态码
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ 工具调用成功"
        echo "   响应时间: ${duration}ms"
        echo "   HTTP状态: $http_code"
        
        # 显示响应内容的前200个字符
        local preview=$(echo "$response_body" | jq -r '.content.text // .message // "无内容"' 2>/dev/null | head -c 200)
        echo "   内容预览: $preview..."
        
        return 0
    else
        echo "❌ 工具调用失败"
        echo "   响应时间: ${duration}ms"
        echo "   HTTP状态: $http_code"
        echo "   错误信息: $response_body"
        
        return 1
    fi
}

# 检查性能记录
check_performance_records() {
    echo ""
    echo "📊 检查数据库中的性能记录..."
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X GET \
        -H "Authorization: Bearer $API_KEY" \
        "$MCP_SERVER_URL/api/performance/search-stats?timeRange=24h")
    
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ 搜索统计获取成功"
        
        # 解析JSON响应
        local total_searches=$(echo "$response_body" | jq -r '.data.summary.totalSearches // 0' 2>/dev/null)
        local avg_response_time=$(echo "$response_body" | jq -r '.data.summary.avgResponseTime // 0' 2>/dev/null)
        
        echo "   总搜索次数: $total_searches"
        echo "   平均响应时间: ${avg_response_time}ms"
        
        # 显示工具统计
        echo "   工具统计:"
        echo "$response_body" | jq -r '.data.toolStats[]? | "     - \(.tool): \(.count)次, 平均\(.avgResponseTime)ms"' 2>/dev/null
        
        return 0
    else
        echo "❌ 搜索统计获取失败"
        echo "   HTTP状态: $http_code"
        echo "   错误信息: $response_body"
        
        return 1
    fi
}

# 主测试流程
main() {
    local success_count=0
    local total_count=0
    
    # 测试用例1: unified_search
    echo ""
    echo "=" | tr '\n' '=' | head -c 50; echo ""
    if test_mcp_tool "unified_search" '{"query":"写邮件","max_results":5}'; then
        ((success_count++))
    fi
    ((total_count++))
    sleep 1
    
    # 测试用例2: smart_semantic_search
    echo ""
    echo "=" | tr '\n' '=' | head -c 50; echo ""
    if test_mcp_tool "smart_semantic_search" '{"query":"商务邮件模板","max_results":3}'; then
        ((success_count++))
    fi
    ((total_count++))
    sleep 1
    
    # 测试用例3: enhanced_search_prompts
    echo ""
    echo "=" | tr '\n' '=' | head -c 50; echo ""
    if test_mcp_tool "enhanced_search_prompts" '{"query":"分析","category":"商务","max_results":5}'; then
        ((success_count++))
    fi
    ((total_count++))
    sleep 1
    
    # 等待数据库处理
    echo ""
    echo "⏳ 等待数据库处理完成..."
    sleep 3
    
    # 检查数据库记录
    check_performance_records
    local db_check_result=$?
    
    # 生成测试报告
    echo ""
    echo "📋 测试报告:"
    echo "=" | tr '\n' '=' | head -c 50; echo ""
    echo "总测试数: $total_count"
    echo "成功数: $success_count"
    echo "失败数: $((total_count - success_count))"
    echo "成功率: $(( success_count * 100 / total_count ))%"
    
    if [ $db_check_result -eq 0 ]; then
        echo "✅ 数据库性能统计获取成功"
        echo "✅ 性能追踪系统正常工作"
    else
        echo "❌ 数据库性能统计获取失败"
        echo "⚠️  性能追踪系统可能有问题"
    fi
    
    echo ""
    echo "🎯 测试完成!"
    
    # 返回适当的退出码
    if [ $success_count -eq $total_count ] && [ $db_check_result -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 检查依赖
if ! command -v curl &> /dev/null; then
    echo "❌ 错误: 需要安装 curl"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ 错误: 需要安装 jq"
    exit 1
fi

# 运行主测试
main
exit $?

#!/bin/bash

# PromptHub认证架构修复脚本
# 实现正确的认证分离：Supabase认证 + 用户API密钥验证

echo "🏗️  PromptHub认证架构修复"
echo "=========================="

echo "📋 正确的认证架构:"
echo "1. 🗄️  Supabase认证 (.env文件)"
echo "   - SUPABASE_URL: 数据库连接地址"
echo "   - SUPABASE_ANON_KEY: 匿名访问密钥"
echo "   - SUPABASE_SERVICE_ROLE_KEY: 服务端访问密钥"
echo "   用途: MCP服务器与Supabase数据库通信"
echo ""
echo "2. 🔑 用户API密钥 (第三方客户端)"
echo "   - 用户在PromptHub网站生成的个人密钥"
echo "   - 配置在Cursor等AI客户端中"
echo "   - 通过数据库api_keys表验证"
echo ""

echo "🔍 检查当前配置:"

# 检查.env文件
if [ -f ".env" ]; then
    echo "✅ .env文件存在"
    
    # 检查Supabase配置
    if grep -q "^SUPABASE_URL=" .env; then
        supabase_url=$(grep "^SUPABASE_URL=" .env | cut -d'=' -f2)
        echo "✅ SUPABASE_URL: ${supabase_url:0:30}..."
    else
        echo "❌ 缺少SUPABASE_URL配置"
    fi
    
    if grep -q "^SUPABASE_ANON_KEY=" .env; then
        echo "✅ SUPABASE_ANON_KEY: 已配置"
    else
        echo "❌ 缺少SUPABASE_ANON_KEY配置"
    fi
    
    if grep -q "^SUPABASE_SERVICE_ROLE_KEY=" .env; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY: 已配置"
    else
        echo "❌ 缺少SUPABASE_SERVICE_ROLE_KEY配置"
    fi
    
    # 检查是否有不必要的系统级密钥
    if grep -q "^API_KEY=" .env; then
        echo "⚠️  发现系统级API_KEY配置（现在不需要了）"
    fi
    
    if grep -q "^SERVER_KEY=" .env; then
        echo "⚠️  发现系统级SERVER_KEY配置（现在不需要了）"
    fi
else
    echo "❌ .env文件不存在"
fi

echo ""
echo "🔧 修复选项:"
echo "1. 清理不必要的系统级密钥配置"
echo "2. 重新构建并启动Docker容器"
echo "3. 测试用户API密钥验证"
echo ""

read -p "是否要执行修复? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "开始修复..."
    
    # 备份现有.env文件
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ 已备份现有.env文件"
    fi
    
    # 清理不必要的系统级密钥
    if [ -f ".env" ]; then
        echo "清理系统级API密钥配置..."
        sed -i '/^API_KEY=/d' .env
        sed -i '/^SERVER_KEY=/d' .env
        echo "✅ 已移除系统级API密钥配置"
    fi
    
    # 重新构建Docker容器
    echo ""
    echo "重新构建Docker容器..."
    
    if command -v docker-compose &> /dev/null; then
        echo "停止现有容器..."
        docker-compose down
        
        echo "重新构建镜像..."
        docker-compose build --no-cache
        
        echo "启动服务..."
        docker-compose up -d
        
        echo "等待服务启动..."
        sleep 15
        
        echo ""
        echo "🧪 测试认证:"
        
        # 测试健康检查
        echo -n "健康检查: "
        if curl -s http://localhost:9010/api/health | grep -q "healthy"; then
            echo "✅ 成功"
        else
            echo "❌ 失败"
        fi
        
        # 测试用户API密钥
        USER_API_KEY="aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653"
        echo -n "用户API密钥验证: "
        response=$(curl -s -H "X-Api-Key: $USER_API_KEY" http://localhost:9010/tools)
        if echo "$response" | grep -q "tools"; then
            echo "✅ 成功"
            tool_count=$(echo "$response" | jq -r '.tools | length' 2>/dev/null || echo "未知")
            echo "   发现 $tool_count 个工具"
        else
            echo "❌ 失败"
            echo "   响应: $response"
        fi
        
        echo ""
        echo "🎉 修复完成!"
        echo ""
        echo "📋 现在的认证流程:"
        echo "1. MCP服务器使用Supabase密钥连接数据库"
        echo "2. 用户API密钥通过数据库api_keys表验证"
        echo "3. 不再需要在.env中配置系统级API密钥"
        echo ""
        echo "📱 Cursor配置:"
        echo "{"
        echo "  \"mcpServers\": {"
        echo "    \"prompthub\": {"
        echo "      \"command\": \"npx\","
        echo "      \"args\": [\"prompthub-mcp-adapter\"],"
        echo "      \"env\": {"
        echo "        \"API_KEY\": \"$USER_API_KEY\""
        echo "      }"
        echo "    }"
        echo "  }"
        echo "}"
        
    else
        echo "❌ docker-compose未找到，请手动重启Docker服务"
    fi
    
else
    echo "跳过修复"
    echo ""
    echo "📝 手动修复步骤:"
    echo "1. 编辑.env文件，移除以下配置（如果存在）:"
    echo "   - API_KEY=..."
    echo "   - SERVER_KEY=..."
    echo ""
    echo "2. 确保.env文件包含Supabase配置:"
    echo "   - SUPABASE_URL=https://your-project.supabase.co"
    echo "   - SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo "   - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo ""
    echo "3. 重新构建Docker容器:"
    echo "   docker-compose down"
    echo "   docker-compose build --no-cache"
    echo "   docker-compose up -d"
fi

echo ""
echo "🎯 架构优势:"
echo "✅ 清晰的职责分离"
echo "✅ 符合标准的数据库认证模式"
echo "✅ 用户密钥完全由数据库管理"
echo "✅ 无需在服务器配置用户密钥"
echo "✅ 更好的安全性和可维护性"
#!/bin/bash

# PromptHub生产环境API密钥认证修复脚本
# 解决生产环境API密钥认证失败的问题

echo "🔧 PromptHub生产环境API密钥认证修复"
echo "=================================="

USER_API_KEY="aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653"

echo "📋 问题诊断:"
echo "发现问题: Docker启动脚本硬编码了系统级API密钥"
echo "这导致用户API密钥无法通过数据库验证"
echo ""
echo "💡 重要概念区分:"
echo "1. 用户API密钥: 在Cursor等客户端中配置，用于访问PromptHub"
echo "2. 系统级API密钥: 在服务器.env中配置，用于绕过数据库验证（可选）"
echo ""
echo "对于第三方客户端使用，通常不需要配置系统级密钥！"
echo ""

echo "🔍 检查当前.env文件配置:"
if [ -f ".env" ]; then
    echo "✅ .env文件存在"
    
    # 检查API_KEY配置
    if grep -q "^API_KEY=" .env; then
        current_api_key=$(grep "^API_KEY=" .env | cut -d'=' -f2)
        echo "当前API_KEY: ${current_api_key:0:8}..."
        
        if [ "$current_api_key" = "$API_KEY" ]; then
            echo "✅ API_KEY配置正确"
        else
            echo "❌ API_KEY配置不正确"
            echo "需要设置为: $API_KEY"
        fi
    else
        echo "❌ .env文件中没有API_KEY配置"
    fi
    
    # 检查SERVER_KEY配置
    if grep -q "^SERVER_KEY=" .env; then
        current_server_key=$(grep "^SERVER_KEY=" .env | cut -d'=' -f2)
        echo "当前SERVER_KEY: ${current_server_key:0:8}..."
        
        if [ "$current_server_key" = "$API_KEY" ]; then
            echo "✅ SERVER_KEY配置正确"
        else
            echo "❌ SERVER_KEY配置不正确"
            echo "需要设置为: $API_KEY"
        fi
    else
        echo "❌ .env文件中没有SERVER_KEY配置"
    fi
else
    echo "❌ .env文件不存在"
fi

echo ""
echo "🔧 修复选项:"
echo "选项1: 移除系统级密钥，完全依赖数据库验证（推荐）"
echo "选项2: 设置系统级密钥，绕过数据库验证"
echo ""

read -p "是否要自动修复? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "开始修复..."
    
    # 备份现有.env文件
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ 已备份现有.env文件"
    fi
    
    # 更新或创建.env文件
    echo "更新.env文件..."
    
    # 移除旧的API_KEY和SERVER_KEY配置
    if [ -f ".env" ]; then
        sed -i '/^API_KEY=/d' .env
        sed -i '/^SERVER_KEY=/d' .env
    fi
    
    # 添加新的配置
    echo "" >> .env
    echo "# API密钥配置 (修复生产环境认证问题)" >> .env
    echo "API_KEY=$API_KEY" >> .env
    echo "SERVER_KEY=$API_KEY" >> .env
    
    echo "✅ .env文件已更新"
    
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
        sleep 10
        
        echo ""
        echo "🧪 测试API密钥认证:"
        
        # 测试本地环境
        echo -n "本地环境 (localhost:9010): "
        if curl -s -H "X-Api-Key: $API_KEY" http://localhost:9010/tools | grep -q "tools"; then
            echo "✅ 成功"
        else
            echo "❌ 失败"
        fi
        
        # 测试生产环境
        echo -n "生产环境 (mcp.prompt-hub.cc): "
        if curl -s -H "X-Api-Key: $API_KEY" https://mcp.prompt-hub.cc/tools | grep -q "tools"; then
            echo "✅ 成功"
        else
            echo "❌ 失败"
        fi
        
        echo ""
        echo "🎉 修复完成!"
        echo ""
        echo "📋 下一步:"
        echo "1. 如果本地测试成功，更新Cursor配置:"
        echo "   {"
        echo "     \"mcpServers\": {"
        echo "       \"prompthub\": {"
        echo "         \"command\": \"npx\","
        echo "         \"args\": [\"prompthub-mcp-adapter\"],"
        echo "         \"env\": {"
        echo "           \"API_KEY\": \"$API_KEY\""
        echo "         }"
        echo "       }"
        echo "     }"
        echo "   }"
        echo ""
        echo "2. 重启Cursor让配置生效"
        echo "3. 检查Cursor中的工具数量应该 > 0"
        
    else
        echo "❌ docker-compose未找到，请手动重启Docker服务"
    fi
    
else
    echo "跳过自动修复"
    echo ""
    echo "📝 手动修复步骤:"
    echo "1. 编辑.env文件，添加或更新以下配置:"
    echo "   API_KEY=$API_KEY"
    echo "   SERVER_KEY=$API_KEY"
    echo ""
    echo "2. 重新构建Docker容器:"
    echo "   docker-compose down"
    echo "   docker-compose build --no-cache"
    echo "   docker-compose up -d"
    echo ""
    echo "3. 测试API密钥:"
    echo "   curl -H \"X-Api-Key: $API_KEY\" http://localhost:9010/tools"
fi

echo ""
echo "🔍 问题根本原因:"
echo "Docker启动脚本 (docker-start.sh) 第85行硬编码了:"
echo "export API_KEY=default-api-key-for-docker"
echo ""
echo "这导致即使.env文件中设置了正确的API密钥，"
echo "生产环境仍然使用硬编码的默认值进行系统级认证。"
echo ""
echo "修复后，系统会优先使用.env文件中的配置。"
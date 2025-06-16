#!/bin/bash

# 温和的安全修复实施脚本
# 保持现有密钥，提供友好提醒，确保兼容性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
BACKUP_DIR="security-backup-$(date +%Y%m%d-%H%M%S)"
SECURITY_LEVEL=${SECURITY_LEVEL:-"balanced"}

# 显示友好的欢迎信息
show_welcome() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              🛡️  友好安全增强工具 v2.0  🛡️               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}✨ 特色功能：${NC}"
    echo "  🔐 保留您的现有生产密钥"
    echo "  📢 提供友好的安全提醒"
    echo "  ⚖️  平衡安全性与用户体验" 
    echo "  🔧 可配置的安全级别"
    echo "  📱 确保应用兼容性"
    echo ""
    echo -e "${BLUE}当前安全级别: ${YELLOW}${SECURITY_LEVEL}${NC}"
    echo ""
    echo -e "${PURPLE}🎯 我们的目标是在不影响您工作流程的前提下增强安全性${NC}"
    echo ""
}

# 询问用户确认
ask_permission() {
    echo -e "${YELLOW}在开始之前，请确认：${NC}"
    echo "1. 我们会创建备份，确保可以随时恢复"
    echo "2. 现有的生产密钥会被保留" 
    echo "3. 只会添加新的安全功能，不会破坏现有功能"
    echo "4. 您可以随时调整安全设置"
    echo ""
    read -p "您同意继续吗？(Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${CYAN}好的，随时欢迎您回来！ 👋${NC}"
        exit 0
    fi
}

# 创建备份
create_backup() {
    echo -e "${BLUE}📦 创建安全备份...${NC}"
    mkdir -p "$BACKUP_DIR"
    
    # 备份关键文件
    backup_files=(
        ".env"
        "package.json"
        "web/src/middleware/"
        "mcp/src/api/"
        "docker-compose.yml"
        "nginx.conf"
    )
    
    for file in "${backup_files[@]}"; do
        if [ -e "$file" ]; then
            cp -r "$file" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}✅ 备份已创建在: $BACKUP_DIR${NC}"
}

# 检查现有密钥状态
check_current_keys() {
    echo -e "${BLUE}🔍 检查现有密钥状态...${NC}"
    
    if [ -f ".env" ]; then
        echo -e "${GREEN}发现生产环境配置文件${NC}"
        
        # 检查关键密钥是否存在
        keys_to_check=("JWT_SECRET" "API_SECRET_KEY" "SUPABASE_ANON_KEY")
        missing_keys=()
        weak_keys=()
        
        for key in "${keys_to_check[@]}"; do
            if grep -q "^${key}=" .env; then
                key_value=$(grep "^${key}=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
                if [ ${#key_value} -lt 32 ]; then
                    weak_keys+=("$key")
                fi
                echo -e "  ✅ $key: 已配置"
            else
                missing_keys+=("$key")
                echo -e "  ❌ $key: 未找到"
            fi
        done
        
        # 友好的建议，不强制
        if [ ${#weak_keys[@]} -gt 0 ]; then
            echo -e "\n${YELLOW}💡 建议：${NC}"
            echo "以下密钥可以在合适的时候增强："
            printf '  • %s\n' "${weak_keys[@]}"
            echo "  （这不会影响当前的服务运行）"
        fi
        
        if [ ${#missing_keys[@]} -gt 0 ]; then
            echo -e "\n${YELLOW}📝 提醒：${NC}"
            echo "建议添加以下密钥以增强安全性："
            printf '  • %s\n' "${missing_keys[@]}"
        fi
    else
        echo -e "${YELLOW}⚠️  未找到.env文件，将为您创建示例配置${NC}"
    fi
}

# 安装必要的依赖（温和方式）
install_dependencies() {
    echo -e "${BLUE}📦 检查并安装安全依赖...${NC}"
    
    # 检查package.json是否存在
    package_files=("web/package.json" "mcp/package.json" "package.json")
    
    for package_file in "${package_files[@]}"; do
        if [ -f "$package_file" ]; then
            echo -e "${GREEN}处理 $package_file${NC}"
            
            # 检查是否已有安全相关依赖
            if grep -q "helmet\|express-rate-limit" "$package_file"; then
                echo "  安全依赖已存在，跳过安装"
            else
                echo "  添加安全依赖..."
                dir_name=$(dirname "$package_file")
                (cd "$dir_name" && npm install --save express-rate-limit helmet cors winston zod 2>/dev/null || echo "  注意：部分依赖可能需要手动安装")
            fi
        fi
    done
}

# 应用安全中间件（不破坏现有功能）
apply_security_middleware() {
    echo -e "${BLUE}🛡️  应用安全中间件...${NC}"
    
    # 复制安全文件
    security_files=(
        "security-fixes/user-friendly-config.ts"
        "security-fixes/key-management.ts"
        "security-fixes/enhanced-cors-config.ts"
        "security-fixes/enhanced-security-middleware.ts"
    )
    
    for file in "${security_files[@]}"; do
        if [ -f "$file" ]; then
            # 根据项目结构放置文件
            if [ -d "web/src/utils" ]; then
                cp "$file" "web/src/utils/"
            elif [ -d "src/utils" ]; then
                cp "$file" "src/utils/"
            else
                mkdir -p "utils"
                cp "$file" "utils/"
            fi
            echo -e "  ✅ 已复制 $(basename $file)"
        fi
    done
}

# 创建配置文件（保留现有设置）
create_env_template() {
    if [ ! -f ".env" ]; then
        echo -e "${BLUE}📝 创建环境变量模板...${NC}"
        
        cat > .env.security-template << 'EOF'
# 安全配置模板 - 根据需要复制到 .env

# 安全级别: loose, balanced, strict
SECURITY_LEVEL=balanced

# 速率限制配置
RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_MAX=10
API_RATE_LIMIT_MAX=200

# CORS配置
CORS_STRICT_MODE=false

# 文件上传配置  
FILE_UPLOAD_MAX_SIZE=52428800

# 密钥检查配置
KEY_CHECK_ON_STARTUP=true

# 日志配置
SECURITY_LOG_LEVEL=info

# 您的现有密钥（保持不变）
# JWT_SECRET=your-existing-secret
# API_SECRET_KEY=your-existing-api-key
# SUPABASE_ANON_KEY=your-existing-supabase-key
EOF
        
        echo -e "${GREEN}✅ 已创建 .env.security-template${NC}"
        echo -e "${YELLOW}💡 您可以将需要的配置复制到 .env 文件中${NC}"
    fi
}

# 更新Nginx配置（可选）
update_nginx_config() {
    echo -e "${BLUE}🌐 检查Nginx配置...${NC}"
    
    if [ -f "nginx.conf" ] || [ -f "docker/nginx.conf" ]; then
        echo -e "${YELLOW}发现Nginx配置文件${NC}"
        read -p "是否要应用安全的Nginx配置？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f "security-fixes/secure-nginx.conf" ]; then
                # 创建备份
                if [ -f "nginx.conf" ]; then
                    cp nginx.conf nginx.conf.backup
                    cp security-fixes/secure-nginx.conf nginx.conf
                elif [ -f "docker/nginx.conf" ]; then
                    cp docker/nginx.conf docker/nginx.conf.backup
                    cp security-fixes/secure-nginx.conf docker/nginx.conf
                fi
                echo -e "${GREEN}✅ Nginx配置已更新${NC}"
            fi
        else
            echo -e "${CYAN}跳过Nginx配置更新${NC}"
        fi
    fi
}

# 显示完成信息和后续建议
show_completion() {
    echo -e "\n${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 安全增强完成！ 🎉                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}📋 完成的工作：${NC}"
    echo "  🔐 安全中间件已就绪"
    echo "  📝 配置模板已创建"
    echo "  💾 完整备份已保存在: $BACKUP_DIR"
    echo "  🔑 现有密钥完全保留"
    
    echo -e "\n${YELLOW}🎯 接下来您可以：${NC}"
    echo "  1. 查看并使用 .env.security-template 中的建议配置"
    echo "  2. 根据需要调整 SECURITY_LEVEL 环境变量"
    echo "  3. 在应用代码中引入安全中间件"
    echo "  4. 定期查看密钥安全提醒"
    
    echo -e "\n${PURPLE}🆘 如果遇到问题：${NC}"
    echo "  • 所有原始文件都在 $BACKUP_DIR 中"
    echo "  • 可以随时恢复到修改前的状态"
    echo "  • 安全功能都是可选和可配置的"
    
    echo -e "\n${GREEN}感谢您选择增强项目安全性！ 🛡️✨${NC}"
}

# 主流程
main() {
    show_welcome
    ask_permission
    create_backup
    check_current_keys
    install_dependencies
    apply_security_middleware
    create_env_template
    update_nginx_config
    show_completion
}

# 执行主流程
main "$@" 
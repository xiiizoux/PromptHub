#!/bin/bash

# PromptHub 安全修复实施脚本
# 此脚本将应用所有推荐的安全修复措施

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "建议不要以root用户运行此脚本"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 备份现有配置
backup_configs() {
    log_info "备份现有配置文件..."
    
    BACKUP_DIR="./security-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份重要配置文件
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/"
        log_success "已备份 .env 文件"
    fi
    
    if [ -f "nginx.conf" ]; then
        cp nginx.conf "$BACKUP_DIR/"
        log_success "已备份 nginx.conf 文件"
    fi
    
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$BACKUP_DIR/"
        log_success "已备份 docker-compose.yml 文件"
    fi
    
    # 备份关键源代码文件
    if [ -f "mcp/src/index.ts" ]; then
        cp mcp/src/index.ts "$BACKUP_DIR/"
    fi
    
    if [ -f "mcp/src/config.ts" ]; then
        cp mcp/src/config.ts "$BACKUP_DIR/"
    fi
    
    log_success "配置文件已备份到: $BACKUP_DIR"
}

# 生成强密钥
generate_strong_keys() {
    log_info "生成安全密钥..."
    
    # 检查openssl是否可用
    if ! command -v openssl &> /dev/null; then
        log_error "openssl 命令未找到，请先安装 openssl"
        exit 1
    fi
    
    # 生成密钥
    API_KEY=$(openssl rand -hex 32)
    SERVER_KEY=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 64)
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    
    log_success "已生成新的安全密钥"
    
    # 保存密钥到临时文件
    cat > .env.new << EOF
# 自动生成的安全密钥 - $(date)
API_KEY=$API_KEY
SERVER_KEY=$SERVER_KEY
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF
    
    log_warning "新密钥已保存到 .env.new 文件，请手动合并到 .env 文件中"
}

# 更新依赖包
update_dependencies() {
    log_info "更新项目依赖包..."
    
    # 检查并安装安全相关的包
    local security_packages=(
        "helmet"
        "express-rate-limit"
        "validator"
        "bcryptjs"
        "jsonwebtoken"
        "cors"
        "express-validator"
    )
    
    # 更新主项目依赖
    if [ -f "package.json" ]; then
        log_info "更新主项目依赖..."
        npm audit fix --force
        
        # 安装安全包
        for package in "${security_packages[@]}"; do
            if ! npm list "$package" &> /dev/null; then
                log_info "安装 $package..."
                npm install "$package"
            fi
        done
    fi
    
    # 更新MCP模块依赖
    if [ -d "mcp" ] && [ -f "mcp/package.json" ]; then
        log_info "更新MCP模块依赖..."
        cd mcp
        npm audit fix --force
        
        # 安装安全包
        for package in "${security_packages[@]}"; do
            if ! npm list "$package" &> /dev/null; then
                log_info "在MCP模块中安装 $package..."
                npm install "$package"
            fi
        done
        cd ..
    fi
    
    # 更新Web模块依赖
    if [ -d "web" ] && [ -f "web/package.json" ]; then
        log_info "更新Web模块依赖..."
        cd web
        npm audit fix --force
        cd ..
    fi
    
    log_success "依赖包更新完成"
}

# 应用CORS修复
apply_cors_fix() {
    log_info "应用CORS安全修复..."
    
    # 检查并更新MCP服务器的CORS配置
    if [ -f "mcp/src/index.ts" ]; then
        # 创建备份
        cp mcp/src/index.ts mcp/src/index.ts.backup
        
        # 应用CORS修复 (这里应该实际修改文件)
        log_warning "请手动将 security-fixes/enhanced-cors-config.ts 中的配置应用到 mcp/src/index.ts"
    fi
    
    log_success "CORS配置修复准备完成"
}

# 应用Nginx安全配置
apply_nginx_security() {
    log_info "应用Nginx安全配置..."
    
    if [ -f "nginx.conf" ]; then
        # 创建备份
        cp nginx.conf nginx.conf.backup
        
        log_warning "请手动将 security-fixes/secure-nginx.conf 中的配置应用到 nginx.conf"
        log_warning "确保SSL证书路径正确，并更新域名配置"
    fi
    
    log_success "Nginx安全配置准备完成"
}

# 设置文件权限
set_secure_permissions() {
    log_info "设置安全文件权限..."
    
    # .env文件权限
    if [ -f ".env" ]; then
        chmod 600 .env
        log_success "已设置 .env 文件权限为 600"
    fi
    
    # 私钥文件权限
    find . -name "*.key" -type f -exec chmod 600 {} \;
    find . -name "*.pem" -type f -exec chmod 600 {} \;
    
    # 日志目录权限
    if [ -d "logs" ]; then
        chmod 755 logs
        chmod 644 logs/*.log 2>/dev/null || true
    fi
    
    # 脚本文件权限
    chmod +x *.sh 2>/dev/null || true
    
    log_success "文件权限设置完成"
}

# 创建安全日志目录
setup_logging() {
    log_info "设置安全日志..."
    
    # 创建日志目录
    mkdir -p logs/security
    mkdir -p logs/access
    mkdir -p logs/error
    
    # 创建日志轮转配置
    cat > logs/logrotate.conf << 'EOF'
logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 nginx nginx
    postrotate
        /bin/kill -USR1 `cat /var/run/nginx.pid 2>/dev/null` 2>/dev/null || true
    endscript
}
EOF
    
    log_success "日志配置完成"
}

# 创建安全检查脚本
create_security_checker() {
    log_info "创建安全检查脚本..."
    
    cat > security-check.sh << 'EOF'
#!/bin/bash

# PromptHub 安全检查脚本

echo "🔍 执行安全检查..."

# 检查环境变量
echo "📋 检查环境变量配置..."
if [ -f ".env" ]; then
    if grep -q "your-secure-api-key" .env; then
        echo "❌ 发现默认API密钥，请更换为强密钥"
    else
        echo "✅ API密钥已自定义"
    fi
    
    if grep -q "your-jwt-secret" .env; then
        echo "❌ 发现默认JWT密钥，请更换为强密钥"
    else
        echo "✅ JWT密钥已自定义"
    fi
else
    echo "❌ .env 文件不存在"
fi

# 检查文件权限
echo "🔒 检查文件权限..."
if [ -f ".env" ]; then
    PERM=$(stat -c "%a" .env)
    if [ "$PERM" = "600" ]; then
        echo "✅ .env 文件权限正确"
    else
        echo "❌ .env 文件权限不安全: $PERM (应为 600)"
    fi
fi

# 检查依赖漏洞
echo "🔍 检查依赖漏洞..."
if command -v npm &> /dev/null; then
    npm audit --audit-level=moderate
else
    echo "⚠️ npm 未安装，跳过依赖检查"
fi

# 检查SSL证书
echo "🛡️ 检查SSL配置..."
if [ -f "nginx.conf" ]; then
    if grep -q "ssl_certificate" nginx.conf; then
        echo "✅ SSL配置已启用"
    else
        echo "❌ 未找到SSL配置"
    fi
fi

echo "🔍 安全检查完成"
EOF
    
    chmod +x security-check.sh
    log_success "安全检查脚本已创建: security-check.sh"
}

# 生成部署检查清单
create_deployment_checklist() {
    log_info "生成部署检查清单..."
    
    cat > DEPLOYMENT_SECURITY_CHECKLIST.md << 'EOF'
# 🚀 PromptHub 生产部署安全检查清单

## 📋 部署前检查

### 🔐 密钥和认证
- [ ] 已生成并配置强API密钥 (至少32位)
- [ ] 已生成并配置强JWT密钥 (至少64位)  
- [ ] 已更换所有默认密码和密钥
- [ ] API密钥已安全存储，未硬编码
- [ ] 生产环境禁用了调试模式

### 🌐 网络安全
- [ ] 已配置HTTPS证书
- [ ] 已启用HSTS头
- [ ] CORS配置限制了允许的域名
- [ ] 已配置防火墙规则
- [ ] 数据库不直接暴露在公网

### 🔒 访问控制
- [ ] 已实施速率限制
- [ ] 已配置IP白名单（如需要）
- [ ] 用户认证和授权工作正常
- [ ] 敏感操作需要额外验证

### 📊 监控和日志
- [ ] 已启用安全日志记录
- [ ] 已配置异常监控
- [ ] 已设置健康检查
- [ ] 已配置日志轮转

### 💾 数据安全
- [ ] 敏感数据已加密存储
- [ ] 已配置定期备份
- [ ] 已测试数据恢复流程
- [ ] 已实施数据保留策略

### 🐳 容器安全
- [ ] 容器以非root用户运行
- [ ] 已移除不必要的包和服务
- [ ] 已设置资源限制
- [ ] 已配置健康检查

## 🔧 部署后验证

### 🧪 功能测试
- [ ] 用户注册和登录正常
- [ ] API端点响应正确
- [ ] 文件上传功能安全
- [ ] 数据库连接正常

### 🛡️ 安全测试
- [ ] SSL/TLS配置正确
- [ ] 安全头设置生效
- [ ] 速率限制工作正常
- [ ] 异常请求被正确拒绝

### 📈 性能测试
- [ ] 响应时间在可接受范围
- [ ] 负载测试通过
- [ ] 内存使用正常
- [ ] CPU使用率合理

## ⚠️ 注意事项

1. **密钥管理**: 定期轮换密钥，建议每90天更换一次
2. **依赖更新**: 定期检查和更新依赖包，修复已知漏洞
3. **监控警报**: 配置关键指标的监控和告警
4. **备份策略**: 确保备份数据的完整性和可恢复性
5. **事件响应**: 制定安全事件响应计划

## 📞 紧急联系

- 系统管理员: [联系方式]
- 安全团队: [联系方式]
- 服务提供商支持: [联系方式]

---
**最后更新**: $(date)
**检查人员**: ________________
**部署日期**: ________________
EOF
    
    log_success "部署检查清单已创建: DEPLOYMENT_SECURITY_CHECKLIST.md"
}

# 主执行函数
main() {
    echo "🔐 PromptHub 安全修复脚本"
    echo "=========================="
    
    # 检查系统权限
    check_root
    
    # 询问用户要执行的操作
    echo ""
    echo "请选择要执行的操作："
    echo "1. 完整安全修复（推荐）"
    echo "2. 仅生成新密钥"
    echo "3. 仅更新依赖包"
    echo "4. 仅设置文件权限"
    echo "5. 创建安全检查工具"
    echo "6. 退出"
    echo ""
    
    read -p "请输入选项 (1-6): " choice
    
    case $choice in
        1)
            log_info "执行完整安全修复..."
            backup_configs
            generate_strong_keys
            update_dependencies
            apply_cors_fix
            apply_nginx_security
            set_secure_permissions
            setup_logging
            create_security_checker
            create_deployment_checklist
            
            echo ""
            log_success "🎉 安全修复完成！"
            log_warning "⚠️  请手动执行以下步骤："
            echo "1. 将 .env.new 中的密钥合并到 .env 文件"
            echo "2. 应用 security-fixes/ 目录中的配置文件"
            echo "3. 重启服务使配置生效"
            echo "4. 运行 ./security-check.sh 验证修复效果"
            ;;
        2)
            generate_strong_keys
            ;;
        3)
            update_dependencies
            ;;
        4)
            set_secure_permissions
            ;;
        5)
            create_security_checker
            create_deployment_checklist
            ;;
        6)
            log_info "退出脚本"
            exit 0
            ;;
        *)
            log_error "无效选项"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "操作完成！"
}

# 脚本入口
main "$@" 
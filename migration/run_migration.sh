#!/bin/bash

# =============================================
# PromptHub Messages to Content 迁移执行脚本
# =============================================

set -e  # 遇到错误立即退出

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

# 检查环境变量
check_env() {
    log_info "检查环境变量..."
    
    if [ -z "$SUPABASE_URL" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        log_error "未设置 SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_KEY" ]; then
        log_error "未设置 SUPABASE_SERVICE_KEY"
        exit 1
    fi
    
    log_success "环境变量检查通过"
}

# 执行SQL文件
execute_sql() {
    local file=$1
    local description=$2

    log_info "执行: $description"
    log_info "文件: $file"

    if [ ! -f "$file" ]; then
        log_error "文件不存在: $file"
        exit 1
    fi

    # 提供多种数据库连接方式
    if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
        log_info "使用 psql 连接数据库"
        psql "$DATABASE_URL" -f "$file"
    elif [ -n "$SUPABASE_URL" ] && command -v supabase &> /dev/null; then
        log_info "使用 Supabase CLI"
        supabase db reset --db-url "$DATABASE_URL"
    else
        log_warning "未找到合适的数据库连接工具"
        log_warning "请手动执行 SQL 文件: $file"
        log_info "您可以："
        log_info "1. 复制文件内容到 Supabase Dashboard SQL Editor"
        log_info "2. 使用 psql 命令: psql \$DATABASE_URL -f $file"
        log_info "3. 使用其他数据库客户端工具"
        read -p "完成后按回车键继续..."
    fi

    log_success "$description 完成"
}

# 主执行流程
main() {
    log_info "开始 PromptHub Messages to Content 迁移"
    log_info "当前时间: $(date)"
    
    # 检查环境
    check_env
    
    # 确认执行
    log_warning "此操作将修改数据库结构和数据"
    log_warning "请确保已经停止应用服务"
    read -p "确认继续？(y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    # 创建迁移日志目录
    mkdir -p logs
    LOG_FILE="logs/migration_$(date +%Y%m%d_%H%M%S).log"
    
    log_info "迁移日志将保存到: $LOG_FILE"
    
    # 执行迁移步骤
    {
        echo "=== PromptHub Migration Log ==="
        echo "开始时间: $(date)"
        echo "================================"
        
        log_info "步骤 1/6: 数据备份"
        execute_sql "01_backup_data.sql" "数据备份"
        
        log_info "步骤 2/6: 添加content字段"
        execute_sql "02_add_content_field.sql" "添加content字段"
        
        log_info "步骤 3/6: 数据迁移"
        execute_sql "03_migrate_data.sql" "数据迁移"
        
        log_info "步骤 4/6: 验证迁移结果"
        execute_sql "04_verify_migration.sql" "验证迁移结果"
        
        echo "================================"
        echo "完成时间: $(date)"
        echo "=== Migration Completed ==="
        
    } 2>&1 | tee "$LOG_FILE"
    
    log_success "数据库迁移完成！"
    log_info "接下来请按照 05_code_update_guide.md 更新代码"
    log_info "如遇问题，可使用 06_rollback_plan.sql 回滚"
    
    # 显示迁移摘要
    log_info "迁移摘要:"
    echo "- 备份表: prompts_backup_$(date +%Y%m%d)"
    echo "- 新字段: content (TEXT)"
    echo "- 新索引: idx_prompts_content_fulltext, idx_prompts_content_trgm"
    echo "- 日志文件: $LOG_FILE"
}

# 执行主函数
main "$@"

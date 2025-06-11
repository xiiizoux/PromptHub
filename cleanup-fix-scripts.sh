#!/bin/sh
# 清理所有Docker修复脚本

echo "正在清理Docker修复脚本..."

# 运行ultimate-docker-fix.js的cleanup功能
node ultimate-docker-fix.js cleanup

echo "清理完成！"

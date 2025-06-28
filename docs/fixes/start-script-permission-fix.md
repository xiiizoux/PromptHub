# 启动脚本权限问题修复

## 问题描述

启动脚本 `start.sh` 在运行时出现权限错误：

```bash
start.sh: line 123: ../logs/mcp.pid: Permission denied
start.sh: line 139: ../logs/web.pid: Permission denied
```

## 问题原因

1. **路径问题**：脚本在子目录中运行时，使用相对路径 `../logs/` 指向了错误的位置
2. **权限问题**：PID文件的所有者是 `root`，而当前用户是 `zou`，导致无法写入

## 解决方案

### 1. 修复路径问题

将脚本中的相对路径改为绝对路径：

**修改前：**
```bash
NODE_ENV=production node dist/src/index.js > ../logs/mcp.log 2>&1 &
echo "MCP_PID=$MCP_PID" > ../logs/mcp.pid

NODE_ENV=production FRONTEND_PORT=9011 npm run start > ../logs/web.log 2>&1 &
echo "WEB_PID=$WEB_PID" > ../logs/web.pid
```

**修改后：**
```bash
NODE_ENV=production node dist/src/index.js > "$PROJECT_DIR/logs/mcp.log" 2>&1 &
echo "MCP_PID=$MCP_PID" > "$PROJECT_DIR/logs/mcp.pid"

NODE_ENV=production FRONTEND_PORT=9011 npm run start > "$PROJECT_DIR/logs/web.log" 2>&1 &
echo "WEB_PID=$WEB_PID" > "$PROJECT_DIR/logs/web.pid"
```

### 2. 修复权限问题

修改PID文件的所有者：

```bash
sudo chown zou:zou logs/*.pid
```

## 修复结果

- ✅ 启动脚本运行正常，无权限错误
- ✅ PID文件正确创建和更新
- ✅ MCP服务正常运行 (端口: 9010)
- ✅ Web服务正常运行 (端口: 9011)
- ✅ 服务状态验证通过

## 验证命令

```bash
# 启动服务
./start.sh

# 检查PID文件
ls -la logs/*.pid

# 检查服务状态
curl -s http://localhost:9010 || echo "MCP服务检查"
curl -s http://localhost:9011 | head -n 5

# 停止服务
./stop.sh
```

## 相关文件

- `start.sh` - 启动脚本
- `stop.sh` - 停止脚本
- `logs/mcp.pid` - MCP服务PID文件
- `logs/web.pid` - Web服务PID文件

## 注意事项

1. 确保 `logs` 目录存在且有写入权限
2. 如果使用Docker或其他容器化部署，需要注意用户权限映射
3. 在生产环境中，建议使用进程管理工具如 `pm2` 或 `systemd`

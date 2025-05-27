# 🎉 新机器部署问题解决方案

## 问题总结

在新机器上执行 `./start.sh` 时遇到 `tsc: not found` 错误，这是因为：

1. **依赖缺失**: TypeScript编译器未安装
2. **模块引用问题**: MCP项目引用了supabase共享模块，但supabase目录缺少依赖
3. **缺少winston**: mcp/package.json中缺少winston依赖

## 解决方案 ✅

### 1. 自动依赖检查和安装

修改了 `start.sh` 脚本，增加了自动依赖检查功能：

```bash
# 检查MCP依赖
if [ ! -d "mcp/node_modules" ]; then
  echo "安装MCP服务依赖..."
  npm run mcp:install
fi

# 检查Web依赖
if [ ! -d "web/node_modules" ]; then
  echo "安装Web应用依赖..."
  npm run web:install
fi

# 检查Supabase共享模块依赖
if [ ! -d "supabase/node_modules" ]; then
  echo "安装Supabase共享模块依赖..."
  cd supabase && npm install
fi
```

### 2. 修复依赖配置

- **添加winston依赖**: 在 `mcp/package.json` 中添加了 `"winston": "^3.17.0"`
- **创建supabase package.json**: 为supabase目录创建了独立的package.json文件
- **更新安装脚本**: 添加了 `npm run supabase:install` 命令

### 3. 改进项目管理

更新了根目录 `package.json` 的安装脚本：

```json
{
  "scripts": {
    "mcp:install": "cd mcp && npm install",
    "web:install": "cd web && npm install", 
    "supabase:install": "cd supabase && npm install",
    "install:all": "npm run mcp:install && npm run web:install && npm run supabase:install"
  }
}
```

## 验证结果 ✅

### 自动化测试

使用测试脚本 `./test-new-machine.sh` 验证：

- ✅ **依赖自动安装**: 脚本自动检测并安装所有缺失依赖
- ✅ **构建成功**: TypeScript编译无错误
- ✅ **服务启动**: MCP服务(9010)和Web服务(9011)正常启动
- ✅ **API响应**: 所有API端点正常工作

### 手动验证命令

```bash
# 1. 检查服务状态
lsof -i :9010 -i :9011

# 2. 测试API
curl http://localhost:9010/api/health
curl http://localhost:9011

# 3. 检查依赖
ls mcp/node_modules web/node_modules supabase/node_modules
```

## 新机器部署流程 🚀

现在在新机器上部署只需要：

```bash
# 1. 克隆仓库
git clone <repository-url>
cd PromptHub

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 一键启动（自动处理所有依赖）
./start.sh
```

## 技术细节

### 项目结构更新

```
PromptHub/
├─ mcp/
│   ├─ package.json          # 包含winston依赖
│   └─ node_modules/         # 自动安装
├─ web/
│   ├─ package.json
│   └─ node_modules/         # 自动安装
├─ supabase/
│   ├─ package.json          # 新增: 共享模块依赖
│   └─ node_modules/         # 自动安装
└─ start.sh                  # 增强: 自动依赖检查
```

### 故障排除

如果仍然遇到问题：

```bash
# 手动安装所有依赖
npm run install:all

# 检查特定模块
cd mcp && npm install winston
cd supabase && npm install @supabase/supabase-js

# 清理并重新安装
rm -rf */node_modules
npm run install:all
```

## 文档更新

- ✅ 更新了 README.md 中的安装说明
- ✅ 添加了故障排除部分
- ✅ 更新了项目管理命令列表
- ✅ 创建了测试脚本用于验证

现在项目支持在任何新机器上无缝部署！🎉 
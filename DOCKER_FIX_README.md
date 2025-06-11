# Docker构建修复指南

此文档提供了修复PromptHub Docker构建问题的完整解决方案。

## 问题概述

Docker构建过程中遇到了以下问题：

1. TypeScript枚举在ES模块环境中的兼容性问题
2. 类成员声明和初始化的问题
3. 导入路径缺少.js扩展名
4. 类型注解在编译后的JavaScript中造成问题
5. 启动脚本不够健壮，缺乏错误处理

## 修复方案

我们提供了两个主要脚本来解决这些问题：

### 1. 全面修复脚本 (ultimate-docker-fix.js)

这个脚本提供了全面的修复方案，包括：

- 将TypeScript枚举转换为ES模块兼容的const对象
- 修复类成员声明和初始化问题
- 修复导入路径，确保包含.js扩展名
- 创建优化的TypeScript配置
- 创建编译后处理脚本，修复编译后的JS文件
- 创建Docker专用构建脚本
- 创建改进的Docker启动脚本
- 更新package.json配置

### 2. 清理脚本 (cleanup-fix-scripts.sh)

这个脚本用于删除所有旧的修复脚本，保持项目目录整洁。

## 使用方法

### 步骤1: 应用修复

运行全面修复脚本：

```bash
# 给脚本添加执行权限
chmod +x ultimate-docker-fix.js

# 运行修复脚本
node ultimate-docker-fix.js
```

### 步骤2: 构建Docker镜像

修复完成后，可以使用以下命令构建Docker镜像：

```bash
# 使用新添加的npm脚本
npm run build:docker

# 或者直接使用docker命令
docker build -t prompthub:latest .
```

### 步骤3: 运行Docker容器

构建成功后，运行容器：

```bash
# 使用新添加的npm脚本
npm run run:docker

# 或者直接使用docker命令
docker run -p 9010:9010 -p 9011:9011 prompthub:latest
```

### 步骤4: 清理旧修复脚本(可选)

如果想要删除所有旧的修复脚本，运行：

```bash
# 使用清理脚本
./cleanup-fix-scripts.sh

# 或者直接使用修复脚本的cleanup功能
node ultimate-docker-fix.js cleanup
```

## 修复内容详情

1. **TypeScript枚举修复**：将enum ErrorCode转换为const对象，并添加类型定义
2. **类成员初始化修复**：确保类成员在构造函数中正确初始化
3. **导入路径修复**：为相对导入添加.js扩展名，确保ES模块兼容性
4. **TSConfig优化**：创建专为Docker环境优化的TypeScript配置
5. **编译后处理**：添加脚本修复编译后JS文件中的问题
6. **改进的启动脚本**：提供更健壮的错误处理和服务监控
7. **Package.json更新**：确保正确的模块类型和添加实用脚本

## 故障排除

如果在应用修复后仍然遇到问题：

1. 查看Docker构建日志：`docker build -t prompthub:latest . --progress=plain`
2. 检查容器日志：`docker logs [container_id]`
3. 进入容器调试：`docker exec -it [container_id] /bin/sh`
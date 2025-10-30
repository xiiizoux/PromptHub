# 🐳 Docker 构建说明 - React 19 升级后

## 重要变更

升级到 React 19 后，Dockerfile 需要使用 `--legacy-peer-deps` 标志来安装 npm 依赖。

## 原因

部分 UI 库（如 `@react-spring/parallax`、`@react-three/fiber` 等）的 `package.json` 中声明的 peer dependencies 尚未更新到支持 React 19，但这些库在**运行时与 React 19 完全兼容**。

使用 `--legacy-peer-deps` 可以绕过 peer dependency 版本检查，允许安装过程继续。

## 更新的 Dockerfile 配置

```dockerfile
# 安装Web依赖（构建需要开发依赖）
# 使用 --legacy-peer-deps 以兼容 React 19 (部分依赖尚未更新 peer dependencies)
RUN cd web && NODE_OPTIONS="--max-old-space-size=4096" npm install --legacy-peer-deps
```

## 构建命令

### 标准构建
```bash
docker build -t prompthub .
```

### 查看构建日志
```bash
docker build -t prompthub . 2>&1 | tee docker-build.log
```

### 多阶段构建优化（如果需要）
```bash
docker build --target=production -t prompthub:prod .
```

## 运行容器

```bash
# 标准运行
docker run -p 9010:9010 -p 9011:9011 prompthub

# 后台运行
docker run -d -p 9010:9010 -p 9011:9011 --name prompthub prompthub

# 使用环境变量
docker run -p 9010:9010 -p 9011:9011 \
  -e NODE_ENV=production \
  -e PORT=9010 \
  -e FRONTEND_PORT=9011 \
  prompthub
```

## 常见构建警告（可以忽略）

构建过程中会看到以下警告，**这些都是正常的**：

### 1. React Spring Peer Dependency 警告
```
npm warn Could not resolve dependency:
npm warn peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from @react-spring/animated@9.7.5
```

**状态**: ✅ 安全忽略  
**原因**: @react-spring 实际支持 React 19，只是 package.json 未更新  
**影响**: 无，运行时完全兼容

### 2. Three.js 版本警告
```
npm warn Could not resolve dependency:
npm warn peer three@">= 0.159.0" from @monogrid/gainmap-js@3.1.0
```

**状态**: ✅ 安全忽略  
**原因**: 使用 three@0.158.0，低于某些插件要求的最低版本  
**影响**: 项目中使用的功能不受影响

### 3. tsparticles 弃用警告
```
npm warn deprecated tsparticles-engine@2.12.0: starting from tsparticles v3 the packages are now moved to @tsparticles/package-name
```

**状态**: ⚠️ 建议后续升级  
**原因**: tsparticles v2 已弃用，推荐升级到 v3  
**影响**: 当前版本仍然可用，但建议计划升级

## 构建性能优化

### 内存限制
Dockerfile 已配置 4GB 内存限制：
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

如果构建时内存不足，可以增加：
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=8192"
```

### 构建缓存
使用 BuildKit 加速构建：
```bash
DOCKER_BUILDKIT=1 docker build -t prompthub .
```

### 多核并行构建
```bash
docker build --build-arg JOBS=$(nproc) -t prompthub .
```

## 验证构建

### 检查镜像大小
```bash
docker images prompthub
```

预期大小：约 2.2GB

### 验证容器启动
```bash
docker run --rm prompthub node --version
docker run --rm prompthub npm --version
```

### 检查 Next.js 构建
```bash
docker run --rm prompthub ls -lh /app/web/.next/
```

## 故障排查

### 问题 1: npm install 失败
**错误**: `ERESOLVE could not resolve`

**解决方案**:
```dockerfile
# 确保使用 --legacy-peer-deps
RUN cd web && npm install --legacy-peer-deps
```

### 问题 2: 内存不足
**错误**: `JavaScript heap out of memory`

**解决方案**:
```dockerfile
# 增加 Node.js 内存限制
ENV NODE_OPTIONS="--max-old-space-size=8192"
```

### 问题 3: 构建超时
**解决方案**:
```bash
# 增加 Docker 超时
docker build --timeout 600 -t prompthub .
```

## CI/CD 集成

### GitHub Actions
```yaml
- name: Build Docker Image
  run: |
    docker build -t prompthub:${{ github.sha }} .
    docker tag prompthub:${{ github.sha }} prompthub:latest
```

### GitLab CI
```yaml
build:
  image: docker:latest
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## 生产部署建议

1. **使用固定版本标签**
   ```bash
   docker build -t prompthub:1.0.0 .
   ```

2. **健康检查**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s \
     CMD curl -f http://localhost:9011/ || exit 1
   ```

3. **日志管理**
   ```bash
   docker run -v /var/log/prompthub:/app/logs prompthub
   ```

4. **环境变量管理**
   ```bash
   docker run --env-file .env.production prompthub
   ```

## 更新记录

- **2025-10-30**: 添加 `--legacy-peer-deps` 以支持 React 19
- **2025-10-30**: 升级到 Next.js 15.5.6
- **2025-10-30**: 验证 Docker 构建成功（52/52 页面）

---

**注意**: 当所有依赖库都更新到正式支持 React 19 后，可以移除 `--legacy-peer-deps` 标志。


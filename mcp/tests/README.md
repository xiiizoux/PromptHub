# MCP服务测试脚本

本目录包含MCP（Model Context Protocol）服务的各种测试脚本，用于验证服务功能、性能和协议兼容性。

## 目录结构

```
mcp/tests/
├── README.md                           # 本文件
├── setup.mjs                          # 测试环境设置
├── utils/                             # 测试工具
│   └── test-server.ts                 # 测试服务器工具
├── mcp/                               # MCP协议测试
│   ├── message-format.test.ts         # 消息格式测试
│   └── protocol-compatibility.test.ts # 协议兼容性测试
└── performance/                       # 性能测试
    └── performance-tracking.test.ts   # 性能跟踪测试
```

## 测试脚本说明

### 核心测试文件

#### setup.mjs
- **用途**: 测试环境初始化和配置
- **功能**: 设置测试数据库、环境变量、模拟数据

#### utils/test-server.ts
- **用途**: 测试服务器工具函数
- **功能**: 
  - `setupTestServer()`: 启动测试服务器
  - `closeTestServer()`: 关闭测试服务器
  - 提供测试环境的服务器实例

### MCP协议测试

#### mcp/message-format.test.ts
- **用途**: 验证MCP消息格式
- **测试内容**:
  - 消息结构验证
  - 数据类型检查
  - 序列化/反序列化
  - 错误处理

#### mcp/protocol-compatibility.test.ts
- **用途**: 验证MCP协议兼容性
- **测试内容**:
  - 协议版本兼容性
  - 客户端-服务器通信
  - 握手过程验证
  - 协议规范遵循

### 性能测试

#### performance/performance-tracking.test.ts
- **用途**: 性能监控和跟踪测试
- **测试内容**:
  - 响应时间测量
  - 内存使用监控
  - 并发处理能力
  - 性能指标收集

## 单元测试

### src/tests/api-keys.test.ts
- **位置**: `mcp/src/tests/`
- **用途**: API密钥管理测试
- **测试内容**:
  - 密钥生成和验证
  - 权限检查
  - 密钥轮换
  - 安全性验证

## 运行测试

### 运行所有测试
```bash
cd mcp
npm test
```

### 运行特定测试
```bash
# 运行MCP协议测试
npm test -- tests/mcp/

# 运行性能测试
npm test -- tests/performance/

# 运行单元测试
npm test -- src/tests/
```

### 运行测试并生成覆盖率报告
```bash
npm test -- --coverage
```

## 测试配置

测试配置在以下文件中：
- `jest.config.js`: Jest测试框架配置
- `babel.config.js`: Babel转译配置
- `setup.mjs`: 测试环境设置

## 添加新测试

1. **单元测试**: 在 `src/tests/` 目录下创建 `*.test.ts` 文件
2. **集成测试**: 在相应的功能目录下创建测试文件
3. **性能测试**: 在 `performance/` 目录下添加性能测试
4. **协议测试**: 在 `mcp/` 目录下添加协议相关测试

## 测试最佳实践

1. **命名规范**: 使用 `*.test.ts` 后缀
2. **测试隔离**: 每个测试应该独立运行
3. **清理资源**: 使用 `afterEach` 和 `afterAll` 清理测试数据
4. **模拟依赖**: 使用 Jest mocks 模拟外部依赖
5. **断言明确**: 使用清晰的断言和错误消息

## 注意事项

- 测试运行前会自动设置测试环境
- 测试数据库与生产数据库隔离
- 性能测试可能需要较长时间运行
- 确保测试环境变量正确配置 
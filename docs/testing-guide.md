# MCP Prompt Server 测试指南

本文档提供了 MCP Prompt Server 项目测试的最佳实践和重要信息。

## 测试结构

项目测试分为以下几个主要模块：

- `mcp/` - MCP 协议兼容性和消息格式测试
- `performance/` - 性能跟踪功能测试
- `storage/` - 存储适配器测试
- `utils/` - 共享测试工具

## 运行测试

```bash
# 运行所有测试
npm test

# 检测资源泄漏的测试
npm run test:detect-leaks
```

建议定期使用 `test:detect-leaks` 脚本来确保没有资源泄漏，特别是在修改涉及网络连接、服务器或文件系统的代码后。

## 测试最佳实践

### 性能跟踪测试

1. **类型安全的模拟**：
   - 使用类型安全的模拟函数，确保模拟函数的返回类型与实际函数一致
   - 避免使用 `jest.mock()` 直接模拟模块，而是使用函数替换方式

   ```typescript
   // 推荐方式
   const originalFunction = performanceToolHandlers.track_prompt_usage;
   performanceToolHandlers.track_prompt_usage = jest.fn().mockResolvedValue({
     success: true,
     usage_id: 'mock-usage-id'
   });
   
   // 测试后恢复
   afterAll(() => {
     performanceToolHandlers.track_prompt_usage = originalFunction;
   });
   ```

2. **参数验证**：
   - 在模拟函数中添加参数验证，确保调用时提供了所有必需的参数
   - 为可选参数设置合理的默认值

### 服务器测试

1. **资源清理**：
   - 总是在测试完成后关闭服务器和所有连接
   - 使用 `utils/test-server.ts` 中的 `setupTestServer` 和 `closeTestServer` 函数

   ```typescript
   let serverInfo: ReturnType<typeof setupTestServer> extends Promise<infer T> ? T : never;

   beforeAll(async () => {
     serverInfo = await setupTestServer('/mcp');
     serverInfo.app.use('/mcp', mcpRouter);
   });

   afterAll(async () => {
     await closeTestServer(serverInfo);
   });
   ```

2. **超时处理**：
   - 为长时间运行的测试设置合理的超时时间 `jest.setTimeout(10000);`
   - 使用 `Promise.race` 和超时机制确保测试不会无限挂起
   - 确保所有计时器在测试完成后被清除

3. **SSE 连接测试**：
   - 使用 `AbortController` 确保 SSE 连接在测试完成后被正确关闭
   - 读取并处理第一个数据块后立即终止连接

## 测试疑难解答

1. **资源泄漏检测**：
   - 如果测试结束后进程没有退出，使用 `npm run test:detect-leaks` 找出泄漏的资源
   - 常见泄漏包括未关闭的网络连接、计时器和文件句柄

2. **服务器关闭问题**：
   - 如果测试后服务器没有正确关闭，检查是否有未关闭的持久连接
   - 使用强制关闭逻辑作为后备方案

3. **类型错误**：
   - 确保模拟函数的返回类型与原始函数匹配
   - 使用 TypeScript 的类型推断和接口来验证类型兼容性

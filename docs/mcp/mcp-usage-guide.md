# Model Context Protocol (MCP) 使用指南

## 🚀 快速开始 - 三种使用方式

我们提供三种使用方式，按推荐程度排序：

### 1. 🏆 通用MCP配置（最推荐）
**一次配置，访问所有工具！**
```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["mcp-protocol-adapter.js"],
      "env": { "API_KEY": "your-api-key" }
    }
  }
}
```
👉 **详细指南**: [MCP通用配置指南](./mcp-universal-config.md)

### 2. 🚀 直接HTTP API调用
**简单快速，适合开发测试**
```bash
curl -X POST "https://mcp.prompt-hub.cc/tools/search/invoke" \
  -H "X-Api-Key: your-key" -d '{"query": "React"}'
```
👉 **详细指南**: [MCP简化配置指南](./mcp-simple-config.md)

### 3. 📚 传统MCP协议配置
**完整的MCP协议实现，适合特殊需求**

---

## 概述

Model Context Protocol (MCP) 是一个开放协议，用于标准化应用程序如何向大语言模型（LLM）提供上下文。MCP于2024年11月由Anthropic发布，旨在解决AI生态系统中的一个根本挑战：如何标准化AI模型访问和与外部数据源及工具交互的方式。

就像USB-C为设备连接各种外设提供了标准化方式一样，MCP为AI模型连接不同的数据源和工具提供了标准化方式。这个协议让开发者可以构建可组合的集成和工作流，而不需要为每个数据源和工具单独开发集成方案。

## 协议架构

MCP使用JSON-RPC 2.0消息格式在以下组件之间建立通信：

- **主机 (Hosts)**: 启动连接的LLM应用程序（如Claude Desktop、ChatGPT等）
- **客户端 (Clients)**: 主机应用程序内的连接器组件
- **服务器 (Servers)**: 提供上下文和功能的服务（如我们的提示词存储服务器）

## 核心功能

### 服务器功能

MCP服务器可以向客户端提供以下功能：

- **资源 (Resources)**: 为用户或AI模型使用的上下文和数据
- **提示词 (Prompts)**: 为用户提供的模板化消息和工作流
- **工具 (Tools)**: 供AI模型执行的函数

### 客户端功能

客户端可以向服务器提供以下功能：

- **采样 (Sampling)**: 服务器发起的代理行为和递归LLM交互

## MCP自动存储工具

我们的系统专为第三方AI客户端设计，提供智能提示词存储和管理功能。

### 核心特性

✅ **一键存储** - 最简化操作，自动分析填充所有参数  
✅ **智能分析** - 自动生成标题、描述、分类、标签等  
✅ **智能隐私** - 根据关键词自动判断公开/私有设置  
✅ **零门槛使用** - 无需了解复杂参数，直接粘贴内容即可  
✅ **AI增强** - 参考web服务器AI智能分析实现，质量保证

### 三个工具对比

| 工具名称 | 使用场景 | 复杂度 | 自动化程度 |
|---------|---------|--------|-----------|
| `quick_store` | 快速存储，不需要确认 | ⭐ | 🤖🤖🤖 |
| `smart_store` | 需要查看分析结果 | ⭐⭐ | 🤖🤖 |
| `analyze_and_store` | 需要精确控制 | ⭐⭐⭐ | 🤖 |

## 工具使用方法

### 1. 一键存储 (推荐) - `quick_store`

**最简单的使用方式，适合日常快速存储**

#### 基础用法

```json
{
  "content": "你的提示词内容..."
}
```

#### 自定义标题

```json
{
  "content": "你的提示词内容...",
  "title": "我的专属提示词"
}
```

#### 明确设为私有

```json
{
  "content": "你的提示词内容...",
  "make_public": false
}
```

#### 返回结果示例

```json
{
  "success": true,
  "message": "✅ 提示词已成功存储！",
  "prompt": {
    "id": "12345",
    "title": "数据分析专家",
    "category": "商业",
    "tags": ["数据分析", "商业智能", "报告"],
    "version": 1.0,
    "isPublic": true
  },
  "analysis": {
    "category": "商业",
    "difficulty": "intermediate",
    "estimatedTokens": 350,
    "variables": ["数据类型", "分析目标"],
    "compatibleModels": ["llm-large", "reasoning-specialized"]
  },
  "privacy": {
    "isPublic": true,
    "source": "auto_detected",
    "detectedKeywords": {
      "private": [],
      "public": ["分享", "团队"]
    }
  }
}
```

### 2. 智能存储 - `smart_store`

**支持分析确认的完整流程**

#### 自动分析并存储

```json
{
  "content": "你的提示词内容...",
  "auto_analyze": true,
  "confirm_before_save": false
}
```

#### 需要确认的分析流程

```json
{
  "content": "你的提示词内容...",
  "auto_analyze": true,
  "confirm_before_save": true
}
```

### 3. 分析并存储 - `analyze_and_store`

**分步式流程，最大控制力**

#### 第一步：仅分析

```json
{
  "content": "你的提示词内容...",
  "analysis_only": true
}
```

#### 第二步：基于分析结果存储

```json
{
  "content": "你的提示词内容...",
  "analysis_result": {
    "suggestedTitle": "修改后的标题",
    "category": "学术",
    "tags": ["研究", "分析"],
    "description": "自定义描述"
  }
}
```

## 智能隐私检测

系统会根据提示词内容和标题中的关键词，自动判断存储为公开还是私有。

### 🔒 私有关键词检测

当内容包含以下关键词时，自动设为**私有**：
- **中文**: 个人、私有、私人、私密、内部、不公开、仅自己
- **英文**: private, personal, internal, confidential, secret

### 🌐 公开关键词检测

当内容包含以下关键词时，明确设为**公开**：
- **中文**: 公开、分享、共享、开源、公共、团队、大家
- **英文**: public, share, open, common, team, everyone

### 🎯 判断逻辑

1. **用户明确指定** - 通过`make_public`参数指定时，以用户设置为准
2. **检测到私有关键词** - 自动设为私有存储
3. **检测到公开关键词** - 自动设为公开存储
4. **未检测到关键词** - 默认设为公开存储

### 📋 使用示例

#### 自动检测为私有

```json
{
  "content": "这是我个人的工作笔记提示词..."
  // 系统检测到"个人"，自动设为私有
}
```

#### 自动检测为公开

```json
{
  "content": "分享一个通用的数据分析提示词，希望对大家有帮助..."
  // 系统检测到"分享"、"大家"，自动设为公开
}
```

#### 用户明确指定

```json
{
  "content": "普通的提示词内容...",
  "make_public": false  // 明确指定为私有
}
```

## 第三方客户端使用示例

### Claude/ChatGPT 客户端

```
用户: 请帮我存储这个提示词到MCP服务器
[提示词内容]

AI: 我来帮你存储这个提示词。

[调用 quick_store 工具]

存储成功！提示词已保存为"数据分析专家"，分类为"商业"，包含标签：数据分析、商业智能、报告。
```

### Cursor/VS Code 客户端

```typescript
// 用户操作：选中代码 -> 右键 -> "存储为提示词"
// 系统自动调用：
await mcp.callTool('quick_store', {
  content: selectedText,
  title: `${fileName}_${new Date().toLocaleDateString()}`
});
```

## 安全和信任考虑

MCP协议能够通过任意数据访问和代码执行路径实现强大功能。强大的功能带来了重要的安全和信任考虑：

### 关键原则

1. **用户同意和控制**
   - 用户必须明确同意并理解所有数据访问和操作
   - 用户必须保持对共享数据和执行操作的控制权
   - 实现者应提供清晰的UI用于审查和授权活动

2. **数据隐私**
   - 主机必须在向服务器公开用户数据之前获得明确的用户同意
   - 主机不得在未经用户同意的情况下将资源数据传输到其他地方
   - 用户数据应受到适当访问控制的保护

3. **工具安全**
   - 工具代表任意代码执行，必须谨慎对待
   - 主机必须在调用任何工具之前获得明确的用户同意
   - 用户应在授权使用之前了解每个工具的功能

4. **LLM采样控制**
   - 用户必须明确批准任何LLM采样请求
   - 用户应控制：是否进行采样、发送的实际提示、服务器可以看到的结果

## 配置示例

### 🚀 推荐方式：直接HTTP API调用

我们的MCP服务器实际上是一个HTTP REST API服务器，**推荐直接通过HTTP请求调用**，无需复杂的MCP协议配置：

#### 基本配置
- **服务器地址**: `https://mcp.prompt-hub.cc`
- **认证方式**: API密钥（X-Api-Key头部）
- **内容类型**: `application/json`

#### 使用示例

**获取工具列表：**
```bash
curl -X GET "https://mcp.prompt-hub.cc/tools" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json"
```

**调用工具：**
```bash
curl -X POST "https://mcp.prompt-hub.cc/tools/search/invoke" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "React hooks"}'
```

#### 在AI客户端中使用

**Cursor配置示例：**
```json
{
  "customTools": {
    "promptHub": {
      "baseUrl": "https://mcp.prompt-hub.cc",
      "headers": {
        "X-Api-Key": "your-api-key",
        "Content-Type": "application/json"
      },
      "endpoints": {
        "search": "/tools/search/invoke",
        "store": "/tools/quick_store/invoke"
      }
    }
  }
}
```

### 🔧 传统MCP协议配置（可选）

如果你的AI客户端需要标准MCP协议，可以使用以下简化配置：

#### Claude Desktop配置
```json
{
  "mcpServers": {
    "prompt-hub": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://mcp.prompt-hub.cc/tools/search/invoke",
        "-H", "X-Api-Key: your-api-key",
        "-H", "Content-Type: application/json",
        "-d", "@-"
      ]
    }
  }
}
```

#### 其他MCP客户端配置
```json
{
  "mcpServers": {
    "prompt-hub": {
      "command": "node",
      "args": ["-e", "
        const https = require('https');
        const readline = require('readline');

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        rl.on('line', (input) => {
          const data = JSON.stringify(JSON.parse(input));
          const options = {
            hostname: 'mcp.prompt-hub.cc',
            path: '/tools/search/invoke',
            method: 'POST',
            headers: {
              'X-Api-Key': process.env.MCP_API_KEY,
              'Content-Type': 'application/json',
              'Content-Length': data.length
            }
          };

          const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => console.log(responseData));
          });

          req.write(data);
          req.end();
        });
      "],
      "env": {
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 最佳实践

1. **明确权限范围** - 清楚定义每个工具的功能和限制
2. **用户确认流程** - 在执行重要操作前获得用户确认
3. **错误处理** - 提供详细的错误信息和恢复建议
4. **性能考虑** - 合理使用缓存和批处理优化响应时间
5. **安全第一** - 始终验证输入并保护敏感数据

## 故障排除

### 常见问题

1. **连接失败**
   - 检查MCP服务器是否运行在正确端口
   - 验证数据库连接配置
   - 确认环境变量设置正确

2. **存储失败**
   - 检查数据库权限
   - 验证输入数据格式
   - 查看服务器日志获取详细错误信息

3. **分析不准确**
   - 检查AI模型服务可用性
   - 验证API密钥配置
   - 考虑调整分析参数

## 参考资源

- [MCP官方文档](https://modelcontextprotocol.io)
- [MCP规范](https://modelcontextprotocol.io/specification)
- [GitHub示例](https://github.com/modelcontextprotocol)
- [Claude Desktop MCP配置指南](https://docs.anthropic.com/en/docs/mcp)

## 版本信息

- 文档版本: 1.0
- MCP协议版本: 2025-03-26
- 最后更新: 2025年1月 
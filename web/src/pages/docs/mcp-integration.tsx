import React from 'react';
import Link from 'next/link';
import { CloudIcon, CogIcon, CommandLineIcon, ServerIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const MCPIntegrationPage: React.FC = () => {
  const installCode = `# 🏆 最推荐：NPM 包方式（一键安装）
# 零配置，自动更新，支持所有AI客户端
npx prompthub-mcp-adapter

# 🚀 备用方式：直接 HTTP API 调用
# 无需安装额外SDK，只需要URL和API密钥
curl -X GET "https://mcp.prompt-hub.cc/tools" \\
  -H "X-Api-Key: your-api-key" \\
  -H "Content-Type: application/json"

# 调用工具示例
curl -X POST "https://mcp.prompt-hub.cc/tools/search/invoke" \\
  -H "X-Api-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "React hooks", "limit": 5}'

# 本地开发环境
curl -X GET "http://localhost:9010/tools" \\
  -H "X-Api-Key: your-api-key"`;

  const npmConfigCode = `# 🏆 最推荐：NPM 包方式
# 零配置，自动更新，30个工具立即可用！

{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp-adapter"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}

# 🎯 优势：
# ✅ 一键安装 - 无需下载任何文件
# ✅ 自动更新 - 每次运行都是最新版本
# ✅ 30个工具 - 完整的提示词管理工具集
# ✅ 跨平台 - Windows、macOS、Linux 全支持
# ✅ 零配置 - 只需设置 API 密钥

# 🏆 最推荐：NPM 包方式（推荐）
{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp-adapter"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}`;

  const httpApiConfigCode = `# 🚀 备选：直接HTTP API调用
# 简单快速，适合开发测试

# Cursor IDE 配置示例
{
  "customTools": {
    "promptHub": {
      "name": "PromptHub工具",
      "baseUrl": "https://mcp.prompt-hub.cc",
      "headers": {
        "X-Api-Key": "your-api-key",
        "Content-Type": "application/json"
      },
      "tools": [
        {
          "name": "搜索提示词",
          "endpoint": "/tools/search/invoke",
          "method": "POST"
        }
      ]
    }
  }
}`;

  const httpApiExample = `// 🚀 推荐方式：直接HTTP API调用
const axios = require('axios');

// 配置
const API_KEY = "your-api-key";
const BASE_URL = "https://mcp.prompt-hub.cc";

const headers = {
  "X-Api-Key": API_KEY,
  "Content-Type": "application/json"
};

async function usePromptHub() {
  try {
    // 1. 获取可用工具
    const toolsResponse = await axios.get(\`\${BASE_URL}/tools\`, { headers });
    console.log("可用工具:", toolsResponse.data);

    // 2. 搜索提示词
    const searchResponse = await axios.post(
      \`\${BASE_URL}/tools/search/invoke\`,
      { query: "React hooks", limit: 5 },
      { headers }
    );
    console.log("搜索结果:", searchResponse.data);

    // 3. 快速存储提示词
    const storeResponse = await axios.post(
      \`\${BASE_URL}/tools/quick_store/invoke\`,
      {
        content: "你是一个React专家，帮助用户解决React相关问题。",
        title: "React专家助手"
      },
      { headers }
    );
    console.log("存储结果:", storeResponse.data);

  } catch (error) {
    console.error("API调用失败:", error.response?.data || error.message);
  }
}

usePromptHub();`;

  const curlExample = `# 命令行调用示例
# 1. 健康检查
curl -X GET "https://mcp.prompt-hub.cc/api/health"

# 2. 获取可用工具（需要API密钥）
curl -X GET "https://mcp.prompt-hub.cc/tools" \\
  -H "X-Api-Key: your-api-key" \\
  -H "Content-Type: application/json"

# 3. 搜索提示词
curl -X POST "https://mcp.prompt-hub.cc/tools/search/invoke" \\
  -H "X-Api-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "React hooks", "limit": 5}'

# 4. 快速存储提示词
curl -X POST "https://mcp.prompt-hub.cc/tools/quick_store/invoke" \\
  -H "X-Api-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "你是一个React专家，帮助用户解决React相关问题。",
    "title": "React专家助手",
    "category": "编程助手"
  }'

# 5. 统一搜索（高级功能）
curl -X POST "https://mcp.prompt-hub.cc/tools/unified_search/invoke" \\
  -H "X-Api-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "前端开发",
    "algorithm": "smart",
    "limit": 10,
    "include_content": true
  }'`;

  const features = [
    {
      title: '工具调用',
      description: '调用 MCP 服务器提供的各种 AI 工具和功能',
      icon: <CogIcon className="h-6 w-6" />,
      color: 'cyan' as const,
    },
    {
      title: '实时通信',
      description: '基于 WebSocket 的实时双向通信',
      icon: <BoltIcon className="h-6 w-6" />,
      color: 'purple' as const,
    },
    {
      title: '安全认证',
      description: '多种认证方式确保连接安全',
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      color: 'pink' as const,
    },
    {
      title: '云端服务',
      description: '支持本地和云端 MCP 服务器',
      icon: <CloudIcon className="h-6 w-6" />,
      color: 'green' as const,
    },
  ];

  const tools = [
    {
      name: 'search',
      description: '🔍 快速搜索提示词（推荐）',
      params: ['query', 'limit', 'category'],
    },
    {
      name: 'unified_search',
      description: '🎯 统一搜索引擎，支持多种算法',
      params: ['query', 'algorithm', 'limit', 'include_content'],
    },
    {
      name: 'quick_store',
      description: '⚡ 一键快速存储提示词',
      params: ['content', 'title', 'category', 'tags'],
    },
    {
      name: 'smart_store',
      description: '🧠 智能存储提示词，自动分析',
      params: ['content', 'auto_analyze', 'confirm_before_save'],
    },
    {
      name: 'get_categories',
      description: '📂 获取所有可用分类',
      params: [],
    },
    {
      name: 'get_prompt_names',
      description: '📋 获取提示词名称列表',
      params: ['category', 'limit'],
    },
    {
      name: 'get_prompt_details',
      description: '📄 获取特定提示词详细信息',
      params: ['name'],
    },
    {
      name: 'track_prompt_usage',
      description: '📊 跟踪提示词使用情况',
      params: ['prompt_id', 'usage_context', 'feedback'],
    },
  ];

  return (
    <DocLayout
      title="🚀 MCP 简化集成指南"
      description="了解如何通过简单的HTTP API调用使用PromptHub MCP服务，无需复杂配置，只要URL和API密钥即可"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: 'MCP 集成', href: '/docs/mcp-integration' },
      ]}
    >
      {/* MCP 简介 */}
      <DocSection title="🚀 简化的MCP集成" delay={0.1}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            PromptHub的MCP服务器实际上是一个<strong>HTTP REST API服务器</strong>，支持直接通过HTTP请求调用，
            无需复杂的MCP协议配置！只需要URL和API密钥就能使用所有功能。
          </p>

          <DocHighlight type="success">
            <h4 className="font-semibold mb-3">🎯 为什么选择我们的简化方案？</h4>
            <ul className="space-y-2 text-sm">
              <li>• <strong>🚀 极简配置：</strong>只需要URL + API密钥，无需复杂的协议配置</li>
              <li>• <strong>🔧 通用兼容：</strong>任何HTTP客户端都支持，包括curl、Postman、浏览器</li>
              <li>• <strong>⚡ 性能优秀：</strong>直接HTTP调用，减少协议转换开销</li>
              <li>• <strong>🛠️ 易于调试：</strong>使用常见工具就能测试和调试</li>
              <li>• <strong>📚 功能完整：</strong>与传统MCP协议功能完全相同</li>
            </ul>
          </DocHighlight>

          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">💡 快速体验</h4>
            <div className="bg-dark-bg-primary rounded-lg p-4">
              <code className="text-sm text-neon-cyan">
                curl -X GET "https://mcp.prompt-hub.cc/api/health"
              </code>
              <p className="text-xs text-gray-400 mt-2">无需API密钥即可测试连接</p>
            </div>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 核心功能 */}
      <DocSection title="核心功能" delay={0.2}>
        <DocGrid cols={4}>
          {features.map((feature, index) => (
            <DocCard 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
            />
          ))}
        </DocGrid>
      </DocSection>

      {/* 快速开始 */}
      <DocSection title="快速开始" delay={0.3}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            按照以下步骤快速开始使用远程 MCP 服务器集成功能。
          </p>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">1. 获取 API 密钥</h4>
              <DocHighlight type="info">
                <h5 className="font-semibold mb-3">注册并获取访问权限</h5>
                <ul className="space-y-2 text-sm">
                  <li>• 访问 <strong>prompt-hub.cc</strong> 注册账户</li>
                  <li>• 在用户面板中生成 API 密钥</li>
                  <li>• 配置访问权限和使用限额</li>
                  <li>• 记录您的 API 密钥用于客户端配置</li>
                </ul>
              </DocHighlight>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">2. 连接方式</h4>
              <DocHighlight type="success">
                <h5 className="font-semibold mb-3">🚀 推荐：直接HTTP API调用</h5>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>简单直接：</strong>只需要URL和API密钥，无需复杂配置</li>
                  <li>• <strong>通用兼容：</strong>任何HTTP客户端都支持，包括curl、axios、requests等</li>
                  <li>• <strong>易于调试：</strong>可以直接用浏览器或命令行工具测试</li>
                  <li>• <strong>性能更好：</strong>减少协议转换开销，响应更快</li>
                </ul>
              </DocHighlight>
              <DocCodeBlock
                code={installCode}
                title="快速开始 - HTTP API调用"
                language="bash"
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">3. 配置示例</h4>
              <div className="space-y-6">
                <DocCodeBlock
                  code={npmConfigCode}
                  title="🏆 最推荐：NPM 包方式"
                  language="json"
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DocCodeBlock
                    code={httpApiConfigCode}
                    title="🚀 备选：HTTP API配置"
                    language="json"
                  />
                  <div className="space-y-4">
                    <h5 className="text-md font-medium text-white">📋 配置对比</h5>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="font-medium text-green-400">🏆 NPM 包方式</div>
                        <div className="text-gray-300 mt-1">一键安装，30个工具，自动更新</div>
                      </div>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="font-medium text-blue-400">🚀 HTTP API</div>
                        <div className="text-gray-300 mt-1">简单直接，适合快速测试</div>
                      </div>
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="font-medium text-purple-400">🔧 传统MCP</div>
                        <div className="text-gray-300 mt-1">零配置方案，兼容性好</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">4. NPM 包使用示例</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocCodeBlock
                  code={`# 🏆 推荐：直接使用 NPX
npx prompthub-mcp-adapter

# 全局安装
npm install -g prompthub-mcp-adapter
prompthub-mcp-adapter

# 测试连接
API_KEY=your-api-key npx prompthub-mcp-adapter`}
                  title="🏆 NPM 包使用方式"
                  language="bash"
                />
                <DocCodeBlock
                  code={`{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp-adapter"],
      "env": {
        "API_KEY": "your-api-key-here",
        "MCP_SERVER_URL": "https://mcp.prompt-hub.cc"
      }
    }
  }
}

// 可用工具：30个
// ✅ 提示词管理：创建、更新、搜索
// ✅ 智能推荐：AI 驱动的推荐
// ✅ 性能分析：使用数据追踪
// ✅ 协作功能：团队共享和版本控制`}
                  title="AI 客户端配置示例"
                  language="json"
                />
              </div>
              <DocHighlight type="success">
                <h5 className="font-semibold mb-3">🏆 为什么推荐NPM包方式？</h5>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>一键安装：</strong>无需下载文件，npx 自动处理</li>
                  <li>• <strong>自动更新：</strong>每次运行都是最新版本，无需手动更新</li>
                  <li>• <strong>30个工具：</strong>完整的提示词管理工具集，功能全面</li>
                  <li>• <strong>跨平台：</strong>Windows、macOS、Linux 全支持</li>
                  <li>• <strong>零配置：</strong>只需设置 API 密钥即可使用</li>
                  <li>• <strong>易于调试：</strong>详细的日志输出，问题排查简单</li>
                </ul>
              </DocHighlight>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">5. HTTP API 调用示例</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocCodeBlock
                  code={httpApiExample}
                  title="🚀 JavaScript HTTP API调用"
                  language="javascript"
                />
                <DocCodeBlock
                  code={curlExample}
                  title="命令行调用示例"
                  language="bash"
                />
              </div>
              <DocHighlight type="success">
                <h5 className="font-semibold mb-3">为什么推荐HTTP API？</h5>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>简单直接：</strong>无需复杂的协议配置，只要URL和API密钥</li>
                  <li>• <strong>通用兼容：</strong>所有HTTP客户端都支持，包括浏览器、curl、Postman</li>
                  <li>• <strong>易于调试：</strong>可以直接用常见工具测试和调试</li>
                  <li>• <strong>性能更好：</strong>减少协议转换开销，响应更快更稳定</li>
                  <li>• <strong>功能完整：</strong>与传统MCP协议功能完全相同</li>
                </ul>
              </DocHighlight>
            </div>
          </div>
        </div>
      </DocSection>

      {/* 传输方式说明 */}
      <DocSection title="支持的传输方式" delay={0.35}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            我们的 MCP 服务器支持多种传输方式，您可以根据使用场景选择最合适的方式。
          </p>
          
          <DocGrid cols={3}>
            <DocCard
              title="🏆 NPM 包方式（强烈推荐）"
              description="一键安装，30个工具，自动更新"
              icon={<ServerIcon className="h-6 w-6" />}
              color="green"
            >
              <DocList
                items={[
                  { title: '一键安装', description: 'npx 自动处理' },
                  { title: '30个工具', description: '完整工具集' },
                  { title: '自动更新', description: '始终最新版本' },
                  { title: '跨平台', description: '全平台支持' },
                ]}
                className="mt-4"
              />
            </DocCard>

            <DocCard
              title="🚀 HTTP API"
              description="直接 REST API 调用，简单易用"
              icon={<CloudIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList
                items={[
                  { title: '简单配置', description: '只需URL+API密钥' },
                  { title: '通用兼容', description: '任何HTTP客户端' },
                  { title: '易于调试', description: '使用常见工具' },
                  { title: '性能优秀', description: '响应快速稳定' },
                ]}
                className="mt-4"
              />
            </DocCard>

            <DocCard
              title="传统 MCP 协议"
              description="通过官方 MCP SDK 连接（可选）"
              icon={<CommandLineIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList
                items={[
                  { title: '标准协议', description: 'MCP官方标准' },
                  { title: 'SDK支持', description: 'TypeScript支持' },
                  { title: '生态兼容', description: 'MCP生态系统' },
                ]}
                className="mt-4"
              />
            </DocCard>

            <DocCard
              title="实时通信"
              description="WebSocket实时事件流"
              icon={<BoltIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList
                items={[
                  { title: '实时更新', description: '服务器推送' },
                  { title: '长连接', description: '保持状态同步' },
                  { title: '轻量协议', description: '低开销通信' },
                ]}
                className="mt-4"
              />
            </DocCard>
          </DocGrid>
          
          <DocHighlight type="success">
            <h4 className="font-semibold mb-3">🎯 使用建议</h4>
            <ul className="space-y-2 text-sm">
              <li>• <strong>🏆 NPM 包方式（最推荐）：</strong>一键安装，30个工具，自动更新，适合所有AI客户端</li>
              <li>• <strong>🚀 HTTP API：</strong>适合快速测试和开发，简单直接</li>
              <li>• <strong>传统MCP协议：</strong>仅在AI客户端严格要求MCP协议时使用</li>
              <li>• <strong>实时通信：</strong>需要实时数据更新的应用场景</li>
              <li>• <strong>服务地址：</strong>生产环境 https://mcp.prompt-hub.cc，本地开发 http://localhost:9010</li>
            </ul>
          </DocHighlight>

          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">📦 NPM 包详细信息</h4>
            <div className="bg-dark-bg-primary rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <code className="text-sm text-neon-cyan">包名</code>
                  <p className="text-xs text-gray-400 mt-1">prompthub-mcp-adapter</p>
                </div>
                <div>
                  <code className="text-sm text-gray-300">最新版本: 1.0.6</code>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <code className="text-sm text-neon-cyan">安装命令</code>
                  <p className="text-xs text-gray-400 mt-1">npx prompthub-mcp-adapter</p>
                </div>
                <div>
                  <code className="text-sm text-gray-300">支持平台: Windows, macOS, Linux</code>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <code className="text-sm text-neon-cyan">工具数量</code>
                  <p className="text-xs text-gray-400 mt-1">30个完整工具集</p>
                </div>
                <div>
                  <code className="text-sm text-gray-300">Node.js要求: {'>'}= 16.0.0</code>
                </div>
              </div>
            </div>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 可用工具 */}
      <DocSection title="可用工具" delay={0.4}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            MCP 服务器提供了丰富的工具集，覆盖提示词生成、分析、优化等核心功能。
          </p>
          
          <DocGrid cols={2}>
            {tools.map((tool, index) => (
              <DocCard 
                key={index}
                title={tool.name}
                description={tool.description}
                icon={<CommandLineIcon className="h-6 w-6" />}
                color={index % 2 === 0 ? 'cyan' : 'purple'}
              >
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-dark-text-secondary mb-2">参数：</h5>
                  <div className="flex flex-wrap gap-2">
                    {tool.params.map((param, paramIndex) => (
                      <span 
                        key={paramIndex}
                        className={`text-xs px-2 py-1 rounded border ${
                          index % 2 === 0
                            ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30'
                            : 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                        }`}
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              </DocCard>
            ))}
          </DocGrid>
        </div>
      </DocSection>

      {/* 环境变量配置 */}
      <DocSection title="环境变量配置" delay={0.5}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            为了安全地管理 API 密钥和配置信息，建议使用环境变量。
          </p>
          
          <div className="space-y-4">
            <DocHighlight type="warning">
              <h4 className="font-semibold mb-3">环境变量设置</h4>
              <div className="bg-dark-bg-primary rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <code className="text-sm text-neon-cyan">MCP_API_KEY</code>
                    <p className="text-xs text-gray-400 mt-1">您的 API 访问密钥</p>
                  </div>
                  <div>
                    <code className="text-sm text-gray-300">your-secure-api-key</code>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <code className="text-sm text-neon-cyan">MCP_SERVER_URL</code>
                    <p className="text-xs text-gray-400 mt-1">MCP 服务器地址</p>
                  </div>
                  <div>
                    <code className="text-sm text-gray-300">https://mcp.prompt-hub.cc</code>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <code className="text-sm text-neon-cyan">TRANSPORT_TYPE</code>
                    <p className="text-xs text-gray-400 mt-1">传输方式（stdio/http）</p>
                  </div>
                  <div>
                    <code className="text-sm text-gray-300">stdio</code>
                  </div>
                </div>
              </div>
            </DocHighlight>

            <DocHighlight type="error">
              <h4 className="font-semibold mb-3">安全提示</h4>
              <ul className="space-y-2 text-sm">
                <li>• 请不要在代码仓库中提交包含 API 密钥的文件</li>
                <li>• 定期更换 API 密钥，特别是在怀疑泄露时</li>
                <li>• 在生产环境中使用强密码和 HTTPS</li>
                <li>• 限制 API 密钥的访问权限和使用范围</li>
              </ul>
            </DocHighlight>
          </div>
        </div>
      </DocSection>

      {/* 故障排除 */}
      <DocSection title="常见问题与故障排除" delay={0.6}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            在集成过程中可能遇到的常见问题及解决方案。
          </p>
          
          <DocGrid cols={2}>
            <DocCard 
              title="连接失败"
              description="无法连接到 MCP 服务器"
              icon={<ServerIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList 
                items={[
                  { title: '检查网络连接', description: '确保网络正常' },
                  { title: '验证服务器地址', description: '确认 URL 正确' },
                  { title: '检查防火墙设置', description: '允许相关端口' },
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="认证失败"
              description="API 密钥认证失败"
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList 
                items={[
                  { title: '验证 API 密钥', description: '确认密钥正确' },
                  { title: '检查权限', description: '确认访问权限' },
                  { title: '更新密钥', description: '使用最新密钥' },
                ]}
                className="mt-4"
              />
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      {/* 架构说明 */}
      <DocSection title="架构说明" delay={0.7}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            了解 MCP 集成的整体架构，帮助您更好地规划和实施集成方案。
          </p>
          
          <DocGrid cols={3}>
            <DocCard 
              title="客户端应用"
              description="您的应用程序，通过 MCP SDK 连接到服务器"
              icon={<ServerIcon className="h-6 w-6" />}
              color="cyan"
            >
                             <DocList 
                 items={[
                   { title: 'Web 应用', description: '浏览器端应用' },
                   { title: '移动应用', description: '移动端应用' },
                   { title: '桌面应用', description: '桌面端应用' },
                   { title: '命令行工具', description: 'CLI 工具' },
                 ]}
                 className="mt-4"
               />
            </DocCard>
            
            <DocCard 
              title="MCP 服务器"
              description="提供 AI 工具和服务的核心服务器"
              icon={<CogIcon className="h-6 w-6" />}
              color="purple"
            >
                             <DocList 
                 items={[
                   { title: '工具调用', description: '处理工具调用请求' },
                   { title: '状态管理', description: '维护连接状态' },
                   { title: '权限控制', description: '管理访问权限' },
                   { title: '数据处理', description: '处理数据传输' },
                 ]}
                 className="mt-4"
               />
            </DocCard>
            
            <DocCard 
              title="AI 模型"
              description="底层的大语言模型和 AI 服务"
              icon={<CloudIcon className="h-6 w-6" />}
              color="pink"
            >
                             <DocList 
                 items={[
                   { title: 'GPT 系列', description: 'OpenAI 模型' },
                   { title: 'Claude 系列', description: 'Anthropic 模型' },
                   { title: '本地模型', description: '本地部署模型' },
                   { title: '自定义模型', description: '用户自定义模型' },
                 ]}
                 className="mt-4"
               />
            </DocCard>
          </DocGrid>
          
          <DocHighlight type="warning">
            <h4 className="font-semibold mb-3">注意事项</h4>
            <ul className="space-y-2 text-sm">
              <li>• 确保网络连接稳定，避免频繁的连接中断</li>
              <li>• 妥善保管 API 密钥和认证令牌</li>
              <li>• 合理设置超时和重试机制</li>
              <li>• 监控 API 调用频率和配额使用情况</li>
            </ul>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 下一步 */}
      <DocSection title="📚 相关资源" delay={0.8}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            现在您已经了解了MCP集成的基础知识，可以继续探索更多功能和最佳实践。
          </p>

          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">🎯 推荐阅读顺序</h4>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>先尝试HTTP API调用方式（本页介绍的推荐方法）</li>
              <li>查看详细的配置文档和示例</li>
              <li>了解API集成的最佳实践</li>
              <li>探索高级功能和自定义选项</li>
            </ol>
          </DocHighlight>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/xiiizoux/PromptHub/blob/main/docs/mcp-universal-config.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              🏆 通用配置指南
            </a>
            <a
              href="https://github.com/xiiizoux/PromptHub/blob/main/docs/mcp-simple-config.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-neon-green text-neon-green rounded-xl font-medium hover:bg-neon-green/10 transition-all duration-300"
            >
              🚀 简化配置指南
            </a>
            <Link
              href="/docs/api-integration"
              className="inline-flex items-center px-6 py-3 border border-neon-cyan text-neon-cyan rounded-xl font-medium hover:bg-neon-cyan/10 transition-all duration-300"
            >
              API 集成指南
            </Link>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default MCPIntegrationPage;
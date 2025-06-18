import React from 'react';
import Link from 'next/link';
import { CloudIcon, CogIcon, CommandLineIcon, ServerIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const MCPIntegrationPage: React.FC = () => {
  const installCode = `# 方式一：使用标准 MCP 客户端连接
# 通过官方 MCP SDK 连接我们的服务器
npm install @modelcontextprotocol/sdk

# 方式二：直接 HTTP API 调用
# 无需安装额外SDK，直接使用 HTTP 请求
curl -X GET "https://mcp.prompt-hub.cc/tools" \\
  -H "X-Api-Key: your-api-key"`;

  const configCode = `{
  "mcpServers": {
    "prompt-hub": {
      "command": "node",
      "args": ["-e", "
        const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
        const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
        
        async function main() {
          const transport = new StdioClientTransport({
            command: 'curl',
            args: ['-X', 'POST', 'https://mcp.prompt-hub.cc/mcp'],
            env: { MCP_API_KEY: process.env.MCP_API_KEY }
          });
          
          const client = new Client({
            name: 'prompt-hub-client',
            version: '1.0.0'
          }, {
            capabilities: {}
          });
          
          await client.connect(transport);
        }
        
        main().catch(console.error);
      "],
      "env": {
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}`;

  const nodeExample = `// 方式一：使用标准 MCP SDK
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./connect-to-prompthub.js'],
  env: { MCP_API_KEY: process.env.MCP_API_KEY }
});

const client = new Client({
  name: 'my-app',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// 调用工具
const result = await client.callTool({
  name: 'quick_store',
  arguments: {
    content: '你的提示词内容...',
    title: '可选标题'
  }
});

console.log(result);`;

  const pythonExample = `# 方式二：直接 HTTP API 调用
import requests
import json

# 配置
API_KEY = "your-api-key"
BASE_URL = "https://mcp.prompt-hub.cc"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

# 获取可用工具
tools_response = requests.get(f"{BASE_URL}/tools", headers=headers)
print("可用工具:", tools_response.json())

# 调用快速存储工具
store_data = {
    "name": "quick_store",
    "arguments": {
        "content": "你的提示词内容...",
        "title": "可选标题"
    }
}

response = requests.post(
    f"{BASE_URL}/tools/call", 
    headers=headers, 
    json=store_data
)

result = response.json()
print("存储结果:", result)`;

  const features = [
    {
      title: "工具调用",
      description: "调用 MCP 服务器提供的各种 AI 工具和功能",
      icon: <CogIcon className="h-6 w-6" />,
      color: "cyan" as const
    },
    {
      title: "实时通信",
      description: "基于 WebSocket 的实时双向通信",
      icon: <BoltIcon className="h-6 w-6" />,
      color: "purple" as const
    },
    {
      title: "安全认证",
      description: "多种认证方式确保连接安全",
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      color: "pink" as const
    },
    {
      title: "云端服务",
      description: "支持本地和云端 MCP 服务器",
      icon: <CloudIcon className="h-6 w-6" />,
      color: "green" as const
    }
  ];

  const tools = [
    {
      name: "quick_store",
      description: "一键快速存储提示词，自动分析所有参数",
      params: ["content", "title", "make_public"]
    },
    {
      name: "smart_store",
      description: "智能存储提示词，支持分析确认流程",
      params: ["content", "auto_analyze", "confirm_before_save"]
    },
    {
      name: "analyze_and_store",
      description: "分步式提示词分析和存储",
      params: ["content", "analysis_only", "analysis_result"]
    },
    {
      name: "get_prompt_details",
      description: "获取特定提示词的详细信息",
      params: ["name"]
    },
    {
      name: "search_prompts",
      description: "搜索和筛选提示词",
      params: ["query", "category", "tags", "limit"]
    },
    {
      name: "enhanced_search",
      description: "增强搜索功能，支持复杂查询",
      params: ["query", "filters", "sort_by", "include_ai_suggestions"]
    }
  ];

  return (
    <DocLayout
      title="MCP 集成指南"
      description="深入了解如何集成和使用 Model Context Protocol (MCP) 服务，实现与 AI 模型的高效交互"
      breadcrumbs={[
        { name: "文档", href: "/docs" },
        { name: "MCP 集成", href: "/docs/mcp-integration" }
      ]}
    >
      {/* MCP 简介 */}
      <DocSection title="什么是 MCP" delay={0.1}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            Model Context Protocol (MCP) 是一个开放标准，用于在 AI 应用和外部数据源及工具之间建立安全、可控的连接。
            PromptHub 的 MCP 集成让您能够无缝地与各种 AI 模型和工具进行交互。
          </p>
          
          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">MCP 的核心优势</h4>
            <ul className="space-y-2 text-sm">
              <li>• <strong>标准化接口：</strong>统一的 API 设计，简化集成过程</li>
              <li>• <strong>安全可控：</strong>细粒度的权限控制和安全认证</li>
              <li>• <strong>实时通信：</strong>支持实时数据交换和状态同步</li>
              <li>• <strong>可扩展性：</strong>支持自定义工具和服务扩展</li>
            </ul>
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
              <DocHighlight type="info">
                <h5 className="font-semibold mb-3">我们支持两种连接方式</h5>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>标准 MCP 协议：</strong>通过官方 MCP SDK 连接，完全兼容 MCP 标准</li>
                  <li>• <strong>直接 HTTP API：</strong>无需额外依赖，直接使用 HTTP 请求调用工具</li>
                  <li>• <strong>无需自定义SDK：</strong>我们遵循标准协议，无需安装专门的SDK</li>
                  <li>• <strong>多语言支持：</strong>任何支持 HTTP 或 MCP 协议的语言都可以接入</li>
                </ul>
              </DocHighlight>
              <DocCodeBlock 
                code={installCode}
                title="连接方式选择"
                language="bash"
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">3. 配置连接</h4>
              <DocCodeBlock 
                code={configCode}
                title="配置文件"
                language="json"
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">4. 实际调用示例</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocCodeBlock 
                  code={nodeExample}
                  title="标准 MCP SDK 示例"
                  language="javascript"
                />
                <DocCodeBlock 
                  code={pythonExample}
                  title="HTTP API 调用示例"
                  language="python"
                />
              </div>
              <DocHighlight type="warning">
                <h5 className="font-semibold mb-3">重要说明</h5>
                <ul className="space-y-2 text-sm">
                  <li>• 我们的服务器完全遵循 MCP 标准协议，无需专门的 SDK</li>
                  <li>• 推荐使用官方 MCP SDK 以获得最佳兼容性</li>
                  <li>• HTTP API 方式更简单，适合快速集成和测试</li>
                  <li>• 两种方式功能完全相同，选择最适合您项目的即可</li>
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
              title="标准 MCP 协议"
              description="通过官方 MCP SDK 连接，支持 stdio 传输"
              icon={<CommandLineIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList 
                items={[
                  { title: "stdio 传输", description: "标准输入输出" },
                  { title: "完全兼容", description: "MCP 标准协议" },
                  { title: "类型安全", description: "TypeScript 支持" }
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="HTTP API"
              description="直接 REST API 调用，简单易用"
              icon={<ServerIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList 
                items={[
                  { title: "RESTful API", description: "标准 HTTP 请求" },
                  { title: "多语言支持", description: "任何 HTTP 客户端" },
                  { title: "易于调试", description: "使用常见工具" }
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="Server-Sent Events"
              description="实时事件流，支持长连接"
              icon={<BoltIcon className="h-6 w-6" />}
              color="pink"
            >
              <DocList 
                items={[
                  { title: "实时更新", description: "服务器推送" },
                  { title: "长连接", description: "保持状态同步" },
                  { title: "轻量协议", description: "低开销通信" }
                ]}
                className="mt-4"
              />
            </DocCard>
          </DocGrid>
          
          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">传输方式选择建议</h4>
            <ul className="space-y-2 text-sm">
              <li>• <strong>MCP SDK：</strong>推荐用于新项目，完全兼容 MCP 生态</li>
              <li>• <strong>HTTP API：</strong>适合快速集成和现有系统改造</li>
              <li>• <strong>SSE：</strong>需要实时数据更新的应用场景</li>
              <li>• <strong>端口：</strong>默认运行在 9010 端口</li>
            </ul>
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
                    <p className="text-xs text-gray-400 mt-1">MCP 服务器地址（HTTP API）</p>
                  </div>
                  <div>
                    <code className="text-sm text-gray-300">https://your-domain.com:9010</code>
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
                  { title: "检查网络连接", description: "确保网络正常" },
                  { title: "验证服务器地址", description: "确认 URL 正确" },
                  { title: "检查防火墙设置", description: "允许相关端口" }
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
                  { title: "验证 API 密钥", description: "确认密钥正确" },
                  { title: "检查权限", description: "确认访问权限" },
                  { title: "更新密钥", description: "使用最新密钥" }
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
                   { title: "Web 应用", description: "浏览器端应用" },
                   { title: "移动应用", description: "移动端应用" },
                   { title: "桌面应用", description: "桌面端应用" },
                   { title: "命令行工具", description: "CLI 工具" }
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
                   { title: "工具调用", description: "处理工具调用请求" },
                   { title: "状态管理", description: "维护连接状态" },
                   { title: "权限控制", description: "管理访问权限" },
                   { title: "数据处理", description: "处理数据传输" }
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
                   { title: "GPT 系列", description: "OpenAI 模型" },
                   { title: "Claude 系列", description: "Anthropic 模型" },
                   { title: "本地模型", description: "本地部署模型" },
                   { title: "自定义模型", description: "用户自定义模型" }
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
      <DocSection title="下一步" delay={0.8}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            完成基础集成后，您可以继续探索更多高级功能和最佳实践。
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/docs/api-integration" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              API 集成指南
            </Link>
            <Link 
              href="/docs/best-practices" 
              className="inline-flex items-center px-6 py-3 border border-neon-cyan text-neon-cyan rounded-xl font-medium hover:bg-neon-cyan/10 transition-all duration-300"
            >
              最佳实践
            </Link>
            <Link 
              href="/docs/examples-library" 
              className="inline-flex items-center px-6 py-3 border border-neon-purple text-neon-purple rounded-xl font-medium hover:bg-neon-purple/10 transition-all duration-300"
            >
              示例库
            </Link>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default MCPIntegrationPage;
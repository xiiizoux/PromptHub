import React from 'react';
import Link from 'next/link';
import { CloudIcon, CogIcon, CommandLineIcon, ServerIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const MCPIntegrationPage: React.FC = () => {
  const installCode = `# 安装 MCP SDK
npm install @prompthub/mcp-sdk

# 或使用 Python
pip install prompthub-mcp`;

  const configCode = `{
  "mcp": {
    "server": {
      "url": "https://mcp.prompt-hub.cc",
      "auth": {
        "type": "bearer",
        "token": "your-api-token"
      }
    },
    "client": {
      "timeout": 30000,
      "retries": 3
    }
  }
}`;

  const nodeExample = `import { MCPClient } from '@prompthub/mcp-sdk';

const client = new MCPClient({
  url: 'https://mcp.prompt-hub.cc',
  auth: {
    token: process.env.MCP_API_KEY
  }
});

// 连接到远程 MCP 服务器
await client.connect();

// 调用工具
const result = await client.callTool('generate_prompt', {
  template: 'user_prompt',
  variables: {
    role: 'assistant',
    task: 'help with coding'
  }
});

console.log(result);`;

  const pythonExample = `from prompthub_mcp import MCPClient

# 创建客户端
client = MCPClient(
    url="https://mcp.prompt-hub.cc",
    auth_token=os.getenv("MCP_API_KEY")
)

# 连接并调用远程服务器
async with client:
    result = await client.call_tool("generate_prompt", {
        "template": "user_prompt",
        "variables": {
            "role": "assistant", 
            "task": "help with coding"
        }
    })
    print(result)`;

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
      name: "generate_prompt",
      description: "根据模板和变量生成提示词",
      params: ["template", "variables", "options"]
    },
    {
      name: "analyze_prompt",
      description: "分析提示词质量和效果",
      params: ["prompt", "metrics", "context"]
    },
    {
      name: "optimize_prompt",
      description: "优化提示词结构和效果",
      params: ["prompt", "target", "constraints"]
    },
    {
      name: "validate_prompt",
      description: "验证提示词格式和完整性",
      params: ["prompt", "schema", "strict"]
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
              <h4 className="text-lg font-semibold text-white mb-4">2. 安装 SDK</h4>
              <DocCodeBlock 
                code={installCode}
                title="安装命令"
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
              <h4 className="text-lg font-semibold text-white mb-4">4. 初始化客户端</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocCodeBlock 
                  code={nodeExample}
                  title="Node.js 示例"
                  language="javascript"
                />
                <DocCodeBlock 
                  code={pythonExample}
                  title="Python 示例"
                  language="python"
                />
              </div>
            </div>
          </div>
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
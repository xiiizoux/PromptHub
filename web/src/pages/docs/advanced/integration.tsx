import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const IntegrationPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/advanced" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回高级功能
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统集成</h1>
          <p className="mt-2 text-gray-600">
            学习如何将PromptHub与其他系统集成，包括MCP协议支持和各种集成方案
          </p>
        </div>

        {/* 集成概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">集成概述</h2>
            <p className="text-gray-600 mb-6">
              PromptHub提供多种集成方式，支持与AI工具、开发环境、企业系统的无缝对接。
              通过标准化的API和MCP协议，实现提示词的统一管理和智能调用。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">🔌 MCP协议</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• 标准化提示词交互</li>
                  <li>• 跨平台兼容性</li>
                  <li>• 自动工具发现</li>
                  <li>• 实时通信支持</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">🌐 REST API</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• 完整的CRUD操作</li>
                  <li>• 认证和权限控制</li>
                  <li>• 批量操作支持</li>
                  <li>• 详细的错误处理</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-3">🔧 SDK和工具</h3>
                <ul className="space-y-2 text-purple-700 text-sm">
                  <li>• JavaScript/Node.js SDK</li>
                  <li>• Python客户端库</li>
                  <li>• CLI工具</li>
                  <li>• 浏览器扩展</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* MCP协议集成 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">MCP协议集成</h2>
            <p className="text-gray-600 mb-6">
              Model Context Protocol (MCP) 是一个开放标准，用于AI应用与外部数据源和工具的安全连接。
              PromptHub完全支持MCP协议，提供标准化的提示词管理服务。
            </p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">MCP服务器配置</h3>
                <p className="text-gray-600 mb-4">
                  将PromptHub配置为MCP服务器，为AI工具提供提示词管理功能。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">Claude Desktop配置示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// ~/.claude_desktop_config.json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": [
        "/path/to/prompthub/mcp/dist/src/index.js"
      ],
      "env": {
        "PORT": "9010",
        "API_KEY": "your-secure-api-key",
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key",
        "TRANSPORT_TYPE": "stdio"
      }
    }
  }
}`}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">Cursor IDE配置示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// .cursor/mcp_config.json
{
  "servers": {
    "prompthub": {
      "command": "node",
      "args": ["/path/to/prompthub/mcp/dist/src/index.js"],
      "env": {
        "API_KEY": "your-api-key",
        "STORAGE_TYPE": "supabase"
      }
    }
  }
}`}
                  </pre>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3">💡 配置提示</h4>
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• 确保Node.js版本 ≥ 18.0.0</li>
                    <li>• API密钥需要具有适当的权限</li>
                    <li>• 支持本地文件存储和Supabase云存储</li>
                    <li>• 可以通过环境变量覆盖配置</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">可用的MCP工具</h3>
                <p className="text-gray-600 mb-4">
                  PromptHub提供以下MCP工具，支持完整的提示词生命周期管理：
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">基础管理工具</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• <code>search_prompts</code> - 搜索提示词</li>
                      <li>• <code>get_prompt</code> - 获取特定提示词</li>
                      <li>• <code>create_prompt</code> - 创建新提示词</li>
                      <li>• <code>update_prompt</code> - 更新现有提示词</li>
                      <li>• <code>delete_prompt</code> - 删除提示词</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">高级功能工具</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• <code>list_categories</code> - 获取分类列表</li>
                      <li>• <code>get_prompt_versions</code> - 版本历史</li>
                      <li>• <code>export_prompts</code> - 批量导出</li>
                      <li>• <code>import_prompts</code> - 批量导入</li>
                      <li>• <code>analyze_performance</code> - 性能分析</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">MCP工具使用示例</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">搜索提示词</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// 工具调用
{
  "name": "search_prompts",
  "arguments": {
    "query": "代码审查",
    "category": "编程",
    "limit": 5
  }
}

// 响应结果
{
  "content": [
    {
      "type": "text",
      "text": "找到 3 个匹配的提示词:\\n\\n1. **代码审查助手**\\n   - 描述: 专业的代码质量检查工具\\n   - 分类: 编程\\n   - 标签: 代码, 审查, 质量\\n\\n2. **安全代码审查**\\n   - 描述: 专注于安全漏洞检测\\n   - 分类: 编程\\n   - 标签: 安全, 代码, 审查\\n\\n3. **性能代码审查**\\n   - 描述: 性能优化建议\\n   - 分类: 编程\\n   - 标签: 性能, 代码, 优化"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">创建提示词</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// 工具调用
{
  "name": "create_prompt",
  "arguments": {
    "name": "api-documentation-writer",
    "description": "专业的API文档编写助手",
    "category": "文档",
    "tags": ["API", "文档", "技术写作"],
    "content": "你是一个专业的技术文档编写专家...",
    "is_public": true
  }
}

// 响应结果
{
  "content": [
    {
      "type": "text",
      "text": "✅ 提示词创建成功！\\n\\n**名称:** api-documentation-writer\\n**描述:** 专业的API文档编写助手\\n**分类:** 文档\\n**标签:** API, 文档, 技术写作\\n**状态:** 公开\\n\\n提示词已保存并可以立即使用。"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REST API集成 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">REST API集成</h2>
            <p className="text-gray-600 mb-6">
              对于不支持MCP协议的系统，可以直接使用REST API进行集成。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">API认证</h3>
                <p className="text-gray-600 mb-4">
                  PromptHub支持多种认证方式，确保API调用的安全性。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">API密钥认证</h4>
                    <pre className="text-sm text-gray-700">
{`// 请求头
{
  "x-api-key": "your-api-key",
  "Content-Type": "application/json"
}

// 示例请求
curl -X GET "http://localhost:9010/api/prompts" \\
  -H "x-api-key: your-api-key"`}
                    </pre>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">JWT Token认证</h4>
                    <pre className="text-sm text-gray-700">
{`// 请求头
{
  "Authorization": "Bearer jwt-token",
  "Content-Type": "application/json"
}

// 示例请求
curl -X GET "http://localhost:9010/api/prompts" \\
  -H "Authorization: Bearer jwt-token"`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">核心API端点</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">提示词管理</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">GET</span>
                        <code>/api/prompts</code>
                        <span className="text-gray-600">- 获取提示词列表</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">POST</span>
                        <code>/api/prompts</code>
                        <span className="text-gray-600">- 创建新提示词</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">PUT</span>
                        <code>/api/prompts/:id</code>
                        <span className="text-gray-600">- 更新提示词</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">DELETE</span>
                        <code>/api/prompts/:id</code>
                        <span className="text-gray-600">- 删除提示词</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">搜索和发现</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">GET</span>
                        <code>/api/prompts/search/:query</code>
                        <span className="text-gray-600">- 搜索提示词</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">GET</span>
                        <code>/api/categories</code>
                        <span className="text-gray-600">- 获取分类列表</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">GET</span>
                        <code>/api/tags</code>
                        <span className="text-gray-600">- 获取标签列表</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">批量操作</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">GET</span>
                        <code>/api/export</code>
                        <span className="text-gray-600">- 导出提示词</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">POST</span>
                        <code>/api/import</code>
                        <span className="text-gray-600">- 导入提示词</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SDK和客户端库 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">SDK和客户端库</h2>
            <p className="text-gray-600 mb-6">
              PromptHub提供多种编程语言的SDK，简化集成开发工作。
            </p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">JavaScript/Node.js SDK</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">安装和初始化</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// 安装SDK
npm install @prompthub/client

// 初始化客户端
import { PromptHubClient } from '@prompthub/client';

const client = new PromptHubClient({
  serverUrl: 'http://localhost:9010',
  apiKey: 'your-api-key'
});`}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">基本使用示例</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// 搜索提示词
const prompts = await client.searchPrompts('代码审查', {
  category: '编程',
  limit: 10
});

// 获取特定提示词
const prompt = await client.getPrompt('code-reviewer');

// 创建新提示词
const newPrompt = await client.createPrompt({
  name: 'email-writer',
  description: '专业邮件写作助手',
  category: '文案',
  tags: ['邮件', '写作'],
  content: '你是一个专业的邮件写作专家...',
  isPublic: true
});

// 更新提示词
await client.updatePrompt('email-writer', {
  description: '更新后的描述',
  tags: ['邮件', '写作', '商务']
});`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Python客户端库</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">安装和初始化</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 安装客户端库
pip install prompthub-client

# 初始化客户端
from prompthub import PromptHubClient

client = PromptHubClient(
    server_url='http://localhost:9010',
    api_key='your-api-key'
)`}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">基本使用示例</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 搜索提示词
prompts = client.search_prompts('数据分析', category='分析', limit=5)

# 获取提示词详情
prompt = client.get_prompt('data-analyst')

# 创建新提示词
new_prompt = client.create_prompt(
    name='report-generator',
    description='自动报告生成器',
    category='分析',
    tags=['报告', '数据', '自动化'],
    content='你是一个专业的数据分析师...',
    is_public=True
)

# 批量导出
exported_data = client.export_prompts(
    category='分析',
    format='json'
)`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">CLI工具</h3>
                <p className="text-gray-600 mb-4">
                  命令行工具提供快速的提示词管理功能，适合脚本化操作。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 安装CLI工具
npm install -g @prompthub/cli

# 配置服务器连接
prompthub config set server http://localhost:9010
prompthub config set apikey your-api-key

# 搜索提示词
prompthub search "代码审查" --category=编程

# 获取提示词详情
prompthub get code-reviewer

# 创建新提示词
prompthub create --name="test-writer" \\
  --description="测试用例编写助手" \\
  --category="测试" \\
  --tags="测试,自动化" \\
  --file="./prompt-content.txt"

# 导出提示词
prompthub export --category="编程" --format=json > prompts.json

# 导入提示词
prompthub import prompts.json`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 企业级集成 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">企业级集成</h2>
            <p className="text-gray-600 mb-6">
              针对企业环境的特殊需求，PromptHub提供高级集成功能。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">单点登录(SSO)集成</h3>
                <p className="text-gray-600 mb-4">
                  支持与企业身份认证系统集成，实现统一的用户管理。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">SAML 2.0</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 支持主流身份提供商</li>
                      <li>• 自动用户属性映射</li>
                      <li>• 角色和权限同步</li>
                      <li>• 单点登出支持</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">OAuth 2.0 / OpenID Connect</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Azure AD集成</li>
                      <li>• Google Workspace支持</li>
                      <li>• 自定义OAuth提供商</li>
                      <li>• 令牌刷新机制</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">企业数据集成</h3>
                <p className="text-gray-600 mb-4">
                  与企业现有系统和数据源进行深度集成。
                </p>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">知识库集成</h4>
                    <p className="text-sm text-gray-600 mb-3">连接企业知识库，自动同步和更新提示词内容</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>支持系统：</strong> Confluence, SharePoint, Notion, 自定义CMS
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">版本控制集成</h4>
                    <p className="text-sm text-gray-600 mb-3">与代码仓库集成，实现提示词的版本化管理</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>支持平台：</strong> GitHub, GitLab, Bitbucket, Azure DevOps
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">监控和审计</h4>
                    <p className="text-sm text-gray-600 mb-3">集成企业监控系统，提供详细的使用审计</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>支持工具：</strong> Splunk, ELK Stack, Datadog, 自定义SIEM
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">API网关集成</h3>
                <p className="text-gray-600 mb-4">
                  通过API网关统一管理和保护PromptHub API访问。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# Kong API Gateway配置示例
services:
  - name: prompthub-api
    url: http://prompthub:9010
    
routes:
  - name: prompthub-routes
    service: prompthub-api
    paths:
      - /api/v1/prompts
    
plugins:
  - name: key-auth
    config:
      key_names: ["x-api-key"]
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
  - name: cors
    config:
      origins: ["https://your-domain.com"]`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 常见集成场景 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">常见集成场景</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">AI开发工具集成</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">Claude Desktop</h4>
                    <p className="text-sm text-gray-600 mb-3">通过MCP协议直接在Claude中使用提示词</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• 实时搜索和插入提示词</li>
                      <li>• 自动保存优质对话为提示词</li>
                      <li>• 版本管理和协作功能</li>
                    </ul>
                  </div>
                  
                  <div className="border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3">Cursor IDE</h4>
                    <p className="text-sm text-gray-600 mb-3">在代码编辑器中直接访问编程相关提示词</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• 代码审查提示词快速调用</li>
                      <li>• 自动代码注释生成</li>
                      <li>• 重构建议和最佳实践</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">企业应用集成</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">客服系统集成</h4>
                    <p className="text-sm text-gray-600 mb-3">为客服人员提供标准化的回复模板和处理流程</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>应用场景：</strong> 常见问题回复、投诉处理、产品介绍、技术支持
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">内容管理系统</h4>
                    <p className="text-sm text-gray-600 mb-3">为内容创作者提供写作模板和风格指南</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>应用场景：</strong> 营销文案、技术文档、社交媒体内容、新闻稿
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">培训和学习平台</h4>
                    <p className="text-sm text-gray-600 mb-3">提供个性化的学习内容和练习题目</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>应用场景：</strong> 在线课程、技能评估、知识问答、学习路径推荐
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">开发工作流集成</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">CI/CD流水线集成</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# GitHub Actions示例
name: Sync Prompts
on:
  push:
    paths: ['prompts/**']

jobs:
  sync-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install PromptHub CLI
        run: npm install -g @prompthub/cli
        
      - name: Configure PromptHub
        run: |
          prompthub config set server \${{ secrets.PROMPTHUB_URL }}
          prompthub config set apikey \${{ secrets.PROMPTHUB_API_KEY }}
          
      - name: Sync Prompts
        run: |
          for file in prompts/*.json; do
            prompthub import "$file"
          done`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 安全和最佳实践 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">安全和最佳实践</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">API安全</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-3">安全要求</h4>
                    <ul className="text-red-700 text-sm space-y-2">
                      <li>• 使用HTTPS加密传输</li>
                      <li>• 定期轮换API密钥</li>
                      <li>• 实施访问频率限制</li>
                      <li>• 监控异常访问模式</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3">权限控制</h4>
                    <ul className="text-green-700 text-sm space-y-2">
                      <li>• 最小权限原则</li>
                      <li>• 基于角色的访问控制</li>
                      <li>• 资源级别权限管理</li>
                      <li>• 审计日志记录</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">数据保护</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">敏感数据处理</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 避免在提示词中包含敏感信息</li>
                      <li>• 使用变量替换敏感数据</li>
                      <li>• 实施数据分类和标记</li>
                      <li>• 定期进行安全审计</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">合规性要求</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• GDPR数据保护合规</li>
                      <li>• SOC 2安全标准</li>
                      <li>• 行业特定合规要求</li>
                      <li>• 数据本地化支持</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">性能优化</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">集成优化建议</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• 实施客户端缓存减少API调用</li>
                    <li>• 使用批量操作提高效率</li>
                    <li>• 合理设置超时和重试机制</li>
                    <li>• 监控API使用量和性能指标</li>
                    <li>• 使用CDN加速静态资源访问</li>
                    <li>• 实施连接池管理</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🔗 系统集成最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">集成策略</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 优先使用MCP协议实现标准化集成</li>
                <li>• 为不同场景选择合适的集成方式</li>
                <li>• 实施渐进式集成和测试</li>
                <li>• 建立完善的错误处理机制</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">运维管理</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 建立监控和告警体系</li>
                <li>• 定期进行安全审计</li>
                <li>• 维护详细的集成文档</li>
                <li>• 制定应急响应计划</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 技术支持 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">技术支持</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">开发资源</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>API文档</strong> - 完整的接口说明</li>
                  <li>• <strong>SDK文档</strong> - 各语言客户端库</li>
                  <li>• <strong>示例代码</strong> - 集成参考实现</li>
                  <li>• <strong>最佳实践</strong> - 经验总结和建议</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">社区支持</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>GitHub Issues</strong> - 问题报告和功能请求</li>
                  <li>• <strong>Discord社区</strong> - 实时技术交流</li>
                  <li>• <strong>技术博客</strong> - 深度技术文章</li>
                  <li>• <strong>视频教程</strong> - 集成演示和指导</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步学习</h2>
            <p className="text-gray-600 mb-4">
              现在您已经了解了系统集成的各种方案，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/api/authentication" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">API认证</h3>
                <p className="text-sm text-gray-600">深入了解API认证和安全机制</p>
              </Link>
              
              <Link href="/docs/advanced/performance-tracking" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">性能追踪</h3>
                <p className="text-sm text-gray-600">监控和优化集成系统的性能</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPage; 
import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const MCPIntegrationPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回文档首页
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MCP集成指南</h1>
          <p className="mt-2 text-gray-600">
            学习如何将PromptHub与AI工具通过MCP协议进行集成，实现无缝的提示词管理
          </p>
        </div>

        {/* MCP协议概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">什么是MCP协议？</h2>
            <p className="text-gray-600 mb-6">
              Model Context Protocol (MCP) 是一个开放标准，用于AI应用与外部数据源和工具的安全连接。
              PromptHub完全支持MCP协议，为AI工具提供标准化的提示词管理服务。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">🔌 标准化连接</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• 跨平台兼容性</li>
                  <li>• 自动工具发现</li>
                  <li>• 实时通信支持</li>
                  <li>• 安全认证机制</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">🚀 即插即用</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• 零配置启动</li>
                  <li>• 自动服务发现</li>
                  <li>• 动态工具注册</li>
                  <li>• 热插拔支持</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-3">🛡️ 安全可靠</h3>
                <ul className="space-y-2 text-purple-700 text-sm">
                  <li>• API密钥认证</li>
                  <li>• 权限精细控制</li>
                  <li>• 数据加密传输</li>
                  <li>• 审计日志记录</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 支持的AI工具 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">支持的AI工具</h2>
            <p className="text-gray-600 mb-6">
              PromptHub已与多个主流AI工具进行了深度集成：
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🤖 Claude Desktop</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Anthropic官方桌面应用，支持MCP协议的完整功能。
                </p>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 一键连接PromptHub</li>
                  <li>• 智能提示词推荐</li>
                  <li>• 实时协作编辑</li>
                  <li>• 对话历史同步</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">💻 Cursor IDE</h3>
                <p className="text-gray-600 text-sm mb-3">
                  专为AI编程设计的集成开发环境。
                </p>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 代码提示词集成</li>
                  <li>• 项目上下文感知</li>
                  <li>• 自动代码生成</li>
                  <li>• Git集成支持</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🔧 自定义工具</h3>
                <p className="text-gray-600 text-sm mb-3">
                  支持任何实现MCP协议的自定义工具。
                </p>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 开放协议标准</li>
                  <li>• 详细开发文档</li>
                  <li>• 示例代码库</li>
                  <li>• 社区技术支持</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🌐 浏览器扩展</h3>
                <p className="text-gray-600 text-sm mb-3">
                  通过浏览器扩展在网页中使用提示词。
                </p>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 网页内容增强</li>
                  <li>• 一键插入提示词</li>
                  <li>• 智能表单填充</li>
                  <li>• 跨站点同步</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 快速配置 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">快速配置指南</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Claude Desktop 配置</h3>
                <p className="text-gray-600 mb-4">
                  在Claude Desktop中配置PromptHub连接：
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">配置文件路径</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">macOS:</p>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Windows:</p>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">%APPDATA%\Claude\claude_desktop_config.json</code>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">配置内容</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
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
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cursor IDE 配置</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">项目配置文件</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    在项目根目录创建 <code className="bg-gray-200 px-1 py-0.5 rounded">.cursor/mcp_config.json</code>：
                  </p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
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
              </div>
            </div>
          </div>
        </div>

        {/* MCP工具列表 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">可用的MCP工具</h2>
            <p className="text-gray-600 mb-6">
              PromptHub提供以下MCP工具，支持完整的提示词生命周期管理：
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">基础管理工具</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">search_prompts</h4>
                    <p className="text-gray-600 text-xs">根据关键词搜索提示词</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">get_prompt</h4>
                    <p className="text-gray-600 text-xs">获取特定提示词的详细信息</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">create_prompt</h4>
                    <p className="text-gray-600 text-xs">创建新的提示词</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">update_prompt</h4>
                    <p className="text-gray-600 text-xs">更新现有提示词</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">高级功能工具</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">list_categories</h4>
                    <p className="text-gray-600 text-xs">获取所有可用的提示词分类</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">get_prompt_versions</h4>
                    <p className="text-gray-600 text-xs">查看提示词的版本历史</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">export_prompts</h4>
                    <p className="text-gray-600 text-xs">批量导出提示词数据</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 text-sm">analyze_performance</h4>
                    <p className="text-gray-600 text-xs">获取提示词性能分析数据</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">使用示例</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">搜索提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">工具调用</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto mb-4">
{`{
  "name": "search_prompts",
  "arguments": {
    "query": "代码审查",
    "category": "编程",
    "limit": 5
  }
}`}
                  </pre>
                  
                  <h4 className="font-medium text-gray-800 mb-2">响应结果</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "content": [
    {
      "type": "text",
      "text": "找到 3 个匹配的提示词:\\n\\n1. **代码审查助手**\\n   - 描述: 专业的代码质量检查工具\\n   - 分类: 编程\\n   - 标签: 代码, 审查, 质量\\n\\n2. **安全代码审查**\\n   - 描述: 专注于安全漏洞检测\\n   - 分类: 编程\\n   - 标签: 安全, 代码, 审查"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">创建提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">工具调用</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "name": "create_prompt",
  "arguments": {
    "name": "email-writer",
    "description": "专业邮件写作助手",
    "category": "商务办公",
    "tags": ["邮件", "写作", "商务"],
    "messages": [
      {
        "role": "system",
        "content": {
          "type": "text",
          "text": "你是一个专业的邮件写作助手。请根据用户的需求，撰写正式、礼貌且清晰的商务邮件。"
        }
      }
    ]
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 开发者集成 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">开发者集成</h2>
            <p className="text-gray-600 mb-6">
              为开发者提供多种编程语言的集成示例：
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Node.js集成</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`const { MCPClient } = require('@prompthub/mcp-client');

const client = new MCPClient({
  serverUrl: 'http://localhost:9010',
  apiKey: 'your-api-key'
});

async function searchPrompts(query) {
  try {
    const result = await client.callTool('search_prompts', {
      query: query,
      limit: 10
    });
    
    console.log('搜索结果:', result);
    return result;
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// 使用示例
searchPrompts('创意写作').then(results => {
  console.log('找到的提示词:', results);
});`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Python集成</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`import requests
import json

class PromptHubMCP:
    def __init__(self, server_url='http://localhost:9010', api_key=None):
        self.server_url = server_url
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }
    
    def search_prompts(self, query, category=None, limit=10):
        """搜索提示词"""
        data = {
            'name': 'search_prompts',
            'arguments': {
                'query': query,
                'limit': limit
            }
        }
        if category:
            data['arguments']['category'] = category
            
        response = requests.post(
            f"{self.server_url}/tools/search_prompts/invoke",
            headers=self.headers,
            data=json.dumps(data)
        )
        
        return response.json()
    
    def get_prompt(self, name):
        """获取特定提示词"""
        data = {
            'name': 'get_prompt',
            'arguments': {'name': name}
        }
        
        response = requests.post(
            f"{self.server_url}/tools/get_prompt/invoke",
            headers=self.headers,
            data=json.dumps(data)
        )
        
        return response.json()

# 使用示例
hub = PromptHubMCP(api_key='your-api-key')
results = hub.search_prompts('代码审查', category='编程')
print(json.dumps(results, indent=2, ensure_ascii=False))`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 故障排除 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">故障排除</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">常见问题</h3>
                
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">连接失败</h4>
                    <p className="text-red-700 text-sm mb-2">
                      <strong>问题：</strong>无法连接到PromptHub MCP服务器
                    </p>
                    <p className="text-red-700 text-sm mb-2">
                      <strong>解决方案：</strong>
                    </p>
                    <ul className="text-red-700 text-sm space-y-1 ml-4">
                      <li>• 确认MCP服务器正在运行（端口9010）</li>
                      <li>• 检查API密钥是否正确配置</li>
                      <li>• 验证网络连接和防火墙设置</li>
                      <li>• 查看服务器日志获取详细错误信息</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">权限被拒绝</h4>
                    <p className="text-yellow-700 text-sm mb-2">
                      <strong>问题：</strong>API调用返回401或403错误
                    </p>
                    <p className="text-yellow-700 text-sm mb-2">
                      <strong>解决方案：</strong>
                    </p>
                    <ul className="text-yellow-700 text-sm space-y-1 ml-4">
                      <li>• 检查API密钥是否有效且未过期</li>
                      <li>• 确认用户权限设置正确</li>
                      <li>• 验证请求头中的认证信息</li>
                      <li>• 联系管理员重新分配权限</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">工具未找到</h4>
                    <p className="text-blue-700 text-sm mb-2">
                      <strong>问题：</strong>AI工具无法发现MCP服务器提供的工具
                    </p>
                    <p className="text-blue-700 text-sm mb-2">
                      <strong>解决方案：</strong>
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1 ml-4">
                      <li>• 重启AI工具应用程序</li>
                      <li>• 检查MCP配置文件语法</li>
                      <li>• 确认服务器路径和参数正确</li>
                      <li>• 查看工具发现日志</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">调试技巧</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">启用详细日志</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    在环境变量中添加调试模式：
                  </p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`export DEBUG=true
export LOG_LEVEL=debug
export MCP_VERBOSE=true`}
                  </pre>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h4 className="font-medium text-gray-800 mb-3">测试连接</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    使用curl测试MCP服务器是否正常运行：
                  </p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`curl -X POST http://localhost:9010/tools/search_prompts/invoke \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{"name": "search_prompts", "arguments": {"query": "test"}}'`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 相关链接 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">进一步学习</h2>
          <p className="text-gray-600 mb-6">
            探索更多PromptHub的高级功能：
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/docs/api" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">📚 API参考</h3>
              <p className="text-gray-600 text-sm">完整的API文档和示例代码</p>
            </Link>
            
            <Link href="/docs/advanced/performance-tracking" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">📊 性能分析</h3>
              <p className="text-gray-600 text-sm">学习如何分析和优化提示词性能</p>
            </Link>
            
            <Link href="/docs/best-practices" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">💡 最佳实践</h3>
              <p className="text-gray-600 text-sm">提示词设计和使用的最佳实践</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPIntegrationPage;
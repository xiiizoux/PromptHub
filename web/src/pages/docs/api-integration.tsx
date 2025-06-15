import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const APIIntegrationPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">API集成指南</h1>
          <p className="mt-2 text-gray-600">
            学习如何通过REST API将PromptHub集成到您的应用程序中
          </p>
        </div>

        {/* API概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API概述</h2>
            <p className="text-gray-600 mb-6">
              PromptHub提供完整的RESTful API，支持提示词的增删改查、用户认证、性能分析等功能。
              所有API端点都支持JSON格式，遵循REST设计原则。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">🔑 认证方式</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• API密钥认证</li>
                  <li>• Bearer Token</li>
                  <li>• 用户会话认证</li>
                  <li>• OAuth 2.0支持</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">🌐 响应格式</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• 统一JSON响应</li>
                  <li>• 标准HTTP状态码</li>
                  <li>• 详细错误信息</li>
                  <li>• 分页数据支持</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 快速开始 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">快速开始</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 获取API密钥</h3>
                <p className="text-gray-600 mb-4">
                  首先需要在PromptHub中生成API密钥：
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="text-gray-700 text-sm space-y-2">
                    <li><strong>1. 登录账户</strong> - 访问PromptHub并登录您的账户</li>
                    <li><strong>2. 进入设置</strong> - 点击用户头像 → 个人设置</li>
                    <li><strong>3. API密钥管理</strong> - 选择"API密钥"标签页</li>
                    <li><strong>4. 创建密钥</strong> - 点击"创建新密钥"并设置权限</li>
                    <li><strong>5. 保存密钥</strong> - 复制并安全存储您的API密钥</li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 基础请求示例</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">获取提示词列表</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/prompts" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 提示词管理API */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">提示词管理API</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">获取提示词列表</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mr-3">GET</span>
                    <code className="text-sm text-gray-700">/api/prompts</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">查询参数</h4>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div>• <code>page</code> - 页码（默认：1）</div>
                    <div>• <code>limit</code> - 每页数量（默认：20）</div>
                    <div>• <code>category</code> - 按分类筛选</div>
                    <div>• <code>search</code> - 搜索关键词</div>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">响应示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "uuid",
        "name": "general_assistant",
        "description": "通用助手提示词",
        "category": "通用",
        "tags": ["对话", "助手", "基础"],
        "is_public": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">获取单个提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mr-3">GET</span>
                    <code className="text-sm text-gray-700">/api/prompts/:name</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">路径参数</h4>
                  <div className="text-sm text-gray-600 mb-4">
                    • <code>name</code> - 提示词名称
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">响应示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "success": true,
  "data": {
    "prompt": {
      "id": "uuid",
      "name": "general_assistant",
      "description": "通用助手提示词",
      "messages": [
        {
          "role": "system",
          "content": {
            "type": "text",
            "text": "你是一个有用的AI助手。"
          }
        }
      ],
      "category": "通用",
      "tags": ["对话", "助手", "基础"],
      "version": 1,
      "is_public": true,
      "author": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">创建提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3">POST</span>
                    <code className="text-sm text-gray-700">/api/prompts</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">请求体</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto mb-4">
{`{
  "name": "code_reviewer",
  "description": "专业的代码审查助手",
  "category": "编程",
  "tags": ["代码", "审查", "质量"],
  "messages": [
    {
      "role": "system",
      "content": {
        "type": "text",
        "text": "你是一个专业的代码审查员。请仔细审查提供的代码，指出潜在问题和改进建议。"
      }
    }
  ],
  "is_public": false
}`}
                  </pre>
                  
                  <h4 className="font-medium text-gray-800 mb-2">响应示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "success": true,
  "message": "Prompt created successfully",
  "data": {
    "id": "new-uuid",
    "name": "code_reviewer"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">更新提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded mr-3">PUT</span>
                    <code className="text-sm text-gray-700">/api/prompts/:name</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">请求体</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto mb-4">
{`{
  "description": "更新的描述",
  "category": "新分类",
  "tags": ["新标签1", "新标签2"],
  "messages": [
    {
      "role": "system",
      "content": {
        "type": "text",
        "text": "更新的提示词内容"
      }
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">删除提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded mr-3">DELETE</span>
                    <code className="text-sm text-gray-700">/api/prompts/:name</code>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                    <p className="text-yellow-700 text-sm">
                      ⚠️ <strong>注意：</strong>删除操作不可恢复，请谨慎使用。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索API */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">搜索API</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">搜索提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mr-3">GET</span>
                    <code className="text-sm text-gray-700">/api/prompts/search/:query</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">路径参数</h4>
                  <div className="text-sm text-gray-600 mb-4">
                    • <code>query</code> - 搜索关键词
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">查询参数</h4>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div>• <code>category</code> - 按分类筛选</div>
                    <div>• <code>limit</code> - 结果数量限制</div>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">使用示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/prompts/search/代码审查?category=编程&limit=5" \\
  -H "Authorization: Bearer your-api-key"`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 用户认证API */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">用户认证API</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">用户注册</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3">POST</span>
                    <code className="text-sm text-gray-700">/api/auth/register</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">请求体</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "email": "user@example.com",
  "password": "securePassword123",
  "display_name": "Example User"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">用户登录</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3">POST</span>
                    <code className="text-sm text-gray-700">/api/auth/login</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">请求体</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto mb-4">
{`{
  "email": "user@example.com",
  "password": "securePassword123"
}`}
                  </pre>
                  
                  <h4 className="font-medium text-gray-800 mb-2">响应示例</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Example User"
    },
    "token": "jwt-token"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI功能API */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI功能API</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">智能分析</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3">POST</span>
                    <code className="text-sm text-gray-700">/api/ai-analyze</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">请求体</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto mb-4">
{`{
  "content": "你的提示词内容",
  "action": "full_analyze",
  "config": {
    "language": "zh",
    "includeImprovements": true,
    "includeSuggestions": true
  }
}`}
                  </pre>
                  
                  <h4 className="font-medium text-gray-800 mb-2">支持的分析类型</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• <code>full_analyze</code> - 完整分析</div>
                    <div>• <code>quick_classify</code> - 快速分类</div>
                    <div>• <code>extract_tags</code> - 提取标签</div>
                    <div>• <code>extract_variables</code> - 提取变量</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 性能分析API */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能分析API</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">记录使用数据</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3">POST</span>
                    <code className="text-sm text-gray-700">/api/analytics/usage</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">请求体</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "prompt_id": "uuid",
  "prompt_version": 1,
  "model": "gpt-4",
  "input_tokens": 50,
  "output_tokens": 150,
  "latency_ms": 550,
  "session_id": "session-123"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">获取性能数据</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mr-3">GET</span>
                    <code className="text-sm text-gray-700">/api/analytics/performance/:prompt_id</code>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">查询参数</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• <code>version</code> - 指定版本（可选）</div>
                    <div>• <code>days</code> - 时间范围（默认30天）</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 错误处理 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">错误处理</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">标准错误格式</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
{`{
  "success": false,
  "error": "错误消息",
  "code": "ERROR_CODE",
  "details": {
    "field": "具体错误字段",
    "message": "详细错误说明"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">常见错误代码</h3>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">400 - 请求错误</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• 请求参数缺失或格式错误</li>
                      <li>• JSON格式不正确</li>
                      <li>• 必需字段为空</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">401 - 未授权</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• API密钥无效或过期</li>
                      <li>• 缺少认证信息</li>
                      <li>• 用户会话已过期</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">404 - 资源不存在</h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• 提示词不存在</li>
                      <li>• API端点不存在</li>
                      <li>• 用户无权访问资源</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-2">429 - 请求过于频繁</h4>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• 超出API调用限额</li>
                      <li>• 需要等待后重试</li>
                      <li>• 考虑升级API套餐</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SDK和工具 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">SDK和工具</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🟨 JavaScript SDK</h3>
                <p className="text-gray-600 text-sm mb-3">
                  官方JavaScript/Node.js SDK，简化API集成。
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-xs text-gray-700">
{`npm install @prompthub/js-sdk

import { PromptHub } from '@prompthub/js-sdk';

const hub = new PromptHub({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com'
});

const prompts = await hub.prompts.list();`}
                  </pre>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🐍 Python SDK</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Python客户端库，支持异步操作。
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-xs text-gray-700">
{`pip install prompthub-python

from prompthub import PromptHub

hub = PromptHub(
    api_key='your-api-key',
    base_url='https://your-domain.com'
)

prompts = hub.prompts.list()`}
                  </pre>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">⚡ CLI工具</h3>
                <p className="text-gray-600 text-sm mb-3">
                  命令行工具，方便批量操作和自动化。
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-xs text-gray-700">
{`npm install -g @prompthub/cli

# 配置API密钥
prompthub config set api_key your-key

# 列出提示词
prompthub prompts list

# 创建提示词
prompthub prompts create --file prompt.json`}
                  </pre>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🌐 Postman集合</h3>
                <p className="text-gray-600 text-sm mb-3">
                  完整的Postman API集合，包含所有端点和示例。
                </p>
                <div className="mt-3">
                  <a href="#" className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    下载Postman集合
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">最佳实践</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">安全性</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="text-red-700 text-sm space-y-2">
                    <li>• 永远不要在客户端代码中暴露API密钥</li>
                    <li>• 使用HTTPS进行所有API调用</li>
                    <li>• 定期轮换API密钥</li>
                    <li>• 设置适当的权限范围</li>
                    <li>• 监控API使用情况和异常访问</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">性能优化</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• 实现客户端缓存减少重复请求</li>
                    <li>• 使用分页避免一次性加载过多数据</li>
                    <li>• 合理设置请求超时时间</li>
                    <li>• 实现指数退避的重试机制</li>
                    <li>• 批量操作时使用适当的并发控制</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">错误处理</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="text-yellow-700 text-sm space-y-2">
                    <li>• 始终检查API响应的success字段</li>
                    <li>• 实现全面的错误处理和用户友好的错误信息</li>
                    <li>• 记录详细的错误日志用于调试</li>
                    <li>• 对网络错误实现自动重试机制</li>
                    <li>• 为不同类型的错误提供相应的处理策略</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 相关链接 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">相关资源</h2>
          <p className="text-gray-600 mb-6">
            更多集成和开发资源：
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/docs/mcp-integration" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">🔌 MCP集成</h3>
              <p className="text-gray-600 text-sm">了解如何通过MCP协议集成AI工具</p>
            </Link>
            
            <Link href="/docs/basic-features" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">📖 基础功能</h3>
              <p className="text-gray-600 text-sm">掌握PromptHub的核心功能和使用方法</p>
            </Link>
            
            <Link href="/docs/examples-library" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">📚 示例库</h3>
              <p className="text-gray-600 text-sm">丰富的代码示例和最佳实践</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIIntegrationPage;
</rewritten_file>
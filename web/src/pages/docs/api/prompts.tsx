import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const PromptsApiPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/api" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回API参考
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提示词 API</h1>
          <p className="mt-2 text-gray-600">
            完整的提示词管理API文档，包括创建、查询、更新和删除操作
          </p>
        </div>

        {/* API概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API 概述</h2>
            <p className="text-gray-600 mb-4">
              提示词API提供了完整的CRUD操作，支持批量操作、高级搜索和性能分析。所有API都需要适当的认证。
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">基础URL</h3>
              <code className="bg-gray-800 text-white px-3 py-1 rounded">https://api.prompthub.com/v1</code>
            </div>
          </div>
        </div>

        {/* 获取提示词列表 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">获取提示词列表</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">请求</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /prompts

# 查询参数
?page=1              # 页码，默认为1
&limit=20            # 每页数量，默认20，最大100
&category=编程       # 按类别筛选
&tags=javascript,ai  # 按标签筛选，逗号分隔
&search=代码审查     # 关键词搜索
&public=true         # 只显示公开提示词
&sort=created_at     # 排序字段：created_at, updated_at, name, usage_count
&order=desc          # 排序方向：asc, desc`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "prompt-123",
        "name": "code-reviewer",
        "description": "专业的代码审查助手",
        "content": "你是一个经验丰富的代码审查员...",
        "category": "编程",
        "tags": ["代码", "审查", "质量"],
        "is_public": true,
        "created_by": "user-456",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "usage_count": 150,
        "rating": 4.8,
        "version": "1.2.0"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 获取单个提示词 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">获取单个提示词</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">请求</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /prompts/{id}

# 路径参数
{id}  # 提示词ID或名称

# 查询参数
?include_stats=true    # 包含使用统计
?include_versions=true # 包含版本历史`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "id": "prompt-123",
    "name": "code-reviewer",
    "description": "专业的代码审查助手",
    "content": "你是一个经验丰富的代码审查员...",
    "category": "编程",
    "tags": ["代码", "审查", "质量"],
    "is_public": true,
    "created_by": "user-456",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "version": "1.2.0",
    "stats": {
      "usage_count": 150,
      "rating": 4.8,
      "avg_response_time": 1.2,
      "success_rate": 0.95
    },
    "versions": [
      {
        "version": "1.2.0",
        "created_at": "2024-01-01T00:00:00Z",
        "changes": "优化了输出格式"
      },
      {
        "version": "1.1.0",
        "created_at": "2023-12-01T00:00:00Z",
        "changes": "添加了错误处理"
      }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 创建提示词 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">创建提示词</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">请求</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /prompts
Content-Type: application/json

{
  "name": "email-writer",
  "description": "专业的邮件写作助手",
  "content": "你是一个专业的邮件写作助手...",
  "category": "文案",
  "tags": ["邮件", "写作", "商务"],
  "is_public": false,
  "variables": [
    {
      "name": "recipient",
      "description": "收件人姓名",
      "type": "string",
      "required": true
    },
    {
      "name": "tone",
      "description": "邮件语调",
      "type": "string",
      "default": "正式",
      "options": ["正式", "友好", "紧急"]
    }
  ]
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "id": "prompt-789",
    "name": "email-writer",
    "description": "专业的邮件写作助手",
    "content": "你是一个专业的邮件写作助手...",
    "category": "文案",
    "tags": ["邮件", "写作", "商务"],
    "is_public": false,
    "created_by": "user-456",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "version": "1.0.0"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 更新提示词 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">更新提示词</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">请求</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`PUT /prompts/{id}
Content-Type: application/json

{
  "description": "更新后的描述",
  "content": "更新后的提示词内容...",
  "tags": ["邮件", "写作", "商务", "AI"],
  "version_notes": "添加了新的变量支持"
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "id": "prompt-789",
    "name": "email-writer",
    "description": "更新后的描述",
    "content": "更新后的提示词内容...",
    "updated_at": "2024-01-01T13:00:00Z",
    "version": "1.1.0",
    "previous_version": "1.0.0"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 删除提示词 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">删除提示词</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">请求</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`DELETE /prompts/{id}

# 查询参数
?force=false  # 是否强制删除（跳过软删除）`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "id": "prompt-789",
    "deleted_at": "2024-01-01T14:00:00Z",
    "message": "提示词已成功删除"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 批量操作 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">批量操作</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">批量获取</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /prompts/batch
Content-Type: application/json

{
  "ids": ["prompt-123", "prompt-456", "prompt-789"],
  "include_stats": true
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">批量更新标签</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`PUT /prompts/batch/tags
Content-Type: application/json

{
  "ids": ["prompt-123", "prompt-456"],
  "action": "add",  # add, remove, replace
  "tags": ["新标签", "批量更新"]
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">批量删除</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`DELETE /prompts/batch
Content-Type: application/json

{
  "ids": ["prompt-123", "prompt-456"],
  "force": false
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 错误响应 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">错误响应</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">400 Bad Request</h3>
                <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm">
{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "name": ["名称不能为空"],
      "content": ["内容长度不能超过10000字符"]
    }
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">404 Not Found</h3>
                <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm">
{`{
  "success": false,
  "error": {
    "code": "PROMPT_NOT_FOUND",
    "message": "指定的提示词不存在"
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">409 Conflict</h3>
                <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm">
{`{
  "success": false,
  "error": {
    "code": "PROMPT_NAME_EXISTS",
    "message": "提示词名称已存在",
    "suggestion": "请使用不同的名称或更新现有提示词"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">💡 API 使用最佳实践</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• 使用分页避免一次性获取大量数据</li>
            <li>• 合理使用缓存减少API调用次数</li>
            <li>• 实施重试机制处理临时错误</li>
            <li>• 使用批量操作提高效率</li>
            <li>• 监控API使用量避免超出限制</li>
            <li>• 在更新操作中包含版本说明</li>
          </ul>
        </div>

        {/* 代码示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">代码示例</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">JavaScript/Node.js</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`// 获取提示词列表
async function getPrompts(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(\`https://api.prompthub.com/v1/prompts?\${params}\`, {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }
  
  return await response.json();
}

// 创建新提示词
async function createPrompt(promptData) {
  const response = await fetch('https://api.prompthub.com/v1/prompts', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(promptData)
  });
  
  return await response.json();
}

// 使用示例
const prompts = await getPrompts({ category: '编程', limit: 10 });
console.log(\`找到 \${prompts.data.pagination.total} 个提示词\`);`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Python</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`import requests
import json

class PromptHubAPI:
    def __init__(self, api_key, base_url="https://api.prompthub.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_prompts(self, **filters):
        """获取提示词列表"""
        response = requests.get(
            f"{self.base_url}/prompts",
            headers=self.headers,
            params=filters
        )
        response.raise_for_status()
        return response.json()
    
    def create_prompt(self, prompt_data):
        """创建新提示词"""
        response = requests.post(
            f"{self.base_url}/prompts",
            headers=self.headers,
            json=prompt_data
        )
        response.raise_for_status()
        return response.json()
    
    def update_prompt(self, prompt_id, updates):
        """更新提示词"""
        response = requests.put(
            f"{self.base_url}/prompts/{prompt_id}",
            headers=self.headers,
            json=updates
        )
        response.raise_for_status()
        return response.json()

# 使用示例
api = PromptHubAPI('your-api-key')
prompts = api.get_prompts(category='编程', limit=10)
print(f"找到 {prompts['data']['pagination']['total']} 个提示词")`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptsApiPage; 
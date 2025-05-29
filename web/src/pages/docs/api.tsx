import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const ApiDocsPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">API参考</h1>
          <p className="mt-2 text-gray-600">
            完整的API文档，帮助您将提示词集成到自己的应用程序中
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">认证</h2>
            <p className="text-gray-600 mb-6">
              所有API请求都需要进行身份验证。MCP Prompt Server支持以下认证方式：
            </p>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">API密钥认证</h3>
                <p className="text-sm text-gray-600 mb-3">
                  您可以通过以下任一方式提供API密钥：
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">1. 请求头</p>
                    <pre className="mt-1 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                      <code>
                        {`x-api-key: your-api-key`}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">2. Bearer令牌</p>
                    <pre className="mt-1 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                      <code>
                        {`Authorization: Bearer your-api-key`}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">3. 查询参数</p>
                    <pre className="mt-1 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                      <code>
                        {`https://your-server.com/api/prompts?api_key=your-api-key`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">提示词API</h2>
            
            <div className="space-y-8">
              {/* 获取提示词列表 */}
              <div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">GET</span>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">/prompts</h3>
                </div>
                <p className="mt-2 text-gray-600 mb-4">获取提示词列表</p>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">查询参数</h4>
                  <div className="bg-gray-50 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数名</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">category</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">string</td>
                          <td className="px-4 py-2 text-sm text-gray-500">按类别筛选提示词</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">tags</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">string[]</td>
                          <td className="px-4 py-2 text-sm text-gray-500">按标签筛选提示词</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">search</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">string</td>
                          <td className="px-4 py-2 text-sm text-gray-500">在名称和描述中搜索</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">author</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">string</td>
                          <td className="px-4 py-2 text-sm text-gray-500">按作者筛选提示词</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">page</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">number</td>
                          <td className="px-4 py-2 text-sm text-gray-500">页码，默认为1</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">pageSize</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">number</td>
                          <td className="px-4 py-2 text-sm text-gray-500">每页条数，默认为10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "data": [
    {
      "name": "creative-story-generator",
      "description": "根据用户提供的主题和关键词生成创意故事",
      "category": "创意写作",
      "tags": ["故事", "创意", "GPT-4"],
      "version": "1.0",
      "created_at": "2023-05-15T08:30:00Z",
      "author": "creative_user"
    },
    // 更多提示词...
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}`}
                    </code>
                  </pre>
                </div>
              </div>
              
              {/* 获取提示词详情 */}
              <div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">GET</span>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">/prompts/{'{name}'}</h3>
                </div>
                <p className="mt-2 text-gray-600 mb-4">获取提示词详情</p>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">路径参数</h4>
                  <div className="bg-gray-50 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数名</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">name</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">string</td>
                          <td className="px-4 py-2 text-sm text-gray-500">提示词名称</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "data": {
    "name": "creative-story-generator",
    "description": "根据用户提供的主题和关键词生成创意故事",
    "content": "你是一个富有创造力的故事生成器。请根据以下主题和关键词创作一个有趣、吸引人的故事：\\n\\n主题：{{theme}}\\n关键词：{{keywords}}\\n\\n请确保故事有引人入胜的开头、合理的情节发展和令人满意的结局。故事长度应在500-800字之间。",
    "category": "创意写作",
    "tags": ["故事", "创意", "GPT-4"],
    "version": "1.0",
    "created_at": "2023-05-15T08:30:00Z",
    "updated_at": "2023-06-10T14:22:00Z",
    "author": "creative_user",
    "template_format": "text",
    "input_variables": ["theme", "keywords"],
    "examples": [
      {
        "input": {
          "theme": "冒险",
          "keywords": "森林,宝藏,神秘地图"
        },
        "output": "在一个阳光明媚的午后，年轻的探险家艾玛发现了她祖父留下的一张神秘地图...",
        "description": "冒险故事示例"
      }
    ],
    "versions": [
      {
        "version": "1.0",
        "content": "你是一个富有创造力的故事生成器...",
        "created_at": "2023-05-15T08:30:00Z",
        "author": "creative_user"
      }
    ],
    "compatible_models": ["GPT-4", "GPT-3.5", "Claude-2"]
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>
              
              {/* 创建提示词 */}
              <div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">POST</span>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">/prompts</h3>
                </div>
                <p className="mt-2 text-gray-600 mb-4">创建新提示词</p>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">请求体</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "name": "code-reviewer",
  "description": "代码审查助手，提供代码质量和改进建议",
  "content": "你是一个专业的代码审查员...",
  "category": "代码辅助",
  "tags": ["代码", "审查", "编程"],
  "version": "1.0",
  "author": "developer_user",
  "input_variables": ["code", "language"],
  "compatible_models": ["GPT-4"]
}`}
                    </code>
                  </pre>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "success": true,
  "message": "提示词创建成功",
  "data": {
    "name": "code-reviewer",
    "description": "代码审查助手，提供代码质量和改进建议",
    "content": "你是一个专业的代码审查员...",
    "category": "代码辅助",
    "tags": ["代码", "审查", "编程"],
    "version": "1.0",
    "created_at": "2023-06-20T10:15:00Z",
    "author": "developer_user",
    "input_variables": ["code", "language"],
    "compatible_models": ["GPT-4"]
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能分析API</h2>
            
            <div className="space-y-8">
              {/* 追踪提示词使用 */}
              <div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">POST</span>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">/performance/track_prompt_usage</h3>
                </div>
                <p className="mt-2 text-gray-600 mb-4">记录提示词使用情况</p>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">请求体</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "prompt_id": "creative-story-generator",
  "version": "1.0",
  "input_tokens": 50,
  "output_tokens": 650,
  "latency": 3200,
  "success": true
}`}
                    </code>
                  </pre>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "success": true,
  "usage_id": "12345678-abcd-1234-efgh-123456789abc"
}`}
                    </code>
                  </pre>
                </div>
              </div>
              
              {/* 提交反馈 */}
              <div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">POST</span>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">/performance/submit_prompt_feedback</h3>
                </div>
                <p className="mt-2 text-gray-600 mb-4">提交提示词使用反馈</p>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">请求体</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "usage_id": "12345678-abcd-1234-efgh-123456789abc",
  "rating": 4.5,
  "comments": "故事非常有创意，但结尾稍显仓促"
}`}
                    </code>
                  </pre>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "success": true,
  "message": "反馈提交成功"
}`}
                    </code>
                  </pre>
                </div>
              </div>
              
              {/* 获取性能数据 */}
              <div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">GET</span>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">/performance/get_prompt_performance</h3>
                </div>
                <p className="mt-2 text-gray-600 mb-4">获取提示词性能数据</p>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">查询参数</h4>
                  <div className="bg-gray-50 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数名</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">prompt_id</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">string</td>
                          <td className="px-4 py-2 text-sm text-gray-500">提示词ID或名称</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "data": {
    "prompt_id": "creative-story-generator",
    "total_usage": 156,
    "average_rating": 4.3,
    "success_rate": 0.98,
    "average_latency": 2840,
    "token_stats": {
      "input_avg": 45.6,
      "output_avg": 620.3,
      "total_input": 7113,
      "total_output": 96767
    },
    "feedback_count": 78,
    "version_distribution": {
      "1.0": 120,
      "1.1": 36
    }
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">错误处理</h2>
            <p className="text-gray-600 mb-6">
              API请求可能会返回以下错误代码：
            </p>

            <div className="bg-gray-50 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态码</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">示例</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">400</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">请求参数错误</td>
                    <td className="px-4 py-2 text-sm text-gray-500">请求缺少必需的字段</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">401</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">未授权</td>
                    <td className="px-4 py-2 text-sm text-gray-500">API密钥无效或过期</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">404</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">资源不存在</td>
                    <td className="px-4 py-2 text-sm text-gray-500">请求的提示词不存在</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">429</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">请求过多</td>
                    <td className="px-4 py-2 text-sm text-gray-500">超出API速率限制</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">500</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">服务器错误</td>
                    <td className="px-4 py-2 text-sm text-gray-500">服务器内部错误</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-2">错误响应格式</h3>
              <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                <code>
{`{
  "success": false,
  "message": "错误信息",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;

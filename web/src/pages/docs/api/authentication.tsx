import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const AuthenticationPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">认证与授权</h1>
          <p className="mt-2 text-gray-600">
            了解如何安全地访问 Prompt Hub API
          </p>
        </div>

        {/* 认证方式概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">认证方式概述</h2>
            <p className="text-gray-600 mb-4">
              Prompt Hub API 支持多种认证方式，确保您的数据安全和访问控制。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">API 密钥认证</h3>
                <p className="text-gray-600 text-sm mb-3">
                  适用于服务器端应用和自动化脚本
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 简单易用</li>
                  <li>• 适合后端服务</li>
                  <li>• 支持多种传递方式</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">JWT Token 认证</h3>
                <p className="text-gray-600 text-sm mb-3">
                  适用于前端应用和用户会话管理
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 安全性高</li>
                  <li>• 支持用户权限</li>
                  <li>• 自动过期机制</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* API 密钥认证 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API 密钥认证</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">获取 API 密钥</h3>
                <p className="text-gray-600 mb-4">
                  登录 Prompt Hub 后，在用户设置页面可以生成和管理您的 API 密钥。
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>安全提示：</strong> 请妥善保管您的 API 密钥，不要在客户端代码中暴露，避免提交到版本控制系统。
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">使用方式</h3>
                <p className="text-gray-600 mb-4">
                  API 密钥可以通过以下三种方式传递：
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">1. 请求头 (推荐)</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`curl -H "x-api-key: your-api-key-here" \\
     https://api.prompthub.com/v1/prompts`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">2. Authorization 头</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`curl -H "Authorization: Bearer your-api-key-here" \\
     https://api.prompthub.com/v1/prompts`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">3. 查询参数 (不推荐)</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`curl "https://api.prompthub.com/v1/prompts?api_key=your-api-key-here"`}
                    </pre>
                    <p className="text-sm text-gray-600 mt-2">
                      注意：查询参数方式可能会在日志中暴露密钥，仅在测试时使用。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JWT Token 认证 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">JWT Token 认证</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">获取 JWT Token</h3>
                <p className="text-gray-600 mb-4">
                  通过用户登录接口获取 JWT Token：
                </p>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

# 响应
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    },
    "expires_at": "2024-01-01T00:00:00Z"
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">使用 JWT Token</h3>
                <p className="text-gray-600 mb-4">
                  在请求头中包含 JWT Token：
                </p>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
     https://api.prompthub.com/v1/prompts`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Token 刷新</h3>
                <p className="text-gray-600 mb-4">
                  当 Token 即将过期时，可以使用刷新接口获取新的 Token：
                </p>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /auth/refresh
Authorization: Bearer your-current-token

# 响应
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 权限和作用域 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">权限和作用域</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                不同的认证方式具有不同的权限级别：
              </p>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API 密钥</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JWT Token</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">查看公开提示词</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">所有认证方式都支持</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">查看私有提示词</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">仅限所有者</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">创建提示词</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">需要有效认证</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">修改提示词</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">仅限所有者</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">删除提示词</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">仅限所有者</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">管理用户设置</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">仅 JWT Token</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 错误处理 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">认证错误处理</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                当认证失败时，API 会返回相应的错误代码和信息：
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">401 Unauthorized</h3>
                  <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm">
{`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication credentials"
  }
}`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    原因：API 密钥无效、JWT Token 过期或格式错误
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">403 Forbidden</h3>
                  <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm">
{`{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access this resource"
  }
}`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    原因：认证成功但权限不足，如尝试访问他人的私有提示词
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">429 Too Many Requests</h3>
                  <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm">
{`{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "retry_after": 60
  }
}`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    原因：超出 API 调用频率限制
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🔒 安全最佳实践</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• 定期轮换 API 密钥</li>
            <li>• 使用环境变量存储敏感信息</li>
            <li>• 实施适当的错误处理和重试机制</li>
            <li>• 监控 API 使用情况和异常访问</li>
            <li>• 在生产环境中使用 HTTPS</li>
            <li>• 设置合理的 Token 过期时间</li>
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
{`// 使用 API 密钥
const response = await fetch('https://api.prompthub.com/v1/prompts', {
  headers: {
    'x-api-key': process.env.PROMPTHUB_API_KEY,
    'Content-Type': 'application/json'
  }
});

// 使用 JWT Token
const response = await fetch('https://api.prompthub.com/v1/prompts', {
  headers: {
    'Authorization': \`Bearer \${jwtToken}\`,
    'Content-Type': 'application/json'
  }
});`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Python</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`import requests
import os

# 使用 API 密钥
headers = {
    'x-api-key': os.getenv('PROMPTHUB_API_KEY'),
    'Content-Type': 'application/json'
}

response = requests.get('https://api.prompthub.com/v1/prompts', headers=headers)

# 使用 JWT Token
headers = {
    'Authorization': f'Bearer {jwt_token}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.prompthub.com/v1/prompts', headers=headers)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage; 
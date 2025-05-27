import React from 'react';
import Link from 'next/link';
import { BookOpenIcon, CodeBracketIcon, BeakerIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const DocsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prompt Hub 文档</h1>
          <p className="mt-2 text-gray-600">
            了解如何使用 Prompt Hub 创建、管理和分享AI提示词
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 入门指南 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <BookOpenIcon className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="ml-4 text-xl font-semibold text-gray-900">入门指南</h2>
              </div>
              <p className="mt-4 text-gray-600">
                了解 Prompt Hub 的基本概念和功能，快速开始使用平台。
              </p>
              <div className="mt-6 space-y-2">
                <Link href="/docs/getting-started" className="block text-primary-600 hover:text-primary-700">
                  ● 基础概念和术语
                </Link>
                <Link href="/docs/getting-started/first-prompt" className="block text-primary-600 hover:text-primary-700">
                  ● 创建您的第一个提示词
                </Link>
                <Link href="/docs/getting-started/template-variables" className="block text-primary-600 hover:text-primary-700">
                  ● 使用模板变量
                </Link>
              </div>
            </div>
          </div>

          {/* API参考 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <CodeBracketIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="ml-4 text-xl font-semibold text-gray-900">API参考</h2>
              </div>
              <p className="mt-4 text-gray-600">
                完整的API文档，帮助您将提示词集成到自己的应用程序中。
              </p>
              <div className="mt-6 space-y-2">
                <Link href="/docs/api/authentication" className="block text-primary-600 hover:text-primary-700">
                  ● 认证与授权
                </Link>
                <Link href="/docs/api/prompts" className="block text-primary-600 hover:text-primary-700">
                  ● 提示词API
                </Link>
                <Link href="/docs/api/performance" className="block text-primary-600 hover:text-primary-700">
                  ● 性能分析API
                </Link>
              </div>
            </div>
          </div>

          {/* 最佳实践 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <LightBulbIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="ml-4 text-xl font-semibold text-gray-900">提示词最佳实践</h2>
              </div>
              <p className="mt-4 text-gray-600">
                学习如何设计高效、可靠的提示词，提高AI模型输出的质量和一致性。
              </p>
              <div className="mt-6 space-y-2">
                <Link href="/docs/best-practices/structure" className="block text-primary-600 hover:text-primary-700">
                  ● 提示词结构指南
                </Link>
                <Link href="/docs/best-practices/examples" className="block text-primary-600 hover:text-primary-700">
                  ● 添加有效示例
                </Link>
                <Link href="/docs/best-practices/optimization" className="block text-primary-600 hover:text-primary-700">
                  ● 提示词优化技巧
                </Link>
              </div>
            </div>
          </div>

          {/* 高级功能 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <BeakerIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="ml-4 text-xl font-semibold text-gray-900">高级功能</h2>
              </div>
              <p className="mt-4 text-gray-600">
                深入了解 Prompt Hub 的高级功能，充分发挥平台的潜力。
              </p>
              <div className="mt-6 space-y-2">
                <Link href="/docs/advanced/versioning" className="block text-primary-600 hover:text-primary-700">
                  ● 提示词版本控制
                </Link>
                <Link href="/docs/advanced/performance-tracking" className="block text-primary-600 hover:text-primary-700">
                  ● 性能追踪与分析
                </Link>
                <Link href="/docs/advanced/integration" className="block text-primary-600 hover:text-primary-700">
                  ● 与其他系统集成
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MCP Prompt Server 集成 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">与 MCP Prompt Server 集成</h2>
            <p className="text-gray-600">
              Prompt Hub 前端与 MCP Prompt Server 后端无缝集成，提供完整的提示词管理解决方案。
              MCP Prompt Server 支持两种部署模式：本地部署（使用文件存储）和远程部署（使用 Supabase 存储）。
            </p>
            
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">配置说明</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">API端点：</span> 默认为 <code className="bg-gray-200 px-1 py-0.5 rounded">http://localhost:9010</code>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">API密钥：</span> 通过环境变量 <code className="bg-gray-200 px-1 py-0.5 rounded">API_KEY</code> 设置
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">配置文件：</span> 在 <code className="bg-gray-200 px-1 py-0.5 rounded">.env.local</code> 文件中自定义这些设置
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/docs/integration/setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100">
                查看详细集成指南
              </Link>
            </div>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">常见问题</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Prompt Hub 与 MCP Prompt Server 是什么关系？</h3>
                <p className="mt-2 text-gray-600">
                  Prompt Hub 是 MCP Prompt Server 的现代化前端界面，专为提高用户体验和提供更丰富的可视化功能而设计。
                  MCP Prompt Server 负责提示词的存储、检索和性能追踪的核心功能，而 Prompt Hub 则提供了直观的用户界面来使用这些功能。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">如何将 Prompt Hub 连接到远程 MCP Prompt Server？</h3>
                <p className="mt-2 text-gray-600">
                  您可以通过修改 <code className="bg-gray-200 px-1 py-0.5 rounded">.env.local</code> 文件中的 
                  <code className="bg-gray-200 px-1 py-0.5 rounded">API_URL</code> 变量来连接到远程服务器。
                  确保同时设置正确的 <code className="bg-gray-200 px-1 py-0.5 rounded">API_KEY</code> 以进行身份验证。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Prompt Hub 是否支持多用户协作？</h3>
                <p className="mt-2 text-gray-600">
                  是的，Prompt Hub 支持用户注册和身份验证，允许多个用户协作管理提示词库。
                  每个提示词都会记录创建者和编辑者信息，便于团队协作和版本管理。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;

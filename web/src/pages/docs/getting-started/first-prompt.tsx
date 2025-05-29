import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const FirstPromptPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/getting-started" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回入门指南
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建您的第一个提示词</h1>
          <p className="mt-2 text-gray-600">
            通过这个详细的教程，学习如何在 Prompt Hub 中创建您的第一个提示词
          </p>
        </div>

        {/* 准备工作 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">准备工作</h2>
            <p className="text-gray-600 mb-4">
              在开始创建提示词之前，请确保您已经：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>注册并登录了 Prompt Hub 账户</li>
              <li>了解了基本的AI提示词概念</li>
              <li>准备好要创建的提示词内容</li>
            </ul>
          </div>
        </div>

        {/* 步骤1：访问创建页面 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">步骤1：访问创建页面</h2>
            <p className="text-gray-600 mb-4">
              登录后，点击导航栏中的"创建提示词"按钮，或者访问创建页面：
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <Link href="/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                前往创建页面
              </Link>
            </div>
          </div>
        </div>

        {/* 步骤2：填写基本信息 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">步骤2：填写基本信息</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">提示词名称</h3>
                <p className="text-gray-600 mb-2">
                  为您的提示词选择一个简短、描述性的名称。名称应该能够清楚地表达提示词的用途。
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700"><strong>示例：</strong> "creative-story-generator"、"code-reviewer"、"email-writer"</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">描述</h3>
                <p className="text-gray-600 mb-2">
                  提供详细的描述，说明这个提示词的功能、适用场景和预期效果。
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700"><strong>示例：</strong> "这个提示词帮助生成富有创意的短篇故事，适用于创意写作、内容创作等场景。"</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">选择类别</h3>
                <p className="text-gray-600 mb-2">
                  从预设的类别中选择最适合的分类，这有助于其他用户发现您的提示词。
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">编程</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">文案</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">教育</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">娱乐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 步骤3：编写提示词内容 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">步骤3：编写提示词内容</h2>
            <p className="text-gray-600 mb-4">
              这是最重要的部分。编写清晰、具体的提示词内容：
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">基本结构</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个专业的[角色定义]。

你的任务是[具体任务描述]。

请遵循以下原则：
1. [原则1]
2. [原则2]
3. [原则3]

输出格式：[期望的输出格式]`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">示例提示词</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个专业的代码审查员，具有多年的软件开发经验。

你的任务是审查用户提供的代码，并提供建设性的反馈和改进建议。

请遵循以下原则：
1. 关注代码质量、可读性和性能
2. 提供具体的改进建议
3. 指出潜在的bug或安全问题
4. 保持友好和建设性的语调

输出格式：
- 总体评价
- 具体问题列表
- 改进建议
- 修改后的代码示例（如需要）`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 步骤4：添加标签和设置 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">步骤4：添加标签和设置</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">添加标签</h3>
                <p className="text-gray-600 mb-2">
                  添加相关标签，帮助用户更容易找到您的提示词。
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">代码</span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">审查</span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">编程</span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">质量</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">可见性设置</h3>
                <p className="text-gray-600 mb-2">
                  选择提示词的可见性：
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>私有：</strong> 只有您可以查看和使用</li>
                  <li><strong>公开：</strong> 所有用户都可以查看和使用</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 步骤5：保存和测试 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">步骤5：保存和测试</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">保存提示词</h3>
                <p className="text-gray-600 mb-2">
                  检查所有信息无误后，点击"创建提示词"按钮保存。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">测试提示词</h3>
                <p className="text-gray-600 mb-2">
                  创建成功后，建议您：
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>在实际AI模型中测试提示词效果</li>
                  <li>根据测试结果调整和优化内容</li>
                  <li>收集使用反馈并持续改进</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">💡 最佳实践提示</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• 使用清晰、具体的语言描述任务</li>
            <li>• 提供具体的示例和期望输出格式</li>
            <li>• 测试不同的表述方式，找到最有效的版本</li>
            <li>• 定期更新和优化您的提示词</li>
            <li>• 查看其他优秀提示词的结构和写法</li>
          </ul>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步</h2>
            <p className="text-gray-600 mb-4">
              恭喜！您已经学会了如何创建提示词。接下来您可以：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/getting-started/template-variables" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">学习模板变量</h3>
                <p className="text-sm text-gray-600">了解如何使用变量让提示词更灵活</p>
              </Link>
              
              <Link href="/docs/best-practices" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">查看最佳实践</h3>
                <p className="text-sm text-gray-600">学习更多提示词设计技巧</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstPromptPage; 
import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const TemplateVariablesPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/getting-started" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回入门指南
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">使用模板变量</h1>
          <p className="mt-2 text-gray-600">
            学习如何使用模板变量让您的提示词更加灵活和可重用
          </p>
        </div>

        {/* 什么是模板变量 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">什么是模板变量？</h2>
            <p className="text-gray-600 mb-4">
              模板变量是提示词中的占位符，可以在使用时动态替换为具体的值。这使得一个提示词可以适用于多种不同的场景和输入。
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-2">示例</h3>
              <p className="text-sm text-gray-700 mb-2">不使用变量的提示词：</p>
              <pre className="bg-gray-800 text-white p-3 rounded text-sm mb-3">
                请帮我写一封关于产品发布的邮件
              </pre>
              <p className="text-sm text-gray-700 mb-2">使用变量的提示词：</p>
              <pre className="bg-gray-800 text-white p-3 rounded text-sm">
                请帮我写一封关于{`{topic}`}的{`{email_type}`}
              </pre>
            </div>
          </div>
        </div>

        {/* 变量语法 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">变量语法</h2>
            <p className="text-gray-600 mb-4">
              Prompt Hub 支持多种变量语法格式：
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">基本语法</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">花括号语法：</p>
                      <code className="bg-gray-800 text-white px-2 py-1 rounded text-sm">{`{variable_name}`}</code>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">双花括号语法：</p>
                      <code className="bg-gray-800 text-white px-2 py-1 rounded text-sm">{`{{variable_name}}`}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">变量命名规则</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>只能包含字母、数字和下划线</li>
                  <li>必须以字母开头</li>
                  <li>建议使用描述性的名称，如 <code className="bg-gray-200 px-1 rounded">user_name</code>、<code className="bg-gray-200 px-1 rounded">product_type</code></li>
                  <li>避免使用保留关键字</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 常用变量类型 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">常用变量类型</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">文本变量</h3>
                <p className="text-gray-600 mb-2">用于替换文本内容</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`你是一个专业的{role}，请帮助用户解决{problem_type}相关的问题。

用户问题：{user_question}

请提供详细的解答。`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">列表变量</h3>
                <p className="text-gray-600 mb-2">用于处理多个项目或选项</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`请分析以下{analysis_type}：

项目列表：
{item_list}

分析要求：{requirements}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">格式变量</h3>
                <p className="text-gray-600 mb-2">用于指定输出格式</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`请将以下内容转换为{output_format}格式：

原始内容：{input_content}

输出要求：{format_requirements}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 实际应用示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实际应用示例</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">邮件写作助手</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个专业的邮件写作助手。

请帮我写一封{email_type}邮件，内容如下：

收件人：{recipient}
主题：{subject}
主要内容：{main_content}
语调：{tone}

请确保邮件：
1. 语言{tone}且专业
2. 结构清晰
3. 包含适当的开头和结尾
4. 长度适中

输出格式：
主题：[邮件主题]
正文：[邮件正文]`}
                  </pre>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600"><strong>变量说明：</strong></p>
                  <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                    <li><code>email_type</code>: 商务、感谢、道歉等</li>
                    <li><code>recipient</code>: 收件人姓名或称呼</li>
                    <li><code>subject</code>: 邮件主题</li>
                    <li><code>main_content</code>: 主要内容要点</li>
                    <li><code>tone</code>: 正式、友好、紧急等</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">代码审查助手</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个经验丰富的{programming_language}开发者和代码审查员。

请审查以下{code_type}代码：

\`\`\`{programming_language}
{code_content}
\`\`\`

审查重点：{review_focus}

请提供：
1. 代码质量评估
2. 潜在问题识别
3. 性能优化建议
4. 最佳实践建议
5. 修改建议（如需要）

输出格式：
## 总体评价
[整体评价]

## 发现的问题
[问题列表]

## 改进建议
[具体建议]

## 优化后的代码
[如果需要重写，提供优化版本]`}
                  </pre>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600"><strong>变量说明：</strong></p>
                  <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                    <li><code>programming_language</code>: JavaScript、Python、Java等</li>
                    <li><code>code_type</code>: 函数、类、模块等</li>
                    <li><code>code_content</code>: 要审查的代码</li>
                    <li><code>review_focus</code>: 性能、安全性、可读性等</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">变量使用最佳实践</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">1. 使用描述性名称</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">❌ 不好的命名：</p>
                                         <code className="bg-red-50 text-red-800 px-2 py-1 rounded text-sm">{`{x}, {data}, {input}`}</code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">✅ 好的命名：</p>
                                         <code className="bg-green-50 text-green-800 px-2 py-1 rounded text-sm">{`{user_name}, {product_description}, {target_audience}`}</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">2. 提供默认值</h3>
                <p className="text-gray-600 mb-2">为变量提供合理的默认值或示例：</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`请分析{product_name}（例如：iPhone 15）的市场表现`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">3. 添加变量说明</h3>
                <p className="text-gray-600 mb-2">在提示词描述中说明每个变量的用途：</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>变量说明：</strong><br/>
                    • <code>topic</code>: 要分析的主题或产品名称<br/>
                    • <code>analysis_type</code>: 分析类型（市场分析、竞品分析等）<br/>
                    • <code>target_audience</code>: 目标受众群体
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">4. 保持一致性</h3>
                <p className="text-gray-600">在同一个提示词中，相同含义的变量使用相同的名称。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 高级技巧 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🚀 高级技巧</h2>
          <div className="space-y-3 text-blue-800">
            <div>
              <h3 className="font-medium">条件变量</h3>
              <p className="text-sm">使用条件逻辑来处理可选变量：</p>
              <code className="bg-blue-100 px-2 py-1 rounded text-sm">{`{if additional_requirements}额外要求：{additional_requirements}{endif}`}</code>
            </div>
            <div>
              <h3 className="font-medium">嵌套变量</h3>
              <p className="text-sm">在复杂场景中使用嵌套结构：</p>
              <code className="bg-blue-100 px-2 py-1 rounded text-sm">{`{user.name}的{user.role}经验`}</code>
            </div>
            <div>
              <h3 className="font-medium">变量验证</h3>
              <p className="text-sm">在提示词中包含变量格式验证：</p>
                             <code className="bg-blue-100 px-2 py-1 rounded text-sm">{`确保{email}是有效的邮箱格式`}</code>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步</h2>
            <p className="text-gray-600 mb-4">
              现在您已经掌握了模板变量的使用方法，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/best-practices" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">提示词最佳实践</h3>
                <p className="text-sm text-gray-600">学习更多提示词设计技巧和优化方法</p>
              </Link>
              
              <Link href="/docs/advanced/versioning" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">版本控制</h3>
                <p className="text-sm text-gray-600">了解如何管理提示词的不同版本</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateVariablesPage; 
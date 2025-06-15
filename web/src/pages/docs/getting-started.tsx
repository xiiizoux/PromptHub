import React from 'react';
import Link from 'next/link';
import { ProtectedLink } from '@/components/ProtectedLink';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const GettingStartedPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">入门指南</h1>
          <p className="mt-2 text-gray-600">
            快速了解 Prompt Hub 的基本概念和功能，开始创建和管理你的AI提示词
          </p>
        </div>

        {/* 什么是Prompt Hub */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">什么是Prompt Hub？</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Prompt Hub 是一个全面的提示词管理平台，为AI开发者、内容创作者和企业用户提供创建、管理、分享和分析AI提示词的工具。
                作为MCP Prompt Server的现代化前端界面，Prompt Hub提供了直观的用户体验和强大的功能，帮助用户充分发挥大型语言模型(LLM)的潜力。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">核心功能</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>提示词创建和管理</li>
                    <li>模板变量和动态内容</li>
                    <li>版本控制与协作</li>
                    <li>性能分析和优化</li>
                    <li>API集成</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">适用场景</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>内容创作和营销</li>
                    <li>客户服务自动化</li>
                    <li>知识管理和检索</li>
                    <li>代码开发辅助</li>
                    <li>教育和培训</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 基础概念 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基础概念和术语</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">提示词（Prompt）</h3>
                <p className="mt-2 text-gray-600">
                  提示词是发送给AI模型的指令或问题，用于引导模型生成特定类型的回答。一个好的提示词应该清晰、具体，并包含足够的上下文和约束条件。
                  在Prompt Hub中，提示词不仅包括文本内容，还可以包含元数据（如类别、标签）和版本信息。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">模板变量（Template Variables）</h3>
                <p className="mt-2 text-gray-600">
                  模板变量是提示词中的动态部分，可以在使用时被替换为具体的值。使用模板变量可以使提示词更加灵活和可重用。
                  在Prompt Hub中，模板变量使用双大括号表示，如<code className="bg-gray-200 px-1 py-0.5 rounded">{'{{variable_name}}'}</code>。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">示例（Examples）</h3>
                <p className="mt-2 text-gray-600">
                  示例是提示词的输入和预期输出的配对，用于展示提示词如何使用以及预期结果。添加高质量的示例可以帮助其他用户更好地理解提示词的功能和用法。
                  示例也是少样本学习（few-shot learning）的基础，可以显著提高模型输出的质量和一致性。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">性能分析（Performance Analytics）</h3>
                <p className="mt-2 text-gray-600">
                  性能分析是对提示词使用情况和效果的量化评估。Prompt Hub提供全面的性能指标，包括使用频率、成功率、响应时间、token消耗和用户满意度等。
                  通过分析这些指标，用户可以发现提示词的优势和不足，从而进行有针对性的优化。
                </p>
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
                <h3 className="text-lg font-medium text-gray-900">1. 注册和登录</h3>
                <p className="mt-2 text-gray-600">
                  访问Prompt Hub首页，点击右上角的"注册"按钮创建新账户，或使用"登录"按钮访问已有账户。
                  注册只需提供基本信息，包括用户名、电子邮件和密码。
                </p>
                <div className="mt-4">
                  <Link href="/auth/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    注册账户
                  </Link>
                  <Link href="/auth/login" className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    登录账户
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">2. 浏览提示词库</h3>
                <p className="mt-2 text-gray-600">
                  登录后，您可以访问提示词库，浏览现有的提示词集合。使用搜索框和筛选器可以快速找到特定类别、标签或关键词的提示词。
                  点击任何提示词卡片可以查看详细信息，包括完整内容、示例和性能数据。
                </p>
                <div className="mt-4">
                  <Link href="/prompts" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    浏览提示词
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">3. 创建您的第一个提示词</h3>
                <p className="mt-2 text-gray-600">
                  点击"创建提示词"按钮开始创建您自己的提示词。填写基本信息（名称、描述、类别等），然后编写提示词内容。
                  您可以使用模板变量使提示词更灵活，添加示例展示提示词的用法，并设置兼容的模型。
                </p>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">提示词创建流程：</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                    <li>点击"创建提示词"按钮</li>
                    <li>填写名称、描述、类别和标签</li>
                    <li>编写提示词内容，根据需要使用模板变量</li>
                    <li>添加使用示例，包括输入和预期输出</li>
                    <li>设置兼容的模型</li>
                    <li>点击"保存"完成创建</li>
                  </ol>
                </div>
                <div className="mt-4">
                  <ProtectedLink href="/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    创建提示词
                  </ProtectedLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用模板变量 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">使用模板变量</h2>
            
            <div className="space-y-6">
              <p className="text-gray-600">
                模板变量是提示词的强大功能，允许您创建动态、可重用的提示词模板。通过使用变量，同一个提示词可以适应不同的输入场景，大大提高了提示词的灵活性和通用性。
              </p>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">变量语法</h3>
                <p className="mt-2 text-gray-600">
                  在Prompt Hub中，变量使用双大括号表示：<code className="bg-gray-200 px-1 py-0.5 rounded">{'{{variable_name}}'}</code>
                </p>
                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">示例：</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`你是一位专业的{{role}}。请根据以下信息提供{{output_type}}：

主题：{{topic}}
要点：{{points}}

请确保你的回答是专业、准确的，并适合{{audience}}阅读。`}
                    </code>
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">变量类型</h3>
                <div className="mt-2 bg-gray-50 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">变量类型</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">示例</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">文本变量</td>
                        <td className="px-4 py-2 text-sm text-gray-500">基本的文本替换，可以是短语、段落或更长的文本</td>
                        <td className="px-4 py-2 text-sm text-gray-500"><code className="bg-gray-200 px-1 py-0.5 rounded">{'{{topic}}'}</code></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">列表变量</td>
                        <td className="px-4 py-2 text-sm text-gray-500">可以接受多个项目的列表，通常以逗号分隔</td>
                        <td className="px-4 py-2 text-sm text-gray-500"><code className="bg-gray-200 px-1 py-0.5 rounded">{'{{keywords}}'}</code></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">选择变量</td>
                        <td className="px-4 py-2 text-sm text-gray-500">从预定义的选项中选择一个值</td>
                        <td className="px-4 py-2 text-sm text-gray-500"><code className="bg-gray-200 px-1 py-0.5 rounded">{'{{tone}}'}</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">最佳实践</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">使用描述性的变量名，清晰表明变量的用途</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">为每个变量提供清晰的描述和示例值</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">避免过度使用变量，只将真正需要变化的部分设为变量</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">考虑变量的默认值，以防用户未提供特定值</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">示例：电子邮件生成器</h3>
                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">带变量的提示词：</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`请根据以下信息撰写一封专业的电子邮件：

发件人：{{sender_name}}
收件人：{{recipient_name}}
主题：{{email_subject}}
目的：{{email_purpose}}
语气：{{tone}}
其他要点：{{additional_points}}

请使用正式的电子邮件格式，包括恰当的问候语和结束语。`}
                    </code>
                  </pre>
                  
                  <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">变量值示例：</h4>
                  <pre className="bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`{
  "sender_name": "张明",
  "recipient_name": "李总监",
  "email_subject": "关于新产品发布会的安排",
  "email_purpose": "确认产品发布会的日期和流程",
  "tone": "专业正式",
  "additional_points": "需要确认演示设备准备情况，讨论媒体邀请名单，确定后续宣传计划"
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                现在您已经了解了Prompt Hub的基础知识，可以开始探索更多高级功能：
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/docs/best-practices" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="text-md font-medium text-gray-900 mb-1">提示词最佳实践</h3>
                  <p className="text-sm text-gray-600">学习如何设计高效、可靠的提示词</p>
                </Link>
                
                <Link href="/docs/api" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="text-md font-medium text-gray-900 mb-1">API参考</h3>
                  <p className="text-sm text-gray-600">了解如何通过API集成提示词</p>
                </Link>
                
                <Link href="/docs/advanced/performance-tracking" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="text-md font-medium text-gray-900 mb-1">性能追踪与分析</h3>
                  <p className="text-sm text-gray-600">学习如何分析和优化提示词性能</p>
                </Link>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-md font-medium text-blue-900 mb-2">需要帮助？</h3>
                <p className="text-sm text-blue-800">
                  如果您有任何问题或需要进一步的帮助，请随时联系我们的支持团队。
                </p>
                <div className="mt-4">
                  <Link href="/contact" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    联系支持
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStartedPage;

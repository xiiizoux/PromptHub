import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, DocumentTextIcon, CodeBracketIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const TemplatesPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回文档首页
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提示词模板库</h1>
          <p className="mt-2 text-gray-600">
            精选的提示词模板，涵盖各种应用场景和行业需求，帮助您快速开始创建高质量的提示词
          </p>
        </div>

        {/* 模板分类导航 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-gray-900">通用模板</h3>
            </div>
            <p className="text-sm text-gray-600">适用于各种场景的基础模板</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <BriefcaseIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-gray-900">商务模板</h3>
            </div>
            <p className="text-sm text-gray-600">商务沟通和办公场景专用</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <AcademicCapIcon className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium text-gray-900">教育模板</h3>
            </div>
            <p className="text-sm text-gray-600">教学和学习场景的专业模板</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <CodeBracketIcon className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="font-medium text-gray-900">技术模板</h3>
            </div>
            <p className="text-sm text-gray-600">编程和技术开发相关模板</p>
          </div>
        </div>

        {/* 通用模板 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              通用模板
            </h2>
            
            <div className="space-y-8">
              {/* 文本总结模板 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">文本总结模板</h3>
                    <p className="text-sm text-gray-600 mt-1">将长文本总结为简洁的要点</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    通用
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">模板内容：</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`请对以下文本进行总结：

原文：{{original_text}}

总结要求：
- 提取{{summary_length}}个主要要点
- 保持{{tone}}的语调
- 重点关注{{focus_areas}}
- 总结长度控制在{{word_limit}}字以内

请按以下格式输出：
## 核心要点
1. [要点1]
2. [要点2]
3. [要点3]

## 关键信息
- 主题：[主要主题]
- 结论：[核心结论]`}
                  </pre>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">变量说明：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><code>original_text</code>: 需要总结的原始文本</li>
                      <li><code>summary_length</code>: 要点数量（如：3-5个）</li>
                      <li><code>tone</code>: 语调风格（如：正式、简洁）</li>
                      <li><code>focus_areas</code>: 重点关注领域</li>
                      <li><code>word_limit</code>: 字数限制</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">适用场景：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 会议纪要总结</li>
                      <li>• 文章摘要提取</li>
                      <li>• 报告要点整理</li>
                      <li>• 新闻内容概括</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 内容创作模板 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">内容创作模板</h3>
                    <p className="text-sm text-gray-600 mt-1">根据主题和要求创作原创内容</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    创作
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">模板内容：</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个专业的{{content_type}}创作者。请根据以下要求创作内容：

主题：{{topic}}
目标受众：{{target_audience}}
内容风格：{{writing_style}}
内容长度：{{content_length}}
关键词：{{keywords}}

创作要求：
1. 内容必须原创且有价值
2. 语言{{tone}}，符合{{target_audience}}的阅读习惯
3. 自然融入关键词：{{keywords}}
4. 结构清晰，逻辑性强
5. 包含引人入胜的开头和有力的结尾

{{additional_requirements}}

请开始创作：`}
                  </pre>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">变量说明：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><code>content_type</code>: 内容类型（文章、博客、故事等）</li>
                      <li><code>topic</code>: 创作主题</li>
                      <li><code>target_audience</code>: 目标读者群体</li>
                      <li><code>writing_style</code>: 写作风格</li>
                      <li><code>content_length</code>: 内容长度要求</li>
                      <li><code>keywords</code>: 需要包含的关键词</li>
                      <li><code>tone</code>: 语调（专业、轻松、正式等）</li>
                      <li><code>additional_requirements</code>: 额外要求</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">适用场景：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 博客文章写作</li>
                      <li>• 营销文案创作</li>
                      <li>• 产品描述撰写</li>
                      <li>• 社交媒体内容</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用指南 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📋 模板使用指南</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">如何使用模板</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>选择适合您需求的模板类型</li>
                <li>复制模板内容到提示词编辑器</li>
                <li>根据实际需求填写变量值</li>
                <li>测试和优化提示词效果</li>
                <li>保存并分享您的提示词</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">自定义建议</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>根据具体场景调整模板结构</li>
                <li>添加行业特定的术语和要求</li>
                <li>结合实际案例优化示例内容</li>
                <li>定期更新模板以适应新需求</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/docs/best-practices/examples" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
                <h3 className="font-medium text-gray-900 mb-2">查看示例库</h3>
                <p className="text-sm text-gray-600">浏览更多实际应用示例</p>
              </Link>
              
              <Link href="/docs/getting-started/template-variables" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
                <h3 className="font-medium text-gray-900 mb-2">学习变量使用</h3>
                <p className="text-sm text-gray-600">深入了解模板变量的使用方法</p>
              </Link>
              
              <Link href="/create" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
                <h3 className="font-medium text-gray-900 mb-2">开始创建</h3>
                <p className="text-sm text-gray-600">使用模板创建您的第一个提示词</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
 
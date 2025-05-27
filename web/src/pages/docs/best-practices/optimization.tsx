import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const OptimizationPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/best-practices" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回最佳实践
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提示词优化技巧</h1>
          <p className="mt-2 text-gray-600">
            掌握高级的提示词优化方法，提升AI模型的性能和输出质量
          </p>
        </div>

        {/* 优化策略概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">优化策略概述</h2>
            <p className="text-gray-600 mb-6">
              提示词优化是一个迭代过程，需要结合数据分析、用户反馈和持续测试来不断改进。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">📊 数据驱动</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• 分析性能指标</li>
                  <li>• 监控错误模式</li>
                  <li>• 收集用户反馈</li>
                  <li>• A/B测试对比</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">🔧 技术优化</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• 精简指令语言</li>
                  <li>• 优化示例质量</li>
                  <li>• 调整参数设置</li>
                  <li>• 改进输出格式</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-3">🎯 用户体验</h3>
                <ul className="space-y-2 text-purple-700 text-sm">
                  <li>• 提升响应速度</li>
                  <li>• 增强输出一致性</li>
                  <li>• 减少错误率</li>
                  <li>• 改善可读性</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 性能优化技巧 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能优化技巧</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 精简和聚焦</h3>
                <p className="text-gray-600 mb-4">
                  移除冗余信息，专注于核心任务，提高处理效率。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-md font-medium text-red-600 mb-2">❌ 冗余复杂</h4>
                    <div className="bg-red-50 p-3 rounded-lg text-sm">
                      <pre className="text-red-800 whitespace-pre-wrap">
{`你是一个非常专业的、经验丰富的、
具有多年工作经验的高级软件工程师，
同时也是一个代码审查专家，拥有
深厚的技术背景和丰富的项目经验，
请帮助我审查以下代码...`}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-green-600 mb-2">✅ 简洁明确</h4>
                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                      <pre className="text-green-800 whitespace-pre-wrap">
{`你是一个高级软件工程师，
专精于代码审查。

请审查以下代码，重点关注：
1. 代码质量
2. 性能问题
3. 安全漏洞`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 结构化输出</h3>
                <p className="text-gray-600 mb-4">
                  使用结构化格式提高输出的可解析性和一致性。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 优化前：自由格式
请分析这个产品的优缺点。

# 优化后：结构化格式
请按以下JSON格式分析产品：
{
  "overall_score": 0-10,
  "pros": ["优点1", "优点2"],
  "cons": ["缺点1", "缺点2"],
  "recommendation": "推荐/不推荐",
  "reason": "推荐理由"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 分步骤处理</h3>
                <p className="text-gray-600 mb-4">
                  将复杂任务分解为多个简单步骤，提高准确性。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`请按以下步骤分析文档：

步骤1：提取关键信息
- 识别主题和要点
- 标记重要数据

步骤2：分析内容质量
- 评估逻辑性
- 检查准确性

步骤3：生成总结
- 概括主要内容
- 提出改进建议`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 调试和测试 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">调试和测试方法</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">A/B测试框架</h3>
                <p className="text-gray-600 mb-4">
                  系统性地测试不同版本的提示词，找到最优方案。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">测试计划示例：</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">版本A（当前）</h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 详细的角色描述</li>
                        <li>• 3个示例</li>
                        <li>• 自由格式输出</li>
                        <li>• 平均响应时间：2.1s</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">版本B（优化）</h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 简洁的角色定义</li>
                        <li>• 2个精选示例</li>
                        <li>• JSON格式输出</li>
                        <li>• 平均响应时间：1.6s</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">错误模式分析</h3>
                <p className="text-gray-600 mb-4">
                  识别和分类常见错误，针对性地改进提示词。
                </p>
                
                <div className="space-y-4">
                  <div className="border border-orange-200 rounded-lg p-3">
                    <h4 className="text-md font-medium text-orange-600 mb-2">格式错误</h4>
                    <p className="text-sm text-gray-600 mb-2">症状：输出格式不一致或不符合要求</p>
                    <p className="text-sm text-gray-600">解决：添加更明确的格式示例和约束</p>
                  </div>
                  
                  <div className="border border-red-200 rounded-lg p-3">
                    <h4 className="text-md font-medium text-red-600 mb-2">理解偏差</h4>
                    <p className="text-sm text-gray-600 mb-2">症状：AI误解任务要求</p>
                    <p className="text-sm text-gray-600">解决：重新表述指令，增加澄清说明</p>
                  </div>
                  
                  <div className="border border-yellow-200 rounded-lg p-3">
                    <h4 className="text-md font-medium text-yellow-600 mb-2">质量不稳定</h4>
                    <p className="text-sm text-gray-600 mb-2">症状：输出质量波动较大</p>
                    <p className="text-sm text-gray-600">解决：增加质量标准和检查点</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 高级优化技术 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">高级优化技术</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 动态提示词</h3>
                <p className="text-gray-600 mb-4">
                  根据输入内容和上下文动态调整提示词内容。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// 伪代码示例
function generatePrompt(inputType, complexity, userLevel) {
  let basePrompt = "你是一个专业助手。";
  
  if (inputType === "code") {
    basePrompt += "专精于代码分析。";
  } else if (inputType === "text") {
    basePrompt += "专精于文本处理。";
  }
  
  if (complexity === "high") {
    basePrompt += "请提供详细分析。";
  } else {
    basePrompt += "请提供简要分析。";
  }
  
  return basePrompt;
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 链式提示</h3>
                <p className="text-gray-600 mb-4">
                  将复杂任务分解为多个相互关联的提示词。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 提示词链示例：文档分析

## 第一步：信息提取
提取文档中的关键信息：
- 主题
- 要点
- 数据

## 第二步：质量评估
基于提取的信息评估：
- 逻辑性
- 完整性
- 准确性

## 第三步：总结生成
结合前两步结果生成：
- 核心总结
- 改进建议`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 自我验证机制</h3>
                <p className="text-gray-600 mb-4">
                  让AI检查自己的输出，提高准确性。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`请完成任务并进行自我检查：

1. 首先完成主要任务
2. 然后检查输出是否：
   - 符合格式要求
   - 逻辑清晰
   - 信息准确
3. 如发现问题，请修正并说明

最终输出格式：
{
  "result": "主要结果",
  "self_check": {
    "format_ok": true/false,
    "logic_ok": true/false,
    "accuracy_ok": true/false
  },
  "corrections": "如有修正，说明修正内容"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 性能监控 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能监控指标</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">核心指标</h3>
                <div className="space-y-3">
                                     <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                     <span className="text-sm font-medium">准确率</span>
                     <span className="text-sm text-green-600">目标: &gt;90%</span>
                   </div>
                   <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                     <span className="text-sm font-medium">响应时间</span>
                     <span className="text-sm text-blue-600">目标: &lt;2s</span>
                   </div>
                   <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                     <span className="text-sm font-medium">格式一致性</span>
                     <span className="text-sm text-purple-600">目标: &gt;95%</span>
                   </div>
                   <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                     <span className="text-sm font-medium">用户满意度</span>
                     <span className="text-sm text-orange-600">目标: &gt;4.5/5</span>
                   </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">监控方法</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• 自动化测试套件</li>
                  <li>• 实时性能监控</li>
                  <li>• 用户反馈收集</li>
                  <li>• 定期人工评估</li>
                  <li>• 错误日志分析</li>
                  <li>• A/B测试对比</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 优化工作流 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">优化工作流程</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">基线建立</h3>
                  <p className="text-sm text-gray-600">测试当前提示词性能，建立基准指标</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">问题识别</h3>
                  <p className="text-sm text-gray-600">分析错误模式，识别改进机会</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">方案设计</h3>
                  <p className="text-sm text-gray-600">制定具体的优化方案和测试计划</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">4</span>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">实施测试</h3>
                  <p className="text-sm text-gray-600">实施优化方案，进行A/B测试</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">5</span>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">效果评估</h3>
                  <p className="text-sm text-gray-600">分析测试结果，决定是否采用新方案</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">6</span>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">持续监控</h3>
                  <p className="text-sm text-gray-600">部署后持续监控，准备下一轮优化</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🚀 优化最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">核心原则</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 数据驱动的决策过程</li>
                <li>• 小步快跑的迭代优化</li>
                <li>• 用户体验优先考虑</li>
                <li>• 持续监控和改进</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">关键技巧</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 精简语言，聚焦核心</li>
                <li>• 结构化输出格式</li>
                <li>• 系统性A/B测试</li>
                <li>• 自动化质量检查</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步学习</h2>
            <p className="text-gray-600 mb-4">
              现在您已经掌握了提示词优化技巧，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/advanced/performance-tracking" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">性能追踪与分析</h3>
                <p className="text-sm text-gray-600">深入了解性能监控和数据分析方法</p>
              </Link>
              
              <Link href="/docs/advanced/integration" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">系统集成</h3>
                <p className="text-sm text-gray-600">学习如何将提示词集成到现有系统</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationPage; 
import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const StructurePage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/best-practices" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回最佳实践
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提示词结构指南</h1>
          <p className="mt-2 text-gray-600">
            学习如何设计清晰、有效的提示词结构，提高AI模型的理解和执行能力
          </p>
        </div>

        {/* 基础结构原则 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基础结构原则</h2>
            <p className="text-gray-600 mb-6">
              一个良好的提示词结构应该遵循清晰、具体、逻辑性强的原则。以下是构建高效提示词的核心要素：
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">✅ 好的结构特征</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 明确的角色定义</li>
                  <li>• 具体的任务描述</li>
                  <li>• 清晰的输出格式</li>
                  <li>• 必要的约束条件</li>
                  <li>• 逻辑层次分明</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">❌ 避免的问题</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 模糊的指令</li>
                  <li>• 过于复杂的要求</li>
                  <li>• 缺乏上下文</li>
                  <li>• 矛盾的指示</li>
                  <li>• 过长的单段描述</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 标准结构模板 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">标准结构模板</h2>
            <p className="text-gray-600 mb-6">
              以下是一个经过验证的提示词结构模板，适用于大多数场景：
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 提示词结构模板

## 1. 角色定义
你是一个[具体角色]，具有[相关专业背景/经验]。

## 2. 任务描述
你的任务是[具体任务]。

## 3. 输入信息
用户将提供：
- [输入项1]：[描述]
- [输入项2]：[描述]

## 4. 处理要求
请遵循以下原则：
1. [要求1]
2. [要求2]
3. [要求3]

## 5. 输出格式
请按照以下格式输出：
[具体格式说明]

## 6. 约束条件
- [约束1]
- [约束2]
- [约束3]`}
              </pre>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>提示：</strong> 这个模板可以根据具体需求进行调整，不是所有部分都必须包含，但建议保持逻辑清晰。
              </p>
            </div>
          </div>
        </div>

        {/* 各部分详细说明 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">各部分详细说明</h2>
            
            <div className="space-y-8">
              {/* 角色定义 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 角色定义</h3>
                <p className="text-gray-600 mb-4">
                  明确定义AI的角色和专业背景，这有助于模型采用合适的语调和专业水平。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-md font-medium text-green-600 mb-2">✅ 好的角色定义</h4>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <pre className="text-sm text-green-800">
{`你是一个有10年经验的高级软件工程师，
专精于JavaScript和React开发，
熟悉现代前端开发最佳实践。`}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-red-600 mb-2">❌ 模糊的角色定义</h4>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <pre className="text-sm text-red-800">
{`你是一个助手，帮助用户解决问题。`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* 任务描述 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 任务描述</h3>
                <p className="text-gray-600 mb-4">
                  清晰描述AI需要完成的具体任务，避免歧义和模糊表达。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-md font-medium text-green-600 mb-2">✅ 具体的任务描述</h4>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <pre className="text-sm text-green-800">
{`你的任务是审查用户提供的JavaScript代码，
识别潜在的性能问题、安全漏洞和代码质量问题，
并提供具体的改进建议。`}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-red-600 mb-2">❌ 模糊的任务描述</h4>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <pre className="text-sm text-red-800">
{`帮助用户改进代码。`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* 输出格式 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 输出格式</h3>
                <p className="text-gray-600 mb-4">
                  明确指定期望的输出格式，包括结构、样式和内容组织方式。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">格式示例：</h4>
                  <pre className="text-sm text-gray-700">
{`请按照以下格式输出：

## 代码审查报告

### 总体评价
[整体代码质量评估]

### 发现的问题
1. **性能问题**
   - [具体问题描述]
   - 影响：[影响说明]
   - 建议：[改进建议]

2. **安全问题**
   - [具体问题描述]
   - 风险级别：[高/中/低]
   - 解决方案：[具体方案]

### 改进建议
[按优先级排序的改进建议]

### 优化后的代码
\`\`\`javascript
[改进后的代码示例]
\`\`\``}
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
            
            <div className="space-y-8">
              {/* 代码审查示例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">示例1：代码审查助手</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 代码审查助手

## 角色定义
你是一个经验丰富的高级软件工程师，具有15年的软件开发经验，
专精于多种编程语言，熟悉代码质量标准和最佳实践。

## 任务描述
你的任务是对用户提供的代码进行全面审查，识别以下方面的问题：
- 代码质量和可读性
- 性能优化机会
- 安全漏洞
- 最佳实践违反
- 潜在的bug

## 输入信息
用户将提供：
- 编程语言：{programming_language}
- 代码内容：{code_content}
- 审查重点：{review_focus}

## 处理要求
1. 仔细分析代码的每个部分
2. 按照重要性对问题进行分类
3. 提供具体、可操作的改进建议
4. 如果需要，提供改进后的代码示例
5. 保持专业和建设性的语调

## 输出格式
## 代码审查报告

### 总体评价
[对代码整体质量的评估，包括优点和主要问题]

### 发现的问题
#### 高优先级问题
- [问题描述] - [具体位置] - [改进建议]

#### 中优先级问题
- [问题描述] - [具体位置] - [改进建议]

#### 低优先级问题
- [问题描述] - [具体位置] - [改进建议]

### 最佳实践建议
[针对代码风格和架构的建议]

### 优化后的代码
[如果需要重写，提供改进版本]

## 约束条件
- 审查报告长度控制在1000字以内
- 优先关注用户指定的审查重点
- 提供的建议必须具体可行
- 避免过于技术性的术语，保持易懂`}
                  </pre>
                </div>
              </div>

              {/* 内容创作示例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">示例2：内容创作助手</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 专业内容创作助手

## 角色定义
你是一个专业的内容创作专家，具有丰富的写作经验和营销背景，
擅长创作各种类型的内容，包括博客文章、社交媒体内容、营销文案等。

## 任务描述
根据用户提供的主题和要求，创作高质量、引人入胜的内容，
确保内容符合目标受众的需求和品牌调性。

## 输入信息
- 内容类型：{content_type}
- 主题：{topic}
- 目标受众：{target_audience}
- 语调风格：{tone}
- 字数要求：{word_count}
- 关键词：{keywords}

## 处理要求
1. 深入理解目标受众的需求和兴趣点
2. 确保内容结构清晰，逻辑流畅
3. 自然融入指定的关键词
4. 保持指定的语调和风格
5. 内容要有价值，能够解决读者的问题或满足需求

## 输出格式
# [吸引人的标题]

## 引言
[简短有力的开头，抓住读者注意力]

## 主要内容
### [小标题1]
[详细内容]

### [小标题2]
[详细内容]

### [小标题3]
[详细内容]

## 结论
[总结要点，包含行动号召]

---
**关键词密度检查：** [列出使用的关键词及频率]
**字数统计：** [实际字数]

## 约束条件
- 严格控制在指定字数范围内（±10%）
- 确保内容原创，避免抄袭
- 语言表达自然流畅，避免关键词堆砌
- 内容必须准确，避免误导信息`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 结构优化技巧 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">结构优化技巧</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 使用分层结构</h3>
                <p className="text-gray-600 mb-3">
                  将复杂的指令分解为多个层次，使用标题和子标题组织内容。
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`# 主要任务
## 子任务1
### 具体要求1.1
### 具体要求1.2
## 子任务2
### 具体要求2.1`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 使用编号和列表</h3>
                <p className="text-gray-600 mb-3">
                  对于步骤性的指令或多个要求，使用编号列表增强可读性。
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`请按照以下步骤进行：
1. 首先分析输入内容
2. 然后识别关键信息
3. 接着应用相关规则
4. 最后生成输出结果`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 添加示例和模板</h3>
                <p className="text-gray-600 mb-3">
                  提供具体的示例或模板，帮助AI更好地理解期望的输出。
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`输出示例：
标题：[具体标题]
摘要：[简短摘要]
内容：[详细内容]
标签：[相关标签]`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">4. 使用分隔符</h3>
                <p className="text-gray-600 mb-3">
                  使用分隔符清晰地区分不同的部分和内容。
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`---
角色设定
---
[角色描述]

---
任务要求
---
[任务描述]

---
输出格式
---
[格式说明]`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 常见结构问题 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">常见结构问题及解决方案</h2>
            
            <div className="space-y-6">
              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">问题1：指令过于复杂</h3>
                <p className="text-gray-600 mb-3">
                  <strong>症状：</strong> 在一个段落中包含多个不同的要求和指令
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>解决方案：</strong> 将复杂指令分解为多个简单的步骤
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-1">❌ 问题示例</h4>
                    <div className="bg-red-50 p-2 rounded text-xs">
                      请分析这段代码并找出所有问题同时提供改进建议还要重写代码并解释每个改动的原因以及评估性能影响。
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-1">✅ 改进示例</h4>
                    <div className="bg-green-50 p-2 rounded text-xs">
                      请按以下步骤分析代码：<br/>
                      1. 识别代码问题<br/>
                      2. 提供改进建议<br/>
                      3. 重写优化代码<br/>
                      4. 解释改动原因<br/>
                      5. 评估性能影响
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">问题2：缺乏明确的输出格式</h3>
                <p className="text-gray-600 mb-3">
                  <strong>症状：</strong> AI输出的格式不一致或不符合预期
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>解决方案：</strong> 提供详细的输出格式模板
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-1">❌ 问题示例</h4>
                    <div className="bg-red-50 p-2 rounded text-xs">
                      请总结这篇文章。
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-1">✅ 改进示例</h4>
                    <div className="bg-green-50 p-2 rounded text-xs">
                      请按以下格式总结：<br/>
                      **标题：** [文章标题]<br/>
                      **主要观点：** [3-5个要点]<br/>
                      **结论：** [一句话总结]<br/>
                      **字数：** [控制在200字以内]
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">问题3：角色定义模糊</h3>
                <p className="text-gray-600 mb-3">
                  <strong>症状：</strong> AI回答的专业水平和语调不符合预期
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>解决方案：</strong> 提供具体的角色背景和专业水平描述
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-1">❌ 问题示例</h4>
                    <div className="bg-red-50 p-2 rounded text-xs">
                      你是一个助手。
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-1">✅ 改进示例</h4>
                    <div className="bg-green-50 p-2 rounded text-xs">
                      你是一个拥有10年经验的资深产品经理，专精于SaaS产品设计，熟悉用户体验和商业模式分析。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🎯 结构设计最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">设计原则</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 保持结构清晰和逻辑性</li>
                <li>• 使用具体而非抽象的描述</li>
                <li>• 提供充分的上下文信息</li>
                <li>• 明确指定输出格式和要求</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">优化技巧</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 使用分层和编号组织内容</li>
                <li>• 添加示例和模板</li>
                <li>• 设置合理的约束条件</li>
                <li>• 定期测试和优化结构</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步学习</h2>
            <p className="text-gray-600 mb-4">
              现在您已经掌握了提示词结构设计的基础知识，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/best-practices/examples" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">添加有效示例</h3>
                <p className="text-sm text-gray-600">学习如何在提示词中添加有效的示例</p>
              </Link>
              
              <Link href="/docs/best-practices/optimization" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">提示词优化技巧</h3>
                <p className="text-sm text-gray-600">掌握高级的提示词优化方法</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructurePage; 
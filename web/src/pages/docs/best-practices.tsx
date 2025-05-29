import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const BestPracticesPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">提示词最佳实践</h1>
          <p className="mt-2 text-gray-600">
            学习如何设计高效、可靠的提示词，提高AI模型输出的质量和一致性
          </p>
        </div>

        {/* 提示词结构指南 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">提示词结构指南</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">明确角色和目标</h3>
                <p className="mt-2 text-gray-600">
                  在提示词开始时明确定义模型应该扮演的角色和需要完成的目标。这为模型提供了上下文框架，帮助它生成更符合期望的回答。
                </p>
                <div className="mt-3 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700">示例:</h4>
                  <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`你是一位经验丰富的法律顾问，专攻知识产权法。
你的任务是分析以下案例，并提供关于潜在版权侵权的专业意见。
请确保你的回答包含相关法律条款的引用和类似案例的参考。`}
                    </code>
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">使用清晰的格式和结构</h3>
                <p className="mt-2 text-gray-600">
                  使用清晰的格式来组织你的提示词，包括分段、项目符号和明确的章节。这不仅使提示词更易于阅读和理解，也引导模型以类似的结构回应。
                </p>
                <div className="mt-3 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700">示例:</h4>
                  <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`分析以下产品描述，并提供详细的市场营销建议。请按照以下结构组织你的回答：

1. 目标受众分析
   - 主要人口统计特征
   - 潜在痛点和需求

2. 价值主张
   - 核心优势
   - 差异化因素

3. 营销渠道建议
   - 线上渠道
   - 线下渠道

4. 信息传达策略
   - 关键信息点
   - 推荐的口号和标语`}
                    </code>
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">包含输入变量</h3>
                <p className="mt-2 text-gray-600">
                  使用模板变量使提示词更加灵活和可重用。在MCP Prompt Server中，变量使用双大括号表示，如<code className="bg-gray-200 px-1 py-0.5 rounded">{'{{variable_name}}'}</code>。
                </p>
                <div className="mt-3 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700">示例:</h4>
                  <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`你是一位资深的{{industry}}专家。请分析以下{{document_type}}并提供你的专业见解：

{{content}}

请特别关注以下方面：
1. {{aspect_1}}
2. {{aspect_2}}
3. {{aspect_3}}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 有效示例的重要性 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">添加有效示例</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">少样本学习的威力</h3>
                <p className="mt-2 text-gray-600">
                  通过在提示词中包含少量高质量的示例，可以显著提高模型的输出质量和一致性。这种技术被称为"少样本学习"(few-shot learning)，
                  它向模型展示了你期望的输出格式和风格。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">有效示例的特点</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">代表性：示例应该涵盖预期用例的典型场景</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">多样性：提供不同类型的示例以涵盖各种可能的情况</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">清晰性：示例应该清晰地显示输入和预期输出之间的关系</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-600">格式一致：所有示例应遵循相同的格式和结构</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">示例实践</h3>
                <div className="mt-3 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700">产品分类提示词示例:</h4>
                  <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-sm">
                    <code>
{`将给定的产品描述分类到最合适的类别中。使用以下类别之一：电子产品、服装、家居用品、健康与美容、玩具与游戏、食品与饮料。

示例:

输入: "Apple iPhone 13, 128GB, 5G智能手机，超视网膜XDR显示屏"
输出: 电子产品

输入: "100%纯棉T恤，圆领，短袖，适合日常穿着"
输出: 服装

输入: "有机红茶，20袋装，富含抗氧化剂"
输出: 食品与饮料

现在，请对以下产品进行分类:
{{product_description}}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 提示词优化技巧 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">提示词优化技巧</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">迭代测试与改进</h3>
                <p className="mt-2 text-gray-600">
                  提示词工程是一个迭代过程。创建初始版本后，应该进行测试，分析结果，并基于性能不断改进提示词。
                  MCP Prompt Server的性能追踪功能可以帮助你监控提示词的效果并发现优化机会。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">常见优化策略</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">1. 增加具体性</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      使用具体、明确的指令代替模糊的请求。指定预期输出的长度、格式、风格和详细程度。
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md">× 避免</span>
                      <p className="mt-1 text-sm text-gray-600">"写一篇关于气候变化的文章"</p>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">✓ 推荐</span>
                      <p className="mt-1 text-sm text-gray-600">"写一篇800字的科普文章，解释气候变化对海洋生态系统的三大影响，使用通俗易懂的语言面向高中生读者"</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">2. 设置约束条件</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      明确指出不应该包含的内容或需要避免的方向，这有助于模型更好地理解任务边界。
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md">× 避免</span>
                      <p className="mt-1 text-sm text-gray-600">"给我一个创业想法"</p>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">✓ 推荐</span>
                      <p className="mt-1 text-sm text-gray-600">"给我一个低成本启动的B2B SaaS创业想法。该想法应该解决远程工作团队面临的问题，不需要大量前期技术开发，并且有明确的变现路径。请避免已经饱和的市场，如项目管理或视频会议。"</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">3. 使用"思考链"(Chain-of-Thought)</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      引导模型一步步地思考问题，这对于复杂推理任务特别有效。
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md">× 避免</span>
                      <p className="mt-1 text-sm text-gray-600">"分析这家公司的财务状况"</p>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">✓ 推荐</span>
                      <p className="mt-1 text-sm text-gray-600">"分析这家公司的财务状况。请按以下步骤进行：1)先评估流动性比率，判断短期偿债能力；2)分析资产负债结构和长期偿债能力；3)评估盈利能力和收入增长趋势；4)最后，基于以上分析，给出对公司财务健康状况的综合评价。"</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">4. 分解复杂任务</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      将复杂任务分解为更小、更容易管理的子任务，这样模型可以更好地处理每个部分。
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md">× 避免</span>
                      <p className="mt-1 text-sm text-gray-600">"为我的电子商务网站创建一个完整的营销计划"</p>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">✓ 推荐</span>
                      <p className="mt-1 text-sm text-gray-600">"我需要为我的电子商务网站创建营销计划。让我们分步骤进行：首先，仅关注目标受众分析和客户画像。基于我销售的是&lbrace;&lbrace;product_type&rbrace;&rbrace;，请帮我确定2-3个关键客户群体及其特征。"</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">不同场景的优化提示</h3>
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">创意生成任务</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      为创意任务提供一些限制和结构，但也要留出足够的空间让模型发挥创造力。指定风格、长度、主题等约束，同时明确创意的目标和受众。
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">数据分析任务</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      清晰地定义要分析的数据格式，需要关注的指标，以及预期的分析深度。要求模型分步骤展示其分析过程，并明确最终结论应该回答的关键问题。
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">客户服务任务</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      强调回答的语气和风格（如专业、友好、简洁等），并提供处理常见问题的标准流程。包含处理敏感情况或复杂问题时的升级策略。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 常见错误与解决方案 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">常见错误与解决方案</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <h3 className="text-md font-medium text-gray-900">过于模糊的指令</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">问题：</span>模型不确定你想要什么，可能生成泛泛而谈或离题的回答。
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">解决方案：</span>使用具体、明确的指令，指定所需输出的确切格式、内容和长度。
                </p>
              </div>
              
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <h3 className="text-md font-medium text-gray-900">过长或复杂的提示词</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">问题：</span>模型可能无法处理所有信息，导致关键指令被忽略或回答不完整。
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">解决方案：</span>分解为更小的任务，使用清晰的结构和格式化，突出关键指令。
                </p>
              </div>
              
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <h3 className="text-md font-medium text-gray-900">缺乏上下文</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">问题：</span>模型没有足够的背景信息来生成准确、相关的回答。
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">解决方案：</span>提供必要的背景信息和上下文，但要避免不相关的细节。
                </p>
              </div>
              
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <h3 className="text-md font-medium text-gray-900">变量使用不当</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">问题：</span>模板变量定义不清或缺少默认值，导致使用时出错。
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">解决方案：</span>明确定义所有变量，提供清晰的描述和示例值，必要时设置默认值。
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-md font-medium text-blue-900 mb-2">提示词测试清单</h3>
              <p className="text-sm text-blue-800 mb-3">
                在将提示词添加到生产环境之前，请确保检查以下几点：
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                <li>提示词是否清晰说明了模型的角色和任务？</li>
                <li>是否包含了足够具体的指令？</li>
                <li>变量是否已明确定义并有示例？</li>
                <li>是否测试了多种输入场景？</li>
                <li>提示词是否过于冗长或复杂？</li>
                <li>是否有不必要的重复或冗余信息？</li>
                <li>是否包含了足够的示例（少样本学习）？</li>
                <li>是否为模型提供了评估或改进其回答的方法？</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPracticesPage;

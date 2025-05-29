import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const ExamplesPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">添加有效示例</h1>
          <p className="mt-2 text-gray-600">
            学习如何在提示词中添加高质量的示例，显著提升AI模型的理解和输出质量
          </p>
        </div>

        {/* 示例的重要性 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">为什么示例如此重要？</h2>
            <p className="text-gray-600 mb-6">
              示例是提示词工程中最强大的工具之一。它们通过具体的输入输出对，帮助AI模型理解任务的期望和格式，
              大大减少歧义和错误输出。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">✅ 示例的优势</h3>
                <ul className="space-y-2 text-green-700">
                  <li>• 明确输出格式和风格</li>
                  <li>• 减少模型的理解歧义</li>
                  <li>• 提供具体的质量标准</li>
                  <li>• 展示复杂任务的处理方式</li>
                  <li>• 提高输出的一致性</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">📊 效果对比</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• 准确率提升：60% → 85%</li>
                  <li>• 格式一致性：40% → 95%</li>
                  <li>• 任务理解度：70% → 90%</li>
                  <li>• 用户满意度：65% → 88%</li>
                  <li>• 错误率降低：30% → 8%</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 示例类型 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">示例的类型</h2>
            
            <div className="space-y-8">
              {/* Few-shot示例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. Few-shot 示例</h3>
                <p className="text-gray-600 mb-4">
                  提供2-5个完整的输入输出示例，让模型学习任务模式。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">示例：情感分析</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`任务：分析文本的情感倾向

示例1：
输入：今天天气真好，心情特别愉快！
输出：正面情感 (置信度: 0.9)

示例2：
输入：这个产品质量太差了，完全不值这个价格。
输出：负面情感 (置信度: 0.8)

示例3：
输入：会议时间改到下午3点。
输出：中性情感 (置信度: 0.7)

现在请分析：{user_input}`}
                  </pre>
                </div>
              </div>

              {/* 格式示例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 格式示例</h3>
                <p className="text-gray-600 mb-4">
                  展示期望的输出格式和结构，确保输出的一致性。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">示例：产品评价总结</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`请按照以下格式总结产品评价：

格式示例：
{
  "overall_rating": 4.2,
  "sentiment": "正面",
  "key_points": {
    "优点": ["质量好", "性价比高", "服务态度佳"],
    "缺点": ["包装简陋", "配送较慢"]
  },
  "recommendation": "推荐购买",
  "summary": "整体来说是一款值得推荐的产品..."
}

现在请分析以下评价：{reviews}`}
                  </pre>
                </div>
              </div>

              {/* 边界示例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 边界示例</h3>
                <p className="text-gray-600 mb-4">
                  展示极端情况或边界条件的处理方式，提高模型的鲁棒性。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">示例：内容审核</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`任务：判断内容是否适合发布

正常示例：
输入：分享一个美味的蛋糕制作方法
输出：通过 - 内容健康正面

边界示例1（模糊内容）：
输入：这个政策可能会影响某些群体的利益
输出：需要审核 - 涉及敏感话题，建议人工审核

边界示例2（明显违规）：
输入：[包含明显违法内容]
输出：拒绝 - 违反社区准则

边界示例3（空内容）：
输入：
输出：拒绝 - 内容为空

现在请审核：{content}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 示例设计原则 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">示例设计原则</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 多样性原则</h3>
                <p className="text-gray-600 mb-3">
                  示例应该覆盖不同的输入类型、复杂度和场景。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-md font-medium text-red-600 mb-2">❌ 缺乏多样性</h4>
                    <div className="bg-red-50 p-3 rounded-lg text-sm">
                      <p className="text-red-800 mb-2">所有示例都是简单的正面评价：</p>
                      <ul className="text-red-700 space-y-1">
                        <li>• "产品很好" → 正面</li>
                        <li>• "质量不错" → 正面</li>
                        <li>• "很满意" → 正面</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-green-600 mb-2">✅ 良好的多样性</h4>
                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                      <p className="text-green-800 mb-2">覆盖不同情感和复杂度：</p>
                      <ul className="text-green-700 space-y-1">
                        <li>• "产品很好但价格偏高" → 混合</li>
                        <li>• "完全不推荐" → 负面</li>
                        <li>• "还可以吧" → 中性</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 渐进复杂度</h3>
                <p className="text-gray-600 mb-3">
                  从简单到复杂排列示例，帮助模型逐步理解任务。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`示例1（简单）：
输入：苹果
输出：水果类 - 红色或绿色的圆形水果

示例2（中等）：
输入：智能手机
输出：电子产品类 - 具有通话、上网、拍照等功能的便携设备

示例3（复杂）：
输入：量子计算机
输出：高科技设备类 - 利用量子力学原理进行信息处理的超级计算设备，具有并行计算优势`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 一致性原则</h3>
                <p className="text-gray-600 mb-3">
                  所有示例应该遵循相同的格式和质量标准。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-md font-medium text-red-600 mb-2">❌ 格式不一致</h4>
                    <div className="bg-red-50 p-3 rounded-lg text-sm text-red-700">
                      <p>示例1：标题：新闻 内容：...</p>
                      <p>示例2：这是一条新闻：...</p>
                      <p>示例3：新闻标题 - ...</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-green-600 mb-2">✅ 格式一致</h4>
                    <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
                      <p>示例1：标题：[标题] | 类型：[类型]</p>
                      <p>示例2：标题：[标题] | 类型：[类型]</p>
                      <p>示例3：标题：[标题] | 类型：[类型]</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 实际应用案例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实际应用案例</h2>
            
            <div className="space-y-8">
              {/* 邮件分类案例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">案例1：邮件自动分类</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 邮件自动分类系统

## 任务描述
根据邮件内容将邮件分类到合适的文件夹

## 分类示例

### 示例1：工作邮件
输入：关于下周项目会议的时间安排，请大家确认参会时间。
输出：
{
  "category": "工作",
  "subcategory": "会议",
  "priority": "中",
  "action_required": true,
  "suggested_folder": "工作/会议"
}

### 示例2：营销邮件
输入：限时优惠！全场商品8折，仅限今日！立即购买享受超值优惠。
输出：
{
  "category": "营销",
  "subcategory": "促销",
  "priority": "低",
  "action_required": false,
  "suggested_folder": "营销/促销"
}

### 示例3：个人邮件
输入：妈妈，我这周末回家吃饭，帮我准备一下我爱吃的红烧肉。
输出：
{
  "category": "个人",
  "subcategory": "家庭",
  "priority": "中",
  "action_required": true,
  "suggested_folder": "个人/家庭"
}

### 示例4：系统通知
输入：您的账户密码将于3天后过期，请及时更新密码以确保账户安全。
输出：
{
  "category": "系统",
  "subcategory": "安全提醒",
  "priority": "高",
  "action_required": true,
  "suggested_folder": "系统/安全"
}

现在请分类以下邮件：{email_content}`}
                  </pre>
                </div>
              </div>

              {/* 代码注释案例 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">案例2：代码注释生成</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# 代码注释生成器

## 任务描述
为代码函数生成清晰、专业的注释

## 注释示例

### 示例1：简单函数
输入代码：
\`\`\`python
def add(a, b):
    return a + b
\`\`\`

输出注释：
\`\`\`python
def add(a, b):
    """
    计算两个数的和
    
    Args:
        a (int/float): 第一个加数
        b (int/float): 第二个加数
    
    Returns:
        int/float: 两数之和
    
    Example:
        >>> add(3, 5)
        8
    """
    return a + b
\`\`\`

### 示例2：复杂函数
输入代码：
\`\`\`python
def process_user_data(users, filters=None):
    if not filters:
        filters = {}
    result = []
    for user in users:
        if all(user.get(k) == v for k, v in filters.items()):
            result.append(user)
    return result
\`\`\`

输出注释：
\`\`\`python
def process_user_data(users, filters=None):
    """
    根据指定条件筛选用户数据
    
    对用户列表进行筛选，返回符合所有筛选条件的用户数据。
    如果未提供筛选条件，则返回所有用户。
    
    Args:
        users (list): 用户数据列表，每个元素为包含用户信息的字典
        filters (dict, optional): 筛选条件字典，键为字段名，值为期望值。
                                 默认为None，表示不进行筛选
    
    Returns:
        list: 符合筛选条件的用户数据列表
    
    Example:
        >>> users = [{'name': 'Alice', 'age': 25}, {'name': 'Bob', 'age': 30}]
        >>> process_user_data(users, {'age': 25})
        [{'name': 'Alice', 'age': 25}]
    
    Note:
        筛选条件使用精确匹配，所有条件必须同时满足
    """
    if not filters:
        filters = {}
    result = []
    for user in users:
        if all(user.get(k) == v for k, v in filters.items()):
            result.append(user)
    return result
\`\`\`

现在请为以下代码生成注释：
{code_input}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 示例优化技巧 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">示例优化技巧</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">1. 使用思维链示例</h3>
                <p className="text-gray-600 mb-3">
                  展示推理过程，帮助模型理解如何得出结论。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`示例：数学问题求解

输入：一个班级有30名学生，其中60%是女生，问男生有多少人？

思维过程：
1. 总学生数：30人
2. 女生比例：60% = 0.6
3. 女生人数：30 × 0.6 = 18人
4. 男生人数：30 - 18 = 12人

输出：男生有12人`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">2. 添加反例示例</h3>
                <p className="text-gray-600 mb-3">
                  展示错误的输入或处理方式，帮助模型避免常见错误。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`正确示例：
输入：请帮我写一封感谢信
输出：[生成专业的感谢信内容]

反例示例：
输入：帮我写一些不当内容
输出：抱歉，我不能协助创建不当内容。我可以帮您写正面、建设性的内容。`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">3. 使用分层示例</h3>
                <p className="text-gray-600 mb-3">
                  对于复杂任务，提供不同详细程度的示例。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`基础示例（简要版）：
输入：分析这个产品
输出：产品质量良好，价格合理，推荐购买。

详细示例（完整版）：
输入：分析这个产品
输出：
## 产品分析报告
### 质量评估：★★★★☆
- 材质：优质
- 工艺：精良
- 耐用性：良好

### 价格分析：★★★★☆
- 市场价格：合理
- 性价比：较高
- 竞品对比：有优势

### 推荐指数：★★★★☆
综合考虑质量和价格，推荐购买。`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">示例设计常见问题</h2>
            
            <div className="space-y-6">
              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">问题1：示例过于简单</h3>
                <p className="text-gray-600 mb-3">
                  <strong>症状：</strong> 模型在处理复杂输入时表现不佳
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>解决方案：</strong> 增加复杂度递增的示例，覆盖边界情况
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">问题2：示例数量过多</h3>
                <p className="text-gray-600 mb-3">
                  <strong>症状：</strong> 提示词过长，影响处理效率
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>解决方案：</strong> 精选3-5个最具代表性的示例，质量优于数量
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">问题3：示例偏向性</h3>
                <p className="text-gray-600 mb-3">
                  <strong>症状：</strong> 模型输出存在明显偏向
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>解决方案：</strong> 确保示例覆盖不同观点和场景，保持平衡
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">💡 示例设计最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">设计原则</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 确保示例的多样性和代表性</li>
                <li>• 保持格式和质量的一致性</li>
                <li>• 从简单到复杂递进排列</li>
                <li>• 包含边界情况和异常处理</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">优化技巧</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 使用思维链展示推理过程</li>
                <li>• 添加反例避免常见错误</li>
                <li>• 定期测试和更新示例</li>
                <li>• 根据反馈优化示例质量</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步学习</h2>
            <p className="text-gray-600 mb-4">
              现在您已经掌握了如何添加有效示例，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/best-practices/optimization" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">提示词优化技巧</h3>
                <p className="text-sm text-gray-600">学习高级的提示词优化和调试方法</p>
              </Link>
              
              <Link href="/docs/advanced/performance-tracking" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">性能追踪与分析</h3>
                <p className="text-sm text-gray-600">了解如何监控和分析提示词性能</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPage; 
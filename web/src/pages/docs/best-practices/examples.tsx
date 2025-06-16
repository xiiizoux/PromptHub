import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ExamplesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-gradient-to-br from-neon-yellow/10 to-neon-green/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 py-8">
        <div className="container-custom">
          {/* 返回按钮 */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/docs/best-practices" className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-white transition-colors group">
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回最佳实践
            </Link>
          </motion.div>

          {/* 页面标题 */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-4">
              添加有效示例
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
              学习如何在提示词中添加高质量的示例，显著提升AI模型的理解和输出质量
            </p>
          </motion.div>

          {/* 示例的重要性 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-cyan/30 mb-8 hover:border-neon-cyan/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-6">
              为什么示例如此重要？
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              示例是提示词工程中最强大的工具之一。它们通过具体的输入输出对，帮助AI模型理解任务的期望和格式，
              大大减少歧义和错误输出。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="cyber-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neon-green mb-4 flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <span className="neon-glow">示例的优势</span>
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center">
                      <span className="text-neon-green mr-3">•</span>
                      明确输出格式和风格
                    </li>
                    <li className="flex items-center">
                      <span className="text-neon-green mr-3">•</span>
                      减少模型的理解歧义
                    </li>
                    <li className="flex items-center">
                      <span className="text-neon-green mr-3">•</span>
                      提供具体的质量标准
                    </li>
                    <li className="flex items-center">
                      <span className="text-neon-green mr-3">•</span>
                      展示复杂任务的处理方式
                    </li>
                    <li className="flex items-center">
                      <span className="text-neon-green mr-3">•</span>
                      提高输出的一致性
                    </li>
                  </ul>
                </div>
              </motion.div>
              
              <motion.div 
                className="cyber-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neon-blue mb-4 flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <span className="neon-glow">效果对比</span>
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center justify-between">
                      <span>准确率提升：</span>
                      <span className="text-neon-cyan font-mono">60% → 85%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>格式一致性：</span>
                      <span className="text-neon-cyan font-mono">40% → 95%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>任务理解度：</span>
                      <span className="text-neon-cyan font-mono">70% → 90%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>用户满意度：</span>
                      <span className="text-neon-cyan font-mono">65% → 88%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>错误率降低：</span>
                      <span className="text-neon-cyan font-mono">30% → 8%</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 示例类型 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-purple/30 mb-8 hover:border-neon-purple/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-8">
              示例的类型
            </h2>
            
            <div className="space-y-10">
              {/* Few-shot示例 */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Few-shot 示例
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  提供2-5个完整的输入输出示例，让模型学习任务模式。
                </p>
                
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-cyan/10 to-transparent border-b border-neon-cyan/20">
                    <h4 className="font-semibold text-neon-cyan">示例：情感分析</h4>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
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
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                  格式示例
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  展示期望的输出格式和结构，确保输出的一致性。
                </p>
                
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                    <h4 className="font-semibold text-neon-purple">示例：产品评价总结</h4>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
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
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-neon-pink to-neon-yellow rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                  边界示例
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  展示极端情况或边界条件的处理方式，提高模型的鲁棒性。
                </p>
                
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-pink/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-pink/10 to-transparent border-b border-neon-pink/20">
                    <h4 className="font-semibold text-neon-pink">示例：内容审核</h4>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
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
          </motion.div>

          {/* 示例设计原则 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-green/30 mb-8 hover:border-neon-green/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-8">
              示例设计原则
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">1. 多样性原则</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  示例应该覆盖不同的输入类型、复杂度和场景。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                      <span className="mr-2">❌</span>
                      缺乏多样性
                    </h4>
                    <div className="space-y-3">
                      <p className="text-red-300 text-sm mb-3">所有示例都是简单的正面评价：</p>
                      <ul className="text-gray-300 space-y-2 text-sm">
                        <li className="flex items-center">
                          <span className="text-red-400 mr-2">•</span>
                          "产品很好" → 正面
                        </li>
                        <li className="flex items-center">
                          <span className="text-red-400 mr-2">•</span>
                          "质量不错" → 正面
                        </li>
                        <li className="flex items-center">
                          <span className="text-red-400 mr-2">•</span>
                          "很满意" → 正面
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                      <span className="mr-2">✅</span>
                      良好的多样性
                    </h4>
                    <div className="space-y-3">
                      <p className="text-green-300 text-sm mb-3">覆盖不同情感和复杂度：</p>
                      <ul className="text-gray-300 space-y-2 text-sm">
                        <li className="flex items-center">
                          <span className="text-green-400 mr-2">•</span>
                          "产品很好但价格偏高" → 混合
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-400 mr-2">•</span>
                          "完全不推荐" → 负面
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-400 mr-2">•</span>
                          "还可以吧" → 中性
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">2. 渐进复杂度</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  从简单的示例开始，逐步增加复杂度，帮助模型理解任务的层次性。
                </p>
                
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-blue/20 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-sm font-bold">简</div>
                      <div className="flex-1 h-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded"></div>
                      <div className="w-8 h-8 bg-neon-purple rounded-full flex items-center justify-center text-sm font-bold">中</div>
                      <div className="flex-1 h-1 bg-gradient-to-r from-neon-purple to-neon-pink rounded"></div>
                      <div className="w-8 h-8 bg-neon-pink rounded-full flex items-center justify-center text-sm font-bold">复</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                      <div className="text-center">
                        <p className="text-neon-cyan font-semibold mb-2">简单示例</p>
                        <p className="text-gray-400">单一明确的输入输出</p>
                      </div>
                      <div className="text-center">
                        <p className="text-neon-purple font-semibold mb-2">中等示例</p>
                        <p className="text-gray-400">包含一些变化和条件</p>
                      </div>
                      <div className="text-center">
                        <p className="text-neon-pink font-semibold mb-2">复杂示例</p>
                        <p className="text-gray-400">多层次、多变量处理</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPage; 
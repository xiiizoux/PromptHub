import React from 'react';
import Link from 'next/link';
import { CubeIcon, CodeBracketIcon, ListBulletIcon, DocumentTextIcon, SparklesIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';

const TemplateVariablesPage: React.FC = () => {
  return (
    <DocLayout
      title="使用模板变量"
      description="学习如何使用模板变量让您的提示词更加灵活和可重用"
      backLink="/docs/getting-started"
      backText="返回入门指南"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '入门指南', href: '/docs/getting-started' },
        { name: '模板变量', href: '/docs/getting-started/template-variables' },
      ]}
    >
      {/* 什么是模板变量 */}
      <motion.div 
        className="glass rounded-2xl p-8 border border-neon-cyan/30 mb-8 hover:border-neon-cyan/50 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-6 flex items-center">
          <CubeIcon className="h-8 w-8 text-neon-cyan mr-3" />
          什么是模板变量？
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          模板变量是提示词中的占位符，可以在使用时动态替换为具体的值。这使得一个提示词可以适用于多种不同的场景和输入。
        </p>
        <div className="bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 border border-neon-purple/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <SparklesIcon className="h-6 w-6 text-neon-purple mr-2" />
            示例对比
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neon-red font-medium mb-2">❌ 不使用变量的提示词：</p>
              <div className="bg-dark-bg-secondary rounded-lg border-l-4 border-neon-red p-4">
                <code className="text-gray-300 text-sm">
                  请帮我写一封关于产品发布的邮件
                </code>
              </div>
            </div>
            <div>
              <p className="text-sm text-neon-green font-medium mb-2">✅ 使用变量的提示词：</p>
              <div className="bg-dark-bg-secondary rounded-lg border-l-4 border-neon-green p-4">
                <code className="text-gray-300 text-sm">
                  请帮我写一封关于<span className="text-neon-cyan font-semibold">{'{topic}'}</span>的<span className="text-neon-purple font-semibold">{'{email_type}'}</span>
                </code>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 变量语法 */}
      <motion.div 
        className="glass rounded-2xl p-8 border border-neon-purple/30 mb-8 hover:border-neon-purple/50 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-6 flex items-center">
          <CodeBracketIcon className="h-8 w-8 text-neon-purple mr-3" />
          变量语法
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Prompt Hub 支持多种变量语法格式：
        </p>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">基本语法</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="cyber-card p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium text-neon-cyan mb-3">花括号语法：</p>
                <div className="bg-dark-bg-secondary rounded-lg p-3 border border-neon-cyan/20">
                  <code className="text-neon-cyan font-mono">{'{variable_name}'}</code>
                </div>
              </motion.div>
              <motion.div 
                className="cyber-card p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium text-neon-purple mb-3">双花括号语法：</p>
                <div className="bg-dark-bg-secondary rounded-lg p-3 border border-neon-purple/20">
                  <code className="text-neon-purple font-mono">{'{{variable_name}}'}</code>
                </div>
              </motion.div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">变量命名规则</h3>
            <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/30 rounded-xl p-6">
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-neon-cyan rounded-full mr-3 flex-shrink-0"></span>
                  只能包含字母、数字和下划线
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-neon-purple rounded-full mr-3 flex-shrink-0"></span>
                  必须以字母开头
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-neon-pink rounded-full mr-3 flex-shrink-0"></span>
                  建议使用描述性的名称，如 <code className="bg-dark-bg-secondary px-2 py-1 rounded text-neon-cyan">user_name</code>、<code className="bg-dark-bg-secondary px-2 py-1 rounded text-neon-purple">product_type</code>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-neon-yellow rounded-full mr-3 flex-shrink-0"></span>
                  避免使用保留关键字
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 常用变量类型 */}
      <motion.div 
        className="glass rounded-2xl p-8 border border-neon-pink/30 mb-8 hover:border-neon-pink/50 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent mb-6 flex items-center">
          <ListBulletIcon className="h-8 w-8 text-neon-pink mr-3" />
          常用变量类型
        </h2>
        
        <div className="space-y-8">
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-neon-cyan mr-2" />
              文本变量
            </h3>
            <p className="text-gray-300 mb-4">用于替换文本内容</p>
            <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 p-6">
              <div className="text-sm text-gray-300 mb-2">
                <span className="bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded text-xs font-semibold">TEXT</span>
              </div>
              <pre className="text-sm text-gray-300 leading-relaxed">
{'你是一个专业的'}<span className="text-neon-cyan font-semibold">{'{role}'}</span>{'，请帮助用户解决'}<span className="text-neon-purple font-semibold">{'{problem_type}'}</span>{`相关的问题。

用户问题：`}<span className="text-neon-pink font-semibold">{'{user_question}'}</span>{`

请提供详细的解答。`}
              </pre>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ListBulletIcon className="h-6 w-6 text-neon-purple mr-2" />
              列表变量
            </h3>
            <p className="text-gray-300 mb-4">用于处理多个项目或选项</p>
            <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 p-6">
              <div className="text-sm text-gray-300 mb-2">
                <span className="bg-neon-purple/20 text-neon-purple px-2 py-1 rounded text-xs font-semibold">LIST</span>
              </div>
              <pre className="text-sm text-gray-300 leading-relaxed">
{'请分析以下'}<span className="text-neon-cyan font-semibold">{'{analysis_type}'}</span>{`：

项目列表：
`}<span className="text-neon-purple font-semibold">{'{item_list}'}</span>{`

分析要求：`}<span className="text-neon-pink font-semibold">{'{requirements}'}</span>
              </pre>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ClipboardDocumentIcon className="h-6 w-6 text-neon-pink mr-2" />
              格式变量
            </h3>
            <p className="text-gray-300 mb-4">用于指定输出格式</p>
            <div className="bg-dark-bg-secondary rounded-xl border border-neon-pink/20 p-6">
              <div className="text-sm text-gray-300 mb-2">
                <span className="bg-neon-pink/20 text-neon-pink px-2 py-1 rounded text-xs font-semibold">FORMAT</span>
              </div>
              <pre className="text-sm text-gray-300 leading-relaxed">
{'请将以下内容转换为'}<span className="text-neon-cyan font-semibold">{'{output_format}'}</span>{`格式：

原始内容：`}<span className="text-neon-purple font-semibold">{'{input_content}'}</span>{`

输出要求：`}<span className="text-neon-pink font-semibold">{'{format_requirements}'}</span>
              </pre>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 实际应用示例 */}
      <motion.div 
        className="glass rounded-2xl p-8 border border-neon-green/30 mb-8 hover:border-neon-green/50 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-6 flex items-center">
          <SparklesIcon className="h-8 w-8 text-neon-green mr-3" />
          实际应用示例
        </h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">📧 邮件写作助手</h3>
            <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 p-6">
              <div className="text-sm text-gray-300 mb-4">
                <span className="bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded text-xs font-semibold">EMAIL ASSISTANT</span>
              </div>
              <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
{`你是一个专业的邮件写作助手。

请帮我写一封`}<span className="text-neon-cyan font-semibold">{'{email_type}'}</span>{`邮件，内容如下：

收件人：`}<span className="text-neon-purple font-semibold">{'{recipient}'}</span>{`
主题：`}<span className="text-neon-pink font-semibold">{'{subject}'}</span>{`
主要内容：`}<span className="text-neon-yellow font-semibold">{'{main_content}'}</span>{`
语调：`}<span className="text-neon-green font-semibold">{'{tone}'}</span>{`

请确保邮件：
1. 语言`}<span className="text-neon-green font-semibold">{'{tone}'}</span>{`且专业
2. 结构清晰
3. 包含适当的开头和结尾
4. 长度适中

输出格式：
主题：[邮件主题]
正文：[邮件正文]`}
              </pre>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-300 font-semibold mb-2">🔧 变量说明：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-400">
                  <code className="bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded mr-2">email_type</code>
                  商务、感谢、道歉等
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <code className="bg-neon-purple/20 text-neon-purple px-2 py-1 rounded mr-2">recipient</code>
                  收件人姓名或称呼
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <code className="bg-neon-pink/20 text-neon-pink px-2 py-1 rounded mr-2">subject</code>
                  邮件主题
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <code className="bg-neon-yellow/20 text-neon-yellow px-2 py-1 rounded mr-2">main_content</code>
                  主要内容要点
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <code className="bg-neon-green/20 text-neon-green px-2 py-1 rounded mr-2">tone</code>
                  正式、友好、紧急等
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">🔍 代码审查助手</h3>
            <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 p-6">
              <div className="text-sm text-gray-300 mb-4">
                <span className="bg-neon-purple/20 text-neon-purple px-2 py-1 rounded text-xs font-semibold">CODE REVIEWER</span>
              </div>
              <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
{'你是一个经验丰富的'}<span className="text-neon-cyan font-semibold">{'{programming_language}'}</span>{`开发者和代码审查员。

请审查以下`}<span className="text-neon-purple font-semibold">{'{code_type}'}</span>{`代码：

\`\`\``}<span className="text-neon-cyan font-semibold">{'{programming_language}'}</span>{`
`}<span className="text-neon-pink font-semibold">{'{code_content}'}</span>{`
\`\`\`

审查重点：`}<span className="text-neon-yellow font-semibold">{'{review_focus}'}</span>{`

请提供：
1. 代码质量评估
2. 潜在问题识别
3. 性能优化建议
4. 最佳实践建议
5. 修改建议（如需要）

输出格式：
## 总体评价
[整体评价]`}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>
    </DocLayout>
  );
};

export default TemplateVariablesPage;
import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, CubeIcon, LinkIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const IntegrationPage: React.FC = () => {
  return (
    <DocLayout
      title="系统集成"
      description="学习如何将PromptHub与其他系统集成，包括MCP协议支持和各种集成方案"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '高级功能', href: '/docs/advanced' },
        { name: '系统集成', href: '/docs/advanced/integration' },
      ]}
    >

      <DocSection title="集成概述" delay={0.1}>
        <div className="space-y-8">
          <DocHighlight>
            PromptHub提供多种集成方式，支持与AI工具、开发环境、企业系统的无缝对接。
            通过标准化的API和MCP协议，实现提示词的统一管理和智能调用。
          </DocHighlight>
          
          <DocGrid cols={3}>
            <DocCard 
              title="MCP协议"
              description="标准化的AI模型上下文协议"
              icon={<CubeIcon className="h-6 w-6" />}
              color="blue"
            >
              <DocList 
                items={[
                  { title: '标准化提示词交互', description: '统一的协议接口' },
                  { title: '跨平台兼容性', description: '支持多种AI工具' },
                  { title: '自动工具发现', description: '动态发现可用工具' },
                  { title: '实时通信支持', description: '高效的数据交换' },
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="REST API"
              description="完整的HTTP API接口"
              icon={<LinkIcon className="h-6 w-6" />}
              color="green"
            >
              <DocList 
                items={[
                  { title: '完整的CRUD操作', description: '增删改查全支持' },
                  { title: '认证和权限控制', description: '安全的访问机制' },
                  { title: '批量操作支持', description: '高效的批处理' },
                  { title: '详细的错误处理', description: '清晰的错误信息' },
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="SDK和工具"
              description="多语言SDK和开发工具"
              icon={<CommandLineIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList 
                items={[
                  { title: 'JavaScript/Node.js SDK', description: 'Web开发支持' },
                  { title: 'Python客户端库', description: 'AI开发友好' },
                  { title: 'CLI工具', description: '命令行操作' },
                  { title: '浏览器扩展', description: '便捷的浏览器集成' },
                ]}
                className="mt-4"
              />
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

          {/* MCP协议集成 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-purple/30 mb-8 hover:border-neon-purple/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-8">
              MCP协议集成
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Model Context Protocol (MCP) 是一个开放标准，用于AI应用与外部数据源和工具的安全连接。
              PromptHub完全支持MCP协议，提供标准化的提示词管理服务。
            </p>
            
            <div className="space-y-10">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6">MCP服务器配置</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  将PromptHub配置为MCP服务器，为AI工具提供提示词管理功能。
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-neon-cyan mb-4">Claude Desktop配置示例</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 overflow-hidden">
                      <div className="px-6 py-3 bg-gradient-to-r from-neon-cyan/10 to-transparent border-b border-neon-cyan/20">
                        <span className="text-neon-cyan text-sm font-mono">~/.claude_desktop_config.json</span>
                      </div>
                      <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": [
        "/path/to/prompthub/mcp/dist/src/index.js"
      ],
      "env": {
        "PORT": "9010",
        "API_KEY": "your-secure-api-key",
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key",
        "TRANSPORT_TYPE": "stdio"
      }
    }
  }
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neon-purple mb-4">Cursor IDE配置示例</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                      <div className="px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                        <span className="text-neon-purple text-sm font-mono">.cursor/mcp_config.json</span>
                      </div>
                      <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
  "servers": {
    "prompthub": {
      "command": "node",
      "args": ["/path/to/prompthub/mcp/dist/src/index.js"],
      "env": {
        "API_KEY": "your-api-key",
        "STORAGE_TYPE": "supabase"
      }
    }
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-neon-blue/20 to-neon-cyan/20 border border-neon-cyan/30 rounded-xl p-6 mt-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/30 flex items-center justify-center">
                      <span className="text-neon-cyan text-sm">💡</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neon-cyan mb-2">配置提示</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• 确保Node.js版本 ≥ 18.0.0</li>
                        <li>• API密钥需要具有适当的权限</li>
                        <li>• 支持本地文件存储和Supabase云存储</li>
                        <li>• 可以通过环境变量覆盖配置</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-6">可用的MCP工具</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  PromptHub提供以下MCP工具，支持完整的提示词生命周期管理：
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="cyber-card p-6">
                    <h4 className="font-semibold text-neon-green mb-4">基础管理工具</h4>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">search_prompts</code> - 搜索提示词
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">get_prompt</code> - 获取特定提示词
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">create_prompt</code> - 创建新提示词
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">update_prompt</code> - 更新现有提示词
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">delete_prompt</code> - 删除提示词
                      </li>
                    </ul>
                  </div>
                  
                  <div className="cyber-card p-6">
                    <h4 className="font-semibold text-neon-purple mb-4">高级功能工具</h4>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">list_categories</code> - 获取分类列表
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">get_prompt_versions</code> - 版本历史
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">export_prompts</code> - 批量导出
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">import_prompts</code> - 批量导入
                      </li>
                      <li className="flex items-center">
                        <span className="text-neon-green mr-2">•</span>
                        <code className="text-neon-cyan">analyze_performance</code> - 性能分析
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-6">MCP工具使用示例</h3>
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-neon-cyan mb-4">搜索提示词</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 overflow-hidden">
                      <div className="px-6 py-3 bg-gradient-to-r from-neon-cyan/10 to-transparent border-b border-neon-cyan/20">
                        <span className="text-neon-cyan text-sm font-mono">工具调用示例</span>
                      </div>
                      <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`// 工具调用
{
  "name": "search_prompts",
  "arguments": {
    "query": "代码审查",
    "category": "编程",
    "limit": 5
  }
}

// 响应结果
{
  "content": [
    {
      "type": "text",
      "text": "找到 3 个匹配的提示词:\\n\\n1. **代码审查助手**\\n   - 描述: 专业的代码质量检查工具\\n   - 分类: 编程\\n   - 标签: 代码, 审查, 质量\\n\\n2. **安全代码审查**\\n   - 描述: 专注于安全漏洞检测\\n   - 分类: 编程\\n   - 标签: 安全, 代码, 审查\\n\\n3. **性能代码审查**\\n   - 描述: 性能优化建议\\n   - 分类: 编程\\n   - 标签: 性能, 代码, 优化"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neon-purple mb-4">创建提示词</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                      <div className="px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                        <span className="text-neon-purple text-sm font-mono">创建工具调用</span>
                      </div>
                      <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`// 工具调用
{
  "name": "create_prompt",
  "arguments": {
    "name": "code-reviewer-v2",
    "description": "增强版代码审查助手",
    "content": "你是一个专业的代码审查员...",
    "category": "编程",
    "tags": ["代码", "审查", "质量"],
    "is_public": true
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
    </DocLayout>
  );
};

export default IntegrationPage; 
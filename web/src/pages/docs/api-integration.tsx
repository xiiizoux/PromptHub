import React from 'react';
import Link from 'next/link';
import { KeyIcon, CloudIcon, CodeBracketIcon, CogIcon, ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const APIIntegrationPage: React.FC = () => {
  const authMethods = [
    { title: "API密钥认证", description: "简单安全的认证方式" },
    { title: "Bearer Token", description: "标准化令牌认证" },
    { title: "用户会话认证", description: "基于会话的认证" },
    { title: "OAuth 2.0支持", description: "企业级授权标准" }
  ];

  const responseFeatures = [
    { title: "统一JSON响应", description: "标准化数据格式" },
    { title: "标准HTTP状态码", description: "明确的状态指示" },
    { title: "详细错误信息", description: "精确的错误描述" },
    { title: "分页数据支持", description: "高效数据处理" }
  ];

  const setupSteps = [
    { title: "登录账户", description: "访问PromptHub并登录您的账户" },
    { title: "进入设置", description: "点击用户头像 → 个人设置" },
    { title: "API密钥管理", description: '选择"API密钥"标签页' },
    { title: "创建密钥", description: '点击"创建新密钥"并设置权限' },
    { title: "保存密钥", description: "复制并安全存储您的API密钥" }
  ];

  const queryParams = [
    { title: "page", description: "页码（默认：1）" },
    { title: "limit", description: "每页数量（默认：20）" },
    { title: "category", description: "按分类筛选" },
    { title: "search", description: "搜索关键词" }
  ];

  const relatedResources = [
    {
      title: "🔌 MCP集成",
      description: "了解如何通过MCP协议集成AI工具",
      href: "/docs/mcp-integration"
    },
    {
      title: "📖 基础功能",
      description: "掌握PromptHub的核心功能和使用方法",
      href: "/docs/basic-features"
    },
    {
      title: "📚 示例库",
      description: "丰富的代码示例和最佳实践",
      href: "/docs/examples-library"
    }
  ];

  const getPromptsExample = `# 获取提示词列表 - 生产环境
curl -X GET "https://prompt-hub.cc/api/prompts" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# 本地开发环境
curl -X GET "http://localhost:9011/api/prompts" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# 带查询参数的请求
curl -X GET "https://prompt-hub.cc/api/prompts?page=1&limit=10&category=编程" \\
  -H "X-Api-Key: YOUR_API_KEY"`;

  const responseExample = `{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "uuid",
        "name": "general_assistant",
        "description": "通用助手提示词",
        "category": "通用",
        "tags": ["对话", "助手", "基础"],
        "is_public": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}`;

  const createPromptExample = `{
  "name": "code_reviewer",
  "description": "代码审查助手",
  "messages": [
    {
      "role": "system",
      "content": {
        "type": "text",
        "text": "你是一个专业的代码审查员。请仔细分析提供的代码并给出建议。"
      }
    }
  ],
  "category": "开发工具",
  "tags": ["代码审查", "开发", "质量保证"],
  "is_public": false
}`;

  return (
    <DocLayout
      title="API集成指南"
      description="学习如何通过REST API将PromptHub集成到您的应用程序中"
      breadcrumbs={[
        { name: "文档", href: "/docs" },
        { name: "API集成", href: "/docs/api-integration" }
      ]}
    >
      {/* API概述 */}
      <DocSection title="API概述" delay={0.1}>
        <p className="text-dark-text-secondary leading-relaxed mb-8">
          PromptHub提供完整的RESTful API，支持提示词的增删改查、用户认证、性能分析等功能。
          所有API端点都支持JSON格式，遵循REST设计原则。
        </p>
        
        <DocGrid cols={2}>
          <DocCard 
            title="认证方式"
            description="多种安全认证选项"
            icon={<KeyIcon className="h-6 w-6" />}
            color="cyan"
          >
            <DocList items={authMethods} />
          </DocCard>
          
          <DocCard 
            title="响应格式"
            description="标准化的API响应"
            icon={<CloudIcon className="h-6 w-6" />}
            color="purple"
          >
            <DocList items={responseFeatures} />
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 快速开始 */}
      <DocSection title="快速开始" delay={0.2}>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center">
              <CogIcon className="h-6 w-6 text-neon-cyan mr-3" />
              1. 获取API密钥
            </h3>
            <p className="text-dark-text-secondary leading-relaxed mb-6">
              首先需要在PromptHub中生成API密钥：
            </p>
            <DocHighlight type="info">
              <h4 className="font-semibold mb-3">API密钥获取步骤：</h4>
              <DocList items={setupSteps} />
            </DocHighlight>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center">
              <CodeBracketIcon className="h-6 w-6 text-neon-purple mr-3" />
              2. 基础请求示例
            </h3>
            <DocCodeBlock 
              code={getPromptsExample}
              title="获取提示词列表"
              language="bash"
            />
          </div>
        </div>
      </DocSection>

      {/* 提示词管理API */}
      <DocSection title="提示词管理API" delay={0.3}>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">获取提示词列表</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="bg-neon-green/20 text-neon-green text-xs font-medium px-3 py-1 rounded-full border border-neon-green/30">GET</span>
                <code className="text-sm text-neon-cyan font-mono">/api/prompts</code>
              </div>
              
              <div>
                <h4 className="font-semibold text-dark-text-primary mb-3">查询参数</h4>
                <DocGrid cols={2}>
                  {queryParams.map((param, index) => (
                    <DocCard 
                      key={index}
                      title={param.title}
                      description={param.description}
                      color="cyan"
                      className="text-sm"
                    />
                  ))}
                </DocGrid>
              </div>
              
              <div>
                <h4 className="font-semibold text-dark-text-primary mb-3">响应示例</h4>
                <DocCodeBlock 
                  code={responseExample}
                  language="json"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">获取单个提示词</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="bg-neon-green/20 text-neon-green text-xs font-medium px-3 py-1 rounded-full border border-neon-green/30">GET</span>
                <code className="text-sm text-neon-cyan font-mono">/api/prompts/:name</code>
              </div>
              
              <div>
                <h4 className="font-semibold text-dark-text-primary mb-3">路径参数</h4>
                <DocCard 
                  title="name"
                  description="提示词名称"
                  color="purple"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">创建提示词</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="bg-neon-blue/20 text-neon-cyan text-xs font-medium px-3 py-1 rounded-full border border-neon-cyan/30">POST</span>
                <code className="text-sm text-neon-cyan font-mono">/api/prompts</code>
              </div>
              
              <div>
                <h4 className="font-semibold text-dark-text-primary mb-3">请求体示例</h4>
                <DocCodeBlock 
                  code={createPromptExample}
                  language="json"
                />
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      {/* 错误处理 */}
      <DocSection title="错误处理" delay={0.4}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            API使用标准HTTP状态码指示请求结果，并在响应体中提供详细的错误信息。
          </p>
          
          <DocGrid cols={2}>
            <DocCard 
              title="400 - 请求错误"
              description="请求参数缺失或格式错误"
              color="yellow"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• JSON格式不正确</li>
                <li>• 必需字段为空</li>
                <li>• 参数类型错误</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="401 - 未授权"
              description="API密钥无效或过期"
              color="pink"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 缺少认证信息</li>
                <li>• 用户会话已过期</li>
                <li>• 权限不足</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="404 - 资源不存在"
              description="请求的资源未找到"
              color="purple"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 提示词不存在</li>
                <li>• API端点不存在</li>
                <li>• 用户无权访问</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="429 - 请求过于频繁"
              description="超出API调用限额"
              color="cyan"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 需要等待后重试</li>
                <li>• 考虑升级套餐</li>
                <li>• 优化请求频率</li>
              </ul>
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      {/* 相关资源 */}
      <DocSection title="相关资源" delay={0.5}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          更多集成和开发资源：
        </p>
        
        <DocGrid cols={3}>
          {relatedResources.map((resource, index) => (
            <Link key={index} href={resource.href}>
              <DocCard 
                title={resource.title}
                description={resource.description}
                color={index % 2 === 0 ? 'cyan' : 'purple'}
                className="hover:scale-105 cursor-pointer transition-transform duration-300"
              />
            </Link>
          ))}
        </DocGrid>
      </DocSection>
    </DocLayout>
  );
};

export default APIIntegrationPage;
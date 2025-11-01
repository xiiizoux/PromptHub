import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ShieldCheckIcon, ServerIcon, CogIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';
import { useLanguage } from '@/contexts/LanguageContext';

const ApiDocsPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <DocLayout
      title={t('docs.api.title') || "API参考"}
      description={t('docs.api.description') || "完整的API文档，帮助您将提示词集成到自己的应用程序中"}
      breadcrumbs={[
        { name: t('docs.breadcrumbs.docs'), href: '/docs' },
        { name: t('docs.api.title'), href: '/docs/api' },
      ]}
    >

      <DocSection title={t('docs.api.auth.title') || "认证"} delay={0.1}>
        <div className="space-y-8">
          <DocHighlight>
            {t('docs.api.auth.description') || "所有API请求都需要进行身份验证。MCP Prompt Server支持以下认证方式："}
          </DocHighlight>
          
          <DocCard 
            title={t('docs.api.auth.apiKeyTitle') || "API密钥认证"}
            description={t('docs.api.auth.apiKeyDesc') || "您可以通过以下任一方式提供API密钥"}
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            color="cyan"
          >
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-dark-text-primary mb-2">1. {t('docs.api.auth.header') || "请求头"}</h4>
                <DocCodeBlock 
                  code="x-api-key: your-api-key" 
                  language="text"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-dark-text-primary mb-2">2. {t('docs.api.auth.bearer') || "Bearer令牌"}</h4>
                <DocCodeBlock 
                  code="Authorization: Bearer your-api-key" 
                  language="text"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-dark-text-primary mb-2">3. {t('docs.api.auth.queryParam') || "查询参数"}</h4>
                <DocCodeBlock 
                  code="https://your-server.com/api/prompts?api_key=your-api-key" 
                  language="text"
                />
              </div>
            </div>
          </DocCard>
        </div>
      </DocSection>

      <DocSection title={t('docs.api.prompts.title') || "提示词API"} delay={0.2}>
        <div className="space-y-8">
          
          <div className="space-y-8">
            {/* 获取提示词列表 */}
            <div>
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">GET</span>
                <h3 className="ml-3 text-lg font-medium text-white">/prompts</h3>
              </div>
              <p className="text-dark-text-secondary mb-6">{t('docs.api.prompts.getList') || "获取提示词列表"}</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-white mb-4">{t('docs.api.prompts.queryParams') || "查询参数"}</h4>
                  <div className="overflow-hidden rounded-xl border border-dark-border">
                    <div className="bg-dark-bg-secondary/50 p-4">
                      <div className="grid grid-cols-3 gap-4 font-medium text-dark-text-primary text-sm">
                        <div>{t('docs.api.prompts.paramName') || "参数名"}</div>
                        <div>{t('docs.api.prompts.type') || "类型"}</div>
                        <div>{t('docs.api.prompts.description') || "描述"}</div>
                      </div>
                    </div>
                    <div className="divide-y divide-dark-border">
                      {[
                        { name: 'category', type: 'string', desc: '按类别筛选提示词' },
                        { name: 'tags', type: 'string[]', desc: '按标签筛选提示词' },
                        { name: 'search', type: 'string', desc: '在名称和描述中搜索' },
                        { name: 'author', type: 'string', desc: '按作者筛选提示词' },
                        { name: 'page', type: 'number', desc: '页码，默认为1' },
                        { name: 'pageSize', type: 'number', desc: '每页条数，默认为10' },
                      ].map((param, index) => (
                        <div key={index} className="p-4 hover:bg-dark-bg-secondary/30 transition-colors">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="font-mono text-neon-cyan">{param.name}</div>
                            <div className="text-neon-purple">{param.type}</div>
                            <div className="text-dark-text-tertiary">{param.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-white mb-4">{t('docs.api.prompts.responseExample') || "响应示例"}</h4>
                  <DocCodeBlock 
                    code={`{
  "data": [
    {
      "name": "creative-story-generator",
      "description": "根据用户提供的主题和关键词生成创意故事",
      "category": "创意写作",
      "tags": ["故事", "创意", "GPT-4"],
      "version": "1.0",
      "created_at": "2023-05-15T08:30:00Z",
      "author": "creative_user"
    },
    // 更多提示词...
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}`}
                    language="json"
                  />
                </div>
              </div>
            </div>
            
            {/* 获取提示词详情 */}
            <div>
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">GET</span>
                <h3 className="ml-3 text-lg font-medium text-white">/prompts/{'{name}'}</h3>
              </div>
              <p className="text-dark-text-secondary mb-6">{t('docs.api.prompts.getDetail') || "获取提示词详情"}</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-white mb-4">{t('docs.api.prompts.pathParams') || "路径参数"}</h4>
                  <div className="glass rounded-xl border border-dark-border p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-mono text-neon-cyan">name</div>
                      <div className="text-neon-purple">string</div>
                      <div className="text-dark-text-tertiary">提示词名称</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-white mb-4">响应示例</h4>
                  <DocCodeBlock 
                    code={`{
  "data": {
    "name": "creative-story-generator",
    "description": "根据用户提供的主题和关键词生成创意故事",
    "content": "你是一个富有创造力的故事生成器...",
    "category": "创意写作",
    "tags": ["故事", "创意", "GPT-4"],
    "version": "1.0",
    "created_at": "2023-05-15T08:30:00Z",
    "updated_at": "2023-06-10T14:22:00Z",
    "author": "creative_user",
    "template_format": "text",
    "input_variables": ["theme", "keywords"],
    "compatible_models": ["GPT-4", "GPT-3.5", "Claude-2"]
  }
}`}
                    language="json"
                  />
                </div>
              </div>
            </div>
            
            {/* 创建提示词 */}
            <div>
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">POST</span>
                <h3 className="ml-3 text-lg font-medium text-white">/prompts</h3>
              </div>
              <p className="text-dark-text-secondary mb-6">{t('docs.api.prompts.create') || "创建新提示词"}</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-white mb-4">{t('docs.api.prompts.requestBody') || "请求体"}</h4>
                  <DocCodeBlock 
                    code={`{
  "name": "code-reviewer",
  "description": "代码审查助手，提供代码质量和改进建议",
  "content": "你是一个专业的代码审查员...",
  "category": "代码辅助",
  "tags": ["代码", "审查", "编程"],
  "version": "1.0",
  "author": "developer_user",
  "input_variables": ["code", "language"],
  "compatible_models": ["GPT-4"]
}`}
                    language="json"
                  />
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-white mb-4">响应示例</h4>
                  <DocCodeBlock 
                    code={`{
  "success": true,
  "message": "提示词创建成功",
  "data": {
    "name": "code-reviewer",
    "description": "代码审查助手，提供代码质量和改进建议",
    "content": "你是一个专业的代码审查员...",
    "category": "代码辅助",
    "tags": ["代码", "审查", "编程"],
    "version": "1.0",
    "created_at": "2023-06-20T10:15:00Z",
    "author": "developer_user",
    "input_variables": ["code", "language"],
    "compatible_models": ["GPT-4"]
  }
}`}
                    language="json"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title={t('docs.api.performance.title') || "性能分析API"} delay={0.3}>
        <div className="space-y-8">
          <DocGrid cols={1}>
            <DocCard 
              title={t('docs.api.performance.trackUsage') || "追踪提示词使用"}
              description={t('docs.api.performance.trackUsageDesc') || "记录提示词使用情况，用于性能分析"}
              icon={<ServerIcon className="h-6 w-6" />}
              color="blue"
            >
              <div className="mt-4 space-y-4">
                <div className="flex items-center mb-2">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">POST</span>
                  <code className="ml-3 text-neon-cyan font-mono text-sm">/performance/track_prompt_usage</code>
                </div>
                <DocCodeBlock 
                  code={`{
  "prompt_id": "creative-story-generator",
  "version": "1.0",
  "input_tokens": 50,
  "output_tokens": 650,
  "latency": 3200,
  "success": true
}`}
                  language="json"
                />
              </div>
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      <DocSection title={t('docs.api.errors.title') || "错误处理"} delay={0.4}>
        <div className="space-y-8">
          <DocHighlight>
            {t('docs.api.errors.description') || "API请求可能会返回以下错误代码："}
          </DocHighlight>

          <div className="overflow-hidden rounded-xl border border-dark-border">
            <div className="bg-dark-bg-secondary/50 p-4">
              <div className="grid grid-cols-3 gap-4 font-medium text-dark-text-primary text-sm">
                <div>{t('docs.api.errors.statusCode') || "状态码"}</div>
                <div>{t('docs.api.errors.explanation') || "说明"}</div>
                <div>{t('docs.api.errors.example') || "示例"}</div>
              </div>
            </div>
            <div className="divide-y divide-dark-border">
              {[
                { code: '400', desc: '请求参数错误', example: '请求缺少必需的字段' },
                { code: '401', desc: '未授权', example: 'API密钥无效或过期' },
                { code: '404', desc: '资源不存在', example: '请求的提示词不存在' },
                { code: '429', desc: '请求过多', example: '超出API速率限制' },
                { code: '500', desc: '服务器错误', example: '服务器内部错误' },
              ].map((error, index) => (
                <div key={index} className="p-4 hover:bg-dark-bg-secondary/30 transition-colors">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono text-neon-red">{error.code}</div>
                    <div className="text-dark-text-secondary">{error.desc}</div>
                    <div className="text-dark-text-tertiary">{error.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">{t('docs.api.errors.errorFormat') || "错误响应格式"}</h3>
            <DocCodeBlock 
              code={`{
  "success": false,
  "message": "错误信息",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}`}
              language="json"
            />
          </div>
        </div>
      </DocSection>
      
      {/* API参考页面导航 */}
      <div className="mt-16">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-neon-cyan mr-3" />
          {t('docs.api.reference.title') || "详细参考"}
        </h3>
        <DocGrid cols={2}>
          <Link 
            href="/docs/api/authentication" 
            className="glass rounded-xl border border-dark-border p-6 hover:border-neon-cyan/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheckIcon className="h-6 w-6 text-neon-cyan group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-white">{t('docs.api.reference.auth') || "认证与授权"}</h4>
            </div>
            <p className="text-dark-text-secondary text-sm">{t('docs.api.reference.authDesc') || "详细的API认证和授权机制说明"}</p>
          </Link>
          
          <Link 
            href="/docs/api/prompts" 
            className="glass rounded-xl border border-dark-border p-6 hover:border-neon-purple/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <CogIcon className="h-6 w-6 text-neon-purple group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-white">{t('docs.api.reference.prompts') || "提示词API"}</h4>
            </div>
            <p className="text-dark-text-secondary text-sm">{t('docs.api.reference.promptsDesc') || "完整的提示词管理API参考"}</p>
          </Link>
        </DocGrid>
      </div>
    </DocLayout>
  );
};

export default ApiDocsPage;

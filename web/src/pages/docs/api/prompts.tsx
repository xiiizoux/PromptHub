import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, CommandLineIcon, CubeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const PromptsAPIPage: React.FC = () => {
  return (
    <DocLayout
      title="提示词 API"
      description="全面的提示词管理API，支持创建、查询、更新和删除操作"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: 'API参考', href: '/docs/api' },
        { name: '提示词 API', href: '/docs/api/prompts' },
      ]}
    >

      <DocSection title="基础配置" delay={0.1}>
        <div className="space-y-8">
          <DocHighlight>
            所有API请求都需要包含认证头部，并使用正确的基础URL。
          </DocHighlight>

          <DocGrid cols={2}>
            <DocCard 
              title="生产环境"
              description="正式环境的API配置"
              icon={<CubeIcon className="h-6 w-6" />}
              color="green"
            >
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-dark-text-tertiary text-sm">基础URL:</span>
                  <DocCodeBlock 
                    code="https://prompt-hub.cc/api"
                    language="text"
                    className="mt-1"
                  />
                </div>
                <div>
                  <span className="text-dark-text-tertiary text-sm">认证头部:</span>
                  <DocCodeBlock 
                    code="X-Api-Key: your-api-key"
                    language="text"
                    className="mt-1"
                  />
                </div>
              </div>
            </DocCard>

            <DocCard 
              title="本地开发"
              description="开发环境的API配置"
              icon={<CommandLineIcon className="h-6 w-6" />}
              color="purple"
            >
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-dark-text-tertiary text-sm">基础URL:</span>
                  <DocCodeBlock 
                    code="http://localhost:9011/api"
                    language="text"
                    className="mt-1"
                  />
                </div>
                <div>
                  <span className="text-dark-text-tertiary text-sm">认证头部:</span>
                  <DocCodeBlock 
                    code="X-Api-Key: your-api-key"
                    language="text"
                    className="mt-1"
                  />
                </div>
              </div>
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      <DocSection title="API概览" delay={0.2}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            提示词API提供完整的CRUD操作，支持批量处理、高级搜索和版本管理等功能。
          </p>
          
          <DocGrid cols={4}>
            <DocCard 
              title="查询"
              description="搜索和获取提示词"
              icon={<MagnifyingGlassIcon className="h-6 w-6" />}
              color="green"
            />
            
            <DocCard 
              title="创建"
              description="添加新的提示词"
              icon={<CubeIcon className="h-6 w-6" />}
              color="blue"
            />
            
            <DocCard 
              title="更新"
              description="修改现有提示词"
              icon={<CommandLineIcon className="h-6 w-6" />}
              color="purple"
            />
            
            <DocCard 
              title="管理"
              description="删除和批量操作"
              icon={<CommandLineIcon className="h-6 w-6" />}
              color="pink"
            />
          </DocGrid>
        </div>
      </DocSection>

      <DocSection title="获取提示词列表" delay={0.3}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400 font-mono">GET</span>
            <code className="text-neon-cyan font-mono">/api/prompts</code>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">查询参数</h3>
            <div className="overflow-hidden rounded-xl border border-dark-border">
              <div className="bg-dark-bg-secondary/50 p-4">
                <div className="grid grid-cols-4 gap-4 font-medium text-dark-text-primary text-sm">
                  <div>参数</div>
                  <div>类型</div>
                  <div>必需</div>
                  <div>说明</div>
                </div>
              </div>
              <div className="divide-y divide-dark-border">
                {[
                  { name: 'page', type: 'number', required: false, desc: '页码，默认1' },
                  { name: 'limit', type: 'number', required: false, desc: '每页数量，默认20' },
                  { name: 'category', type: 'string', required: false, desc: '分类筛选' },
                  { name: 'tags', type: 'string[]', required: false, desc: '标签筛选' },
                  { name: 'search', type: 'string', required: false, desc: '搜索关键词' },
                  { name: 'is_public', type: 'boolean', required: false, desc: '是否公开' },
                ].map((param, index) => (
                  <div key={index} className="p-4 hover:bg-dark-bg-secondary/30 transition-colors">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="font-mono text-neon-cyan">{param.name}</div>
                      <div className="text-neon-purple">{param.type}</div>
                      <div className={param.required ? 'text-neon-red' : 'text-dark-text-tertiary'}>
                        {param.required ? '是' : '否'}
                      </div>
                      <div className="text-dark-text-tertiary">{param.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
            <DocCodeBlock 
              code={`{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "prompt-123",
        "name": "code-reviewer",
        "description": "专业的代码审查助手",
        "category": "编程",
        "tags": ["代码", "审查", "质量"],
        "content": "你是一个专业的代码审查员...",
        "is_public": true,
        "author": {
          "id": "user-456",
          "name": "开发者"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "usage_count": 150,
        "rating": 4.8
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 98,
      "per_page": 20
    }
  }
}`}
              language="json"
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="获取单个提示词" delay={0.4}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400 font-mono">GET</span>
            <code className="text-neon-cyan font-mono">/api/prompts/:id</code>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">路径参数</h3>
            <div className="glass rounded-xl border border-dark-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-neon-cyan">id</span>
                  <span className="text-dark-text-tertiary ml-2">提示词的唯一标识符</span>
                </div>
                <span className="text-neon-purple">string</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
            <DocCodeBlock 
              code={`{
  "success": true,
  "data": {
    "id": "prompt-123",
    "name": "code-reviewer",
    "description": "专业的代码审查助手",
    "category": "编程",
    "tags": ["代码", "审查", "质量"],
    "content": "你是一个专业的代码审查员，具有多年的软件开发经验...",
    "is_public": true,
    "author": {
      "id": "user-456",
      "name": "开发者",
      "avatar": "https://example.com/avatar.jpg"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "usage_count": 150,
    "rating": 4.8,
    "version": "1.2.0"
  }
}`}
              language="json"
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="创建提示词" delay={0.5}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400 font-mono">POST</span>
            <code className="text-neon-cyan font-mono">/api/prompts</code>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">请求体</h3>
            <DocCodeBlock 
              code={`{
  "name": "email-writer",
  "description": "专业的邮件写作助手",
  "category": "文案",
  "tags": ["邮件", "写作", "商务"],
  "content": "你是一个专业的邮件写作专家，擅长撰写各种类型的商务邮件...",
  "is_public": true,
  "variables": [
    {
      "name": "recipient_name",
      "description": "收件人姓名",
      "type": "string",
      "required": true
    },
    {
      "name": "email_type",
      "description": "邮件类型",
      "type": "enum",
      "options": ["感谢", "邀请", "跟进", "道歉"],
      "required": true
    }
  ]
}`}
              language="json"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
            <DocCodeBlock 
              code={`{
  "success": true,
  "data": {
    "id": "prompt-789",
    "name": "email-writer",
    "description": "专业的邮件写作助手",
    "category": "文案",
    "tags": ["邮件", "写作", "商务"],
    "content": "你是一个专业的邮件写作专家...",
    "is_public": true,
    "author": {
      "id": "user-456",
      "name": "开发者"
    },
    "created_at": "2024-01-16T09:15:00Z",
    "updated_at": "2024-01-16T09:15:00Z",
    "usage_count": 0,
    "rating": 0,
    "version": "1.0.0"
  },
  "message": "提示词创建成功"
}`}
              language="json"
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="错误响应" delay={0.6}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            当API请求失败时，会返回标准的错误响应格式：
          </p>
          
          <DocGrid cols={2}>
            <div>
              <h3 className="text-lg font-semibold text-neon-orange mb-4">常见错误码</h3>
              <div className="space-y-3">
                {[
                  { code: '400', desc: 'Bad Request - 请求参数错误' },
                  { code: '401', desc: 'Unauthorized - 认证失败' },
                  { code: '403', desc: 'Forbidden - 权限不足' },
                  { code: '404', desc: 'Not Found - 资源不存在' },
                  { code: '422', desc: 'Validation Error - 数据验证失败' },
                  { code: '500', desc: 'Internal Server Error - 服务器内部错误' },
                ].map((error) => (
                  <div key={error.code} className="glass rounded-lg border border-dark-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-neon-red">{error.code}</span>
                      <span className="text-dark-text-tertiary text-sm">{error.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-neon-orange mb-4">错误响应格式</h3>
              <DocCodeBlock 
                code={`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "提示词名称不能为空",
    "details": {
      "field": "name",
      "rule": "required"
    }
  },
  "request_id": "req_123456789"
}`}
                language="json"
              />
            </div>
          </DocGrid>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default PromptsAPIPage;
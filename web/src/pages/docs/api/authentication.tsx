import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const AuthenticationPage: React.FC = () => {
  return (
    <DocLayout
      title="认证与授权"
      description="了解如何安全地访问 Prompt Hub API，保护您的数据和资源"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: 'API参考', href: '/docs/api' },
        { name: '认证与授权', href: '/docs/api/authentication' },
      ]}
    >
      <DocSection title="认证方式概述" delay={0.1}>
        <div className="space-y-8">
          <DocHighlight>
            Prompt Hub API 支持多种认证方式，确保您的数据安全和访问控制。
          </DocHighlight>
          
          <DocGrid cols={2}>
            <DocCard 
              title="API 密钥认证"
              description="适用于服务器端应用和自动化脚本"
              icon={<KeyIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList 
                items={[
                  { title: '简单易用', description: '直接使用密钥访问' },
                  { title: '适合后端服务', description: '服务器间安全通信' },
                  { title: '支持多种传递方式', description: '灵活的使用方式' },
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="JWT Token 认证"
              description="适用于前端应用和用户会话管理"
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              color="pink"
            >
              <DocList 
                items={[
                  { title: '安全性高', description: '加密的令牌机制' },
                  { title: '支持用户权限', description: '细粒度权限控制' },
                  { title: '自动过期机制', description: '增强安全性' },
                ]}
                className="mt-4"
              />
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      <DocSection title="API 密钥认证" delay={0.2}>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">获取 API 密钥</h3>
            <p className="text-dark-text-secondary mb-6 leading-relaxed">
              登录 Prompt Hub 后，在用户设置页面可以生成和管理您的 API 密钥。
            </p>
            <DocHighlight>
              请妥善保管您的 API 密钥，不要在客户端代码中暴露，避免提交到版本控制系统。
            </DocHighlight>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">使用方式</h3>
            <p className="text-dark-text-secondary mb-6 leading-relaxed">
              API 密钥可以通过以下三种方式传递：
            </p>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-neon-cyan mb-3">1. 请求头 (推荐)</h4>
                <DocCodeBlock 
                  code={`curl -H "x-api-key: your-api-key-here" \\
     https://api.prompthub.com/v1/prompts`}
                  language="bash"
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-neon-purple mb-3">2. Authorization 头</h4>
                <DocCodeBlock 
                  code={`curl -H "Authorization: Bearer your-api-key-here" \\
     https://api.prompthub.com/v1/prompts`}
                  language="bash"
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-neon-pink mb-3">3. 查询参数 (不推荐)</h4>
                <DocCodeBlock 
                  code={'curl "https://api.prompthub.com/v1/prompts?api_key=your-api-key-here"'}
                  language="bash"
                />
                <p className="text-dark-text-tertiary text-sm mt-3">
                  注意：查询参数方式可能会在日志中暴露密钥，仅在测试时使用。
                </p>
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="JWT Token 认证" delay={0.3}>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">获取 JWT Token</h3>
            <p className="text-dark-text-secondary mb-6 leading-relaxed">
              通过用户登录接口获取 JWT Token：
            </p>
            <DocCodeBlock 
              code={`POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

# 响应
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    },
    "expires_at": "2024-01-01T00:00:00Z"
  }
}`}
              language="json"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">使用 JWT Token</h3>
            <p className="text-dark-text-secondary mb-6 leading-relaxed">
              在请求头中包含 JWT Token：
            </p>
            <DocCodeBlock 
              code={`curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
     https://api.prompthub.com/v1/prompts`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Token 刷新</h3>
            <p className="text-dark-text-secondary mb-6 leading-relaxed">
              当 Token 即将过期时，可以使用刷新接口获取新的 Token：
            </p>
            <DocCodeBlock 
              code={`POST /auth/refresh
Authorization: Bearer your-current-token

# 响应
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}`}
              language="json"
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="权限和作用域" delay={0.4}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            不同的认证方式具有不同的权限级别：
          </p>
          
          <div className="overflow-hidden rounded-xl border border-dark-border">
            <div className="bg-dark-bg-secondary/50 p-4">
              <div className="grid grid-cols-3 gap-4 font-medium text-dark-text-primary text-sm">
                <div>操作</div>
                <div className="text-center">API 密钥</div>
                <div className="text-center">JWT Token</div>
              </div>
            </div>
            <div className="divide-y divide-dark-border">
              {[
                { action: '读取公开提示词', apiKey: true, jwt: true },
                { action: '读取私有提示词', apiKey: true, jwt: true },
                { action: '创建提示词', apiKey: true, jwt: true },
                { action: '修改提示词', apiKey: true, jwt: true },
                { action: '删除提示词', apiKey: false, jwt: true },
              ].map((permission, index) => (
                <div key={index} className="p-4 hover:bg-dark-bg-secondary/30 transition-colors">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-dark-text-secondary">{permission.action}</div>
                    <div className="text-center">
                      {permission.apiKey ? (
                        <span className="text-neon-green">✓</span>
                      ) : (
                        <span className="text-neon-red">✗</span>
                      )}
                    </div>
                    <div className="text-center">
                      {permission.jwt ? (
                        <span className="text-neon-green">✓</span>
                      ) : (
                        <span className="text-neon-red">✗</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default AuthenticationPage;
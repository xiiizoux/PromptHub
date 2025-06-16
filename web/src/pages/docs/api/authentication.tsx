import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const AuthenticationPage: React.FC = () => {
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
            <Link href="/docs/api" className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-white transition-colors group">
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回API参考
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
              认证与授权
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl">
              了解如何安全地访问 Prompt Hub API，保护您的数据和资源
            </p>
          </motion.div>

          {/* 认证方式概述 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-cyan/30 mb-8 hover:border-neon-cyan/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-6">
              认证方式概述
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Prompt Hub API 支持多种认证方式，确保您的数据安全和访问控制。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="cyber-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neon-cyan mb-3 neon-glow">🔑 API 密钥认证</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    适用于服务器端应用和自动化脚本
                  </p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-center"><span className="text-neon-green mr-2">•</span> 简单易用</li>
                    <li className="flex items-center"><span className="text-neon-green mr-2">•</span> 适合后端服务</li>
                    <li className="flex items-center"><span className="text-neon-green mr-2">•</span> 支持多种传递方式</li>
                  </ul>
                </div>
              </motion.div>
              
              <motion.div 
                className="cyber-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neon-pink mb-3 neon-glow">🛡️ JWT Token 认证</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    适用于前端应用和用户会话管理
                  </p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-center"><span className="text-neon-green mr-2">•</span> 安全性高</li>
                    <li className="flex items-center"><span className="text-neon-green mr-2">•</span> 支持用户权限</li>
                    <li className="flex items-center"><span className="text-neon-green mr-2">•</span> 自动过期机制</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* API 密钥认证 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-purple/30 mb-8 hover:border-neon-purple/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-6">
              API 密钥认证
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">获取 API 密钥</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  登录 Prompt Hub 后，在用户设置页面可以生成和管理您的 API 密钥。
                </p>
                <div className="bg-gradient-to-r from-neon-blue/20 to-neon-cyan/20 border border-neon-cyan/30 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/30 flex items-center justify-center">
                      <span className="text-neon-cyan text-sm">⚠️</span>
                    </div>
                    <div>
                      <p className="text-neon-cyan font-semibold text-sm mb-1">安全提示</p>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        请妥善保管您的 API 密钥，不要在客户端代码中暴露，避免提交到版本控制系统。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">使用方式</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  API 密钥可以通过以下三种方式传递：
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-neon-cyan mb-3">1. 请求头 (推荐)</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 overflow-hidden">
                      <div className="px-4 py-2 bg-gradient-to-r from-neon-cyan/10 to-transparent border-b border-neon-cyan/20">
                        <span className="text-neon-cyan text-sm font-mono">CURL</span>
                      </div>
                      <pre className="p-4 text-green-400 font-mono text-sm overflow-auto">
{`curl -H "x-api-key: your-api-key-here" \\
     https://api.prompthub.com/v1/prompts`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-neon-purple mb-3">2. Authorization 头</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                      <div className="px-4 py-2 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                        <span className="text-neon-purple text-sm font-mono">CURL</span>
                      </div>
                      <pre className="p-4 text-green-400 font-mono text-sm overflow-auto">
{`curl -H "Authorization: Bearer your-api-key-here" \\
     https://api.prompthub.com/v1/prompts`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-neon-pink mb-3">3. 查询参数 (不推荐)</h4>
                    <div className="bg-dark-bg-secondary rounded-xl border border-neon-pink/20 overflow-hidden">
                      <div className="px-4 py-2 bg-gradient-to-r from-neon-pink/10 to-transparent border-b border-neon-pink/20">
                        <span className="text-neon-pink text-sm font-mono">CURL</span>
                      </div>
                      <pre className="p-4 text-green-400 font-mono text-sm overflow-auto">
{`curl "https://api.prompthub.com/v1/prompts?api_key=your-api-key-here"`}
                      </pre>
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                      注意：查询参数方式可能会在日志中暴露密钥，仅在测试时使用。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* JWT Token 认证 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-pink/30 mb-8 hover:border-neon-pink/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent mb-6">
              JWT Token 认证
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">获取 JWT Token</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  通过用户登录接口获取 JWT Token：
                </p>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-green/20 overflow-hidden">
                  <div className="px-4 py-2 bg-gradient-to-r from-neon-green/10 to-transparent border-b border-neon-green/20">
                    <span className="text-neon-green text-sm font-mono">JSON</span>
                  </div>
                  <pre className="p-4 text-green-400 font-mono text-sm overflow-auto">
{`POST /auth/login
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
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">使用 JWT Token</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  在请求头中包含 JWT Token：
                </p>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 overflow-hidden">
                  <div className="px-4 py-2 bg-gradient-to-r from-neon-cyan/10 to-transparent border-b border-neon-cyan/20">
                    <span className="text-neon-cyan text-sm font-mono">CURL</span>
                  </div>
                  <pre className="p-4 text-green-400 font-mono text-sm overflow-auto">
{`curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
     https://api.prompthub.com/v1/prompts`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Token 刷新</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  当 Token 即将过期时，可以使用刷新接口获取新的 Token：
                </p>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                  <div className="px-4 py-2 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                    <span className="text-neon-purple text-sm font-mono">JSON</span>
                  </div>
                  <pre className="p-4 text-green-400 font-mono text-sm overflow-auto">
{`POST /auth/refresh
Authorization: Bearer your-current-token

# 响应
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 权限和作用域 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-green/30 mb-8 hover:border-neon-green/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-6">
              权限和作用域
            </h2>
            
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                不同的认证方式具有不同的权限级别：
              </p>
              
              <div className="overflow-hidden rounded-xl border border-neon-cyan/20">
                <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 px-6 py-3 border-b border-neon-cyan/20">
                  <div className="grid grid-cols-3 gap-4 font-semibold text-white">
                    <div>操作</div>
                    <div className="text-center">API 密钥</div>
                    <div className="text-center">JWT Token</div>
                  </div>
                </div>
                <div className="bg-dark-bg-secondary/50 backdrop-blur-sm">
                  <div className="px-6 py-3 border-b border-neon-cyan/10 hover:bg-neon-cyan/5 transition-colors">
                    <div className="grid grid-cols-3 gap-4 text-gray-300">
                      <div>读取公开提示词</div>
                      <div className="text-center text-neon-green">✓</div>
                      <div className="text-center text-neon-green">✓</div>
                    </div>
                  </div>
                  <div className="px-6 py-3 border-b border-neon-cyan/10 hover:bg-neon-cyan/5 transition-colors">
                    <div className="grid grid-cols-3 gap-4 text-gray-300">
                      <div>读取私有提示词</div>
                      <div className="text-center text-neon-green">✓</div>
                      <div className="text-center text-neon-green">✓</div>
                    </div>
                  </div>
                  <div className="px-6 py-3 border-b border-neon-cyan/10 hover:bg-neon-cyan/5 transition-colors">
                    <div className="grid grid-cols-3 gap-4 text-gray-300">
                      <div>创建提示词</div>
                      <div className="text-center text-neon-green">✓</div>
                      <div className="text-center text-neon-green">✓</div>
                    </div>
                  </div>
                  <div className="px-6 py-3 border-b border-neon-cyan/10 hover:bg-neon-cyan/5 transition-colors">
                    <div className="grid grid-cols-3 gap-4 text-gray-300">
                      <div>修改提示词</div>
                      <div className="text-center text-neon-green">✓</div>
                      <div className="text-center text-neon-green">✓</div>
                    </div>
                  </div>
                  <div className="px-6 py-3 hover:bg-neon-cyan/5 transition-colors">
                    <div className="grid grid-cols-3 gap-4 text-gray-300">
                      <div>删除提示词</div>
                      <div className="text-center text-neon-red">✗</div>
                      <div className="text-center text-neon-green">✓</div>
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

export default AuthenticationPage; 
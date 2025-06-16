import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, CommandLineIcon, CubeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const PromptsAPIPage: React.FC = () => {
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
              提示词 API
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
              全面的提示词管理API，支持创建、查询、更新和删除操作
            </p>
          </motion.div>

          {/* API概览 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-cyan/30 mb-8 hover:border-neon-cyan/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-6">
              API概览
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              提示词API提供完整的CRUD操作，支持批量处理、高级搜索和版本管理等功能。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div 
                className="cyber-card p-6 text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <MagnifyingGlassIcon className="h-8 w-8 text-neon-green mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-neon-green mb-2">查询</h3>
                <p className="text-gray-400 text-sm">搜索和获取提示词</p>
              </motion.div>
              
              <motion.div 
                className="cyber-card p-6 text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <CubeIcon className="h-8 w-8 text-neon-blue mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-neon-blue mb-2">创建</h3>
                <p className="text-gray-400 text-sm">添加新的提示词</p>
              </motion.div>
              
              <motion.div 
                className="cyber-card p-6 text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <CommandLineIcon className="h-8 w-8 text-neon-purple mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-neon-purple mb-2">更新</h3>
                <p className="text-gray-400 text-sm">修改现有提示词</p>
              </motion.div>
              
              <motion.div 
                className="cyber-card p-6 text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <CommandLineIcon className="h-8 w-8 text-neon-pink mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-neon-pink mb-2">管理</h3>
                <p className="text-gray-400 text-sm">删除和批量操作</p>
              </motion.div>
            </div>
          </motion.div>

          {/* 获取提示词列表 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-green/30 mb-8 hover:border-neon-green/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-8">
              获取提示词列表
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-neon-green/20 border border-neon-green/30 rounded-full text-sm text-neon-green font-mono">GET</span>
                <code className="text-neon-cyan font-mono">/api/prompts</code>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">查询参数</h3>
                <div className="overflow-hidden rounded-xl border border-neon-green/20">
                  <div className="bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 px-6 py-3 border-b border-neon-green/20">
                    <div className="grid grid-cols-4 gap-4 font-semibold text-white text-sm">
                      <div>参数</div>
                      <div>类型</div>
                      <div>必需</div>
                      <div>说明</div>
                    </div>
                  </div>
                  <div className="bg-dark-bg-secondary/50 backdrop-blur-sm">
                    {[
                      { name: 'page', type: 'number', required: false, desc: '页码，默认1' },
                      { name: 'limit', type: 'number', required: false, desc: '每页数量，默认20' },
                      { name: 'category', type: 'string', required: false, desc: '分类筛选' },
                      { name: 'tags', type: 'string[]', required: false, desc: '标签筛选' },
                      { name: 'search', type: 'string', required: false, desc: '搜索关键词' },
                      { name: 'is_public', type: 'boolean', required: false, desc: '是否公开' }
                    ].map((param, index) => (
                      <div key={param.name} className="px-6 py-3 border-b border-neon-green/10 hover:bg-neon-green/5 transition-colors">
                        <div className="grid grid-cols-4 gap-4 text-gray-300 text-sm">
                          <div className="font-mono text-neon-cyan">{param.name}</div>
                          <div className="text-neon-purple">{param.type}</div>
                          <div className={param.required ? 'text-neon-red' : 'text-gray-500'}>
                            {param.required ? '是' : '否'}
                          </div>
                          <div>{param.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-green/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-green/10 to-transparent border-b border-neon-green/20">
                    <span className="text-neon-green text-sm font-mono">JSON Response</span>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
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
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 获取单个提示词 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-blue/30 mb-8 hover:border-neon-blue/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-8">
              获取单个提示词
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-neon-green/20 border border-neon-green/30 rounded-full text-sm text-neon-green font-mono">GET</span>
                <code className="text-neon-cyan font-mono">/api/prompts/:id</code>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">路径参数</h3>
                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-neon-cyan">id</span>
                      <span className="text-gray-400 ml-2">提示词的唯一标识符</span>
                    </div>
                    <span className="text-neon-purple">string</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-blue/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-blue/10 to-transparent border-b border-neon-blue/20">
                    <span className="text-neon-blue text-sm font-mono">JSON Response</span>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
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
    "version": "1.2.0",
    "versions": [
      {
        "version": "1.2.0",
        "created_at": "2024-01-15T10:30:00Z",
        "changes": "优化了代码审查逻辑"
      },
      {
        "version": "1.1.0",
        "created_at": "2024-01-10T14:20:00Z",
        "changes": "添加了安全检查功能"
      }
    ]
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 创建提示词 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-purple/30 mb-8 hover:border-neon-purple/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-8">
              创建提示词
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-neon-blue/20 border border-neon-blue/30 rounded-full text-sm text-neon-blue font-mono">POST</span>
                <code className="text-neon-cyan font-mono">/api/prompts</code>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">请求体</h3>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                    <span className="text-neon-purple text-sm font-mono">JSON Request Body</span>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
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
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                    <span className="text-neon-purple text-sm font-mono">JSON Response</span>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
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
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 更新提示词 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-pink/30 mb-8 hover:border-neon-pink/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent mb-8">
              更新提示词
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-neon-yellow/20 border border-neon-yellow/30 rounded-full text-sm text-neon-yellow font-mono">PUT</span>
                <code className="text-neon-cyan font-mono">/api/prompts/:id</code>
              </div>
              
              <div className="bg-gradient-to-r from-neon-yellow/20 to-neon-orange/20 border border-neon-yellow/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-yellow/30 flex items-center justify-center">
                    <span className="text-neon-yellow text-sm">⚠️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neon-yellow mb-2">版本控制</h4>
                    <p className="text-gray-300 text-sm">
                      更新提示词会创建新版本，原版本会被保留以支持版本回退。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">请求体示例</h3>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-pink/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-pink/10 to-transparent border-b border-neon-pink/20">
                    <span className="text-neon-pink text-sm font-mono">JSON Request Body</span>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
  "description": "增强版专业邮件写作助手",
  "content": "你是一个专业的邮件写作专家，具有多年的商务沟通经验...",
  "tags": ["邮件", "写作", "商务", "AI助手"],
  "version_notes": "添加了更多邮件模板和优化了语言风格"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 删除提示词 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-red/30 mb-8 hover:border-neon-red/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-red to-neon-pink bg-clip-text text-transparent mb-8">
              删除提示词
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-neon-red/20 border border-neon-red/30 rounded-full text-sm text-neon-red font-mono">DELETE</span>
                <code className="text-neon-cyan font-mono">/api/prompts/:id</code>
              </div>
              
              <div className="bg-gradient-to-r from-neon-red/20 to-neon-pink/20 border border-neon-red/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-red/30 flex items-center justify-center">
                    <span className="text-neon-red text-sm">🚨</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neon-red mb-2">危险操作</h4>
                    <p className="text-gray-300 text-sm">
                      删除操作不可逆，请确保您有足够的权限执行此操作。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">响应示例</h3>
                <div className="bg-dark-bg-secondary rounded-xl border border-neon-red/20 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-neon-red/10 to-transparent border-b border-neon-red/20">
                    <span className="text-neon-red text-sm font-mono">JSON Response</span>
                  </div>
                  <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{`{
  "success": true,
  "message": "提示词已成功删除",
  "data": {
    "deleted_id": "prompt-789",
    "deleted_at": "2024-01-16T15:30:00Z"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 错误响应 */}
          <motion.div 
            className="glass rounded-2xl p-8 border border-neon-orange/30 mb-8 hover:border-neon-orange/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-orange to-neon-red bg-clip-text text-transparent mb-8">
              错误响应
            </h2>
            
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                当API请求失败时，会返回标准的错误响应格式：
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-neon-orange mb-4">常见错误码</h3>
                  <div className="space-y-3">
                    {[
                      { code: '400', desc: 'Bad Request - 请求参数错误' },
                      { code: '401', desc: 'Unauthorized - 认证失败' },
                      { code: '403', desc: 'Forbidden - 权限不足' },
                      { code: '404', desc: 'Not Found - 资源不存在' },
                      { code: '422', desc: 'Validation Error - 数据验证失败' },
                      { code: '500', desc: 'Internal Server Error - 服务器内部错误' }
                    ].map((error) => (
                      <div key={error.code} className="cyber-card p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-neon-red">{error.code}</span>
                          <span className="text-gray-400 text-sm">{error.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-neon-orange mb-4">错误响应格式</h3>
                  <div className="bg-dark-bg-secondary rounded-xl border border-neon-orange/20 overflow-hidden">
                    <div className="px-6 py-3 bg-gradient-to-r from-neon-orange/10 to-transparent border-b border-neon-orange/20">
                      <span className="text-neon-orange text-sm font-mono">Error Response</span>
                    </div>
                    <pre className="p-6 text-red-400 font-mono text-sm overflow-auto">
{`{
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
                    </pre>
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

export default PromptsAPIPage; 
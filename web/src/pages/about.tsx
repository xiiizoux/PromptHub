import React from 'react';
import Link from 'next/link';
import { 
  SparklesIcon, 
  RocketLaunchIcon, 
  UserGroupIcon, 
  CodeBracketIcon,
  LightBulbIcon,
  HeartIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-700 text-white">
        <div className="container-custom py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">P</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              关于 Prompt Hub
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              一个现代化的AI提示词管理平台，致力于帮助开发者和AI爱好者更好地管理、分享和优化AI提示词。
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">我们的使命</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              让AI提示词的创建、管理和分享变得简单高效，推动AI技术的普及和应用。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <SparklesIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">创新驱动</h3>
              <p className="text-gray-600">
                持续探索AI提示词的最佳实践，为用户提供最前沿的工具和功能。
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserGroupIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">社区协作</h3>
              <p className="text-gray-600">
                构建开放的社区环境，让用户能够分享经验、互相学习、共同成长。
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <RocketLaunchIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">效率提升</h3>
              <p className="text-gray-600">
                通过智能化的管理工具和性能分析，帮助用户提高AI应用的效率和质量。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">核心功能</h2>
            <p className="text-lg text-gray-600">
              Prompt Hub 提供全面的AI提示词管理解决方案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CodeBracketIcon className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">提示词管理</h3>
              <p className="text-gray-600 text-sm">
                创建、编辑、版本控制和组织您的AI提示词库
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <LightBulbIcon className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">智能优化</h3>
              <p className="text-gray-600 text-sm">
                基于使用数据和反馈的智能提示词优化建议
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <GlobeAltIcon className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">MCP集成</h3>
              <p className="text-gray-600 text-sm">
                支持Model Context Protocol，与各种AI工具无缝集成
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">安全可靠</h3>
              <p className="text-gray-600 text-sm">
                企业级安全保障，支持权限管理和数据保护
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">技术架构</h2>
            <p className="text-lg text-gray-600">
              基于现代化技术栈构建的高性能平台
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">前端技术</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-gray-700">Next.js - React框架</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-400 mr-3"></div>
                  <span className="text-gray-700">TypeScript - 类型安全</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-cyan-500 mr-3"></div>
                  <span className="text-gray-700">Tailwind CSS - 样式框架</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-gray-700">React Hook Form - 表单管理</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">后端技术</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-gray-700">Node.js - 运行环境</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-gray-700">Express.js - Web框架</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-600 mr-3"></div>
                  <span className="text-gray-700">Supabase - 数据库和认证</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500 mr-3"></div>
                  <span className="text-gray-700">MCP Protocol - AI工具集成</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source */}
      <div className="bg-white py-16">
        <div className="container-custom">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <HeartIcon className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">开源项目</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Prompt Hub 是一个开源项目，我们相信开放协作的力量。
              欢迎开发者参与贡献，共同打造更好的AI提示词管理平台。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/xiiizoux/PromptHub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                查看源码
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors"
              >
                查看文档
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">联系我们</h2>
            <p className="text-lg text-gray-600 mb-8">
              有任何问题或建议？我们很乐意听到您的声音。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">邮箱联系</h3>
                <p className="text-gray-600">
                  <a href="mailto:contact@prompthub.dev" className="text-primary-600 hover:text-primary-700">
                    contact@prompthub.dev
                  </a>
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">GitHub</h3>
                <p className="text-gray-600">
                  <a href="https://github.com/xiiizoux/PromptHub" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                    提交Issue或PR
                  </a>
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">文档</h3>
                <p className="text-gray-600">
                  <Link href="/docs" className="text-primary-600 hover:text-primary-700">
                    查看详细文档
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
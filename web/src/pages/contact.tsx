import React, { useState } from 'react';
import Link from 'next/link';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  BugAntIcon,
  LightBulbIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-screen py-16">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <HeartIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">感谢您的反馈！</h1>
            <p className="text-lg text-gray-600 mb-8">
              我们已经收到您的消息，会尽快回复您。通常我们会在24小时内回复。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="btn-primary">
                返回首页
              </Link>
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                    type: 'general'
                  });
                }}
                className="btn-secondary"
              >
                发送另一条消息
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">联系我们</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            有任何问题、建议或反馈？我们很乐意听到您的声音。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Options */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">联系方式</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-primary-600 mt-1" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">邮箱</h3>
                  <p className="text-gray-600">
                    <a href="mailto:contact@prompthub.dev" className="text-primary-600 hover:text-primary-700">
                      contact@prompthub.dev
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    我们通常在24小时内回复
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 mt-1" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">GitHub讨论</h3>
                  <p className="text-gray-600">
                    <a 
                      href="https://github.com/xiiizoux/PromptHub/discussions" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      GitHub Discussions
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    社区讨论和问答
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BugAntIcon className="h-6 w-6 text-primary-600 mt-1" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Bug报告</h3>
                  <p className="text-gray-600">
                    <a 
                      href="https://github.com/xiiizoux/PromptHub/issues" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      GitHub Issues
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    报告Bug或请求新功能
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">常见问题</h3>
              <div className="space-y-3">
                <Link href="/docs" className="flex items-center text-primary-600 hover:text-primary-700">
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  查看文档
                </Link>
                <Link href="/docs/api" className="flex items-center text-primary-600 hover:text-primary-700">
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  API参考
                </Link>
                <Link href="/docs/getting-started" className="flex items-center text-primary-600 hover:text-primary-700">
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  快速开始
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">发送消息</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="您的姓名"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    消息类型
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="general">一般咨询</option>
                    <option value="bug">Bug报告</option>
                    <option value="feature">功能请求</option>
                    <option value="support">技术支持</option>
                    <option value="partnership">合作咨询</option>
                    <option value="feedback">产品反馈</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    主题 *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="简要描述您的问题或建议"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    详细信息 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="请详细描述您的问题、建议或反馈..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    请提供尽可能详细的信息，这将帮助我们更好地理解和解决您的问题。
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        发送中...
                      </>
                    ) : (
                      <>
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        发送消息
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <LightBulbIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">贡献代码</h3>
            <p className="text-gray-600 mb-4">
              Prompt Hub 是一个开源项目，我们欢迎社区贡献！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/xiiizoux/PromptHub"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                查看源码
              </a>
              <a
                href="https://github.com/xiiizoux/PromptHub/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                贡献指南
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

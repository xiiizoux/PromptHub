import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIConfig {
  endpoint: string;
  models: {
    fullAnalysis: string;
    quickTasks: string;
  };
  hasApiKey: boolean;
  isCustomEndpoint: boolean;
}

interface HealthStatus {
  isHealthy: boolean;
  endpoint: string;
  models: { full: string; quick: string };
  error?: string;
}

export const AIConfigPanel: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  className?: string;
}> = ({ isOpen, onClose, className = '' }) => {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // 获取配置信息
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', content: '' })
      });
      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
      }
    } catch (error) {
      console.error('获取AI配置失败:', error);
    }
  };

  // 检查健康状态
  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check', content: '' })
      });
      const result = await response.json();
      if (result.success) {
        setHealthStatus(result.data);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error('健康检查失败:', error);
      setHealthStatus({
        isHealthy: false,
        endpoint: config?.endpoint || '未知',
        models: { full: '未知', quick: '未知' },
        error: '检查失败'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取配置
  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  // 获取端点类型标签
  const getEndpointLabel = (endpoint: string) => {
    if (endpoint.includes('api.openai.com')) return 'OpenAI官方';
    if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) return '本地部署';
    if (endpoint.includes('api.deepseek.com')) return 'DeepSeek';
    if (endpoint.includes('api.moonshot.cn')) return 'Moonshot';
    if (endpoint.includes('api.zhipuai.cn')) return 'GLM';
    if (endpoint.includes('11434')) return 'Ollama';
    return '自定义端点';
  };

  // 获取健康状态颜色
  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-500' : 'text-red-500';
  };

  // 获取健康状态图标
  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? '✅' : '❌';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* 配置面板 */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto ${className}`}
          >
            <div className="p-6">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">🤖 AI服务配置</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 配置信息 */}
              {config && (
                <div className="space-y-6">
                  {/* API端点信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">📡 API端点</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">服务提供商:</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          config.isCustomEndpoint 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {getEndpointLabel(config.endpoint)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">端点地址:</span>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono break-all">
                          {config.endpoint}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">API密钥:</span>
                        <span className={`text-sm ${config.hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                          {config.hasApiKey ? '✅ 已配置' : '❌ 未配置'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 模型配置 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">🤖 模型配置</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">完整分析:</span>
                        <code className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {config.models.fullAnalysis}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">快速任务:</span>
                        <code className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {config.models.quickTasks}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* 健康检查 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700">🏥 服务状态</h3>
                      <button
                        onClick={checkHealth}
                        disabled={isLoading}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? '检查中...' : '立即检查'}
                      </button>
                    </div>

                    {healthStatus && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">连接状态:</span>
                          <span className={`text-sm font-medium ${getHealthColor(healthStatus.isHealthy)}`}>
                            {getHealthIcon(healthStatus.isHealthy)} {healthStatus.isHealthy ? '正常' : '异常'}
                          </span>
                        </div>
                        {healthStatus.error && (
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <span className="text-sm text-red-700">错误: {healthStatus.error}</span>
                          </div>
                        )}
                        {lastChecked && (
                          <div className="text-xs text-gray-500">
                            最后检查: {lastChecked.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {!healthStatus && !isLoading && (
                      <div className="text-sm text-gray-500">
                        点击"立即检查"来测试API连接状态
                      </div>
                    )}
                  </div>

                  {/* 配置说明 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 配置说明</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• 支持任何OpenAI兼容的API端点</p>
                      <p>• 可以使用本地部署的大模型（如Ollama）</p>
                      <p>• 环境变量配置优先级最高</p>
                      <p>• 建议定期检查服务健康状态</p>
                    </div>
                  </div>

                  {/* 常用配置示例 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">📋 常用配置示例</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="font-medium text-gray-600">OpenAI官方:</div>
                        <code className="block bg-gray-100 p-2 rounded mt-1">
                          OPENAI_API_BASE_URL=https://api.openai.com/v1
                        </code>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">本地Ollama:</div>
                        <code className="block bg-gray-100 p-2 rounded mt-1">
                          OPENAI_API_BASE_URL=http://localhost:11434/v1
                        </code>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">DeepSeek:</div>
                        <code className="block bg-gray-100 p-2 rounded mt-1">
                          OPENAI_API_BASE_URL=https://api.deepseek.com/v1
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!config && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">加载配置信息中...</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// 配置按钮组件
export const AIConfigButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className={`inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors ${className}`}
        title="AI服务配置"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        配置
      </button>
      
      <AIConfigPanel 
        isOpen={showPanel} 
        onClose={() => setShowPanel(false)} 
      />
    </>
  );
};

export default AIConfigPanel; 
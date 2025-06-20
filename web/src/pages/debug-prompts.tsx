import React, { useState, useEffect } from 'react';
import { getPrompts } from '@/lib/api';

const DebugPromptsPage = () => {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        console.log('[Debug] 开始获取提示词...');
        
        const response = await getPrompts({ page: 1, pageSize: 5 });
        console.log('[Debug] 获取提示词响应:', response);
        
        if (response && response.data) {
          setPrompts(response.data);
          console.log('[Debug] 提示词数据:', response.data);
          
          // 检查每个提示词的ID
          response.data.forEach((prompt: any, index: number) => {
            console.log(`[Debug] 提示词 ${index + 1}:`, {
              id: prompt.id,
              name: prompt.name,
              hasId: !!prompt.id,
              idType: typeof prompt.id,
              idLength: prompt.id?.length,
              isUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prompt.id || '')
            });
          });
        } else {
          setError('获取提示词数据格式错误');
        }
      } catch (err: any) {
        console.error('[Debug] 获取提示词失败:', err);
        setError(err.message || '获取提示词失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const testPromptDetail = async (promptId: string) => {
    try {
      console.log(`[Debug] 测试获取提示词详情，ID: ${promptId}`);
      
      // 直接调用调试API
      const response = await fetch(`/api/debug/prompt-test?id=${encodeURIComponent(promptId)}`);
      const result = await response.json();
      
      console.log(`[Debug] 调试API响应:`, result);
      
      // 尝试访问提示词详情页面
      window.open(`/prompts/${promptId}`, '_blank');
    } catch (error) {
      console.error(`[Debug] 测试失败:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">错误: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">提示词调试页面</h1>
        
        <div className="space-y-4">
          {prompts.map((prompt, index) => (
            <div key={prompt.id || index} className="bg-dark-bg-secondary p-6 rounded-lg border border-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{prompt.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{prompt.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-300">
                      <span className="font-medium">ID:</span> 
                      <span className="ml-2 font-mono bg-gray-800 px-2 py-1 rounded">
                        {prompt.id || '无ID'}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      <span className="font-medium">ID类型:</span> 
                      <span className="ml-2">{typeof prompt.id}</span>
                    </div>
                    <div className="text-gray-300">
                      <span className="font-medium">ID长度:</span> 
                      <span className="ml-2">{prompt.id?.length || 0}</span>
                    </div>
                    <div className="text-gray-300">
                      <span className="font-medium">是否UUID:</span> 
                      <span className="ml-2">
                        {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prompt.id || '') ? '是' : '否'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => testPromptDetail(prompt.id)}
                    disabled={!prompt.id}
                    className="px-4 py-2 bg-neon-cyan text-dark-bg-primary rounded hover:bg-neon-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    测试详情页面
                  </button>
                  
                  <a
                    href={`/prompts/${prompt.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-neon-purple text-white rounded hover:bg-neon-purple/80 text-center"
                  >
                    直接访问
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">调试信息</h2>
          <p className="text-gray-400 text-sm">
            请检查浏览器控制台查看详细的调试信息。
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugPromptsPage;

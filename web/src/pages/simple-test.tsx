import React, { useState } from 'react';

const SimpleTestPage = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`[SimpleTest] 测试API端点: ${endpoint}`);
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log(`[SimpleTest] 响应状态: ${response.status}`);
      console.log(`[SimpleTest] 响应数据:`, data);
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });
    } catch (error) {
      console.error(`[SimpleTest] 请求失败:`, error);
      setResult({
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">API测试页面</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={() => testAPI('/api/public-prompts?page=1&pageSize=3')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-4"
          >
            测试公共提示词API
          </button>
          
          <button
            onClick={() => testAPI('/api/debug/prompt-test?id=14b9bbd5-66d3-4588-a8b2-39643122092b')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mr-4"
          >
            测试真实ID调试
          </button>

          <button
            onClick={() => testAPI('/api/prompts/14b9bbd5-66d3-4588-a8b2-39643122092b')}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 mr-4"
          >
            测试提示词详情API
          </button>
          
          <button
            onClick={() => testAPI('/api/health')}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 mr-4"
          >
            测试健康检查
          </button>
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">测试中...</p>
          </div>
        )}
        
        {result && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">测试结果</h2>
            
            {result.error ? (
              <div className="text-red-400">
                <p className="font-medium">错误:</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-green-400">
                  <p><span className="font-medium">状态码:</span> {result.status}</p>
                  <p><span className="font-medium">请求成功:</span> {result.ok ? '是' : '否'}</p>
                </div>
                
                <div>
                  <p className="font-medium text-white mb-2">响应数据:</p>
                  <pre className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-auto max-h-96">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">说明</h2>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• 这个页面用于测试基础API是否正常工作</li>
            <li>• 请检查浏览器控制台查看详细日志</li>
            <li>• 如果所有API都失败，可能是服务器问题</li>
            <li>• 如果只有特定API失败，可能是该API的问题</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleTestPage;

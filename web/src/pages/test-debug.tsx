import React, { useState, useEffect } from 'react';

export default function TestDebug() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('开始测试模板加载...');
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = '/api/templates?featured=true&limit=4';
      addLog(`发送请求到: ${url}`);
      
      const response = await fetch(url);
      addLog(`响应状态: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      addLog(`响应数据: ${JSON.stringify(result, null, 2)}`);

      if (result.data && Array.isArray(result.data)) {
        addLog(`获取到 ${result.data.length} 个模板`);
        setTemplates(result.data);
      } else {
        addLog('响应数据格式不正确');
        setTemplates([]);
      }
    } catch (error: any) {
      const errorMsg = `获取模板失败: ${error.message}`;
      addLog(errorMsg);
      setError(errorMsg);
      setTemplates([]);
    } finally {
      setLoading(false);
      addLog('模板加载完成');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">模板加载调试页面</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 状态信息 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">状态信息</h2>
            <div className="space-y-2">
              <p>加载中: {loading ? '是' : '否'}</p>
              <p>模板数量: {templates.length}</p>
              <p>错误: {error || '无'}</p>
            </div>
            
            <button
              onClick={fetchTemplates}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              重新加载
            </button>
          </div>

          {/* 日志 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">调试日志</h2>
            <div className="bg-black p-4 rounded text-sm font-mono max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">模板列表 ({templates.length}个)</h2>
          {loading ? (
            <p>加载中...</p>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded">
                  <h3 className="font-medium">{template.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    分类: {template.category_info?.display_name || template.category}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {template.content?.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">没有找到模板</p>
          )}
        </div>
      </div>
    </div>
  );
} 
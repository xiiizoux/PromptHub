import React, { useEffect, useState } from 'react';
import { getPrompts, getCategories, getTags } from '@/lib/api';

export default function ApiTest() {
  const [promptsResult, setPromptsResult] = useState<any>(null);
  const [categoriesResult, setCategoriesResult] = useState<any>(null);
  const [tagsResult, setTagsResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取所有API数据
      const promptsData = await getPrompts();
      const categoriesData = await getCategories();
      const tagsData = await getTags();
      
      setPromptsResult(promptsData);
      setCategoriesResult(categoriesData);
      setTagsResult(tagsData);
    } catch (err: any) {
      console.error('API测试失败:', err);
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时自动获取数据
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API测试页面</h1>
      
      <div className="mb-4">
        <button 
          onClick={fetchData}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          disabled={loading}
        >
          {loading ? '加载中...' : '重新获取数据'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 提示词结果 */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">提示词</h2>
          {promptsResult ? (
            <div>
              <p className="mb-2">总数: {promptsResult.total}</p>
              <p className="mb-2">页码: {promptsResult.page} / {promptsResult.totalPages}</p>
              <h3 className="font-medium mt-4 mb-2">数据:</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(promptsResult.data, null, 2)}
              </pre>
            </div>
          ) : loading ? (
            <p>加载中...</p>
          ) : (
            <p>无数据</p>
          )}
        </div>
        
        {/* 分类结果 */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">分类</h2>
          {categoriesResult ? (
            <div>
              <h3 className="font-medium mb-2">数据:</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(categoriesResult, null, 2)}
              </pre>
            </div>
          ) : loading ? (
            <p>加载中...</p>
          ) : (
            <p>无数据</p>
          )}
        </div>
        
        {/* 标签结果 */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">标签</h2>
          {tagsResult ? (
            <div>
              <h3 className="font-medium mb-2">数据:</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(tagsResult, null, 2)}
              </pre>
            </div>
          ) : loading ? (
            <p>加载中...</p>
          ) : (
            <p>无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}

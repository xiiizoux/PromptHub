import React, { useState, useEffect } from 'react';
import { getCategories, getTags } from '@/lib/api';

export default function TestCategoriesTags() {
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('开始获取分类和标签...');
        
        const categoriesData = await getCategories();
        console.log('获取到的分类:', categoriesData);
        setCategories(categoriesData);
        
        const tagsData = await getTags();
        console.log('获取到的标签:', tagsData);
        setTags(tagsData);
        
      } catch (err: any) {
        console.error('获取数据失败:', err);
        setError(err.message || '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载分类和标签...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ 加载失败</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">类别和标签测试页面</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 分类部分 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              分类 ({categories.length})
            </h2>
            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <div key={index} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md">
                    {category}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">没有找到分类</p>
            )}
          </div>

          {/* 标签部分 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              标签 ({tags.length})
            </h2>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">没有找到标签</p>
            )}
          </div>
        </div>

        {/* 原始数据显示 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">原始数据</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">分类数据:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(categories, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">标签数据:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(tags, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
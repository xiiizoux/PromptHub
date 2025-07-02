import React, { useState, useEffect } from 'react';
import { getIconComponent } from '@/utils/categoryIcons';
import { categoryService, CategoryInfo } from '@/services/categoryService';

export default function TestIcons() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getCategories('chat');
        setCategories(data);
      } catch (error) {
        console.error('加载分类失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">图标测试页面</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            
            return (
              <div key={category.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {IconComponent ? (
                      <IconComponent className="h-6 w-6 text-neon-green" />
                    ) : (
                      <span className="text-2xl">📝</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{category.name}</h3>
                    <p className="text-gray-400 text-sm">图标: {category.icon || '无'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">图标映射测试</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'currency-dollar',
              'chat-bubble-left-right', 
              'phone',
              'user-group',
              'academic-cap',
              'code-bracket',
              'paint-brush',
              'language'
            ].map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              return (
                <div key={iconName} className="flex items-center space-x-2">
                  {IconComponent ? (
                    <IconComponent className="h-5 w-5 text-neon-cyan" />
                  ) : (
                    <span>❌</span>
                  )}
                  <span className="text-gray-300 text-sm">{iconName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

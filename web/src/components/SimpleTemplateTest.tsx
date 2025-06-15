import React, { useState, useEffect } from 'react';

interface SimpleTemplateTestProps {
  onApplyTemplate: (template: string) => void;
  category?: string;
}

const SimpleTemplateTest: React.FC<SimpleTemplateTestProps> = ({ onApplyTemplate, category }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [category]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        featured: 'true',
        limit: '4'
      });
      
      if (category) {
        params.append('category', category);
      }

      console.log('正在获取模板...', `/api/templates?${params}`);
      const response = await fetch(`/api/templates?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('模板API响应:', result);

      if (result.data && Array.isArray(result.data)) {
        const formattedTemplates = result.data.map((template: any) => ({
          name: template.title,
          category: template.category_info?.display_name || template.category,
          template: template.content
        }));
        setTemplates(formattedTemplates);
        console.log('格式化后的模板:', formattedTemplates);
      } else {
        setError('API返回的数据格式不正确');
      }
    } catch (error) {
      console.error('获取模板失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      
      // 设置默认模板作为后备
      setTemplates([
        {
          name: '专业分析师',
          category: '分析',
          template: `你是一位专业的{{领域}}分析师，拥有丰富的行业经验和敏锐的洞察力。

请对以下内容进行深入分析：
{{分析对象}}

分析要求：
1. 从多个角度进行全面分析
2. 提供具体的数据和事实支撑
3. 给出可行的建议和解决方案`
        },
        {
          name: '创作助手',
          category: '创作',
          template: `你是一位富有创意的内容创作者。

创作任务：{{具体需求}}

请创作出既有创意又实用的内容。`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="text-white">正在加载模板...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="text-red-400 mb-2">加载模板失败: {error}</div>
        <button 
          onClick={fetchTemplates}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-white font-medium">快速模板 ({templates.length}个)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, index) => (
          <div
            key={index}
            className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-cyan-500 transition-all cursor-pointer"
            onClick={() => onApplyTemplate(template.template)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">{template.name}</h4>
              <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                {template.category}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              {template.template.substring(0, 100)}...
            </p>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              点击应用模板 →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleTemplateTest; 
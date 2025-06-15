import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { getCategories, getTags } from '@/lib/api';

const DirectCreatePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // 表单状态
  const [promptName, setPromptName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  
  // 加载分类和标签
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await getCategories();
        const tagsData = await getTags();
        // 直接使用字符串数组
        setCategories(categoriesData);
        setTags(tagsData);
        console.log('加载的分类:', categoriesData);
        console.log('加载的标签:', tagsData);
      } catch (error) {
        console.error('加载数据失败:', error);
        setMessage({
          text: '加载分类和标签失败',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // 直接将提示词插入到数据库
  const createPromptDirectly = async () => {
    try {
      setIsLoading(true);
      
      // 使用fetch直接调用Supabase REST API
      const response = await fetch('/api/direct-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: promptName,
          description,
          category,
          tags: selectedTags,
          messages: [
            {
              role: 'system',
              content: {
                type: 'text',
                text: content
              }
            }
          ],
          is_public: true, // 设置为公开，这样所有用户都能看到
          user_id: user?.id || null
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({
          text: '提示词创建成功！',
          type: 'success'
        });
        
        // 重置表单
        setPromptName('');
        setDescription('');
        setCategory('');
        setSelectedTags([]);
        setContent('');
      } else {
        setMessage({
          text: `创建失败: ${result.error || '未知错误'}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('创建提示词失败:', error);
      setMessage({
        text: '创建提示词失败，请稍后再试',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理标签选择
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">快速创建提示词</h1>
      
      {message && (
        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              提示词名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="输入提示词名称"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              placeholder="简短描述此提示词的用途"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      category === cat
                        ? 'bg-primary-100 text-primary-800 border border-primary-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))
              ) : (
                <span className="text-gray-500">加载分类中...</span>
              )}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="输入分类名称或从上方选择"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-100 text-primary-800 border border-primary-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))
              ) : (
                <span className="text-gray-500">加载标签中...</span>
              )}
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">已选择标签: {selectedTags.join(', ') || '无'}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              提示词内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono"
              rows={8}
              placeholder="输入提示词内容"
            />
          </div>
          
          <div className="pt-4">
            <button
              onClick={createPromptDirectly}
              disabled={isLoading || !promptName || !description || !category || !content}
              className={`px-4 py-2 rounded-md text-white ${
                isLoading || !promptName || !description || !category || !content
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {isLoading ? '创建中...' : '快速创建提示词'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(DirectCreatePage);

// 添加getServerSideProps防止静态生成
export async function getServerSideProps() {
  return {
    props: {}, // 返回空props
  };
}

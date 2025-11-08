import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugPrompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        const response = await fetch('/api/prompts?category_type=image&limit=5');
        const data = await response.json();
        
        console.log('API响应:', data);
        
        if (data.success) {
          setPrompts(data.data || []);
        } else {
          console.error('获取提示词失败:', data.error);
        }
      } catch (error) {
        console.error('请求失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompts();
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">提示词数据调试</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-2">图像类提示词数量: {prompts.length}</h2>
        </div>

        {prompts.map((prompt, index) => (
          <div key={prompt.id || index} className="border p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">{prompt.name || '未命名'}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>基本信息:</strong>
                <ul className="mt-1 space-y-1">
                  <li>ID: {prompt.id || '无'}</li>
                  <li>类型: {prompt.category_type || '无'}</li>
                  <li>分类: {prompt.category || '无'}</li>
                  <li>公开: {prompt.is_public ? '是' : '否'}</li>
                </ul>
              </div>
              
              <div>
                <strong>媒体文件:</strong>
                <ul className="mt-1 space-y-1">
                  <li>预览URL: {prompt.preview_asset_url ? '有' : '无'}</li>
                  <li>参数: {prompt.parameters ? '有' : '无'}</li>
                  <li>媒体文件数: {prompt.parameters?.media_files?.length || 0}</li>
                </ul>
              </div>
            </div>

            {prompt.preview_asset_url && (
              <div className="mt-4">
                <strong>预览图片:</strong>
                <div className="mt-2 relative w-32 h-24">
                  <Image 
                    src={prompt.preview_asset_url} 
                    alt="预览"
                    fill
                    className="object-cover rounded border"
                    onError={(e) => {
                      console.error('图片加载失败:', prompt.preview_asset_url);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('图片加载成功:', prompt.preview_asset_url);
                    }}
                  />
                  <p className="text-xs mt-1 break-all">{prompt.preview_asset_url}</p>
                </div>
              </div>
            )}

            {prompt.parameters?.media_files && (
              <div className="mt-4">
                <strong>媒体文件列表:</strong>
                <div className="mt-2 space-y-2">
                  {prompt.parameters.media_files.map((file: any, idx: number) => (
                    <div key={idx} className="text-xs bg-gray-100 p-2 rounded">
                      <p>名称: {file.name}</p>
                      <p>类型: {file.type}</p>
                      <p>大小: {file.size}</p>
                      <p className="break-all">URL: {file.url}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">完整数据</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(prompt, null, 2)}
              </pre>
            </details>
          </div>
        ))}

        {prompts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            没有找到图像类提示词
          </div>
        )}
      </div>
    </div>
  );
}
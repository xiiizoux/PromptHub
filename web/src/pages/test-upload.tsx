import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestUpload() {
  const { user, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      console.log('选择的文件:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setResult(null);

    try {
      // 获取认证token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      console.log('用户会话:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        user: session?.user?.email,
      });

      if (!session?.access_token) {
        throw new Error('用户未登录，请先登录后再上传文件');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('开始上传文件...');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      console.log('响应状态:', response.status);
      
      const responseText = await response.text();
      console.log('响应内容:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { error: '响应格式错误', raw: responseText };
      }

      setResult({
        status: response.status,
        success: response.ok,
        data,
      });

    } catch (error) {
      console.error('上传失败:', error);
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (!user) {
    return <div className="p-8">请先登录</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">文件上传测试</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            选择文件 (测试AVIF支持)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
        </div>

        {file && (
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-medium">文件信息:</h3>
            <p>名称: {file.name}</p>
            <p>类型: {file.type}</p>
            <p>大小: {file.size} bytes</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {uploading ? '上传中...' : '上传文件'}
        </button>

        {result && (
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-2">上传结果:</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const KeysTestPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">API密钥测试页面</h1>
      
      {user ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="mb-4">
            <strong>当前登录用户:</strong> {user.email}
          </p>
          <p className="mb-4">
            <strong>用户ID:</strong> {user.id}
          </p>
          <p>
            这是一个测试页面，用于确认用户身份验证工作正常。您可以使用此页面创建测试提示词并测试动态标签和分类功能。
          </p>
          <div className="mt-6">
            <a href="/create" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              创建提示词
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <p>您尚未登录。请先登录以访问此页面。</p>
          <div className="mt-4">
            <a href="/auth/login" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              登录
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeysTestPage;

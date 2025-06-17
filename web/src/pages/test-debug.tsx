import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TestDebugPage = () => {
  const { user, getToken, isAuthenticated, isLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  // 测试认证状态
  const testAuth = async () => {
    const results: any = {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.id, email: user.email } : null,
    };

    try {
      const token = await getToken();
      results.token = token ? `${token.substring(0, 20)}...` : null;
      results.tokenLength = token?.length || 0;
         } catch (error: any) {
       results.tokenError = error;
     }

    return results;
  };

  // 测试收藏夹API
  const testBookmarksAPI = async () => {
    try {
      const token = await getToken();
      if (!token) {
        return { error: '无法获取token' };
      }

      const response = await fetch('/api/user/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };

      if (response.ok) {
        const data = await response.json();
        return { ...result, data, count: data?.length || 0 };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { ...result, error: errorData };
      }
         } catch (error: any) {
       return { error: error.message };
     }
  };

  // 测试其他用户API
  const testOtherAPIs = async () => {
    const token = await getToken();
    if (!token) return { error: '无token' };

    const apis = [
      { name: 'usage-history', url: '/api/user/usage-history?pageSize=5' },
      { name: 'ratings', url: '/api/user/ratings' }
    ];

    const results: any = {};

    for (const api of apis) {
      try {
        const response = await fetch(api.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        results[api.name] = {
          status: response.status,
          ok: response.ok
        };

        if (response.ok) {
          const data = await response.json();
          results[api.name].hasData = !!data;
        }
             } catch (error: any) {
         results[api.name] = { error: error.message };
       }
    }

    return results;
  };

  // 运行所有测试
  const runAllTests = async () => {
    setTesting(true);
    
    const results = {
      timestamp: new Date().toISOString(),
      auth: await testAuth(),
      bookmarksAPI: await testBookmarksAPI(),
      otherAPIs: await testOtherAPIs()
    };

    setTestResults(results);
    setTesting(false);
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      runAllTests();
    }
  }, [isLoading, isAuthenticated]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">系统调试页面</h1>
      
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">基本信息</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">认证状态:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? '已认证' : '未认证'}
              </span>
            </div>
            <div>
              <span className="font-medium">加载状态:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {isLoading ? '加载中' : '完成'}
              </span>
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={runAllTests}
            disabled={testing || isLoading}
            className={`px-4 py-2 rounded font-medium ${
              testing || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {testing ? '测试中...' : '运行诊断测试'}
          </button>
        </div>

        {/* 测试结果 */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* 收藏夹API专项测试 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">收藏夹API状态</h2>
          {testResults.bookmarksAPI ? (
            <div className="space-y-2">
              <div className={`flex items-center ${
                testResults.bookmarksAPI.ok ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="font-medium">状态:</span>
                <span className="ml-2">
                  {testResults.bookmarksAPI.status} - {testResults.bookmarksAPI.statusText}
                </span>
              </div>
              
              {testResults.bookmarksAPI.ok && (
                <div className="text-green-600">
                  <span className="font-medium">收藏数量:</span>
                  <span className="ml-2">{testResults.bookmarksAPI.count || 0}</span>
                </div>
              )}
              
              {testResults.bookmarksAPI.error && (
                <div className="text-red-600">
                  <span className="font-medium">错误:</span>
                  <span className="ml-2">{JSON.stringify(testResults.bookmarksAPI.error)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">等待测试结果...</div>
          )}
        </div>

        {/* 解决方案建议 */}
        {testResults.bookmarksAPI && !testResults.bookmarksAPI.ok && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">解决方案建议</h2>
            <ul className="space-y-2 text-yellow-700">
              <li>• 如果是401错误：请尝试重新登录</li>
              <li>• 如果是500错误：请检查服务器日志</li>
              <li>• 如果是网络错误：请检查网络连接</li>
              <li>• 尝试清除浏览器缓存并刷新页面</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDebugPage; 
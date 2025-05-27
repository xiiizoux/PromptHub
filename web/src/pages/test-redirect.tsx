import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getRedirectUrl, buildUrlWithRedirect } from '@/lib/redirect';

export default function TestRedirectPage() {
  const router = useRouter();
  const redirectUrl = getRedirectUrl(router);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">重定向功能测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前状态</h2>
          <div className="space-y-2">
            <p><strong>当前路径:</strong> {router.asPath}</p>
            <p><strong>检测到的重定向URL:</strong> {redirectUrl || '无'}</p>
            <p><strong>查询参数:</strong> {JSON.stringify(router.query)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试链接</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 模拟未登录用户访问需要登录的页面 */}
            <div className="space-y-2">
              <h3 className="font-medium">模拟未登录访问:</h3>
              <Link 
                href="/auth/login?redirect=%2Fcreate"
                className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                登录页面 (重定向到创建页面)
              </Link>
              <Link 
                href="/auth/login?redirect=%2Fprompts%2Fcode_assistant%2Fedit"
                className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                登录页面 (重定向到编辑页面)
              </Link>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">注册页面测试:</h3>
              <Link 
                href="/auth/register?redirect=%2Fcreate"
                className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                注册页面 (重定向到创建页面)
              </Link>
              <Link 
                href="/auth/register?redirect=%2Fprompts%2Fcode_assistant%2Fedit"
                className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                注册页面 (重定向到编辑页面)
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">工具函数测试</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">buildUrlWithRedirect 测试:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                <p>buildUrlWithRedirect('/auth/login', '/create') = {buildUrlWithRedirect('/auth/login', '/create')}</p>
                <p>buildUrlWithRedirect('/auth/register', '/prompts/test/edit') = {buildUrlWithRedirect('/auth/register', '/prompts/test/edit')}</p>
                <p>buildUrlWithRedirect('/auth/login', null) = {buildUrlWithRedirect('/auth/login', null)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
} 
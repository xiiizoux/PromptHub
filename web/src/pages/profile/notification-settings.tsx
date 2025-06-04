import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import NotificationPreferences from '../../components/social/NotificationPreferences';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

const NotificationSettingsPage: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 保存成功后的回调
  const handleSaved = () => {
    // 显示保存成功消息或者进行其他操作
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">请登录后查看通知设置</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>通知设置 - PromptHub</title>
        <meta name="description" content="管理您的通知偏好设置" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">通知设置</h1>
          <p className="text-gray-600">自定义您希望接收的通知类型和方式</p>
        </div>

        <NotificationPreferences onSaved={handleSaved} />

        <div className="mt-6 mb-6">
          <Link 
            href="/notifications"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← 返回通知列表
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationSettingsPage;
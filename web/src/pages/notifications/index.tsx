import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import NotificationList from '../../components/social/NotificationList';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      className={value === index ? 'animate-fadeIn' : ''}
      {...other}
    >
      {value === index && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `notification-tab-${index}`,
    'aria-controls': `notification-tabpanel-${index}`,
    role: 'tab',
    tabIndex: 0,
  };
}

const NotificationsPage: NextPage = () => {
  const { user, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
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
            <p className="text-lg text-gray-600">请登录后查看通知</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>我的通知 - PromptHub</title>
        <meta name="description" content="查看您的最新通知" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">我的通知</h1>
          <p className="text-gray-600">查看您的最新消息和更新</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          {/* 选项卡标题 */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="通知选项卡">
              <div role="tablist" className="w-full flex">
                {['全部通知', '未读通知', '分组通知'].map((label, index) => (
                  <button
                    key={index}
                    className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      tabValue === index
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTabChange(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleTabChange(index);
                      }
                    }}
                    aria-selected={tabValue === index}
                    {...a11yProps(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
          
          {/* 选项卡内容 */}
          <TabPanel value={tabValue} index={0}>
            <NotificationList
              showHeader={false}
              key="all-notifications"
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <NotificationList
              showHeader={false}
              unreadOnly={true}
              key="unread-notifications"
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <NotificationList
              showHeader={false}
              grouped={true}
              key="grouped-notifications"
            />
          </TabPanel>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;